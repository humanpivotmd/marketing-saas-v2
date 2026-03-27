import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getOwnedRecord, updateOwnedRecord, deleteOwnedRecord } from '@/lib/api-helpers'

const contentUpdateSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  seo_score: z.number().min(0).max(100).optional(),
  status: z.enum(['draft', 'generated', 'confirmed', 'edited', 'scheduled', 'published', 'failed']).optional(),
  confirmed_at: z.string().optional(),
  revision_note: z.string().optional(),
  scheduled_date: z.string().optional().nullable(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

// GET: 콘텐츠 상세
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return getOwnedRecord(req, params, 'contents')
}

// PUT: 콘텐츠 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return updateOwnedRecord(req, params, 'contents', contentUpdateSchema)
}

// DELETE: 콘텐츠 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return deleteOwnedRecord(req, params, 'contents')
}
