/**
 * Cron Job API: 全銘柄データの定期更新
 *
 * 毎日深夜2時に実行され、以下の処理を行います:
 * 1. 全銘柄リストを取得
 * 2. Yahoo Financeから株価データを取得
 * 3. テクニカル指標を計算
 * 4. AI予測スコアを計算
 * 5. Supabaseに保存
 *
 * Vercel Cron Job設定: vercel.json参照
 */

import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { getAllUSStockSymbols, saveSymbolsToSupabase } from '@/lib/get-all-symbols';
import {
  calculateSMA,
  calculateRSI,
  calculateADR,
  checkPerfectOrder,
  calculateInvestmentDecision,
} from '@/lib/technical-indicators';
import { calculateAIPrediction, type TechnicalIndicators } from '@/lib/ai-prediction';

// Vercel関数のタイムアウトを最大に設定（Pro: 300秒）
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // 1. 認証確認（Vercel Cron Jobからのみ実行可能）
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET が設定されていません' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    console.log('[Cron] データ更新開始');

    // 2. 全銘柄リストを取得
    const symbols = await getAllUSStockSymbols();
    console.log(`[Cron] ${symbols.length}銘柄を処理します`);

    // 3. 銘柄マスターをSupabaseに保存
    await saveSymbolsToSupabase(symbols);
    console.log('[Cron] 銘柄マスター保存完了');

    // 4. 各銘柄のデータを取得・更新
    const today = new Date().toISOString().split('T')[0];
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // バッチ処理（10銘柄ずつ）
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      console.log(`[Cron] バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)} 処理中...`);

      await Promise.all(
        batch.map(async symbolInfo => {
          try {
            // 株価データ取得
            const quote = await yahooFinance.quote(symbolInfo.symbol);
            if (!quote || !quote.regularMarketPrice) {
              throw new Error('株価データが取得できませんでした');
            }

            // 過去データ取得（テクニカル指標計算用）
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1); // 1年分

            const history = await yahooFinance.historical(symbolInfo.symbol, {
              period1: startDate,
              period2: endDate,
              interval: '1d',
            });

            if (!history || history.length < 200) {
              throw new Error('十分な履歴データが取得できませんでした');
            }

            // テクニカル指標を計算
            const prices = history.map(h => h.close);
            const highs = history.map(h => h.high);
            const lows = history.map(h => h.low);
            const volumes = history.map(h => h.volume);

            const ma10 = calculateSMA(prices, 10);
            const ma20 = calculateSMA(prices, 20);
            const ma50 = calculateSMA(prices, 50);
            const ma200 = calculateSMA(prices, 200);
            const rsi14 = calculateRSI(prices, 14);
            const adr20 = calculateADR(
              highs.slice(-20),
              lows.slice(-20),
              prices.slice(-20),
              20
            );
            const volumeAvg20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

            const perfectOrderBullish = checkPerfectOrder([ma10, ma20, ma50, ma200]);

            const currentPrice = quote.regularMarketPrice;
            const currentVolume = quote.regularMarketVolume || volumes[volumes.length - 1];
            const dollarVolume = currentPrice * currentVolume;

            // 投資判断を計算
            const investmentDecision = calculateInvestmentDecision(
              currentPrice,
              ma200,
              perfectOrderBullish,
              rsi14,
              adr20,
              currentVolume,
              volumeAvg20
            );

            // AI予測を計算
            const indicators: TechnicalIndicators = {
              current_price: currentPrice,
              ma_10: ma10 ?? undefined,
              ma_20: ma20 ?? undefined,
              ma_50: ma50 ?? undefined,
              ma_200: ma200 ?? undefined,
              rsi_14: rsi14 ?? 50, // RSIは必須なのでデフォルト50
              adr_20: adr20 ?? 5, // ADRも必須なのでデフォルト5
              perfect_order_bullish: perfectOrderBullish,
              volume: currentVolume,
              volume_avg_20: volumeAvg20 ?? undefined,
            };

            const aiPrediction = await calculateAIPrediction(symbolInfo.symbol, indicators);

            // Supabaseに保存
            const { error } = await supabase.from('stock_data').upsert(
              {
                symbol: symbolInfo.symbol,
                date: today,
                current_price: currentPrice,
                open_price: quote.regularMarketOpen,
                high_price: quote.regularMarketDayHigh,
                low_price: quote.regularMarketDayLow,
                volume: currentVolume,
                dollar_volume: dollarVolume,
                ma_10: ma10,
                ma_20: ma20,
                ma_50: ma50,
                ma_200: ma200,
                rsi_14: rsi14,
                adr_20: adr20,
                volume_avg_20: volumeAvg20,
                perfect_order_bullish: perfectOrderBullish,
                ai_score: aiPrediction.ai_score,
                ai_confidence: aiPrediction.ai_confidence,
                ai_prediction: aiPrediction.ai_prediction,
                ai_reasoning: aiPrediction.ai_reasoning,
                investment_decision: investmentDecision.action,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'symbol,date' }
            );

            if (error) {
              throw error;
            }

            results.success++;
          } catch (error: any) {
            console.error(`[Cron] ${symbolInfo.symbol} エラー:`, error.message);
            results.failed++;
            results.errors.push(`${symbolInfo.symbol}: ${error.message}`);
          }
        })
      );

      // Rate limit対策: バッチ間で待機
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒待機
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[Cron] データ更新完了: ${results.success}件成功, ${results.failed}件失敗, ${duration}秒`);

    return NextResponse.json({
      success: true,
      processed: symbols.length,
      succeeded: results.success,
      failed: results.failed,
      duration: `${duration}秒`,
      errors: results.errors.slice(0, 10), // 最初の10件のエラーのみ返す
    });
  } catch (error: any) {
    console.error('[Cron] データ更新エラー:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
