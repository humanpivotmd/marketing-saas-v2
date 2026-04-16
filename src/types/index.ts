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

export type BusinessType = 'B2B' | 'B2C'
export type PromptMode = 'priority' | 'combine' | 'reference'

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
  // v3 마이페이지 확장
  business_type: BusinessType
  selected_channels: string[]
  target_audience: string | null
  target_gender: 'male' | 'female' | 'all'
  fixed_keywords: string[]
  blog_category: string | null
  industry_id: string | null
  company_name: string | null
  service_name: string | null
  writing_tone: string
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

export type ContentType = 'blog' | 'threads' | 'instagram' | 'facebook' | 'video_script' | 'script'
export type ContentStatus = 'draft' | 'generated' | 'confirmed' | 'edited' | 'scheduled' | 'published' | 'failed'

export interface Content {
  id: string
  user_id: string
  brand_voice_id: string | null
  keyword_id: string | null
  project_id: string | null
  channel: ContentType
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
  confirmed_at: string | null
  revision_note: string | null
  scheduled_date: string | null
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

export type Platform = 'instagram' | 'threads' | 'youtube' | 'naver_blog' | 'kakao' | 'facebook'

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
  | 'draft_generate' | 'title_generate' | 'image_script_generate' | 'video_script_generate'
  | 'quality_score' | 'content_revise'

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
// v3 Pipeline Types
// ============================================

export interface Industry {
  id: string
  parent_id: string | null
  name: string
  level: 1 | 2 | 3
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  children?: Industry[]
}

export type TopicType = 'info' | 'intro' | 'service' | 'product' | 'event'
export type ProjectStatus = 'in_progress' | 'completed' | 'archived'

export interface ProjectStepStatus {
  s1: 'pending' | 'completed'
  s2: 'pending' | 'completed'
  s3: 'pending' | 'completed'
  s4: 'pending' | 'completed'
  s5: 'pending' | 'completed'
  s6: 'pending' | 'completed'
  s7: 'pending' | 'completed'
}

export interface Project {
  id: string
  user_id: string
  keyword_id: string | null
  keyword_text: string | null
  business_type: BusinessType
  current_step: number
  step_status: ProjectStepStatus
  topic_type: TopicType | null
  selected_title: string | null
  title_candidates: string[] | null
  custom_prompt: string | null
  prompt_mode: PromptMode
  draft_content: string | null
  content_ids: Record<string, string>
  settings_snapshot: Record<string, unknown> | null
  status: ProjectStatus
  confirmed_at: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type ImageStyleType = 'photo' | 'illustration'

export interface ImageScriptPrompt {
  seq: number
  description_ko: string
  prompt_en: string
  placement?: string
}

export interface ImageScript {
  id: string
  project_id: string
  user_id: string
  content_id: string | null
  channel: string
  ai_tool: string
  image_size: string
  image_style: ImageStyleType
  style_detail: string | null
  prompts: ImageScriptPrompt[]
  thumbnail_prompt: string | null
  status: 'generating' | 'generated' | 'edited'
  created_at: string
  updated_at: string
}

export interface VideoScene {
  scene: number
  duration: number
  visual: string
  narration: string
  text_overlay?: string
  transition: string
}

export interface VideoScript {
  id: string
  project_id: string
  user_id: string
  content_id: string | null
  format: 'short' | 'normal'
  target_channel: string
  scene_count: number
  scene_duration: number
  total_duration: number | null
  image_style: ImageStyleType
  style_detail: string | null
  storyboard: VideoScene[]
  full_script: string | null
  status: 'generating' | 'generated' | 'edited'
  created_at: string
  updated_at: string
}

export interface UserPrompt {
  id: string
  user_id: string
  step: string
  prompt_text: string
  mode: PromptMode
  is_active: boolean
  created_at: string
  updated_at: string
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
