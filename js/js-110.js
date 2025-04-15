// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: calendar-alt;
(async () => {
this.name = "农历";
this.widget_ID = "js-110";
this.version = "v2.0";

await CheckKu();
const { installation, calendar } = importModule("Ku");
await installation(this.widget_ID, this.version);

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

const COLORS = {
  weekend: Color.red(),
  weekday: Color.black(),
  todayBorder: Color.blue(),
  lunarText: new Color("#666666"),
  monthBgText: new Color("#D3D3D3"),
  eventText: Color.black(),
  widgetBg: new Color("#FFFFFF")
};

const lunarCache = {};

const WidgetUtils = {
  createBackgroundImage(size = 200) {
    return Object.assign(new DrawContext(), {
      opaque: false,
      respectScreenScale: true,
      size: new Size(size, size)
    });
  },

  isWeekend(day) {
    return day === 0 || day === 6;
  },

  getLunarData(date) {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!lunarCache[key]) {
      lunarCache[key] = calendar.solar2lunar(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
    }
    return lunarCache[key];
  },

  getLunarDisplayDate(date, widgetFamily = "small") {
    const lunar = this.getLunarData(date);
    return widgetFamily === "small"
      ? lunar.IMonthCn + lunar.IDayCn
      : lunar.IDayCn;
  },

  getTerm(date) {
    return this.getLunarData(date).Term;
  },

  getIsTerm(date) {
    return this.getLunarData(date).isTerm;
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
    element.borderWidth = 2;
    element.borderColor = COLORS.todayBorder;
    element.cornerRadius = 10;
  },

  // 创建日期文本元素
  createDateText(parent, text, isWeekend = false, isToday = false) {
    const textElement = parent.addText(text);
    textElement.font = Font.boldSystemFont(20);
    textElement.textColor = isWeekend ? COLORS.weekend : COLORS.weekday;
    textElement.centerAlignText();
    return textElement;
  }
};

async function getUpcomingEvents(startDate, endDate, maxEventsToShow = 2) {
  try {
    const calendars = await Calendar.forEvents();
    const events = await CalendarEvent.between(startDate, endDate, calendars);
    return events.slice(0, maxEventsToShow).map(event => ({
      title: event.title,
      color: event.calendar.color?.hex || "000000",
      startDate: event.startDate
    }));
  } catch (error) {
    console.error("获取日历事件失败:", error);
    return [];
  }
}

async function createCalendarWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.widgetBg;
  const widgetWidth = 350;
  const today = new Date();
  //   const today = new Date(2025,04,01);
  const year = today.getFullYear();
  const month = today.getMonth();
  const dayOfWeek = today.getDay();
  const isWeekend = WidgetUtils.isWeekend(dayOfWeek);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const widgetFamily = config.widgetFamily || "large"; /*small, medium, large*/

  const weekStart = new Date(year, month, 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(year, month + 1, 0);
  weekEnd.setHours(23, 59, 59, 999);

  let allEvents = [];
  try {
    const calendars = await Calendar.forEvents();
    allEvents = await CalendarEvent.between(weekStart, weekEnd, calendars);
  } catch (error) {
    console.error("获取月事件失败:", error);
  }

  if (widgetFamily === "small") {
    const bgImg = WidgetUtils.createBackgroundImage();
    bgImg.setFont(Font.boldSystemFont(180));
    bgImg.setTextColor(COLORS.monthBgText);
    const monthNumber = month + 1;
    const x = monthNumber.toString().length === 1 ? 40 : 0;
    bgImg.drawTextInRect(monthNumber.toString(), new Rect(x, -20, 200, 200));
    widget.backgroundImage = await bgImg.getImage();

    const contentStack = widget.addStack();
    contentStack.layoutVertically();

    // 星期行
    const weekRow = WidgetUtils.createCenteredRow(contentStack);
    weekRow.addSpacer();
    const weekText = weekRow.addText(WEEK_DAYS_FULL[dayOfWeek]);
    weekText.font = Font.boldSystemFont(30);
    weekText.textColor = isWeekend ? COLORS.weekend : COLORS.weekday;
    weekRow.addSpacer();

    // 日期行
    const dateRow = WidgetUtils.createCenteredRow(contentStack);
    dateRow.addSpacer();
    const dateText = dateRow.addText(today.getDate().toString());
    dateText.font = Font.boldSystemFont(60);
    dateText.textColor = isWeekend ? COLORS.weekend : COLORS.weekday;
    dateRow.addSpacer();

    // 农历 + 节气行
    const lunarRow = WidgetUtils.createCenteredRow(contentStack);
    lunarRow.addSpacer();

    let lunarTextContent = WidgetUtils.getLunarDisplayDate(today);
    if (WidgetUtils.getIsTerm(today)) {
      lunarTextContent += ` • ${WidgetUtils.getTerm(today)}`;
    }

    const lunarText = lunarRow.addText(lunarTextContent);
    lunarText.font = Font.boldSystemFont(16);
    lunarText.textColor = isWeekend ? COLORS.weekend : COLORS.weekday;
    lunarRow.addSpacer();

    widget.addSpacer();

    // 添加事件
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    const upcoming = await getUpcomingEvents(start, end);

    if (upcoming.length > 0) {
      const eventRow = widget.addStack();
      eventRow.layoutHorizontally();
      eventRow.addSpacer();

      const eventStack = eventRow.addStack();
      eventStack.layoutVertically();
      eventStack.spacing = 2;

      for (const event of upcoming) {
        const eventText = eventStack.addText("● " + event.title);
        eventText.font = Font.systemFont(14);
        eventText.textColor = new Color("#" + event.color);
        eventText.lineLimit = 1;
      }

      eventRow.addSpacer();
    }
  } else if (widgetFamily === "medium") {
    // 中尺寸
    const currentDay = today.getDate();
    const currentDayOfWeek = today.getDay();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(currentDay - currentDayOfWeek);

    const bgImg = WidgetUtils.createBackgroundImage();
    bgImg.setFont(Font.boldSystemFont(80));
    bgImg.setTextColor(COLORS.monthBgText);
    const monthNumber = month + 1;
    const x = monthNumber.toString().length === 1 ? 40 : 20;
    bgImg.drawTextInRect(`${monthNumber}月`, new Rect(x, 50, 200, 200));
    widget.backgroundImage = await bgImg.getImage();

    const weekRow = WidgetUtils.createCenteredRow(widget);
    WEEK_DAYS.forEach((day, i) => {
      const dayCell = weekRow.addStack();
      dayCell.size = new Size(40, 20);
      dayCell.centerAlignContent();
      WidgetUtils.createDateText(dayCell, day, WidgetUtils.isWeekend(i));
      if (i < 6) weekRow.addSpacer(5);
    });

    const dateRow = WidgetUtils.createCenteredRow(widget);
    const dotRow = WidgetUtils.createCenteredRow(widget);
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

      // 事件圆点
      const dotCell = dotRow.addStack();
      dotCell.size = new Size(40, 6);
      dotCell.centerAlignContent();

      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);
      const dayEvents = allEvents.filter(
        e => e.startDate >= dayStart && e.startDate <= dayEnd
      );

      if (dayEvents.length > 0) {
        const shownColors = new Set();
        for (const event of dayEvents) {
          const colorHex = event.calendar.color.hex;
          if (!shownColors.has(colorHex)) {
            const dot = dotCell.addText("●");
            dot.textColor = new Color("#" + colorHex);
            dot.font = Font.systemFont(6);
            dotCell.addSpacer(2);
            shownColors.add(colorHex);
          }
          if (shownColors.size >= 3) break;
        }
      }

      // 农历信息
      const lunarCell = lunarRow.addStack();
      lunarCell.size = new Size(40, 40);
      const lunarText = lunarCell.addText(
        `${WidgetUtils.getLunarDisplayDate(dayDate, widgetFamily)}${
          WidgetUtils.getIsTerm(dayDate)
            ? `\n${WidgetUtils.getTerm(dayDate)}`
            : ""
        }`
      );
      lunarText.font = Font.mediumSystemFont(14);
      lunarText.textColor = COLORS.lunarText;

      if (i < 6) {
        dateRow.addSpacer(5);
        dotRow.addSpacer(5);
        lunarRow.addSpacer(5);
      }
    }

    widget.addSpacer(8);

    // 事件详情（最多2条）
    const upcomingEvents = allEvents
      .filter(e => e.endDate >= today)
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 2);

    for (const event of upcomingEvents) {
      const eventStack = widget.addStack();
      eventStack.layoutHorizontally();
      const bullet = eventStack.addText("● ");
      bullet.textColor = new Color("#" + event.calendar.color.hex);
      bullet.font = Font.systemFont(12);
      const eventDate = event.startDate;
      const datePrefix = `${
        eventDate.getMonth() + 1
      }月${eventDate.getDate()}日 `;
      const title = eventStack.addText(datePrefix + event.title);
      title.font = Font.systemFont(12);
      title.textColor = COLORS.eventText;
    }

    widget.addSpacer();
  } else {
    // 大尺寸 - 完整月历
    const monthNumber = month + 1;
    const bgImg = WidgetUtils.createBackgroundImage(400);
    bgImg.setFont(Font.boldSystemFont(200));
    bgImg.setTextColor(COLORS.monthBgText);
    const x = monthNumber.toString().length === 1 ? 40 : 10;
    bgImg.drawTextInRect(`${monthNumber}月`, new Rect(x, 55, 800, 400));
    widget.backgroundImage = await bgImg.getImage();

    widget.addSpacer(4);
    const weekRow = WidgetUtils.createCenteredRow(widget);
    WEEK_DAYS.forEach((day, i) => {
      const dayCell = weekRow.addStack();
      dayCell.size = new Size(50, 20);
      dayCell.centerAlignContent();
      WidgetUtils.createDateText(dayCell, day, WidgetUtils.isWeekend(i));
      if (i < 6) weekRow.addSpacer((widgetWidth - 350) / 6);
    });

    let currentDate = 1;
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    // 计算本月需要多少行
    const totalCells = firstDayOfWeek + daysInMonth;
    const totalRows = Math.ceil(totalCells / 7);

    for (let i = 0; i < totalRows; i++) {
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

        // 日期数字
        const dayStack = dateCell.addStack();
        dayStack.size = new Size(50, 20);
        dayStack.centerAlignContent();
        const dayText = WidgetUtils.createDateText(
          dayStack,
          currentDate.toString(),
          isWeekend,
          isToday
        );
        if (isToday) WidgetUtils.applyTodayStyle(dayStack, dayText);

        // 事件圆点
        const dotCell = dateCell.addStack();
        dotCell.size = new Size(40, 6);
        dotCell.centerAlignContent();

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        const dayEvents = allEvents.filter(
          e => e.startDate >= dayStart && e.startDate <= dayEnd
        );

        if (dayEvents.length > 0) {
          const shownColors = [];
          for (const event of dayEvents) {
            const colorHex = event.calendar.color.hex;
            if (!shownColors.includes(colorHex)) {
              shownColors.push(colorHex);
              if (shownColors.length >= 3) break;
            }
          }

          // 添加前置 spacer 使圆点整体居中
          const totalWidth =
            shownColors.length * 6 + (shownColors.length - 1) * 2;
          const remainingSpace = 40 - totalWidth;
          if (remainingSpace > 0) {
            dotCell.addSpacer(remainingSpace / 2);
          }

          // 添加圆点和间距
          shownColors.forEach((colorHex, index) => {
            const dot = dotCell.addText("●");
            dot.textColor = new Color("#" + colorHex);
            dot.font = Font.systemFont(6);
            if (index < shownColors.length - 1) {
              dotCell.addSpacer(2);
            }
          });
        }

        // 农历信息
        const lunarStack = dateCell.addStack();
        lunarStack.size = new Size(50, 30);
        const lunarText = lunarStack.addText(
          `${WidgetUtils.getLunarDisplayDate(date, widgetFamily)}${
            WidgetUtils.getIsTerm(date) ? `\n${WidgetUtils.getTerm(date)}` : ""
          }`
        );
        lunarText.font = Font.mediumSystemFont(11);
        lunarText.textColor = COLORS.lunarText;

        currentDate++;
      }
    }

    // 事件列表
    const upcomingEvents = allEvents
      .filter(e => e.startDate >= weekStart && e.endDate <= weekEnd)
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 5);

    for (const event of upcomingEvents) {
      const eventStack = widget.addStack();
      eventStack.layoutHorizontally();
      const bullet = eventStack.addText("    ● ");
      bullet.textColor = new Color("#" + event.calendar.color.hex);
      bullet.font = Font.systemFont(12);
      const eventDate = event.startDate;
      const datePrefix = `${
        eventDate.getMonth() + 1
      }月${eventDate.getDate()}日 `;
      const title = eventStack.addText(datePrefix + event.title);
      title.font = Font.systemFont(12);
      title.textColor = COLORS.eventText;
    }
    widget.addSpacer();
  }

  return config.runsInWidget
    ? Script.setWidget(widget)
    : widgetFamily === "small"
    ? widget.presentSmall()
    : widgetFamily === "medium"
    ? widget.presentMedium()
    : widget.presentLarge();
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