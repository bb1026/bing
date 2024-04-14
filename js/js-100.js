// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: hands-helping;
this.name = "安装小助手";
this.widget_ID = "js-100";
this.version = "v1.1";

// 检查更新
const scriptListURL = "https://bb1026.github.io/bing/js/Master.json";
let scriptList = await new Request(scriptListURL).loadJSON();
if (scriptList[this.widget_ID]){
let scriptversion = scriptList[this.widget_ID].version;
console.log(scriptversion); 
if (this.version !== scriptversion) {
Pasteboard.copy(scriptList[this.widget_ID].url);
  Safari.open("scriptable:///run?scriptName=安装小助手");
  }
};

/* 
以上为获取更新代码
以下开始运行代码
*/

// 创建文件管理器
const fm = FileManager.iCloud();

// 从剪贴板中获取链接
let clipboardLink = await Pasteboard.pasteString();

if (clipboardLink) {
  if (clipboardLink.includes("js-")) {
    // 从剪贴板中的 URL 提取脚本 ID
    let startIndex = clipboardLink.lastIndexOf("js-") + 3;
    let endIndex = clipboardLink.lastIndexOf(".js");
    var scriptID = clipboardLink.substring(startIndex, endIndex);
  } else {
    console.log("剪贴板中的链接不包含脚本 ID。");
  }
} else {
  // 弹出输入框让用户输入脚本 ID
  const inputAlert = new Alert();
  inputAlert.title = "输入脚本ID";
  inputAlert.message = "请输入要查找的脚本ID：";
  inputAlert.addTextField("脚本ID:js-", "");
  inputAlert.addAction("确定");
  inputAlert.addCancelAction("取消");
  const inputResult = await inputAlert.present();

  // 如果用户点击了确定，则获取输入的脚本 ID
  if (inputResult === 0) {
    scriptID = inputAlert.textFieldValue(0);
  } else {
    console.log("用户取消了输入。");
    return;
  }
}

const scriptURL = `https://bb1026.github.io/bing/js/js-${scriptID}.js`;

// 发起网络请求获取网页内容
const req = new Request(scriptListURL);
const responseBody = await req.loadJSON();

// 获取用户输入的脚本信息
const scriptInfo = responseBody[`js-${scriptID}`];

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
      const req = new Request(scriptURL);
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
        `<${scriptName}>脚本已成功覆盖安装！\n更新日期：${scriptUpdate}\n版本号：${scriptVersion}`
      );
    } else {
      // 用户选择取消安装，退出脚本
      const cancelAlert = new Alert();
      cancelAlert.title = "取消安装";
      cancelAlert.message = `<${scriptName}>已经存在相同名称的脚本，用户取消安装。`;
      cancelAlert.addAction("确定");
      await cancelAlert.present();
      console.log(
        `<${scriptName}>已经存在相同名称的脚本，用户取消安装。`
      );
      return;
    }
  } else {
    // 下载脚本
    const req = new Request(scriptURL);
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
  const successAlert = new Alert();
  successAlert.title = "失败";
  successAlert.message = `未找到ID为'${scriptID}'的脚本信息。`;
  successAlert.addAction("确定");
  await successAlert.present();
  console.log(`未找到ID为'${scriptID}'的脚本信息。`);
}
