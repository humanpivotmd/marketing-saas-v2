import { test, expect } from '@playwright/test'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.TEST_EMAIL || 'smoke-test@marketingflow.kr'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.TEST_PASSWORD || 'test1234!'

async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/admin-login`)
  await page.waitForLoadState('domcontentloaded')

  // admin-login 페이지가 없으면 일반 로그인
  if (!page.url().includes('admin-login')) {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
  }

  const emailInput = page.locator('input[placeholder*="@"], input[type="email"]').first()
  await expect(emailInput).toBeVisible({ timeout: 5000 })
  await emailInput.fill(ADMIN_EMAIL)

  const pwInput = page.locator('input[type="password"]').first()
  await pwInput.fill(ADMIN_PASSWORD)

  const submitBtn = page.locator('button[type="submit"]:visible').first()
  await submitBtn.click()

  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2000)
}

test.describe.serial('시나리오 4: 관리자 테스트', () => {
  test('1. 관리자 로그인', async ({ page }) => {
    await adminLogin(page)
    expect(page.url()).not.toContain('/login')
  })

  test('2. 사용자 목록 페이지 로딩', async ({ page }) => {
    await adminLogin(page)
    await page.goto(`${BASE}/admin/users`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("회원")')).toBeVisible({ timeout: 10000 })

    // 사용자 테이블/리스트가 있는지
    const rows = page.locator('tr, [class*="user"], a[href*="users"]')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('3. 플랜 한도 조회', async ({ page }) => {
    await adminLogin(page)
    await page.goto(`${BASE}/admin/plans`)
    await page.waitForLoadState('networkidle')

    // 플랜 목록이 보이는지
    const planItems = page.locator('text=무료, text=Free, text=Pro, text=Basic, text=Enterprise').first()
    await expect(planItems).toBeVisible({ timeout: 10000 })
  })

  test('4. 프롬프트 목록 확인', async ({ page }) => {
    await adminLogin(page)
    await page.goto(`${BASE}/admin/prompts`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("프롬프트")')).toBeVisible({ timeout: 10000 })

    // 프롬프트 항목이 있는지
    const body = await page.textContent('body')
    expect(body).toMatch(/blog|instagram|threads|draft|title/i)
  })

  test('5. KPI 통계 페이지 확인', async ({ page }) => {
    await adminLogin(page)
    await page.goto(`${BASE}/admin`)
    await page.waitForLoadState('networkidle')

    // 대시보드/통계 페이지에 숫자가 있는지
    const statsText = await page.textContent('body')
    // 최소한 페이지가 정상 렌더링되는지
    expect(statsText).toBeTruthy()
    expect(statsText).not.toContain('Application error')
  })
})
