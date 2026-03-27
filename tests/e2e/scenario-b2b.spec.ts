import { test, expect } from '@playwright/test'
import {
  generateTestUser, registerUser, loginUser, setupBusinessProfile,
  registerKeyword, setupDraftInfo, waitForDraftGeneration,
  confirmChannelsAndGenerateImages, generateVideoScript,
  type TestUser,
} from '../helpers/test-user'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

test.describe.serial('시나리오 3: B2B + 전체 채널 — 서비스소개 플로우', () => {
  let user: TestUser
  let projectId: string
  const keyword = 'SaaS 마케팅 자동화 솔루션'

  test('1. 회원가입', async ({ page }) => {
    user = generateTestUser('b2b')
    await registerUser(page, user)
    await loginUser(page, user)
    expect(page.url()).not.toContain('/login')
  })

  test('2. 마이페이지: IT서비스/B2B/전체채널/서비스명', async ({ page }) => {
    await loginUser(page, user)
    await setupBusinessProfile(page, {
      scenario: 'b2b',
      businessType: 'B2B',
      channels: ['blog', 'instagram', 'threads', 'facebook'],
      serviceName: '마케팅플로우',
      companyName: '테크스타트업',
      industry: 'IT/테크',
    })

    const toast = page.locator('[role="alert"]:has-text("저장")')
    await expect(toast).toBeVisible({ timeout: 10000 })
  })

  test('3. 키워드 등록', async ({ page }) => {
    await loginUser(page, user)
    await registerKeyword(page, keyword)
  })

  test('4. STEP3: 서비스소개/전문적/핵심전달내용', async ({ page }) => {
    test.setTimeout(120000)
    await loginUser(page, user)

    projectId = await setupDraftInfo(page, keyword, {
      topicType: '서비스 소개',
      tone: '전문적',
      coreMessage: 'AI 기반 콘텐츠 자동화로 마케팅 비용 50% 절감',
    })
    expect(projectId).toBeTruthy()
  })

  test('5. STEP4: 초안 생성 대기', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)
    await waitForDraftGeneration(page, projectId)
    expect(page.url()).toContain('channel-write')
  })

  test('6. STEP5: 전체 채널 글 생성 확인', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)

    await page.goto(`${BASE}/create/channel-write?project_id=${projectId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // 여러 채널 탭이 보이는지
    const tabs = page.locator('button').filter({ hasText: /블로그|Threads|인스타그램|페이스북/ })
    const tabCount = await tabs.count()
    expect(tabCount).toBeGreaterThanOrEqual(2)
  })

  test('7. STEP5→6: 전체 채널 확정 → 이미지 생성', async ({ page }) => {
    test.setTimeout(300000) // 전체 채널이라 더 오래 걸림
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)
    await confirmChannelsAndGenerateImages(page, projectId)
  })

  test('8. STEP7: 영상 스크립트 생성 → 완료', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)
    await generateVideoScript(page, projectId)
  })

  test('9. 결과 검증: 모든 채널 글 생성 확인', async ({ page }) => {
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)

    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    // 콘텐츠 여러 개 (전체 채널이므로)
    const items = page.locator('a[href^="/contents/"]')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })
})
