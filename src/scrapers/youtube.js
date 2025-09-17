const BrowserManager = require('../core/browser');
const Utils = require('../core/utils');

class YoutubeScraper {
  constructor(config = {}) {
    this.browser = new BrowserManager(config.browser);
    this.config = {
      maxVideos: 20,
      ...config
    };
  }

  async analyzeChannel(channelUrl) {
    try {
      Utils.logInfo(`유튜브 채널 분석 시작: ${channelUrl}`);

      if (!Utils.validateUrl(channelUrl)) {
        throw new Error('올바르지 않은 URL입니다.');
      }

      const page = await this.browser.goto(channelUrl);
      await Utils.sleep(3000);

      // 쿠키 동의 처리
      await this.handleCookieConsent(page);

      const result = {
        platform: 'youtube',
        url: channelUrl,
        analyzed_at: Utils.formatDate(new Date()),
        channel_info: await this.getChannelInfo(page),
        stats: await this.getChannelStats(page),
        recent_videos: await this.getRecentVideos(page),
        popular_videos: await this.getPopularVideos(page)
      };

      await this.browser.close();

      Utils.logSuccess('유튜브 채널 분석 완료');
      return result;

    } catch (error) {
      Utils.logError('유튜브 채널 분석 실패', error);
      await this.browser.close();
      throw error;
    }
  }

  async handleCookieConsent(page) {
    try {
      // 쿠키 동의 버튼 클릭
      const acceptButton = await page.$('button[aria-label*="Accept"], button[aria-label*="수락"], [aria-label*="모두 수락"]');
      if (acceptButton) {
        await acceptButton.click();
        await Utils.sleep(1000);
      }
    } catch (error) {
      // 쿠키 동의 버튼이 없으면 무시
    }
  }

  async getChannelInfo(page) {
    try {
      const channelInfo = await page.evaluate(() => {
        const nameElement = document.querySelector('#text.ytd-channel-name, .ytd-channel-name #text');
        const subscriberElement = document.querySelector('#subscriber-count, .ytd-c4-tabbed-header-renderer #subscriber-count');
        const descElement = document.querySelector('#description, .ytd-channel-about-metadata-renderer #description');
        const avatarElement = document.querySelector('#avatar img, .ytd-c4-tabbed-header-renderer img');

        return {
          name: nameElement ? nameElement.textContent.trim() : 'Unknown',
          subscribers: subscriberElement ? subscriberElement.textContent.trim() : '0',
          description: descElement ? descElement.textContent.trim() : '',
          avatar_url: avatarElement ? avatarElement.src : ''
        };
      });

      Utils.logInfo('채널 정보 수집 완료', channelInfo);
      return channelInfo;

    } catch (error) {
      Utils.logWarning('채널 정보 수집 실패', error);
      return {
        name: 'Unknown',
        subscribers: '0',
        description: '',
        avatar_url: ''
      };
    }
  }

  async getChannelStats(page) {
    try {
      // 정보 탭으로 이동
      const aboutTab = await page.$('tp-yt-paper-tab[aria-label*="정보"], tp-yt-paper-tab[aria-label*="About"]');
      if (aboutTab) {
        await aboutTab.click();
        await Utils.sleep(2000);
      }

      const stats = await page.evaluate(() => {
        const viewsElement = document.querySelector('.ytd-channel-about-metadata-renderer .style-scope:contains("조회수"), .ytd-channel-about-metadata-renderer .style-scope:contains("views")');
        const joinedElement = document.querySelector('.ytd-channel-about-metadata-renderer .style-scope:contains("가입일"), .ytd-channel-about-metadata-renderer .style-scope:contains("Joined")');

        // 구독자 수 파싱
        const subscriberText = document.querySelector('#subscriber-count')?.textContent || '0';
        let subscribers = 0;
        if (subscriberText.includes('만')) {
          subscribers = parseFloat(subscriberText.replace('만', '').replace('명', '')) * 10000;
        } else if (subscriberText.includes('천')) {
          subscribers = parseFloat(subscriberText.replace('천', '').replace('명', '')) * 1000;
        } else {
          subscribers = parseInt(subscriberText.replace(/[^0-9]/g, '')) || 0;
        }

        return {
          subscribers_count: subscribers,
          total_views: viewsElement ? viewsElement.textContent.trim() : '0',
          joined_date: joinedElement ? joinedElement.textContent.trim() : '',
          video_count: document.querySelectorAll('.ytd-grid-video-renderer').length
        };
      });

      Utils.logInfo('채널 통계 수집 완료', stats);
      return stats;

    } catch (error) {
      Utils.logWarning('채널 통계 수집 실패', error);
      return {
        subscribers_count: 0,
        total_views: '0',
        joined_date: '',
        video_count: 0
      };
    }
  }

  async getRecentVideos(page) {
    try {
      // 동영상 탭으로 이동
      const videosTab = await page.$('tp-yt-paper-tab[aria-label*="동영상"], tp-yt-paper-tab[aria-label*="Videos"]');
      if (videosTab) {
        await videosTab.click();
        await Utils.sleep(2000);
      }

      const videos = await page.evaluate(() => {
        const videoElements = document.querySelectorAll('.ytd-grid-video-renderer, .ytd-rich-item-renderer');
        const videos = [];

        for (let i = 0; i < Math.min(videoElements.length, 10); i++) {
          const element = videoElements[i];

          const titleElement = element.querySelector('#video-title, .ytd-video-meta-block #video-title');
          const viewsElement = element.querySelector('.ytd-video-meta-block .style-scope:contains("조회수"), .ytd-video-meta-block .style-scope:contains("views")');
          const dateElement = element.querySelector('.ytd-video-meta-block .style-scope:contains("전"), .ytd-video-meta-block .style-scope:contains("ago")');
          const linkElement = element.querySelector('#video-title');
          const thumbnailElement = element.querySelector('img');

          if (titleElement) {
            videos.push({
              title: titleElement.textContent.trim(),
              url: linkElement ? `https://youtube.com${linkElement.getAttribute('href')}` : '',
              views: viewsElement ? viewsElement.textContent.trim() : '0',
              upload_date: dateElement ? dateElement.textContent.trim() : '',
              thumbnail: thumbnailElement ? thumbnailElement.src : ''
            });
          }
        }

        return videos;
      });

      Utils.logInfo(`최근 동영상 ${videos.length}개 수집 완료`);
      return videos;

    } catch (error) {
      Utils.logWarning('최근 동영상 수집 실패', error);
      return [];
    }
  }

  async getPopularVideos(page) {
    try {
      // 인기 동영상 탭으로 이동
      const popularTab = await page.$('tp-yt-paper-tab[aria-label*="인기"], tp-yt-paper-tab[aria-label*="Popular"]');
      if (popularTab) {
        await popularTab.click();
        await Utils.sleep(2000);

        const videos = await page.evaluate(() => {
          const videoElements = document.querySelectorAll('.ytd-grid-video-renderer');
          const videos = [];

          for (let i = 0; i < Math.min(videoElements.length, 5); i++) {
            const element = videoElements[i];

            const titleElement = element.querySelector('#video-title');
            const viewsElement = element.querySelector('.ytd-video-meta-block .style-scope');
            const linkElement = element.querySelector('#video-title');

            if (titleElement) {
              videos.push({
                title: titleElement.textContent.trim(),
                url: linkElement ? `https://youtube.com${linkElement.getAttribute('href')}` : '',
                views: viewsElement ? viewsElement.textContent.trim() : '0'
              });
            }
          }

          return videos;
        });

        Utils.logInfo(`인기 동영상 ${videos.length}개 수집 완료`);
        return videos;
      }

      return [];

    } catch (error) {
      Utils.logWarning('인기 동영상 수집 실패', error);
      return [];
    }
  }

  async analyzeVideo(videoUrl) {
    try {
      Utils.logInfo(`유튜브 동영상 분석: ${videoUrl}`);

      const page = await this.browser.goto(videoUrl, 'video-detail');
      await Utils.sleep(3000);

      const details = await page.evaluate(() => {
        const title = document.querySelector('h1.ytd-video-primary-info-renderer, .ytd-video-primary-info-renderer h1');
        const views = document.querySelector('.ytd-video-view-count-renderer, .view-count');
        const likes = document.querySelector('button[aria-label*="좋아요"], button[aria-label*="like"]');
        const description = document.querySelector('.ytd-video-secondary-info-renderer #description');
        const channel = document.querySelector('.ytd-video-owner-renderer .ytd-channel-name a');
        const date = document.querySelector('.ytd-video-secondary-info-renderer #info-strings');

        return {
          title: title ? title.textContent.trim() : '',
          views: views ? views.textContent.trim() : '0',
          likes: likes ? likes.getAttribute('aria-label') || '0' : '0',
          description: description ? description.textContent.trim().substring(0, 500) : '',
          channel: channel ? channel.textContent.trim() : '',
          upload_date: date ? date.textContent.trim() : ''
        };
      });

      await this.browser.closePage('video-detail');

      Utils.logInfo('동영상 상세 정보 수집 완료');
      return details;

    } catch (error) {
      Utils.logWarning('동영상 상세 정보 수집 실패', error);
      return null;
    }
  }
}

module.exports = YoutubeScraper;