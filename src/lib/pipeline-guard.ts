import { SupabaseClient } from '@supabase/supabase-js'

type StepKey = 's5' | 's6' | 's7'
type StepStatus = 'pending' | 'generating' | 'completed' | 'failed'

interface GuardResult {
  shouldSkip: boolean
  reason?: 'already_completed' | 'in_progress'
}

/**
 * STEP5/6/7 generate API 시작 전 중복 실행을 방지한다.
 *
 * 동작:
 * 1. 이미 completed → shouldSkip: true 반환 (기존 결과 그대로 사용)
 * 2. 현재 generating 중 → shouldSkip: true 반환 (동시 호출 차단)
 * 3. 통과 시 → step_status를 'generating'으로 업데이트 후 shouldSkip: false 반환
 *
 * 사용:
 *   const guard = await preventDuplicateStep(supabase, project_id, userId, 's5')
 *   if (guard.shouldSkip) return NextResponse.json({ success: true, skipped: true })
 *   // 실제 생성 로직...
 *   // 완료 후 반드시 markStepDone() 호출
 *
 * NOTE: SELECT → UPDATE 사이에 이론적 race condition 존재. 실무상 위험 매우 낮음
 *       (SSE는 단일 클라이언트). 100% 원자성 필요 시 RPC로 atomic update 가능.
 */
export async function preventDuplicateStep(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  stepKey: StepKey
): Promise<GuardResult> {
  // 소유권 검증 포함 조회
  const { data, error } = await supabase
    .from('projects')
    .select('step_status')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('프로젝트를 찾을 수 없습니다.')
  }

  const currentStatus: StepStatus = data.step_status?.[stepKey] ?? 'pending'

  if (currentStatus === 'completed') {
    return { shouldSkip: true, reason: 'already_completed' }
  }

  if (currentStatus === 'generating') {
    return { shouldSkip: true, reason: 'in_progress' }
  }

  // generating 플래그 설정 (동시 호출 차단)
  await supabase
    .from('projects')
    .update({
      step_status: {
        ...data.step_status,
        [stepKey]: 'generating',
      },
    })
    .eq('id', projectId)
    .eq('user_id', userId)

  return { shouldSkip: false }
}

/**
 * generate 성공 후 step을 completed로 표시한다.
 * 반드시 생성 완료 직후 호출할 것.
 */
export async function markStepDone(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  stepKey: StepKey,
  extraUpdate?: Record<string, unknown>
): Promise<void> {
  const { data } = await supabase
    .from('projects')
    .select('step_status')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  await supabase
    .from('projects')
    .update({
      step_status: {
        ...data?.step_status,
        [stepKey]: 'completed',
      },
      ...extraUpdate,
    })
    .eq('id', projectId)
    .eq('user_id', userId)
}

/**
 * generate 실패 시 step을 failed로 표시한다.
 * generating 상태로 방치하면 해당 step이 영구적으로 잠긴다.
 * try/catch의 catch 블록에서 반드시 호출할 것.
 */
export async function markStepFailed(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  stepKey: StepKey
): Promise<void> {
  const { data } = await supabase
    .from('projects')
    .select('step_status')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  await supabase
    .from('projects')
    .update({
      step_status: {
        ...data?.step_status,
        [stepKey]: 'failed',
      },
    })
    .eq('id', projectId)
    .eq('user_id', userId)
}

// ─────────────────────────────────────────────
// 사용 예시 (API route에서)
// ─────────────────────────────────────────────
//
// import {
//   preventDuplicateStep,
//   markStepDone,
//   markStepFailed,
// } from '@/lib/pipeline-guard'
//
// export async function POST(req: Request) {
//   const authUser = await requireAuth(req)
//   const { project_id } = await req.json()
//
//   // 1. 중복 실행 방지
//   const guard = await preventDuplicateStep(supabase, project_id, authUser.userId, 's5')
//   if (guard.shouldSkip) {
//     return NextResponse.json({ success: true, skipped: true, reason: guard.reason })
//   }
//
//   try {
//     // 2. 실제 생성 로직
//     const result = await generateContent(...)
//
//     // 3. 성공 표시
//     await markStepDone(supabase, project_id, authUser.userId, 's5', {
//       current_step: 6,
//     })
//
//     return NextResponse.json({ success: true, data: result })
//
//   } catch (err) {
//     // 4. 실패 표시 (generating 상태로 방치 금지)
//     await markStepFailed(supabase, project_id, authUser.userId, 's5')
//     return handleApiError(err)
//   }
// }
