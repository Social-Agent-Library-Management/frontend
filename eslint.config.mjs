import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 하네스 작업 산출물/입력 아티팩트(과거 회차 아카이브 _workspace_YYYYMMDD_HHMMSS/ 포함).
    // 디자인 원본 .jsx/.d.ts는 구현 참조용이지 이 앱의 소스가 아니므로 린트 대상에서 제외한다.
    "_workspace/**",
    "_workspace_*/**",
  ]),
]);

export default eslintConfig;
