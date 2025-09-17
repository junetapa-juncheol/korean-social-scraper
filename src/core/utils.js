const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class Utils {
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.sleep(delay);
  }

  static formatNumber(num) {
    if (typeof num !== 'number') {
      const parsed = parseInt(num.toString().replace(/[^0-9]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return num;
  }

  static parseKoreanNumber(text) {
    if (!text) return 0;

    const cleanText = text.toString().toLowerCase().trim();

    // 만, 천 등의 한국어 단위 처리
    let multiplier = 1;
    if (cleanText.includes('만')) {
      multiplier = 10000;
      text = cleanText.replace('만', '');
    } else if (cleanText.includes('천')) {
      multiplier = 1000;
      text = cleanText.replace('천', '');
    }

    // 숫자만 추출
    const numbers = text.match(/[\d,\.]+/);
    if (!numbers) return 0;

    const num = parseFloat(numbers[0].replace(/,/g, ''));
    return isNaN(num) ? 0 : Math.floor(num * multiplier);
  }

  static extractUrl(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  }

  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static getDomainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(date).format(format);
  }

  static getTimestamp() {
    return moment().format('YYYY-MM-DD_HH-mm-ss');
  }

  static async saveJson(data, filename, directory = './data') {
    await fs.ensureDir(directory);

    const timestamp = this.getTimestamp();
    const fullFilename = filename.includes('.json')
      ? filename.replace('.json', `_${timestamp}.json`)
      : `${filename}_${timestamp}.json`;

    const filepath = path.join(directory, fullFilename);

    try {
      await fs.writeJson(filepath, data, { spaces: 2 });
      console.log(`💾 데이터 저장 완료: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`❌ 데이터 저장 실패: ${filepath}`, error.message);
      throw error;
    }
  }

  static async loadJson(filepath) {
    try {
      const data = await fs.readJson(filepath);
      console.log(`📂 데이터 로드 완료: ${filepath}`);
      return data;
    } catch (error) {
      console.error(`❌ 데이터 로드 실패: ${filepath}`, error.message);
      throw error;
    }
  }

  static sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '_')
      .trim();
  }

  static truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  static cleanText(text) {
    if (!text) return '';
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ');
  }

  static detectPlatform(url) {
    const domain = this.getDomainFromUrl(url);
    if (!domain) return 'unknown';

    if (domain.includes('tistory.com')) return 'tistory';
    if (domain.includes('blog.naver.com')) return 'naver_blog';
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'youtube';
    if (domain.includes('instagram.com')) return 'instagram';
    if (domain.includes('coupang.com')) return 'coupang';

    return 'unknown';
  }

  static generateUserAgent() {
    const browsers = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];

    return browsers[Math.floor(Math.random() * browsers.length)];
  }

  static logInfo(message, data = null) {
    console.log(`ℹ️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static logWarning(message, data = null) {
    console.warn(`⚠️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static logError(message, error = null) {
    console.error(`❌ ${message}`, error ? error.message : '');
  }

  static logSuccess(message, data = null) {
    console.log(`✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

module.exports = Utils;