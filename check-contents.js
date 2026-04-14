const { chromium } = require('playwright');

async function checkContentsPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto('https://marketing-app-v2-production.up.railway.app/login', { waitUntil: 'networkidle' });

    const content = await page.content();
    console.log('Page content length:', content.length);
    console.log('Page title:', await page.title());

    // 이메일 입력 필드 찾기 (다양한 셀렉터 시도)
    const emailSelectors = ['input[name="email"]', 'input[type="email"]', 'input[placeholder*="이메일"]', 'input[placeholder*="email"]'];
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        emailInput = page.locator(selector);
        console.log('Found email input with selector:', selector);
        break;
      } catch (e) {
        // continue
      }
    }

    if (!emailInput) {
      console.log('Email input not found. Available inputs:');
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        console.log(`- type: ${type}, name: ${name}, placeholder: ${placeholder}`);
      }
      throw new Error('Email input not found');
    }

    console.log('Filling login form...');
    await emailInput.fill('humanpivot@admin.kr');

    // 비밀번호 입력
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('pivot0307!');

    console.log('Clicking login button...');
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    console.log('Waiting for navigation...');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    console.log('Navigating to /contents...');
    await page.goto('https://marketing-app-v2-production.up.railway.app/contents', { waitUntil: 'networkidle' });

    console.log('Checking for [만들기] buttons...');
    const makeButtons = page.locator('text=[만들기]');
    const count = await makeButtons.count();
    console.log(`Found ${count} [만들기] buttons`);

    // 영상❌ 배지 확인
    console.log('Checking 영상❌ badges...');
    const videoBadges = page.locator('span:has-text("영상❌")').locator('xpath=preceding-sibling::*[1]');
    const videoBadgeCount = await videoBadges.count();
    console.log(`Found ${videoBadgeCount} 영상❌ badges`);

    if (videoBadgeCount > 0) {
      const firstVideoBadge = videoBadges.first();
      const isVideoClickable = await firstVideoBadge.isVisible() && await firstVideoBadge.isEnabled();
      console.log('First 영상❌ badge is clickable:', isVideoClickable);

      if (isVideoClickable) {
        const videoHref = await firstVideoBadge.getAttribute('href');
        console.log('Video badge href:', videoHref);

        if (videoHref && videoHref.includes('/create/video-script')) {
          console.log('✅ 영상❌ 배지가 /create/video-script로 링크되어 있습니다.');
        } else {
          console.log('❌ 영상❌ 배지가 올바른 링크가 아닙니다.');
          return false;
        }
      } else {
        console.log('❌ 영상❌ 배지가 클릭 불가능합니다.');
        return false;
      }
    } else {
      console.log('ℹ️ 영상❌ 배지가 없습니다.');
    }

    // 이미지❌ 확인 (링크 없는지)
    console.log('Checking 이미지❌ texts...');
    const imageXTexts = page.locator('text=이미지❌');
    const imageXCount = await imageXTexts.count();
    console.log(`Found ${imageXCount} 이미지❌ texts`);

    // 이미지❌가 링크 걸려 있는지 확인 (부모 요소가 a 태그인지)
    let imageLinked = false;
    for (let i = 0; i < imageXCount; i++) {
      const textElement = imageXTexts.nth(i);
      const parentA = textElement.locator('xpath=ancestor::a[1]');
      const parentCount = await parentA.count();
      if (parentCount > 0) {
        imageLinked = true;
        break;
      }
    }

    if (imageLinked) {
      console.log('❌ 이미지❌에 링크가 걸려 있습니다.');
    } else {
      console.log('✅ 이미지❌에 링크가 없습니다.');
    }

    if (count > 0) {
      console.log('❌ [만들기] 버튼이 아직 존재합니다.');
      return false;
    } else {
      console.log('✅ [만들기] 버튼이 제거되었습니다.');
      return true;
    }

  } catch (error) {
    console.error('Error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

checkContentsPage().then(success => {
  process.exit(success ? 0 : 1);
});