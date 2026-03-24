# MarketingFlow — Figma Style Guide

코드에서 정의된 디자인 토큰을 Figma 스타일로 관리하기 위한 가이드.

---

## 1. Color Styles (색상)

### Background (배경)
| Figma Style Name | HEX | 용도 |
|-----------------|-----|------|
| `Color/BG/Primary` | `#0D1117` | 메인 배경 |
| `Color/BG/Secondary` | `#161B22` | 카드, 사이드바 배경 |
| `Color/BG/Tertiary` | `#21262D` | 입력 필드 배경 |
| `Color/BG/Elevated` | `#1C2128` | 드롭다운, 모달 배경 |

### Text (텍스트)
| Figma Style Name | HEX | 용도 |
|-----------------|-----|------|
| `Color/Text/Primary` | `#E6EDF3` | 제목, 본문 |
| `Color/Text/Secondary` | `#9CA3AF` | 보조 텍스트 |
| `Color/Text/Tertiary` | `#8B949E` | 비활성, 힌트 |
| `Color/Text/Inverse` | `#0D1117` | 밝은 배경 위 텍스트 |
| `Color/Text/Link` | `#2F81F7` | 링크 |

### Accent (강조)
| Figma Style Name | HEX | 용도 |
|-----------------|-----|------|
| `Color/Accent/Primary` | `#2F81F7` | CTA 버튼, 활성 상태 |
| `Color/Accent/Primary-Hover` | `#388BFD` | 호버 |
| `Color/Accent/Primary-Muted` | `rgba(47,129,247,0.15)` | 배경 강조 |
| `Color/Accent/Secondary` | `#8B5CF6` | 보조 강조 (보라) |
| `Color/Accent/Secondary-Hover` | `#9D6FF8` | 보조 호버 |
| `Color/Accent/Success` | `#3FB950` | 성공 |
| `Color/Accent/Warning` | `#D29922` | 경고 |
| `Color/Accent/Error` | `#F85149` | 에러 |

### Border (테두리)
| Figma Style Name | HEX | 용도 |
|-----------------|-----|------|
| `Color/Border/Default` | `rgba(240,246,252,0.1)` | 기본 테두리 |
| `Color/Border/Hover` | `rgba(240,246,252,0.2)` | 호버 테두리 |
| `Color/Border/Active` | `rgba(240,246,252,0.3)` | 활성 테두리 |

---

## 2. Text Styles (타이포그래피)

**Font Family:** Pretendard Variable

| Figma Style Name | Size | Weight | Line Height | 용도 |
|-----------------|------|--------|-------------|------|
| `Text/Display` | 48px | Bold (700) | 1.2 | 히어로 제목 |
| `Text/Heading-1` | 32px | Bold (700) | 1.3 | 페이지 제목 |
| `Text/Heading-2` | 24px | Bold (700) | 1.3 | 섹션 제목 |
| `Text/Heading-3` | 20px | SemiBold (600) | 1.4 | 카드 제목 |
| `Text/Body-LG` | 18px | Regular (400) | 1.6 | 큰 본문 |
| `Text/Body` | 16px | Regular (400) | 1.6 | 기본 본문 |
| `Text/Body-SM` | 14px | Regular (400) | 1.5 | 보조 본문 |
| `Text/Caption` | 13px | Medium (500) | 1.4 | 레이블, 캡션 |
| `Text/Small` | 12px | Regular (400) | 1.4 | 힌트, 하단 |
| `Text/Badge` | 11px | SemiBold (600) | 1.2 | 뱃지, 태그 |

---

## 3. Effect Styles (효과)

| Figma Style Name | 값 | 용도 |
|-----------------|---|------|
| `Effect/Shadow-SM` | `0 1px 2px rgba(0,0,0,0.3)` | 카드 기본 |
| `Effect/Shadow-MD` | `0 4px 12px rgba(0,0,0,0.4)` | 호버 |
| `Effect/Shadow-LG` | `0 8px 24px rgba(0,0,0,0.5)` | 모달, 드롭다운 |
| `Effect/Glow-Blue` | `0 0 20px rgba(47,129,247,0.15)` | 강조 카드 |
| `Effect/Glow-Purple` | `0 0 20px rgba(139,92,246,0.15)` | 보조 강조 |

---

## 4. Border Radius

| Token | 값 | 용도 |
|-------|---|------|
| `Radius/SM` | 6px | 입력 필드, 뱃지 |
| `Radius/MD` | 8px | 버튼 |
| `Radius/LG` | 12px | 카드 |
| `Radius/XL` | 16px | 큰 카드 |
| `Radius/2XL` | 20px | 모달 |
| `Radius/Full` | 9999px | 원형 (아바타, 토글) |

---

## 5. Spacing Scale

| Token | 값 | 용도 |
|-------|---|------|
| `Space/XS` | 4px | 아이콘-텍스트 간격 |
| `Space/SM` | 8px | 내부 패딩 작은 |
| `Space/MD` | 12px | 요소 간 간격 |
| `Space/LG` | 16px | 카드 내부 패딩 |
| `Space/XL` | 24px | 섹션 내 간격 |
| `Space/2XL` | 32px | 섹션 간 간격 |
| `Space/3XL` | 48px | 큰 섹션 간격 |
| `Space/4XL` | 64px | 페이지 패딩 |

---

## 6. Layout

| Token | 값 |
|-------|---|
| Sidebar Width | 240px |
| Sidebar Collapsed | 64px |
| Touch Target Min | 44px |
| Max Content Width | 1024px (max-w-5xl) |
| Nav Height | 64px (h-16) |

---

## Figma 적용 방법

### 방법 1: 수동 생성
1. Figma 파일 열기
2. 아무 요소도 선택하지 않은 상태에서 오른쪽 패널 > Local Styles
3. Color: + 버튼 > 이름 `Color/BG/Primary` > 값 `#0D1117`
4. Text: 텍스트 선택 > Text 패널 :: > + > 이름 `Text/Heading-1`
5. Effect: 효과 적용 후 :: > + > 이름 `Effect/Shadow-SM`

### 방법 2: Figma Tokens Studio 플러그인 (권장)
1. Figma 플러그인 > "Tokens Studio" 설치
2. JSON 형식으로 토큰 가져오기:

```json
{
  "color": {
    "bg": {
      "primary": { "value": "#0D1117", "type": "color" },
      "secondary": { "value": "#161B22", "type": "color" },
      "tertiary": { "value": "#21262D", "type": "color" }
    },
    "text": {
      "primary": { "value": "#E6EDF3", "type": "color" },
      "secondary": { "value": "#9CA3AF", "type": "color" },
      "tertiary": { "value": "#8B949E", "type": "color" },
      "link": { "value": "#2F81F7", "type": "color" }
    },
    "accent": {
      "primary": { "value": "#2F81F7", "type": "color" },
      "secondary": { "value": "#8B5CF6", "type": "color" },
      "success": { "value": "#3FB950", "type": "color" },
      "warning": { "value": "#D29922", "type": "color" },
      "error": { "value": "#F85149", "type": "color" }
    }
  },
  "fontSize": {
    "display": { "value": "48", "type": "fontSizes" },
    "heading-1": { "value": "32", "type": "fontSizes" },
    "heading-2": { "value": "24", "type": "fontSizes" },
    "heading-3": { "value": "20", "type": "fontSizes" },
    "body-lg": { "value": "18", "type": "fontSizes" },
    "body": { "value": "16", "type": "fontSizes" },
    "body-sm": { "value": "14", "type": "fontSizes" },
    "caption": { "value": "13", "type": "fontSizes" },
    "small": { "value": "12", "type": "fontSizes" }
  },
  "borderRadius": {
    "sm": { "value": "6", "type": "borderRadius" },
    "md": { "value": "8", "type": "borderRadius" },
    "lg": { "value": "12", "type": "borderRadius" },
    "xl": { "value": "16", "type": "borderRadius" },
    "2xl": { "value": "20", "type": "borderRadius" }
  },
  "spacing": {
    "xs": { "value": "4", "type": "spacing" },
    "sm": { "value": "8", "type": "spacing" },
    "md": { "value": "12", "type": "spacing" },
    "lg": { "value": "16", "type": "spacing" },
    "xl": { "value": "24", "type": "spacing" },
    "2xl": { "value": "32", "type": "spacing" },
    "3xl": { "value": "48", "type": "spacing" },
    "4xl": { "value": "64", "type": "spacing" }
  }
}
```

### 방법 3: Figma Variables (Figma 최신 기능)
1. Local Variables 패널 열기
2. Collection 생성: "MarketingFlow"
3. 위 토큰을 Variable로 등록
4. 요소에 Variable 바인딩
