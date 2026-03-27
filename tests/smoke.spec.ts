import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'

// ── 헬퍼 ──

/** sessionStorage 복원 (storageState에 포함되지 않으므로 수동 주입) */
async function restoreSession(page: Page) {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000'
  const authFile = 'tests/.auth/session.json'

  if (fs.existsSync(authFile)) {
    const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
    if (state.sessionStorage) {
      // 먼저 도메인에 접속해야 sessionStorage 설정 가능
      await page.goto(baseURL)
      await page.evaluate((data) => {
        Object.entries(data).forEach(([key, value]) => {
          sessionStorage.setItem(key, value as string)
        })
      }, state.sessionStorage)
    }
  }
}

/** 페이지 로딩 후 에러 페이지가 아닌지 확인 */
async function assertNoErrorPage(page: Page) {
  const body = await page.textContent('body')
  expect(body).not.toContain('Application error')
  expect(body).not.toContain('Internal Server Error')
}

/** 콘솔 에러 수집 (네트워크/React devtools/HMR/select null 무시) */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (
        text.includes('Download the React DevTools') ||
        text.includes('[HMR]') ||
        text.includes('Failed to load resource') ||
        text.includes('net::ERR') ||
        text.includes('favicon') ||
        text.includes('value` prop on') ||
        text.includes('should not be null')
      ) return
      errors.push(text)
    }
  })
  return errors
}

// ── 테스트 ──

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

test.describe('Smoke Tests — Dashboard Pages', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('/calendar — 캘린더 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/calendar`)
    await page.waitForLoadState('networkidle')
    await assertNoErrorPage(page)
    await expect(page.locator('text=일').first()).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('/contents — 콘텐츠 목록 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')
    await assertNoErrorPage(page)
    await expect(page.locator('h1:has-text("콘텐츠")')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('/contents/[id] — 콘텐츠 상세 (첫 번째 항목)', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    const firstItem = page.locator('a[href^="/contents/"]').first()
    if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstItem.click()
      await page.waitForLoadState('networkidle')
      await assertNoErrorPage(page)
    }
    expect(errors).toHaveLength(0)
  })

  test('/keywords — 키워드 목록 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/keywords`)
    await page.waitForLoadState('networkidle')
    await assertNoErrorPage(page)
    await expect(page.locator('body')).not.toBeEmpty()
    expect(errors).toHaveLength(0)
  })

  test('/keywords/[id] — 키워드 상세 (첫 번째 항목)', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/keywords`)
    await page.waitForLoadState('networkidle')

    const firstItem = page.locator('a[href^="/keywords/"]').first()
    if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstItem.click()
      await page.waitForLoadState('networkidle')
      await assertNoErrorPage(page)
    }
    expect(errors).toHaveLength(0)
  })

  test('/settings — 설정 페이지 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/settings`)
    await page.waitForLoadState('networkidle')
    await assertNoErrorPage(page)
    await expect(page.locator('h1:has-text("설정")')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('/support — 고객지원 페이지 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/support`)
    await page.waitForLoadState('networkidle')
    await assertNoErrorPage(page)
    expect(errors).toHaveLength(0)
  })
})

test.describe('Smoke Tests — Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('/admin/users — 회원 관리 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/admin/users`)
    await page.waitForLoadState('networkidle')
    await assertNoErrorPage(page)
    await expect(page.locator('h1:has-text("회원")')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('/admin/industries — 업종 관리 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/admin/industries`)
    await page.waitForLoadState('networkidle')
    await assertNoErrorPage(page)
    await expect(page.locator('h1:has-text("업종")')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('/admin/prompts — 프롬프트 관리 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/admin/prompts`)
    await page.waitForLoadState('networkidle')
    await assertNoErrorPage(page)
    await expect(page.locator('h1:has-text("프롬프트")')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('/admin/support — 관리자 고객지원 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/admin/support`)
    await page.waitForLoadState('domcontentloaded')
    await assertNoErrorPage(page)
    expect(errors).toHaveLength(0)
  })

  test('/admin/mail — 메일 관리 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/admin/mail`)
    await page.waitForLoadState('domcontentloaded')
    await assertNoErrorPage(page)
    expect(errors).toHaveLength(0)
  })

  test('/admin/plans — 요금제 관리 로딩', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE}/admin/plans`)
    await page.waitForLoadState('domcontentloaded')
    await assertNoErrorPage(page)
    expect(errors).toHaveLength(0)
  })
})

test.describe('useAsyncAction — Toast 동작 확인', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('/contents — 삭제 시 toast 표시', async ({ page }) => {
    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    const deleteBtn = page.locator('button:has-text("삭제")').first()
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      page.on('dialog', dialog => dialog.accept())
      await deleteBtn.click()
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
    }
  })

  test('/keywords — 삭제 시 toast 표시', async ({ page }) => {
    await page.goto(`${BASE}/keywords`)
    await page.waitForLoadState('networkidle')

    const deleteBtn = page.locator('button:has-text("삭제"), button[aria-label*="삭제"]').first()
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      page.on('dialog', dialog => dialog.accept())
      await deleteBtn.click()
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
    }
  })
})
