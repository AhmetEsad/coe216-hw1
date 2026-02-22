import { renderTask1, setupTask1 } from "./task1.js";
import { setupUi } from "./ui.js";

function setupAppLikeInteractions() {
  const blockSelection = (event) => {
    event.preventDefault();
  };
  document.addEventListener("selectstart", blockSelection);
  document.addEventListener("dragstart", blockSelection);
}

setupAppLikeInteractions();
setupUi();
setupTask1();
renderTask1();

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderTask1();
  }, 80);
});
