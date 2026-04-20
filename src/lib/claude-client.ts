// Claude API 공통 클라이언트 — system/user 프롬프트 분리

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'

interface ClaudeOptions {
  system: string
  user: string
  maxTokens?: number
  temperature?: number
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>
  usage: { input_tokens: number; output_tokens: number }
}

export async function callClaude(options: ClaudeOptions): Promise<ClaudeResponse> {
  const { system, user, maxTokens = 4096, temperature = 0.7 } = options

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user' as const, content: user }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error (${res.status}): ${err}`)
  }

  return res.json()
}

/**
 * 기존 단일 프롬프트를 system/user로 분리하는 헬퍼
 * system: AI 역할 + 규칙 (사용자가 조작할 수 없는 부분)
 * user: 사용자 입력 + 컨텍스트 (사용자가 커스텀 가능한 부분)
 */
export function splitPrompt(fullPrompt: string): { system: string; user: string } {
  // "당신은 ~입니다." 로 시작하는 첫 문단을 system으로 분리
  const lines = fullPrompt.split('\n')
  const systemLines: string[] = []
  const userLines: string[] = []
  let inSystem = true

  for (const line of lines) {
    if (inSystem) {
      // [조건], [지시], [원본], [출력 형식] 등이 나오면 user 영역 시작
      if (/^\[(?:조건|지시|원본|출력|변환|콘텐츠|영상|이미지)/.test(line.trim())) {
        inSystem = false
        userLines.push(line)
      } else {
        systemLines.push(line)
      }
    } else {
      userLines.push(line)
    }
  }

  return {
    system: systemLines.join('\n').trim() || 'You are a helpful assistant.',
    user: userLines.join('\n').trim() || fullPrompt,
  }
}
