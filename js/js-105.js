// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: theater-masks;
(async () => {
  this.name = "Master List";
  this.widget_ID = "js-105";
  this.version = "v1.3";

  await CheckKu();
  const { installation } = importModule("Ku");
  await installation(this.widget_ID, this.version);

  let scriptListURL = "https://bb1026.github.io/bing/js/Master.json";
  let scriptList = await new Request(scriptListURL).loadJSON();
  // console.log(JSON.stringify(scriptList, null, 1))

  let sortedScripts = Object.values(scriptList).sort(
    (a, b) => parseInt(a.ID.slice(3)) - parseInt(b.ID.slice(3))
  );

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
    TNAME.centerAligned();
    TUPDATE.widthWeight = 40;
    TUPDATE.centerAligned();

    row.onSelect = async () => {
      await installation(script.ID);
    };
    table.addRow(row);
  }

if (args.widgetParameter) {
    const id = args.widgetParameter;
    const scriptURL = `https://bb1026.github.io/bing/js/js-${id}.js`;
    const script = await new Request(scriptURL).loadString();
    eval(script);
} else {
    const widget = new ListWidget();
    widget.backgroundColor = new Color("#1C1C1E");
    const title = widget.addText("长按小组件\n输入Parameter");
    title.textColor = Color.white();
    // 保留原有的表格显示逻辑
    if (typeof table !== 'undefined') {
        await table.present(true);
    }
    Script.setWidget(widget);
//   widget.presentSmall()
}

  async function CheckKu() {
    const notification = new Notification();
    const fm = FileManager.local();
    const KuName = "Ku.js";
    const scriptPath = fm.joinPath(fm.documentsDirectory(), KuName);
    const scriptExists = fm.fileExists(scriptPath);

    if (!scriptExists) {
      try {
        const downloadReq = new Request(
          "https://bb1026.github.io/bing/js/Ku.js"
        );
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
