/**
 * Blob을 브라우저 다운로드로 흘려보낸다.
 *
 * `lib/api/`가 아니라 여기 있는 이유: API 계층은 서버/클라이언트 양쪽에서 import 가능한
 * 순수 모듈이어야 하는데 이 함수는 `document`에 의존한다.
 *
 * 파일명은 **항상 서버의 `Content-Disposition`에서 온 값**을 넘긴다
 * (`exportExcel()` 반환값의 `filename`) — 클라이언트에서 조합하지 말 것.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // 즉시 revoke하면 일부 브라우저가 다운로드를 취소한다 — 다음 태스크로 미룬다.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
