import { test, expect } from '@playwright/test'
import {
  generateTestUser, registerUser, loginUser, setupBusinessProfile,
  registerKeyword, setupDraftInfo, waitForDraftGeneration,
  confirmChannelsAndGenerateImages, generateVideoScript,
  type TestUser,
} from '../helpers/test-user'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

test.describe.serial('시나리오 1: 블로그만 선택 — B2C 전체 플로우', () => {
  let user: TestUser
  let projectId: string
  const keyword = '카페 블로그 마케팅 전략'

  test('1. 회원가입', async ({ page }) => {
    user = generateTestUser('blog')
    await registerUser(page, user)

    // 가입 후 로그인
    await loginUser(page, user)
    expect(page.url()).not.toContain('/login')
  })

  test('2. 마이페이지: 업종/B2C/블로그만/서비스명 설정', async ({ page }) => {
    await loginUser(page, user)
    await setupBusinessProfile(page, {
      scenario: 'blog',
      businessType: 'B2C',
      channels: ['blog'],
      serviceName: '카페라떼하우스',
      companyName: '테스트카페',
    })

    // 설정 저장 확인
    const toast = page.locator('[role="alert"]:has-text("저장")')
    await expect(toast).toBeVisible({ timeout: 10000 })
  })

  test('3. 키워드 등록', async ({ page }) => {
    await loginUser(page, user)
    await registerKeyword(page, keyword)
  })

  test('4. STEP3: 정보형/친근한/핵심전달내용 → 제목 생성 → 프로젝트 생성', async ({ page }) => {
    test.setTimeout(120000)
    await loginUser(page, user)

    projectId = await setupDraftInfo(page, keyword, {
      topicType: '정보형',
      tone: '친근한',
      coreMessage: '강남역 근처 카페 추천 리스트',
    })
    expect(projectId).toBeTruthy()
  })

  test('5. STEP4: 초안 생성 대기 → channel-write 이동', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)
    await waitForDraftGeneration(page, projectId)
    expect(page.url()).toContain('channel-write')
  })

  test('6. STEP5: 블로그 글 생성 확인', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)

    await page.goto(`${BASE}/create/channel-write?project_id=${projectId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // 블로그 탭이 보이는지
    const blogTab = page.locator('button').filter({ hasText: '블로그' }).first()
    await expect(blogTab).toBeVisible({ timeout: 60000 })

    // 블로그 콘텐츠 본문이 있는지
    const contentBody = page.locator('.whitespace-pre-wrap').first()
    await expect(contentBody).toBeVisible({ timeout: 10000 })
    const text = await contentBody.textContent()
    expect(text!.length).toBeGreaterThan(100)
  })

  test('7. STEP5→6: 블로그 확정 → 이미지 BottomSheet → 프롬프트 생성', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)
    await confirmChannelsAndGenerateImages(page, projectId)
  })

  test('8. STEP7: 영상 스크립트 생성', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)
    await generateVideoScript(page, projectId)
  })

  test('9. 결과 검증: /contents에서 블로그 글 확인', async ({ page }) => {
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginUser(page, user)

    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    // 콘텐츠가 1개 이상
    const items = page.locator('a[href^="/contents/"]')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })
})
