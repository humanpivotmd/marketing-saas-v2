-- contents 테이블 누락 컬럼 일괄 추가
ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS channel VARCHAR(30),
  ADD COLUMN IF NOT EXISTS keyword VARCHAR(200),
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- channel 컬럼을 type 값으로 채우기 (기존 데이터 호환)
UPDATE contents SET channel = type WHERE channel IS NULL;
