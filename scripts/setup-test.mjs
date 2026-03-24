/**
 * 테스트 환경 설정 스크립트
 * 1. 테스트 계정 생성 (통합 1개 + admin 1개)
 * 2. Pro 요금제 할당
 * 3. email_verified = true, status = 'active'
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const PASSWORD = 'test1234!'
const BCRYPT_ROUNDS = 12

async function main() {
  console.log('=== 테스트 환경 설정 시작 ===\n')

  // 1. 비밀번호 해시 생성
  console.log('1. 비밀번호 해시 생성...')
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS)
  console.log('   완료\n')

  // 2. 테스트 계정 정의 (실제 DB 스키마 기준)
  const testAccounts = [
    {
      email: 'test@marketingflow.kr',
      username: 'tester',
      name: '통합테스터',
      role: 'user',
    },
    {
      email: 'admin@marketingflow.kr',
      username: 'admin_tester',
      name: '관리자테스터',
      role: 'admin',
    },
  ]

  // 3. 계정 생성
  console.log('2. 테스트 계정 생성...')
  for (const account of testAccounts) {
    const { data: existing } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', account.email)
      .single()

    if (existing) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: account.role,
          status: 'active',
          email_verified: true,
          plan: 'pro',
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error(`   ${account.email} 업데이트 실패:`, updateError)
      } else {
        console.log(`   ${account.email} — 기존 계정 업데이트 완료 (${account.role})`)
      }
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: account.email,
          username: account.username,
          password_hash: passwordHash,
          name: account.name,
          role: account.role,
          status: 'active',
          email_verified: true,
          plan: 'pro',
        })
        .select('id, email, name, role')
        .single()

      if (insertError) {
        console.error(`   ${account.email} 생성 실패:`, insertError)
      } else {
        console.log(`   ${account.email} — 생성 완료 (${account.role}, ID: ${newUser.id})`)
      }
    }
  }

  // 4. 결과 확인
  console.log('\n3. 최종 확인...')
  const { data: users } = await supabase
    .from('users')
    .select('id, email, name, role, status, email_verified, plan')
    .in('email', testAccounts.map(a => a.email))

  console.log('\n=== 테스트 계정 현황 ===')
  for (const u of users || []) {
    console.log(`   ${u.email} | ${u.role} | status=${u.status} | verified=${u.email_verified} | plan=${u.plan}`)
  }

  console.log('\n=== 로그인 정보 ===')
  console.log(`   통합 테스트: test@marketingflow.kr / ${PASSWORD}`)
  console.log(`   관리자: admin@marketingflow.kr / ${PASSWORD}`)
  console.log('\n=== 완료 ===')
}

main().catch(console.error)
