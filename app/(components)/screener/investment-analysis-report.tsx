"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DetailedAnalysis } from "@/lib/definitions";

interface InvestmentAnalysisReportProps {
  analysis: DetailedAnalysis;
}

export function InvestmentAnalysisReport({ analysis }: InvestmentAnalysisReportProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">詳細投資分析レポート</CardTitle>
            <CardDescription className="mt-1">
              {analysis.currentSituation.symbol} の詳細な分析結果と推奨アクションを表示
            </CardDescription>
          </div>
          <Button
            variant={isExpanded ? "outline" : "default"}
            size="lg"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 font-semibold ${
              isExpanded
                ? "hover:bg-gray-100"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            }`}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-5 w-5" />
                <span>詳細を閉じる</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5" />
                <span>詳細分析を見る</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* 現在の状況 */}
          <Section title="## 現在の状況">
            <InfoRow label="銘柄" value={`${analysis.currentSituation.name} (${analysis.currentSituation.symbol})`} />
            <InfoRow label="現在価格" value={`$${analysis.currentSituation.price.toFixed(2)}`} />
            <InfoRow
              label="投資判断"
              value={`${analysis.currentSituation.decision}（信頼度: ${analysis.currentSituation.confidence}点）`}
            />
          </Section>

          {/* 良い点（買い要素） */}
          {analysis.strengths.length > 0 && (
            <Section title="### ✅ 良い点（買い要素）">
              {analysis.strengths.map((strength, index) => (
                <DetailItem
                  key={index}
                  title={strength.title}
                  description={strength.description}
                  score={strength.score}
                />
              ))}
            </Section>
          )}

          {/* 懸念点（売り/様子見要素） */}
          {analysis.concerns.length > 0 && (
            <Section title="### ⚠️ 懸念点（売り/様子見要素）">
              {analysis.concerns.map((concern, index) => (
                <DetailItem
                  key={index}
                  title={concern.title}
                  description={concern.description}
                  score={concern.score}
                />
              ))}
            </Section>
          )}

          {/* スコアリング結果 */}
          <Section title="### スコアリング結果">
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-700">買いスコア: {analysis.scoring.buyScore}点</h4>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {analysis.scoring.buyDetails.map((detail, index) => (
                    <li key={index}>- {detail}</li>
                  ))}
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-red-700">売りスコア: {analysis.scoring.sellScore}点</h4>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {analysis.scoring.sellDetails.map((detail, index) => (
                    <li key={index}>- {detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* 判断基準の説明 */}
          <Section title="### なぜこの判断なのか？">
            <div className="space-y-2 text-sm">
              <InfoRow label="BUY条件" value={analysis.decisionCriteria.buyThreshold} />
              <InfoRow label="SELL条件" value={analysis.decisionCriteria.sellThreshold} />
              <InfoRow label="実際の結果" value={analysis.decisionCriteria.actualResult} className="font-semibold" />
            </div>
          </Section>

          {/* 銘柄特性 */}
          {analysis.stockCharacteristics && (
            <Section title="### 銘柄特性">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  {analysis.stockCharacteristics.type}
                </h4>
                <ul className="space-y-2 text-sm text-yellow-900">
                  {analysis.stockCharacteristics.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          )}

          {/* 総合判断と推奨アクション */}
          <Section title="### 総合判断と推奨アクション">
            <div className="space-y-4">
              {/* まとめ */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">まとめ:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {analysis.recommendation.summary.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 保有者向け */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">保有者向け:</h4>
                <p className="text-sm text-blue-900">{analysis.recommendation.forHolders}</p>
              </div>

              {/* 新規購入検討者向け */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">新規購入検討者向け:</h4>
                <p className="text-sm text-purple-900">{analysis.recommendation.forNewBuyers}</p>
              </div>

              {/* 待機条件 */}
              {analysis.recommendation.waitingConditions.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">待機条件 / 見極めポイント:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {analysis.recommendation.waitingConditions.map((condition, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1">✓</span>
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          {/* 具体的な価格レベル */}
          {analysis.priceLevels && (
            <Section title="### 💰 具体的な価格レベル">
              <div className="space-y-4">
                {/* 保有者向け利確ポイント */}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    保有者向け: 利益確定ポイント
                  </h4>
                  <div className="space-y-3">
                    <PriceLevelItem
                      label="Target 1"
                      price={analysis.priceLevels.profitTargets.target1.price}
                      change={analysis.priceLevels.profitTargets.target1.gain}
                      changePercent={analysis.priceLevels.profitTargets.target1.gainPercent}
                      description={analysis.priceLevels.profitTargets.target1.description}
                      colorClass="text-green-700"
                    />
                    <PriceLevelItem
                      label="Target 2"
                      price={analysis.priceLevels.profitTargets.target2.price}
                      change={analysis.priceLevels.profitTargets.target2.gain}
                      changePercent={analysis.priceLevels.profitTargets.target2.gainPercent}
                      description={analysis.priceLevels.profitTargets.target2.description}
                      colorClass="text-green-700"
                    />
                    <PriceLevelItem
                      label="Target 3"
                      price={analysis.priceLevels.profitTargets.target3.price}
                      change={analysis.priceLevels.profitTargets.target3.gain}
                      changePercent={analysis.priceLevels.profitTargets.target3.gainPercent}
                      description={analysis.priceLevels.profitTargets.target3.description}
                      colorClass="text-green-700"
                    />
                  </div>

                  {/* 利確ポイント計算根拠 */}
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <h5 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1">
                      <span>📊</span>
                      計算根拠
                    </h5>
                    <ul className="text-xs text-green-900 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span><strong>ADR (Average Daily Range)</strong>を基準に利確ポイントを算出</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span><strong>Target 1</strong>: 現在価格 + (ADR × 1.5倍) - 通常の日次変動の1.5倍の上昇を想定</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span><strong>Target 2</strong>: 現在価格 + (ADR × 3.0倍) - 複数日のトレンド継続で到達可能な価格</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span><strong>Target 3</strong>: 52週高値または10%上昇 - 長期的な抵抗線として機能する価格</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>これらの価格帯で部分利確を検討することで、リスク管理とリターン最大化を両立</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* 新規購入者向けエントリーポイント */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    新規購入者向け: エントリーポイント
                  </h4>
                  <div className="space-y-3">
                    <EntryPointItem
                      label="最適エントリー"
                      price={analysis.priceLevels.entryPoints.optimal.price}
                      discount={analysis.priceLevels.entryPoints.optimal.discount}
                      discountPercent={analysis.priceLevels.entryPoints.optimal.discountPercent}
                      reason={analysis.priceLevels.entryPoints.optimal.reason}
                      colorClass="text-blue-700"
                      bgClass="bg-blue-100"
                    />
                    <EntryPointItem
                      label="許容範囲"
                      price={analysis.priceLevels.entryPoints.acceptable.price}
                      reason={analysis.priceLevels.entryPoints.acceptable.reason}
                      colorClass="text-blue-600"
                      bgClass="bg-blue-50"
                    />
                    <EntryPointItem
                      label="ストップロス"
                      price={analysis.priceLevels.entryPoints.stopLoss.price}
                      discount={analysis.priceLevels.entryPoints.stopLoss.maxLoss}
                      discountPercent={analysis.priceLevels.entryPoints.stopLoss.maxLossPercent}
                      reason={analysis.priceLevels.entryPoints.stopLoss.reason}
                      colorClass="text-red-700"
                      bgClass="bg-red-100"
                      isStopLoss
                    />
                  </div>

                  {/* エントリーポイント計算根拠 */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h5 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
                      <span>📊</span>
                      計算根拠
                    </h5>
                    <ul className="text-xs text-blue-900 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span><strong>最適エントリー (20MA)</strong>: 20日移動平均線は短期トレンドのサポートラインとして機能</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>上昇トレンド中の健全な押し目（調整）は20MAまで下がることが多い</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span><strong>許容範囲 (現在価格)</strong>: トレンドが強い場合、押し目を待たずに現在価格でエントリー可</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span><strong>ストップロス (200MA)</strong>: 200日移動平均線は長期トレンドの最終防衛ライン</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>200MAを割り込むと長期トレンドが転換する可能性が高く、損切りの目安となる</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>リスクリワード比を考慮し、ストップロスまでの距離を把握してポジションサイズを決定</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* 免責事項 */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              ⚠️ この分析はテクニカル分析に基づいた参考情報です。投資判断は自己責任で行ってください。
              市場環境の急変や予期せぬニュースにより、分析結果と異なる値動きをする可能性があります。
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ヘルパーコンポーネント
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  className = ""
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex justify-between items-center py-2 border-b border-gray-100 ${className}`}>
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

function DetailItem({
  title,
  description,
  score
}: {
  title: string;
  description: string;
  score: number;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        {score > 0 && (
          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
            +{score}点
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700">{description}</p>
    </div>
  );
}

function PriceLevelItem({
  label,
  price,
  change,
  changePercent,
  description,
  colorClass
}: {
  label: string;
  price: number;
  change: number;
  changePercent: number;
  description: string;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className={`text-lg font-bold ${colorClass}`}>
          ${price.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">利益額:</span>
        <span className={`text-sm font-semibold ${colorClass}`}>
          +${change.toFixed(2)} (+{changePercent.toFixed(1)}%)
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-2">{description}</p>
    </div>
  );
}

function EntryPointItem({
  label,
  price,
  discount,
  discountPercent,
  reason,
  colorClass,
  bgClass,
  isStopLoss = false
}: {
  label: string;
  price: number;
  discount?: number;
  discountPercent?: number;
  reason: string;
  colorClass: string;
  bgClass: string;
  isStopLoss?: boolean;
}) {
  return (
    <div className={`rounded-lg p-4 border border-gray-200 ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className={`text-lg font-bold ${colorClass}`}>
          ${price.toFixed(2)}
        </span>
      </div>
      {discount !== undefined && discountPercent !== undefined && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">
            {isStopLoss ? '最大損失:' : '割引額:'}
          </span>
          <span className={`text-sm font-semibold ${colorClass}`}>
            {isStopLoss ? '-' : ''}${Math.abs(discount).toFixed(2)}
            ({isStopLoss ? '-' : '-'}{Math.abs(discountPercent).toFixed(1)}%)
          </span>
        </div>
      )}
      <p className="text-xs text-gray-600 mt-2">{reason}</p>
    </div>
  );
}
