# 보조금 챗봇 - GitHub Pages 배포 가이드

## 📁 파일 구성

```
📦 챗봇 패키지
├── subsidy-chatbot.html        # 메인 챗봇 (GitHub Pages에 업로드)
├── cloudflare-worker-proxy.js  # API 프록시 (Cloudflare Workers에 배포)
└── README.md                   # 이 가이드
```

---

## 🚀 배포 순서

### 1단계: Cloudflare Workers 설정 (API 프록시)

> ⚠️ API 키 보안을 위해 **반드시** 프록시 서버를 사용해야 합니다!

1. **Cloudflare 계정 생성** (무료)
   - https://dash.cloudflare.com/sign-up

2. **Worker 생성**
   - Workers & Pages 메뉴 클릭
   - Create application > Create Worker
   - 이름 입력 (예: `subsidy-api-proxy`)
   - Quick Edit 클릭

3. **코드 붙여넣기**
   - `cloudflare-worker-proxy.js` 내용 전체 복사
   - 기존 코드 삭제 후 붙여넣기

4. **API 키 설정** (중요!)
   - Settings 탭 > Variables
   - Add variable 클릭
   - Name: `SUBSIDY_API_KEY`
   - Value: 실제 API 키 입력
   - **Encrypt** 체크 ✅
   - Save

5. **도메인 허용 설정**
   - 코드에서 `ALLOWED_ORIGINS` 배열 수정
   ```javascript
   const ALLOWED_ORIGINS = [
       'https://your-username.github.io',  // 본인 GitHub Pages URL
   ];
   ```

6. **배포**
   - Save and Deploy 클릭
   - Worker URL 복사 (예: `https://subsidy-api-proxy.your-account.workers.dev`)

---

### 2단계: GitHub Pages 설정

1. **GitHub 저장소 생성**
   - https://github.com/new
   - Repository name: `subsidy-chatbot` (원하는 이름)
   - Public 선택
   - Create repository

2. **파일 업로드**
   - Add file > Upload files
   - `subsidy-chatbot.html` 파일 업로드
   - 파일명을 `index.html`로 변경 권장
   - Commit changes

3. **GitHub Pages 활성화**
   - Settings 탭 > Pages
   - Source: Deploy from a branch
   - Branch: `main` / `root`
   - Save

4. **챗봇 URL 확인**
   - 몇 분 후 URL 확인
   - 예: `https://your-username.github.io/subsidy-chatbot/`

---

### 3단계: 프록시 URL 연결

1. **`index.html` 수정**
   ```javascript
   const CONFIG = {
       API_PROXY_URL: 'https://subsidy-api-proxy.your-account.workers.dev',
       DEMO_MODE: false  // false로 변경!
   };
   ```

2. **커밋 & 푸시**

---

## 🔧 워드프레스에 iframe 삽입

### 방법 1: HTML 블록

```html
<iframe 
    src="https://your-username.github.io/subsidy-chatbot/" 
    width="100%" 
    height="700" 
    frameborder="0"
    style="border: none; border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
></iframe>
```

### 방법 2: 반응형 iframe

```html
<div style="position: relative; width: 100%; max-width: 500px; margin: 0 auto;">
    <div style="padding-bottom: 150%; position: relative;">
        <iframe 
            src="https://your-username.github.io/subsidy-chatbot/" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
        ></iframe>
    </div>
</div>
```

### 방법 3: 전체 높이 (추천)

```html
<style>
.chatbot-iframe-wrap {
    width: 100%;
    max-width: 500px;
    height: 700px;
    margin: 0 auto;
}
@media (max-width: 768px) {
    .chatbot-iframe-wrap {
        max-width: 100%;
        height: 100vh;
        height: 100dvh;
    }
}
</style>

<div class="chatbot-iframe-wrap">
    <iframe 
        src="https://your-username.github.io/subsidy-chatbot/" 
        width="100%" 
        height="100%" 
        frameborder="0"
        style="border: none; border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
    ></iframe>
</div>
```

---

## 🔒 보안 체크리스트

- [x] API 키가 Cloudflare Workers 환경변수에 저장됨
- [x] API 키가 프론트엔드 코드에 없음
- [x] Cloudflare Workers에서 Encrypt 옵션 활성화됨
- [x] ALLOWED_ORIGINS에 본인 도메인만 등록됨
- [x] DEMO_MODE가 프로덕션에서 false로 설정됨
- [ ] GitHub 저장소가 Public이어도 API 키는 안전함!

---

## 🧪 테스트

1. **데모 모드 테스트**
   - `DEMO_MODE: true` 상태로 GitHub Pages 접속
   - 더미 데이터로 UI 확인

2. **실제 API 테스트**
   - Cloudflare Worker 배포 완료
   - `API_PROXY_URL` 설정
   - `DEMO_MODE: false`
   - 실제 보조금24 데이터 확인

---

## ❓ FAQ

**Q: API 키가 GitHub에 노출되나요?**
A: 아니요! API 키는 Cloudflare Workers의 환경변수에만 저장되며, 
   프론트엔드 코드에는 프록시 URL만 있습니다.

**Q: Cloudflare Workers는 무료인가요?**
A: 네! 하루 10만 요청까지 무료입니다. 
   일반적인 사용에는 충분합니다.

**Q: 다른 도메인에서 API를 호출할 수 있나요?**
A: ALLOWED_ORIGINS에 등록된 도메인만 가능합니다.
   허용되지 않은 도메인은 403 에러가 발생합니다.

---

## 📞 문의

문제 발생 시:
1. 브라우저 개발자 도구 > Console 에러 확인
2. Network 탭에서 API 요청 상태 확인
3. Cloudflare Workers > Logs에서 서버 로그 확인
