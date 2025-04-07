// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: magic;
this.name = "Birthday";
this.widget_ID = "js-108";
this.version = "v2.0";

// 生日数据
const Birthdays = [{ Name: "兵", Birthday: "19990909" }];

// 检查更新
await CheckKu();
const { installation, calendar } = importModule("Ku");
await installation(this.widget_ID, this.version);
/* 
以上为获取更新代码
以下开始运行代码
*/

const today = new Date().toLocaleDateString();

// 工具函数：根据出生年份计算生肖
function getZodiac(year) {
  const zodiacs = [
    "猴🐵",
    "鸡🐔",
    "狗🐶",
    "猪🐷",
    "鼠🐭",
    "牛🐮",
    "虎🐯",
    "兔🐰",
    "龙🐉",
    "蛇🐍",
    "马🐴",
    "羊🐏"
  ];
  return zodiacs[year % 12];
}

// 工具函数：计算距离下次生日的天数
function daysUntilNextBirthday(birthday) {
  const today = new Date();
  const birthDate = new Date(birthday);
  const nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (today > nextBirthday) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = nextBirthday - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 工具函数：格式化生日日期
function formatBirthday(birthday) {
  return `${birthday.slice(0, 4)}-${birthday.slice(4, 6)}-${birthday.slice(6)}`;
}

// 工具函数：计算年龄
function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

// 工具函数：判断是否是生日当天
function isTodayBirthday(birthday) {
  const today = new Date();
  const birthDate = new Date(birthday);
  return (
    today.getMonth() === birthDate.getMonth() &&
    today.getDate() === birthDate.getDate()
  );
}

// 工具函数：判断是否是上午
function isMorning() {
  const now = new Date();
  return now.getHours() < 12;
}

// 工具函数：发送通知（限制为当天上午一次）
function sendNotificationOnce(name) {
  const todayKey = getTodayKey(name);
  if (!Keychain.contains(todayKey)) {
    let notification = new Notification();
    notification.title = `${name} 的生日 🎉`;
    notification.body = `今天是 ${name} 的生日！祝生日快乐！🎂`;
    notification.schedule();

    // 记录已通知状态
    Keychain.set(todayKey, "notified");
  }
}

// 工具函数：生成当日键值
function getTodayKey(name) {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}`;
  return `birthday-notify-${name}-${dateKey}`;
}

// 控制台输出函数
function logBirthdaysToConsole() {
  console.log(`🎉 生日提醒  ${today}`);
  console.log("====================");
  for (const person of Birthdays) {
    const { Name, Birthday } = person;
    const formattedBirthday = formatBirthday(Birthday);
    const daysLeft = daysUntilNextBirthday(formattedBirthday);
    const zodiac = getZodiac(new Date(formattedBirthday).getFullYear());
    const age = calculateAge(formattedBirthday);
    const isToday = isTodayBirthday(formattedBirthday);
    console.log(`姓名: ${Name}`);
    console.log(`生日: ${formattedBirthday}`);
    console.log(`年龄: ${age}岁`);
    console.log(`生肖: ${zodiac}`);
    console.log(`距离下次生日: ${isToday ? "今天 🎂" : `${daysLeft} 天后`}`);
    console.log("--------------------");
  }
}

const dates = calendar.solar2lunar();

// 创建小组件
function createWidget() {
  let widget = new ListWidget();
  widget.backgroundColor = new Color("#f5f5f5");
  widget.setPadding(10, 10, 10, 10);

  // 添加标题
  let title = widget.addText(
    `今天:${dates.cYear}年${dates.cMonth}月${dates.cDay}日,${dates.ncWeek}\n农历:${dates.Animal}年${dates.IMonthCn}${dates.IDayCn}`
  );
  title.font = Font.boldSystemFont(18);
  title.textColor = new Color("#333");
  widget.addSpacer(20);

  // 遍历生日数据并添加到小组件
  for (const person of Birthdays) {
    const { Name, Birthday } = person;
    const formattedBirthday = formatBirthday(Birthday);
    const daysLeft = daysUntilNextBirthday(formattedBirthday);
    const zodiac = getZodiac(new Date(formattedBirthday).getFullYear());
    const age = calculateAge(formattedBirthday);

    // 检查是否生日当天
    const isToday = isTodayBirthday(formattedBirthday);

    // 显示生日信息
    let row = widget.addStack();
    row.layoutHorizontally();

    let nameText = row.addText(`${Name}`);
    nameText.font =
      person === closestBirthday
        ? Font.boldSystemFont(16)
        : Font.systemFont(16); // 最近生日加粗
    nameText.textColor =
      person === closestBirthday ? new Color("#333") : new Color("#666");

    row.addSpacer(20);

    let birthDateText = row.addText(`${formattedBirthday}`);
    birthDateText.font =
      person === closestBirthday
        ? Font.boldSystemFont(16)
        : Font.systemFont(16); // 最近日期加粗
    birthDateText.textColor =
      person === closestBirthday ? new Color("#333") : new Color("#666");

    let zodiacText = row.addText(` (${zodiac})`);
    zodiacText.font =
      person === closestBirthday
        ? Font.boldSystemFont(16)
        : Font.systemFont(16); // 最近生肖加粗
    zodiacText.textColor =
      person === closestBirthday ? new Color("#333") : new Color("#666");

    row.addSpacer();

    let ageText = row.addText(`${age} 岁`);
    ageText.font =
      person === closestBirthday
        ? Font.boldSystemFont(16)
        : Font.systemFont(16); // 最近年龄加粗
    ageText.textColor =
      person === closestBirthday ? new Color("#333") : new Color("#666");

    row.addSpacer();

    let birthdayText = row.addText(isToday ? `🎂 今天!` : `${daysLeft} 天后`);
    birthdayText.font =
      person === closestBirthday
        ? Font.boldSystemFont(16)
        : Font.systemFont(16); // 最近天数加粗

    birthdayText.textColor = isToday ? new Color("#199") : new Color("#333");

    widget.addSpacer();

    // 如果是生日当天并且是上午，发送通知
    if (isToday && isMorning()) {
      sendNotificationOnce(Name);
    }
  }

  return widget;
}
// 找到距离最近的生日
let closestBirthday = Birthdays.reduce((prev, curr) => {
  let prevDays = daysUntilNextBirthday(formatBirthday(prev.Birthday));
  let currDays = daysUntilNextBirthday(formatBirthday(curr.Birthday));
  return currDays < prevDays ? curr : prev;
});

// 创建表格视图
function createTable() {
  let table = new UITable();
  table.showSeparators = true;

  // 遍历生日数据并添加到表格
  for (const person of Birthdays) {
    const { Name, Birthday } = person;
    const formattedBirthday = formatBirthday(Birthday);
    const daysLeft = daysUntilNextBirthday(formattedBirthday);
    const zodiac = getZodiac(new Date(formattedBirthday).getFullYear());
    const age = calculateAge(formattedBirthday);

    let row = new UITableRow();
    row.height = 70;

    // 添加文本单元格
    let nameCell = row.addText(Name);
    nameCell.widthWeight = 5;

    let dateCell = row.addText(formattedBirthday);
    dateCell.widthWeight = 8;

    let ageCell = row.addText(`${age}`);
    ageCell.widthWeight = 4;

    let zodiacCell = row.addText(zodiac);
    zodiacCell.widthWeight = 4;

    let daysLeftCell = row.addText(
      isTodayBirthday(formattedBirthday) ? "🎂 今天!" : `${daysLeft} 天后`
    );
    daysLeftCell.widthWeight = 6;

    // 如果是最近的生日，加粗字体
    let closeFont = Font.boldSystemFont(18);
    if (person === closestBirthday) {
      nameCell.titleFont = closeFont;
      dateCell.titleFont = closeFont;
      ageCell.titleFont = closeFont;
      zodiacCell.titleFont = closeFont;
      daysLeftCell.titleFont = closeFont;
    }
    table.addRow(row);
  }
  return table;
}

// 生成表格
let table = createTable();

async function CheckKu() {
  const notification = new Notification();
  const fm = FileManager.iCloud();
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

// 根据运行环境显示内容
if (config.runsInWidget) {
  // 显示小组件
  const widget = createWidget();
  Script.setWidget(widget);
  Script.complete();
} else {
  // 显示表格并输出到控制台
  const widget = await createWidget();
  widget.presentLarge();
  const table = createTable();
  //   table.present();
  logBirthdaysToConsole();
}
