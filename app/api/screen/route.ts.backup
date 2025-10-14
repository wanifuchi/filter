import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { STOCK_UNIVERSE, getAllSymbols } from '@/lib/stock-universe';
import {
  calculateSMA,
  calculateRSI,
  calculateADR,
  checkPerfectOrder,
  calculateScore,
  calculateInvestmentDecision,
} from '@/lib/technical-indicators';
import { ScreeningFilters, StockWithIndicators } from '@/lib/definitions';

// プリセットIDからフィルター条件を取得
import { PRESET_STRATEGIES } from '@/lib/definitions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preset_id, filters: customFilters } = body;

    // フィルター条件の決定
    let filters: ScreeningFilters;
    if (preset_id) {
      const preset = PRESET_STRATEGIES.find(p => p.id === preset_id);
      if (!preset) {
        return NextResponse.json(
          { error: '無効なプリセットIDです' },
          { status: 400 }
        );
      }
      filters = preset.filters;
    } else if (customFilters) {
      filters = customFilters;
    } else {
      return NextResponse.json(
        { error: 'preset_id または filters を指定してください' },
        { status: 400 }
      );
    }

    // 銘柄リスト取得
    const symbols = getAllSymbols();

    console.log(`スクリーニング開始: ${symbols.length}銘柄`);

    // 並列処理で各銘柄のデータを取得（10銘柄ずつバッチ処理）
    const batchSize = 10;
    const results: StockWithIndicators[] = [];

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => fetchStockData(symbol));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });

      console.log(`処理済み: ${Math.min(i + batchSize, symbols.length)}/${symbols.length}`);
    }

    console.log(`データ取得完了: ${results.length}銘柄`);

    // フィルタリング
    const filteredResults = results.filter(stock => applyFilters(stock, filters));

    console.log(`フィルタリング後: ${filteredResults.length}銘柄`);

    // スコアでソート
    filteredResults.sort((a, b) => b.score - a.score);

    // 「総合評価おすすめベスト10」プリセットの場合は上位10件のみ
    let finalResults = filteredResults;
    if (preset_id === 'top_10_recommended') {
      finalResults = filteredResults.slice(0, 10);
    }

    return NextResponse.json({
      results: finalResults,
      total_count: finalResults.length,
      execution_time_ms: 0, // 計測は省略
    });
  } catch (error) {
    console.error('Screening error:', error);
    return NextResponse.json(
      {
        error: 'スクリーニング処理に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

// 個別銘柄データ取得
async function fetchStockData(symbol: string): Promise<any | null> {
  try {
    const quote = await yahooFinance.quote(symbol);
    const historical = await yahooFinance.historical(symbol, {
      period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      period2: new Date(),
    });

    if (historical.length < 200) {
      return null; // データ不足
    }

    const closes = historical.map(d => d.close);
    const highs = historical.map(d => d.high);
    const lows = historical.map(d => d.low);
    const volumes = historical.map(d => d.volume);

    const currentPrice = closes[closes.length - 1];
    const ma10 = calculateSMA(closes, 10);
    const ma20 = calculateSMA(closes, 20);
    const ma50 = calculateSMA(closes, 50);
    const ma150 = calculateSMA(closes, 150);
    const ma200 = calculateSMA(closes, 200);
    const rsi14 = calculateRSI(closes, 14);
    const adr20 = calculateADR(highs, lows, closes, 20);
    const avgVolume = calculateSMA(volumes, 20) || 0;

    const perfectOrderBullish = checkPerfectOrder([
      currentPrice,
      ma10,
      ma20,
      ma50,
      ma150,
      ma200,
    ]);

    const score = calculateScore(
      currentPrice,
      ma200,
      perfectOrderBullish,
      adr20,
      rsi14,
      volumes[volumes.length - 1],
      avgVolume
    );

    // STOCK_UNIVERSEから銘柄情報取得
    const stockInfo = STOCK_UNIVERSE.find(s => s.symbol === symbol);

    return {
      symbol: symbol.toUpperCase(),
      name: stockInfo?.name || quote.longName || quote.shortName || symbol,
      sector: stockInfo?.sector || (quote as any).sector || 'Unknown',
      industry: (quote as any).industry || null,
      market_cap: quote.marketCap || null,
      current_price: currentPrice,
      exchange: quote.exchange || 'NASDAQ',
      country: 'US',
      technical_indicators: {
        price: currentPrice,
        ma_10: ma10,
        ma_20: ma20,
        ma_50: ma50,
        ma_150: ma150,
        ma_200: ma200,
        rsi_14: rsi14,
        adr_20: adr20,
        vwap: null,
        volume_avg_20: avgVolume,
        week_52_high: quote.fiftyTwoWeekHigh || null,
        week_52_low: quote.fiftyTwoWeekLow || null,
        distance_ma_10: ma10 ? ((currentPrice - ma10) / ma10) * 100 : null,
        distance_ma_200: ma200 ? ((currentPrice - ma200) / ma200) * 100 : null,
        perfect_order_bullish: perfectOrderBullish,
      },
      score,
      change_1d: quote.regularMarketChangePercent || 0,
      volume_ratio: avgVolume > 0 ? volumes[volumes.length - 1] / avgVolume : 1,
      dollar_volume: currentPrice * volumes[volumes.length - 1],
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

// フィルター適用
function applyFilters(stock: any, filters: ScreeningFilters): boolean {
  const { technical, fundamental } = filters;

  // テクニカルフィルター
  if (technical) {
    // 200MA以上フィルター
    if (technical.price_above_ma?.ma_200) {
      const ma200 = stock.technical_indicators.ma_200;
      if (!ma200 || stock.current_price <= ma200) {
        return false;
      }
    }

    // ADRフィルター
    if (technical.adr_20) {
      const adr = stock.technical_indicators.adr_20;
      if (!adr) return false;
      if (technical.adr_20.min !== undefined && adr < technical.adr_20.min) return false;
      if (technical.adr_20.max !== undefined && adr > technical.adr_20.max) return false;
    }

    // パーフェクトオーダー
    if (technical.ma_alignment?.enabled && technical.ma_alignment.order === 'bullish') {
      if (!stock.technical_indicators.perfect_order_bullish) {
        return false;
      }
    }

    // パーフェクトオーダー（真偽値フィルター）
    if (technical.perfect_order_bullish === true) {
      if (!stock.technical_indicators.perfect_order_bullish) {
        return false;
      }
    }

    // RSIフィルター
    if (technical.rsi_14) {
      const rsi = stock.technical_indicators.rsi_14;
      if (!rsi) return false;
      if (technical.rsi_14.min !== undefined && rsi < technical.rsi_14.min) return false;
      if (technical.rsi_14.max !== undefined && rsi > technical.rsi_14.max) return false;
    }

    // 出来高フィルター
    if (technical.volume) {
      if (technical.volume.dollar_volume_min) {
        if (stock.dollar_volume < technical.volume.dollar_volume_min) {
          return false;
        }
      }
      if (technical.volume.volume_surge) {
        if (stock.volume_ratio < technical.volume.volume_surge) {
          return false;
        }
      }
    }
  }

  // ファンダメンタルフィルター
  if (fundamental) {
    // 価格範囲フィルター
    if (fundamental.price_range) {
      const price = stock.current_price;
      if (fundamental.price_range.min !== undefined && price < fundamental.price_range.min) {
        return false;
      }
      if (fundamental.price_range.max !== undefined && price > fundamental.price_range.max) {
        return false;
      }
    }

    // セクターフィルター
    if (fundamental.sectors && fundamental.sectors.length > 0) {
      if (!fundamental.sectors.includes(stock.sector)) {
        return false;
      }
    }

    // 時価総額フィルター
    if (fundamental.market_cap) {
      const marketCap = stock.market_cap;
      if (!marketCap) return false;
      if (fundamental.market_cap.min !== undefined && marketCap < fundamental.market_cap.min) {
        return false;
      }
      if (fundamental.market_cap.max !== undefined && marketCap > fundamental.market_cap.max) {
        return false;
      }
    }

    // 投資判断フィルター
    if (fundamental.investment_decision && fundamental.investment_decision.length > 0) {
      // 現在の出来高を計算（dollar_volumeから逆算）
      const currentVolume = stock.dollar_volume / stock.current_price;
      const avgVolume = stock.technical_indicators.volume_avg_20 || currentVolume;

      const decision = calculateInvestmentDecision(
        stock.current_price,
        stock.technical_indicators.ma_200,
        stock.technical_indicators.perfect_order_bullish,
        stock.technical_indicators.rsi_14,
        stock.technical_indicators.adr_20,
        currentVolume,
        avgVolume
      );

      if (!fundamental.investment_decision.includes(decision.action)) {
        return false;
      }
    }
  }

  return true;
}
