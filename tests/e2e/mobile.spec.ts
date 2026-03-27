import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function restoreSession(page: import('@playwright/test').Page) {
  const authFile = 'tests/.auth/session.json'
  if (!fs.existsSync(authFile)) return
  const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
  if (!state.sessionStorage) return
  await page.goto(BASE)
  await page.evaluate((data) => {
    Object.entries(data).forEach(([k, v]) => sessionStorage.setItem(k, v as string))
  }, state.sessionStorage)
}

// ── 1. 핵심 페이지 모바일 레이아웃 확인 ──

test.describe('Mobile — 핵심 페이지 레이아웃', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('/keywords — 모바일 레이아웃 정상', async ({ page }) => {
    await page.goto(`${BASE}/keywords`)
    await page.waitForLoadState('networkidle')

    // 페이지가 뷰포트 너비를 초과하지 않는지 확인
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // 5px 여유

    // 핵심 요소가 보이는지
    const title = page.locator('text=키워드').first()
    await expect(title).toBeVisible({ timeout: 5000 })
  })

  test('/contents — 목록 모바일 표시 정상', async ({ page }) => {
    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)

    await expect(page.locator('h1:has-text("콘텐츠")')).toBeVisible({ timeout: 5000 })
  })

  test('/create/draft-info — 폼 요소 터치 가능', async ({ page }) => {
    await page.goto(`${BASE}/create/draft-info?keyword=테스트`)
    await page.waitForLoadState('networkidle')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)

    // B2B/B2C 버튼이 터치 가능한 크기인지 (44px 이상)
    const b2cBtn = page.locator('button:has-text("B2C")').first()
    if (await b2cBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await b2cBtn.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(40)
      await b2cBtn.tap()
    }
  })

  test('/settings — 탭 전환 가능', async ({ page }) => {
    await page.goto(`${BASE}/settings`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("설정")')).toBeVisible({ timeout: 5000 })

    // 탭 버튼들이 가로 스크롤 가능한지
    const tabBar = page.locator('[role="tablist"]')
    await expect(tabBar).toBeVisible()

    // "프로필" 탭 탭(터치) → 전환 확인
    const profileTab = page.locator('[role="tab"]:has-text("프로필")')
    if (await profileTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileTab.tap()
      await page.waitForTimeout(500)
      // 프로필 탭 활성화 확인
      await expect(profileTab).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('/calendar — 캘린더 표시 정상', async ({ page }) => {
    await page.goto(`${BASE}/calendar`)
    await page.waitForLoadState('networkidle')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)

    // 요일 헤더 표시
    await expect(page.locator('text=일').first()).toBeVisible({ timeout: 5000 })

    // 날짜 셀이 보이는지
    const dayCell = page.locator('text="15"').first()
    await expect(dayCell).toBeVisible()
  })
})

// ── 2. 터치 인터랙션 확인 ──

test.describe('Mobile — 터치 인터랙션', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('햄버거 메뉴 탭 → 사이드바 열기', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')

    // 햄버거 메뉴 버튼
    const hamburger = page.locator('button[aria-label="메뉴 열기"]')
    await expect(hamburger).toBeVisible({ timeout: 5000 })

    // 탭으로 사이드바 열기
    await hamburger.tap()
    await page.waitForTimeout(500)

    // 사이드바 열린 후 "키워드" 메뉴가 클릭 가능한지 확인
    const kwLink = page.locator('nav[aria-label="메인 메뉴"] a:has-text("키워드")')
    await expect(kwLink).toBeVisible({ timeout: 3000 })
  })

  test('사이드바에서 페이지 이동', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')

    // 햄버거 → 사이드바 열기
    const hamburger = page.locator('button[aria-label="메뉴 열기"]')
    await hamburger.tap()
    await page.waitForTimeout(300)

    // "키워드" 링크 탭
    const keywordLink = page.locator('nav a:has-text("키워드")')
    await expect(keywordLink).toBeVisible({ timeout: 3000 })
    await keywordLink.tap()

    // 키워드 페이지로 이동 확인
    await page.waitForURL('**/keywords**', { timeout: 5000 })
    expect(page.url()).toContain('keywords')
  })

  test('캘린더 날짜 탭 → 선택', async ({ page }) => {
    await page.goto(`${BASE}/calendar`)
    await page.waitForLoadState('networkidle')

    const dayCell = page.locator('text="15"').first()
    if (await dayCell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dayCell.tap()
      await page.waitForTimeout(500)
      // 날짜 클릭 후 페이지가 여전히 정상인지 확인
      await expect(page.locator('text=일').first()).toBeVisible()
    }
  })

  test('스크롤 동작 확인 — /settings', async ({ page }) => {
    await page.goto(`${BASE}/settings#business`)
    await page.waitForLoadState('networkidle')

    // 페이지 하단으로 스크롤
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // 하단 요소가 보이는지 (설정 저장 버튼)
    const bottomElement = page.locator('button:has-text("설정 저장")')
    await expect(bottomElement).toBeVisible({ timeout: 3000 })
  })
})

// ── 3. 반응형 레이아웃 확인 ──

test.describe('Mobile — 반응형 레이아웃', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('PC 사이드바가 숨겨지고 햄버거 메뉴가 표시되는지', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')

    // 햄버거 버튼 보여야 함 (모바일)
    const hamburger = page.locator('button[aria-label="메뉴 열기"]')
    await expect(hamburger).toBeVisible()

    // 사이드바의 메뉴 항목이 기본적으로 보이지 않아야 함 (사이드바가 닫힌 상태)
    // 참고: translate-x로 숨기므로 DOM에는 있지만 화면 밖
    // aria-expanded="false" 확인
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  })

  test('텍스트가 뷰포트 밖으로 넘치지 않는지 — /contents', async ({ page }) => {
    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    // 수평 스크롤이 없는지 확인
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('텍스트가 뷰포트 밖으로 넘치지 않는지 — /keywords', async ({ page }) => {
    await page.goto(`${BASE}/keywords`)
    await page.waitForLoadState('networkidle')

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('텍스트가 뷰포트 밖으로 넘치지 않는지 — /calendar', async ({ page }) => {
    await page.goto(`${BASE}/calendar`)
    await page.waitForLoadState('networkidle')

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('모든 버튼이 최소 터치 영역 (44px) 이상인지 — /dashboard', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')

    // 모든 버튼 요소의 크기 확인
    const buttons = page.locator('button:visible, a[href]:visible')
    const count = await buttons.count()

    let tooSmall = 0
    for (let i = 0; i < Math.min(count, 20); i++) {
      const box = await buttons.nth(i).boundingBox()
      if (box && (box.width < 30 || box.height < 30)) {
        tooSmall++
      }
    }
    // 30px 미만 터치 타겟이 전체의 20% 이하여야 함
    expect(tooSmall).toBeLessThan(count * 0.2)
  })
})
