// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: theater-masks;
(async () => {
this.name = "Master List";
this.widget_ID = "js-105";
this.version = "v1.2";

// 检查更新
await CheckKu();
const { installation } = importModule("Ku");
await installation(this.widget_ID, this.version);

/* 
以上为获取更新代码
以下开始运行代码
*/

let scriptListURL = "https://bb1026.github.io/bing/js/Master.json";
let scriptList = await new Request(scriptListURL).loadJSON();

let sortedScripts = Object.values(scriptList).sort(
  (a, b) => parseInt(a.ID.slice(3)) - parseInt(b.ID.slice(3))
);

let table = new UITable();
table.showSeparators = true;

let clearKu = new UITableRow();
clearKu.isHeader = true;
let clearText = clearKu.addText("清除依赖库");
clearText.titleColor = Color.red();
clearText.centerAligned();
    
clearKu.onSelect = function() {
    const fm = FileManager.local();
    const KuName = "Ku.js";
    const scriptPath = fm.joinPath(fm.documentsDirectory(), KuName);
    
    if (fm.fileExists(scriptPath)) {
        fm.remove(scriptPath);
        console.log("Ku.js 已被清除");
        let alert = new Alert();
        alert.title = "操作完成";
        alert.message = "依赖库已清除";
        alert.addAction("确定");
        alert.present();
    } else {
        console.log("Ku.js 不存在");
    }
};
table.addRow(clearKu);

let headerRow = new UITableRow();
headerRow.isHeader = true;
const HID = headerRow.addText("ID");
const HNAME = headerRow.addText("名称");
const HUPDATE = headerRow.addText("更新信息");

HID.widthWeight = 15;
HNAME.widthWeight = 35;
HUPDATE.widthWeight = 40;
table.addRow(headerRow);

for (let script of sortedScripts) {
  let row = new UITableRow();
  row.height = 90;
  const TID = row.addText(script.ID.toString());
  const TNAME = row.addText(`${script.name} ${script.version}`);
  const TUPDATE = row.addText(script.update);

  TID.widthWeight = 15;
  TNAME.widthWeight = 35;
  TUPDATE.widthWeight = 40;

  row.onSelect = async () => {
    await installation(script.ID);
  };
  table.addRow(row);
}

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

QuickLook.present(table);
})();