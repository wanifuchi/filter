/**
 * テクニカル指標計算ユーティリティ
 * stock-lookup と screen API で共通利用
 */

// 単純移動平均（SMA）計算
export function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// RSI（相対力指数）計算
export function calculateRSI(closes: number[], period: number = 14): number | null {
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

// ADR（平均日次レンジ）計算
export function calculateADR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 20
): number | null {
  if (highs.length < period) return null;

  const ranges = highs.slice(-period).map((high, i) => {
    const low = lows[lows.length - period + i];
    const close = closes[closes.length - period + i];
    return ((high - low) / close) * 100;
  });

  return ranges.reduce((a, b) => a + b, 0) / period;
}

// パーフェクトオーダー判定（移動平均線の並び）
export function checkPerfectOrder(mas: (number | null)[]): boolean {
  const validMas = mas.filter((ma): ma is number => ma !== null);
  if (validMas.length !== mas.length) return false;

  for (let i = 0; i < validMas.length - 1; i++) {
    if (validMas[i] <= validMas[i + 1]) return false;
  }
  return true;
}

// スコア計算（テクニカル分析ロジック）
export function calculateScore(
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

// 投資判断計算
export function calculateInvestmentDecision(
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
      reasons.push('✅ 株価が200日移動平均線より上にあります - 長期的な上昇トレンドを示しており、投資家の信頼が高い状態です');
    } else {
      sellScore += 40;
      reasons.push('❌ 株価が200日移動平均線より下にあります - 長期的な下降トレンドにあり、慎重な判断が必要です');
    }
  } else {
    reasons.push('⚠️ 200日移動平均線のデータが不足しています');
  }

  // 2. パーフェクトオーダー判定（重要）
  if (perfectOrder) {
    buyScore += 25;
    reasons.push('✅ パーフェクトオーダー成立 - 短期・中期・長期の移動平均線が理想的な並び順になっており、強い上昇トレンドが続いています');
  } else {
    sellScore += 20;
    reasons.push('⚠️ パーフェクトオーダー不成立 - 移動平均線が理想的な並び順ではなく、トレンドの強さが不十分です。短期MA→中期MA→長期MAの順に並ぶのが理想です');
  }

  // 3. RSI判定
  if (rsi !== null) {
    if (rsi >= 30 && rsi <= 50) {
      buyScore += 20;
      reasons.push(`✅ RSI ${rsi.toFixed(1)} - 適正範囲内にあり、まだ上昇余地があります。買われ過ぎでもなく、売られ過ぎでもない良好な状態です`);
    } else if (rsi > 50 && rsi <= 70) {
      buyScore += 10;
      reasons.push(`⚠️ RSI ${rsi.toFixed(1)} - やや高めの水準です。買い圧力が強いですが、買われ過ぎに近づいているため注意が必要です`);
    } else if (rsi > 70) {
      sellScore += 25;
      reasons.push(`❌ RSI ${rsi.toFixed(1)} - 買われ過ぎの水準です。短期的な調整が入る可能性が高いため、新規購入は慎重に判断してください`);
    } else {
      sellScore += 15;
      reasons.push(`❌ RSI ${rsi.toFixed(1)} - 売られ過ぎの水準です。下落圧力が強く、さらなる下落リスクがあるため注意が必要です`);
    }
  }

  // 4. ADR判定（平均的な1日の値動きの幅）
  if (adr !== null) {
    if (adr >= 5 && adr <= 15) {
      buyScore += 15;
      reasons.push(`✅ ADR ${adr.toFixed(1)}% - 適度なボラティリティがあり、短期的な利益を狙いやすい環境です。値動きが活発で取引チャンスが多い状態です`);
    } else if (adr < 5) {
      reasons.push(`⚠️ ADR ${adr.toFixed(1)}% - 値動きが小さく、短期的な利益は狙いにくい状況です。長期投資向きですが、エントリータイミングは慎重に`);
    } else {
      reasons.push(`⚠️ ADR ${adr.toFixed(1)}% - ボラティリティが非常に高い状態です。大きな利益チャンスがある一方、急な損失リスクも高いため注意が必要です`);
    }
  }

  // 5. 出来高判定
  if (volume >= avgVolume) {
    buyScore += 10;
    reasons.push('✅ 出来高が平均以上 - 取引が活発で流動性が高く、希望する価格で売買しやすい状態です。市場の関心が高まっています');
  } else {
    reasons.push('⚠️ 出来高が平均以下 - 取引があまり活発ではなく、売買が成立しにくい可能性があります。大口取引には不向きかもしれません');
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
