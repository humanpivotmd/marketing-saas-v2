// --- Naver SEO Score Calculator ---

export interface SeoScoreResult {
  total: number
  details: {
    titleKeyword: number
    keywordDensity: number
    contentLength: number
    headingStructure: number
    imagePresence: number
    linkPresence: number
    readability: number
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
  const { title, body, keyword, hashtags } = input
  const suggestions: string[] = []

  if (!body) {
    return {
      total: 0,
      details: { titleKeyword: 0, keywordDensity: 0, contentLength: 0, headingStructure: 0, imagePresence: 0, linkPresence: 0, readability: 0 },
      suggestions: ['콘텐츠 본문을 입력하세요'],
    }
  }

  const plainText = body.replace(/<[^>]*>/g, '')
  const wordCount = plainText.length

  // 1. Title keyword presence (15 points)
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

  // 2. Keyword density (20 points) — target 2-3%
  let keywordDensity = 0
  if (keyword && wordCount > 0) {
    const keywordCount = (plainText.match(new RegExp(escapeRegExp(keyword), 'g')) || []).length
    const density = (keywordCount * keyword.length) / wordCount * 100

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

  // 3. Content length (15 points) — 1500-3000 chars ideal for Naver blog
  let contentLength = 0
  if (wordCount >= 1500 && wordCount <= 3500) {
    contentLength = 15
  } else if (wordCount >= 1000 && wordCount <= 5000) {
    contentLength = 12
  } else if (wordCount >= 500) {
    contentLength = 8
    suggestions.push('콘텐츠가 짧습니다. 1,500자 이상 작성하면 SEO에 유리합니다')
  } else {
    contentLength = 3
    suggestions.push('콘텐츠가 매우 짧습니다. 최소 1,000자 이상 작성하세요')
  }

  // 4. Heading structure (15 points) — H2, H3 presence
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

  // 5. Image presence (10 points)
  let imagePresence = 0
  const imgCount = (body.match(/<img|!\[/g) || []).length
  if (imgCount >= 3) {
    imagePresence = 10
  } else if (imgCount >= 1) {
    imagePresence = 7
    suggestions.push('이미지를 3개 이상 포함하면 네이버 SEO에 유리합니다')
  } else {
    imagePresence = 0
    suggestions.push('이미지를 추가하세요. 네이버는 이미지가 있는 글을 선호합니다')
  }

  // 6. Link presence (10 points)
  let linkPresence = 0
  const linkCount = (body.match(/<a\s|https?:\/\//g) || []).length
  if (linkCount >= 2) {
    linkPresence = 10
  } else if (linkCount >= 1) {
    linkPresence = 7
  } else {
    linkPresence = 3
    suggestions.push('관련 링크를 추가하면 SEO 점수가 올라갑니다')
  }

  // 7. Readability (15 points) — paragraph length, sentence variation
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

  // Bonus for hashtags
  if (hashtags && hashtags.length >= 5) {
    // small bonus already factored into total
  }

  const total = titleKeyword + keywordDensity + contentLength + headingStructure +
    imagePresence + linkPresence + readability

  return {
    total: Math.min(100, total),
    details: {
      titleKeyword,
      keywordDensity,
      contentLength,
      headingStructure,
      imagePresence,
      linkPresence,
      readability,
    },
    suggestions,
  }
}
