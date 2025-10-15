# Supabase既存プロジェクト - 統合マイグレーションガイド

既存のSupabaseプロジェクトに安全に8000銘柄バッチシステムをセットアップする手順です。

---

## 📋 既存プロジェクト情報

```
Project URL: https://rvnefpfidcrrpbwxvbyd.supabase.co
Project ID: rvnefpfidcrrpbwxvbyd
```

---

## ✅ マイグレーション手順（統合版）

### ステップ1: 既存テーブルの確認（オプション）

Supabase Dashboard → SQL Editorで以下を実行して、既存のテーブルを確認：

```sql
-- すべてのテーブルを表示
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**期待される結果:**
```
table_name
--------------
stock_data    (既に存在)
stocks        (存在する可能性あり)
... その他のテーブル
```

---

### ステップ2: 統合マイグレーション実行（推奨）

#### ⭐ 統一SQLファイルを使用（最も簡単）

1. **Supabase Dashboard**を開く
   - https://supabase.com/dashboard/project/rvnefpfidcrrpbwxvbyd

2. **SQL Editor**に移動
   - 左サイドバー → "SQL Editor"

3. **新しいクエリを作成**
   - "New query"をクリック

4. **統合マイグレーションSQLをコピー**
   - `prisma/migrations/003_unified_schema.sql`の内容をすべてコピー

5. **貼り付けて実行**
   - SQL Editorに貼り付け
   - "Run"をクリック

**期待される結果:**
```
✅ ========================================
✅ マイグレーション完了
✅ ========================================

📊 作成されたテーブル:
   1. stocks         - 銘柄マスター
   2. stock_data     - 日次株価データ + AI予測
   3. batch_jobs     - バッチ処理管理
   4. error_logs     - エラーログ

🔄 作成されたトリガー:
   - update_stocks_updated_at
   - update_stock_data_updated_at
   - update_batch_jobs_updated_at

🔒 RLSポリシー設定完了
   - 読み取り: 誰でもアクセス可能
   - 書き込み: サービスロールのみ
```

---

### ステップ3: テーブル作成確認

SQL Editorで以下を実行して、すべてのテーブルが正しく作成されたか確認：

```sql
-- すべてのテーブルを表示
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**期待される結果:**
```
table_name
--------------
batch_jobs      ← 🆕 バッチ処理管理
error_logs      ← 🆕 エラーログ
stock_data      ← 日次データ + AI予測
stocks          ← 銘柄マスター
```

---

### ステップ4: テーブル構造確認

各テーブルのカラムを確認（オプション）：

```sql
-- 4つのテーブル構造をすべて確認
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('stocks', 'stock_data', 'batch_jobs', 'error_logs')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

---

## 🔧 トラブルシューティング

### エラー1: トリガーが既に存在する

```
ERROR: trigger "update_stock_data_updated_at" already exists
```

**解決策:**
統合マイグレーションSQL (`003_unified_schema.sql`) を使用してください。
このスクリプトは以下を実行します：
```sql
DROP TRIGGER IF EXISTS update_stock_data_updated_at ON stock_data;
CREATE TRIGGER update_stock_data_updated_at ...
```

✅ **`003_unified_schema.sql` ではこのエラーは発生しません！**

---

### エラー2: テーブルが既に存在する

```
ERROR: relation "stock_data" already exists
```

**これは問題ありません！**
`CREATE TABLE IF NOT EXISTS` を使用しているため、既存テーブルはスキップされます。

✅ **統合SQLは既存データを完全に保護します。**

---

### エラー3: ポリシーが既に存在する

```
ERROR: policy "Allow public read access on stocks" already exists
```

**解決策:**
統合SQLでは `DO $$ ... END $$` ブロックを使用してポリシーの重複をチェックしています。

✅ **このエラーも発生しません！**

---

### エラー4: インデックスが既に存在する

```
ERROR: index "idx_stock_data_symbol" already exists
```

**解決策:**
統合SQLでは以下のように重複チェックを行います：
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_data_symbol') THEN
    CREATE INDEX idx_stock_data_symbol ON stock_data(symbol);
  END IF;
END $$;
```

✅ **既存インデックスはスキップされます。**

---

## 📊 マイグレーション結果

### 作成される4つのテーブル

#### 1. stocks（銘柄マスター）
6,052銘柄の基本情報を保存

| カラム | 型 | 説明 |
|--------|-----|------|
| symbol | VARCHAR(10) | 銘柄コード（主キー） |
| name | VARCHAR(255) | 会社名 |
| sector | VARCHAR(100) | セクター |
| industry | VARCHAR(100) | 業種 |
| market_cap | BIGINT | 時価総額 |
| exchange | VARCHAR(20) | 取引所 |
| country | VARCHAR(2) | 国コード |
| is_active | BOOLEAN | アクティブフラグ |
| last_updated | TIMESTAMP | 最終更新日時 |

#### 2. stock_data（日次株価データ + AI予測）
毎日のバッチ処理で更新されるメインデータ

| カラム | 型 | 説明 |
|--------|-----|------|
| id | BIGSERIAL | 主キー |
| symbol | VARCHAR(10) | 銘柄コード |
| date | DATE | 日付 |
| current_price | DECIMAL(12,4) | 現在価格 |
| volume | BIGINT | 出来高 |
| ma_10, ma_20, ma_50, ma_200 | DECIMAL(12,4) | 移動平均 |
| rsi_14 | DECIMAL(5,2) | RSI指標 |
| ai_score | INT | AIスコア（0-100） |
| ai_prediction | VARCHAR(20) | AI予測（BUY/HOLD/SELL） |
| investment_decision | VARCHAR(20) | 投資判断 |
| ... | ... | その他多数 |

#### 3. batch_jobs（バッチ処理管理）
GitHub Actionsバッチ実行の進捗管理

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| job_name | VARCHAR(100) | ジョブ名 |
| status | VARCHAR(20) | ステータス（pending/running/completed/failed） |
| processed_count | INT | 処理済み件数 |
| success_count | INT | 成功件数 |
| error_count | INT | エラー件数 |
| started_at | TIMESTAMP | 開始日時 |
| completed_at | TIMESTAMP | 完了日時 |

#### 4. error_logs（エラーログ）
バッチ処理中のエラーを記録

| カラム | 型 | 説明 |
|--------|-----|------|
| id | BIGSERIAL | 主キー |
| symbol | VARCHAR(10) | 銘柄シンボル |
| error_message | TEXT | エラーメッセージ |
| error_type | VARCHAR(50) | エラー種別 |
| batch_job_id | UUID | バッチジョブID（外部キー） |
| created_at | TIMESTAMP | 作成日時 |

---

## ✅ 完了確認

以下のクエリで、すべてのテーブルとインデックスが正しく作成されているか確認：

```sql
-- テーブル一覧
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- インデックス一覧
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- トリガー一覧
SELECT
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## 🚀 次のステップ

マイグレーションが完了したら：

### 1. ✅ 環境変数設定

`.env.local` を作成し、以下を追加：

```bash
# Supabase 設定（既存プロジェクト）
NEXT_PUBLIC_SUPABASE_URL=https://rvnefpfidcrrpbwxvbyd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron Secret（バッチ処理認証用）
CRON_SECRET=eWvhVEiN1PytTKp5bcTEieaNngckVXfhbFyGeBWWEQY=
```

### 2. ✅ ローカルAPIテスト実行

```bash
# テストスクリプトを実行（3銘柄）
CRON_SECRET=eWvhVEiN1PytTKp5bcTEieaNngckVXfhbFyGeBWWEQY= node scripts/quick-test.js
```

**期待される結果:**
```
✅ AAPL: $249.34, AI Score: 90, BUY (3.6s)
✅ MSFT: $513.43, AI Score: 93, HOLD (1.4s)
✅ GOOGL: $251.03, AI Score: 82, HOLD (1.4s)
Success: 3/3 (100%)
```

### 3. ✅ Vercelデプロイ

```bash
# Vercelにデプロイ
vercel --prod

# 環境変数をVercelに設定（Dashboard経由）
```

### 4. ✅ GitHub Actions設定

GitHub Secretsに以下を追加：
- `VERCEL_API_URL` - Vercel本番URL
- `CRON_SECRET` - CRON認証シークレット

### 5. ✅ バッチ処理テスト実行

GitHub Actions → "Update Stocks" → "Run workflow"

---

## 📝 重要なポイント

### 🔒 既存データの完全保護
- ✅ `stock_data` テーブルは変更されません
- ✅ `CREATE TABLE IF NOT EXISTS` により、既存テーブルはスキップされます
- ✅ トリガーは `DROP TRIGGER IF EXISTS` → `CREATE TRIGGER` で安全に再作成されます
- ✅ 既存のインデックスは重複チェックでスキップされます
- ✅ RLSポリシーも重複チェック付きで安全に作成されます

### 📊 追加される新機能
- 🆕 **batch_jobs** テーブル - バッチ処理の進捗管理
- 🆕 **error_logs** テーブル - エラーログの記録
- 🆕 **stocks** テーブル - 6,052銘柄マスター（存在しない場合）
- 🆕 **統一されたトリガー** - 3つのテーブルで自動更新日時設定
- 🆕 **RLSポリシー** - セキュアな読み書き制御

### 🎯 システムの動作
1. **毎日2:00 UTC**: GitHub Actionsが自動実行
2. **6,052銘柄**: すべての銘柄を順次処理
3. **18秒間隔**: Yahoo Finance API制限を遵守
4. **約30時間**: 全銘柄の処理完了
5. **エラー追跡**: error_logsテーブルに自動記録

---

## 📞 サポート

### 問題が発生した場合

1. **SQLエラー**: トラブルシューティングセクションを参照
2. **テーブル確認**: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. **トリガー確認**: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public';`

---

**マイグレーション完了！** 🎉

次は `003_unified_schema.sql` をSupabaseで実行してください！
