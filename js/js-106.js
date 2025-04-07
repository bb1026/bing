// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: music;
this.name = "音乐下载";
this.widget_ID = "js-106";
this.version = "v1.5";

// 检查更新
await CheckKu();
const { installation } = importModule('Ku');
await installation(this.widget_ID, this.version);

/* 
以上为获取更新代码
以下开始运行代码
*/

const url = "https://www.fangpi.net/s/";

// 弹出输入框让用户输入歌曲名称或者歌手
const inputAlert = new Alert();
inputAlert.title = "歌曲查找";
inputAlert.message = "请输入要查找的歌曲或者歌手";
inputAlert.addTextField("歌曲或者歌手", "");
inputAlert.addAction("确定");
inputAlert.addCancelAction("取消");
const inputResult = await inputAlert.present();

// 如果用户点击了确定，则获取输入的歌曲或者歌手
let musicName;
if (inputResult === 0) {
  musicName = inputAlert.textFieldValue(0).trim();
} else {
  console.log("用户取消了输入。");
  return;
}

// 创建请求
const req = new Request(url + encodeURIComponent(musicName));
const htmlText = await req.loadString();

// 正则表达式匹配歌曲信息
const songRegex = /<div class="col-8 col-content">.*?<a href="\/music\/([^"]+)"[^>]*>.*?<span[^>]*class="text-primary[^>]*>.*?<span>(.*?)<\/span>.*?<\/span>.*?<small[^>]*>(.*?)<\/small>/gs;
const matches = [...htmlText.matchAll(songRegex)];

// 创建数据数组
const musicData = matches.map(match => ({
  href: match[1].trim(),
  song_title: match[2].trim(),
  singer: match[3].replace(/amp;/g, '').trim()
}));

// 创建 UITable
let table = new UITable();
table.showSeparators = true;

// 添加标题行
let headerRow = new UITableRow();
headerRow.isHeader = true;
headerRow.addCell(UITableCell.text("歌曲标题"));
headerRow.addCell(UITableCell.text("歌手"));
table.addRow(headerRow);

// 添加数据行
for (let item of musicData) {
  let dataRow = new UITableRow();
  dataRow.addCell(UITableCell.text(item.song_title));
  dataRow.addCell(UITableCell.text(item.singer));
  
  dataRow.onSelect = async () => {
    if (item.href) {
      const MP3URL = `https://www.fangpi.net/music/${item.href}`;
      console.log(`曲名:${item.song_title}, 歌手:${item.singer}, 链接:${MP3URL}`);
        Safari.open(`quark://${MP3URL}`);
    }
  };
  
  table.addRow(dataRow);
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

// 显示表格
await table.present();
