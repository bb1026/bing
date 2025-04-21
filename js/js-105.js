// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: theater-masks;
this.name = "Master List";
this.widget_ID = "js-105";
this.version = "v1.4";

let installation;
await CheckKu();
await installation(this.widget_ID, this.version);

let scriptListURL = "https://bb1026.github.io/bing/js/Master.json";
let scriptList = await new Request(scriptListURL).loadJSON();
// console.log(JSON.stringify(scriptList, null, 1))

let sortedScripts = Object.values(scriptList).sort(
  (a, b) => parseInt(a.ID.slice(3)) - parseInt(b.ID.slice(3)));

let table = new UITable();
table.showSeparators = true;

let clearKu = new UITableRow();
clearKu.isHeader = true;
let clearText = clearKu.addText("清除数据库");
clearText.titleColor = Color.red();
clearText.centerAligned();

clearKu.onSelect = function () {
  const fm = FileManager.local();
  const KuName = "Ku.js";
  const scriptPath = fm.joinPath(fm.documentsDirectory(), KuName);

  if (fm.fileExists(scriptPath)) {
    fm.remove(scriptPath);
    console.log("数据库已清除");
    let alert = new Alert();
    alert.title = "操作完成";
    alert.message = "数据库已清除";
    alert.addAction("确定");
    alert.present();
  } else {
    console.log("数据库不存在");
  }
};
table.addRow(clearKu);

let headerRow = new UITableRow();
headerRow.isHeader = true;
headerRow.height = 50;
const HID = headerRow.addText("ID");
const HNAME = headerRow.addText("名称");
const HUPDATE = headerRow.addText("组件支持", "大          中          小");

HID.widthWeight = 15;
HID.centerAligned();
HNAME.widthWeight = 35;
HNAME.centerAligned();
HUPDATE.widthWeight = 40;
HUPDATE.centerAligned();
table.addRow(headerRow);

for (let script of sortedScripts) {
  let row = new UITableRow();
  row.height = 65;
  const TID = row.addText(script.argsID.toString());
  const TNAME = row.addText(`${script.name}`);
  const small = script.small ? "✅" : "❌";
  const medium = script.medium ? "✅" : "❌";
  const large = script.large ? "✅" : "❌";
  const TUPDATE = row.addText(`${small}      ${medium}      ${large}`);

  TID.widthWeight = 15;
  TID.centerAligned();
  TNAME.widthWeight = 35;
  // TNAME.centerAligned();
  TUPDATE.widthWeight = 40;
  TUPDATE.centerAligned();

  row.onSelect = async () => {
    await installation(script.ID);
  };
  table.addRow(row);
}

const widget = new ListWidget();

if (args.widgetParameter) {
  const paramValue = args.widgetParameter.split(";")[0];
  try {
    const paramData = scriptList[`js-${paramValue}`];
let widgetSize = config.widgetFamily; 

if (!paramData[widgetSize]) {
  widget.addText(`当前小组件尺寸为 ${widgetSize}，不支持这个尺寸。`);
  Script.setWidget(widget);
}
    const url = paramData.url;
    (async () => {
      const code = await new Request(url).loadString();
      return await new Function(
        "args",
        "code",
        `
    return (async () => {
      const module = { exports: {} };
      with ({ module, console, args }) {
        ${code}
      }
      return typeof module.exports === 'function'
        ? await module.exports()
        : module.exports;
    })();
  `
      )(args ?? {}, code);
    })();
  } catch (error) {
    widget.addText("请检查Parameter").textColor = Color.red();
    Script.setWidget(widget);
  }
} else {
  widget.addText("长按小组件\n输入Parameter").textColor;
  Script.setWidget(widget);
  if (typeof table !== "undefined") {
//     await table.present(true);
  }
}

async function CheckKu() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "Ku.js");
  const url = "https://bb1026.github.io/bing/js/Ku.js";
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
