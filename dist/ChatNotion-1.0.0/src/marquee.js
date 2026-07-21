(function exposeMarquee(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ChatNotionMarquee = api;
})(globalThis, function createMarquee() {
  "use strict";

  function rectangle(startX, startY, endX, endY) {
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const right = Math.max(startX, endX);
    const bottom = Math.max(startY, endY);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function intersects(first, second) {
    return first.left <= second.right
      && first.right >= second.left
      && first.top <= second.bottom
      && first.bottom >= second.top;
  }

  function selectedIds(rows, selectionRect) {
    return rows
      .filter((row) => row.id && intersects(row.rect, selectionRect))
      .map((row) => row.id);
  }

  return { rectangle, intersects, selectedIds };
});
