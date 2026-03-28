import { Page, expect } from '@playwright/test'
import { faker } from '@faker-js/faker/locale/ko'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

export interface TestUserOptions {
  scenario: string
  businessType: 'B2B' | 'B2C'
  channels: string[]       // ['blog', 'instagram', 'threads', 'facebook']
  industry?: string        // 업종명 (선택 시 검색)
  serviceName?: string
  companyName?: string
}

export interface TestUser {
  email: string
  password: string
  name: string
}

/** 가상 유저 데이터 생성 */
export function generateTestUser(scenario: string): TestUser {
  const ts = Date.now()
  return {
    email: `test-${scenario}-${ts}@test.internal`,
    password: 'Test1234!@',
    name: faker.person.fullName(),
  }
}

/** 회원가입 수행 */
export async function registerUser(page: Page, user: TestUser) {
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('domcontentloaded')

  // 회원가입 링크 클릭
  const registerLink = page.locator('a:has-text("회원가입"), a:has-text("가입")').first()
  if (await registerLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await registerLink.click()
    await page.waitForLoadState('domcontentloaded')
  } else {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
  }

  // 이름 입력
  const nameInput = page.locator('input[placeholder*="이름"], input[name="name"]').first()
  if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameInput.fill(user.name)
  }

  // 이메일 입력
  const emailInput = page.locator('input[placeholder*="@"], input[type="email"]').first()
  await expect(emailInput).toBeVisible({ timeout: 5000 })
  await emailInput.fill(user.email)

  // 비밀번호 입력
  const pwInputs = page.locator('input[type="password"]')
  const pwCount = await pwInputs.count()
  await pwInputs.nth(0).fill(user.password)
  if (pwCount >= 2) {
    await pwInputs.nth(1).fill(user.password)
  }

  // 가입 버튼 클릭
  const submitBtn = page.locator('button[type="submit"]:visible').first()
  await submitBtn.click()

  // 가입 성공 대기 (로그인 페이지로 이동하거나 대시보드로 이동)
  await page.waitForTimeout(3000)
}

/** 로그인 수행 */
export async function loginUser(page: Page, user: TestUser) {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('input[placeholder="you@example.com"], input[type="email"]', { timeout: 5000 })

  const emailInput = page.locator('input[placeholder="you@example.com"], input[type="email"]').first()
  await emailInput.fill(user.email)

  const pwInput = page.locator('input[type="password"]').first()
  await pwInput.fill(user.password)

  const submitBtn = page.locator('button[type="submit"]:visible').first()
  await submitBtn.click()

  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 })
}

/** 기존 테스트 계정으로 로그인 (회원가입 불필요) */
export async function loginTestAccount(page: Page) {
  const email = process.env.TEST_EMAIL || 'smoke-test@marketingflow.kr'
  const password = process.env.TEST_PASSWORD || 'test1234!'

  await page.goto(`${BASE}/login`)
  await page.waitForSelector('input[placeholder="you@example.com"], input[type="email"]', { timeout: 5000 })

  const emailInput = page.locator('input[placeholder="you@example.com"], input[type="email"]').first()
  await emailInput.fill(email)

  const pwInput = page.locator('input[type="password"]').first()
  await pwInput.fill(password)

  const submitBtn = page.locator('button[type="submit"]:visible').first()
  await submitBtn.click()

  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 })
}

/** 마이페이지 비즈니스 프로필 설정 */
export async function setupBusinessProfile(page: Page, options: TestUserOptions) {
  await page.goto(`${BASE}/settings#business`)
  await page.waitForLoadState('networkidle')

  // 데이터 로딩 대기
  await page.waitForTimeout(2000)

  // B2B/B2C 선택
  const btBtn = page.locator(`button:has-text("${options.businessType}")`).first()
  if (await btBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btBtn.click()
  }

  // 회사명 입력
  const companyInput = page.locator('input[placeholder="회사명 입력"], input[placeholder*="회사"]').first()
  if (await companyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await companyInput.fill(options.companyName || faker.company.name())
  }

  // 서비스명 입력
  const serviceInput = page.locator('input[placeholder*="서비스"], input[placeholder*="제품"]').first()
  if (await serviceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await serviceInput.fill(options.serviceName || faker.company.buzzPhrase())
  }

  // 채널 선택 — 먼저 전부 해제 후 필요한 것만 선택
  const channelLabels: Record<string, string> = {
    blog: '블로그',
    instagram: '인스타그램',
    threads: 'Threads',
    facebook: '페이스북',
    video: '영상',
  }

  for (const [id, label] of Object.entries(channelLabels)) {
    const channelBtn = page.locator(`button:has-text("${label}"), label:has-text("${label}")`).first()
    if (await channelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      const isSelected = await channelBtn.evaluate(el =>
        el.classList.contains('border-accent-primary') || el.getAttribute('aria-checked') === 'true'
      ).catch(() => false)

      if (options.channels.includes(id) && !isSelected) {
        await channelBtn.click()
      } else if (!options.channels.includes(id) && isSelected) {
        await channelBtn.click()
      }
    }
  }

  // 업종 선택 (있으면)
  if (options.industry) {
    const industrySelect = page.locator('select').first()
    if (await industrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      // option 텍스트로 선택
      await industrySelect.selectOption({ label: options.industry }).catch(() => {})
    }
  }

  // 저장 버튼 클릭
  const saveBtn = page.locator('button:has-text("설정 저장")').first()
  await saveBtn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await saveBtn.click()

  // toast 확인
  await page.waitForTimeout(2000)
}

/** 키워드 등록 (검색 = 자동 등록 + 등급 분석) */
export async function registerKeyword(page: Page, keyword: string) {
  await page.goto(`${BASE}/keywords`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // 서비스명 조합 토글 OFF (순수 키워드만 등록)
  const toggle = page.locator('button[role="switch"][aria-checked="true"]').first()
  if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await toggle.click()
    await page.waitForTimeout(300)
  }

  const keywordInput = page.locator('input[placeholder*="키워드 입력"]').first()
  await expect(keywordInput).toBeVisible({ timeout: 5000 })
  await keywordInput.fill(keyword)

  const searchBtn = page.locator('button:has-text("검색")').first()
  await searchBtn.click()

  // 자동 등록 + 등급 분석 대기 (등급 분석은 시간이 걸림)
  await page.waitForTimeout(8000)

  // 키워드가 목록에 표시되는지 확인 (이미 등록된 경우도 포함)
  await expect(page.locator(`text=${keyword}`).first()).toBeVisible({ timeout: 15000 })
}

/** STEP3: 초안 정보 입력 → 제목 생성 → 선택 → 프로젝트 생성 */
export async function setupDraftInfo(
  page: Page,
  keyword: string,
  options: { topicType: string; tone: string; coreMessage?: string }
): Promise<string> {
  await page.goto(`${BASE}/create/draft-info?keyword=${encodeURIComponent(keyword)}`)
  await page.waitForLoadState('networkidle')

  // 글 유형 선택
  const topicBtn = page.locator(`button:has-text("${options.topicType}")`).first()
  if (await topicBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await topicBtn.click()
  }

  // 톤 선택
  const toneBtn = page.locator(`button:has-text("${options.tone}")`).first()
  if (await toneBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await toneBtn.click()
  }

  // 핵심 전달 내용 입력
  if (options.coreMessage) {
    const coreInput = page.locator('textarea[placeholder*="핵심"], textarea[placeholder*="전달"]').first()
    if (await coreInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await coreInput.fill(options.coreMessage)
    }
  }

  // 제목 생성
  const titleGenBtn = page.locator('button:has-text("제목 생성")').first()
  await titleGenBtn.click()

  // AI 제목 생성 대기
  await page.waitForSelector('button[class*="border-border-primary"], button[class*="accent"]', { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(2000)

  // 첫 번째 제목 선택
  const titleBtns = page.locator('.space-y-2 button').first()
  if (await titleBtns.isVisible({ timeout: 5000 }).catch(() => false)) {
    await titleBtns.click()
  }

  // 초안 작성 시작
  const startBtn = page.locator('button:has-text("초안 작성 시작")').first()
  await expect(startBtn).toBeVisible({ timeout: 5000 })
  await startBtn.click()

  // generating 페이지로 이동
  await page.waitForURL('**/generating**', { timeout: 15000 })
  const url = new URL(page.url())
  return url.searchParams.get('project_id') || ''
}

/** STEP4: 초안 생성 대기 → channel-write 이동 */
export async function waitForDraftGeneration(page: Page, projectId: string) {
  await page.goto(`${BASE}/create/generating?project_id=${projectId}`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForURL('**/channel-write**', { timeout: 180000 })
}

/** STEP5+6: 채널별 컨펌 + 이미지 BottomSheet */
export async function confirmChannelsAndGenerateImages(page: Page, projectId: string) {
  await page.goto(`${BASE}/create/channel-write?project_id=${projectId}`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // 채널 탭 대기
  const channelTab = page.locator('button').filter({ hasText: /블로그|Threads|인스타|페이스북/ }).first()
  await expect(channelTab).toBeVisible({ timeout: 60000 })

  // 모든 채널 탭 순회
  const tabs = page.locator('button').filter({ hasText: /블로그|Threads|인스타그램|페이스북/ })
  const tabCount = await tabs.count()

  for (let i = 0; i < tabCount; i++) {
    await tabs.nth(i).click()
    await page.waitForTimeout(500)

    // 컨펌
    const confirmBtn = page.locator('button:has-text("이 채널 컨펌")').first()
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click()
      await page.waitForTimeout(1500)
    }

    // 이미지 BottomSheet
    const imageBtn = page.locator('button:has-text("확정하고 이미지 만들기")').first()
    if (await imageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await imageBtn.click()
      await page.waitForTimeout(500)

      const genBtn = page.locator('button:has-text("이미지 프롬프트 생성")').first()
      if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await genBtn.click()
        await page.waitForSelector('code, pre', { timeout: 60000 }).catch(() => {})
      }

      // 다음 채널 or 완료
      const nextOrDone = page.locator('button:has-text("다음"), button:has-text("완료")').last()
      if (await nextOrDone.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextOrDone.click()
        await page.waitForTimeout(500)
      }
    }
  }
}

/** STEP7: 영상 스크립트 생성 */
export async function generateVideoScript(page: Page, projectId: string) {
  // 영상 만들기 버튼이 있으면 클릭, 아니면 직접 이동
  const videoBtn = page.locator('button:has-text("영상 만들기")').first()
  if (await videoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await videoBtn.click()
    await page.waitForURL('**/video-script**', { timeout: 15000 })
  } else {
    await page.goto(`${BASE}/create/video-script?project_id=${projectId}`)
    await page.waitForLoadState('networkidle')
  }

  // 숏폼 선택
  const shortBtn = page.locator('button:has-text("숏폼")').first()
  if (await shortBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await shortBtn.click()
  }

  // 스크립트 생성
  const genBtn = page.locator('button:has-text("영상 스크립트 생성")').first()
  if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await genBtn.click()
    await page.waitForSelector('text=장면, text=스토리보드', { timeout: 120000 }).catch(() => {})
  }

  // 프로젝트 완료
  const storyboardTab = page.locator('button:has-text("스토리보드")').first()
  if (await storyboardTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await storyboardTab.click()
    await page.waitForTimeout(500)
  }

  const completeBtn = page.locator('button:has-text("프로젝트 완료")').first()
  if (await completeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await completeBtn.click()
    await page.waitForURL('**/contents**', { timeout: 15000 }).catch(() => {})
  }
}
