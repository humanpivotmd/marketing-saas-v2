#!/bin/bash
# Ralph Loop — MarketingFlow 자동 작업 실행기

set -e

echo '=== Ralph Loop 시작 ==='

echo '[1/3] 타입 체크 중...'
npx tsc --noEmit
echo '✅ 타입 체크 통과'

echo '[2/3] 빌드 중...'
npm run build
echo '✅ 빌드 성공'

echo '[3/3] PRD 상태 확인...'
node -e "
const prd = require('./.ralph/prd.json');
const total = prd.userStories.length;
const passed = prd.userStories.filter(s => s.passes).length;
console.log('PRD 현황: ' + passed + '/' + total + ' 통과');
prd.userStories.forEach(s => {
  console.log(s.id + ' ' + (s.passes ? '✅' : '❌') + ' ' + s.title);
});
"

echo '=== Ralph Loop 완료 ==='
