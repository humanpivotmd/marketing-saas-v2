-- projects 테이블에 core_message 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS core_message text;
