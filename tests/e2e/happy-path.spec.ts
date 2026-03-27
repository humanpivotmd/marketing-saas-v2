import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

/** sessionStorage 복원 */
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

test.describe.serial('Happy Path — 7단계 콘텐츠 생성 플로우', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await restoreSession(page)
  })

  // ── STEP 1~2: 키워드 등록 + 분석 ──
  test('STEP 1-2: 키워드 진입 → 등록 → 분석', async ({ page }) => {
    await page.goto(`${BASE}/keywords`)

    // 로딩 스피너/스켈레톤이 표시된 후 사라지는지 확인
    const spinner = page.locator('[class*="animate-pulse"], [class*="animate-spin"], [class*="skeleton"]').first()
    if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await spinner.waitFor({ state: 'hidden', timeout: 10000 })
    }
    await page.waitForLoadState('networkidle')

    // SetupRequired 차단 안 되는지 확인
    const body = await page.textContent('body')
    expect(body).toContain('키워드 분석')

    // 키워드 입력: placeholder="키워드 입력 (예: 강남 카페 추천)"
    const keywordInput = page.locator('input[placeholder*="키워드 입력"]').first()
    await expect(keywordInput).toBeVisible({ timeout: 5000 })
    await keywordInput.fill('테스트 블로그 마케팅')

    // "등록" 버튼 클릭
    const registerBtn = page.locator('button:has-text("등록")').first()
    await registerBtn.click()
    await page.waitForTimeout(1500)

    // 등록된 키워드가 표시되는지 확인
    await expect(page.locator('text=테스트 블로그 마케팅')).toBeVisible({ timeout: 5000 })
  })

  // ── STEP 3: 초안 정보 입력 ──
  test('STEP 3: 초안 정보 → 옵션 선택 → 제목 생성 → 선택', async ({ page }) => {
    // 키워드 파라미터로 직접 진입
    await page.goto(`${BASE}/create/draft-info?keyword=테스트 블로그 마케팅`)
    await page.waitForLoadState('networkidle')

    // 페이지 진입 확인 (리다이렉트 안 됐는지)
    expect(page.url()).toContain('draft-info')

    // B2B/B2C 선택 (기본값이 있을 수 있음)
    const b2cBtn = page.locator('button:has-text("B2C")').first()
    if (await b2cBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await b2cBtn.click()
    }

    // 글 유형 선택 (첫 번째 = 정보형)
    const topicBtn = page.locator('button:has-text("정보형"), button:has-text("정보")').first()
    if (await topicBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await topicBtn.click()
    }

    // 톤 선택
    const toneBtn = page.locator('button:has-text("친근한")').first()
    if (await toneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toneBtn.click()
    }

    // 제목 생성 버튼 클릭
    const titleGenBtn = page.locator('button:has-text("제목 생성"), button:has-text("제목")').first()
    if (await titleGenBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleGenBtn.click()
      // AI 제목 생성 대기 (최대 30초)
      await page.waitForTimeout(2000)
      await page.waitForSelector('input[type="radio"], button[class*="title"], div[class*="title-option"]', { timeout: 30000 }).catch(() => {})
    }

    // 제목 선택 (첫 번째)
    const firstTitle = page.locator('input[type="radio"]').first()
    if (await firstTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTitle.click()
    }

    // 초안 작성 시작 버튼
    const startBtn = page.locator('button:has-text("초안 작성 시작"), button:has-text("시작")').first()
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click()
      // generating 페이지로 이동 대기
      await page.waitForURL('**/generating**', { timeout: 15000 })
      // URL에서 project_id 추출
      const url = new URL(page.url())
      projectId = url.searchParams.get('project_id') || ''
      expect(projectId).toBeTruthy()
    }
  })

  // ── STEP 4: 초안 생성 (자동 진행) ──
  test('STEP 4: 초안 생성 자동 진행 → channel-write 이동', async ({ page }) => {
    test.skip(!projectId, '프로젝트 ID가 없음 (이전 단계 실패)')

    await page.goto(`${BASE}/create/generating?project_id=${projectId}`)
    await page.waitForLoadState('domcontentloaded')

    // 진행바 또는 스피너(animate-spin) 표시 확인
    const spinnerOrProgress = page.locator('[class*="animate-spin"], [role="progressbar"], [class*="progress"]').first()
    await expect(spinnerOrProgress).toBeVisible({ timeout: 10000 })

    // 생성 진행 중 확인
    const progressOrComplete = page.locator('text=초안, text=작성, text=생성, text=완료').first()
    await expect(progressOrComplete).toBeVisible({ timeout: 10000 })

    // channel-write로 자동 이동 대기 (최대 90초)
    await page.waitForURL('**/channel-write**', { timeout: 90000 })
    expect(page.url()).toContain('channel-write')
  })

  // ── STEP 5+6: 채널별 글 확인 + 컨펌 + 이미지 프롬프트 (통합) ──
  test('STEP 5-6: 채널별 글 컨펌 → 이미지 프롬프트 → 영상 이동', async ({ page }) => {
    test.skip(!projectId, '프로젝트 ID가 없음')

    await page.goto(`${BASE}/create/channel-write?project_id=${projectId}`)
    await page.waitForLoadState('networkidle')

    // 채널 콘텐츠가 로딩될 때까지 대기 (SSE 완료 후)
    await page.waitForTimeout(3000)

    // 채널 탭이 보이는지 확인
    const channelTab = page.locator('button, [role="tab"]').filter({ hasText: /블로그|Threads|인스타/ }).first()
    await expect(channelTab).toBeVisible({ timeout: 60000 })

    // 각 채널 탭을 순회: 컨펌 → 이미지 BottomSheet
    const tabs = page.locator('button').filter({ hasText: /블로그|Threads|인스타그램|페이스북/ })
    const tabCount = await tabs.count()

    for (let i = 0; i < tabCount; i++) {
      await tabs.nth(i).click()
      await page.waitForTimeout(500)

      // 이 채널 컨펌 버튼이 있으면 클릭
      const confirmBtn = page.locator('button:has-text("이 채널 컨펌")').first()
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click()
        await page.waitForTimeout(1500)
      }

      // 확정하고 이미지 만들기 버튼
      const imageBtn = page.locator('button:has-text("확정하고 이미지 만들기")').first()
      if (await imageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await imageBtn.click()
        await page.waitForTimeout(500)

        // BottomSheet 내에서 이미지 프롬프트 생성
        const genBtn = page.locator('button:has-text("이미지 프롬프트 생성")').first()
        if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await genBtn.click()
          // AI 생성 대기
          await page.waitForSelector('code, pre, [class*="prompt"]', { timeout: 60000 }).catch(() => {})
        }

        // 다음 채널 또는 완료 버튼
        const nextOrDone = page.locator('button:has-text("다음"), button:has-text("완료")').last()
        if (await nextOrDone.isVisible({ timeout: 5000 }).catch(() => false)) {
          await nextOrDone.click()
          await page.waitForTimeout(500)
        }
      }
    }

    // 영상 만들기 버튼 → video-script 이동
    const videoBtn = page.locator('button:has-text("영상 만들기")').first()
    if (await videoBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await videoBtn.click()
      await page.waitForURL('**/video-script**', { timeout: 15000 })
      expect(page.url()).toContain('video-script')
    }
  })

  // ── STEP 7: 영상 스크립트 ──
  test('STEP 7: 영상 스크립트 생성 → 프로젝트 완료', async ({ page }) => {
    test.skip(!projectId, '프로젝트 ID가 없음')

    await page.goto(`${BASE}/create/video-script?project_id=${projectId}`)
    await page.waitForLoadState('networkidle')

    // 포맷 선택 (숏폼)
    const shortBtn = page.locator('button:has-text("숏폼"), button:has-text("short")').first()
    if (await shortBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await shortBtn.click()
    }

    // 스크립트 생성 버튼
    const genBtn = page.locator('button:has-text("스크립트 생성"), button:has-text("생성")').first()
    if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await genBtn.click()
      // AI 생성 대기
      await page.waitForTimeout(5000)
      await page.waitForSelector('text=장면, text=씬, text=Scene', { timeout: 60000 }).catch(() => {})
    }

    // 프로젝트 완료 버튼
    const completeBtn = page.locator('button:has-text("완료"), button:has-text("프로젝트 완료")').first()
    if (await completeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await completeBtn.click()
      await page.waitForURL('**/contents**', { timeout: 15000 })
    }
  })

  // ── STEP 8: 콘텐츠 관리 확인 ──
  test('STEP 8: /contents 목록에 생성된 콘텐츠 확인', async ({ page }) => {
    await page.goto(`${BASE}/contents`)
    await page.waitForLoadState('networkidle')

    // 콘텐츠 페이지 진입 확인
    await expect(page.locator('h1:has-text("콘텐츠")')).toBeVisible()

    // 콘텐츠 항목이 1개 이상 있는지
    const items = page.locator('a[href^="/contents/"]')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })
})
