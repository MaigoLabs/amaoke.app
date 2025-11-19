import { tick } from "svelte";

export function animateCaret(caret: HTMLDivElement) {
  tick().then(() => {
    const el = document.querySelector(".here") as HTMLElement;
    const update = () => {
      const rect = el?.getBoundingClientRect();
      if (!rect) return;
      caret.style.left = `${rect.left + window.scrollX}px`;
      caret.style.top = `${rect.top + window.scrollY}px`;
      caret.style.height = `${rect.height}px`;
    };
    update();

    // Keep updating for 300ms to handle CSS transitions (font-size change)
    let start = performance.now();
    const frame = () => {
      if (performance.now() - start > 300) return;
      update();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
