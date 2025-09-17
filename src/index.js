const TistoryScraper = require('./scrapers/tistory');
const YoutubeScraper = require('./scrapers/youtube');
const BrowserManager = require('./core/browser');
const Utils = require('./core/utils');

// 메인 클래스
class KoreanSocialScraper {
  constructor(config = {}) {
    this.config = {
      output_dir: './data',
      browser: {
        headless: true,
        timeout: 30000
      },
      ...config
    };
  }

  // 플랫폼별 스크래퍼 인스턴스 생성
  getTistoryScraper() {
    return new TistoryScraper(this.config);
  }

  getYoutubeScraper() {
    return new YoutubeScraper(this.config);
  }

  // URL에서 플랫폼 자동 감지
  detectPlatform(url) {
    return Utils.detectPlatform(url);
  }

  // 자동 분석 (플랫폼 자동 감지)
  async analyze(url) {
    const platform = this.detectPlatform(url);

    switch (platform) {
      case 'tistory':
        const tistoryScraper = this.getTistoryScraper();
        return await tistoryScraper.analyze(url);

      case 'youtube':
        const youtubeScraper = this.getYoutubeScraper();
        return await youtubeScraper.analyzeChannel(url);

      default:
        throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
    }
  }

  // 여러 URL 일괄 분석
  async batchAnalyze(urls) {
    const results = [];

    for (const url of urls) {
      try {
        Utils.logInfo(`분석 시작: ${url}`);
        const result = await this.analyze(url);
        results.push(result);

        // 요청 간 딜레이
        await Utils.randomDelay(2000, 5000);

      } catch (error) {
        Utils.logError(`분석 실패: ${url}`, error);
        results.push({
          url,
          error: error.message,
          analyzed_at: Utils.formatDate(new Date())
        });
      }
    }

    return results;
  }
}

// 모듈 익스포트
module.exports = {
  KoreanSocialScraper,
  TistoryScraper,
  YoutubeScraper,
  BrowserManager,
  Utils
};

// CLI에서 직접 실행할 때
if (require.main === module) {
  console.log('Korean Social Scraper v1.0.0');
  console.log('CLI 사용: npx kss --help');
  console.log('프로그래밍 사용: const { KoreanSocialScraper } = require("korean-social-scraper");');
}