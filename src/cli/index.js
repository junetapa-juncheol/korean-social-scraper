#!/usr/bin/env node

const { Command } = require('commander');
const colors = require('colors');
const Table = require('cli-table3');
const TistoryScraper = require('../scrapers/tistory');
const YoutubeScraper = require('../scrapers/youtube');
const Utils = require('../core/utils');

const program = new Command();

// 프로그램 기본 설정
program
  .name('kss')
  .description('Korean Social Scraper - 한국 소셜미디어 데이터 수집 도구')
  .version('1.0.0');

// 공통 옵션
program
  .option('-o, --output <path>', '결과 저장 경로', './data')
  .option('-f, --format <type>', '출력 형식 (json, table)', 'table')
  .option('--headless', '브라우저 헤드리스 모드', true)
  .option('--timeout <ms>', '타임아웃 (밀리초)', '30000');

// 티스토리 명령어
program
  .command('tistory <url>')
  .description('티스토리 블로그 분석')
  .option('--posts <number>', '분석할 포스트 수', '20')
  .action(async (url, options) => {
    try {
      console.log(colors.cyan('🔍 티스토리 블로그 분석을 시작합니다...'));

      const scraper = new TistoryScraper({
        browser: {
          headless: program.opts().headless,
          timeout: parseInt(program.opts().timeout)
        },
        maxPosts: parseInt(options.posts)
      });

      const result = await scraper.analyze(url);

      if (program.opts().format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        displayTistoryResult(result);
      }

      // 결과 저장
      const filename = `tistory_${Utils.sanitizeFilename(result.blog_info.title)}`;
      await Utils.saveJson(result, filename, program.opts().output);

    } catch (error) {
      console.error(colors.red('❌ 분석 실패:'), error.message);
      process.exit(1);
    }
  });

// 유튜브 명령어
program
  .command('youtube <url>')
  .description('유튜브 채널 분석')
  .option('--videos <number>', '분석할 동영상 수', '20')
  .action(async (url, options) => {
    try {
      console.log(colors.cyan('🔍 유튜브 채널 분석을 시작합니다...'));

      const scraper = new YoutubeScraper({
        browser: {
          headless: program.opts().headless,
          timeout: parseInt(program.opts().timeout)
        },
        maxVideos: parseInt(options.videos)
      });

      const result = await scraper.analyzeChannel(url);

      if (program.opts().format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        displayYoutubeResult(result);
      }

      // 결과 저장
      const filename = `youtube_${Utils.sanitizeFilename(result.channel_info.name)}`;
      await Utils.saveJson(result, filename, program.opts().output);

    } catch (error) {
      console.error(colors.red('❌ 분석 실패:'), error.message);
      process.exit(1);
    }
  });

// 일괄 분석 명령어
program
  .command('batch <file>')
  .description('여러 URL 일괄 분석 (JSON 파일)')
  .action(async (file) => {
    try {
      console.log(colors.cyan('🔍 일괄 분석을 시작합니다...'));

      const urls = await Utils.loadJson(file);
      const results = [];

      for (const item of urls) {
        const { platform, url } = item;
        let result;

        console.log(colors.yellow(`\n📊 분석 중: ${platform} - ${url}`));

        if (platform === 'tistory') {
          const scraper = new TistoryScraper();
          result = await scraper.analyze(url);
        } else if (platform === 'youtube') {
          const scraper = new YoutubeScraper();
          result = await scraper.analyzeChannel(url);
        } else {
          console.log(colors.red(`❌ 지원하지 않는 플랫폼: ${platform}`));
          continue;
        }

        results.push(result);
        await Utils.sleep(2000); // 요청 간 딜레이
      }

      // 전체 결과 저장
      await Utils.saveJson(results, 'batch_analysis', program.opts().output);
      console.log(colors.green(`✅ 일괄 분석 완료: ${results.length}개 사이트`));

    } catch (error) {
      console.error(colors.red('❌ 일괄 분석 실패:'), error.message);
      process.exit(1);
    }
  });

// 결과 표시 함수들
function displayTistoryResult(result) {
  console.log(colors.green('\n✅ 티스토리 분석 완료\n'));

  // 블로그 정보 테이블
  const infoTable = new Table({
    head: [colors.cyan('항목'), colors.cyan('값')],
    style: { head: [], border: [] }
  });

  infoTable.push(
    ['블로그 제목', result.blog_info.title],
    ['URL', result.url],
    ['총 포스트 수', result.stats.total_posts.toLocaleString()],
    ['총 방문자 수', result.stats.total_visits.toLocaleString()],
    ['카테고리 수', result.stats.total_categories],
    ['분석 시간', result.analyzed_at]
  );

  console.log(colors.bold('📊 블로그 정보'));
  console.log(infoTable.toString());

  // 최근 포스트 테이블
  if (result.recent_posts.length > 0) {
    const postsTable = new Table({
      head: [colors.cyan('제목'), colors.cyan('날짜'), colors.cyan('URL')],
      style: { head: [], border: [] },
      colWidths: [50, 15, 40]
    });

    result.recent_posts.slice(0, 5).forEach(post => {
      postsTable.push([
        Utils.truncateText(post.title, 45),
        post.date,
        Utils.truncateText(post.url, 35)
      ]);
    });

    console.log(colors.bold('\n📝 최근 포스트'));
    console.log(postsTable.toString());
  }
}

function displayYoutubeResult(result) {
  console.log(colors.green('\n✅ 유튜브 분석 완료\n'));

  // 채널 정보 테이블
  const infoTable = new Table({
    head: [colors.cyan('항목'), colors.cyan('값')],
    style: { head: [], border: [] }
  });

  infoTable.push(
    ['채널명', result.channel_info.name],
    ['구독자 수', result.channel_info.subscribers],
    ['총 조회수', result.stats.total_views],
    ['동영상 수', result.stats.video_count],
    ['가입일', result.stats.joined_date],
    ['분석 시간', result.analyzed_at]
  );

  console.log(colors.bold('📺 채널 정보'));
  console.log(infoTable.toString());

  // 최근 동영상 테이블
  if (result.recent_videos.length > 0) {
    const videosTable = new Table({
      head: [colors.cyan('제목'), colors.cyan('조회수'), colors.cyan('업로드일')],
      style: { head: [], border: [] },
      colWidths: [50, 15, 15]
    });

    result.recent_videos.slice(0, 5).forEach(video => {
      videosTable.push([
        Utils.truncateText(video.title, 45),
        video.views,
        video.upload_date
      ]);
    });

    console.log(colors.bold('\n🎬 최근 동영상'));
    console.log(videosTable.toString());
  }
}

// 프로그램 실행
program.parse();

// 명령어가 없으면 help 표시
if (!process.argv.slice(2).length) {
  program.outputHelp();
}