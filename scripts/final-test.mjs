const BASE = 'https://marketing-app-v2-production.up.railway.app'
let score = 0
let total = 0

function check(label, pass, detail = '') {
  total += 1
  if (pass) score += 1
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`)
}

// Wait for deploy
console.log('Waiting 90s for Railway deploy...')
await new Promise(r => setTimeout(r, 90000))

// 1. Pages
for (const [path, name] of [['/landing','랜딩'],['/login','로그인'],['/guide','가이드'],['/settings','설정'],['/create/draft-info','STEP3'],['/create/generating','STEP4'],['/create/channel-write','STEP5'],['/create/image-script','STEP6'],['/create/video-script','STEP7'],['/admin/industries','업종관리']]) {
  const r = await fetch(`${BASE}${path}`)
  check(`GET ${name}(${path})`, r.status === 200, `${r.status}`)
}

// 2. Landing content check
const landingHtml = await (await fetch(`${BASE}/landing`)).text()
check('랜딩: "발행 예약" 없음', !landingHtml.includes('발행 및 예약'))
check('랜딩: "성과 추적" 없음', !landingHtml.includes('성과 추적'))
check('랜딩: "B2B/B2C" 있음', landingHtml.includes('B2B/B2C'))
check('랜딩: "커스텀 프롬프트" 있음', landingHtml.includes('커스텀 프롬프트'))
check('랜딩: "19,900" 있음', landingHtml.includes('19,900'))
check('랜딩: "Premium" 있음', landingHtml.includes('Premium'))

// 3. Guide check
const guideHtml = await (await fetch(`${BASE}/guide`)).text()
check('가이드: "예약 발행" 없음', !guideHtml.includes('예약 발행'))
check('가이드: "성과 자동 추적" 없음', !guideHtml.includes('성과 자동 추적'))
check('가이드: "Facebook" 있음', guideHtml.includes('Facebook'))

// 4. Login
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@marketingflow.kr', password: 'test1234!' })
})
const loginData = await loginRes.json()
const token = loginData.session?.access_token
check('로그인 성공', !!token, `${loginRes.status}`)

if (token) {
  const H = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  // 5. Business profile
  const bp = await (await fetch(`${BASE}/api/mypage/business-profile`, { headers: H })).json()
  check('마이페이지 API', bp.success && 'business_type' in (bp.data || {}))

  // 6. Industries
  const ind = await (await fetch(`${BASE}/api/industries`, { headers: H })).json()
  check('업종 API', ind.success && (ind.data || []).length >= 10, `${(ind.data||[]).length}개`)

  // 7. Projects
  const proj = await (await fetch(`${BASE}/api/projects`, { headers: H })).json()
  check('프로젝트 목록 API', proj.success, `${(proj.data||[]).length}개`)

  // 8. Create project
  const create = await fetch(`${BASE}/api/projects`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ keyword_text: '마케팅 자동화 테스트', business_type: 'B2B' })
  })
  const createData = await create.json()
  check('프로젝트 생성', createData.success && createData.data?.id, `${create.status}`)

  if (createData.data?.id) {
    // 9. Get project detail
    const detail = await (await fetch(`${BASE}/api/projects/${createData.data.id}`, { headers: H })).json()
    check('프로젝트 상세', detail.success && detail.data?.business_type === 'B2B')

    // Cleanup
    await fetch(`${BASE}/api/projects/${createData.data.id}`, { method: 'DELETE', headers: H })
  }

  // 10. Auth security
  const noAuth = await fetch(`${BASE}/api/projects`)
  check('인증 없이 차단', noAuth.status === 401)
}

console.log(`\n=== FINAL: ${score}/${total} (${Math.round(score/total*100)}%) ===`)
