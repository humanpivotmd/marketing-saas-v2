-- ============================================
-- Seed Data: Plans
-- ============================================

INSERT INTO plans (name, display_name, price_monthly, price_yearly, content_limit, keyword_limit, image_limit, saved_keyword_limit, channel_limit, brand_voice_limit, team_member_limit, history_days, has_api_access, has_priority_support, sort_order)
VALUES
  ('free', 'Free', 0, 0, 10, 20, 5, 20, 1, 1, 0, 30, false, false, 0),
  ('starter', 'Starter', 29000, 278400, 100, 200, 50, 200, 3, 3, 0, 180, false, false, 1),
  ('pro', 'Pro', 59000, 566400, 500, 1000, 200, 1000, 10, 10, 3, 0, false, false, 2),
  ('business', 'Business', 149000, 1430400, 0, 0, 0, 0, 0, 0, 20, 0, true, true, 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Seed Data: AI Prompts (5 types)
-- ============================================

INSERT INTO admin_prompts (step, version, prompt_text, is_active, traffic_ratio)
VALUES
  ('blog', 1, '당신은 한국 SEO에 특화된 블로그 작성 전문가입니다.

## 작성 규칙
- 네이버 SEO(C-Rank, D.I.A.)에 최적화된 구조로 작성
- 제목은 키워드를 자연스럽게 포함 (32자 이내)
- 소제목(H2, H3)을 활용한 체계적 구조
- 키워드 밀도: 본문 대비 2-3%
- 자연스럽고 읽기 쉬운 한국어
- 독자에게 실질적 가치를 제공하는 정보 중심

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 추가 지시: {additional_instructions}
## 톤: {tone}
## 길이: {length}', true, 100),

  ('threads', 1, '당신은 Threads 콘텐츠 전문가입니다.

## 작성 규칙
- 500자 이내의 짧고 임팩트 있는 텍스트
- 첫 문장에서 시선을 끄는 훅(Hook) 포함
- 해시태그 5-10개 (관련성 높은 것만)
- 이모지 적절히 활용
- 대화체/공감형 문체

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 톤: {tone}', true, 100),

  ('instagram', 1, '당신은 Instagram 캡션 전문가입니다.

## 작성 규칙
- 2,200자 이내 캡션
- 첫 줄에 강한 훅(Hook) — 더보기 유도
- 스토리텔링 구조 (공감 → 정보 → CTA)
- 해시태그 최대 30개 (대중+니치 혼합)
- CTA 포함 (댓글, 저장, 공유 유도)

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 톤: {tone}', true, 100),

  ('script', 1, '당신은 영상 스크립트 전문가입니다.

## 작성 규칙
- 30초~3분 분량 (사용자 선택에 따라 조절)
- [Hook] 3초 내 시선 집중
- [본문] 핵심 내용 전달
- [CTA] 구독/좋아요/댓글 유도
- 구어체, 리듬감 있는 문장
- 자막 표시 지점 표기

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 톤: {tone}
## 길이: {length}', true, 100),

  ('image', 1, 'Generate a marketing image for: {prompt}

Style: {style}
The image should be professional, clean, and suitable for Korean social media marketing.
Do not include any text in the image unless explicitly requested.
Aspect ratio and composition should match {size} dimensions.', true, 100)
ON CONFLICT DO NOTHING;

-- ============================================
-- Seed Data: Brand Voice Presets
-- ============================================

INSERT INTO brand_voice_presets (industry, name, tone, description, keywords, sample_content)
VALUES
  ('restaurant', '음식점/카페', 'friendly', '따뜻하고 친근한 톤으로 맛집과 카페의 매력을 전달합니다. 식욕을 자극하는 감각적 묘사와 실제 방문 경험을 녹여냅니다.', ARRAY['맛집', '카페', '메뉴', '분위기', '데이트'], '오늘도 어김없이 줄 선 그 집, 비결이 뭘까요? 직접 가봤습니다.'),
  ('beauty', '뷰티/패션', 'trendy', '트렌디하고 세련된 톤으로 뷰티/패션 브랜드의 감성을 전달합니다. 최신 트렌드와 실용적인 팁을 제공합니다.', ARRAY['뷰티', '화장품', '패션', '스타일', '트렌드'], '요즘 인스타에서 핫한 그 립 컬러, 실제로 발라봤습니다.'),
  ('fitness', '피트니스/건강', 'motivational', '동기부여하는 톤으로 건강과 운동의 가치를 전달합니다. 과학적 근거와 실전 경험을 결합합니다.', ARRAY['운동', '헬스', '다이어트', '건강', '피트니스'], '3개월 만에 체지방 8% 감량한 실제 루틴을 공개합니다.'),
  ('education', '교육/학원', 'professional', '신뢰감 있고 전문적인 톤으로 교육 서비스의 가치를 전달합니다. 구체적인 성과와 학습 방법론을 강조합니다.', ARRAY['교육', '학원', '수학', '영어', '입시'], '수학 내신 1등급, 비결은 문제 풀이가 아니라 개념 이해였습니다.'),
  ('tech', 'IT/테크', 'informative', '정보 중심의 깔끔한 톤으로 기술 제품과 서비스를 설명합니다. 복잡한 내용을 쉽게 풀어냅니다.', ARRAY['IT', '테크', '앱', '소프트웨어', '스타트업'], '업무 효율 200% 올려준 생산성 앱 5가지를 정리했습니다.'),
  ('realestate', '부동산/인테리어', 'trustworthy', '신뢰감 있는 톤으로 부동산과 인테리어 정보를 전달합니다. 전문 지식과 실제 사례를 제공합니다.', ARRAY['부동산', '아파트', '인테리어', '이사', '전세'], '신혼부부가 꼭 알아야 할 전세 계약 체크리스트 7가지'),
  ('pet', '반려동물', 'warm', '따뜻하고 공감하는 톤으로 반려인의 마음을 대변합니다. 반려동물 건강과 행복에 초점을 맞춥니다.', ARRAY['반려견', '반려묘', '펫', '동물병원', '사료'], '우리 강아지가 자꾸 긁는 이유, 수의사에게 직접 물어봤습니다.'),
  ('travel', '여행/숙박', 'adventurous', '설렘을 주는 톤으로 여행지의 매력을 생생하게 전달합니다. 실제 여행 경험과 꿀팁을 공유합니다.', ARRAY['여행', '숙소', '호텔', '맛집', '관광'], '제주도 숨은 명소 5곳, 관광객은 모르는 현지인 추천 코스')
ON CONFLICT (industry) DO NOTHING;
