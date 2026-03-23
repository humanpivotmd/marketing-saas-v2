// ============================================
// Database Types
// ============================================

export interface Plan {
  id: string
  name: string
  display_name: string
  price_monthly: number
  price_yearly: number
  content_limit: number
  keyword_limit: number
  image_limit: number
  saved_keyword_limit: number
  channel_limit: number
  brand_voice_limit: number
  team_member_limit: number
  history_days: number
  has_api_access: boolean
  has_priority_support: boolean
  is_active: boolean
  sort_order: number
  effective_from: string | null
  created_at: string
}

export type UserRole = 'user' | 'member' | 'team_admin' | 'admin' | 'super_admin'
export type UserStatus = 'pending' | 'active' | 'suspended'
export type ExperienceLevel = 'beginner' | 'expert'

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  role: UserRole
  status: UserStatus
  email_verified: boolean
  verify_token: string | null
  reset_token: string | null
  reset_expires: string | null
  avatar_url: string | null
  plan_id: string | null
  plan_started_at: string | null
  plan_expires_at: string | null
  onboarding_done: boolean
  experience_level: ExperienceLevel
  pending_plan_id: string | null
  pending_plan_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface BrandVoice {
  id: string
  user_id: string
  name: string
  industry: string | null
  tone: string | null
  description: string | null
  target_audience: string | null
  keywords: string[] | null
  banned_words: string[] | null
  required_words: string[] | null
  sample_content: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Keyword {
  id: string
  user_id: string
  keyword: string
  monthly_search: number | null
  monthly_search_mobile: number | null
  monthly_search_pc: number | null
  competition: string | null
  cpc: number | null
  grade: string | null
  group_name: string | null
  trend_data: Record<string, unknown> | null
  last_analyzed: string | null
  created_at: string
}

export interface KeywordOpportunity {
  id: string
  keyword: string
  industry: string
  opportunity_score: number
  search_volume: number | null
  competition_level: string | null
  trend_direction: 'rising' | 'stable' | 'declining' | null
  calculated_at: string
}

export type ContentType = 'blog' | 'threads' | 'instagram' | 'script'
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed'

export interface Content {
  id: string
  user_id: string
  brand_voice_id: string | null
  keyword_id: string | null
  type: ContentType
  title: string | null
  body: string
  hashtags: string[] | null
  meta_description: string | null
  tone: string | null
  word_count: number | null
  status: ContentStatus
  version: number
  parent_id: string | null
  ai_model: string | null
  ai_prompt_used: string | null
  seo_score: number | null
  prompt_version_id: string | null
  outline: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ContentMetric {
  id: string
  content_id: string
  channel_id: string | null
  views: number
  likes: number
  comments: number
  shares: number
  fetched_at: string
}

export interface Image {
  id: string
  user_id: string
  content_id: string | null
  prompt: string
  style: string | null
  size: string | null
  storage_path: string
  public_url: string | null
  created_at: string
}

export type Platform = 'instagram' | 'threads' | 'youtube' | 'naver_blog' | 'kakao'

export interface Channel {
  id: string
  user_id: string
  platform: Platform
  account_name: string | null
  account_id: string | null
  access_token: string | null
  refresh_token: string | null
  token_expires: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ScheduleStatus = 'pending' | 'publishing' | 'published' | 'failed'

export interface Schedule {
  id: string
  user_id: string
  content_id: string
  channel_id: string | null
  scheduled_at: string
  published_at: string | null
  status: ScheduleStatus
  error_message: string | null
  retry_count: number
  created_at: string
}

export type ActionType = 'content_create' | 'keyword_analyze' | 'image_generate' | 'publish'

export interface UsageLog {
  id: string
  user_id: string
  action_type: ActionType
  content_type: string | null
  ai_model: string | null
  tokens_used: number | null
  estimated_cost: number | null
  created_at: string
}

export type BillingCycle = 'monthly' | 'yearly'
export type PaymentStatus = 'completed' | 'refunded' | 'failed'

export interface Payment {
  id: string
  user_id: string
  plan_id: string | null
  amount: number
  billing_cycle: BillingCycle | null
  payment_method: string | null
  payment_key: string | null
  status: PaymentStatus
  paid_at: string
  expires_at: string | null
  created_at: string
}

export interface AdminPrompt {
  id: string
  step: string
  version: number
  prompt_text: string
  is_active: boolean
  traffic_ratio: number
  metrics: Record<string, unknown>
  created_by: string | null
  created_at: string
}

export interface EmailLog {
  id: string
  user_id: string | null
  to_email: string
  subject: string | null
  template: string | null
  status: string
  resend_id: string | null
  created_at: string
}

export interface BrandVoicePreset {
  id: string
  industry: string
  name: string
  tone: string
  description: string | null
  keywords: string[] | null
  sample_content: string | null
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  message: string
  status: TicketStatus
  admin_reply: string | null
  replied_at: string | null
  created_at: string
}

// ============================================
// API Request/Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface LoginResponse {
  user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'onboarding_done'> & { plan: string }
  session: {
    access_token: string
    refresh_token?: string
    expires_at: number
  }
}

export interface KeywordAnalyzeRequest {
  keyword: string
  period?: number
}

export interface ContentGenerateRequest {
  keyword: string
  type: ContentType
  brand_voice_id?: string
  tone?: string
  length?: 'short' | 'medium' | 'long'
  additional_instructions?: string
}

export interface ImageGenerateRequest {
  prompt: string
  style?: 'photo' | 'illustration' | 'minimal' | 'vintage'
  size?: '1200x630' | '1080x1080' | '1080x1920'
  content_id?: string
}

export interface UsageResponse {
  plan: string
  period: string
  content: { used: number; limit: number }
  keyword: { used: number; limit: number }
  image: { used: number; limit: number }
  saved_keywords: { used: number; limit: number }
  channels: { used: number; limit: number }
  brand_voices: { used: number; limit: number }
}

export interface ScheduleCreateRequest {
  content_id: string
  channel_id?: string
  scheduled_at: string
}

export interface PublishRequest {
  content_id: string
  channel_id: string
}

export interface BrandVoiceCreateRequest {
  name: string
  industry?: string
  tone?: string
  description?: string
  target_audience?: string
  keywords?: string[]
  banned_words?: string[]
  required_words?: string[]
  sample_content?: string
  is_default?: boolean
}

export interface AdminMailRequest {
  to: string | string[]
  subject: string
  body: string
}

export interface SupportTicketCreateRequest {
  subject: string
  message: string
}
