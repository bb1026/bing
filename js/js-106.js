// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: music;
this.name = "音乐下载";
this.widget_ID = "js-106";
this.version = "v1.0";

// 检查更新
let scriptListURL = "https://bb1026.github.io/bing/js/Master.json";
let scriptList = await new Request(scriptListURL).loadJSON();
let scriptversion = scriptList[this.widget_ID].version;
console.log(scriptversion); 
if (this.version !== scriptversion) {
    Pasteboard.copy(scriptList[this.widget_ID].url);
    const fm = FileManager.iCloud();
    const scriptName = "安装小助手.js"; // 要检查的脚本文件名，包括.js后缀
    const scriptPath = fm.joinPath(fm.documentsDirectory(), scriptName);
    const scriptExists = fm.fileExists(scriptPath);
    if (scriptExists) {
        Safari.open("scriptable:///run?scriptName=安装小助手");
    } else {
        console.log(`${scriptName} 不存在`);
        const alert = new Alert();
        alert.message = "安装小助手脚本不存在，请手动安装。";
        alert.addAction("确定");
        await alert.present();
        Safari.open("https://bb1026.github.io/bing/js/1.html");
    }
    return;
};

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
  musicName = inputAlert.textFieldValue(0);
} else {
  console.log("用户取消了输入。");
  return;
}

const req = new Request(url + musicName);
const htmlText = await req.loadString();

// 正则表达式，匹配从 <div class="col-5 col-content"> 开始到 </div> 结束的部分
const col5Regex = /<div class="col-5 col-content">(.*?)<\/div>/gs;

// 匹配所有的 <div class="col-5 col-content"> 部分
const col5Matches = [...htmlText.matchAll(col5Regex)];

// 正则表达式，匹配从 <div class="text-success col-4 col-content"> 开始到 </div> 结束的部分
const col4Regex = /<div class="text-success col-4 col-content">(.*?)<\/div>/gs;

// 匹配所有的 <div class="text-success col-4 col-content"> 部分
const col4Matches = [...htmlText.matchAll(col4Regex)];

// 将匹配结果合并
const combinedMatches = col5Matches.map((match, index) => {
  const col5Content = match[1].trim();
  const col4Content = col4Matches[index][1].replace(/amp;/g, '').trim();
  return { col5: col5Content, col4: col4Content };
});

// 正则表达式，提取 href 属性中的链接
const hrefRegex = /href="\/music\/([^"]+)"/;

// 提取每个匹配的 href 链接和 _blank 内容
const musicData = combinedMatches.map(item => {
  const hrefMatch = item.col5.match(hrefRegex);
  const href = hrefMatch ? hrefMatch[1] : null;
  const songTitleMatch = item.col5.match(/_blank">([^<]+)<\/a>/);
  const songTitle = songTitleMatch ? songTitleMatch[1].trim() : null;
  const singerMatch = item.col4.match(/\s*([^<>\n]+)\s*/);
  const singer = singerMatch ? singerMatch[1].trim() : null;
  return { href, song_title: songTitle, singer };
});

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
      const MP3URL = `https://www.fangpi.net/api/play_url?id=${item.href}&json=1`
      console.log(`曲名:${item.song_title},歌手:${item.singer},链接:${MP3URL}`);

const req = new Request(MP3URL);
const data = await req.loadJSON();
if (data.msg === "操作成功") {
  Pasteboard.copy(`${item.song_title}-${item.singer}.mp3`)
    Safari.open(data.data.url);
} else {
    console.log("操作失败。");
}
    } else {
      console.log("没有可用的播放链接。");
    }
  };
  
  table.addRow(dataRow);
}

// 显示表格
await table.present();
