/**
 * 1銘柄の株価データ取得・処理API
 *
 * このエンドポイントは1銘柄のみを処理します（10秒制限対応）
 * GitHub Actionsから呼び出されます
 */

import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { getSupabaseAdminClient } from '@/lib/supabase';
import {
  calculateSMA,
  calculateRSI,
  calculateADR,
  checkPerfectOrder,
  calculateInvestmentDecision,
} from '@/lib/technical-indicators';
import { calculateAIPrediction, type TechnicalIndicators } from '@/lib/ai-prediction';

// Vercel無料プラン: 10秒制限
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // 1. 認証確認
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET が設定されていません' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }

  try {
    // 2. リクエストボディから銘柄を取得
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json({ error: 'symbol が必要です' }, { status: 400 });
    }

    console.log(`[API] 処理開始: ${symbol}`);

    const supabase = getSupabaseAdminClient();

    // 3. Yahoo Financeから株価データ取得
    const quote = await yahooFinance.quote(symbol);

    if (!quote || !(quote as any).regularMarketPrice) {
      throw new Error('株価データが取得できませんでした');
    }

    // 4. 過去データ取得（テクニカル指標計算用）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // 1年分

    const history = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    if (!history || history.length < 200) {
      throw new Error('十分な履歴データが取得できませんでした');
    }

    // 5. テクニカル指標を計算
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

    const currentPrice = (quote as any).regularMarketPrice;
    const currentVolume = (quote as any).regularMarketVolume || volumes[volumes.length - 1];
    const dollarVolume = currentPrice * currentVolume;

    // 6. 投資判断を計算
    const investmentDecision = calculateInvestmentDecision(
      currentPrice,
      ma200,
      perfectOrderBullish,
      rsi14,
      adr20,
      currentVolume,
      volumeAvg20
    );

    // 7. AI予測を計算
    const indicators: TechnicalIndicators = {
      current_price: currentPrice,
      ma_10: ma10 ?? undefined,
      ma_20: ma20 ?? undefined,
      ma_50: ma50 ?? undefined,
      ma_200: ma200 ?? undefined,
      rsi_14: rsi14 ?? 50,
      adr_20: adr20 ?? 5,
      perfect_order_bullish: perfectOrderBullish,
      volume: currentVolume,
      volume_avg_20: volumeAvg20 ?? undefined,
    };

    const aiPrediction = await calculateAIPrediction(symbol, indicators);

    // 8. Supabaseに保存
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('stock_data').upsert(
      {
        symbol,
        date: today,
        current_price: currentPrice,
        open_price: (quote as any).regularMarketOpen,
        high_price: (quote as any).regularMarketDayHigh,
        low_price: (quote as any).regularMarketDayLow,
        volume: currentVolume,
        dollar_volume: dollarVolume,
        market_cap: (quote as any).marketCap || null,
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

    const duration = Date.now() - startTime;

    console.log(`[API] 成功: ${symbol} (${duration}ms)`);

    return NextResponse.json({
      success: true,
      symbol,
      duration: `${duration}ms`,
      data: {
        price: currentPrice,
        aiScore: aiPrediction.ai_score,
        decision: investmentDecision.action,
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] エラー:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

// GETメソッド（手動テスト用）
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'このエンドポイントはPOSTメソッドのみサポートしています',
    usage: {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_CRON_SECRET',
        'Content-Type': 'application/json',
      },
      body: {
        symbol: 'AAPL',
      },
    },
  });
}
