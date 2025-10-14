/**
 * AI予測エンジン
 *
 * ルールベーススコア（70%）+ Gemini API分析（30%）を組み合わせた
 * ハイブリッドAI予測システム
 */

export interface AIPrediction {
  ai_score: number; // 0-100
  ai_confidence: number; // 0-1
  ai_prediction: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL';
  ai_reasoning: string;
}

export interface TechnicalIndicators {
  current_price: number;
  ma_10?: number;
  ma_20?: number;
  ma_50?: number;
  ma_200?: number;
  rsi_14: number;
  adr_20: number;
  perfect_order_bullish: boolean;
  volume: number;
  volume_avg_20?: number;
}

/**
 * ルールベースAI予測スコアを計算
 *
 * テクニカル指標に基づいてスコアを算出します。
 *
 * @param indicators テクニカル指標
 * @returns 0-100のスコア
 */
export function calculateRuleBasedScore(indicators: TechnicalIndicators): number {
  let score = 50; // ベーススコア

  // 1. RSI評価（25点満点）
  if (indicators.rsi_14 >= 30 && indicators.rsi_14 <= 70) {
    // 健全な範囲
    score += 15;
  } else if (indicators.rsi_14 < 30) {
    // 売られすぎ（買いチャンス）
    score += 25;
  } else if (indicators.rsi_14 > 80) {
    // 買われすぎ（危険）
    score -= 20;
  }

  // 2. パーフェクトオーダー（20点満点）
  if (indicators.perfect_order_bullish) {
    score += 20;
  }

  // 3. ADR評価（15点満点）
  if (indicators.adr_20 >= 3 && indicators.adr_20 <= 8) {
    // 適度なボラティリティ
    score += 15;
  } else if (indicators.adr_20 > 10) {
    // 高ボラティリティ（リスク高）
    score -= 10;
  }

  // 4. 移動平均との位置関係（20点満点）
  if (indicators.ma_200 && indicators.current_price > indicators.ma_200) {
    // 長期トレンド上
    score += 10;
  }
  if (indicators.ma_50 && indicators.current_price > indicators.ma_50) {
    // 中期トレンド上
    score += 5;
  }
  if (indicators.ma_20 && indicators.current_price > indicators.ma_20) {
    // 短期トレンド上
    score += 3;
  }
  if (indicators.ma_10 && indicators.current_price > indicators.ma_10) {
    // 超短期トレンド上
    score += 2;
  }

  // 5. 出来高評価（10点満点）
  if (indicators.volume_avg_20) {
    const volumeRatio = indicators.volume / indicators.volume_avg_20;
    if (volumeRatio > 1.5) {
      // 出来高急増（注目度高）
      score += 10;
    } else if (volumeRatio > 1.2) {
      score += 5;
    }
  }

  // スコアを0-100の範囲に収める
  return Math.max(0, Math.min(100, score));
}

/**
 * Gemini APIを使用した高度なAI分析
 *
 * @param symbol 銘柄コード
 * @param indicators テクニカル指標
 * @returns AI分析結果
 */
export async function analyzeWithGemini(
  symbol: string,
  indicators: TechnicalIndicators
): Promise<{ score: number; confidence: number; prediction: string; reasoning: string }> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Gemini APIキーが設定されていない場合はルールベースのみ
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY が設定されていません。ルールベース分析のみを使用します。');
    const ruleScore = calculateRuleBasedScore(indicators);
    return {
      score: ruleScore,
      confidence: 0.7,
      prediction: getPredictionFromScore(ruleScore),
      reasoning: 'ルールベース分析のみ（Gemini API未設定）',
    };
  }

  try {
    // Gemini APIを呼び出し
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `株式銘柄分析:
銘柄: ${symbol}
現在価格: $${indicators.current_price.toFixed(2)}

テクニカル指標:
- RSI(14): ${indicators.rsi_14.toFixed(2)}
- ADR(20): ${indicators.adr_20.toFixed(2)}%
- 移動平均: MA10=$${indicators.ma_10?.toFixed(2) || 'N/A'}, MA20=$${indicators.ma_20?.toFixed(2) || 'N/A'}, MA50=$${indicators.ma_50?.toFixed(2) || 'N/A'}, MA200=$${indicators.ma_200?.toFixed(2) || 'N/A'}
- パーフェクトオーダー: ${indicators.perfect_order_bullish ? 'Yes' : 'No'}
- 出来高: ${indicators.volume.toLocaleString()}
- 平均出来高(20日): ${indicators.volume_avg_20?.toLocaleString() || 'N/A'}

以下の形式でJSON出力してください（JSONのみ、他のテキストは不要）:
{
  "score": 0-100の予測スコア（数値）,
  "confidence": 0-1の信頼度（数値）,
  "prediction": "STRONG_BUY" | "BUY" | "HOLD" | "SELL" のいずれか,
  "reasoning": "判断理由（日本語、50文字以内）"
}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API エラー: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini APIからの応答が空です');
    }

    // JSONを抽出（```json ... ``` で囲まれている場合に対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini APIの応答からJSONを抽出できませんでした');
    }

    const aiAnalysis = JSON.parse(jsonMatch[0]);

    return {
      score: aiAnalysis.score,
      confidence: aiAnalysis.confidence,
      prediction: aiAnalysis.prediction,
      reasoning: aiAnalysis.reasoning,
    };
  } catch (error) {
    console.error(`Gemini API呼び出しエラー (${symbol}):`, error);

    // エラー時はルールベースにフォールバック
    const ruleScore = calculateRuleBasedScore(indicators);
    return {
      score: ruleScore,
      confidence: 0.6,
      prediction: getPredictionFromScore(ruleScore),
      reasoning: 'Gemini APIエラー、ルールベース分析を使用',
    };
  }
}

/**
 * ハイブリッドAI予測を計算
 *
 * ルールベーススコア（70%）+ Gemini分析（30%）
 *
 * @param symbol 銘柄コード
 * @param indicators テクニカル指標
 * @returns AI予測結果
 */
export async function calculateAIPrediction(
  symbol: string,
  indicators: TechnicalIndicators
): Promise<AIPrediction> {
  // 1. ルールベーススコアを計算
  const ruleBasedScore = calculateRuleBasedScore(indicators);

  // 2. Gemini API分析を実行
  const geminiAnalysis = await analyzeWithGemini(symbol, indicators);

  // 3. 統合スコアを計算（70% ルール + 30% AI）
  const finalScore = Math.round(ruleBasedScore * 0.7 + geminiAnalysis.score * 0.3);

  // 4. 最終予測を決定
  const finalPrediction = getPredictionFromScore(finalScore);

  return {
    ai_score: finalScore,
    ai_confidence: geminiAnalysis.confidence,
    ai_prediction: finalPrediction,
    ai_reasoning: geminiAnalysis.reasoning,
  };
}

/**
 * スコアから投資判断を取得
 *
 * @param score 0-100のスコア
 * @returns 投資判断
 */
function getPredictionFromScore(score: number): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' {
  if (score >= 80) return 'STRONG_BUY';
  if (score >= 60) return 'BUY';
  if (score >= 40) return 'HOLD';
  return 'SELL';
}

/**
 * バッチ処理用: 複数銘柄のAI予測を計算
 *
 * @param stocks 銘柄とテクニカル指標のリスト
 * @returns AI予測結果のリスト
 */
export async function calculateAIPredictionBatch(
  stocks: Array<{ symbol: string; indicators: TechnicalIndicators }>
): Promise<Array<{ symbol: string; prediction: AIPrediction }>> {
  const results: Array<{ symbol: string; prediction: AIPrediction }> = [];

  // Gemini APIのrate limit対策: 並列実行を制限
  const batchSize = 5; // 5件ずつ処理
  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async stock => {
        const prediction = await calculateAIPrediction(stock.symbol, stock.indicators);
        return { symbol: stock.symbol, prediction };
      })
    );

    results.push(...batchResults);

    // Rate limit対策: バッチ間で少し待機
    if (i + batchSize < stocks.length) {
      await new Promise(resolve => setTimeout(resolve, 4000)); // 4秒待機
    }
  }

  return results;
}
