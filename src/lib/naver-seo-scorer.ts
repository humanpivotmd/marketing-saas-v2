// --- Naver SEO Score Calculator ---
// 텍스트 기반 평가만 수행 (이미지/링크는 AI 생성 콘텐츠에 없으므로 제외)

export interface SeoScoreResult {
  total: number
  details: {
    titleKeyword: number
    keywordDensity: number
    contentLength: number
    headingStructure: number
    readability: number
    introKeyword: number
    keywordVariation: number
  }
  suggestions: string[]
}

interface SeoInput {
  title: string
  body: string
  keyword: string
  hashtags?: string[]
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function calculateSeoScore(input: SeoInput): SeoScoreResult {
  const { title, body, keyword } = input
  const suggestions: string[] = []

  if (!body) {
    return {
      total: 0,
      details: { titleKeyword: 0, keywordDensity: 0, contentLength: 0, headingStructure: 0, readability: 0, introKeyword: 0, keywordVariation: 0 },
      suggestions: ['콘텐츠 본문을 입력하세요'],
    }
  }

  const plainText = body.replace(/<[^>]*>/g, '')
  const charCount = plainText.length

  // 1. 제목 키워드 포함 (15점)
  let titleKeyword = 0
  if (keyword && title) {
    if (title.includes(keyword)) {
      titleKeyword = 15
    } else {
      const kwParts = keyword.split(' ').filter(Boolean)
      const matchCount = kwParts.filter((p) => title.includes(p)).length
      titleKeyword = Math.round((matchCount / kwParts.length) * 10)
      suggestions.push(`제목에 키워드 "${keyword}"를 포함하세요`)
    }
  }

  // 2. 키워드 밀도 (20점) — 2~3% 최적
  let keywordDensity = 0
  if (keyword && charCount > 0) {
    const keywordCount = (plainText.match(new RegExp(escapeRegExp(keyword), 'g')) || []).length
    const density = (keywordCount * keyword.length) / charCount * 100

    if (density >= 1.5 && density <= 4) {
      keywordDensity = 20
    } else if (density >= 1 && density <= 5) {
      keywordDensity = 15
    } else if (density > 5) {
      keywordDensity = 5
      suggestions.push('키워드 밀도가 너무 높습니다 (5% 이상). 자연스럽게 줄여주세요')
    } else if (density > 0) {
      keywordDensity = 10
      suggestions.push('키워드 밀도가 낮습니다. 본문에 키워드를 더 자연스럽게 포함하세요')
    } else {
      keywordDensity = 0
      suggestions.push('본문에 키워드가 전혀 없습니다')
    }
  }

  // 3. 콘텐츠 길이 (15점) — 네이버 블로그 1,500~3,500자 최적
  let contentLength = 0
  if (charCount >= 1500 && charCount <= 3500) {
    contentLength = 15
  } else if (charCount >= 1000 && charCount <= 5000) {
    contentLength = 12
  } else if (charCount >= 500) {
    contentLength = 8
    suggestions.push('콘텐츠가 짧습니다. 1,500자 이상 작성하면 SEO에 유리합니다')
  } else {
    contentLength = 3
    suggestions.push('콘텐츠가 매우 짧습니다. 최소 1,000자 이상 작성하세요')
  }

  // 4. 소제목 구조 (15점) — H2, H3 사용
  let headingStructure = 0
  const h2Count = (body.match(/<h2|##\s/g) || []).length
  const h3Count = (body.match(/<h3|###\s/g) || []).length
  if (h2Count >= 2 && h3Count >= 1) {
    headingStructure = 15
  } else if (h2Count >= 1) {
    headingStructure = 10
    suggestions.push('소제목(H3)을 추가하면 SEO 점수가 올라갑니다')
  } else {
    headingStructure = 3
    suggestions.push('소제목(H2, H3)을 사용하여 글의 구조를 잡으세요')
  }

  // 5. 가독성 (15점) — 문단 수, 문단 길이
  let readability = 0
  const paragraphs = plainText.split(/\n\s*\n/).filter(Boolean)
  const avgParaLength = paragraphs.length > 0
    ? plainText.length / paragraphs.length
    : plainText.length

  if (paragraphs.length >= 5 && avgParaLength <= 300) {
    readability = 15
  } else if (paragraphs.length >= 3) {
    readability = 10
  } else {
    readability = 5
    suggestions.push('문단을 더 나누어 가독성을 높이세요')
  }

  // 6. 도입부 키워드 (10점) — 첫 200자 내 키워드 포함
  let introKeyword = 0
  if (keyword) {
    const intro = plainText.substring(0, 200)
    if (intro.includes(keyword)) {
      introKeyword = 10
    } else {
      introKeyword = 0
      suggestions.push('글 도입부(첫 200자)에 키워드를 포함하면 네이버 SEO에 유리합니다')
    }
  }

  // 7. 키워드 변형/유의어 분포 (10점) — 키워드 부분 매칭이 본문 전체에 분포
  let keywordVariation = 0
  if (keyword && charCount > 0) {
    const kwParts = keyword.split(' ').filter((p) => p.length >= 2)
    if (kwParts.length >= 2) {
      const matchedParts = kwParts.filter((p) => plainText.includes(p)).length
      keywordVariation = Math.round((matchedParts / kwParts.length) * 10)
    } else {
      // 단일 키워드: 본문을 3등분해서 각 구간에 키워드가 있는지
      const third = Math.floor(charCount / 3)
      const sections = [
        plainText.substring(0, third),
        plainText.substring(third, third * 2),
        plainText.substring(third * 2),
      ]
      const distributed = sections.filter((s) => s.includes(keyword)).length
      keywordVariation = Math.round((distributed / 3) * 10)
      if (distributed < 3) {
        suggestions.push('키워드를 글 전체에 고르게 분포시키세요')
      }
    }
  }

  const total = titleKeyword + keywordDensity + contentLength + headingStructure +
    readability + introKeyword + keywordVariation

  return {
    total: Math.min(100, total),
    details: {
      titleKeyword,
      keywordDensity,
      contentLength,
      headingStructure,
      readability,
      introKeyword,
      keywordVariation,
    },
    suggestions,
  }
}
