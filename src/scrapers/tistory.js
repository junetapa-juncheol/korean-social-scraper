const BrowserManager = require('../core/browser');
const Utils = require('../core/utils');

class TistoryScraper {
  constructor(config = {}) {
    this.browser = new BrowserManager(config.browser);
    this.config = {
      maxPages: 5,
      maxPosts: 20,
      ...config
    };
  }

  async analyze(blogUrl) {
    try {
      Utils.logInfo(`티스토리 블로그 분석 시작: ${blogUrl}`);

      if (!Utils.validateUrl(blogUrl)) {
        throw new Error('올바르지 않은 URL입니다.');
      }

      const page = await this.browser.goto(blogUrl);
      await Utils.sleep(2000);

      const result = {
        platform: 'tistory',
        url: blogUrl,
        analyzed_at: Utils.formatDate(new Date()),
        blog_info: await this.getBlogInfo(page),
        stats: await this.getBlogStats(page),
        recent_posts: await this.getRecentPosts(page),
        popular_posts: await this.getPopularPosts(page)
      };

      await this.browser.close();

      Utils.logSuccess('티스토리 분석 완료');
      return result;

    } catch (error) {
      Utils.logError('티스토리 분석 실패', error);
      await this.browser.close();
      throw error;
    }
  }

  async getBlogInfo(page) {
    try {
      const blogInfo = await page.evaluate(() => {
        const titleElement = document.querySelector('h1, .blog_title, .title');
        const descElement = document.querySelector('.blog_desc, .description, meta[name="description"]');

        return {
          title: titleElement ? titleElement.textContent.trim() : 'Unknown',
          description: descElement ? (descElement.content || descElement.textContent || '').trim() : '',
          theme: document.querySelector('link[rel="stylesheet"]') ? 'custom' : 'default'
        };
      });

      Utils.logInfo('블로그 정보 수집 완료', blogInfo);
      return blogInfo;

    } catch (error) {
      Utils.logWarning('블로그 정보 수집 실패', error);
      return {
        title: 'Unknown',
        description: '',
        theme: 'unknown'
      };
    }
  }

  async getBlogStats(page) {
    try {
      const stats = await page.evaluate(() => {
        const posts = document.querySelectorAll('.post, .entry, article');
        const categories = document.querySelectorAll('.category a, .tag a');

        // 통계 정보 추출 시도
        const statsText = document.body.textContent;
        const visitMatch = statsText.match(/방문자?[:\s]*([0-9,]+)/i) ||
                          statsText.match(/visit[:\s]*([0-9,]+)/i);
        const postMatch = statsText.match(/포스팅?[:\s]*([0-9,]+)/i) ||
                         statsText.match(/posts?[:\s]*([0-9,]+)/i);

        return {
          total_posts: postMatch ? parseInt(postMatch[1].replace(/,/g, '')) : posts.length,
          total_visits: visitMatch ? parseInt(visitMatch[1].replace(/,/g, '')) : 0,
          total_categories: categories.length,
          estimated_posts: posts.length
        };
      });

      Utils.logInfo('블로그 통계 수집 완료', stats);
      return stats;

    } catch (error) {
      Utils.logWarning('블로그 통계 수집 실패', error);
      return {
        total_posts: 0,
        total_visits: 0,
        total_categories: 0,
        estimated_posts: 0
      };
    }
  }

  async getRecentPosts(page) {
    try {
      const posts = await page.evaluate(() => {
        const postElements = document.querySelectorAll('.post, .entry, article, .list_content li');
        const posts = [];

        for (let i = 0; i < Math.min(postElements.length, 10); i++) {
          const element = postElements[i];

          const titleElement = element.querySelector('h1, h2, h3, .title, a[href*="/"]');
          const dateElement = element.querySelector('.date, .time, time');
          const linkElement = element.querySelector('a[href*="/"]');

          if (titleElement) {
            posts.push({
              title: titleElement.textContent.trim(),
              url: linkElement ? linkElement.href : '',
              date: dateElement ? dateElement.textContent.trim() : '',
              excerpt: element.textContent.substring(0, 150).trim()
            });
          }
        }

        return posts;
      });

      Utils.logInfo(`최근 포스트 ${posts.length}개 수집 완료`);
      return posts;

    } catch (error) {
      Utils.logWarning('최근 포스트 수집 실패', error);
      return [];
    }
  }

  async getPopularPosts(page) {
    try {
      // 인기 포스트 섹션 찾기
      const popularPosts = await page.evaluate(() => {
        const selectors = [
          '.popular_post',
          '.hot_post',
          '.best_post',
          '.sidebar .post',
          '.widget .post'
        ];

        const posts = [];

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);

          for (const element of elements) {
            const titleElement = element.querySelector('a, .title');
            const viewElement = element.querySelector('.view, .count');

            if (titleElement) {
              posts.push({
                title: titleElement.textContent.trim(),
                url: titleElement.href || '',
                views: viewElement ? viewElement.textContent.trim() : '0'
              });
            }
          }

          if (posts.length > 0) break;
        }

        return posts.slice(0, 5);
      });

      Utils.logInfo(`인기 포스트 ${popularPosts.length}개 수집 완료`);
      return popularPosts;

    } catch (error) {
      Utils.logWarning('인기 포스트 수집 실패', error);
      return [];
    }
  }

  async getPostDetails(postUrl) {
    try {
      Utils.logInfo(`포스트 상세 분석: ${postUrl}`);

      const page = await this.browser.goto(postUrl, 'post-detail');
      await Utils.sleep(1000);

      const details = await page.evaluate(() => {
        const title = document.querySelector('h1, .title, .post_title');
        const content = document.querySelector('.post_content, .entry, .content');
        const date = document.querySelector('.date, time');
        const tags = document.querySelectorAll('.tag a, .tags a');
        const views = document.querySelector('.view_count, .views');
        const comments = document.querySelector('.comment_count, .comments');

        return {
          title: title ? title.textContent.trim() : '',
          content_length: content ? content.textContent.length : 0,
          date: date ? date.textContent.trim() : '',
          tags: Array.from(tags).map(tag => tag.textContent.trim()),
          views: views ? views.textContent.trim() : '0',
          comments: comments ? comments.textContent.trim() : '0'
        };
      });

      await this.browser.closePage('post-detail');

      Utils.logInfo('포스트 상세 정보 수집 완료');
      return details;

    } catch (error) {
      Utils.logWarning('포스트 상세 정보 수집 실패', error);
      return null;
    }
  }
}

module.exports = TistoryScraper;