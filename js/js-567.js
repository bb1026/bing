(async () => {const Birthdays = [
  { Name: "爸    爸", Birthday: "19630501" },
  { Name: "妈    妈", Birthday: "19580116" },
  { Name: "纪小飞", Birthday: "19880327" },
  { Name: "黄    红", Birthday: "19900407" },
  { Name: "纪星宇", Birthday: "20151217" },
  { Name: "纪兵兵", Birthday: "19900909" }
];

const { calendar } = importModule("Ku");

// 日期数据
const today = new Date();
const dates = calendar.solar2lunar();

// 工具函数
const formatBirthday = b => `${b.slice(0, 4)}-${b.slice(4, 6)}-${b.slice(6)}`;
const getZodiac = b => calendar.solar2lunar(
  parseInt(b.slice(0, 4)),
  parseInt(b.slice(4, 6)),
  parseInt(b.slice(6))
).Animal;
const isTodayBirthday = b => {
  const d = new Date(b);
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
};
const isMorning = () => today.getHours() >= 8 && today.getHours() < 12;
const getTodayKey = name => `birthday-notify-${name}-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const sendNotificationOnce = name => {
  const key = getTodayKey(name);
  if (!Keychain.contains(key)) {
    let n = new Notification();
    n.title = `${name} 的生日 🎉`;
    n.body = `今天是 ${name} 的生日！祝生日快乐！🎂`;
    n.schedule();
    Keychain.set(key, "notified");
  }
};
const calculateAge = b => {
  const bd = new Date(b);
  let age = today.getFullYear() - bd.getFullYear();
  if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
  return age;
};
const daysUntilNextBirthday = b => {
  const d = new Date(b);
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
};

// 最近的生日
const closestBirthday = Birthdays.reduce((a, b) => 
  daysUntilNextBirthday(formatBirthday(a.Birthday)) < daysUntilNextBirthday(formatBirthday(b.Birthday)) ? a : b
);

// 控制台输出
function logBirthdaysToConsole() {
  console.log(`今天:${dates.cYear}年${dates.cMonth}月${dates.cDay}日,${dates.ncWeek}\n农历:${dates.gzYear}(${dates.Animal})年${dates.IMonthCn}${dates.IDayCn}`)
  console.log("====================");
  for (const { Name, Birthday } of Birthdays) {
    const bDate = formatBirthday(Birthday);
    const isToday = isTodayBirthday(bDate);
    console.log(`姓名: ${Name}`);
    console.log(`生日: ${bDate}`);
    console.log(`年龄: ${calculateAge(bDate)}岁`);
    console.log(`生肖: ${getZodiac(Birthday)}`);
    console.log(`距离下次生日: ${isToday ? "今天 🎂" : `${daysUntilNextBirthday(bDate)} 天后`}`);
    console.log("--------------------");
  }
}

// 创建小组件
function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#f5f5f5");
  widget.setPadding(10, 10, 10, 10);

  // 标题
  let title = widget.addText(
    `今天:${dates.cYear}年${dates.cMonth}月${dates.cDay}日,${dates.ncWeek}\n农历:${dates.gzYear}(${dates.Animal})年${dates.IMonthCn}${dates.IDayCn}`
  );
  title.font = Font.boldSystemFont(18);
  title.textColor = new Color("#333");
  widget.addSpacer(20);

  for (const person of Birthdays) {
    const { Name, Birthday } = person;
    const bDate = formatBirthday(Birthday);
    const isClosest = person === closestBirthday;
    const isToday = isTodayBirthday(bDate);

    let row = widget.addStack();
    row.layoutHorizontally();

    const addStyledText = (text, bold = false, color = "#666") => {
      let t = row.addText(text);
      t.font = bold ? Font.boldSystemFont(16) : Font.systemFont(16);
      t.textColor = new Color(color);
      return t;
    };

    addStyledText(Name, isClosest, "#333");
    row.addSpacer(12);
    addStyledText(bDate, isClosest, "#333");
    addStyledText(` (${getZodiac(Birthday)})`, isClosest, "#333");
    row.addSpacer();
    addStyledText(`${calculateAge(bDate)} 岁`, isClosest, "#333");
    row.addSpacer();
    addStyledText(isToday ? "🎂 今天!" : `${daysUntilNextBirthday(bDate)} 天后`, isClosest, isToday ? "#199" : "#333");

    if (isToday && isMorning()) {
      sendNotificationOnce(Name);
    }
    widget.addSpacer(20);
  }
  widget.addSpacer();
  return widget;
}

function createTable() {
  let table = new UITable();
  table.showSeparators = true;
  
  const title = new UITableRow();
  const titleCell = title.addText(`今天:${dates.cYear}年${dates.cMonth}月${dates.cDay}日,${dates.ncWeek}\n农历:${dates.gzYear}(${dates.Animal})年${dates.IMonthCn}${dates.IDayCn}`);
  title.height = 60;
  
  table.addRow(title);
  
  for (const { Name, Birthday } of Birthdays) {
    const formattedBirthday = formatBirthday(Birthday);
    const age = calculateAge(formattedBirthday);
    const zodiac = getZodiac(Birthday);
    const daysLeft = daysUntilNextBirthday(formattedBirthday);
    const isToday = isTodayBirthday(formattedBirthday);
    const isClosest = closestBirthday.Name === Name;

    const row = new UITableRow();
    row.height = 70;

    const font = isClosest ? Font.boldSystemFont(18) : Font.systemFont(18);

    const nameCell = row.addText(Name);
    nameCell.titleFont = font;
    nameCell.widthWeight = 5;

    const dateCell = row.addText(formattedBirthday);
    dateCell.titleFont = font;
    dateCell.widthWeight = 9;

    const ageCell = row.addText(`${age}`);
    ageCell.titleFont = font;
    ageCell.widthWeight = 4;

    const zodiacCell = row.addText(zodiac);
    zodiacCell.titleFont = font;
    zodiacCell.widthWeight = 4;

    const daysLeftCell = row.addText(isToday ? "🎂 今天!" : `${daysLeft} 天后`);
    daysLeftCell.titleFont = font;
    daysLeftCell.widthWeight = 6;

    table.addRow(row);
  }

  return table;
}

// 运行环境判断
if (config.runsInWidget) {
  const widget = createWidget();
  Script.setWidget(widget);
  Script.complete();
} else {
  const widget = await createWidget();
//   widget.presentLarge();
  const table = createTable();
  await table.present();
  logBirthdaysToConsole();
}
})();