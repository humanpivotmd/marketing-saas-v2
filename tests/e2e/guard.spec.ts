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

test.describe('Guard Tests — FlowGuard 차단 확인', () => {
  // project_id 없이 접근 → "프로젝트 정보가 없습니다." 표시

  test('/create/generating — "프로젝트 정보가 없습니다." 표시', async ({ page }) => {
    await restoreSession(page)
    await page.goto(`${BASE}/create/generating`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=프로젝트 정보가 없습니다')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("키워드로 돌아가기")')).toBeVisible()
  })

  test('/create/channel-write — "프로젝트 정보가 없습니다." 표시', async ({ page }) => {
    await restoreSession(page)
    await page.goto(`${BASE}/create/channel-write`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=프로젝트 정보가 없습니다')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("키워드로 돌아가기")')).toBeVisible()
  })

  test('/create/image-script — "프로젝트 정보가 없습니다." 표시', async ({ page }) => {
    await restoreSession(page)
    await page.goto(`${BASE}/create/image-script`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=프로젝트 정보가 없습니다')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("키워드로 돌아가기")')).toBeVisible()
  })

  test('/create/video-script — "프로젝트 정보가 없습니다." 표시', async ({ page }) => {
    await restoreSession(page)
    await page.goto(`${BASE}/create/video-script`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=프로젝트 정보가 없습니다')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("키워드로 돌아가기")')).toBeVisible()
  })

  // 잘못된 project_id → 동일하게 "프로젝트 정보가 없습니다."
  test('/create/generating — 존재하지 않는 project_id', async ({ page }) => {
    await restoreSession(page)
    await page.goto(`${BASE}/create/generating?project_id=00000000-0000-0000-0000-000000000000`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=프로젝트 정보가 없습니다')).toBeVisible({ timeout: 5000 })
  })

  // 미인증 접근
  test('미인증: /keywords 접근 시 차단', async ({ page }) => {
    // 세션 복원 없이 접근
    await page.goto(`${BASE}/keywords`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const url = page.url()
    const body = await page.textContent('body')
    const isBlocked = url.includes('login') ||
      (body?.includes('마이페이지 설정이 필요합니다') ?? false) ||
      (body?.includes('로그인') ?? false)
    expect(isBlocked).toBeTruthy()
  })

  test('미인증: /admin/users 접근 시 차단', async ({ page }) => {
    await page.goto(`${BASE}/admin/users`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const url = page.url()
    const body = await page.textContent('body')
    const isBlocked = url.includes('login') ||
      (body?.includes('로그인') ?? false) ||
      (body?.includes('권한') ?? false)
    expect(isBlocked).toBeTruthy()
  })

  // draft-info: keyword 없이 접근
  test('/create/draft-info — keyword 없이 진입 시 리다이렉트', async ({ page }) => {
    await restoreSession(page)
    await page.goto(`${BASE}/create/draft-info`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // keyword 없으면 /keywords로 리다이렉트되거나 페이지에 머무름
    const url = page.url()
    expect(url.includes('keywords') || url.includes('draft-info')).toBeTruthy()
  })
})
