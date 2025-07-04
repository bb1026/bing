// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: theater-masks;
this.name = "Master List";
this.widget_ID = "js-105";
this.version = "v1.7";

let installation, getUrls;
await CheckKu();
await installation(this.widget_ID, this.version);

const widget = new ListWidget();

if (args.widgetParameter) {
  const paramValue = args.widgetParameter.split(";")[0];
  try {
    const scriptList = await getScriptList();
    const paramData = scriptList[`js-${paramValue}`];
    let widgetSize = config.widgetFamily;

    if (!paramData[widgetSize]) {
      widget.addText(`不支持 ${widgetSize} 尺寸，请更换其它尺寸。`);
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
  if (!config.runsInWidget) {
    main().catch(async error => {
      console.log("脚本运行出错: " + error);
      const notice = new Notification();
      notice.title = "错误";
      notice.body = "脚本运行出错: " + error;
      await notice.schedule();
    });
  }
}

async function main() {
  const scriptList = await getScriptList();

    const htmlScriptURL = new Request(getUrls().HTML_URL);
    htmlScriptURL.headers = {'X-Auth-Key': 'scriptable-key'};
    const htmlScriptCode = await htmlScriptURL.loadString();
    ({ generateScriptsHTML, createHTMLContent } = new Function(
      "return " + htmlScriptCode
    )());

  const scriptsHTML = await generateScriptsHTML(scriptList);
const htmlContent = await createHTMLContent(scriptsHTML, Object.values(scriptList));

  const webView = new WebView();
  await webView.loadHTML(htmlContent);
  await webView.present(true);

  while (true) {
    const result = await webView.evaluateJavaScript("window.clicked || null");
    if (result) {
      if (result === "clear") {
        await clearKu();
      } else {
        await CheckKu();
        await installation(result);
      }
      await new Promise(resolve => Timer.schedule(1, false, resolve));
      break;
    }
  }
}

// 异步清除 Ku.js 并通知
async function clearKu() {
  const fm = FileManager.local();
  const filePath = fm.joinPath(fm.documentsDirectory(), "Ku.js");

  const notice = new Notification();
  notice.title = "数据库操作";

  if (fm.fileExists(filePath)) {
    fm.remove(filePath);
    console.log("数据库已清除");
    notice.body = "数据库已清除";
  } else {
    console.log("数据库不存在");
    notice.body = "数据库不存在";
  }

  await notice.schedule();
}

async function getScriptList() {
  try {
    const scriptListURL = getUrls().MASTER_JSON_URL;
    const request = new Request(scriptListURL);
    request.headers = {'X-Auth-Key': 'scriptable-key'};
    return await request.loadJSON();
  } catch (error) {
    console.log("获取脚本列表失败: " + error);
    return {};
  }
}

async function CheckKu() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "Ku.js");
  const url = "https://bing.0515364.xyz/js/Ku.js";
  let needDownload = false;

  try {
    ({
      installation,
      getUrls
    } = importModule("Ku"));
    
    if (typeof installation !== "function") {
      console.log("数据库模块无效，准备重新下载");
      needDownload = true;
    }
  } catch {
    console.log("数据库导入失败，准备重新下载");
    needDownload = true;
  }

  if (needDownload) {
      const req = new Request(url);
       req.headers = {
            "X-Auth-Key": "scriptable-key"
            };
      try {
        fm.writeString(path, await req.loadString());
        if (fm.isFileStoredIniCloud(path)) await fm.downloadFileFromiCloud(path);
    console.log("数据库下载完成");
    
    ({
      installation,
      getUrls
    } = importModule("Ku"));
    if (typeof installation !== "function") throw new Error("数据库模块无效");
  } catch (error) {
    console.error("请求失败:" + error.message);
    }
  }
}
