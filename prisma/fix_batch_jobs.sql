-- batch_jobs テーブルに必要なカラムを追加

-- job_type カラムが存在しない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'batch_jobs' AND column_name = 'job_type'
  ) THEN
    ALTER TABLE batch_jobs ADD COLUMN job_type VARCHAR(50) DEFAULT 'daily_batch';
  END IF;
END $$;

-- success_count カラムが存在しない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'batch_jobs' AND column_name = 'success_count'
  ) THEN
    ALTER TABLE batch_jobs ADD COLUMN success_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- fail_count カラムが存在しない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'batch_jobs' AND column_name = 'fail_count'
  ) THEN
    ALTER TABLE batch_jobs ADD COLUMN fail_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- metadata カラムが存在しない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'batch_jobs' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE batch_jobs ADD COLUMN metadata TEXT;
  END IF;
END $$;

-- 確認: 更新後のテーブル構造
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'batch_jobs'
ORDER BY ordinal_position;
