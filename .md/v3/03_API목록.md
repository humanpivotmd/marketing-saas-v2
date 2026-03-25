# v3 API 엔드포인트 목록

## 1. 프로젝트 관리

### GET /api/projects
프로젝트 목록 조회 (페이지네이션, 필터).

- 인증: requireAuth (Bearer 토큰)
- 쿼리파라미터: `status`, `keyword_id`, `page` (기본 1), `limit` (기본 20)
- 소유권: user_id = 인증 사용자
- 응답:
```json
{
  "success": true,
  "data": [{ "id": "uuid", "keyword_text": "...", "business_type": "B2C", "current_step": 5, "step_status": {...}, "status": "in_progress", ... }],
  "total": 42
}
```

### POST /api/projects
프로젝트 생성. 유저 프로필에서 설정 스냅샷을 자동 캡처.

- 인증: requireAuth
- 요청:
```json
{
  "keyword_id": "uuid (선택)",
  "keyword_text": "마케팅 자동화",
  "business_type": "B2B (선택, 프로필 기본값 사용)"
}
```
- 동작: users 테이블에서 business_type, selected_channels, target_audience 등 10개 필드를 settings_snapshot으로 저장. industry_id는 industries 테이블에서 이름으로 변환.
- current_step: 3으로 초기화 (STEP1, 2는 이미 완료된 것으로 간주)
- 응답:
```json
{ "success": true, "data": { "id": "uuid", ... } }
```

### GET /api/projects/:id
프로젝트 상세 + 연결된 contents 목록.

- 인증: requireAuth
- 소유권: user_id = 인증 사용자
- 응답: 프로젝트 전체 필드 + `contents` 배열 (id, type, title, body, hashtags, status, confirmed_at, word_count, seo_score, created_at)

### PATCH /api/projects/:id
프로젝트 업데이트 (단계 진행, 데이터 저장).

- 인증: requireAuth
- 소유권: user_id = 인증 사용자
- 허용 필드: `current_step`, `step_status`, `topic_type`, `selected_title`, `title_candidates`, `custom_prompt`, `prompt_mode`, `draft_content`, `content_ids`, `status`, `confirmed_at`, `business_type`
- 요청 예시:
```json
{
  "current_step": 4,
  "step_status": { "s1": "completed", "s2": "completed", "s3": "completed", "s4": "pending", ... },
  "selected_title": "선택된 제목"
}
```

### DELETE /api/projects/:id
프로젝트 삭제.

- 인증: requireAuth
- 소유권: user_id = 인증 사용자

---

## 2. AI 생성 API

모든 생성 API에 공통 적용:
- Rate Limit: `generateRateLimit` (분당 10회, IP + path 기반)
- AI 모델: `claude-sonnet-4-20250514`
- API 키: `ANTHROPIC_API_KEY || CLAUDE_API_KEY`

### POST /api/generate/titles
제목 5개 생성 (STEP3).

- 인증: requireAuth
- Rate Limit: generateRateLimit
- 입력 검증: sanitizeInput (keyword, company_name, service_name, target_audience), sanitizePromptInput (custom_prompt)
- 요청:
```json
{
  "keyword": "마케팅 자동화",
  "business_type": "B2B",
  "company_name": "마케팅플로우",
  "service_name": "AI 콘텐츠 생성",
  "topic_type": "service",
  "tone": "professional",
  "custom_prompt": "CTA를 강조해주세요",
  "prompt_mode": "combine"
}
```
- max_tokens: 1024
- 응답:
```json
{
  "success": true,
  "data": {
    "titles": ["제목1", "제목2", "제목3", "제목4", "제목5"],
    "tokens": 512
  }
}
```
- usage_logs: action_type = `title_generate`

### POST /api/generate/draft
핵심 초안 생성 (STEP4).

- 인증: requireAuth
- Rate Limit: generateRateLimit
- 요청:
```json
{ "project_id": "uuid" }
```
- 동작:
  - 프로젝트 조회 + 소유권 검증
  - 이미 초안이 있고 s4=completed이면 스킵 (중복 생성 방지)
  - settings_snapshot에서 PipelineContext 구성
  - max_tokens: 4096
  - 결과를 projects.draft_content에 저장, current_step=5, s4=completed
- usage_logs: action_type = `draft_generate`
- 응답:
```json
{ "success": true, "data": { "tokens": 1234 } }
```

### POST /api/generate/pipeline
채널별 콘텐츠 생성 (STEP5). SSE 스트림 응답.

- 인증: requireAuth
- Rate Limit: generateRateLimit
- 요청:
```json
{ "project_id": "uuid" }
```
- 동작:
  - settings_snapshot.selected_channels에서 채널 목록 추출
  - blog가 있으면 먼저 생성 (다른 채널의 소스로 사용)
  - 채널별 순차 호출, 각 결과를 contents 테이블에 저장
  - 채널 완료 시마다 projects.content_ids 즉시 업데이트 (SSE 이탈 대비)
  - 전체 완료 시 current_step=6, s4+s5=completed
- max_tokens: blog=4096, 나머지=2048
- SSE 이벤트:
```
data: {"type":"progress","channel":"blog","message":"blog 생성 중..."}
data: {"type":"channel_done","channel":"blog","contentId":"uuid","wordCount":2500}
data: {"type":"done","contentIds":{"blog":"uuid","threads":"uuid",...}}
data: {"type":"error","channel":"threads","message":"threads 생성 실패"}
```
- Content-Type: `text/event-stream`
- usage_logs: 채널별 action_type = `content_create`

### POST /api/generate/image-script
이미지 프롬프트 생성 (STEP6).

- 인증: requireAuth
- Rate Limit: generateRateLimit
- 요청:
```json
{
  "project_id": "uuid",
  "channel": "blog",
  "ai_tool": "Midjourney",
  "image_size": "1200x630",
  "image_style": "photo",
  "style_detail": "미니멀"
}
```
- 동작:
  - 같은 채널의 기존 image_scripts 삭제 후 재생성 (중복 방지)
  - 해당 채널 콘텐츠 본문 참조
  - max_tokens: 2048
  - 결과를 image_scripts 테이블에 저장, s6=completed
- 응답:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "channel": "blog",
    "images": [
      { "seq": 1, "description_ko": "설명", "prompt_en": "영문 프롬프트", "placement": "본문 상단" }
    ],
    "thumbnail": { "description_ko": "썸네일 설명", "prompt_en": "영문 프롬프트" },
    "tokens": 890
  }
}
```
- usage_logs: action_type = `image_script_generate`

### POST /api/generate/video-script
영상 스크립트 생성 (STEP7).

- 인증: requireAuth
- Rate Limit: generateRateLimit
- 요청:
```json
{
  "project_id": "uuid",
  "format": "short",
  "target_channel": "youtube",
  "scene_count": 4,
  "scene_duration": 5,
  "image_style": "photo",
  "style_detail": "모던"
}
```
- 동작:
  - 블로그 콘텐츠가 있으면 참조
  - max_tokens: 2048
  - 결과를 video_scripts 테이블에 저장, 기존 동일 프로젝트 video_scripts 삭제 (중복 방지)
  - s7=completed
- 응답:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "영상 제목",
    "totalDuration": 20,
    "storyboard": [
      { "scene": 1, "duration": 5, "visual": "...", "narration": "...", "text_overlay": "...", "transition": "fade" }
    ],
    "tokens": 1100
  }
}
```
- usage_logs: action_type = `video_script_generate`

---

## 3. 마이페이지 / 설정 API

### GET /api/mypage/business-profile
비즈니스 프로필 조회.

- 인증: requireAuth
- 응답 필드: business_type, selected_channels, target_audience, target_gender, fixed_keywords, blog_category, industry_id, company_name, service_name, writing_tone

### PUT /api/mypage/business-profile
비즈니스 프로필 저장.

- 인증: requireAuth
- 유효성 검사: business_type은 B2B/B2C, target_gender는 male/female/all
- 허용 필드: 위 10개 필드만 업데이트

---

## 4. 업종 API

### GET /api/industries
업종 목록 조회 (활성 업종만, 트리 구조 반환).

- 인증: requireAuth
- 응답:
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "음식업", "level": 1, "children": [
      { "id": "uuid", "name": "카페", "level": 2, "children": [] }
    ]}
  ]
}
```

---

## 5. 캘린더 API

### GET /api/calendar
날짜 범위 내 발행 예정 콘텐츠 조회.

- 인증: requireAuth
- 소유권: user_id = 인증 사용자
- 쿼리파라미터: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)
- 필터: scheduled_date가 NULL이 아닌 콘텐츠만
- 응답: 날짜별 그룹핑
```json
{
  "success": true,
  "data": {
    "2026-03-25": [
      { "id": "uuid", "type": "blog", "title": "...", "status": "confirmed", "scheduled_date": "2026-03-25", "word_count": 2500 }
    ]
  }
}
```
