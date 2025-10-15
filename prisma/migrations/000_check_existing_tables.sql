-- 既存テーブル確認クエリ（読み取り専用）
-- Supabase SQL Editorで実行して、既存のテーブルを確認

-- すべてのテーブルを表示
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- すべてのトリガーを表示
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 各テーブルのカラム情報を表示
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
