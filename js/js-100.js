// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: hands-helping;
this.name = "安装小助手";
this.widget_ID = "js-100";
this.version = "v1.4";

// 检查更新
let installation, getUrls;
await CheckKu();
await installation(this.widget_ID, this.version);
/* 
以上为获取更新代码
以下开始运行代码
*/

let request = new Request(getUrls().MASTER_JSON_URL);
request.headers = {'X-Auth-Key': 'scriptable-key'};
let scriptList = await request.loadJSON();
if (scriptList[this.widget_ID]) {
  let scriptversion = scriptList[this.widget_ID].version;
  if (this.version !== scriptversion) {
    Pasteboard.copy(scriptList[this.widget_ID].url);
    Safari.open("scriptable:///run?scriptName=安装小助手");
    return;
  }
}

// 创建文件管理器
const fm = FileManager.iCloud();

// 从剪贴板中获取链接
let clipboardLink = await Pasteboard.pasteString();
let scriptID = null;

if (clipboardLink) {
  if (clipboardLink.includes("js-")) {
    let startIndex = clipboardLink.lastIndexOf("js-");
    let endIndex = clipboardLink.indexOf(".js", startIndex);
    if (endIndex === -1) endIndex = undefined; // 可能 URL 没有 .js
    scriptID = clipboardLink.substring(startIndex, endIndex);
    Pasteboard.copy("");
  } else {
    console.log("剪贴板中的链接不包含脚本 ID。");
  }
}

if (!scriptID) {
  // 用户输入
  const inputAlert = new Alert();
  inputAlert.title = "输入脚本ID";
  inputAlert.message = "请输入要查找的脚本 ID（格式: 100）：";
  inputAlert.addTextField("输入脚本ID", "");
  inputAlert.addAction("确定");
  inputAlert.addCancelAction("取消");

  const inputResult = await inputAlert.present();
  if (inputResult === 0) {
    let userInput = inputAlert.textFieldValue(0).trim();
    if (!userInput.startsWith("js-")) userInput = "js-" + userInput;
    scriptID = userInput;
  } else {
    console.log("用户取消了输入。");
    return;
  }
}

console.log(scriptID);

// 发起网络请求获取网页内容
const req = new Request(getUrls().MASTER_JSON_URL);
req.headers = {'X-Auth-Key': 'scriptable-key'};
const responseBody = await req.loadJSON();

// 获取用户输入的脚本信息
const scriptInfo = responseBody[scriptID];

if (scriptInfo) {
  const scriptName = scriptInfo.name;
  const scriptUpdate = scriptInfo.update;
  const scriptVersion = scriptInfo.version;

  // 检查是否已存在相同名称的脚本
  const existingScriptPath = fm.joinPath(
    fm.documentsDirectory(),
    `${scriptName}.js`
  );
  if (fm.fileExists(existingScriptPath)) {
    const alreadyInstalledAlert = new Alert();
    alreadyInstalledAlert.title = "警告";
    alreadyInstalledAlert.message = `<${scriptName}>已经存在，是否覆盖安装！`;
    alreadyInstalledAlert.addAction("取消安装");
    alreadyInstalledAlert.addAction("覆盖安装");
    const response = await alreadyInstalledAlert.present();
    if (response === 1) {
      // 用户选择覆盖安装，继续安装脚本
      console.log(`<${scriptName}>已经存在相同名称的脚本，覆盖安装中...`);
      // 下载脚本
      const req = new Request(getUrls().BASE_URL + responseBody[scriptID].url);

      console.log("[*] 开始下载脚本...");
      const scriptContent = await req.loadString();
      console.log("[+] 脚本下载完成...");

      // 将脚本保存到 Scriptable 的脚本目录中
      const scriptPath = fm.joinPath(
        fm.documentsDirectory(),
        `${scriptName}.js`
      );
      console.log("[#] 开始安装脚本...");
      fm.writeString(scriptPath, scriptContent);
      console.log("[-] 脚本安装完成...");

      // 显示成功消息
      const successAlert = new Alert();
      successAlert.title = "成功";
      successAlert.message = `<${scriptName}>脚本已成功覆盖安装！\n更新内容：${scriptUpdate}\n版本号：${scriptVersion}\n是否立即运行安装的脚本？`;
      successAlert.addAction("不了");
      successAlert.addAction("打开");
      const runScript = await successAlert.present();
      if (runScript === 1) {
        Safari.open(
          `scriptable:///run?scriptName=${encodeURIComponent(scriptName)}`
        );
      }
      console.log(
        `<${scriptName}>脚本已成功覆盖安装！\n更新内容：${scriptUpdate}\n版本号：${scriptVersion}`
      );
    } else {
      // 用户选择取消安装，退出脚本
      const cancelAlert = new Alert();
      cancelAlert.title = "取消安装";
      cancelAlert.message = `<${scriptName}>已经存在相同名称的脚本，用户取消安装。`;
      cancelAlert.addAction("确定");
      await cancelAlert.present();
      console.log(`<${scriptName}>已经存在相同名称的脚本，用户取消安装。`);
      return;
    }
  } else {
    // 下载脚本
    const req = new Request(responseBody[scriptID].url);
    console.log("[*] 开始下载脚本...");
    const scriptContent = await req.loadString();
    console.log("[+] 脚本下载完成...");

    // 将脚本保存到 Scriptable 的脚本目录中
    const scriptPath = fm.joinPath(fm.documentsDirectory(), `${scriptName}.js`);
    console.log("[#] 开始安装脚本...");
    fm.writeString(scriptPath, scriptContent);
    console.log("[-] 脚本安装完成...");

    // 显示成功消息
    const successAlert = new Alert();
    successAlert.title = "成功";
    successAlert.message = `<${scriptName}>脚本已成功下载和安装！\n更新内容：${scriptUpdate}\n版本号：${scriptVersion}\n是否立即运行安装的脚本？`;
    successAlert.addAction("不了");
    successAlert.addAction("打开");
    const runScript = await successAlert.present();
    if (runScript === 1) {
      Safari.open(
        `scriptable:///run?scriptName=${encodeURIComponent(scriptName)}`
      );
    }
    console.log(
      `<${scriptName}>脚本已成功下载和安装！\n更新内容：${scriptUpdate}\n版本号：${scriptVersion}`
    );
  }
} else {
  console.log(`未找到ID为'${scriptID}'的脚本信息。`);
}

async function CheckKu() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "Ku.js");
  const url = "https://bing.0515364.xyz/js/Ku.js";
  let needDownload = false;

  try {
    ({
      installation, getUrls
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

    ({ installation, getUrls } = importModule("Ku"));
    if (typeof installation !== "function") throw new Error("数据库模块无效");
  } catch (error) {
    console.error("请求失败:" + error.message);
    }
  }
}
