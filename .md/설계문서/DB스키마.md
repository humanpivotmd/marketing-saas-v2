# DB 스키마

> Supabase (PostgreSQL) -- 총 21개 테이블
> 마이그레이션: `supabase/migrations/001_init.sql`, `002_seed.sql`, `003_v3_pipeline.sql`

---

## 테이블 관계도 (ERD)

```
┌─────────────┐      ┌─────────────┐
│    plans     │<─────│    users     │
│             │  FK   │             │
│ id (PK)     │ plan_id│ id (PK)     │
│ name        │       │ email       │
│ display_name│       │ plan_id (FK)│──> plans
│ price_*     │       │ industry_id │──> industries
│ *_limit     │       │ pending_plan│──> plans
└─────────────┘       └──────┬──────┘
                             │ user_id (1:N)
          ┌──────────────────┼──────────────────┬────────────────┐
          │                  │                  │                │
          v                  v                  v                v
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ brand_voices │  │   keywords   │  │   channels   │  │  payments    │
│ user_id (FK) │  │ user_id (FK) │  │ user_id (FK) │  │ user_id (FK) │
│ name, tone   │  │ keyword      │  │ platform     │  │ plan_id (FK) │
│ is_default   │  │ grade        │  │ access_token │  │ amount       │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │                 │
       v                 v                 v
┌───────────────────────────────────────────────────┐
│                    contents                        │
│ user_id (FK) ──> users                            │
│ brand_voice_id (FK) ──> brand_voices              │
│ keyword_id (FK) ──> keywords                      │
│ project_id (FK) ──> projects                      │
│ parent_id (FK) ──> contents (self, 버전 관리)      │
│ type: blog|threads|instagram|facebook|video_script|script │
│ status: draft|generated|confirmed|edited|scheduled|published|failed │
└───────────────┬───────────┬───────────────────────┘
                │           │
                v           v
     ┌──────────────┐  ┌──────────────┐
     │    images     │  │  schedules   │
     │ content_id   │  │ content_id   │
     │ prompt       │  │ channel_id   │
     │ storage_path │  │ scheduled_at │
     └──────────────┘  └──────────────┘

┌──────────────┐       ┌──────────────────┐
│  projects    │       │   industries     │
│ user_id (FK) │       │ parent_id (FK)   │──> industries (자기참조)
│ keyword_id   │       │ level (1|2|3)    │
│ current_step │       └──────────────────┘
│ step_status  │
│ settings_snapshot │
└──────┬───────┘
       │ project_id (1:N)
       ├──────────────────┐
       v                  v
┌──────────────┐  ┌──────────────┐
│image_scripts │  │video_scripts │
│ project_id   │  │ project_id   │
│ prompts(JSONB)│  │ storyboard  │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  usage_logs  │  │  admin_prompts   │  │  support_tickets │
│ action_type  │  │ step, version    │  │ subject, message │
│ tokens_used  │  │ is_active        │  │ admin_reply      │
│ estimated_cost│ │ traffic_ratio    │  │ status           │
└──────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────┐  ┌──────────────────────┐  ┌──────────────┐
│  email_logs  │  │ keyword_opportunities │  │content_metrics│
│ to_email     │  │ UNIQUE(keyword,       │  │ content_id   │
│ template     │  │        industry)      │  │ views, likes │
│ resend_id    │  │ trend_direction       │  │ comments     │
└──────────────┘  └──────────────────────┘  └──────────────┘

┌────────────────────┐  ┌──────────────┐
│brand_voice_presets │  │ user_prompts │
│ industry (UNIQUE)  │  │ user_id (FK) │
│ name, tone         │  │ step         │
└────────────────────┘  │ UNIQUE(user_id, step) │
                        └──────────────┘
```

---

## 테이블 상세

### 1. plans (요금제)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | DEFAULT gen_random_uuid() | |
| `name` | VARCHAR(50) | UNIQUE NOT NULL | 내부 코드: free, starter, pro, business, premium |
| `display_name` | VARCHAR(100) | NOT NULL | 화면 표시명 |
| `price_monthly` | INTEGER | DEFAULT 0 | 월 요금 (원) |
| `price_yearly` | INTEGER | DEFAULT 0 | 연 요금 (원, 월 환산) |
| `content_limit` | INTEGER | DEFAULT 10 | 월 콘텐츠 한도 (0=무제한) |
| `keyword_limit` | INTEGER | DEFAULT 20 | 월 키워드 한도 |
| `image_limit` | INTEGER | DEFAULT 5 | 월 이미지 한도 |
| `saved_keyword_limit` | INTEGER | DEFAULT 20 | 저장 키워드 수 |
| `channel_limit` | INTEGER | DEFAULT 1 | 채널 연동 수 |
| `brand_voice_limit` | INTEGER | DEFAULT 1 | 브랜드 보이스 수 |
| `team_member_limit` | INTEGER | DEFAULT 0 | 팀 멤버 수 |
| `history_days` | INTEGER | DEFAULT 30 | 콘텐츠 보관일 (0=무제한) |
| `has_api_access` | BOOLEAN | DEFAULT FALSE | API 접근 |
| `has_priority_support` | BOOLEAN | DEFAULT FALSE | 우선 지원 |
| `is_active` | BOOLEAN | DEFAULT TRUE | 활성 여부 |
| `sort_order` | INTEGER | DEFAULT 0 | 정렬 |
| `effective_from` | TIMESTAMPTZ | | 시행 시작일 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

시드 데이터: free(0원), starter(19,900~29,000원), pro(59,000원), business(149,000원), premium(별도)

---

### 2. users (회원)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | gen_random_uuid() | |
| `email` | VARCHAR(255) | UNIQUE NOT NULL | 소문자 저장 |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt 12 rounds |
| `name` | VARCHAR(100) | NOT NULL | |
| `role` | VARCHAR(20) | CHECK: user, member, team_admin, admin, super_admin | DEFAULT 'user' |
| `status` | VARCHAR(20) | CHECK: pending, active, suspended | DEFAULT 'pending' |
| `email_verified` | BOOLEAN | DEFAULT FALSE | |
| `verify_token` | VARCHAR(255) | | 이메일 인증 토큰 |
| `reset_token` | VARCHAR(255) | | 비밀번호 재설정 토큰 |
| `reset_expires` | TIMESTAMPTZ | | 재설정 토큰 만료 |
| `avatar_url` | VARCHAR(500) | | |
| `plan_id` | UUID | FK -> plans ON DELETE SET NULL | 현재 플랜 |
| `plan_started_at` | TIMESTAMPTZ | | 플랜 시작일 |
| `plan_expires_at` | TIMESTAMPTZ | | 플랜 만료일 |
| `onboarding_done` | BOOLEAN | DEFAULT FALSE | |
| `experience_level` | VARCHAR(20) | CHECK: beginner, expert | DEFAULT 'beginner' |
| `pending_plan_id` | UUID | FK -> plans | 예약 플랜 |
| `pending_plan_at` | TIMESTAMPTZ | | 플랜 예약일 |
| `last_login_at` | TIMESTAMPTZ | | |
| `business_type` | VARCHAR(10) | CHECK: B2B, B2C | DEFAULT 'B2C' |
| `selected_channels` | TEXT[] | DEFAULT '{}' | 선택 채널 |
| `target_audience` | TEXT | | 타겟 고객층 |
| `target_gender` | VARCHAR(10) | CHECK: male, female, all | DEFAULT 'all' |
| `fixed_keywords` | TEXT[] | DEFAULT '{}' | 고정 키워드 |
| `blog_category` | VARCHAR(100) | | 블로그 카테고리 |
| `industry_id` | UUID | FK -> industries | 업종 |
| `company_name` | VARCHAR(200) | | 회사명 |
| `service_name` | VARCHAR(200) | | 서비스/제품명 |
| `writing_tone` | VARCHAR(50) | DEFAULT 'auto' | 글쓰기 톤 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 트리거 자동 갱신 |

---

### 3. brand_voices (브랜드 보이스)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users CASCADE, NOT NULL | |
| `name` | VARCHAR(100) | NOT NULL | |
| `industry` | VARCHAR(50) | | |
| `tone` | VARCHAR(50) | | |
| `description` | TEXT | | |
| `target_audience` | TEXT | | |
| `keywords` | TEXT[] | | 필수 키워드 |
| `banned_words` | TEXT[] | | 금지 단어 |
| `required_words` | TEXT[] | | 필수 포함 단어 |
| `sample_content` | TEXT | | 예시 콘텐츠 |
| `is_default` | BOOLEAN | DEFAULT FALSE | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 4. keywords (키워드)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users CASCADE, NOT NULL | |
| `keyword` | VARCHAR(200) | NOT NULL | |
| `monthly_search` | INTEGER | | 월간 검색량 합산 |
| `monthly_search_mobile` | INTEGER | | 모바일 검색량 |
| `monthly_search_pc` | INTEGER | | PC 검색량 |
| `competition` | VARCHAR(10) | | 경쟁도 |
| `cpc` | INTEGER | | 클릭당 비용 |
| `grade` | VARCHAR(5) | | A+~D- 등급 |
| `group_name` | VARCHAR(100) | | 그룹명 |
| `trend_data` | JSONB | | 트렌드 데이터 |
| `last_analyzed` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 5. contents (콘텐츠)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users CASCADE, NOT NULL | |
| `brand_voice_id` | UUID | FK -> brand_voices SET NULL | |
| `keyword_id` | UUID | FK -> keywords SET NULL | |
| `project_id` | UUID | FK -> projects SET NULL | |
| `type` | VARCHAR(20) | CHECK: blog, threads, instagram, facebook, video_script, script | |
| `title` | VARCHAR(500) | | |
| `body` | TEXT | NOT NULL | |
| `hashtags` | TEXT[] | | |
| `meta_description` | VARCHAR(300) | | |
| `tone` | VARCHAR(50) | | |
| `word_count` | INTEGER | | |
| `status` | VARCHAR(20) | CHECK: draft, generated, confirmed, edited, scheduled, published, failed | DEFAULT 'draft' |
| `version` | INTEGER | DEFAULT 1 | |
| `parent_id` | UUID | FK -> contents(self) SET NULL | 버전 관리 |
| `ai_model` | VARCHAR(50) | | |
| `ai_prompt_used` | TEXT | | |
| `seo_score` | INTEGER | | |
| `prompt_version_id` | UUID | | |
| `outline` | JSONB | | |
| `confirmed_at` | TIMESTAMPTZ | | |
| `revision_note` | TEXT | | |
| `scheduled_date` | VARCHAR | | 예정일 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 6. images (이미지)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users, NOT NULL | |
| `content_id` | UUID | FK -> contents SET NULL | |
| `prompt` | TEXT | NOT NULL | 생성 프롬프트 |
| `style` | VARCHAR(50) | | |
| `size` | VARCHAR(20) | | |
| `storage_path` | VARCHAR(500) | NOT NULL | |
| `public_url` | VARCHAR(500) | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 7. channels (채널)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users, NOT NULL | |
| `platform` | VARCHAR(20) | CHECK: instagram, threads, youtube, naver_blog, kakao, facebook | |
| `account_name` | VARCHAR(200) | | |
| `account_id` | VARCHAR(200) | | |
| `access_token` | TEXT | | AES-256-GCM 암호화 |
| `refresh_token` | TEXT | | AES-256-GCM 암호화 |
| `token_expires` | TIMESTAMPTZ | | |
| `is_active` | BOOLEAN | DEFAULT TRUE | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 8. schedules (예약)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users, NOT NULL | |
| `content_id` | UUID | FK -> contents CASCADE, NOT NULL | |
| `channel_id` | UUID | FK -> channels SET NULL | |
| `scheduled_at` | TIMESTAMPTZ | NOT NULL | 예약 시각 |
| `published_at` | TIMESTAMPTZ | | 실제 발행 시각 |
| `status` | VARCHAR(20) | CHECK: pending, publishing, published, failed | DEFAULT 'pending' |
| `error_message` | TEXT | | |
| `retry_count` | INTEGER | DEFAULT 0 | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 9. usage_logs (사용량 로그)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users, NOT NULL | |
| `action_type` | VARCHAR(50) | CHECK 아래 참조 | |
| `content_type` | VARCHAR(20) | | |
| `ai_model` | VARCHAR(50) | | |
| `tokens_used` | INTEGER | | |
| `estimated_cost` | DECIMAL(10,4) | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

action_type 허용값: `content_create`, `keyword_analyze`, `image_generate`, `publish`, `draft_generate`, `title_generate`, `image_script_generate`, `video_script_generate`, `quality_score`, `content_revise`

---

### 10. payments (결제)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users, NOT NULL | |
| `plan_id` | UUID | FK -> plans SET NULL | |
| `amount` | INTEGER | NOT NULL | 결제 금액 (원) |
| `billing_cycle` | VARCHAR(10) | CHECK: monthly, yearly | |
| `payment_method` | VARCHAR(50) | | |
| `payment_key` | VARCHAR(200) | | 토스페이먼츠 키 |
| `status` | VARCHAR(20) | CHECK: completed, refunded, failed | DEFAULT 'completed' |
| `paid_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `expires_at` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 11. admin_prompts (관리자 프롬프트)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `step` | VARCHAR(50) | NOT NULL | blog, threads, instagram, script, image |
| `version` | INTEGER | DEFAULT 1 | |
| `prompt_text` | TEXT | NOT NULL | |
| `is_active` | BOOLEAN | DEFAULT FALSE | |
| `traffic_ratio` | INTEGER | DEFAULT 100 | A/B 테스트 트래픽 비율 |
| `metrics` | JSONB | DEFAULT '{}' | 성과 지표 |
| `created_by` | UUID | FK -> users SET NULL | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 12. email_logs (이메일 로그)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users SET NULL | |
| `to_email` | VARCHAR(255) | NOT NULL | |
| `subject` | VARCHAR(500) | | |
| `template` | VARCHAR(50) | | verification, reset, marketing |
| `status` | VARCHAR(20) | DEFAULT 'sent' | |
| `resend_id` | VARCHAR(200) | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 13. brand_voice_presets (보이스 프리셋)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `industry` | VARCHAR(50) | UNIQUE NOT NULL | 업종 키 |
| `name` | VARCHAR(100) | NOT NULL | |
| `tone` | VARCHAR(50) | NOT NULL | |
| `description` | TEXT | | |
| `keywords` | TEXT[] | | |
| `sample_content` | TEXT | | |

---

### 14. keyword_opportunities (키워드 기회)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `keyword` | VARCHAR(200) | NOT NULL | UNIQUE(keyword, industry) |
| `industry` | VARCHAR(50) | NOT NULL | |
| `opportunity_score` | INTEGER | NOT NULL | 0~100 |
| `search_volume` | INTEGER | | |
| `competition_level` | VARCHAR(20) | | A+~D- |
| `trend_direction` | VARCHAR(20) | CHECK: rising, stable, declining | |
| `calculated_at` | TIMESTAMPTZ | DEFAULT NOW() | 캐시 만료 기준 (7일) |

---

### 15. content_metrics (콘텐츠 성과)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `content_id` | UUID | FK -> contents CASCADE, NOT NULL | |
| `channel_id` | UUID | FK -> channels SET NULL | |
| `views` | INTEGER | DEFAULT 0 | |
| `likes` | INTEGER | DEFAULT 0 | |
| `comments` | INTEGER | DEFAULT 0 | |
| `shares` | INTEGER | DEFAULT 0 | |
| `fetched_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 16. support_tickets (지원 티켓)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users CASCADE, NOT NULL | |
| `subject` | VARCHAR(200) | NOT NULL | |
| `message` | TEXT | NOT NULL | |
| `status` | VARCHAR(20) | CHECK: open, in_progress, resolved, closed | DEFAULT 'open' |
| `admin_reply` | TEXT | | |
| `replied_at` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 17. industries (업종 마스터)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `parent_id` | UUID | FK -> industries(self) CASCADE | 계층 구조 |
| `name` | VARCHAR(100) | NOT NULL | |
| `level` | INTEGER | CHECK: 1(대), 2(중), 3(소) | DEFAULT 1 |
| `sort_order` | INTEGER | DEFAULT 0 | |
| `is_active` | BOOLEAN | DEFAULT TRUE | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

시드(대분류 14개): 음식업, 뷰티/헬스, 의료, 교육, 숙박/여행, 인테리어/건설, 자동차, 반려동물, 전문직, 소매/쇼핑몰, 교회/종교, 공공/기관, IT/테크, 제조업

---

### 18. projects (파이프라인 프로젝트)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users, NOT NULL | |
| `keyword_id` | UUID | FK -> keywords SET NULL | |
| `keyword_text` | VARCHAR(200) | | FK 없이 텍스트 보관 |
| `business_type` | VARCHAR(10) | CHECK: B2B, B2C | DEFAULT 'B2C' |
| `current_step` | INTEGER | CHECK: 1~7 | DEFAULT 1 |
| `step_status` | JSONB | NOT NULL | `{ s1~s7: "pending"/"completed" }` |
| `topic_type` | VARCHAR(30) | CHECK: info, intro, service, product | |
| `selected_title` | VARCHAR(500) | | |
| `title_candidates` | JSONB | | 후보 제목 목록 |
| `custom_prompt` | TEXT | | |
| `prompt_mode` | VARCHAR(20) | CHECK: priority, combine, reference | DEFAULT 'combine' |
| `draft_content` | TEXT | | STEP4 초안 |
| `content_ids` | JSONB | DEFAULT '{}' | 채널별 콘텐츠 ID 매핑 |
| `settings_snapshot` | JSONB | | 생성 시점 설정 스냅샷 |
| `status` | VARCHAR(20) | CHECK: in_progress, completed, archived | DEFAULT 'in_progress' |
| `confirmed_at` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 19. image_scripts (이미지 스크립트)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `project_id` | UUID | FK -> projects CASCADE, NOT NULL | |
| `user_id` | UUID | FK -> users CASCADE, NOT NULL | |
| `content_id` | UUID | FK -> contents SET NULL | |
| `channel` | VARCHAR(20) | NOT NULL | |
| `ai_tool` | VARCHAR(50) | DEFAULT 'midjourney' | |
| `image_size` | VARCHAR(30) | DEFAULT '1080x1080' | |
| `image_style` | VARCHAR(20) | CHECK: photo, illustration | DEFAULT 'photo' |
| `style_detail` | VARCHAR(100) | | |
| `prompts` | JSONB | DEFAULT '[]' | 이미지 프롬프트 배열 |
| `thumbnail_prompt` | TEXT | | |
| `status` | VARCHAR(20) | CHECK: generating, generated, edited | DEFAULT 'generated' |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 20. video_scripts (영상 스토리보드)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `project_id` | UUID | FK -> projects CASCADE, NOT NULL | |
| `user_id` | UUID | FK -> users CASCADE, NOT NULL | |
| `content_id` | UUID | FK -> contents SET NULL | |
| `format` | VARCHAR(20) | CHECK: short, normal | DEFAULT 'short' |
| `target_channel` | VARCHAR(20) | DEFAULT 'youtube' | |
| `scene_count` | INTEGER | CHECK: 1~5 | DEFAULT 4 |
| `scene_duration` | INTEGER | CHECK: 3~10 (초) | DEFAULT 5 |
| `total_duration` | INTEGER | | 총 길이 (초) |
| `image_style` | VARCHAR(20) | CHECK: photo, illustration | DEFAULT 'photo' |
| `style_detail` | VARCHAR(100) | | |
| `storyboard` | JSONB | DEFAULT '[]' | 장면별 스토리보드 |
| `full_script` | TEXT | | 전체 스크립트 |
| `status` | VARCHAR(20) | CHECK: generating, generated, edited | DEFAULT 'generated' |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 21. user_prompts (사용자 프롬프트)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID PK | | |
| `user_id` | UUID | FK -> users CASCADE, NOT NULL | |
| `step` | VARCHAR(30) | NOT NULL | 채널/단계명 |
| `prompt_text` | TEXT | NOT NULL | |
| `mode` | VARCHAR(20) | CHECK: priority, combine, reference | DEFAULT 'combine' |
| `is_active` | BOOLEAN | DEFAULT TRUE | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

UNIQUE: (user_id, step) -- 유저당 단계별 1개

---

## 인덱스

| 테이블 | 인덱스 | 컬럼 |
|--------|--------|------|
| users | idx_users_email | email |
| users | idx_users_status | status |
| users | idx_users_role | role |
| users | idx_users_plan_id | plan_id |
| brand_voices | idx_brand_voices_user | user_id |
| keywords | idx_keywords_user | user_id |
| keywords | idx_keywords_user_group | user_id, group_name |
| keywords | idx_keywords_grade | grade |
| contents | idx_contents_user_status | user_id, status |
| contents | idx_contents_type | type |
| contents | idx_contents_user_created | user_id, created_at DESC |
| contents | idx_contents_keyword | keyword_id |
| contents | idx_contents_project | project_id |
| images | idx_images_user | user_id |
| images | idx_images_content | content_id |
| channels | idx_channels_user | user_id |
| channels | idx_channels_platform | user_id, platform |
| schedules | idx_schedules_status_time | status, scheduled_at |
| schedules | idx_schedules_user | user_id |
| schedules | idx_schedules_content | content_id |
| usage_logs | idx_usage_logs_user_date | user_id, created_at |
| usage_logs | idx_usage_logs_user_action_date | user_id, action_type, created_at |
| payments | idx_payments_user | user_id |
| payments | idx_payments_status | status |
| admin_prompts | idx_admin_prompts_step_active | step, is_active |
| email_logs | idx_email_logs_user | user_id |
| email_logs | idx_email_logs_created | created_at DESC |
| keyword_opportunities | idx_keyword_opps_industry | industry |
| keyword_opportunities | idx_keyword_opps_score | opportunity_score DESC |
| content_metrics | idx_content_metrics_content | content_id |
| content_metrics | idx_content_metrics_fetched | fetched_at DESC |
| support_tickets | idx_support_tickets_user | user_id |
| support_tickets | idx_support_tickets_status | status |
| support_tickets | idx_support_tickets_created | created_at DESC |
| industries | idx_industries_parent | parent_id |
| industries | idx_industries_level | level, sort_order |
| industries | idx_industries_active | is_active |
| projects | idx_projects_user | user_id |
| projects | idx_projects_user_status | user_id, status |
| projects | idx_projects_keyword | keyword_id |
| projects | idx_projects_updated | updated_at DESC |
| image_scripts | idx_image_scripts_project | project_id |
| image_scripts | idx_image_scripts_user | user_id |
| video_scripts | idx_video_scripts_project | project_id |
| video_scripts | idx_video_scripts_user | user_id |
| user_prompts | idx_user_prompts_user | user_id |
| user_prompts | idx_user_prompts_user_step | user_id, step |

---

## RLS (Row Level Security)

모든 21개 테이블에 RLS 활성화.

| 패턴 | 테이블 | 규칙 |
|------|--------|------|
| 본인 데이터만 | brand_voices, keywords, contents, images, channels, schedules, projects, image_scripts, video_scripts, user_prompts | `user_id = auth.uid()` |
| 본인 + 관리자 | users, usage_logs, payments, support_tickets | `user_id = auth.uid() OR role IN ('admin', 'super_admin')` |
| 전체 읽기 | plans, brand_voice_presets, keyword_opportunities, industries | `SELECT USING (true)` |
| 관리자만 | admin_prompts, email_logs | `role IN ('admin', 'super_admin')` |
| 콘텐츠 소유자 | content_metrics | `content.user_id = auth.uid()` (조인) |

---

## 트리거

`update_updated_at()` 함수: BEFORE UPDATE 시 `updated_at = NOW()` 자동 설정.

적용 테이블: users, brand_voices, contents, channels, projects, industries, image_scripts, video_scripts, user_prompts
