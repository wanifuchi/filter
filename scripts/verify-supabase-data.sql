-- =============================================================================
-- Supabase データ検証クエリ
-- =============================================================================
-- このファイルのSQLをSupabase SQL Editorで実行して、
-- APIテストで保存されたデータを確認します。
-- =============================================================================

-- 1. テーブル一覧確認
-- =============================================================================
SELECT
  '📊 テーブル一覧' as section,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. 最新データ確認（テスト実行した3銘柄）
-- =============================================================================
SELECT
  '🔍 最新データ（AAPL, MSFT, GOOGL）' as section,
  symbol,
  date,
  current_price,
  ai_score,
  investment_decision,
  created_at
FROM stock_data
WHERE symbol IN ('AAPL', 'MSFT', 'GOOGL')
ORDER BY created_at DESC
LIMIT 10;

-- 3. データ件数確認
-- =============================================================================
SELECT
  '📈 データ件数' as section,
  COUNT(*) as total_records,
  COUNT(DISTINCT symbol) as unique_symbols,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM stock_data;

-- 4. AIスコア分布
-- =============================================================================
SELECT
  '🤖 AIスコア分布' as section,
  CASE
    WHEN ai_score >= 90 THEN '90-100 (優良)'
    WHEN ai_score >= 80 THEN '80-89 (良好)'
    WHEN ai_score >= 70 THEN '70-79 (普通)'
    WHEN ai_score >= 60 THEN '60-69 (注意)'
    ELSE '0-59 (要注意)'
  END as score_range,
  COUNT(*) as count
FROM stock_data
WHERE ai_score IS NOT NULL
GROUP BY score_range
ORDER BY score_range DESC;

-- 5. 投資判断分布
-- =============================================================================
SELECT
  '💰 投資判断分布' as section,
  investment_decision,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM stock_data
WHERE investment_decision IS NOT NULL
GROUP BY investment_decision
ORDER BY count DESC;

-- 6. Perfect Order 銘柄
-- =============================================================================
SELECT
  '⭐ Perfect Order 銘柄' as section,
  symbol,
  current_price,
  ai_score,
  investment_decision,
  ma_10,
  ma_20,
  ma_50,
  ma_200
FROM stock_data
WHERE perfect_order_bullish = true
  AND date = (SELECT MAX(date) FROM stock_data)
ORDER BY ai_score DESC
LIMIT 10;

-- 7. 銘柄マスター確認
-- =============================================================================
SELECT
  '📋 銘柄マスター' as section,
  COUNT(*) as total_stocks,
  COUNT(DISTINCT sector) as unique_sectors,
  COUNT(DISTINCT exchange) as unique_exchanges
FROM stocks;

-- 8. バッチジョブ履歴
-- =============================================================================
SELECT
  '🔄 バッチジョブ履歴' as section,
  job_name,
  status,
  processed_count,
  success_count,
  error_count,
  started_at,
  completed_at
FROM batch_jobs
ORDER BY created_at DESC
LIMIT 5;

-- 9. エラーログ確認
-- =============================================================================
SELECT
  '❌ エラーログ' as section,
  symbol,
  error_type,
  error_message,
  created_at
FROM error_logs
ORDER BY created_at DESC
LIMIT 10;

-- 10. データ品質チェック
-- =============================================================================
-- NULL値の多いレコードを検出
SELECT
  '🔍 データ品質チェック' as section,
  symbol,
  date,
  CASE WHEN current_price IS NULL THEN 1 ELSE 0 END +
  CASE WHEN volume IS NULL THEN 1 ELSE 0 END +
  CASE WHEN ai_score IS NULL THEN 1 ELSE 0 END as null_count,
  current_price,
  volume,
  ai_score
FROM stock_data
WHERE date = (SELECT MAX(date) FROM stock_data)
ORDER BY null_count DESC, symbol
LIMIT 10;

-- =============================================================================
-- 完了メッセージ
-- =============================================================================
SELECT '✅ データ検証完了' as result;
