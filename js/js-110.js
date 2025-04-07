(async () => {// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;
this.name = "农历";
this.widget_ID = "js-110";
this.version = "v1.0";

await CheckKu();
const { installation, calendar } = importModule("Ku");
// 检查更新
await installation(this.widget_ID, this.version);

// 全局常量
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];
const WEEK_DAYS_FULL = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六"
];

// 工具函数集合
const WidgetUtils = {
  // 创建背景图片
  createBackgroundImage(size = 200) {
    return Object.assign(new DrawContext(), {
      opaque: false,
      respectScreenScale: true,
      size: new Size(size, size)
    });
  },

  // 判断是否周末
  isWeekend(day) {
    return day === 0 || day === 6;
  },

  // 获取农历显示文本
  getLunarDisplayDate(date) {
    const lunar = calendar.solar2lunar(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    return lunar.IDayCn === "初一" ? lunar.IMonthCn : lunar.IDayCn;
  },

  // 创建水平居中行
  createCenteredRow(parent) {
    const row = parent.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    return row;
  },

  // 应用当天样式
  applyTodayStyle(element, textElement) {
    textElement.font = Font.boldSystemFont(30);
    element.borderWidth = 2;
    element.borderColor = Color.blue();
    element.cornerRadius = 10;
  },

  // 创建日期文本元素
  createDateText(parent, text, isWeekend = false, isToday = false) {
    const textElement = parent.addText(text);
    textElement.font = Font.boldSystemFont(isToday ? 30 : 25);
    textElement.textColor = isWeekend ? Color.red() : Color.black();
    textElement.centerAlignText();
    return textElement;
  }
};

async function createCalendarWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#FFFFFF");
  const widgetWidth = 350;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const widgetFamily = config.widgetFamily || "large";

  if (widgetFamily === "small") {
    // 小尺寸 - 当天日期+星期+农历
    const dayOfWeek = today.getDay();
    const isWeekend = WidgetUtils.isWeekend(dayOfWeek);

    // 背景图片
    const bgImg = WidgetUtils.createBackgroundImage();
    bgImg.setFont(Font.boldSystemFont(180));
    bgImg.setTextColor(new Color("#D3D3D3"));
    const monthNumber = month + 1;
    const x = monthNumber.toString().length === 1 ? 40 : 0;
    bgImg.drawTextInRect(monthNumber.toString(), new Rect(x, -20, 200, 200));
    widget.backgroundImage = await bgImg.getImage();

    // 主内容
    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();
    mainStack.addSpacer();

    const contentStack = mainStack.addStack();
    contentStack.layoutVertically();
    contentStack.centerAlignContent();

    // 日期行
    const dateRow = WidgetUtils.createCenteredRow(contentStack);
    dateRow.addSpacer();
    const dateText = dateRow.addText(today.getDate().toString());
    dateText.font = Font.mediumSystemFont(80); // 直接设置为30
    dateText.textColor = isWeekend ? Color.red() : Color.black();
    dateText.centerAlignText();
    dateRow.addSpacer();

    // 农历行
    const lunarRow = WidgetUtils.createCenteredRow(contentStack);
    lunarRow.addSpacer();
    const lunarText = lunarRow.addText(WidgetUtils.getLunarDisplayDate(today));
    lunarText.font = Font.mediumSystemFont(30);
    lunarText.textColor = isWeekend ? Color.red() : Color.black();
    lunarText.centerAlignText();
    lunarRow.addSpacer();

    // 星期行
    const weekRow = WidgetUtils.createCenteredRow(contentStack);
    weekRow.addSpacer();
    const weekText = weekRow.addText(WEEK_DAYS_FULL[dayOfWeek]);
    weekText.font = Font.mediumSystemFont(30); // 设置为30号字体
    weekText.textColor = isWeekend ? Color.red() : Color.black();
    weekText.centerAlignText();
    weekRow.addSpacer();

    mainStack.addSpacer();
    widget.addSpacer(15);
  } else if (widgetFamily === "medium") {
    // 中尺寸 - 本周日历
    const currentDay = today.getDate();
    const currentDayOfWeek = today.getDay();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(currentDay - currentDayOfWeek);

    // 背景图片
    const bgImg = WidgetUtils.createBackgroundImage();
    bgImg.setFont(Font.boldSystemFont(80));
    bgImg.setTextColor(new Color("#D3D3D3"));
    const monthNumber = month + 1;
    const x = monthNumber.toString().length === 1 ? 40 : 20;
    bgImg.drawTextInRect(`${monthNumber}月`, new Rect(x, 50, 200, 200));
    widget.backgroundImage = await bgImg.getImage();

    // 星期行
    const weekRow = WidgetUtils.createCenteredRow(widget);
    WEEK_DAYS.forEach((day, i) => {
      const dayCell = weekRow.addStack();
      dayCell.size = new Size(40, 20);
      dayCell.centerAlignContent();
      WidgetUtils.createDateText(dayCell, day, WidgetUtils.isWeekend(i));
      if (i < 6) weekRow.addSpacer(5);
    });

    widget.addSpacer(5);

    // 日期行和农历行
    const dateRow = WidgetUtils.createCenteredRow(widget);
    const lunarRow = WidgetUtils.createCenteredRow(widget);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(firstDayOfWeek);
      dayDate.setDate(firstDayOfWeek.getDate() + i);
      const isWeekend = WidgetUtils.isWeekend(i);
      const isToday =
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth();

      // 日期单元格
      const dayCell = dateRow.addStack();
      dayCell.size = new Size(40, 40);
      dayCell.centerAlignContent();
      const dayText = WidgetUtils.createDateText(
        dayCell,
        dayDate.getDate().toString(),
        isWeekend,
        isToday
      );
      if (isToday) WidgetUtils.applyTodayStyle(dayCell, dayText);

      // 农历单元格
      const lunarCell = lunarRow.addStack();
      lunarCell.size = new Size(40, 20);
      lunarCell.centerAlignContent();
      const lunarText = lunarCell.addText(
        WidgetUtils.getLunarDisplayDate(dayDate)
      );
      lunarText.font = Font.mediumSystemFont(14);
      lunarText.textColor = new Color("#666666");

      if (i < 6) {
        dateRow.addSpacer(5);
        lunarRow.addSpacer(5);
      }
    }
  } else {
    // 大尺寸 - 完整月历
    const monthNumber = month + 1;
    const bgImg = WidgetUtils.createBackgroundImage(400);
    bgImg.setFont(Font.boldSystemFont(200));
    bgImg.setTextColor(new Color("#D3D3D3"));
    const x = monthNumber.toString().length === 1 ? 40 : 10;
    bgImg.drawTextInRect(`${monthNumber}月`, new Rect(x, 55, 800, 400));
    widget.backgroundImage = await bgImg.getImage();

    // 星期行
    widget.addSpacer(70);
    const weekRow = WidgetUtils.createCenteredRow(widget);
    WEEK_DAYS.forEach((day, i) => {
      const dayCell = weekRow.addStack();
      dayCell.size = new Size(50, 20);
      dayCell.centerAlignContent();
      WidgetUtils.createDateText(dayCell, day, WidgetUtils.isWeekend(i));
      if (i < 6) weekRow.addSpacer((widgetWidth - 350) / 6);
    });

    widget.addSpacer(5);

    // 日期行
    let currentDate = 1;
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    for (let i = 0; i < 6; i++) {
      const dateRow = WidgetUtils.createCenteredRow(widget);
      dateRow.addSpacer((widgetWidth - 350) / 2);

      for (let j = 0; j < 7; j++) {
        const dateCell = dateRow.addStack();
        dateCell.layoutVertically();
        dateCell.size = new Size(50, 60);
        dateCell.centerAlignContent();

        if ((i === 0 && j < firstDayOfWeek) || currentDate > daysInMonth) {
          dateCell.addText(" ");
          dateCell.addStack();
          continue;
        }

        const date = new Date(year, month, currentDate);
        const isWeekend = WidgetUtils.isWeekend(date.getDay());
        const isToday = currentDate === today.getDate();

        // 公历日期
        const dayStack = dateCell.addStack();
        dayStack.size = new Size(50, 30);
        dayStack.centerAlignContent();
        const dayText = WidgetUtils.createDateText(
          dayStack,
          currentDate.toString(),
          isWeekend,
          isToday
        );
        if (isToday) WidgetUtils.applyTodayStyle(dateCell, dayText);

        // 农历日期
        const lunarStack = dateCell.addStack();
        lunarStack.size = new Size(50, 20);
        lunarStack.centerAlignContent();
        const lunarText = lunarStack.addText(
          WidgetUtils.getLunarDisplayDate(date)
        );
        lunarText.font = Font.mediumSystemFont(12);
        lunarText.textColor = new Color("#666666");

        currentDate++;
      }
      dateRow.addSpacer((widgetWidth - 350) / 2);
      widget.addSpacer(5);
    }
  }

  return config.runsInWidget ? Script.setWidget(widget) : widget.presentLarge();
}

await createCalendarWidget();

async function CheckKu() {
  const notification = new Notification();
  const fm = FileManager.local();
  const KuName = "Ku.js";
  const scriptPath = fm.joinPath(fm.documentsDirectory(), KuName);
  const scriptExists = fm.fileExists(scriptPath);

  if (!scriptExists) {
    try {
      const downloadReq = new Request("https://bb1026.github.io/bing/js/Ku.js");
      const scriptContent = await downloadReq.loadString();
      await fm.writeString(scriptPath, scriptContent);

      notification.title = "依赖库安装完成!";
      await notification.schedule();
      console.log("依赖库安装完成!");
    } catch (error) {
      console.error("下载或写入文件时出错:", error);
      notification.title = "依赖库安装失败!";
      notification.body = error.toString();
      await notification.schedule();
    }
  } else {
    console.log("依赖库已存在，无需下载。");
  }
}
})();