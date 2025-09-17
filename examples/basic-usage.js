const { KoreanSocialScraper, TistoryScraper, YoutubeScraper } = require('../src/index');

async function basicExample() {
  console.log('🚀 Korean Social Scraper 사용 예제\n');

  // 1. 자동 플랫폼 감지 사용
  const scraper = new KoreanSocialScraper({
    browser: {
      headless: true,
      timeout: 30000
    }
  });

  try {
    // 티스토리 블로그 분석
    console.log('1. 티스토리 블로그 분석');
    const tistoryResult = await scraper.analyze('https://example.tistory.com');
    console.log('블로그 제목:', tistoryResult.blog_info.title);
    console.log('총 포스트:', tistoryResult.stats.total_posts);
    console.log('최근 포스트 수:', tistoryResult.recent_posts.length);

  } catch (error) {
    console.error('분석 실패:', error.message);
  }
}

async function specificScraperExample() {
  console.log('\n2. 특정 스크래퍼 직접 사용');

  // 티스토리 전용 스크래퍼
  const tistoryScraper = new TistoryScraper({
    maxPosts: 10,
    browser: { headless: true }
  });

  try {
    const result = await tistoryScraper.analyze('https://example.tistory.com');

    console.log('📊 분석 결과:');
    console.log(`- 블로그: ${result.blog_info.title}`);
    console.log(`- 포스트: ${result.recent_posts.length}개`);
    console.log(`- 인기글: ${result.popular_posts.length}개`);

  } catch (error) {
    console.error('티스토리 분석 실패:', error.message);
  }
}

async function batchAnalysisExample() {
  console.log('\n3. 일괄 분석 예제');

  const scraper = new KoreanSocialScraper();

  const urls = [
    'https://blog1.tistory.com',
    'https://www.youtube.com/channel/UC123',
    'https://blog2.tistory.com'
  ];

  try {
    const results = await scraper.batchAnalyze(urls);

    console.log(`📊 일괄 분석 완료: ${results.length}개 사이트`);

    results.forEach((result, index) => {
      if (result.error) {
        console.log(`${index + 1}. ❌ ${result.url} - ${result.error}`);
      } else {
        console.log(`${index + 1}. ✅ ${result.platform} - ${result.url}`);
      }
    });

  } catch (error) {
    console.error('일괄 분석 실패:', error.message);
  }
}

async function youtubeExample() {
  console.log('\n4. 유튜브 채널 분석');

  const youtubeScraper = new YoutubeScraper({
    maxVideos: 5,
    browser: { headless: true }
  });

  try {
    // 실제 유튜브 채널 URL로 테스트
    const result = await youtubeScraper.analyzeChannel('https://www.youtube.com/@example');

    console.log('📺 채널 정보:');
    console.log(`- 이름: ${result.channel_info.name}`);
    console.log(`- 구독자: ${result.channel_info.subscribers}`);
    console.log(`- 최근 동영상: ${result.recent_videos.length}개`);

  } catch (error) {
    console.error('유튜브 분석 실패:', error.message);
  }
}

// 예제 실행
async function runExamples() {
  try {
    await basicExample();
    await specificScraperExample();
    await batchAnalysisExample();
    await youtubeExample();

    console.log('\n✅ 모든 예제 실행 완료');

  } catch (error) {
    console.error('예제 실행 실패:', error.message);
  }
}

// 스크립트가 직접 실행될 때만 예제 실행
if (require.main === module) {
  runExamples();
}

module.exports = {
  basicExample,
  specificScraperExample,
  batchAnalysisExample,
  youtubeExample
};