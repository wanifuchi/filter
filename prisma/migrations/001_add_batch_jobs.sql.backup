-- バッチジョブ管理テーブル
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

-- インデックス
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_job_name ON batch_jobs(job_name);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at DESC);

-- エラーログテーブル
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  error_message TEXT NOT NULL,
  error_type VARCHAR(50),
  batch_job_id UUID REFERENCES batch_jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_error_logs_symbol ON error_logs(symbol);
CREATE INDEX IF NOT EXISTS idx_error_logs_batch_job ON error_logs(batch_job_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- 銘柄マスタテーブル（すでに存在する場合は変更なし）
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
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector);
CREATE INDEX IF NOT EXISTS idx_stocks_market_cap ON stocks(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_stocks_exchange ON stocks(exchange);

-- 日次株価データテーブル（Supabaseに合わせた形式）
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
CREATE INDEX IF NOT EXISTS idx_stock_data_symbol ON stock_data(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_data_date ON stock_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_data_symbol_date ON stock_data(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_data_ai_score ON stock_data(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_stock_data_perfect_order ON stock_data(perfect_order_bullish);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_data_updated_at
  BEFORE UPDATE ON stock_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_jobs_updated_at
  BEFORE UPDATE ON batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
