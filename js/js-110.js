// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: calendar-alt;
this.name = "农历";
this.widget_ID = "js-110";
this.version = "v3.2";

let installation, calendar;
await CheckKu();
await installation(this.widget_ID, this.version);

// 公共工具函数
const widgetFamily = config.widgetFamily || "large"; /*small, medium, large*/

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function isBirthdayEvent(ev) {
  return ev.title.includes("生日");
}

function isValidEvent(ev) {
  return !isBirthdayEvent(ev);
}

function getTitlePrefix(title, length = 4) {
  return title
    .replace(/（.*?）|\(.*?\)/g, "")
    .trim()
    .slice(0, length);
}

function formatDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

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
  todayBorder: Color.blue()
};

const lunarCache = {};
const NOTIFICATION_KEY = "lastNotificationDate";

const WidgetUtils = {
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
    if (isWeekend) {
      textElement.textColor = COLORS.weekend;
    }
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

async function shouldSendNotification() {
  const now = new Date();
  if (now.getHours() < 6) return false;
  const lastDate = await getLastNotificationDate();
  return lastDate !== new Date().toDateString();
  return true;
}

async function getLastNotificationDate() {
  return Keychain.contains(NOTIFICATION_KEY)
    ? JSON.parse(Keychain.get(NOTIFICATION_KEY)).date
    : "";
}

async function setLastNotificationDate(date) {
  Keychain.set(NOTIFICATION_KEY, JSON.stringify({ date }));
}

async function sendNotificationIfNeeded(today, events) {
  if (!(await shouldSendNotification())) return;

  const dateKey = `${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}`;
  const titleSet = new Set();

  // 获取当天事件（去重逻辑：去括号 + 前4字）
  const todayEvents = events
    .filter(e => {
      const eventDate = new Date(e.startDate);
      return (
        eventDate.getFullYear() === today.getFullYear() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getDate() === today.getDate()
      );
    })
    .filter(e => {
      const cleanTitle = e.title
        .replace(/（.*?）|\(.*?\)/g, "")
        .trim()
        .slice(0, 4); // 用于去重
      const uniqueKey = `${dateKey}::${cleanTitle}`;
      if (titleSet.has(uniqueKey)) return false;
      titleSet.add(uniqueKey);
      return true;
    })
    .map(
      e => e.title.trim().replace(/（.*?）|\(.*?\)/g, "") // 去除括号用于展示
    );

  // 获取节气信息
  const term = WidgetUtils.getIsTerm(today) ? WidgetUtils.getTerm(today) : null;

  // 没有事件和节气则不通知
  if (todayEvents.length === 0 && !term) return;

  // 构建通知内容
  const lunar = WidgetUtils.getLunarData(today);
  const dateStr = formatDate(today);
  const lunarStr = `${lunar.IMonthCn}${lunar.IDayCn}`;
//   const eventStr = todayEvents.join("、");

  const body = [dateStr, lunarStr, term].filter(Boolean).join(" ");

  // 发送通知并记录
  const notification = new Notification();
  notification.title = "今日提醒";
  notification.body = body;
  await notification.schedule();
  console.log("已发送通知:" + body);

  await setLastNotificationDate(new Date().toDateString());
}

const lunarData = calendar.solar2lunar();
const viewLunar = `•${lunarData.gzYear}年${lunarData.IMonthCn}${lunarData.IDayCn}`

async function createCalendarWidget() {
  const widget = new ListWidget();
  const widgetWidth = 350;
  const today = new Date();
  //   const today = new Date(2025, 4, 1);
  const year = today.getFullYear();
  const month = today.getMonth();
  const dayOfWeek = today.getDay();
  const isWeekend = WidgetUtils.isWeekend(dayOfWeek);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
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

  // 检查是否需要发送通知
  await sendNotificationIfNeeded(today, allEvents, widgetFamily);

  if (widgetFamily === "small") {
    const contentStack = widget.addStack();
    contentStack.layoutVertically();

    // 星期行
    const weekRow = WidgetUtils.createCenteredRow(contentStack);
    weekRow.addSpacer();
    const weekText = weekRow.addText(WEEK_DAYS_FULL[dayOfWeek]);
    weekText.font = Font.boldSystemFont(25);
    if (isWeekend) {
      weekText.textColor = COLORS.weekend;
    }
    weekRow.addSpacer();

    // 日期行
    const dateRow = WidgetUtils.createCenteredRow(contentStack);
    dateRow.addSpacer();
    const dateText = dateRow.addText(`${today.getDate()}`);
    dateText.font = Font.boldSystemFont(50);
    if (isWeekend) {
      dateText.textColor = COLORS.weekend;
    }
    dateRow.addSpacer();

    // 农历 + 节气行
    const lunarRow = WidgetUtils.createCenteredRow(contentStack);
    lunarRow.addSpacer();

    let lunarTextContent = WidgetUtils.getLunarDisplayDate(today);
    if (WidgetUtils.getIsTerm(today)) {
      lunarTextContent += ` • ${WidgetUtils.getTerm(today)}`;
    }

    const lunarText = lunarRow.addText(lunarTextContent);
    if (isWeekend) {
      lunarText.textColor = COLORS.weekend;
    }

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
        : Font.boldSystemFont(25);

    if (upcoming.length > 0) {
      const eventRow = widget.addStack();
      eventRow.layoutHorizontally();
      eventRow.addSpacer();

      const eventStack = eventRow.addStack();
      eventStack.layoutVertically();
      eventStack.spacing = 2;

      for (const event of upcoming) {
        const eventText = eventStack.addText("● " + event.title);
        eventText.font = Font.systemFont(20);
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

    const eventMap = new Map();
    for (const e of allEvents) {
      const date = new Date(e.startDate);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().slice(0, 10);
      if (!eventMap.has(key)) eventMap.set(key, []);
      eventMap.get(key).push(e);
    }

    const dayRow = widget.addStack();
    dayRow.layoutHorizontally();
    dayRow.centerAlignContent();
    dayRow.addSpacer();
    const dText = dayRow.addText(formatDate(today) + viewLunar);
    dText.font = Font.boldSystemFont(20);
    dText.centerAlignText();
    dayRow.addSpacer();
    
    widget.addSpacer();

    const weekRow = WidgetUtils.createCenteredRow(widget);
    WEEK_DAYS.forEach((day, i) => {
      const dayCell = weekRow.addStack();
      dayCell.size = new Size(45, 20);
      dayCell.centerAlignContent();
      WidgetUtils.createDateText(dayCell, day, WidgetUtils.isWeekend(i));
      if (i < 6) weekRow.addSpacer(5);
    });
    
    widget.addSpacer();

    const dateRow = WidgetUtils.createCenteredRow(widget);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(firstDayOfWeek);
      dayDate.setDate(firstDayOfWeek.getDate() + i);
      const isWeekend = WidgetUtils.isWeekend(i);
      const isToday =
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth();

      const dateKey = dayDate.toISOString().slice(0, 10);
      const dayEvents = eventMap.get(dateKey) || [];

      // 大单元格
      const dayCell = dateRow.addStack();
      dayCell.layoutVertically();
      dayCell.size = new Size(45, 50);
      dayCell.centerAlignContent();
      
      // 日期单元格
      const dayRow = dayCell.addStack();
      dayRow.size = new Size(45, 20);
      dayRow.centerAlignContent();
      const dayText = WidgetUtils.createDateText(
        dayRow,
        dayDate.getDate().toString(),
        isWeekend,
        isToday
      );

      // 事件圆点
      const dotCell = dayCell.addStack();
      dotCell.size = new Size(45, 6);
      dotCell.centerAlignContent();

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
      const lunarCell = dayCell.addStack();
      lunarCell.size = new Size(45, 20);
      const isTerm = WidgetUtils.getIsTerm(dayDate);
      const lunarDisplay = WidgetUtils.getLunarDisplayDate(
        dayDate,
        widgetFamily
      );
      
      if (isToday) WidgetUtils.applyTodayStyle(dayCell);

      let eventOutput = "";
      if (
        dayEvents.length > 0 &&
        !dayEvents[0].calendar.title.includes("生日") &&
        !dayEvents[0].calendar.title.toLowerCase().includes("birthday")
      ) {
        eventOutput += dayEvents[0].title;
      } else if (
        dayEvents.length > 1 &&
        !dayEvents[1].calendar.title.includes("生日") &&
        !dayEvents[1].calendar.title.toLowerCase().includes("birthday")
      ) {
        eventOutput += `\n${dayEvents[1].title}`;
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
      if (isTerm || eventOutput) {
        lunarText.textColor = COLORS.weekend;
      }
      lunarText.lineLimit = 2;
      lunarText.minimumScaleFactor = 0.5;

      if (i < 6) {
        dateRow.addSpacer(5);
      }
    }
    
    widget.addSpacer();

    const weekStart = new Date(firstDayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeekEvents = allEvents.filter(
      e => e.startDate >= weekStart && e.startDate <= weekEnd
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
      let datePrefix = `${formatDate(eventDate)} `;

      const title = eventStack.addText(datePrefix + event.title);
      title.font = Font.systemFont(12);
    }

    widget.addSpacer();
  } else {
    // 大尺寸 - 完整月历
    const dayRow = widget.addStack();
    dayRow.layoutHorizontally();
    dayRow.centerAlignContent();
    dayRow.addSpacer();
    const dText = dayRow.addText(formatDate(today) + viewLunar);
    dText.font = Font.boldSystemFont(18);
    dText.centerAlignText();
    dayRow.addSpacer();
    widget.addSpacer(2);

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
        dateCell.size = new Size(50, 48);
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
        dayStack.size = new Size(50, 18);
        dayStack.centerAlignContent();
        const dayText = WidgetUtils.createDateText(
          dayStack,
          currentDate.toString(),
          isWeekend,
          isToday
        );

        // 事件圆点
        const dotCell = dateCell.addStack();
        dotCell.size = new Size(50, 5);
        dotCell.centerAlignContent();

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        const dayEvents = allEvents.filter(
          e =>
            e.startDate >= dayStart &&
            e.startDate <= dayEnd &&
            e.startDate.getMonth() === month &&
            e.startDate.getFullYear() === year
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
        lunarStack.size = new Size(50, 18);
        const isTerm = WidgetUtils.getIsTerm(date);
        const lunarDisplay = WidgetUtils.getLunarDisplayDate(
          date,
          widgetFamily
        );
        
        if (isToday) WidgetUtils.applyTodayStyle(dateCell);

        let eventOutput = "";
        if (
          dayEvents.length > 0 &&
          !dayEvents[0].calendar.title.includes("生日") &&
          !dayEvents[0].calendar.title.toLowerCase().includes("birthday")
        ) {
          eventOutput += dayEvents[0].title;
        } else if (
          dayEvents.length > 1 &&
          !dayEvents[1].calendar.title.includes("生日") &&
          !dayEvents[1].calendar.title.toLowerCase().includes("birthday")
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

        lunarText.font = Font.mediumSystemFont(13);
        if (isTerm || eventOutput) {
          lunarText.textColor = COLORS.weekend;
        }
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

      const eventDate = e.startDate;
      const isSameMonth =
        eventDate.getFullYear() === year && eventDate.getMonth() === month;

      if (!isSameMonth) continue;
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
      titleText.lineLimit = 1;
      titleText.minimumScaleFactor = 0.8;
    }

    function formatTitle(event) {
      const eventDate = event.startDate;
      const datePrefix = `${formatDate(eventDate)} `;
      return datePrefix + event.title;
    }
//     widget.addSpacer();
    widget.url = "calshow://";
  }

  // UItable展示
  let table = new UITable();
  table.showSeparators = true;

  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();

  // 当前视图年月
  let viewYear = currentYear;
  let viewMonth = currentMonth;
  
  async function renderCalendar() {
    table.removeAllRows();

    let monthStart = new Date(viewYear, viewMonth, 1);
    let monthEnd = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59);
    let events = await CalendarEvent.between(monthStart, monthEnd);
    // 构建 eventMap
    let eventMap = {};
    for (let ev of events) {
      if (ev.title.includes("生日")) continue;

      let d = ev.startDate;
      let key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push(ev);
    }

    // 顶部标题
    let headerRow = new UITableRow();
    let formattedDate = new DateFormatter();
    formattedDate.dateFormat =
      viewYear === currentYear && viewMonth === currentMonth
        ? "yyyy年M月d日" + viewLunar
        : "yyyy年M月";
    let headerCell = UITableCell.text(
      formattedDate.string(
        viewYear === currentYear && viewMonth === currentMonth
          ? today
          : new Date(viewYear, viewMonth, 1)
      )
    );
    headerCell.centerAligned();
    headerCell.titleFont = Font.boldSystemFont(20);
    headerRow.addCell(headerCell);
    table.addRow(headerRow);

    // 星期行
    let weekRow = new UITableRow();
    let weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    for (let i = 0; i < 7; i++) {
      let cell = UITableCell.text(weekDays[i]);
      cell.centerAligned();
      cell.titleFont = Font.boldSystemFont(28);
      if (i === 0 || i === 6) cell.titleColor = Color.red();
      weekRow.addCell(cell);
    }
    table.addRow(weekRow);

    // 生成网格数据
    function getCalendarGrid(year, month) {
      let firstDay = new Date(year, month, 1);
      let startWeekday = firstDay.getDay();
      let daysInMonth = new Date(year, month + 1, 0).getDate();
      let daysInPrevMonth = new Date(year, month, 0).getDate();
      let grid = [];

      for (let i = startWeekday - 1; i >= 0; i--) {
        let d = daysInPrevMonth - i;
        grid.push({
          day: d,
          inCurrentMonth: false,
          date: new Date(year, month - 1, d)
        });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        grid.push({
          day: d,
          inCurrentMonth: true,
          date: new Date(year, month, d)
        });
      }
      while (grid.length < 42) {
        let d = grid.length - (startWeekday + daysInMonth - 1);
        grid.push({
          day: d,
          inCurrentMonth: false,
          date: new Date(year, month + 1, d)
        });
      }
      return grid;
    }

    // 渲染网格
    let calendarData = getCalendarGrid(viewYear, viewMonth);
    for (let week = 0; week < 6; week++) {
      let row = new UITableRow();
      row.height = 75;
      for (let i = 0; i < 7; i++) {
        let item = calendarData[week * 7 + i];
        let date = item.date;
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let key = `${year}-${month}-${day}`;

        let lunar = calendar.solar2lunar(year, month, day);
        let event = eventMap[key]?.[0];
        let lunarText = event
          ? event.title
          : lunar.IDayCn === "初一"
          ? lunar.IMonthCn
          : lunar.IDayCn;

        let cell = UITableCell.text(item.day.toString(), lunarText);
        cell.centerAligned();
        cell.titleFont = Font.systemFont(28);
        cell.subtitleFont = Font.systemFont(12);

        let isWeekend = i === 0 || i === 6;
        let isToday =
          year === currentYear &&
          month === currentMonth + 1 &&
          day === today.getDate();

           if (!item.inCurrentMonth) {
          cell.titleColor = Color.gray();
          cell.subtitleColor = Color.lightGray();
        } else if (isToday) {
          cell.titleColor = Color.blue();
          cell.subtitleColor = Color.blue();
        } else if (isWeekend) {
          cell.titleColor = Color.red();
          cell.subtitleColor = Color.red();
        } else if (event) {
          cell.subtitleColor = Color.red();
        } else {
          cell.subtitleColor = Color.gray();
        }
        row.addCell(cell);
      }
      table.addRow(row);
    }

    // 按钮
    let controlRow = new UITableRow();
    let prevCell = UITableCell.button("⬅️ 上一月");
    prevCell.centerAligned();
    controlRow.addCell(prevCell);

    let todayCell = UITableCell.button("📅 回到今天");
    todayCell.centerAligned();
    controlRow.addCell(todayCell);

    let nextCell = UITableCell.button("➡️ 下一月");
    nextCell.centerAligned();
    controlRow.addCell(nextCell);

    table.addRow(controlRow);

    // 简要事件列表
    if (events.length > 0) {
      let titleSet = new Set();
      for (let ev of events) {
        let start = ev.startDate;
        let y = start.getFullYear();
        let m = start.getMonth();

        // 只显示当前视图的月份
        if (y !== viewYear || m !== viewMonth) continue;

        let d = start.getDate();
        let dateKey = `${y}-${m + 1}-${d}`;

        // 去除括号内容并保留前4个字用于比较
        let cleanTitle = ev.title
          .replace(/（.*?）|\(.*?\)/g, "")
          .trim()
          .slice(0, 4);

        // 构造唯一键：日期 + 标题前4字
        let uniqueKey = `${dateKey}::${cleanTitle}`;
        if (titleSet.has(uniqueKey)) continue;
        titleSet.add(uniqueKey);

        // 添加事件行
        let row = new UITableRow();
        row.height = 25;
        let datePrefix = `${y}年${m + 1}月${d}日 `;
        row.addText(datePrefix + ev.title).titleFont = Font.systemFont(16);
        table.addRow(row);
      }
    }

    prevCell.onTap = async () => {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      await renderCalendar();
      table.reload();
    };

    nextCell.onTap = async () => {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      await renderCalendar();
      table.reload();
    };

    todayCell.onTap = async () => {
      viewYear = currentYear;
      viewMonth = currentMonth;
      await renderCalendar();
      table.reload();
    };
  }

  await renderCalendar();

  return config.runsInWidget
    ? Script.setWidget(widget)
    : widgetFamily === "small"
    ? widget.presentSmall()
    : widgetFamily === "medium"
    ? widget.presentMedium()
    : widget.presentLarge();
//     : await table.present(true);
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
