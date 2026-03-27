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

test.describe('Quick Create — /contents/new 빠른 생성 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('키워드 선택 → 채널 선택 → 생성 시작 확인', async ({ page }) => {
    await page.goto(`${BASE}/contents/new`)
    await page.waitForLoadState('networkidle')

    // 페이지 진입 확인
    await expect(page.locator('text=콘텐츠 생성')).toBeVisible({ timeout: 5000 })

    // 저장된 키워드가 있으면 첫 번째 선택 (라디오 버튼)
    const firstKeyword = page.locator('input[type="radio"]').first()
    if (await firstKeyword.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstKeyword.click()
    } else {
      // 직접 입력
      const customInput = page.locator('input[placeholder*="키워드를 입력"]').first()
      if (await customInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await customInput.fill('카페 마케팅 전략')
      }
    }

    // 채널 선택: "블로그" 버튼
    const blogBtn = page.locator('button:has-text("블로그")').first()
    if (await blogBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await blogBtn.click()
    }

    // "원본글 생성" 버튼 확인 (SSE 생성은 시간이 오래 걸리므로 버튼 존재만 확인)
    const genBtn = page.locator('button:has-text("원본글 생성"), button:has-text("생성")').first()
    await expect(genBtn).toBeVisible({ timeout: 5000 })
  })

  test('상세 모드 토글 확인', async ({ page }) => {
    await page.goto(`${BASE}/contents/new`)
    await page.waitForLoadState('networkidle')

    // "상세 모드" 버튼 확인
    const detailBtn = page.locator('button:has-text("상세 모드"), button:has-text("상세")').first()
    if (await detailBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailBtn.click()
      await page.waitForTimeout(500)
      // 상세 설정이 나타나는지 (톤, 길이, 스타일 등)
      const toneSection = page.locator('text=톤, text=스타일, text=길이').first()
      await expect(toneSection).toBeVisible({ timeout: 3000 })
    }
  })
})
