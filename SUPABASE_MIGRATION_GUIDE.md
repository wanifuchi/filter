# Supabase既存プロジェクト - マイグレーションガイド

既存のSupabaseプロジェクトに安全にテーブルを追加する手順です。

---

## 📋 既存プロジェクト情報

```
Project URL: https://rvnefpfidcrrpbwxvbyd.supabase.co
Project ID: rvnefpfidcrrpbwxvbyd
```

---

## ✅ マイグレーション手順

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

### ステップ2: 安全なマイグレーション実行

#### 方法A: 新しい安全版SQLを使用（推奨）

1. **Supabase Dashboard**を開く
   - https://supabase.com/dashboard/project/rvnefpfidcrrpbwxvbyd

2. **SQL Editor**に移動
   - 左サイドバー → "SQL Editor"

3. **新しいクエリを作成**
   - "New query"をクリック

4. **安全版マイグレーションSQLをコピー**
   - `prisma/migrations/002_add_batch_tables_safe.sql`の内容をすべてコピー

5. **貼り付けて実行**
   - SQL Editorに貼り付け
   - "Run"をクリック

**期待される結果:**
```
✅ マイグレーション完了
📊 追加されたテーブル: batch_jobs, error_logs
🔄 更新されたトリガー: update_updated_at_column
```

---

### ステップ3: テーブル作成確認

SQL Editorで以下を実行して、テーブルが正しく作成されたか確認：

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
batch_jobs      ← 🆕 新規追加
error_logs      ← 🆕 新規追加
stock_data      ← 既存（変更なし）
stocks          ← 既存または新規追加
```

---

### ステップ4: テーブル構造確認

各テーブルのカラムを確認：

```sql
-- batch_jobs テーブルの構造
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'batch_jobs'
ORDER BY ordinal_position;

-- error_logs テーブルの構造
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'error_logs'
ORDER BY ordinal_position;
```

---

## 🔧 トラブルシューティング

### エラー1: トリガーが既に存在する

```
ERROR: trigger "update_stock_data_updated_at" already exists
```

**解決策:**
安全版SQLスクリプト (`002_add_batch_tables_safe.sql`) を使用してください。
このスクリプトは以下を実行します：
```sql
DROP TRIGGER IF EXISTS update_stock_data_updated_at ON stock_data;
CREATE TRIGGER update_stock_data_updated_at ...
```

---

### エラー2: テーブルが既に存在する

```
ERROR: relation "stock_data" already exists
```

**これは問題ありません！**
`CREATE TABLE IF NOT EXISTS` を使用しているため、既存テーブルはスキップされます。

---

### エラー3: 外部キー制約エラー

```
ERROR: foreign key constraint violation
```

**原因:** `error_logs` テーブルが `batch_jobs` テーブルを参照しているため、
`batch_jobs` が先に作成されている必要があります。

**解決策:**
安全版SQLスクリプトは正しい順序で実行されるため、このエラーは発生しません。

---

## 📊 マイグレーション結果

### 追加されるテーブル

#### 1. batch_jobs
バッチジョブの実行履歴を管理

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| job_name | VARCHAR(100) | ジョブ名 |
| batch_number | INT | バッチ番号 |
| start_index | INT | 開始インデックス |
| end_index | INT | 終了インデックス |
| status | VARCHAR(20) | ステータス（pending/running/completed/failed） |
| processed_count | INT | 処理済み件数 |
| success_count | INT | 成功件数 |
| error_count | INT | エラー件数 |
| started_at | TIMESTAMP | 開始日時 |
| completed_at | TIMESTAMP | 完了日時 |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

#### 2. error_logs
エラーログを記録

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

1. ✅ **環境変数設定**
   - `.env.local`にSupabase情報を追加
   - Vercel環境変数も同様に設定

2. ✅ **APIテスト実行**
   ```bash
   CRON_SECRET=eWvhVEiN1PytTKp5bcTEieaNngckVXfhbFyGeBWWEQY= node scripts/quick-test.js
   ```

3. ✅ **GitHub Actions設定**
   - GitHub Secrets設定
   - 手動テスト実行

---

## 📝 メモ

### 既存テーブルの保護
- `stock_data` テーブルは変更されません
- `CREATE TABLE IF NOT EXISTS` により、既存テーブルはスキップされます
- トリガーは `DROP TRIGGER IF EXISTS` → `CREATE TRIGGER` で安全に再作成されます

### データの保持
- 既存のデータはすべて保持されます
- マイグレーションは追加のみで、削除は行いません

---

**マイグレーション完了！** 🎉
