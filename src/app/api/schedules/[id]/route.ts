import { NextRequest } from 'next/server'
import { z } from 'zod'
import { updateOwnedRecord, deleteOwnedRecord } from '@/lib/api-helpers'

const scheduleUpdateSchema = z.object({
  scheduled_at: z.string().datetime().optional(),
  status: z.enum(['pending', 'published', 'failed', 'cancelled']).optional(),
})

// PUT: 스케줄 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return updateOwnedRecord(req, params, 'schedules', scheduleUpdateSchema)
}

// DELETE: 스케줄 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return deleteOwnedRecord(req, params, 'schedules')
}
