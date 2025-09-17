# Korean Social Scraper

> 한국 소셜미디어 및 온라인 플랫폼 데이터 수집 도구

## 📖 소개

Korean Social Scraper는 한국의 주요 온라인 플랫폼에서 데이터를 수집하고 분석하는 도구입니다.
마케터, 크리에이터, 연구자들이 한국 온라인 생태계를 이해하는데 도움을 줍니다.

## 🎯 지원 플랫폼

- **📝 블로그**: 티스토리, 네이버 블로그
- **📺 영상**: 유튜브 한국 채널
- **📷 SNS**: 인스타그램
- **🛒 커머스**: 쿠팡 제품 리뷰
- **💬 커뮤니티**: 클리앙, 루리웹 (계획 중)

## 🚀 주요 기능

- 📊 **통계 수집**: 조회수, 좋아요, 댓글 수 등
- 📈 **트렌드 분석**: 인기 키워드 및 해시태그 추적
- 📋 **리포트 생성**: 수집된 데이터를 표와 차트로 시각화
- ⏰ **스케줄링**: 정기적인 데이터 수집 자동화
- 💾 **데이터 저장**: JSON, CSV 형태로 결과 저장

## 📦 설치

### NPM을 통한 설치

```bash
npm install -g korean-social-scraper
```

### 소스에서 설치

```bash
git clone https://github.com/junetapa-juncheol/korean-social-scraper.git
cd korean-social-scraper
npm install
```

## 🔧 사용법

### CLI 사용

```bash
# 기본 사용법
kss --help

# 티스토리 블로그 분석
kss tistory --url "https://example.tistory.com"

# 유튜브 채널 분석
kss youtube --channel "채널명"

# 인스타그램 해시태그 분석
kss instagram --hashtag "맛집"

# 쿠팡 제품 리뷰 분석
kss coupang --product-id "12345"
```

### 프로그래밍 방식 사용

```javascript
const { TistoryScraper, YoutubeScraper } = require('korean-social-scraper');

// 티스토리 블로그 분석
const tistory = new TistoryScraper();
const result = await tistory.analyze('https://example.tistory.com');

console.log(result.stats); // 통계 정보
console.log(result.posts); // 최근 포스트 목록
```

## 📊 출력 예시

```json
{
  "platform": "tistory",
  "url": "https://example.tistory.com",
  "stats": {
    "totalPosts": 245,
    "totalViews": 12500,
    "avgViewsPerPost": 51,
    "lastUpdated": "2023-12-01"
  },
  "popularPosts": [
    {
      "title": "인기 포스트 제목",
      "views": 1250,
      "date": "2023-11-28"
    }
  ]
}
```

## ⚙️ 설정

### 기본 설정 파일 (config/default.json)

```json
{
  "browser": {
    "headless": true,
    "timeout": 30000
  },
  "output": {
    "format": "json",
    "directory": "./data"
  },
  "rate_limit": {
    "delay": 1000,
    "max_concurrent": 3
  }
}
```

## 🛡️ 주의사항

- **이용 약관 준수**: 각 플랫폼의 이용 약관을 확인하고 준수하세요
- **Rate Limiting**: 서버에 무리를 주지 않도록 적절한 딜레이를 설정하세요
- **개인정보 보호**: 개인정보가 포함된 데이터 수집을 피하세요
- **상업적 이용**: 상업적 목적으로 사용 시 해당 플랫폼의 정책을 확인하세요

## 🤝 기여하기

1. 이 리포지토리를 포크하세요
2. 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📧 문의

이슈나 질문이 있으시면 [GitHub Issues](https://github.com/junetapa-juncheol/korean-social-scraper/issues)에 등록해 주세요.

---

Made with ❤️ for Korean Creators