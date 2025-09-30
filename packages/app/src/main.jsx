import { App } from "./App.jsx";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { createRoot } from "react-dom/client";
import { loadCartFromStorage } from "./services/index.js";

/**
 * 개발 환경에서만 MSW 워커 시작
 */
const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

/**
 * 애플리케이션 초기화
 */
function main() {
  loadCartFromStorage();
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  router.start();
  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
