// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: mobile-alt;
this.name = "Simba";
this.widget_ID = "js-111";
this.version = "v1.0";

let installation, getUrls;
await CheckKu();
await installation(this.widget_ID, this.version);

// 输入手机号码
const phone = "";
const AUTH_KEY = "AuthorizationToken";
const GetUrl = "https://mag.tpgtelecom.com.sg/smag/api/v2/getPlan";

const BASE_URL = "https://mag.tpgtelecom.com.sg/smag/api";
const COMMON_HEADERS = {
  Host: "mag.tpgtelecom.com.sg",
  "Content-Type": "application/json",
  "User-Agent": "tpg_sg/5 CFNetwork/1568.200.51 Darwin/24.1.0",
  "session-id": "vwo43g018glpe7imjyd7",
  Accept: "application/json"
};

async function main() {
  let token = Keychain.contains(AUTH_KEY) ? Keychain.get(AUTH_KEY) : null;
  let response = await get(GetUrl, token);

  if (
    response.success === false &&
    response.message === "Token has expired" &&
    !config.runsInWidget
  ) {
    console.log("Token 过期，获取新的 Authorization...");
    token = await getNewAuthorization();
    if (token) {
      Keychain.set(AUTH_KEY, token);
      console.log("新 Token 已存储，重新请求 API...");
      response = await get(GetUrl, token);
    } else {
      console.log("未获取到有效的 Token，终止执行。");
      return null;
    }
  }

  return response;
}

async function get(url, token) {
  const request = new Request(url);
  request.headers = { Authorization: token };
  return await request.loadJSON();
}

async function getNewAuthorization() {
  const otpSent = await sendOtp(phone);
  if (!otpSent) {
    console.log("OTP 发送失败");
    return null;
  }

  const otp = await getOtpFromUser();
  if (!otp) {
    console.log("未输入验证码");
    return null;
  }

  const token = await loginWithOtp(phone, otp);
  return token;
}

async function sendOtp(phoneNumber) {
  const req = new Request(`${BASE_URL}/sendOtp`);
  req.method = "POST";
  req.headers = COMMON_HEADERS;
  req.body = JSON.stringify({ phoneNumber });

  try {
    await req.loadJSON();
    console.log("OTP 发送成功");
    return true;
  } catch (e) {
    console.log("OTP 发送失败: " + e);
    return false;
  }
}

async function getOtpFromUser() {
  const alert = new Alert();
  alert.title = "输入验证码";
  alert.message = "请输入短信验证码";
  alert.addTextField("验证码", "");
  alert.addAction("确认");
  alert.addCancelAction("取消");

  const index = await alert.present();
  return index === 0 ? alert.textFieldValue(0) : null;
}

async function loginWithOtp(username, otp) {
  const req = new Request(`${BASE_URL}/authenticate`);
  req.method = "POST";
  req.headers = COMMON_HEADERS;
  req.body = JSON.stringify({ username, password: otp });

  try {
    const res = await req.loadJSON();
    const headers = req.response?.headers || {};
    const token = headers["Authorization"] || headers["authorization"];

    if (token) {
      console.log("登录成功，Token: " + token);
      return token;
    } else {
      console.log("未获取到 Token");
      return null;
    }
  } catch (e) {
    console.log("登录失败: " + e);
    return null;
  }
}

async function fetchData() {
  let response = await main();
  return response;
}

let Dashboard = await fetchData();

const width = 330;
const h = 24;
const w = new ListWidget();
w.backgroundColor = new Color("#222222");

console.log(JSON.stringify(Dashboard, null, 2));

console.log(
  "当前保存的 Authorization:" + Keychain.contains("AuthorizationToken")
    ? Keychain.get("AuthorizationToken")
    : "未找到"
);

if (Dashboard?.success !== undefined && Dashboard.success) {
  const Plan = Dashboard.plan;
  const Phone_Number = `手机号码: ${Dashboard.message.match(/\d+/g)}`;

  const Plan_Name = `套餐名称: ${Plan.planName}`; /*➠➠$${Plan.renewalCostInCent / 100}*/
  const Account_Balance = `剩余余额: $${Plan.creditBalanceInCent / 100}`;

  const resetDateUTC = new Date(Plan.resetDate);
  const resetDateSGT = new Date(resetDateUTC.getTime() + 8 * 60 * 60 * 1000);

  const formattedDate = resetDateSGT.toISOString().replace("Z", "+0800");

  const Reset_Date = Plan.resetDate
    ? (() => {
        const diff = new Date(formattedDate) - new Date();

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

        return `重置时间: ${formattedDate
          .substring(0, 10)
          .replace("Z", " ")} \n剩余时间: ${
          days > 0
            ? `${days}天${hours > 0 ? ` ${hours}小时` : ""}`
            : `< ${Math.ceil(diff / (1000 * 60 * 60))}小时`
        }`;
      })()
    : "到期时间: 未知";

  gettextwidget(Phone_Number);
  gettextwidget(Plan_Name);
  gettextwidget(Account_Balance);
  gettextwidget(Reset_Date);
  w.addSpacer(8);

  const Local_dataremain = (Plan.dataSGMYRemain / 1024 / 1024).toFixed(2);
  const Local_dataallowance = (Plan.dataSGMYAllowance / 1024 / 1024).toFixed(2);
  const Local_dataused = (Local_dataallowance - Local_dataremain).toFixed(2);
  const Local_datausedpercentage = (
    (Local_dataused / Local_dataallowance) *
    100
  ).toFixed(2);

  getwidget(
    Local_dataallowance,
    Local_dataused,
    `SG+MY+HK 已用: ${Local_dataused}GB(${Local_datausedpercentage}%) | 剩余: ${Local_dataremain}GB`
  );

  const Roam_dataremain = (
    (Plan.dataRoamRemain + Plan.dataRoamBonusRemain) /
    1024 /
    1024
  ).toFixed(2);
  const Roam_dataallowance = (
    (Plan.dataRoamAllowance + Plan.dataRoamBonusAllowance) /
    1024 /
    1024
  ).toFixed(2);
  const Roam_dataused = (Roam_dataallowance - Roam_dataremain).toFixed(2);
  const Roam_datausedpercentage = (
    (Roam_dataused / Roam_dataallowance) *
    100
  ).toFixed(2);

  getwidget(
    Roam_dataallowance,
    Roam_dataused,
    `国际数据 已用: ${Roam_dataused}GB(${Roam_datausedpercentage}%) | 剩余: ${Roam_dataremain}GB`
  );

  const APAC_dataAllowance = (Plan.dataAPACAllowance / 1024 / 1024).toFixed(2);
  const APAC_dataRemain = (Plan.dataAPACRemain / 1024 / 1024).toFixed(2);
  const APAC_dataused = (APAC_dataAllowance - APAC_dataRemain).toFixed(2);
  const APAC_datausedpercentage = (
    (APAC_dataused / APAC_dataAllowance) *
    100
  ).toFixed(2);

  getwidget(
    APAC_dataAllowance,
    APAC_dataused,
    `APAC数据 已用: ${APAC_dataused}GB(${APAC_datausedpercentage}%) | 剩余: ${APAC_dataRemain}GB`
  );

  const Local_callremain = Plan.iddMinuteFixedRemain;
  const Local_callallowance = Plan.iddMinuteFixedAllowance;
  const Local_callused = Local_callallowance - Local_callremain;

  getwidget(
    Local_callallowance,
    Local_callused,
    `本地 + IDD通话 已用: ${Local_callused}分钟 | 剩余: ${Local_callremain}分钟`
  );

  const Local_textremain = Plan.textLocalRemain;
  const Local_textallowance = Plan.textLocalAllowance;
  const Local_textused = Local_textallowance - Local_textremain;

  getwidget(
    Local_textallowance,
    Local_textused,
    `本地短信 已用: ${Local_textused}条 | 剩余: ${Local_textremain}条`
  );

  const table = new UITable();
  const buttonRow1 = new UITableRow();
  const button1 = buttonRow1.addButton("更新 Authorization");
  button1.onTap = async () => {
    await getNewAuthorization();
  };
  button2 = buttonRow1.addButton("充值");
  button2.onTap = () => {
    Safari.open("https://topup.simba.sg");
  };
  table.addRow(buttonRow1);

  const titleRow = new UITableRow();
  titleRow.addText(Phone_Number);
  titleRow.isHeader = true;
  table.showSeparators = true;
  table.addRow(titleRow);

  addRow(table, `${Plan_Name}\n${Account_Balance}\n${Reset_Date}`);

  addRowWithProgress(
    table,
    "SG+MY+HK 数据📶",
    Local_dataallowance,
    Local_dataused,
    `总共流量: ${Local_dataallowance} GB\n已用流量: ${Local_dataused} GB(${Local_datausedpercentage}%)\n剩余流量: ${Local_dataremain} GB`
  );

  addRowWithProgress(
    table,
    "国际数据📶",
    Roam_dataallowance,
    Roam_dataused,
    `总共流量: ${Roam_dataallowance} GB\n已用流量: ${Roam_dataused} GB(${Roam_datausedpercentage}%)\n剩余流量: ${Roam_dataremain} GB(${
      100 - Roam_datausedpercentage
    }%)`
  );

  addRowWithProgress(
    table,
    "APAC数据📶",
    APAC_dataAllowance,
    APAC_dataused,
    `总共流量: ${APAC_dataAllowance} GB\n已用流量: ${APAC_dataused} GB(${APAC_datausedpercentage}%)\n剩余流量: ${APAC_dataRemain} GB(${
      100 - APAC_datausedpercentage
    }%)`
  );

  addRowWithProgress(
    table,
    "本地 + IDD通话📞",
    Local_callallowance,
    Local_callused,
    `总共通话: ${Local_callallowance}分钟\n已用通话: ${Local_callused}分钟\n剩余通话: ${Local_callremain}分钟`
  );

  addRowWithProgress(
    table,
    "本地短信✉️",
    Local_textallowance,
    Local_textused,
    `总共短信: ${Local_textallowance}条\n已用短信: ${Local_textused}条\n剩余短信: ${Local_textremain}条`
  );

  table.present(true);
} else {
  const notice = `请更新Authorization.`;
  gettextwidget(notice);

  const table = new UITable();

  const errorRow = new UITableRow();
  errorRow.addText("数据获取失败，请更新 Authorization");
  table.addRow(errorRow);

  const buttonRow = new UITableRow();
  const button = buttonRow.addButton("更新 Authorization");
  button.onTap = async () => {
    await getNewAuthorization();
  };
  table.addRow(buttonRow);
  table.present();
}

Script.setWidget(w);
Script.complete();
// w.presentLarge();

function addRowWithProgress(table, title, total, used, details) {
  const row = new UITableRow();
  row.height = 140;

  const progress = total > 0 ? used / total : 0;

  const combinedImage = drawTitleProgressAndDetails(title, progress, details);

  const combinedCell = UITableCell.image(combinedImage);
  combinedCell.leftAligned();
  row.addCell(combinedCell);

  table.addRow(row);
}

function drawTitleProgressAndDetails(title, progress, details) {
  const context = new DrawContext();
  context.size = new Size(300, 100);
  context.opaque = false;
  context.respectScreenScale = true;

  context.setFont(Font.boldSystemFont(15));
  context.setTextColor(new Color("#e587ce"));
  context.drawTextInRect(title, new Rect(0, 0, 300, 20));

  context.setFillColor(new Color("#e0e0e0"));
  context.fillRect(new Rect(0, 22, 300, 10));

  context.setFillColor(new Color("#007aff"));
  context.fillRect(new Rect(0, 22, 300 * progress, 10));

  const detailsLines = details.split("\n");
  const lineSpacing = 20;
  const startY = 35;
  context.setFont(Font.systemFont(18));
  context.setTextColor(new Color("#e587ce"));

  detailsLines.forEach((line, index) => {
    const yPosition = startY + index * lineSpacing;
    context.drawTextInRect(line, new Rect(0, yPosition, 300, 40));
  });

  return context.getImage();
}

function gettextwidget(txt) {
  const text = w.addText(txt);
  text.textColor = new Color("#e587ce");
  text.font = Font.boldSystemFont(13);
}

function getwidget(total, haveGone, str) {
  const titlew = w.addText(str);
  titlew.textColor = new Color("#e587ce");
  titlew.font = Font.boldSystemFont(12);
  w.addSpacer(4);
  const imgw = w.addImage(creatProgress(total, haveGone));
  imgw.imageSize = new Size(width, h);
  w.addSpacer();
}

function creatProgress(total, havegone) {
  const context = new DrawContext();
  context.size = new Size(width, h);
  context.opaque = false;
  context.respectScreenScale = true;
  context.setFillColor(new Color("#48484b"));
  const path = new Path();
  path.addRoundedRect(new Rect(0, 0, width, h), 3, 2);
  context.addPath(path);
  context.fillPath();
  context.setFillColor(new Color("#ffd60a"));
  const path1 = new Path();
  path1.addRoundedRect(new Rect(0, 0, (width * havegone) / total, h), 3, 2);
  context.addPath(path1);
  context.fillPath();
  return context.getImage();
}

function addRow(table, title, value) {
  const row = new UITableRow();
  row.addText(title, value);
  table.addRow(row);
  row.height = 110;
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

  ({ installation, getUrls } = importModule("Ku"));
  if (typeof installation !== "function") throw new Error("数据库模块无效");
}
