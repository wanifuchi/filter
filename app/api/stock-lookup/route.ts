import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { PriceLevels } from '@/lib/definitions';

// テクニカル指標計算関数
function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;

  const changes = closes.slice(1).map((price, i) => price - closes[i]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateADR(highs: number[], lows: number[], closes: number[], period: number = 20): number | null {
  if (highs.length < period) return null;

  const ranges = highs.slice(-period).map((high, i) => {
    const low = lows[lows.length - period + i];
    const close = closes[closes.length - period + i];
    return ((high - low) / close) * 100;
  });

  return ranges.reduce((a, b) => a + b, 0) / period;
}

function checkPerfectOrder(mas: (number | null)[]): boolean {
  const validMas = mas.filter((ma): ma is number => ma !== null);
  if (validMas.length !== mas.length) return false;

  for (let i = 0; i < validMas.length - 1; i++) {
    if (validMas[i] <= validMas[i + 1]) return false;
  }
  return true;
}

function calculateScore(
  price: number,
  ma200: number | null,
  perfectOrder: boolean,
  adr: number | null,
  rsi: number | null,
  volume: number,
  avgVolume: number
): number {
  let score = 0;

  // 200MA以上（20点）
  if (ma200 && price > ma200) score += 20;

  // パーフェクトオーダー（30点）
  if (perfectOrder) score += 30;

  // ADR（5-15%）（20点）
  if (adr) {
    if (adr >= 5 && adr <= 15) score += 20;
    else if ((adr >= 3 && adr < 5) || (adr > 15 && adr <= 20)) score += 10;
  }

  // RSI（30-70）（15点）
  if (rsi) {
    if (rsi >= 30 && rsi <= 70) score += 15;
    else if ((rsi >= 20 && rsi < 30) || (rsi > 70 && rsi <= 80)) score += 8;
  }

  // 出来高が平均以上（15点）
  if (volume >= avgVolume) score += 15;

  return score;
}

// 価格レベル計算関数
function calculatePriceLevels(
  price: number,
  ma20: number | null,
  ma200: number | null,
  adr: number | null,
  week52High: number | null,
  action: 'BUY' | 'HOLD' | 'SELL'
): PriceLevels | null {
  // BUY判定の場合のみ計算
  if (action !== 'BUY') return null;

  // ADRがない場合は現在価格の3%を使用
  const effectiveAdr = adr || (price * 0.03);

  // 保有者向け利確ポイント
  const target1Price = price + (effectiveAdr * 1.5);
  const target2Price = price + (effectiveAdr * 3.0);
  const target3Price = week52High || (price * 1.10);

  // 新規購入者向けエントリーポイント
  const optimalEntry = ma20 || (price * 0.98);
  const acceptableEntry = price;
  const stopLossPrice = ma200 || (price * 0.93);

  return {
    profitTargets: {
      target1: {
        price: target1Price,
        gain: target1Price - price,
        gainPercent: ((target1Price - price) / price) * 100,
        description: '短期目標（1-3日程度）',
      },
      target2: {
        price: target2Price,
        gain: target2Price - price,
        gainPercent: ((target2Price - price) / price) * 100,
        description: '中期目標（1-2週間程度）',
      },
      target3: {
        price: target3Price,
        gain: target3Price - price,
        gainPercent: ((target3Price - price) / price) * 100,
        description: '長期目標（52週高値または10%上昇）',
      },
    },
    entryPoints: {
      optimal: {
        price: optimalEntry,
        reason: '20日移動平均線付近での押し目買い',
        discount: price - optimalEntry,
        discountPercent: ((price - optimalEntry) / price) * 100,
      },
      acceptable: {
        price: acceptableEntry,
        reason: '現在の市場価格（トレンド継続時）',
      },
      stopLoss: {
        price: stopLossPrice,
        reason: '200日移動平均線（長期トレンド転換点）',
        maxLoss: price - stopLossPrice,
        maxLossPercent: ((price - stopLossPrice) / price) * 100,
      },
    },
  };
}

function calculateInvestmentDecision(
  price: number,
  ma200: number | null,
  perfectOrder: boolean,
  rsi: number | null,
  adr: number | null,
  volume: number,
  avgVolume: number
): { action: 'BUY' | 'HOLD' | 'SELL', confidence: number, reasons: string[] } {
  const reasons: string[] = [];
  let buyScore = 0;
  let sellScore = 0;

  // 1. 200MA判定（最重要）
  if (ma200) {
    if (price > ma200) {
      buyScore += 30;
      reasons.push('✅ 価格が200MA以上（長期上昇トレンド）');
    } else {
      sellScore += 40;
      reasons.push('❌ 価格が200MA未満（下降トレンド）');
    }
  } else {
    reasons.push('⚠️ 200MAデータ不足');
  }

  // 2. パーフェクトオーダー判定（重要）
  if (perfectOrder) {
    buyScore += 25;
    reasons.push('✅ パーフェクトオーダー成立（強い上昇）');
  } else {
    sellScore += 20;
    reasons.push('⚠️ パーフェクトオーダー不成立');
  }

  // 3. RSI判定
  if (rsi !== null) {
    if (rsi >= 30 && rsi <= 50) {
      buyScore += 20;
      reasons.push(`✅ RSI適正範囲 (${rsi.toFixed(1)}) - 上昇余地あり`);
    } else if (rsi > 50 && rsi <= 70) {
      buyScore += 10;
      reasons.push(`⚠️ RSI高め (${rsi.toFixed(1)}) - 注意`);
    } else if (rsi > 70) {
      sellScore += 25;
      reasons.push(`❌ RSI買われ過ぎ (${rsi.toFixed(1)})`);
    } else {
      sellScore += 15;
      reasons.push(`❌ RSI売られ過ぎ (${rsi.toFixed(1)})`);
    }
  }

  // 4. ADR判定
  if (adr !== null) {
    if (adr >= 5 && adr <= 15) {
      buyScore += 15;
      reasons.push(`✅ ADR適正範囲 (${adr.toFixed(1)}%) - 動きやすい`);
    } else if (adr < 5) {
      reasons.push(`⚠️ ADR低い (${adr.toFixed(1)}%) - 動きにくい`);
    } else {
      reasons.push(`⚠️ ADR高い (${adr.toFixed(1)}%) - ボラティリティ高`);
    }
  }

  // 5. 出来高判定
  if (volume >= avgVolume) {
    buyScore += 10;
    reasons.push('✅ 出来高平均以上（流動性高）');
  } else {
    reasons.push('⚠️ 出来高平均以下（流動性低）');
  }

  // 判断決定
  if (buyScore >= 70 && sellScore < 30) {
    return { action: 'BUY', confidence: buyScore, reasons };
  } else if (sellScore >= 40) {
    return { action: 'SELL', confidence: sellScore, reasons };
  } else {
    return { action: 'HOLD', confidence: Math.max(buyScore, 50), reasons };
  }
}

function generateDetailedAnalysis(
  symbol: string,
  name: string,
  price: number,
  ma20: number | null,
  ma200: number | null,
  perfectOrder: boolean,
  rsi: number | null,
  adr: number | null,
  volume: number,
  avgVolume: number,
  week52High: number | null,
  investmentDecision: { action: 'BUY' | 'HOLD' | 'SELL', confidence: number, reasons: string[] }
): any {
  const { action, confidence } = investmentDecision;

  // 買い要素の詳細分析
  const strengths: Array<{ title: string; description: string; score: number }> = [];
  const concerns: Array<{ title: string; description: string; score: number }> = [];

  let buyScore = 0;
  const buyDetails: string[] = [];
  let sellScore = 0;
  const sellDetails: string[] = [];

  // 1. 200MA分析
  if (ma200) {
    const priceVsMa200Pct = ((price - ma200) / ma200) * 100;
    if (price > ma200) {
      buyScore += 30;
      buyDetails.push('200MA以上: +30点');
      strengths.push({
        title: '200MA以上（長期上昇トレンド）',
        description: `現在価格: $${price.toFixed(2)} | 200MA: $${ma200.toFixed(2)} | 上昇率: +${priceVsMa200Pct.toFixed(1)}%`,
        score: 30,
      });
    } else {
      sellScore += 40;
      sellDetails.push('200MA未満: +40点');
      concerns.push({
        title: '価格が200MA未満（下降トレンド）',
        description: `現在価格: $${price.toFixed(2)} | 200MA: $${ma200.toFixed(2)} | 下落率: ${priceVsMa200Pct.toFixed(1)}%`,
        score: 40,
      });
    }
  } else {
    concerns.push({
      title: '200MAデータ不足',
      description: '十分な履歴データがないため、長期トレンドの判定ができません',
      score: 0,
    });
  }

  // 2. パーフェクトオーダー分析
  if (perfectOrder) {
    buyScore += 25;
    buyDetails.push('パーフェクトオーダー成立: +25点');
    strengths.push({
      title: 'パーフェクトオーダー成立（強い上昇）',
      description: '10>20>50>150>200の理想的な移動平均線の並び。短期・中期・長期すべてのトレンドが上昇方向に揃っています',
      score: 25,
    });
  } else {
    sellScore += 20;
    sellDetails.push('パーフェクトオーダー不成立: +20点');
    concerns.push({
      title: 'パーフェクトオーダー不成立',
      description: '移動平均線の並びが理想的ではなく、中期的なトレンドが不安定です',
      score: 20,
    });
  }

  // 3. RSI分析
  if (rsi !== null) {
    if (rsi >= 30 && rsi <= 50) {
      buyScore += 20;
      buyDetails.push(`RSI適正範囲 (${rsi.toFixed(1)}): +20点`);
      strengths.push({
        title: `RSI適正範囲 (${rsi.toFixed(1)}) - 上昇余地あり`,
        description: '理想的なRSI範囲（30-50）にあり、買われ過ぎでもなく、上昇する余地があります',
        score: 20,
      });
    } else if (rsi > 50 && rsi <= 70) {
      buyScore += 10;
      buyDetails.push(`RSI高め (${rsi.toFixed(1)}): +10点`);
      concerns.push({
        title: `RSI高め (${rsi.toFixed(1)}) - 注意`,
        description: 'RSIがやや高めで、短期的には上昇余地が限定的。調整の可能性に注意',
        score: 10,
      });
    } else if (rsi > 70) {
      sellScore += 25;
      sellDetails.push(`RSI買われ過ぎ (${rsi.toFixed(1)}): +25点`);
      concerns.push({
        title: `RSI買われ過ぎ (${rsi.toFixed(1)})`,
        description: 'RSIが70以上で買われ過ぎゾーン。短期的な調整や利益確定売りのリスクが高い',
        score: 25,
      });
    } else {
      sellScore += 15;
      sellDetails.push(`RSI売られ過ぎ (${rsi.toFixed(1)}): +15点`);
      concerns.push({
        title: `RSI売られ過ぎ (${rsi.toFixed(1)})`,
        description: 'RSIが30未満で売られ過ぎゾーン。反発の可能性もあるが、下降トレンドの可能性も',
        score: 15,
      });
    }
  }

  // 4. ADR分析
  if (adr !== null) {
    if (adr >= 5 && adr <= 15) {
      buyScore += 15;
      buyDetails.push(`ADR適正範囲 (${adr.toFixed(1)}%): +15点`);
      strengths.push({
        title: `ADR適正範囲 (${adr.toFixed(1)}%) - 動きやすい`,
        description: 'ボラティリティが適度で、トレードしやすい値動き。極端な変動リスクが低い',
        score: 15,
      });
    } else if (adr < 5) {
      concerns.push({
        title: `ADR低い (${adr.toFixed(1)}%) - 動きにくい`,
        description: 'ボラティリティが低く、大きな値動きが期待しにくい状態',
        score: 0,
      });
    } else {
      concerns.push({
        title: `ADR高い (${adr.toFixed(1)}%) - ボラティリティ高`,
        description: 'ボラティリティが高く、大きな値動きがある。リスク許容度が必要',
        score: 0,
      });
    }
  }

  // 5. 出来高分析
  const volumeRatio = avgVolume > 0 ? volume / avgVolume : 0;
  if (volume >= avgVolume) {
    buyScore += 10;
    buyDetails.push('出来高平均以上: +10点');
    strengths.push({
      title: '出来高平均以上（流動性高）',
      description: `出来高比率: ${volumeRatio.toFixed(2)}倍。活発な取引で流動性が高く、売買しやすい状態`,
      score: 10,
    });
  } else {
    concerns.push({
      title: '出来高平均以下（流動性低）',
      description: `出来高比率: ${volumeRatio.toFixed(2)}倍。取引が低調で、買い圧力が弱い可能性`,
      score: 0,
    });
  }

  // 銘柄特性の判定
  let stockCharacteristics: any = undefined;

  // ETF・レバレッジ判定
  const etfKeywords = ['ETF', 'SPDR', 'iShares', 'Vanguard', 'Direxion', 'ProShares', '3X', '2X', 'Bull', 'Bear'];
  const isETF = etfKeywords.some(keyword => name.includes(keyword));
  const isLeveraged = name.includes('3X') || name.includes('2X') || name.includes('Bull') || name.includes('Bear');

  if (isETF || isLeveraged) {
    const warnings: string[] = [];
    let type = 'ETF';

    if (isLeveraged) {
      type = 'レバレッジETF';
      warnings.push('1日の値動きが±10-20%にも及ぶ高ボラティリティ商品');
      warnings.push('長期保有には向かず、短期トレード向き');
      warnings.push('減価リスク（時間経過による価値減少）に注意');
    }

    if (name.includes('Semiconductor') || name.includes('SOX')) {
      warnings.push('半導体セクター特化型。セクター全体の影響を強く受ける');
    }

    stockCharacteristics = {
      type,
      warnings: warnings.length > 0 ? warnings : ['通常のETFです。分散投資効果があります'],
    };
  }

  // 推奨アクション生成
  const summary: string[] = [];
  let forHolders = '';
  let forNewBuyers = '';
  const waitingConditions: string[] = [];

  if (action === 'BUY') {
    summary.push('長期トレンドが良好で、テクニカル指標も買いシグナルを示しています');
    summary.push('複数の指標が上昇を示唆しており、エントリーに適した状態です');
    forHolders = '保有継続を推奨。トレンドが継続する限り上昇が期待できます';
    forNewBuyers = '新規エントリー推奨。適切なストップロス（200MA付近）を設定してエントリー';
    waitingConditions.push('RSIが70以上になったら利益確定を検討');
    waitingConditions.push('200MA割れで損切り検討');
  } else if (action === 'SELL') {
    summary.push('複数のネガティブシグナルが出ており、リスクが高い状態です');
    summary.push('下降トレンドまたは調整局面の可能性が高い');
    forHolders = '保有中の場合は売却または損切りを検討。リスク管理を優先';
    forNewBuyers = '新規エントリーは非推奨。トレンド転換のシグナルを待つべき';
    waitingConditions.push('200MA以上に回復するまで待機');
    waitingConditions.push('パーフェクトオーダー成立を確認');
  } else {
    summary.push('長期トレンドは良好ですが、中期的な勢いが弱い状態');
    summary.push('明確なエントリーシグナルが出るまで様子見が賢明');
    forHolders = '既に保有している場合は様子見（HOLD）。急いで売る必要はないが、積極的な買い増しも控える';
    forNewBuyers = '新規購入は待機。以下の条件が揃うまで様子を見ることを推奨';
    waitingConditions.push('パーフェクトオーダー成立');
    waitingConditions.push('RSI 30-50の範囲に入る');
    waitingConditions.push('出来高が平均以上に回復');
  }

  // 価格レベル計算（BUY判定の場合のみ）
  const priceLevels = calculatePriceLevels(price, ma20, ma200, adr, week52High, action);

  return {
    currentSituation: {
      symbol,
      name,
      price,
      decision: action,
      confidence,
    },
    strengths,
    concerns,
    scoring: {
      buyScore,
      buyDetails,
      sellScore,
      sellDetails,
    },
    decisionCriteria: {
      buyThreshold: 'buyScore >= 70 AND sellScore < 30',
      sellThreshold: 'sellScore >= 40',
      actualResult: `buyScore: ${buyScore}, sellScore: ${sellScore} → ${action}`,
    },
    stockCharacteristics,
    priceLevels,
    recommendation: {
      summary,
      forHolders,
      forNewBuyers,
      waitingConditions,
    },
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'ティッカーシンボルを指定してください' },
      { status: 400 }
    );
  }

  try {
    // Yahoo Financeから株価データ取得
    const quote = await yahooFinance.quote(symbol);

    // 過去1年分のヒストリカルデータ取得
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });

    if (!historical || historical.length === 0) {
      throw new Error('ヒストリカルデータが取得できませんでした');
    }

    // データ配列を準備
    const closes = historical.map(d => d.close);
    const highs = historical.map(d => d.high);
    const lows = historical.map(d => d.low);
    const volumes = historical.map(d => d.volume);

    // テクニカル指標計算
    const ma10 = calculateSMA(closes, 10);
    const ma20 = calculateSMA(closes, 20);
    const ma50 = calculateSMA(closes, 50);
    const ma150 = calculateSMA(closes, 150);
    const ma200 = calculateSMA(closes, 200);
    const rsi14 = calculateRSI(closes, 14);
    const adr20 = calculateADR(highs, lows, closes, 20);

    const perfectOrderBullish = checkPerfectOrder([ma10, ma20, ma50, ma150, ma200]);

    const currentPrice = quote.regularMarketPrice || closes[closes.length - 1];
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    // スコア計算
    const score = calculateScore(
      currentPrice,
      ma200,
      perfectOrderBullish,
      adr20,
      rsi14,
      volumes[volumes.length - 1],
      avgVolume
    );

    // 投資判断計算
    const investmentDecision = calculateInvestmentDecision(
      currentPrice,
      ma200,
      perfectOrderBullish,
      rsi14,
      adr20,
      volumes[volumes.length - 1],
      avgVolume
    );

    // 詳細分析生成
    const detailedAnalysis = generateDetailedAnalysis(
      symbol.toUpperCase(),
      quote.longName || quote.shortName || symbol,
      currentPrice,
      ma20,
      ma200,
      perfectOrderBullish,
      rsi14,
      adr20,
      volumes[volumes.length - 1],
      avgVolume,
      quote.fiftyTwoWeekHigh || null,
      investmentDecision
    );

    // レスポンスデータ構築
    const stockData = {
      symbol: symbol.toUpperCase(),
      name: quote.longName || quote.shortName || symbol,
      sector: (quote as any).sector || null,
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
      investment_decision: investmentDecision,
      detailed_analysis: detailedAnalysis,
      historical_data: historical.slice(-90).map(d => ({
        date: d.date.toISOString().split('T')[0],
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
        ma_10: null as number | null | undefined,
        ma_20: null as number | null | undefined,
        ma_50: null as number | null | undefined,
        ma_200: null as number | null | undefined,
      }))
    };

    // ヒストリカルデータに移動平均を追加
    for (let i = 0; i < stockData.historical_data.length; i++) {
      const idx = historical.length - 90 + i;
      if (idx >= 0) {
        const closesSlice = closes.slice(0, idx + 1);
        stockData.historical_data[i].ma_10 = calculateSMA(closesSlice, 10) as number | null;
        stockData.historical_data[i].ma_20 = calculateSMA(closesSlice, 20) as number | null;
        stockData.historical_data[i].ma_50 = calculateSMA(closesSlice, 50) as number | null;
        stockData.historical_data[i].ma_200 = calculateSMA(closesSlice, 200) as number | null;
      }
    }

    return NextResponse.json(stockData);
  } catch (error) {
    console.error('Stock lookup error:', error);
    return NextResponse.json(
      {
        error: '銘柄データの取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}
