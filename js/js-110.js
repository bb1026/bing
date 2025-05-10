// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: calendar-alt;
this.name = "农历";
this.widget_ID = "js-110";
this.version = "v2.3";

let installation, calendar;
await CheckKu();
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
      : lunar.IDayCn === "初一"
      ? lunar.IMonthCn
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
  //   const today = new Date(2025, 04, 01);
  const year = today.getFullYear();
  const month = today.getMonth();
  const dayOfWeek = today.getDay();
  const isWeekend = WidgetUtils.isWeekend(dayOfWeek);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const widgetFamily = config.widgetFamily || "large"; /*small, medium, large*/

  const monthStart = new Date(year, month, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  let allEvents = [];
  try {
    const calendars = await Calendar.forEvents();
    allEvents = await CalendarEvent.between(monthStart, monthEnd, calendars);
  } catch (error) {
    console.error("获取月事件失败:" + error);
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
    lunarText.textColor = isWeekend ? COLORS.weekend : COLORS.weekday;

    lunarRow.addSpacer();
    widget.addSpacer();

    // 添加事件
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const allTodayEvents = await getUpcomingEvents(start, end);

    const prefixSet = new Set();
    const upcoming = [];

    for (const e of allTodayEvents) {
      const title = e.title.trim();
      const prefix = title.slice(0, 3);

      if (!prefixSet.has(prefix)) {
        prefixSet.add(prefix);
        upcoming.push(e);
      }
    }

    lunarText.font =
      WidgetUtils.getIsTerm(today) || upcoming.length > 0
        ? Font.boldSystemFont(15)
        : Font.boldSystemFont(30);

    if (upcoming.length > 0) {
      const eventRow = widget.addStack();
      eventRow.layoutHorizontally();
      eventRow.addSpacer();

      const eventStack = eventRow.addStack();
      eventStack.layoutVertically();
      eventStack.spacing = 2;

      for (const event of upcoming) {
        const eventText = eventStack.addText("● " + event.title);
        eventText.font = Font.systemFont(12);
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
      dayCell.size = new Size(45, 20);
      dayCell.centerAlignContent();
      WidgetUtils.createDateText(dayCell, day, WidgetUtils.isWeekend(i));
      if (i < 6) weekRow.addSpacer(5);
    });
    widget.addSpacer(5);

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
      dayCell.size = new Size(45, 20);
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
      dotCell.size = new Size(45, 6);
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
      lunarCell.size = new Size(45, 20);
      const isTerm = WidgetUtils.getIsTerm(dayDate);
      const lunarDisplay = WidgetUtils.getLunarDisplayDate(
        dayDate,
        widgetFamily
      );

      const daysEvents = allEvents.filter(
        e => e.startDate >= dayStart && e.startDate <= dayEnd
      );

      let eventOutput = "";
      if (
        daysEvents.length > 0 &&
        !daysEvents[0].calendar.title.includes("生日") &&
        !daysEvents[0].calendar.title.toLowerCase().includes("birthday")
      ) {
        eventOutput += daysEvents[0].title;
      } else if (
        daysEvents.length > 1 &&
        !daysEvents[1].calendar.title.includes("生日") &&
        !daysEvents[1].calendar.title.toLowerCase().includes("birthday")
      ) {
        eventOutput += `\n${daysEvents[1].title}`;
      }

      let displayContent = "";
      if (eventOutput) {
        displayContent = eventOutput;
      } else if (isTerm) {
        displayContent = WidgetUtils.getTerm(dayDate);
      } else {
        displayContent = lunarDisplay;
      }

      const lunarText = lunarCell.addText(displayContent);

      lunarText.font = Font.mediumSystemFont(14);
      lunarText.textColor =
        isTerm || eventOutput ? COLORS.weekend : COLORS.lunarText;
      lunarText.lineLimit = 2;
      lunarText.minimumScaleFactor = 0.5;

      if (i < 6) {
        dateRow.addSpacer(5);
        dotRow.addSpacer(5);
        lunarRow.addSpacer(5);
      }
    }

    widget.addSpacer(8);

    const weekStart = new Date(firstDayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeekEvents = allEvents.filter(
      e =>
        (e.startDate >= weekStart && e.startDate <= weekEnd) ||
        (e.endDate >= weekStart && e.endDate <= weekEnd) ||
        (e.startDate <= weekStart && e.endDate >= weekEnd)
    );

    const prefixSet = new Set();
    const filteredEvents = [];

    for (const e of thisWeekEvents) {
      const title = e.title.trim();
      const prefix = title.slice(0, 3);

      if (!prefixSet.has(prefix)) {
        prefixSet.add(prefix);
        filteredEvents.push(e);
      }
    }

    for (const event of filteredEvents) {
      const eventStack = widget.addStack();
      eventStack.layoutHorizontally();
      const bullet = eventStack.addText("● ");
      eventStack.setPadding(0, 10, 0, 10);

      bullet.textColor = new Color("#" + event.calendar.color.hex);
      bullet.font = Font.systemFont(12);

      const eventDate = event.startDate;
      let datePrefix = `${eventDate.getMonth() + 1}月${eventDate.getDate()}日 `;

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
        dateCell.size = new Size(50, 50);
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
        dotCell.size = new Size(50, 6);
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

          // 添加前置 spacer
          const totalWidth =
            shownColors.length * 6 + (shownColors.length - 1) * 2;
          const remainingSpace = 12 - totalWidth;
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
        lunarStack.size = new Size(50, 20);
        const isTerm = WidgetUtils.getIsTerm(date);
        const lunarDisplay = WidgetUtils.getLunarDisplayDate(
          date,
          widgetFamily
        );

        const daysEvents = allEvents.filter(
          e => e.startDate >= dayStart && e.startDate <= dayEnd
        );

        let eventOutput = "";
        if (
          daysEvents.length > 0 &&
          !daysEvents[0].calendar.title.includes("生日") &&
          !daysEvents[0].calendar.title.toLowerCase().includes("birthday")
        ) {
          eventOutput += daysEvents[0].title;
        } else if (
          daysEvents.length > 1 &&
          !daysEvents[1].calendar.title.includes("生日") &&
          !daysEvents[1].calendar.title.toLowerCase().includes("birthday")
        ) {
          eventOutput += `\n${daysEvents[1].title}`;
        }

        let displayContent = "";
        if (eventOutput) {
          displayContent = eventOutput;
        } else if (isTerm) {
          displayContent = WidgetUtils.getTerm(date);
        } else {
          displayContent = lunarDisplay;
        }

        const lunarText = lunarStack.addText(displayContent);

        lunarText.font = Font.mediumSystemFont(14);
        lunarText.textColor =
          isTerm || eventOutput ? COLORS.weekend : COLORS.lunarText;
        lunarText.lineLimit = 2;
        lunarText.minimumScaleFactor = 0.5;

        currentDate++;
      }
    }

    // 事件列表
    const prefixSet = new Set();
    const upcomingEvents = [];

    for (const e of allEvents) {
      const title = e.title.trim();
      const prefix = title.slice(0, 3);

      if (prefixSet.has(prefix)) continue;

      prefixSet.add(prefix);
      upcomingEvents.push(e);
    }

    for (let i = 0; i < upcomingEvents.length; i += 2) {
      const row = widget.addStack();
      row.layoutHorizontally();
      row.spacing = 16;
      row.topAlignContent();

      for (let j = 0; j < 2; j++) {
        const event = upcomingEvents[i + j];
        if (!event) break;

        const container = row.addStack();
        container.size = new Size(160, 15);
        container.layoutVertically();
        container.topAlignContent();

        addEventToStack(container, event, formatTitle(event));
      }
    }

    function addEventToStack(stack, event, title) {
      const eventStack = stack.addStack();
      eventStack.layoutHorizontally();
      eventStack.spacing = 4;
      eventStack.setPadding(0, 10, 0, 10);

      const bullet = eventStack.addText("●");
      bullet.textColor = new Color("#" + event.calendar.color.hex);
      bullet.font = Font.systemFont(12);

      const titleText = eventStack.addText(title);
      titleText.font = Font.systemFont(12);
      titleText.textColor = COLORS.eventText;
      titleText.lineLimit = 1;
      titleText.minimumScaleFactor = 0.8;
    }

    function formatTitle(event) {
      const eventDate = event.startDate;
      const datePrefix = `${
        eventDate.getMonth() + 1
      }月${eventDate.getDate()}日 `;
      return datePrefix + event.title;
    }
    widget.addSpacer();
    widget.url = "calshow://";
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
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "Ku.js");
  const url = "https://raw.githubusercontent.com/bb1026/bing/main/js/Ku.js";
  let needDownload = false;

  try {
    ({ installation, calendar } = importModule("Ku"));

    if (typeof installation !== "function") {
      console.log("数据库模块无效，准备重新下载");
      needDownload = true;
    }
  } catch {
    console.log("数据库异常，准备重新下载");
    needDownload = true;
  }

  if (needDownload) {
    const req = new Request(url);
    req.req.timeoutInterval = 5;
    try {
      fm.writeString(path, await req.loadString());
      if (fm.isFileStoredIniCloud(path)) await fm.downloadFileFromiCloud(path);
      console.log("数据库下载完成");

      ({ installation, calendar } = importModule("Ku"));
      if (typeof installation !== "function") throw new Error("数据库模块无效");
    } catch (error) {
      console.error("请求失败:" + error.message);
    }
  }
}
