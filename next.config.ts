import type { NextConfig } from "next";

/**
 * 오프라인(인터넷 없는 윈도우 PC) 배포용 정적 빌드 스위치.
 *
 * `OFFLINE_EXPORT=1 npm run build` → `out/`에 순수 HTML/CSS/JS를 생성한다.
 * 이 프로젝트는 API 라우트·미들웨어·동적 세그먼트·서버 사이드 fetch가 없고
 * 데이터 요청이 전부 클라이언트 컴포넌트에서 일어나므로 정적 export가 가능하다.
 * 덕분에 배포 대상 PC에 Node.js 런타임이 필요 없다(JDK의 `jwebserver`로 서빙).
 *
 * `trailingSlash`는 필수다. `out/books/search/index.html` 구조로 떨어져야
 * `jwebserver`가 디렉터리 요청을 index.html로 해석한다.
 *
 * 기본(미설정) 빌드는 기존 동작 그대로다 — 서버 배포에 영향 없음.
 */
const isOfflineExport = process.env.OFFLINE_EXPORT === "1";

const nextConfig: NextConfig = isOfflineExport
  ? { output: "export", trailingSlash: true }
  : {};

export default nextConfig;
