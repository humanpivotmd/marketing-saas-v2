# Threads 채널 가이드

> STEP5 파이프라인에서 블로그 초안을 Threads 형식으로 변환하고, Threads API를 통해 직접 발행한다.

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 채널 변환 | `/api/generate/pipeline` (channel: threads) |
| 발행 API | `/api/publish/threads` |
| AI 모델 | `claude-sonnet-4-20250514` / max_tokens: 2048 |
| Threads API | Graph API v1.0 (graph.threads.net) |

---

## 2. 채널 변환 규격

### B2B Threads

| 항목 | 규격 |
|------|------|
| 형식 | Threads (B2B 인사이트) |
| 분량 | 200~400자 |
| 톤 | 전문적이되 간결한 톤 |
| 내용 | 핵심 데이터 1개 + 인사이트 |
| 해시태그 | 3~5개 (업계 키워드) |

**B2B 예시:**
```
마케팅 자동화 도입 기업의 73%가
리드 전환율이 2배 이상 증가했습니다.

핵심은 "자동화 범위"가 아니라
"자동화 타이밍"입니다.

잠재 고객이 콘텐츠를 3회 이상 소비한 시점에
자동 이메일을 보내는 것이 가장 효과적이었습니다.

#마케팅자동화 #B2B마케팅 #리드전환 #SaaS
```

### B2C Threads

| 항목 | 규격 |
|------|------|
| 형식 | Threads (B2C 대화형) |
| 분량 | 100~300자 |
| 톤 | 대화체, 이모지 2~4개 |
| 내용 | 첫 줄 후킹 (질문/충격적 사실) |
| 해시태그 | 5~10개 |

**B2C 예시:**
```
카페 인테리어 하나만 바꿔도
매출이 30% 올랐다는 거 알아요?

좌석 배치를 '흐름형'에서 '섬형'으로 바꾸면
체류 시간이 평균 20분 늘어나요

비밀은 동선 설계에 있습니다

#카페인테리어 #카페창업 #인테리어팁 #카페디자인 #소자본창업 #카페꿀팁
```

---

## 3. 변환 프로세스

```
블로그 초안 (draftContent)
  ↓ 또는
블로그 완성본 (blogContent)
  ↓
buildChannelPrompt(ctx, 'threads')
  ↓
Claude API → Threads 형식 텍스트
  ↓
contents 테이블 저장 (type: 'threads')
```

**원본 참조 우선순위:**
1. `blogContent` (블로그 채널 완성본이 있으면 우선 사용)
2. `draftContent` (블로그가 없으면 초안 사용)
3. 원본의 처음 3,000자만 프롬프트에 포함

---

## 4. Threads API 발행

### API: `/api/publish/threads`

```
POST /api/publish/threads
Content-Type: application/json
Authorization: Bearer {token}

{
  "content_id": "uuid-...",
  "image_url": "https://..."  // 선택
}
```

**요청 파라미터:**

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| content_id | O | uuid | 발행할 콘텐츠 ID |
| image_url | - | URL | 첨부 이미지 URL |

### 발행 플로우 (2단계)

#### Step 1: 미디어 컨테이너 생성

```
POST https://graph.threads.net/v1.0/{user_id}/threads
{
  "text": "콘텐츠 본문...",
  "media_type": "TEXT",        // 또는 "IMAGE" (이미지 첨부 시)
  "image_url": "https://...",  // 이미지 첨부 시
  "access_token": "..."
}
```

- `media_type`: 이미지 URL이 있으면 `IMAGE`, 없으면 `TEXT`

#### Step 2: 발행

```
POST https://graph.threads.net/v1.0/{user_id}/threads_publish
{
  "creation_id": "container_id",
  "access_token": "..."
}
```

### 사전 조건

| 조건 | 설명 |
|------|------|
| 채널 연동 | `channels` 테이블에 platform='threads' 레코드 필요 |
| access_token | Threads Graph API 장기 토큰 |
| platform_user_id | Threads 사용자 ID |

연동되지 않은 경우 `"Threads 계정이 연동되지 않았습니다."` 에러 반환.

### 발행 후 처리

발행 성공 시:
- `contents.status` → `'published'`
- `contents.published_at` → 현재 시각
- `contents.meta.platform_post_id` → Threads 게시물 ID
- `contents.meta.platform` → `'threads'`

---

## 5. B2B Threads 작성 전략

### 콘텐츠 구조

```
[후킹 — 데이터/인사이트 1문장]

[핵심 메시지 2~3문장]

[실행 가능한 팁 1개]

#해시태그1 #해시태그2 #해시태그3
```

### 효과적인 패턴

| 패턴 | 예시 |
|------|------|
| 데이터 후킹 | "SaaS 기업의 67%가 ___를 하고 있습니다" |
| 반직관 인사이트 | "마케팅 자동화의 핵심은 자동화가 아닙니다" |
| 리스트형 | "B2B 콘텐츠 마케팅 3원칙" |
| 질문형 | "왜 B2B 기업은 블로그에 집착할까요?" |

### B2B 해시태그 전략

- 업계 전문 태그 3~5개
- 일반 마케팅 태그 보다 니치 태그 우선
- 예: `#B2B마케팅` `#SaaS성장` `#마케팅자동화` `#리드제너레이션`

---

## 6. B2C Threads 작성 전략

### 콘텐츠 구조

```
[후킹 — 질문 또는 충격적 사실]

[스토리/공감 2~3문장]

[핵심 정보 1~2문장]

#해시태그1 #해시태그2 ... #해시태그10
```

### 효과적인 패턴

| 패턴 | 예시 |
|------|------|
| 질문 후킹 | "이거 나만 몰랐어?" |
| 숫자 후킹 | "30% 할인보다 효과적인 것" |
| 공감형 | "카페 가면 꼭 이러는 사람 있지 않아요?" |
| 꿀팁형 | "인테리어 전문가가 절대 안 하는 3가지" |

### B2C 해시태그 전략

- 트렌드 태그 + 니치 태그 혼합 5~10개
- 감성/라이프스타일 태그 포함
- 예: `#카페추천` `#카페인테리어` `#데이트코스` `#감성카페` `#카페투어` `#인스타카페`

---

## 7. 업종별 Threads 팁

| 업종 | B2B 포인트 | B2C 포인트 |
|------|-----------|-----------|
| 음식업 | 식자재 트렌드, F&B 시장 데이터 | 맛집 후기, 메뉴 소개, 꿀팁 |
| 의료 | 의료 트렌드, 의학 지식 공유 | 건강 팁, 생활 의학 상식 |
| 교육 | 교육 시장 동향, 커리큘럼 혁신 | 학습법, 합격 후기, 동기부여 |
| 뷰티 | 뷰티 산업 트렌드, 원료 이야기 | 시술 후기, 뷰티 팁, 제품 추천 |
| IT | 기술 트렌드, 도입 사례 | 앱 추천, 테크 팁, 생산성 도구 |

---

## 참조 파일

| 파일 | 역할 |
|------|------|
| `src/lib/prompts/pipeline.ts` | `buildChannelPrompt(ctx, 'threads')` — Threads 변환 프롬프트 |
| `src/app/api/generate/pipeline/route.ts` | 채널별 변환 API (SSE 스트리밍) |
| `src/app/api/publish/threads/route.ts` | Threads API 발행 |
