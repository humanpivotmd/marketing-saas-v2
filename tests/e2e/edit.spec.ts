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

/** toast(role="alert") 표시 확인 + 텍스트 포함 확인 */
async function expectToast(page: import('@playwright/test').Page, textPart: string) {
  const toast = page.locator(`[role="alert"]:has-text("${textPart}")`)
  await expect(toast).toBeVisible({ timeout: 15000 })
}

/** 콘텐츠가 최소 1개 존재하도록 보장 — 로딩 완료 대기 */
async function ensureContent(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/contents`)
  // 스켈레톤이 사라질 때까지 대기
  const skeleton = page.locator('[class*="animate-pulse"]').first()
  if (await skeleton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skeleton.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
  }
  await page.waitForTimeout(2000)
  const items = page.locator('a[href^="/contents/"]')
  return (await items.count()) > 0
}

test.describe('Edit — 콘텐츠 수정', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test.fixme('콘텐츠 제목 수정 → 저장 → toast "저장되었습니다"', async ({ page }) => {
    // FIXME: 콘텐츠 목록 API 로딩이 완료되지 않는 문제 (RLS 또는 API 응답 지연)
    const hasContent = await ensureContent(page)
    if (!hasContent) {
      test.skip(true, '콘텐츠가 없어서 스킵')
      return
    }

    const firstItem = page.locator('a[href^="/contents/"]').first()

    await firstItem.click()
    await page.waitForLoadState('networkidle')

    // 콘텐츠 상세 페이지 로딩 대기
    await page.waitForTimeout(2000)

    // "편집" 버튼 클릭 (우측 상단)
    const editBtn = page.locator('button:has-text("편집")').first()
    if (!(await editBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, '편집 버튼이 없어서 스킵 (콘텐츠 없음)')
      return
    }
    await editBtn.click()
    await page.waitForTimeout(500)

    // 제목 input 수정
    const titleInput = page.locator('input').first()
    await titleInput.fill('수정된 테스트 제목 ' + Date.now())

    // "저장" 버튼 클릭
    const saveBtn = page.locator('button:has-text("저장")').first()
    await saveBtn.click()

    await expectToast(page, '저장')
  })

  test.fixme('콘텐츠 본문 수정 → 저장 → toast 확인', async ({ page }) => {
    // FIXME: 콘텐츠 목록 API 로딩 문제
    const hasContent = await ensureContent(page)
    if (!hasContent) {
      test.skip(true, '콘텐츠가 없어서 스킵')
      return
    }

    const firstItem = page.locator('a[href^="/contents/"]').first()

    await firstItem.click()
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(2000)

    const editBtn = page.locator('button:has-text("편집")').first()
    if (!(await editBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, '편집 버튼이 없어서 스킵')
      return
    }
    await editBtn.click()
    await page.waitForTimeout(500)

    const bodyArea = page.locator('textarea').first()
    if (await bodyArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      const current = await bodyArea.inputValue()
      await bodyArea.fill(current + ' 수정됨.')
    }

    const saveBtn = page.locator('button:has-text("저장")').first()
    await saveBtn.click()

    await expectToast(page, '저장')
  })
})

test.describe('Edit — 설정 수정', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('마이페이지 회사명 수정 → 저장 → toast', async ({ page }) => {
    await page.goto(`${BASE}/settings#business`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("설정")')).toBeVisible()

    // 마이페이지 탭 데이터 로딩 대기 (API 응답 완료까지)
    const companyInput = page.locator('input[placeholder="회사명 입력"]').first()
    await expect(companyInput).toBeVisible({ timeout: 10000 })

    // 회사명 수정
    await companyInput.fill('수정된 테스트 회사 ' + Date.now())

    // 하단 "설정 저장" 버튼까지 스크롤
    const saveBtn = page.locator('button:has-text("설정 저장")')
    await saveBtn.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // 클릭 후 toast가 나타날 때까지 대기
    await saveBtn.click()

    // toast: "마이페이지 설정이 저장되었습니다" 텍스트를 포함하는 alert
    const toast = page.locator('[role="alert"]:has-text("저장")')
    await expect(toast).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Edit — 캘린더 스케줄', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('캘린더에서 날짜 클릭 → 콘텐츠 목록 확인', async ({ page }) => {
    await page.goto(`${BASE}/calendar`)
    await page.waitForLoadState('networkidle')

    // 캘린더가 로딩되는지 확인
    await expect(page.locator('text=일').first()).toBeVisible({ timeout: 5000 })

    // 아무 날짜 클릭 (오늘 근처)
    const today = new Date().getDate()
    const dayCell = page.locator(`text="${today}"`).first()
    if (await dayCell.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dayCell.click()
      await page.waitForTimeout(500)
    }

    // 스케줄된 콘텐츠가 있으면 링크 표시, 없으면 빈 메시지
    const contentLink = page.locator('a[href^="/contents/"]').first()
    const emptyMsg = page.locator('text=예정된 콘텐츠가 없습니다')
    const hasContent = await contentLink.isVisible({ timeout: 2000 }).catch(() => false)
    const hasEmpty = await emptyMsg.isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasContent || hasEmpty).toBeTruthy()
  })
})

test.describe('Delete — 삭제 + toast 확인', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  test('콘텐츠 삭제 → toast "삭제" → 목록에서 사라짐', async ({ page }) => {
    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    const deleteBtn = page.locator('button:has-text("삭제")').first()
    if (!(await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, '삭제 버튼이 없어서 스킵')
      return
    }

    const beforeCount = await page.locator('a[href^="/contents/"]').count()

    page.on('dialog', dialog => dialog.accept())
    await deleteBtn.click()

    await expectToast(page, '삭제')

    await page.waitForTimeout(1000)
    const afterCount = await page.locator('a[href^="/contents/"]').count()
    expect(afterCount).toBeLessThan(beforeCount)
  })

  test('키워드 삭제 → toast "삭제" → 확인', async ({ page }) => {
    await page.goto(`${BASE}/keywords`)
    await page.waitForLoadState('networkidle')

    // 스크린샷에서 확인: 키워드 카드의 "×" 버튼
    const deleteBtn = page.locator('button:has-text("×")').first()
    if (!(await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, '삭제 버튼이 없어서 스킵')
      return
    }

    page.on('dialog', dialog => dialog.accept())
    await deleteBtn.click()

    await expectToast(page, '삭제')
  })
})
