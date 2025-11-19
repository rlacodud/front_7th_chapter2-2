import { createViteConfig } from "../../createViteConfig";
import { resolve } from "path";

// GitHub Pages 배포를 위한 base path 설정
// production 빌드일 때만 base path 적용
const base: string = process.env.NODE_ENV === "production" || process.env.CI === "true" ? "/front_7th_chapter2-2/" : "";

export default createViteConfig({
  base,
  esbuild: {
    jsx: "transform",
    jsxInject: `import React from 'react';`,
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    jsxDev: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        404: resolve(__dirname, "404.html"),
      },
    },
  },
});
