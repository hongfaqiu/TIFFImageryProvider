const debugCanvas = document.createElement('canvas');
debugCanvas.width = 256;
debugCanvas.height = 256;

export function generateCanvasWithText(text: string) {
  try {
    // 获取 Canvas 元素
    const ctx = debugCanvas.getContext("2d");
    // 清除画布内容
    ctx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

    // 设置外边框样式
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;

    // 绘制外边框
    ctx.strokeRect(0, 0, debugCanvas.width, debugCanvas.height);

    // 设置文字样式
    ctx.font = "24px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 获取中间位置
    const centerX = debugCanvas.width / 2;
    const centerY = debugCanvas.height / 2;

    // 绘制文字
    ctx.fillText(text, centerX, centerY);
    const image = new Image();
    image.src = debugCanvas.toDataURL();
    return image;

  } catch (e) {
    console.log(e);
    return undefined;
  }
}