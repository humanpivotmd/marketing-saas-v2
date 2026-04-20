// MarketingFlow OpenAPI 3.0 Spec
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MarketingFlow API',
    description: 'AI 기반 마케팅 콘텐츠 자동화 SaaS API',
    version: '2.0.0',
    contact: { email: 'humanpivot@gmail.com' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
  ],
  tags: [
    { name: 'Auth', description: '인증 (로그인/가입/비밀번호)' },
    { name: 'Contents', description: '콘텐츠 관리 (CRUD)' },
    { name: 'Generate', description: 'AI 콘텐츠 생성 파이프라인' },
    { name: 'Keywords', description: '키워드 관리 및 분석' },
    { name: 'BrandVoice', description: '브랜드 보이스' },
    { name: 'Channels', description: '채널 연동' },
    { name: 'Publish', description: '콘텐츠 발행' },
    { name: 'Schedules', description: '예약 발행' },
    { name: 'Projects', description: '프로젝트 관리' },
    { name: 'Payments', description: '결제 및 구독' },
    { name: 'MyPage', description: '마이페이지' },
    { name: 'Admin', description: '관리자 기능' },
    { name: 'Support', description: '고객 지원' },
    { name: 'Public', description: '공개 API' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['user', 'member', 'team_admin', 'admin', 'super_admin'] },
          plan_id: { type: 'string', format: 'uuid', nullable: true },
          onboarding_done: { type: 'boolean' },
        },
      },
      Content: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          project_id: { type: 'string', format: 'uuid', nullable: true },
          channel: { type: 'string', enum: ['blog', 'instagram', 'threads', 'facebook'] },
          title: { type: 'string', nullable: true },
          body: { type: 'string', nullable: true },
          hashtags: { type: 'array', items: { type: 'string' } },
          seo_score: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['draft', 'generated', 'published'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Keyword: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          keyword: { type: 'string' },
          monthly_searches: { type: 'integer', nullable: true },
          competition: { type: 'string', nullable: true },
          grade: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Plan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          display_name: { type: 'string' },
          price_monthly: { type: 'integer' },
          price_yearly: { type: 'integer' },
          content_limit: { type: 'integer' },
          keyword_limit: { type: 'integer' },
          image_limit: { type: 'integer' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          plan_id: { type: 'string', format: 'uuid', nullable: true },
          amount: { type: 'integer' },
          billing_cycle: { type: 'string', enum: ['monthly', 'yearly'] },
          status: { type: 'string', enum: ['completed', 'refunded', 'failed'] },
          paid_at: { type: 'string', format: 'date-time' },
        },
      },
      BrandVoice: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          tone: { type: 'string' },
          industry: { type: 'string' },
          is_default: { type: 'boolean' },
        },
      },
      Schedule: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          content_id: { type: 'string', format: 'uuid' },
          scheduled_at: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'publishing', 'published', 'failed'] },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          keyword_text: { type: 'string' },
          business_type: { type: 'string', enum: ['B2B', 'B2C'] },
          current_step: { type: 'integer', minimum: 1, maximum: 7 },
          status: { type: 'string', enum: ['in_progress', 'completed', 'archived'] },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── Auth ──
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: '로그인', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } } } } } },
        responses: { '200': { description: '로그인 성공', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' }, session: { type: 'object', properties: { access_token: { type: 'string' }, expires_at: { type: 'string' } } } } } } } }, '401': { description: '인증 실패', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'], summary: '회원가입', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'name'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, name: { type: 'string' } } } } } },
        responses: { '200': { description: '가입 성공' }, '409': { description: '이메일 중복' } },
      },
    },
    '/api/auth/me': {
      get: { tags: ['Auth'], summary: '현재 사용자 조회', responses: { '200': { description: '사용자 정보' } } },
    },
    '/api/auth/forgot-password': {
      post: { tags: ['Auth'], summary: '비밀번호 재설정 요청', security: [], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } }, responses: { '200': { description: '재설정 메일 발송' } } },
    },
    '/api/auth/reset-password': {
      post: { tags: ['Auth'], summary: '비밀번호 재설정', security: [], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } } } } } }, responses: { '200': { description: '변경 완료' } } },
    },
    '/api/auth/verify-email': {
      post: { tags: ['Auth'], summary: '이메일 인증', security: [], responses: { '200': { description: '인증 완료' } } },
    },
    '/api/auth/resend-verify': {
      post: { tags: ['Auth'], summary: '인증 메일 재전송', responses: { '200': { description: '재전송 완료' } } },
    },
    // ── Contents ──
    '/api/contents': {
      get: {
        tags: ['Contents'], summary: '콘텐츠 목록',
        parameters: [
          { name: 'channel', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: 'created_at' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: '콘텐츠 목록', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Content' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } } },
      },
      post: {
        tags: ['Contents'], summary: '콘텐츠 수동 생성',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['channel', 'title', 'body'], properties: { channel: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' } } } } } } },
        responses: { '200': { description: '생성 성공' } },
      },
    },
    '/api/contents/{id}': {
      get: { tags: ['Contents'], summary: '콘텐츠 상세', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '콘텐츠 상세' }, '404': { description: '없음' } } },
      put: { tags: ['Contents'], summary: '콘텐츠 수정', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } } } } } }, responses: { '200': { description: '수정 성공' } } },
      delete: { tags: ['Contents'], summary: '콘텐츠 삭제', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '삭제 성공' } } },
    },
    '/api/contents/{id}/duplicate': {
      post: { tags: ['Contents'], summary: '콘텐츠 복제', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '복제 성공' } } },
    },
    // ── Generate ──
    '/api/generate': {
      post: { tags: ['Generate'], summary: '일괄 생성 (SSE 스트리밍)', description: 'Server-Sent Events로 생성 진행률을 스트리밍합니다.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['keyword'], properties: { keyword: { type: 'string' }, type: { type: 'string' }, brand_voice_id: { type: 'string' }, tone: { type: 'string' }, length: { type: 'string', enum: ['short', 'medium', 'long'] } } } } } }, responses: { '200': { description: 'SSE 스트림' } } },
    },
    '/api/generate/titles': {
      post: { tags: ['Generate'], summary: '제목 5개 생성', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['keyword'], properties: { keyword: { type: 'string' }, topic_type: { type: 'string', enum: ['info', 'intro', 'service', 'product', 'event'] }, business_type: { type: 'string', enum: ['B2B', 'B2C'] } } } } } }, responses: { '200': { description: '제목 배열', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { titles: { type: 'array', items: { type: 'string' } } } } } } } } } } },
    },
    '/api/generate/draft': {
      post: { tags: ['Generate'], summary: '초안 생성', responses: { '200': { description: '초안 생성 완료' } } },
    },
    '/api/generate/pipeline': {
      post: { tags: ['Generate'], summary: '채널별 콘텐츠 변환 (SSE)', description: 'STEP5: 초안을 채널별로 변환. SSE 스트리밍으로 채널별 진행 상태 전송', responses: { '200': { description: 'SSE 스트림' } } },
    },
    '/api/generate/single': {
      post: { tags: ['Generate'], summary: '단일 채널 재생성', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['project_id', 'channel'], properties: { project_id: { type: 'string' }, channel: { type: 'string' } } } } } }, responses: { '200': { description: '재생성 완료' } } },
    },
    '/api/generate/image-script': {
      post: { tags: ['Generate'], summary: '이미지 프롬프트 생성 (STEP6)', responses: { '200': { description: '이미지 프롬프트 JSON' } } },
    },
    '/api/generate/video-script': {
      post: { tags: ['Generate'], summary: '영상 스크립트 생성 (STEP7)', responses: { '200': { description: '영상 스크립트 JSON' } } },
    },
    '/api/generate/image': {
      post: { tags: ['Generate'], summary: 'AI 이미지 생성 (Gemini)', responses: { '200': { description: '이미지 URL' } } },
    },
    '/api/generate/outline': {
      post: { tags: ['Generate'], summary: '개요 생성', responses: { '200': { description: '개요' } } },
    },
    // ── Keywords ──
    '/api/keywords': {
      get: { tags: ['Keywords'], summary: '저장된 키워드 목록', parameters: [{ name: 'group', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: '키워드 목록' } } },
      post: { tags: ['Keywords'], summary: '키워드 등록', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['keyword'], properties: { keyword: { type: 'string' } } } } } }, responses: { '200': { description: '등록 성공' } } },
      delete: { tags: ['Keywords'], summary: '키워드 일괄 삭제', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['ids'], properties: { ids: { type: 'array', items: { type: 'string', format: 'uuid' } } } } } } }, responses: { '200': { description: '삭제 성공' } } },
    },
    '/api/keywords/{id}': {
      get: { tags: ['Keywords'], summary: '키워드 상세', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '키워드 상세' } } },
      put: { tags: ['Keywords'], summary: '키워드 수정', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '수정 성공' } } },
      delete: { tags: ['Keywords'], summary: '키워드 삭제', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '삭제 성공' } } },
    },
    '/api/keywords/grade': { post: { tags: ['Keywords'], summary: '키워드 등급 분석', responses: { '200': { description: '등급 결과' } } } },
    '/api/keywords/naver': { post: { tags: ['Keywords'], summary: '네이버 검색량 조회', description: '최대 5개 키워드의 월간 검색량, CPC 조회', responses: { '200': { description: '검색량 데이터' } } } },
    '/api/keywords/trends': { post: { tags: ['Keywords'], summary: '키워드 트렌드 분석', responses: { '200': { description: '트렌드 데이터' } } } },
    '/api/keywords/seo-score': { post: { tags: ['Keywords'], summary: 'SEO 점수 계산', responses: { '200': { description: 'SEO 점수' } } } },
    '/api/keywords/opportunities': { post: { tags: ['Keywords'], summary: '키워드 기회 분석', responses: { '200': { description: '기회 분석 결과' } } } },
    // ── Brand Voice ──
    '/api/brand-voices': {
      get: { tags: ['BrandVoice'], summary: '브랜드 보이스 목록', responses: { '200': { description: '목록' } } },
      post: { tags: ['BrandVoice'], summary: '브랜드 보이스 생성', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'tone'], properties: { name: { type: 'string' }, tone: { type: 'string' }, industry: { type: 'string' }, description: { type: 'string' }, is_default: { type: 'boolean' } } } } } }, responses: { '200': { description: '생성 성공' } } },
    },
    '/api/brand-voices/{id}': {
      put: { tags: ['BrandVoice'], summary: '수정', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '수정 성공' } } },
      delete: { tags: ['BrandVoice'], summary: '삭제', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '삭제 성공' } } },
    },
    // ── Channels ──
    '/api/channels': {
      get: { tags: ['Channels'], summary: '연동 채널 목록', responses: { '200': { description: '채널 목록' } } },
      post: { tags: ['Channels'], summary: '채널 연동', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['platform', 'account_name'], properties: { platform: { type: 'string', enum: ['instagram', 'threads', 'youtube', 'naver_blog', 'kakao', 'facebook'] }, account_name: { type: 'string' }, access_token: { type: 'string' } } } } } }, responses: { '200': { description: '연동 성공' } } },
    },
    '/api/channels/{id}': {
      put: { tags: ['Channels'], summary: '채널 수정', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '수정 성공' } } },
      delete: { tags: ['Channels'], summary: '채널 연동 해제', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '해제 성공' } } },
    },
    '/api/channels/test': { post: { tags: ['Channels'], summary: '채널 연동 테스트', responses: { '200': { description: '테스트 결과' } } } },
    // ── Publish ──
    '/api/publish/instagram': { post: { tags: ['Publish'], summary: 'Instagram 발행', responses: { '200': { description: '발행 성공' } } } },
    '/api/publish/threads': { post: { tags: ['Publish'], summary: 'Threads 발행', responses: { '200': { description: '발행 성공' } } } },
    '/api/publish/clipboard': { post: { tags: ['Publish'], summary: '클립보드 복사 기록', responses: { '200': { description: '기록 완료' } } } },
    // ── Schedules ──
    '/api/schedules': {
      get: { tags: ['Schedules'], summary: '스케줄 목록', parameters: [{ name: 'from', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'status', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: '스케줄 목록' } } },
      post: { tags: ['Schedules'], summary: '스케줄 등록', responses: { '200': { description: '등록 성공' } } },
    },
    '/api/schedules/{id}': {
      put: { tags: ['Schedules'], summary: '스케줄 수정', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '수정 성공' } } },
      delete: { tags: ['Schedules'], summary: '스케줄 삭제', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '삭제 성공' } } },
    },
    // ── Projects ──
    '/api/projects': {
      get: { tags: ['Projects'], summary: '프로젝트 목록', parameters: [{ name: 'include', in: 'query', schema: { type: 'string', default: 'contents' } }, { name: 'status', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: '프로젝트 목록' } } },
      post: { tags: ['Projects'], summary: '프로젝트 생성', responses: { '200': { description: '생성 성공' } } },
      delete: { tags: ['Projects'], summary: '프로젝트 소프트 삭제', responses: { '200': { description: '삭제 성공' } } },
    },
    '/api/projects/{id}': {
      get: { tags: ['Projects'], summary: '프로젝트 상세', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '프로젝트 상세 (contents, image_scripts, video_scripts 포함)' } } },
    },
    // ── Payments ──
    '/api/payments/checkout': { post: { tags: ['Payments'], summary: '결제 세션 생성', responses: { '200': { description: 'Order ID + 결제 정보' } } } },
    '/api/payments/confirm': { post: { tags: ['Payments'], summary: '결제 확인', responses: { '200': { description: '결제 완료 + 플랜 활성화' } } } },
    '/api/payments/history': { get: { tags: ['Payments'], summary: '결제 이력 (본인)', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: '결제 이력' } } } },
    '/api/payments/webhook': { post: { tags: ['Payments'], summary: '토스페이먼츠 웹훅', security: [], description: 'HMAC-SHA256 서명 검증. PAYMENT_STATUS_CHANGED, BILLING_KEY_STATUS_CHANGED, REFUND_STATUS_CHANGED 이벤트 처리', responses: { '200': { description: '처리 완료' } } } },
    '/api/subscriptions': {
      get: { tags: ['Payments'], summary: '현재 구독 정보', responses: { '200': { description: '구독 상세' } } },
      post: { tags: ['Payments'], summary: '구독 변경 (다운그레이드)', responses: { '200': { description: '변경 예약' } } },
    },
    '/api/subscriptions/cancel': { post: { tags: ['Payments'], summary: '구독 취소', responses: { '200': { description: '취소 예약' } } } },
    // ── MyPage ──
    '/api/mypage/profile': {
      get: { tags: ['MyPage'], summary: '프로필 조회', responses: { '200': { description: '프로필' } } },
      put: { tags: ['MyPage'], summary: '프로필 수정', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: '수정 성공' } } },
    },
    '/api/mypage/usage': { get: { tags: ['MyPage'], summary: '사용량 조회', responses: { '200': { description: '플랜별 사용량 (content/keyword/image)' } } } },
    '/api/mypage/account': { get: { tags: ['MyPage'], summary: '계정 정보', responses: { '200': { description: '계정 정보' } } } },
    '/api/mypage/password': { put: { tags: ['MyPage'], summary: '비밀번호 변경', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['current_password', 'new_password'], properties: { current_password: { type: 'string' }, new_password: { type: 'string', minLength: 8 } } } } } }, responses: { '200': { description: '변경 성공' } } } },
    '/api/mypage/business-profile': {
      get: { tags: ['MyPage'], summary: '사업 프로필 조회', responses: { '200': { description: '사업 프로필' } } },
      put: { tags: ['MyPage'], summary: '사업 프로필 수정', responses: { '200': { description: '수정 성공' } } },
    },
    // ── Admin ──
    '/api/admin/users': { get: { tags: ['Admin'], summary: '회원 목록', parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'role', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'plan', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: '회원 목록' } } } },
    '/api/admin/users/{id}': {
      get: { tags: ['Admin'], summary: '회원 상세', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '회원 상세 + 플랜 + 사용량' } } },
      put: { tags: ['Admin'], summary: '회원 수정 (role/plan/status)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { role: { type: 'string' }, status: { type: 'string' }, plan_id: { type: 'string' }, name: { type: 'string' } } } } } }, responses: { '200': { description: '수정 성공' } } },
      delete: { tags: ['Admin'], summary: '회원 삭제 (super_admin)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '삭제 성공' } } },
    },
    '/api/admin/users/{id}/password-reset': { post: { tags: ['Admin'], summary: '비밀번호 강제 변경 (super_admin)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '변경 성공' } } } },
    '/api/admin/users/{id}/unlock': { post: { tags: ['Admin'], summary: '계정 잠금 해제', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '해제 성공' } } } },
    '/api/admin/users/{id}/usage-grant': { post: { tags: ['Admin'], summary: '사용량 수동 부여 (1~100)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['action_type', 'amount'], properties: { action_type: { type: 'string', enum: ['content_create', 'keyword_analyze', 'image_generate'] }, amount: { type: 'integer', minimum: 1, maximum: 100 }, reason: { type: 'string' } } } } } }, responses: { '200': { description: '부여 성공' } } } },
    '/api/admin/stats': { get: { tags: ['Admin'], summary: 'KPI 대시보드 (MRR/Churn/LTV)', responses: { '200': { description: 'KPI 데이터' } } } },
    '/api/admin/stats/costs': { get: { tags: ['Admin'], summary: '비용 분석', responses: { '200': { description: '비용 데이터' } } } },
    '/api/admin/action-logs': { get: { tags: ['Admin'], summary: '관리자 액션 로그', parameters: [{ name: 'action', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: '액션 로그 목록' } } } },
    '/api/admin/logs': { get: { tags: ['Admin'], summary: '시스템 로그', responses: { '200': { description: '로그 목록' } } } },
    '/api/admin/payments': { get: { tags: ['Admin'], summary: '결제 이력 (관리자)', parameters: [{ name: 'user_id', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: '결제 이력' } } } },
    '/api/admin/plan-limits': {
      get: { tags: ['Admin'], summary: '플랜 제한값 조회', responses: { '200': { description: '플랜 목록' } } },
      put: { tags: ['Admin'], summary: '플랜 제한값 수정', responses: { '200': { description: '수정 성공' } } },
    },
    '/api/admin/prompts': {
      get: { tags: ['Admin'], summary: 'AI 프롬프트 버전 목록', responses: { '200': { description: '프롬프트 목록' } } },
      post: { tags: ['Admin'], summary: '새 프롬프트 버전 저장', responses: { '200': { description: '저장 성공' } } },
    },
    '/api/admin/prompts/{id}/activate': { post: { tags: ['Admin'], summary: '프롬프트 활성화', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '활성화 성공' } } } },
    '/api/admin/industries': {
      get: { tags: ['Admin'], summary: '업종 목록 (트리)', responses: { '200': { description: '업종 트리' } } },
      post: { tags: ['Admin'], summary: '업종 추가', responses: { '200': { description: '추가 성공' } } },
    },
    '/api/admin/industries/{id}': {
      get: { tags: ['Admin'], summary: '업종 상세', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '상세' } } },
      put: { tags: ['Admin'], summary: '업종 수정', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '수정 성공' } } },
      delete: { tags: ['Admin'], summary: '업종 삭제', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: '삭제 성공' } } },
    },
    '/api/admin/mail/send': { post: { tags: ['Admin'], summary: '이메일 발송', responses: { '200': { description: '발송 성공' } } } },
    '/api/admin/mail/history': { get: { tags: ['Admin'], summary: '이메일 이력', responses: { '200': { description: '이력' } } } },
    '/api/admin/support': { post: { tags: ['Admin'], summary: '문의 관리', responses: { '200': { description: '처리 완료' } } } },
    '/api/admin/migrate': { post: { tags: ['Admin'], summary: '데이터 마이그레이션', responses: { '200': { description: '완료' } } } },
    // ── Support ──
    '/api/support': {
      get: { tags: ['Support'], summary: '내 문의 목록', responses: { '200': { description: '문의 목록' } } },
      post: { tags: ['Support'], summary: '문의 등록', responses: { '200': { description: '등록 성공' } } },
    },
    // ── Public ──
    '/api/industries': { get: { tags: ['Public'], summary: '업종 목록 (공개)', security: [], responses: { '200': { description: '업종 목록' } } } },
    '/api/public/keyword-preview': { post: { tags: ['Public'], summary: '키워드 미리보기 (Rate Limited)', security: [], responses: { '200': { description: '미리보기 결과' } } } },
    '/api/calendar': { get: { tags: ['Public'], summary: '캘린더 데이터', responses: { '200': { description: '캘린더 이벤트' } } } },
    '/api/chat': { post: { tags: ['Public'], summary: 'AI 챗봇 (N8N)', responses: { '200': { description: '챗봇 응답' } } } },
    '/api/user-prompts': { post: { tags: ['Public'], summary: '사용자 커스텀 프롬프트', responses: { '200': { description: '프롬프트 저장' } } } },
    '/api/social-settings': { get: { tags: ['Public'], summary: '소셜 설정', responses: { '200': { description: '설정 데이터' } } } },
  },
}
