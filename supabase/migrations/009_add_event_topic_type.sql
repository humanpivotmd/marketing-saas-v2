-- 009_add_event_topic_type.sql
-- projects.topic_type CHECK에 'event' 추가
-- TypeScript TopicType과 constants.ts TOPIC_TYPES에 이미 존재하나 DB에 누락됨

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_topic_type_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_topic_type_check
  CHECK (topic_type IN ('info', 'intro', 'service', 'product', 'event'));
