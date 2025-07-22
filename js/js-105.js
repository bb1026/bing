// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: theater-masks;
const currentModule = {
  name: "Master",
  widget_ID: "js-105",
  version: "v1.9"
};

const Local_remote_mode = 0; //0远程;1本地

const Ku = await importRemoteModule("http://bing.0515364.xyz/js/Ku.js");
const iCloudFm = FileManager.iCloud();
const webView = new WebView();
const widget = new ListWidget();
const getUrls = await Ku.getUrls();
let html;

await Ku.installation(currentModule.widget_ID, currentModule.version);

if (args.widgetParameter) {
    const paramValue = args.widgetParameter.split(";")[0];
    try {
    const scriptList = await getRequest(getUrls.MASTER_JSON_URL).loadJSON();
    const paramData = scriptList[`js-${paramValue}`];
    let widgetSize = config.widgetFamily || 'large';

    if (!paramData[widgetSize]) {
      widget.addText(`不支持 ${widgetSize} 尺寸，请更换其它尺寸。`);
      Script.setWidget(widget);
    }
    (async () => {
      const code = await getRequest(getUrls.BASE_URL + paramData.url).loadString();
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
    widget.addText("请检查Parameter" + paramValue).textColor = Color.red();
    Script.setWidget(widget);
  }
} else {
  widget.addText("长按小组件\n输入Parameter").textColor;
  Script.setWidget(widget);
};

if (!config.runsInWidget) {
async function loadHTML() {
  if (Local_remote_mode) {
    const Local_html = importModule("HTML");// 本地
    html = Local_html.html
  } else {
    html = await importRemoteModule(getUrls.HTML_URL);
  }
const request = await getRequest(getUrls.MASTER_JSON_URL).loadJSON();
const finalHTML = html.replace("%TOOLS%", JSON.stringify(request));

await webView.loadHTML(finalHTML);
webView.present(true);
}

const clipboardContent = Pasteboard.paste();
if (clipboardContent && clipboardContent.includes('"install-tool"')) {
  try {
    // 验证是否是合法 JSON
    JSON.parse(clipboardContent);
    // 注入到 webView
    await webView.evaluateJavaScript(`
      window._result = '${clipboardContent}';
    `, false);
  } catch (e) {
    console.log("剪切板内容不是有效的 JSON，回退到正常加载");
    await loadHTML();
  }
} else {
  // 正常加载页面
  await loadHTML();
}

// evaluateJavaScript检测
const timer = new Timer();
timer.repeats = true;
timer.timeInterval = 200;
timer.schedule(async () => {
  const res = await webView.evaluateJavaScript("window._result", false);
  if (res) {
    await webView.evaluateJavaScript("window._result=null", false);
    const m = JSON.parse(res);
    if (m.type === "install-tool") {
      const tool = m.Data;
      console.log(tool);
      try {
        const scriptContent = await getRequest(getUrls.BASE_URL + tool.url).loadString();
        iCloudFm.writeString(
          iCloudFm.joinPath(iCloudFm.documentsDirectory(), `${tool.name}.js`),
          scriptContent
        );
        const successAlert = new Notification();
        successAlert.title = `✔️ 安装成功`;
        successAlert.body = `点击运行 ${tool.name}\n版本 ${tool.version}`;
        successAlert.openURL = `scriptable:///run?scriptName=${encodeURIComponent(
          tool.name
        )}`;
        await successAlert.schedule();
        Script.complete();
      } catch (error) {
        console.log("安装失败:" + error);
        const failAlert = new Notification();
        failAlert.title = "❌ 安装失败";
        failAlert.body = error.localizedDescription || "未知错误";
        await failAlert.schedule();
      }
    } else if (m.type === "home-link") {
      Safari.open(getUrls.Home_URL);
    } else if (m.type === "clear-library") {
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
    } else if (m.type === "add-library") {
      Pasteboard.copy(m.Data)
      Safari.open('scriptable:///add')
    }
  }
});
}

// 远程模块导入
async function importRemoteModule(url) {
const jsCode = await getRequest(url).loadString();
  const sandbox = { module: { exports: null }, exports: null };
  new Function("module", "exports", jsCode)(sandbox.module, sandbox.exports);
  if (!sandbox.module.exports) {
    throw new Error("远程模块未正确导出内容");
  }
  return sandbox.module.exports;
}

function getRequest(url) {
  const req = new Request(url);
  req.headers = { "X-Auth-Key": "scriptable-key" };
  return req;
}