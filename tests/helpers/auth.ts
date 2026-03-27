import { Page } from '@playwright/test'

export async function login(page: Page) {
  const email = process.env.TEST_EMAIL || 'smoke-test@marketingflow.kr'
  const password = process.env.TEST_PASSWORD || 'test1234!'
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000'

  await page.goto(`${baseURL}/login`)
  await page.waitForLoadState('domcontentloaded')

  // 이미 로그인 상태면 스킵
  if (!page.url().includes('/login')) return

  for (let attempt = 0; attempt < 2; attempt++) {
    // 이메일/비밀번호 입력 대기
    await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 5000 })
    await page.fill('input[placeholder="you@example.com"]', email)
    await page.fill('input[placeholder="비밀번호를 입력하세요"]', password)

    const submitBtn = page.locator('button[type="submit"]:visible').first()
    await submitBtn.click()

    try {
      await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 })
      return // 성공
    } catch {
      // 실패 시 페이지 새로고침 후 재시도
      if (attempt === 0) await page.goto(`${baseURL}/login`)
    }
  }
}
