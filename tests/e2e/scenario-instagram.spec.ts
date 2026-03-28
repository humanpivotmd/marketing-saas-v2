import { test, expect } from '@playwright/test'
import {
  loginTestAccount, setupBusinessProfile,
  registerKeyword, setupDraftInfo, waitForDraftGeneration,
  confirmChannelsAndGenerateImages, generateVideoScript,
} from '../helpers/test-user'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

test.describe.serial('시나리오 2: 인스타만 선택 — B2C 상품소개 플로우', () => {
  let projectId: string
  const keyword = '인스타 뷰티 마케팅'

  test('1. 로그인', async ({ page }) => {
    await loginTestAccount(page)
    expect(page.url()).not.toContain('/login')
  })

  test('2. 마이페이지: B2C/인스타만/서비스명 설정', async ({ page }) => {
    await loginTestAccount(page)
    await setupBusinessProfile(page, {
      scenario: 'instagram',
      businessType: 'B2C',
      channels: ['instagram'],
      serviceName: '글로우스킨',
      companyName: '테스트뷰티',
    })

    const toast = page.locator('[role="alert"]:has-text("저장")')
    await expect(toast).toBeVisible({ timeout: 10000 })
  })

  test('3. 키워드 등록', async ({ page }) => {
    await loginTestAccount(page)
    await registerKeyword(page, keyword)
  })

  test('4. STEP3: 상품소개/친근한/핵심전달내용', async ({ page }) => {
    test.setTimeout(120000)
    await loginTestAccount(page)

    projectId = await setupDraftInfo(page, keyword, {
      topicType: '상품 소개',
      tone: '친근한',
      coreMessage: '신제품 수분크림 출시 기념 할인',
    })
    expect(projectId).toBeTruthy()
  })

  test('5. STEP4: 초안 생성 대기', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginTestAccount(page)
    await waitForDraftGeneration(page, projectId)
    expect(page.url()).toContain('channel-write')
  })

  test('6. STEP5: 인스타 글 생성 확인', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginTestAccount(page)

    await page.goto(`${BASE}/create/channel-write?project_id=${projectId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // 인스타그램 탭이 보이는지
    const instaTab = page.locator('button').filter({ hasText: '인스타그램' }).first()
    await expect(instaTab).toBeVisible({ timeout: 60000 })

    // 인스타 콘텐츠 본문 확인
    await instaTab.click()
    await page.waitForTimeout(500)
    const contentBody = page.locator('.whitespace-pre-wrap').first()
    await expect(contentBody).toBeVisible({ timeout: 10000 })
  })

  test('7. STEP6: 인스타 확정 → 이미지 BottomSheet', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginTestAccount(page)
    await confirmChannelsAndGenerateImages(page, projectId)
  })

  test('8. STEP7: 영상 스크립트 생성', async ({ page }) => {
    test.setTimeout(180000)
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginTestAccount(page)
    await generateVideoScript(page, projectId)
  })

  test('9. 결과 검증: /contents에서 인스타 글 확인', async ({ page }) => {
    test.skip(!projectId, '프로젝트 ID 없음')
    await loginTestAccount(page)

    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    const cards = page.locator('text=전체 보기')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })
})
