import { renderTask1, setupTask1 } from "./task1.js";
import { setupUi } from "./ui.js";

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
