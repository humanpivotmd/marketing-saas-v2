const BASE = 'https://marketing-app-v2-production.up.railway.app'

// 1. Login
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@marketingflow.kr', password: 'test1234!' })
})
const loginData = await loginRes.json()
const token = loginData.data?.session?.access_token || loginData.session?.access_token
console.log('Login:', loginRes.status, token ? 'TOKEN OK' : 'NO TOKEN')
if (!token) { console.log(JSON.stringify(loginData)); process.exit(1) }

const H = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

// 2. Test existing API
const contentsRes = await fetch(`${BASE}/api/contents?limit=1`, { headers: H })
console.log('Contents:', contentsRes.status, (await contentsRes.text()).slice(0, 100))

// 3. Test projects
const projRes = await fetch(`${BASE}/api/projects?limit=1`, { headers: H })
const projText = await projRes.text()
console.log('Projects GET:', projRes.status, projText.slice(0, 200))

// 4. Test business-profile
const bpRes = await fetch(`${BASE}/api/mypage/business-profile`, { headers: H })
console.log('BusinessProfile:', bpRes.status, (await bpRes.text()).slice(0, 200))

// 5. Test industries
const indRes = await fetch(`${BASE}/api/industries`, { headers: H })
console.log('Industries:', indRes.status, (await indRes.text()).slice(0, 200))

// 6. Try create project
const createRes = await fetch(`${BASE}/api/projects`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ keyword_text: '테스트', business_type: 'B2C' })
})
const createText = await createRes.text()
console.log('Projects POST:', createRes.status, createText.slice(0, 200))

// 7. Test titles (will fail if no ANTHROPIC_API_KEY)
const titleRes = await fetch(`${BASE}/api/generate/titles`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ keyword: '테스트', business_type: 'B2C', topic_type: 'info' })
})
console.log('Titles:', titleRes.status, (await titleRes.text()).slice(0, 200))
