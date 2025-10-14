import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Database, Calculator, TrendingUp, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/screener"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            スクリーニングツールに戻る
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            このツールについて
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            米国株スクリーニングツールの分析ロジックと技術的根拠を詳しく解説します
          </p>
        </div>

        {/* データソース */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              <CardTitle>データソースと信頼性</CardTitle>
            </div>
            <CardDescription>
              世界標準の金融データプロバイダーから取得した信頼性の高いデータを使用
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Yahoo Finance API</h3>
              <p className="text-gray-700 dark:text-gray-300">
                このツールは、世界中の投資家が利用する<strong>Yahoo Finance</strong>の公式APIを使用して株価データを取得しています。
                リアルタイムで更新される正確なデータに基づいて分析を行います。
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">取得データ</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>過去1年分のヒストリカルデータ（終値、高値、安値、出来高）</li>
                <li>リアルタイム株価・時価総額</li>
                <li>52週高値・安値</li>
                <li>セクター・業種情報</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* テクニカル指標 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-green-600" />
              <CardTitle>テクニカル指標の計算方法</CardTitle>
            </div>
            <CardDescription>
              各種テクニカル指標の計算アルゴリズムを公開します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SMA */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2 text-blue-600">
                1. 単純移動平均線（SMA: Simple Moving Average）
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                指定期間の終値の平均値を計算します。トレンドの方向性を把握するために使用されます。
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-mono text-sm mb-2">
                  <strong>計算式:</strong> SMA = (過去N日の終値の合計) ÷ N
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>使用期間:</strong> 10日、20日、50日、150日、200日
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>解釈:</strong> 株価が移動平均線より上にあれば上昇トレンド、下にあれば下降トレンドと判断
                </p>
              </div>
            </div>

            {/* RSI */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2 text-green-600">
                2. RSI（Relative Strength Index: 相対力指数）
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                過去14日間の価格変動から、買われ過ぎ・売られ過ぎを判定するオシレーター系指標です。
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-mono text-sm mb-2">
                  <strong>計算式:</strong> RSI = 100 - (100 ÷ (1 + RS))
                </p>
                <p className="font-mono text-sm mb-3">
                  RS = (14日間の平均上昇幅) ÷ (14日間の平均下落幅)
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong className="text-red-500">RSI &gt; 70:</strong> 買われ過ぎ（調整の可能性）</p>
                  <p><strong className="text-green-500">RSI 30-70:</strong> 適正範囲</p>
                  <p><strong className="text-blue-500">RSI &lt; 30:</strong> 売られ過ぎ（反発の可能性）</p>
                </div>
              </div>
            </div>

            {/* ADR */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2 text-purple-600">
                3. ADR（Average Daily Range: 平均日次レンジ）
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                過去20日間の平均的な値動きの幅（ボラティリティ）を計算します。
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-mono text-sm mb-2">
                  <strong>計算式:</strong> ADR = Σ((高値 - 安値) ÷ 終値 × 100) ÷ 20日
                </p>
                <div className="space-y-1 text-sm mt-3">
                  <p><strong className="text-green-500">ADR 5-15%:</strong> 適度なボラティリティ（取引しやすい）</p>
                  <p><strong className="text-gray-500">ADR &lt; 5%:</strong> 値動きが小さい（動きにくい）</p>
                  <p><strong className="text-orange-500">ADR &gt; 15%:</strong> ボラティリティ高（リスク高）</p>
                </div>
              </div>
            </div>

            {/* Perfect Order */}
            <div>
              <h3 className="font-semibold text-lg mb-2 text-orange-600">
                4. パーフェクトオーダー
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                移動平均線が理想的な並び順になっている状態を指します。強い上昇トレンドの指標です。
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-mono text-sm mb-2">
                  <strong>判定条件:</strong> 株価 &gt; 10MA &gt; 20MA &gt; 50MA &gt; 150MA &gt; 200MA
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <strong>意味:</strong> 短期・中期・長期すべてのトレンドが上昇方向に揃っている状態。
                  機関投資家も個人投資家も買い目線で一致している可能性が高い。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* スコアリングシステム */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <CardTitle>総合評価スコアリングシステム（0-100点）</CardTitle>
            </div>
            <CardDescription>
              複数の指標を組み合わせて銘柄を客観的に評価
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="font-semibold">株価が200日移動平均線以上</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">長期上昇トレンド</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">20点</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="font-semibold">パーフェクトオーダー成立</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">全期間のトレンドが揃っている</p>
                </div>
                <span className="text-2xl font-bold text-green-600">30点</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div>
                  <p className="font-semibold">ADR 5-15%の範囲内</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">適度なボラティリティ</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">20点</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div>
                  <p className="font-semibold">RSI 30-70の範囲内</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">適正な買われ具合</p>
                </div>
                <span className="text-2xl font-bold text-orange-600">15点</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-semibold">出来高が20日平均以上</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">流動性が高い</p>
                </div>
                <span className="text-2xl font-bold text-gray-600">15点</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg">
              <p className="font-semibold mb-2">スコアの解釈</p>
              <ul className="space-y-1 text-sm">
                <li><strong>80点以上:</strong> 非常に優良な銘柄。複数の指標が好条件</li>
                <li><strong>60-80点:</strong> 良好な銘柄。いくつかの条件を満たしている</li>
                <li><strong>40-60点:</strong> 中立的な銘柄。一部条件のみ満たす</li>
                <li><strong>40点未満:</strong> 注意が必要な銘柄。多くの条件未達</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 投資判断ロジック */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              <CardTitle>投資判断アルゴリズム（BUY/HOLD/SELL）</CardTitle>
            </div>
            <CardDescription>
              客観的な基準に基づく投資判断の自動化
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3">判断スコアの計算方法</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                各テクニカル指標を評価し、<strong className="text-green-600">買いスコア</strong>と
                <strong className="text-red-600">売りスコア</strong>を別々に計算します。
              </p>
            </div>

            {/* 買いスコア */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                買いスコアの加点要素
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>✅ 株価が200MA以上</span>
                  <span className="font-semibold">+30点</span>
                </li>
                <li className="flex justify-between">
                  <span>✅ パーフェクトオーダー成立</span>
                  <span className="font-semibold">+25点</span>
                </li>
                <li className="flex justify-between">
                  <span>✅ RSI 30-50（上昇余地あり）</span>
                  <span className="font-semibold">+20点</span>
                </li>
                <li className="flex justify-between">
                  <span>✅ RSI 50-70（やや高め）</span>
                  <span className="font-semibold">+10点</span>
                </li>
                <li className="flex justify-between">
                  <span>✅ ADR 5-15%（適度）</span>
                  <span className="font-semibold">+15点</span>
                </li>
                <li className="flex justify-between">
                  <span>✅ 出来高平均以上</span>
                  <span className="font-semibold">+10点</span>
                </li>
              </ul>
            </div>

            {/* 売りスコア */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                売りスコアの加点要素
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>❌ 株価が200MA未満</span>
                  <span className="font-semibold">+40点</span>
                </li>
                <li className="flex justify-between">
                  <span>⚠️ パーフェクトオーダー不成立</span>
                  <span className="font-semibold">+20点</span>
                </li>
                <li className="flex justify-between">
                  <span>❌ RSI &gt; 70（買われ過ぎ）</span>
                  <span className="font-semibold">+25点</span>
                </li>
                <li className="flex justify-between">
                  <span>❌ RSI &lt; 30（売られ過ぎ）</span>
                  <span className="font-semibold">+15点</span>
                </li>
              </ul>
            </div>

            {/* 判定基準 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">最終判定ルール</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="px-2 py-1 bg-green-600 text-white rounded font-semibold">BUY</span>
                  <span>買いスコア ≥ 70点 <strong>かつ</strong> 売りスコア &lt; 30点</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="px-2 py-1 bg-red-600 text-white rounded font-semibold">SELL</span>
                  <span>売りスコア ≥ 40点</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="px-2 py-1 bg-gray-500 text-white rounded font-semibold">HOLD</span>
                  <span>上記以外の場合（様子見推奨）</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>重要:</strong> この判断は過去のデータに基づくテクニカル分析であり、
                将来の株価を保証するものではありません。投資判断は自己責任で行ってください。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* プリセット戦略 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6種類のプリセットスクリーニング戦略</CardTitle>
            <CardDescription>
              異なる投資スタイルに合わせた事前設定済みフィルター
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">1. 短期上昇候補</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  ADR高、流動性高、200MA以上、強いセクター
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ 200MA以上</li>
                  <li>✓ ADR 4%以上</li>
                  <li>✓ 出来高急増（1.5倍以上）</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">2. 押し目買い候補</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  10EMA近辺、21/50EMAは上、流動性高
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ 10MA乖離率 -3% ~ +0.5%</li>
                  <li>✓ 価格収縮パターン</li>
                  <li>✓ 高流動性</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">3. パーフェクトオーダー</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  10&gt;20&gt;50&gt;150&gt;200の理想的な並び
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ パーフェクトオーダー成立</li>
                  <li>✓ ADR 4%以上</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">4. 52週高値ブレイクアウト</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  新高値更新銘柄、強いモメンタム
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ 52週高値更新</li>
                  <li>✓ 出来高急増（2倍以上）</li>
                  <li>✓ RSI 50-80</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">5. 窓埋め候補</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  大きな窓開け後、サポートライン付近
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ 窓開け 3%以上</li>
                  <li>✓ 窓埋め未完了</li>
                  <li>✓ 200MA以上</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">6. 総合評価おすすめベスト10</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  全要素を総合的に評価したトップ10銘柄
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ 200MA以上</li>
                  <li>✓ ADR 2%以上</li>
                  <li>✓ RSI 30-70</li>
                  <li>✓ 高流動性</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* システムアーキテクチャ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>システムアーキテクチャと技術スタック</CardTitle>
            <CardDescription>
              最新技術による高速・安全な分析システム
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">フロントエンド</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Next.js 14</strong> - React最新フレームワーク</li>
                  <li>• <strong>TypeScript</strong> - 型安全性によるバグ削減</li>
                  <li>• <strong>Tailwind CSS</strong> - モダンなUIデザイン</li>
                  <li>• <strong>Recharts</strong> - インタラクティブなチャート</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">バックエンド</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Next.js API Routes</strong> - サーバーサイド処理</li>
                  <li>• <strong>yahoo-finance2</strong> - 株価データ取得</li>
                  <li>• <strong>並列処理</strong> - 高速スクリーニング</li>
                  <li>• <strong>リアルタイム計算</strong> - 常に最新データ</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold mb-2">セキュリティとプライバシー</h4>
              <ul className="text-sm space-y-1">
                <li>✓ ユーザーデータは一切保存しません</li>
                <li>✓ すべてのデータ取得はリアルタイム</li>
                <li>✓ オープンソースのライブラリのみ使用</li>
                <li>✓ Yahoo Finance公式APIによる信頼性</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 免責事項 */}
        <Card className="mb-6 border-yellow-300 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="text-yellow-700 dark:text-yellow-400">免責事項</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
            <p>
              このツールは教育目的で作成された株価分析システムです。
              投資判断の参考情報として提供していますが、以下の点にご注意ください：
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>過去のデータに基づく分析であり、将来の株価を保証するものではありません</li>
              <li>投資による損失について、開発者は一切の責任を負いません</li>
              <li>最終的な投資判断は、ご自身の責任で行ってください</li>
              <li>ファイナンシャルアドバイザーへの相談を推奨します</li>
            </ul>
          </CardContent>
        </Card>

        {/* フッター */}
        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>© 2025 米国株スクリーニングツール - オープンソースプロジェクト</p>
          <p className="mt-1">開発: Serena (Claude Code AI Assistant)</p>
        </div>
      </div>
    </div>
  );
}
