// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: magic;
this.name = "Birthday";
this.widget_ID = "js-108";
this.version = "v2.2";

const Birthdays = [
  { Name: "星", Birthday: "20000412" },
  { Name: "兵", Birthday: "19990909" }
];

let installation;
let calendar;
await CheckKu();
await installation(this.widget_ID, this.version);

const today = new Date();
const dates = calendar.solar2lunar();

function formatBirthday(Birthday) {
  if (typeof Birthday !== "string" || Birthday.length < 8) {
    throw new Error("日期格式应为YYYYMMDD的8位字符串");
  }
  const year = Birthday.slice(0, 4);
  const month = Birthday.slice(4, 6);
  const day = Birthday.slice(6, 8);

  return `${year}-${month}-${day}`;
}

function getZodiac(solarDate) {
  try {
    const zodiac = calendar.solar2lunar(
      parseInt(solarDate.slice(0, 4)),
      parseInt(solarDate.slice(4, 6)),
      parseInt(solarDate.slice(6))
    ).Animal;
    return zodiac;
  } catch (error) {
    return "生肖获取失败";
  }
}

function getLunarDate(solarDate) {
  try {
    const lunarData = calendar.solar2lunar(
      parseInt(solarDate.slice(0, 4)),
      parseInt(solarDate.slice(4, 6)),
      parseInt(solarDate.slice(6))
    );

    const { IMonthCn: month = "未知月份", IDayCn: day = "未知日期" } =
    lunarData || {};

    return `${month}${day}`;
  } catch (error) {
    return "农历转换失败";
  }
}

function isTodayBirthday(birthday) {
  try {
    if (!birthday || typeof birthday !== "string") {
      console.error("生日参数无效");
      return false;
    }

    const today = new Date();
    const birthDate = new Date(birthday);

    if (isNaN(birthDate.getTime())) {
      console.error("生日日期格式无效");
      return false;
    }

    return (
      birthDate.getDate() === today.getDate() &&
      birthDate.getMonth() === today.getMonth()
    );
  } catch (error) {
    console.error("判断生日出错:", error);
    return false;
  }
}

const isMorning = () => today.getHours() >= 8 && today.getHours() < 24;

function getTodayKey(name) {
  const today = new Date();
  return `birthday-notify-${name}-${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;
}

const sendNotificationOnce = name => {
  const key = getTodayKey(name);
  if (!Keychain.contains(key)) {
    const person = Birthdays.find(b => b.Name === name);
    if (person) {
      const bDate = formatBirthday(person.Birthday);
      const age = calculateAge(bDate);

      let n = new Notification();
      n.title = `${name} 的${age}岁生日🎉！祝生日快乐！🎂`;
      n.body = `今天是 ${today.toLocaleDateString()} ${dates.ncWeek} 农历${
          dates.IMonthCn
        }${dates.IDayCn}`;
      n.schedule();
      Keychain.set(key, "notified");
    }
  }
};

function calculateAge(birthdate) {
  try {
    if (!birthdate) throw new Error("出生日期不能为空");

    const today = new Date();
    const birthDate = new Date(birthdate);

    if (isNaN(birthDate.getTime())) {
      throw new Error("无效的日期格式");
    }

    if (birthDate > today) {
      throw new Error("出生日期不能晚于当前日期");
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    console.error("年龄计算失败:", error.message);
    return null;
  }
}

function daysUntilNextBirthday(birthdate) {
  try {
    if (!birthdate) throw new Error("出生日期不能为空");

    const today = new Date();
    const birthDate = new Date(birthdate);

    if (isNaN(birthDate.getTime())) {
      throw new Error("无效的日期格式");
    }

    const currentYear = today.getFullYear();
    let nextBirthday = new Date(
      currentYear,
      birthDate.getMonth(),
      birthDate.getDate()
    );

    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }

    const timeDiff = nextBirthday - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return daysRemaining;
  } catch (error) {
    console.error("计算剩余天数失败:", error.message);
    return null;
  }
}

const closestBirthday = Birthdays.reduce((a, b) =>
  daysUntilNextBirthday(formatBirthday(a.Birthday)) <
  daysUntilNextBirthday(formatBirthday(b.Birthday)) ?
  a :
  b
);

console.log(
  `今天是 ${today.toLocaleDateString()} ${dates.ncWeek} 农历${
      dates.IMonthCn
    }${dates.IDayCn}`
);

function logBirthdaysToConsole() {
  console.log("====================");
  for (const { Name, Birthday } of Birthdays) {
    const bDate = formatBirthday(Birthday);
    const isToday = isTodayBirthday(bDate);
    console.log(`姓名: ${Name}`);
    console.log(`生日: ${bDate}`);
    console.log(`农历: ${getLunarDate(Birthday)}`);
    console.log(`年龄: ${calculateAge(bDate)}岁`);
    console.log(`生肖: ${getZodiac(Birthday)}`);
    console.log(
      `距离下次生日: ${
          isToday ? "今天 🎂" : `${daysUntilNextBirthday(bDate)} 天后`
        }`
    );
    console.log("--------------------");
  }
}

function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#f5f5f5");
  widget.setPadding(10, 10, 10, 10);

  let title = widget.addText(
    `今天:${dates.cYear}年${dates.cMonth}月${dates.cDay}日,${dates.ncWeek}\n农历:${dates.Animal}年${dates.IMonthCn}${dates.IDayCn}`
  );
  title.font = Font.boldSystemFont(18);
  title.textColor = new Color("#333");
  widget.addSpacer(5);

  for (const person of Birthdays) {
    const { Name, Birthday } = person;
    const bDate = formatBirthday(Birthday);
    const lDate = getLunarDate(Birthday);
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
    row.addSpacer();
    addStyledText(`${bDate}\n${lDate}`, isClosest, "#333");
    addStyledText(` (${getZodiac(Birthday)})`, isClosest, "#333");
    row.addSpacer();
    addStyledText(`${calculateAge(bDate)} 岁`, isClosest, "#333");
    row.addSpacer();
    addStyledText(
      isToday ? "🎂 今天!" : `${daysUntilNextBirthday(bDate)} 天后`,
      isClosest,
      isToday ? "#199" : "#333"
    );

    if (isToday && isMorning()) {
      sendNotificationOnce(Name);
    }
    widget.addSpacer(10);
  }
  widget.addSpacer();
  return widget;
}

function createTable() {
  let table = new UITable();
  table.showSeparators = true;

  let title = new UITableRow();
  title.height = 70;
  title.addText(
    `今天:${dates.cYear}年${dates.cMonth}月${dates.cDay}日,${dates.ncWeek}\n农历:${dates.Animal}年${dates.IMonthCn}${dates.IDayCn}`
  );
  table.addRow(title);

  const clearRow = new UITableRow();
  clearRow.height = 60;
  const clearButton = clearRow.addButton("清除所有通知记录");
  clearButton.titleColor = Color.red();
  clearButton.onTap = async() => {
    for (const { Name } of Birthdays) {
      const key = getTodayKey(Name);
      if (Keychain.contains(key)) {
        Keychain.remove(key);
      }
    }

    const alert = new Alert();
    alert.title = "操作成功";
    alert.message = "所有通知记录已清除";
    alert.addAction("确定");
    await alert.present();
  };
  table.addRow(clearRow);

  for (const { Name, Birthday } of Birthdays) {
    const formattedBirthday = formatBirthday(Birthday);
    const lunarDate = getLunarDate(Birthday);
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

    const dateCell = row.addText(formattedBirthday, lunarDate);
    dateCell.titleFont = font;
    dateCell.subtitleFont = font;
    dateCell.widthWeight = 9;

    const ageCell = row.addText(`${age}`);
    ageCell.titleFont = font;
    ageCell.widthWeight = 4;

    const zodiacCell = row.addText(zodiac);
    zodiacCell.titleFont = font;
    zodiacCell.widthWeight = 4;

    const daysLeftCell = row.addText(
      isToday ? "🎂 今天!" : `${daysLeft} 天后`
    );
    daysLeftCell.titleFont = font;
    daysLeftCell.widthWeight = 6;

    table.addRow(row);
  }

  return table;
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

    ({ installation, calendar } = importModule("Ku"));
    if (typeof installation !== "function") throw new Error("数据库模块无效");
  }

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