# ADK Patterns — Claude API 안전 규칙

## 🛡️ Claude 출력 검증

> Claude가 JSON을 반환하는 모든 generate API는 `parseClaudeJson()`으로 검증.
> 파일: `src/lib/claude-parser.ts`

| API | 스키마 |
|---|---|
| `api/generate/titles/route.ts` | `TitlesOutputSchema` |
| `api/generate/image-script/route.ts` | `ImageScriptOutputSchema` |
| `api/generate/video-script/route.ts` | `VideoScriptOutputSchema` |
| `api/generate/pipeline/route.ts` | 채널별 텍스트 최소 길이 검증 |

```typescript
import { parseClaudeJson, TitlesOutputSchema } from '@/lib/claude-parser'
const validated = parseClaudeJson(TitlesOutputSchema, response.content[0].text)
```

**규칙**:
- Claude 응답 → `parseClaudeJson()` 없이 바로 사용 금지
- 파싱 실패 시 → 1회 재시도 → 실패 시 500 반환
- 새 generate API 추가 시 → 반드시 스키마 추가

---

## 🔁 SSE 중복 실행 방지

> STEP5/6/7 generate API는 반드시 `preventDuplicateStep()`으로 시작.
> 파일: `src/lib/pipeline-guard.ts`

| API | stepKey |
|---|---|
| `api/generate/pipeline/route.ts` | `'s5'` |
| `api/generate/image-script/route.ts` | `'s6'` |
| `api/generate/video-script/route.ts` | `'s7'` |

```typescript
import { preventDuplicateStep } from '@/lib/pipeline-guard'
const guard = await preventDuplicateStep(supabase, project_id, userId, 's5')
if (guard.shouldSkip) return NextResponse.json({ success: true, skipped: true })
```

**규칙**:
- 위 3개 API에 guard 없이 로직 진행 금지
- `generating` 상태에 중복 호출 → skip (에러 아님)
- 생성 실패 시 → `s{n}: 'failed'` 업데이트 필수 (generating 방치 금지)
- ⚠️ SELECT → UPDATE 사이 이론적 race condition. 실무 위험 낮음 (SSE 단일 클라이언트).

---

## 🔀 System/User 프롬프트 분리

> 모든 Claude API 호출은 system과 user 메시지를 분리.
> 파일: `src/lib/prompts/pipeline.ts` (🔴 위험 파일)

- **system**: 역할 정의, B2B/B2C 원칙, 출력 형식 (불변)
- **user**: keyword, 회사명, 초안 등 가변 데이터
- user 메시지 삽입 전 반드시 `sanitizeInput()` / `sanitizePromptInput()`
- 단일 user 메시지로 합치는 방식 금지
