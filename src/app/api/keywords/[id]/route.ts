import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getOwnedRecord, updateOwnedRecord, deleteOwnedRecord } from '@/lib/api-helpers'

const keywordUpdateSchema = z.object({
  keyword: z.string().min(1).max(200).optional(),
  group_name: z.string().max(100).nullable().optional(),
  grade: z.string().max(5).optional(),
  monthly_search: z.number().int().optional(),
  monthly_search_pc: z.number().int().optional(),
  monthly_search_mobile: z.number().int().optional(),
  competition: z.string().max(10).optional(),
  cpc: z.number().int().optional(),
  trend_data: z.record(z.string(), z.unknown()).nullable().optional(),
  last_analyzed: z.string().datetime().optional(),
})

// GET: 키워드 상세
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return getOwnedRecord(req, params, 'keywords')
}

// PUT: 키워드 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return updateOwnedRecord(req, params, 'keywords', keywordUpdateSchema, { addTimestamp: false })
}

// DELETE: 키워드 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return deleteOwnedRecord(req, params, 'keywords')
}
