-- =============================================================================
-- 統合データベーススキーマ
-- 8000銘柄バッチ処理システム用 - 最終統合版
-- =============================================================================
--
-- 概要:
-- このSQLファイルは、8000銘柄以上のバッチ処理システムに必要な
-- すべてのテーブル、インデックス、トリガー、セキュリティポリシーを含みます。
--
-- 含まれるテーブル:
-- 1. stocks         - 銘柄マスター（6,052銘柄の基本情報）
-- 2. stock_data     - 日次株価データ + AI予測（メインデータ）
-- 3. batch_jobs     - バッチ処理管理（GitHub Actions用）
-- 4. error_logs     - エラーログ（デバッグ用）
--
-- 安全性:
-- - CREATE TABLE IF NOT EXISTS で既存データを保護
-- - DROP TRIGGER IF EXISTS でトリガー競合を回避
-- - インデックス重複チェック付き
--
-- 実行方法:
-- Supabase Dashboard → SQL Editor → このファイル全体をコピー&貼り付け → Run
-- =============================================================================

-- =============================================================================
-- 1. 銘柄マスターテーブル
-- =============================================================================
-- 用途: 6,052銘柄の基本情報を保存
-- 更新: バッチ処理開始時に銘柄リストを更新
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

-- カラム追加: 既存テーブルに不足しているカラムを追加
DO $$
BEGIN
  -- is_active カラムが存在しない場合は追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stocks' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE stocks ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  -- country カラムが存在しない場合は追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stocks' AND column_name = 'country'
  ) THEN
    ALTER TABLE stocks ADD COLUMN country VARCHAR(2) DEFAULT 'US';
  END IF;

  -- industry カラムが存在しない場合は追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stocks' AND column_name = 'industry'
  ) THEN
    ALTER TABLE stocks ADD COLUMN industry VARCHAR(100);
  END IF;
END $$;

-- インデックス: 検索パフォーマンス向上
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
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stocks_is_active') THEN
    CREATE INDEX idx_stocks_is_active ON stocks(is_active);
  END IF;
END $$;

-- =============================================================================
-- 2. 日次株価データ + AI予測テーブル
-- =============================================================================
-- 用途: バッチ処理で毎日更新される株価データとAI予測
-- サイズ: 6,052銘柄 × 250営業日 = 約150万レコード/年
CREATE TABLE IF NOT EXISTS stock_data (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,

  -- 価格データ
  current_price DECIMAL(12, 4),
  open_price DECIMAL(12, 4),
  high_price DECIMAL(12, 4),
  low_price DECIMAL(12, 4),
  volume BIGINT,
  dollar_volume DECIMAL(20, 2),
  market_cap BIGINT,

  -- テクニカル指標
  ma_10 DECIMAL(12, 4),
  ma_20 DECIMAL(12, 4),
  ma_50 DECIMAL(12, 4),
  ma_200 DECIMAL(12, 4),
  rsi_14 DECIMAL(5, 2),
  adr_20 DECIMAL(5, 2),
  volume_avg_20 BIGINT,
  perfect_order_bullish BOOLEAN DEFAULT FALSE,

  -- AI予測
  ai_score INT CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_confidence DECIMAL(5, 2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_prediction VARCHAR(20) CHECK (ai_prediction IN ('STRONG_BUY', 'BUY', 'HOLD', 'SELL')),
  ai_reasoning TEXT,
  investment_decision VARCHAR(20) CHECK (investment_decision IN ('BUY', 'HOLD', 'SELL')),

  -- タイムスタンプ
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- ユニーク制約: 1銘柄 × 1日付 = 1レコード
  UNIQUE(symbol, date)
);

-- カラム追加: 既存テーブルに不足しているカラムを追加
DO $$
BEGIN
  -- market_cap カラムが存在しない場合は追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_data' AND column_name = 'market_cap'
  ) THEN
    ALTER TABLE stock_data ADD COLUMN market_cap BIGINT;
  END IF;

  -- created_at カラムが存在しない場合は追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_data' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE stock_data ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- インデックス: フィルター機能の高速化
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
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_data_investment_decision') THEN
    CREATE INDEX idx_stock_data_investment_decision ON stock_data(investment_decision);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_data_price_range') THEN
    CREATE INDEX idx_stock_data_price_range ON stock_data(current_price) WHERE current_price IS NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- 3. バッチジョブ管理テーブル
-- =============================================================================
-- 用途: GitHub Actionsバッチ処理の進捗管理
-- 更新: 毎日のバッチ実行時に新しいジョブレコードを作成
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

-- インデックス: ジョブ状態の監視
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
-- 4. エラーログテーブル
-- =============================================================================
-- 用途: バッチ処理中のエラーを記録
-- 使用例: Yahoo Finance API エラー、データ検証エラー
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  error_message TEXT NOT NULL,
  error_type VARCHAR(50),
  batch_job_id UUID REFERENCES batch_jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス: エラー分析
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
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_error_logs_error_type') THEN
    CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
  END IF;
END $$;

-- =============================================================================
-- 5. 外部キー制約
-- =============================================================================
-- stock_data → stocks の参照整合性
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_stock_data_symbol'
  ) THEN
    ALTER TABLE stock_data
      ADD CONSTRAINT fk_stock_data_symbol
      FOREIGN KEY (symbol)
      REFERENCES stocks(symbol)
      ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- 6. トリガー関数: 自動更新日時設定
-- =============================================================================
-- 用途: UPDATE時に自動的に updated_at を現在時刻に更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. トリガー: 自動更新日時の適用
-- =============================================================================
-- 既存のトリガーがある場合は削除してから再作成（エラー回避）

-- stocks テーブル
DROP TRIGGER IF EXISTS update_stocks_updated_at ON stocks;
CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- stock_data テーブル
DROP TRIGGER IF EXISTS update_stock_data_updated_at ON stock_data;
CREATE TRIGGER update_stock_data_updated_at
  BEFORE UPDATE ON stock_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- batch_jobs テーブル
DROP TRIGGER IF EXISTS update_batch_jobs_updated_at ON batch_jobs;
CREATE TRIGGER update_batch_jobs_updated_at
  BEFORE UPDATE ON batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. Row Level Security (RLS) の設定
-- =============================================================================
-- セキュリティポリシー: 読み取りは公開、書き込みはサービスロールのみ

-- RLS 有効化
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- stocks テーブルのポリシー
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on stocks'
  ) THEN
    CREATE POLICY "Allow public read access on stocks" ON stocks
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role write on stocks'
  ) THEN
    CREATE POLICY "Allow service role write on stocks" ON stocks
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- stock_data テーブルのポリシー
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on stock_data'
  ) THEN
    CREATE POLICY "Allow public read access on stock_data" ON stock_data
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role write on stock_data'
  ) THEN
    CREATE POLICY "Allow service role write on stock_data" ON stock_data
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- batch_jobs テーブルのポリシー
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on batch_jobs'
  ) THEN
    CREATE POLICY "Allow public read access on batch_jobs" ON batch_jobs
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role write on batch_jobs'
  ) THEN
    CREATE POLICY "Allow service role write on batch_jobs" ON batch_jobs
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- error_logs テーブルのポリシー
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on error_logs'
  ) THEN
    CREATE POLICY "Allow public read access on error_logs" ON error_logs
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role write on error_logs'
  ) THEN
    CREATE POLICY "Allow service role write on error_logs" ON error_logs
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- =============================================================================
-- 完了メッセージ
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ マイグレーション完了';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 作成されたテーブル:';
  RAISE NOTICE '   1. stocks         - 銘柄マスター';
  RAISE NOTICE '   2. stock_data     - 日次株価データ + AI予測';
  RAISE NOTICE '   3. batch_jobs     - バッチ処理管理';
  RAISE NOTICE '   4. error_logs     - エラーログ';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 作成されたトリガー:';
  RAISE NOTICE '   - update_stocks_updated_at';
  RAISE NOTICE '   - update_stock_data_updated_at';
  RAISE NOTICE '   - update_batch_jobs_updated_at';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLSポリシー設定完了';
  RAISE NOTICE '   - 読み取り: 誰でもアクセス可能';
  RAISE NOTICE '   - 書き込み: サービスロールのみ';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ:';
  RAISE NOTICE '1. テーブル作成確認: SELECT table_name FROM information_schema.tables WHERE table_schema = ''public'';';
  RAISE NOTICE '2. 環境変数設定: .env.local に Supabase 認証情報を追加';
  RAISE NOTICE '3. Vercel デプロイ';
  RAISE NOTICE '4. GitHub Actions 設定';
  RAISE NOTICE '';
END $$;
