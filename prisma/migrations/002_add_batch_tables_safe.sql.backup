-- 安全なマイグレーション: 既存テーブルとの競合を避ける
-- 既存の stock_data テーブルは変更せず、不足しているテーブルのみ追加

-- =============================================================================
-- 1. バッチジョブ管理テーブル（新規追加）
-- =============================================================================
CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  batch_number INT NOT NULL,
  start_index INT NOT NULL,
  end_index INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  processed_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス（IF NOT EXISTS はPostgreSQLの一部バージョンで非対応のため、エラーを無視）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_jobs_status') THEN
    CREATE INDEX idx_batch_jobs_status ON batch_jobs(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_jobs_job_name') THEN
    CREATE INDEX idx_batch_jobs_job_name ON batch_jobs(job_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_jobs_created_at') THEN
    CREATE INDEX idx_batch_jobs_created_at ON batch_jobs(created_at DESC);
  END IF;
END $$;

-- =============================================================================
-- 2. エラーログテーブル（新規追加）
-- =============================================================================
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  error_message TEXT NOT NULL,
  error_type VARCHAR(50),
  batch_job_id UUID REFERENCES batch_jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_error_logs_symbol') THEN
    CREATE INDEX idx_error_logs_symbol ON error_logs(symbol);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_error_logs_batch_job') THEN
    CREATE INDEX idx_error_logs_batch_job ON error_logs(batch_job_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_error_logs_created_at') THEN
    CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
  END IF;
END $$;

-- =============================================================================
-- 3. 銘柄マスタテーブル（既存の場合はスキップ）
-- =============================================================================
CREATE TABLE IF NOT EXISTS stocks (
  symbol VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap BIGINT,
  exchange VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- インデックス
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stocks_sector') THEN
    CREATE INDEX idx_stocks_sector ON stocks(sector);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stocks_market_cap') THEN
    CREATE INDEX idx_stocks_market_cap ON stocks(market_cap DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stocks_exchange') THEN
    CREATE INDEX idx_stocks_exchange ON stocks(exchange);
  END IF;
END $$;

-- =============================================================================
-- 4. 日次株価データテーブル（既存の場合はスキップ）
-- =============================================================================
-- 注意: stock_data テーブルが既に存在する場合、このCREATE文はスキップされます
CREATE TABLE IF NOT EXISTS stock_data (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  current_price DECIMAL(12, 4),
  open_price DECIMAL(12, 4),
  high_price DECIMAL(12, 4),
  low_price DECIMAL(12, 4),
  volume BIGINT,
  dollar_volume DECIMAL(20, 2),
  market_cap BIGINT,
  ma_10 DECIMAL(12, 4),
  ma_20 DECIMAL(12, 4),
  ma_50 DECIMAL(12, 4),
  ma_200 DECIMAL(12, 4),
  rsi_14 DECIMAL(5, 2),
  adr_20 DECIMAL(5, 2),
  volume_avg_20 BIGINT,
  perfect_order_bullish BOOLEAN DEFAULT FALSE,
  ai_score INT,
  ai_confidence DECIMAL(5, 2),
  ai_prediction VARCHAR(20),
  ai_reasoning TEXT,
  investment_decision VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- インデックス
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_data_symbol') THEN
    CREATE INDEX idx_stock_data_symbol ON stock_data(symbol);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_data_date') THEN
    CREATE INDEX idx_stock_data_date ON stock_data(date DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_data_symbol_date') THEN
    CREATE INDEX idx_stock_data_symbol_date ON stock_data(symbol, date DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_data_ai_score') THEN
    CREATE INDEX idx_stock_data_ai_score ON stock_data(ai_score DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_data_perfect_order') THEN
    CREATE INDEX idx_stock_data_perfect_order ON stock_data(perfect_order_bullish);
  END IF;
END $$;

-- =============================================================================
-- 5. トリガー関数（既存の場合は置き換え）
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. トリガー（既存の場合は削除してから再作成）
-- =============================================================================

-- stocks テーブルのトリガー
DROP TRIGGER IF EXISTS update_stocks_updated_at ON stocks;
CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- stock_data テーブルのトリガー（既存の場合は削除してから再作成）
DROP TRIGGER IF EXISTS update_stock_data_updated_at ON stock_data;
CREATE TRIGGER update_stock_data_updated_at
  BEFORE UPDATE ON stock_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- batch_jobs テーブルのトリガー
DROP TRIGGER IF EXISTS update_batch_jobs_updated_at ON batch_jobs;
CREATE TRIGGER update_batch_jobs_updated_at
  BEFORE UPDATE ON batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 完了メッセージ
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ マイグレーション完了';
  RAISE NOTICE '📊 追加されたテーブル: batch_jobs, error_logs';
  RAISE NOTICE '🔄 更新されたトリガー: update_updated_at_column';
END $$;
