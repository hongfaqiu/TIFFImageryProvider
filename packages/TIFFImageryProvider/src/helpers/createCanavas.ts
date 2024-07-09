export function createCanavas(width: number, height: number) {
  if ('OffscreenCanvas' in window) {
    return new OffscreenCanvas(width, height);
  } else {
    const canv = document.createElement("canvas");
    canv.width = width;
    canv.height = height;
    return canv;
  }
}