(function exposeDragScroll(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionDragScroll = api;
  }
})(globalThis, function createDragScroll() {
  "use strict";

  function verticalVelocity(pointerY, top, bottom, edgeSize = 56, maxSpeed = 16) {
    const edge = Math.max(1, Number(edgeSize) || 56);
    const speed = Math.max(0, Number(maxSpeed) || 16);
    if (![pointerY, top, bottom].every(Number.isFinite) || bottom <= top || speed === 0) return 0;
    if (pointerY < top + edge) {
      return -speed * Math.min(1, Math.max(0, (top + edge - pointerY) / edge));
    }
    if (pointerY > bottom - edge) {
      return speed * Math.min(1, Math.max(0, (pointerY - (bottom - edge)) / edge));
    }
    return 0;
  }

  return { verticalVelocity };
});
