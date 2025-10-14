# 米国株スクリーニングツール - US Stock Screener

すなっちゃん投資手法に基づいた、米国株式市場の銘柄スクリーニングツール

## 主な機能

### 🔍 個別銘柄検索（メイン機能）
- ティッカーシンボルで全米8,000+銘柄を検索可能
- リアルタイムでYahoo Finance APIからデータ取得
- テクニカル指標自動計算とスコアリング
- 価格チャート・移動平均線・出来高の可視化

### 📊 プリセットスクリーニング（補助機能）
- 5種類の戦略プリセット
- サンプルデータによる即座のフィルタリング
- テクニカル指標による多角的分析

## 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Hooks
- **Deployment**: Vercel

### バックエンド
- **Runtime**: Next.js API Routes + Python Serverless Functions
- **データ処理**: Python (FastAPI)
- **株価データ**: Yahoo Finance API (yfinance)
- **Database**: Vercel Postgres (予定)
- **Cache**: Vercel KV (Redis) (予定)

## プロジェクト構造

```
/
├── api/                          # Python Serverless Functions
│   ├── screen.py                 # スクリーニングAPIエンドポイント
│   └── utils/
│       ├── yfinance_wrapper.py   # Yahoo Finance統合
│       └── technical_indicators.py # テクニカル指標計算
├── app/
│   ├── (components)/
│   │   └── screener/
│   │       ├── stock-data-table.tsx      # 結果表示テーブル
│   │       └── preset-selector.tsx       # プリセット選択
│   ├── screener/
│   │   └── page.tsx              # スクリーナーメイン画面
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # ホーム（/screenerへリダイレクト）
├── components/
│   └── ui/                       # shadcn/uiコンポーネント
│       ├── button.tsx
│       └── table.tsx
├── lib/
│   ├── definitions.ts            # TypeScript型定義
│   └── utils.ts                  # ユーティリティ関数
├── next.config.mjs
├── package.json
├── requirements.txt              # Python依存パッケージ
├── tailwind.config.ts
└── tsconfig.json
```

## 開発状況

### Phase 1: MVP - 完了 ✅

#### 完了機能 ✅
- [x] Next.js 14プロジェクト初期化 (App Router, TypeScript, Tailwind CSS)
- [x] shadcn/ui セットアップ (Button, Table, Tabs, Card, Input)
- [x] Python Serverless Functions環境構築
- [x] Yahoo Finance API統合 (`yfinance_wrapper.py`)
- [x] テクニカル指標計算エンジン実装
  - 移動平均線 (10, 20, 50, 150, 200日)
  - RSI (14日)
  - ADR (20日)
  - VWAP
  - ボリンジャーバンド
  - パーフェクトオーダー判定
- [x] **個別銘柄検索API** (`/api/stock-lookup`) ⭐ メイン機能
  - 全米8,000+銘柄対応
  - リアルタイムデータ取得
  - スコアリング機能 (0-100点)
- [x] **検索UIコンポーネント** (`StockSearchBar`)
- [x] **チャート表示** (Recharts統合)
  - 価格チャート（終値 + 移動平均線）
  - 出来高チャート
- [x] **タブUI** (個別検索タブ + スクリーニングタブ)
- [x] プリセット戦略実装 (5種類)
- [x] サンプルデータによるフィルタリング機能

#### 設計判断 📋
- ✅ **データベース不要**: リアルタイム検索により、Postgres/KVは不要
- ✅ **Cronジョブ不要**: オンデマンド取得により、定期更新は不要
- ✅ **シンプルアーキテクチャ**: Yahoo Finance API直接呼び出しで十分
- ✅ **無料枠内運用**: Vercel無料プラン内で全機能動作可能

### Phase 2: 拡張機能 (Week 5-8) - 未着手

- [ ] セクター分析機能
- [ ] 決算カレンダー
- [ ] ポートフォリオ分析ツール
- [ ] 市場環境インジケーター

## 開発サーバー起動

```bash
# 依存パッケージインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

## デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリと連携
2. Vercelプロジェクト作成
3. 環境変数設定
4. 自動デプロイ

## 環境変数

現在のアーキテクチャでは特別な環境変数は不要です。Yahoo Finance APIは無料で利用でき、認証も不要です。

将来的な拡張（オプション）:
```bash
# .env.local (オプション)

# External APIs (将来的な拡張用)
ALPHA_VANTAGE_API_KEY=  # より詳細なデータ取得用
FINNHUB_API_KEY=         # リアルタイムニュース用

# App Settings
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 機能詳細

### スクリーニング機能

#### テクニカル指標フィルター
- 移動平均線フィルター (10, 20, 50, 150, 200日)
- 移動平均線パーフェクトオーダー
- MA乖離率フィルター
- ADR (Average Daily Range) フィルター
- RSI フィルター
- VWAP フィルター
- 52週高値/安値フィルター
- ボリューム/出来高フィルター

#### ファンダメンタルフィルター
- 時価総額フィルター
- 価格範囲フィルター
- セクターフィルター
- 流動性フィルター

#### スコアリングシステム
各銘柄を0-100点で評価:
- 移動平均線の並び（パーフェクトオーダー）: 20点
- 200MA以上: 15点
- ADR 6%以上: 15点
- 流動性: 15点
- RSI 50-70: 10点
- 時価総額: 5点

### プリセット戦略

1. **短期上昇候補**: ADR高、流動性高、200MA以上、強いセクター
2. **押し目買い候補**: 10EMA近辺、21/50EMAは上、流動性高
3. **移動平均線パーフェクトオーダー**: 10>20>50>150>200の理想的な並び
4. **52週高値ブレイクアウト**: 新高値更新銘柄、強いモメンタム
5. **窓埋め候補**: 大きな窓開け後、サポートライン付近

## ライセンス

ISC

## 開発者

Serena (Claude Code AI Assistant)
