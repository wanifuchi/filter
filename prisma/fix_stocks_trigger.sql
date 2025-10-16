-- stocksテーブルのトリガーを削除
DROP TRIGGER IF EXISTS update_stocks_updated_at ON stocks;

-- 念のため、他のテーブルのトリガーも確認
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'stocks';
