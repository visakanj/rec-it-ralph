export function getModalRoot(): HTMLElement {
  let el = document.getElementById("modal-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "modal-root";
    document.body.appendChild(el);
  }
  return el;
}

export function lockBodyScroll(lock: boolean) {
  if (lock) {
    const prev = document.body.style.overflow;
    (document.body as any).__prevOverflow = prev;
    document.body.style.overflow = "hidden";
  } else {
    const prev = (document.body as any).__prevOverflow ?? "";
    document.body.style.overflow = prev;
    delete (document.body as any).__prevOverflow;
  }
}