const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class BrowserManager {
  constructor(config = {}) {
    this.config = {
      headless: true,
      timeout: 30000,
      viewport: {
        width: 1920,
        height: 1080
      },
      ...config
    };
    this.browser = null;
    this.pages = new Map();
  }

  async launch() {
    if (this.browser) {
      return this.browser;
    }

    console.log('🚀 브라우저를 시작합니다...');

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    return this.browser;
  }

  async newPage(id = 'default') {
    if (!this.browser) {
      await this.launch();
    }

    const page = await this.browser.newPage();

    // 뷰포트 설정
    await page.setViewport(this.config.viewport);

    // 사용자 에이전트 설정
    if (this.config.userAgent) {
      await page.setUserAgent(this.config.userAgent);
    }

    // 기본 타임아웃 설정
    page.setDefaultTimeout(this.config.timeout);

    // 페이지 로딩 최적화
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    this.pages.set(id, page);
    return page;
  }

  async goto(url, pageId = 'default', options = {}) {
    let page = this.pages.get(pageId);

    if (!page) {
      page = await this.newPage(pageId);
    }

    const defaultOptions = {
      waitUntil: 'networkidle2',
      timeout: this.config.timeout
    };

    try {
      console.log(`📄 페이지 로딩: ${url}`);
      await page.goto(url, { ...defaultOptions, ...options });

      // 페이지 로딩 완료 대기
      await this.waitForPageLoad(page);

      return page;
    } catch (error) {
      console.error(`❌ 페이지 로딩 실패: ${url}`, error.message);
      throw error;
    }
  }

  async waitForPageLoad(page, timeout = 10000) {
    try {
      await Promise.race([
        page.waitForSelector('body', { timeout }),
        page.waitForFunction(() => document.readyState === 'complete', { timeout })
      ]);
    } catch (error) {
      console.warn('⚠️ 페이지 로딩 타임아웃, 계속 진행합니다...');
    }
  }

  async screenshot(pageId = 'default', filename = null) {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`페이지를 찾을 수 없습니다: ${pageId}`);
    }

    const screenshotPath = filename || `screenshot_${Date.now()}.png`;
    const fullPath = path.join('./data', screenshotPath);

    await fs.ensureDir(path.dirname(fullPath));
    await page.screenshot({ path: fullPath, fullPage: true });

    console.log(`📸 스크린샷 저장: ${fullPath}`);
    return fullPath;
  }

  async delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`⏳ ${delay}ms 대기 중...`);
    await this.delay(delay);
  }

  async closePage(pageId) {
    const page = this.pages.get(pageId);
    if (page) {
      await page.close();
      this.pages.delete(pageId);
      console.log(`🗑️ 페이지 종료: ${pageId}`);
    }
  }

  async close() {
    console.log('🛑 브라우저를 종료합니다...');

    // 모든 페이지 종료
    for (const [pageId, page] of this.pages) {
      try {
        await page.close();
      } catch (error) {
        console.warn(`페이지 종료 실패: ${pageId}`, error.message);
      }
    }

    this.pages.clear();

    // 브라우저 종료
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = BrowserManager;