import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/.auth/session.json'

setup('로그인 후 세션 저장', async ({ page }) => {
  const email = process.env.TEST_EMAIL || 'smoke-test@marketingflow.kr'
  const password = process.env.TEST_PASSWORD || 'test1234!'
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000'

  await page.goto(`${baseURL}/login`)
  await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 5000 })
  await page.fill('input[placeholder="you@example.com"]', email)
  await page.fill('input[placeholder="비밀번호를 입력하세요"]', password)
  await page.locator('button[type="submit"]:visible').first().click()

  // 로그인 성공 대기
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 })
  await expect(page).not.toHaveURL(/\/login/)

  // 세션 저장 (storageState = cookies + localStorage + sessionStorage는 별도)
  await page.context().storageState({ path: authFile })

  // sessionStorage는 storageState에 포함되지 않으므로 별도 저장
  const sessionData = await page.evaluate(() => {
    const data: Record<string, string> = {}
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!
      data[key] = sessionStorage.getItem(key)!
    }
    return data
  })

  // sessionStorage 데이터를 파일에 병합
  const fs = require('fs')
  const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
  state.sessionStorage = sessionData
  fs.writeFileSync(authFile, JSON.stringify(state, null, 2))
})
