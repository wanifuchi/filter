# 全銘柄バッチ処理システム セットアップガイド

毎日自動で全銘柄のデータを更新するバッチ処理システムのセットアップ手順です。

## 📋 目次

1. [システム概要](#システム概要)
2. [初期セットアップ](#初期セットアップ)
3. [ローカルテスト](#ローカルテスト)
4. [Vercelデプロイ](#vercelデプロイ)
5. [GitHub Actions設定](#github-actions設定)
6. [運用・監視](#運用監視)

---

## システム概要

### アーキテクチャ

```
GitHub Actions (毎日 UTC 2:00 / JST 11:00)
    ↓ POST /api/batch-all (CRON_SECRET認証)
Vercel API (全銘柄ループ処理)
    ↓ 18秒間隔で POST /api/process-stock
    ↓ Yahoo Finance API + Gemini API
    ↓ データ保存
Supabase PostgreSQL
    ├── stocks (銘柄マスタ)
    ├── stock_data (日次データ)
    ├── batch_jobs (バッチ実行履歴)
    └── error_logs (エラーログ)
```

### 処理フロー

1. **GitHub Actions起動** - cron スケジュールで毎日実行
2. **認証** - CRON_SECRET によるセキュアな認証
3. **銘柄取得** - Supabase から `is_active=true` の全銘柄を取得
4. **順次処理** - 各銘柄を18秒間隔で処理（Yahoo Finance API制限対応）
5. **進捗記録** - `batch_jobs` テーブルに実行状況を記録
6. **エラーログ** - 失敗した銘柄は `error_logs` に記録
7. **完了通知** - GitHub Actionsで結果サマリーを表示

### 処理時間の見積もり

- **銘柄数**: 63銘柄（初期データ）
- **間隔**: 18秒/銘柄
- **合計時間**: 約19分（63 × 18秒 = 1,134秒）

---

## 初期セットアップ

### ステップ1: 銘柄マスタデータの投入

Supabaseで以下のSQLを実行して、主要米国株63銘柄を登録します：

```bash
# SQLファイルの内容を確認
cat prisma/seed_stocks.sql
```

**Supabase SQL Editorで実行**:
1. Supabaseプロジェクトにログイン
2. 左メニューから「SQL Editor」を選択
3. `prisma/seed_stocks.sql` の内容を全てコピー＆ペースト
4. 「Run」をクリック

**確認**:
```sql
SELECT COUNT(*) FROM stocks WHERE is_active = true;
-- 結果: 63銘柄が登録されているはず
```

### ステップ2: 環境変数の確認

`.env.local` に以下が設定されていることを確認：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# セキュリティ
CRON_SECRET=your-random-secret-here

# API Keys
GEMINI_API_KEY=AIzaSy...
```

**CRON_SECRETの生成**（まだ未設定の場合）:
```bash
openssl rand -base64 32
```

---

## ローカルテスト

デプロイ前にローカル環境でバッチ処理をテストします。

### ステップ1: 開発サーバー起動

```bash
npm run dev
# → http://localhost:3001 で起動
```

### ステップ2: 少数銘柄でテスト

まず3銘柄だけでテストします：

```bash
node scripts/quick-test.js
```

**期待される結果**:
```
✅ AAPL: $249.34, AIスコア: 90, 投資判断: BUY (2.1秒)
✅ MSFT: $513.43, AIスコア: 93, 投資判断: HOLD (1.7秒)
✅ GOOGL: $251.03, AIスコア: 82, 投資判断: HOLD (1.6秒)
Success: 3/3 (100%)
```

### ステップ3: 全銘柄バッチ処理テスト

**⚠️ 注意**: この処理は約19分かかります。

```bash
node scripts/test-batch-all.js
```

**実行中の表示例**:
```
🧪 全銘柄バッチ処理APIテスト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 API URL: http://localhost:3001/api/batch-all
🔑 CRON_SECRET: 設定済み ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 バッチ処理を開始します...

（約19分後）

✅ バッチ処理が正常に完了しました

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 処理結果サマリー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Job ID:          1
  対象銘柄数:      63
  処理済み:        63
  成功:            60 ✅
  失敗:            3 ⚠️
  処理時間:        1134秒 (19分)
  平均処理時間:    18.0秒/銘柄
  成功率:          95.2%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ステップ4: データ確認

Supabaseでデータが正しく保存されたか確認：

```sql
-- 最新のバッチジョブ確認
SELECT * FROM batch_jobs ORDER BY started_at DESC LIMIT 1;

-- 今日保存されたデータ件数
SELECT COUNT(*) FROM stock_data WHERE date = CURRENT_DATE;

-- 銘柄別データ確認
SELECT symbol, ai_score, investment_decision, created_at
FROM stock_data
WHERE date = CURRENT_DATE
ORDER BY ai_score DESC
LIMIT 10;
```

---

## Vercelデプロイ

### ステップ1: Vercelプロジェクト作成

```bash
# Vercel CLIインストール（未インストールの場合）
npm i -g vercel

# ログイン
vercel login

# デプロイ
vercel
```

### ステップ2: 環境変数設定

Vercelダッシュボードで以下の環境変数を設定：

1. https://vercel.com/your-username/your-project にアクセス
2. 「Settings」→「Environment Variables」を選択
3. 以下を追加：

| Variable Name                    | Value                          | Environment          |
|----------------------------------|--------------------------------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | https://your-project.supabase.co | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | eyJhbGci...                    | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY`      | eyJhbGci...                    | Production, Preview, Development |
| `CRON_SECRET`                    | your-random-secret             | Production, Preview, Development |
| `GEMINI_API_KEY`                 | AIzaSy...                      | Production, Preview, Development |

### ステップ3: 本番URLの確認

デプロイ完了後、Vercel URLを確認：

```
https://your-project.vercel.app
```

この URL を GitHub Secrets に設定します（次のセクション）。

---

## GitHub Actions設定

### ステップ1: GitHub Secrets設定

GitHubリポジトリで以下のSecretsを設定：

1. GitHubリポジトリにアクセス
2. 「Settings」→「Secrets and variables」→「Actions」を選択
3. 「New repository secret」をクリック
4. 以下の2つを追加：

| Secret Name    | Value                              |
|----------------|------------------------------------|
| `VERCEL_URL`   | your-project.vercel.app （https://なし） |
| `CRON_SECRET`  | your-random-secret                 |

### ステップ2: ワークフロー確認

`.github/workflows/daily-batch.yml` が正しくコミットされているか確認：

```bash
git add .github/workflows/daily-batch.yml
git commit -m "feat: GitHub Actions daily batch workflow"
git push
```

### ステップ3: 手動テスト実行

1. GitHubリポジトリで「Actions」タブを選択
2. 「Daily Stock Data Batch Processing」を選択
3. 「Run workflow」ボタンをクリック
4. 実行結果を確認

**成功時の表示例**:
```
✅ バッチ処理完了
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 処理結果サマリー:
  • 対象銘柄数: 63
  • 成功: 60
  • 失敗: 3
  • 処理時間: 1134秒 (19分)
  • 成功率: 95.2%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ステップ4: スケジュール確認

ワークフローは以下のスケジュールで自動実行されます：

- **UTC 2:00** = **JST 11:00** (毎日)
- cron式: `0 2 * * *`

次回の実行予定はGitHub Actionsページで確認できます。

---

## 運用・監視

### バッチジョブの監視

**Supabaseでバッチ履歴を確認**:

```sql
-- 最近のバッチジョブ一覧
SELECT
  id,
  job_type,
  status,
  started_at,
  completed_at,
  success_count,
  fail_count,
  EXTRACT(EPOCH FROM (completed_at - started_at)) AS duration_seconds
FROM batch_jobs
ORDER BY started_at DESC
LIMIT 10;

-- 失敗したバッチジョブ
SELECT * FROM batch_jobs
WHERE status IN ('failed', 'completed_with_errors')
ORDER BY started_at DESC;
```

### エラーログの確認

```sql
-- 最近のエラーログ
SELECT
  el.created_at,
  el.symbol,
  el.error_type,
  el.error_message,
  bj.started_at as batch_started
FROM error_logs el
LEFT JOIN batch_jobs bj ON el.job_id = bj.id
ORDER BY el.created_at DESC
LIMIT 20;

-- エラー頻度の高い銘柄
SELECT
  symbol,
  COUNT(*) as error_count,
  MAX(created_at) as last_error
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY symbol
ORDER BY error_count DESC;
```

### フロントエンドでの確認

1. http://localhost:3001/screener（または本番URL）にアクセス
2. 「バッチ処理済みデータ」タブをクリック
3. 「最新100件を読み込み」をクリック
4. 今日の日付のデータが表示されることを確認

### トラブルシューティング

#### 問題1: GitHub Actionsが失敗する

**確認事項**:
- GitHub Secretsが正しく設定されているか
- Vercel URLに `https://` が含まれていないか（含めない）
- CRON_SECRETが一致しているか

#### 問題2: 一部の銘柄が失敗する

**原因**:
- Yahoo Finance APIでデータが取得できない
- Gemini APIのレート制限

**対応**:
- `error_logs` テーブルで失敗原因を確認
- 必要に応じて銘柄の `is_active` を `false` に変更

```sql
UPDATE stocks SET is_active = false WHERE symbol = 'XXXX';
```

#### 問題3: 処理時間が長すぎる

**対応**:
- 銘柄数を減らす
- `is_active = false` で不要な銘柄を無効化
- 間隔を短くする（ただしAPI制限に注意）

---

## 銘柄の追加・削除

### 銘柄を追加する

```sql
INSERT INTO stocks (symbol, name, sector, industry, exchange, country, is_active)
VALUES ('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics', 'NASDAQ', 'US', true);
```

### 銘柄を無効化する

```sql
UPDATE stocks SET is_active = false WHERE symbol = 'XXXX';
```

### 銘柄を再有効化する

```sql
UPDATE stocks SET is_active = true WHERE symbol = 'XXXX';
```

---

## まとめ

✅ **完了したセットアップ**:
- 全銘柄バッチ処理API (`/api/batch-all`)
- GitHub Actionsワークフロー（毎日自動実行）
- 銘柄マスタデータ（63銘柄）
- バッチジョブ管理システム
- エラーログ記録

📊 **運用開始後の流れ**:
1. 毎日 JST 11:00 に自動実行
2. 約19分で全銘柄処理完了
3. データはSupabaseに保存
4. フロントエンドで即座に閲覧可能

🎉 **セットアップ完了！**
