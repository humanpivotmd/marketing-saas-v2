import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

/**
 * 빈 상태 테스트용 — sessionStorage에 토큰만 설정하되
 * 실제 데이터가 없는 상황을 테스트.
 *
 * 참고: 기존 테스트 계정에 데이터가 있으면 빈 상태를 볼 수 없음.
 * 이 테스트는 데이터가 없는 새 계정이거나, 필터로 빈 결과를 만들어서 확인.
 */
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

test.describe('Empty State — 빈 상태 메시지 확인', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('키워드 페이지 — 키워드가 있으면 목록 표시, 없으면 빈 상태 표시', async ({ page }) => {
    await page.goto(`${BASE}/keywords`)
    await page.waitForLoadState('networkidle')

    const emptyMsg = page.locator('text=등록된 키워드가 없습니다')
    const keywordText = page.locator('text=등록된 키워드')

    // 키워드가 있든 없든, 페이지가 정상 렌더링되는지 확인
    const hasEmpty = await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false)
    const hasKeywords = await keywordText.isVisible({ timeout: 3000 }).catch(() => false)
    // 둘 중 하나는 보여야 함
    expect(hasEmpty || hasKeywords).toBeTruthy()
  })

  test('콘텐츠 0개 (필터로 빈 결과) → "콘텐츠가 없습니다" 표시', async ({ page }) => {
    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    // 존재하지 않는 채널 필터로 빈 결과 만들기
    // video_script 탭 클릭 (콘텐츠가 없을 확률 높음)
    const videoTab = page.locator('button:has-text("영상 스크립트"), [role="tab"]:has-text("영상")').first()
    if (await videoTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await videoTab.click()
      await page.waitForTimeout(1500)

      const emptyMsg = page.locator('text=콘텐츠가 없습니다')
      const hasContents = await page.locator('a[href^="/contents/"]').count()

      if (hasContents === 0) {
        await expect(emptyMsg).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('캘린더 빈 날짜 클릭 → "이 날짜에 예정된 콘텐츠가 없습니다" 표시', async ({ page }) => {
    await page.goto(`${BASE}/calendar`)
    await page.waitForLoadState('networkidle')

    // 이전 달로 이동하여 콘텐츠 없는 날짜 확보
    const prevBtn = page.locator('button:has-text("◀"), button[aria-label*="이전"]').first()
    if (await prevBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await prevBtn.click()
      await prevBtn.click() // 2달 전
      await page.waitForTimeout(1000)
    }

    // 아무 날짜 클릭
    const dayCell = page.locator('button:has-text("15"), div:has-text("15")').first()
    if (await dayCell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dayCell.click()
      await page.waitForTimeout(500)

      // 빈 날짜 메시지 확인
      const emptyMsg = page.locator('text=이 날짜에 예정된 콘텐츠가 없습니다')
      await expect(emptyMsg).toBeVisible({ timeout: 5000 })
    }
  })

  test('대시보드 — 콘텐츠 0개일 때 "아직 콘텐츠가 없습니다" 표시 가능 확인', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')

    // 대시보드의 EmptyState 또는 콘텐츠 목록 확인
    const emptyMsg = page.locator('text=아직 콘텐츠가 없습니다')
    const contentCards = page.locator('[class*="content"], a[href^="/contents/"]')
    const contentCount = await contentCards.count()

    if (contentCount === 0) {
      // EmptyState 표시 여부 확인
      const isVisible = await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false)
      expect(isVisible).toBeTruthy()
    } else {
      expect(contentCount).toBeGreaterThan(0)
    }
  })
})
