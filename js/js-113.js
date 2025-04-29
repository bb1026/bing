// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: th;
this.name = "今年百分比";
this.widget_ID = "js-113";
this.version = "v1.0";

let installation;
await CheckKu();
await installation(this.widget_ID, this.version);

// 控制圆形(1)
const useCircleStyle = args.widgetParameter?.includes(";") ? args.widgetParameter.split(";")[1]?.trim() : args.widgetParameter || 1;

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const dayOfMonth = today.getDate();
const dayOfWeek = today.getDay();
const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

const isLeapYear = year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
const daysInYear = isLeapYear ? 366 : 365;
const startOfYear = new Date(year, 0, 1);
const dayOfYear = Math.floor((today - startOfYear) / 86400000) + 1;
const daysInMonth = new Date(year, month + 1, 0).getDate();

const yearProgress = ((dayOfYear / daysInYear) * 100).toFixed(1);
const monthProgress = ((dayOfMonth / daysInMonth) * 100).toFixed(1);
const weekProgress = ((adjustedDayOfWeek / 7) * 100).toFixed(1);

const purple = new Color("#a259ff"); // 紫
const blue = new Color("#007aff"); // 蓝
const green = new Color("#34c759"); // 绿

const dayAndWeek = `${adjustedDayOfWeek} / 7`;
const dayAndMonth = `${dayOfMonth} / ${daysInMonth}`;
const dayAndYear = `${dayOfYear} / ${daysInYear}`;

const widget = new ListWidget();
widget.spacing = 4;
widget.setPadding(10, 12, 10, 12);
widget.backgroundColor = new Color("#1c1c1e");

const widgetFamily = config.widgetFamily || "large";
const isSmall = widgetFamily === "small";
const isMedium = widgetFamily === "medium";
const isLarge = widgetFamily === "large";

const barWidth = (() => {
  if (isSmall) return 130;
  if (isMedium) return 320;
  if (isLarge) return 320;
  return 200;
})();

if (useCircleStyle === 1) {
  await addCircleProgress();
} else {
  addProgressBar(yearProgress, barWidth, purple, dayAndYear);
  widget.addSpacer(6);
  addProgressBar(monthProgress, barWidth, blue, dayAndMonth);
  widget.addSpacer(6);
  addProgressBar(weekProgress, barWidth, green, dayAndWeek);
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // await widget.presentSmall();
  // await widget.presentMedium();
  await widget.presentLarge();
}
Script.complete();

// ========== 辅助函数 ==========
function addProgressBar(progress, barWidth, color, labelText) {
  const vStack = widget.addStack();
  vStack.layoutVertically();
  vStack.centerAlignContent();

  const labelStack = vStack.addStack();
  labelStack.layoutHorizontally();

  const label = labelStack.addText(labelText);
  label.font = Font.systemFont(16);
  label.textColor = color;
  label.leftAlignText();

  vStack.addSpacer(2);

  const hStack = vStack.addStack();
  hStack.layoutHorizontally();

  const bar = createRoundedProgressBar(Number(progress), barWidth, color);
  const barImage = hStack.addImage(bar.getImage());
  barImage.imageSize = new Size(barWidth, 10);
  barImage.leftAlignImage();

  vStack.addSpacer(8);
}

// 画带圆角的彩色进度条
function createRoundedProgressBar(percentage, totalWidth, color, height = 10) {
  const bar = new DrawContext();
  bar.size = new Size(totalWidth, height);
  bar.opaque = false;
  bar.respectScreenScale = true;

  const bgPath = new Path();
  bgPath.addRoundedRect(
    new Rect(0, 0, totalWidth, height),
    height / 2,
    height / 2
  );
  bar.addPath(bgPath);
  bar.setFillColor(new Color("#e0e0e0", 0.3));
  bar.fillPath();

  if (percentage > 0) {
    const progressWidth = Math.max(height, totalWidth * (percentage / 100));
    const progressPath = new Path();
    progressPath.addRoundedRect(
      new Rect(0, 0, progressWidth, height),
      height / 2,
      height / 2
    );
    bar.addPath(progressPath);

    const dynamicColor = new Color(color.hex, 0.5 + 0.5 * (percentage / 100));
    bar.setFillColor(dynamicColor);
    bar.fillPath();
  }

  return bar;
}

// 添加三圈圆形进度条
async function addCircleProgress() {
  const size = isSmall ? 120 : isMedium ? 150 : 320;
  const ringWidth = 12;
  const gap = 4;

  const context = new DrawContext();
  context.size = new Size(size, size);
  context.opaque = false;
  context.respectScreenScale = true;

  const center = new Point(size / 2, size / 2);
  const baseRadius = (size - ringWidth) / 2;

  const rings = [
    { progress: yearProgress, color: purple },
    { progress: monthProgress, color: blue },
    { progress: weekProgress, color: green }
  ];

  rings.forEach((ring, index) => {
    const radius = baseRadius - index * (ringWidth + gap);
    drawRing(
      context,
      center,
      radius,
      ringWidth,
      ring.color,
      Number(ring.progress)
    );
  });

  // 生成圆形图
  let circleImg = context.getImage();

  if (isSmall) {
    // 小尺寸：文字也绘制成一张图
    const textCtx = new DrawContext();
    const textWidth = 60; // 文字图宽度
    const textHeight = 55; // 文字图高度
    textCtx.size = new Size(textWidth, textHeight);
    textCtx.opaque = false;
    textCtx.respectScreenScale = true;

    const texts = [
      { text: dayAndYear, color: purple },
      { text: dayAndMonth, color: blue },
      { text: dayAndWeek, color: green }
    ];

    const fontSize = 10;
    let y = 0;
    texts.forEach(t => {
      textCtx.setFont(Font.systemFont(fontSize));
      textCtx.setTextAlignedLeft();
      textCtx.setTextColor(t.color);
      textCtx.drawTextInRect(t.text, new Rect(16, y, textWidth, fontSize + 6));
      y += fontSize + 6;
    });

    const textImg = textCtx.getImage();

    // 布局：左文字图，右圆圈图
    const stack = widget.addStack();
    stack.layoutHorizontally();
    stack.topAlignContent();

    const leftStack = stack.addStack();
    leftStack.addImage(textImg).imageSize = new Size(textWidth, textHeight);

    const rightStack = stack.addStack();
    rightStack.addImage(circleImg).imageSize = new Size(size, size);

    stack.addSpacer(18);
  } else if (isMedium) {
    // 中尺寸保持原样
    const row = widget.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();

    // 左边文字
    const textStack = row.addStack();
    textStack.layoutVertically();
    textStack.centerAlignContent();

    const yearText = textStack.addText(dayAndYear);
    yearText.font = Font.systemFont(18);
    yearText.textColor = purple;

    textStack.addSpacer(5);

    const monthText = textStack.addText(dayAndMonth);
    monthText.font = Font.systemFont(18);
    monthText.textColor = blue;

    textStack.addSpacer(5);

    const weekText = textStack.addText(dayAndWeek);
    weekText.font = Font.systemFont(18);
    weekText.textColor = green;

    row.addSpacer(12);

    // 右边圆圈
    const imgStack = row.addStack();
    imgStack.addSpacer();
    imgStack.addImage(circleImg).imageSize = new Size(size, size);
    imgStack.addSpacer();
  } else {
    // large尺寸：圆心文字
    const finalContext = new DrawContext();
    finalContext.size = new Size(size, size);
    finalContext.opaque = false;
    finalContext.respectScreenScale = true;

    finalContext.drawImageAtPoint(circleImg, new Point(0, 0));

    const texts = [
      { text: dayAndYear, color: purple },
      { text: dayAndMonth, color: blue },
      { text: dayAndWeek, color: green }
    ];

    const fontSize = 24;
    const totalHeight = fontSize * 3 + 8;
    let y = center.y - totalHeight / 2;

    texts.forEach(t => {
      finalContext.setFont(Font.boldSystemFont(fontSize));
      finalContext.setTextAlignedCenter();
      finalContext.setTextColor(t.color);
      finalContext.drawTextInRect(t.text, new Rect(0, y, size, fontSize));
      y += fontSize + 4;
    });

    const finalImg = finalContext.getImage();

    const imgStack = widget.addStack();
    imgStack.addSpacer();
    imgStack.addImage(finalImg).imageSize = new Size(size, size);
    imgStack.addSpacer();
  }
}
// 画单个圆形进度条
function drawRing(ctx, center, radius, lineWidth, color, percentage) {
  ctx.setStrokeColor(new Color("#e0e0e0", 0.3));
  ctx.setLineWidth(lineWidth);
  ctx.strokeEllipse(
    new Rect(center.x - radius, center.y - radius, radius * 2, radius * 2)
  );

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * percentage) / 100;

  const path = new Path();
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + (endAngle - startAngle) * t;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    if (i === 0) {
      path.move(new Point(x, y));
    } else {
      path.addLine(new Point(x, y));
    }
  }

  ctx.addPath(path);
  ctx.setStrokeColor(color);
  ctx.setLineWidth(lineWidth);
  ctx.strokePath();
}

async function CheckKu() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "Ku.js");
  const url = "https://raw.githubusercontent.com/bb1026/bing/main/js/Ku.js";
  let needDownload = false;

  try {
    if (!fm.fileExists(path) || !fm.readString(path).includes("installation")) {
      console.log("数据库异常，准备重新下载");
      notify("数据库异常", "本地数据库无效，准备重新下载");
      needDownload = true;
    }
  } catch {
    console.log("数据库异常，准备重新下载");
    notify("数据库异常", "读取数据库出错，准备重新下载");
    needDownload = true;
  }

  async function notify(title, body) {
    const n = new Notification();
    n.title = title;
    n.body = body;
    await n.schedule();
  }

  if (needDownload) {
    fm.writeString(path, await new Request(url).loadString());
    if (fm.isFileStoredIniCloud(path)) await fm.downloadFileFromiCloud(path);
    console.log("数据库下载完成");
  }

  ({ installation } = importModule("Ku"));
  if (typeof installation !== "function") throw new Error("数据库模块无效");
}
