// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: dove;
this.name = "缓存清理工具";
this.widget_ID = "js-112";
this.version = "v1.1";

let installation;
await CheckKu();
await installation(this.widget_ID, this.version);

const fm = FileManager.local();
const base = fm.documentsDirectory();

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  else return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function formatDate(date) {
  return date.toLocaleString();
}
function listAllFiles(fm, dir, prefix = "") {
  const items = fm.listContents(dir);
  const fileList = [];
  for (let name of items) {
    const fullPath = fm.joinPath(dir, name);
    const isDir = fm.isDirectory(fullPath);
    const size = isDir ? null : fm.fileSize(fullPath);
    const createdDate = fm.creationDate(fullPath);
    fileList.push({
      name,
      path: fullPath,
      isDir,
      size,
      createdDate
    });
    if (isDir) {
      const subItems = listAllFiles(fm, fullPath, prefix + "  ");
      fileList.push(...subItems);
    }
  }
  return fileList;
}
function removeFolderRecursively(fm, dir) {
  const items = fm.listContents(dir);
  for (let name of items) {
    const fullPath = fm.joinPath(dir, name);
    if (fm.isDirectory(fullPath)) {
      removeFolderRecursively(fm, fullPath);
    } else {
      fm.remove(fullPath);
    }
  }
  fm.remove(dir);
}
async function showFileList() {
  const fileList = listAllFiles(fm, base);
  const table = new UITable();
  table.showSeparators = true;
  
  if (fileList.length > 0) {
    const clearAllRow = new UITableRow();
    clearAllRow.addText("🗑️ 清除所有缓存", "此操作不可恢复");
    clearAllRow.onSelect = async () => {
      const alert = new Alert();
      alert.title = "确认清除";
      alert.message = "确定要删除所有缓存文件吗？此操作无法恢复。";
      alert.addDestructiveAction("清除所有");
      alert.addCancelAction("取消");
      const index = await alert.present();
      if (index === 0) {
        const items = fm.listContents(base);
        for (let name of items) {
          const fullPath = fm.joinPath(base, name);
          try {
            if (fm.isDirectory(fullPath)) {
              removeFolderRecursively(fm, fullPath);
            } else {
              fm.remove(fullPath);
            }
          } catch (e) {
            console.error(`无法删除 ${name}: ${e}`);
          }
        }
        const notification = new Notification();
        notification.title = "已清除缓存";
        notification.body = "所有缓存文件已被删除。";
        await notification.schedule();
        await showFileList();
      }
    };
    table.addRow(clearAllRow);
  }
  
  fileList.forEach(file => {
    const row = new UITableRow();
    const name = file.isDir ? `[文件夹] ${file.name}` : `[文件] ${file.name}`;
    const size = file.size != null ? formatSize(file.size) : "目录";
    const date = formatDate(file.createdDate);
    row.addText(name, `${size} | 创建时间: ${date}`);
    row.onSelect = async () => {
      const actionSheet = new Alert();
      actionSheet.title = file.name;
      actionSheet.message = "请选择操作";
      actionSheet.addAction("显示");
      actionSheet.addDestructiveAction("删除");
      actionSheet.addCancelAction("取消");
      const index = await actionSheet.present();
      try {
        if (index === 0) {
          if (!file.isDir) {
            const content = fm.readString(file.path);
            console.log(`=== ${file.name} ===\n${content}`);
          } else {
            console.log(`=== ${file.name} 是文件夹，无法显示内容 ===`);
          }
        } else if (index === 1) {
          if (file.isDir) {
            removeFolderRecursively(fm, file.path);
          } else {
            fm.remove(file.path);
          }
          const notification = new Notification();
          notification.title = "删除成功";
          notification.body = `${file.name} 已被删除`;
          await notification.schedule();
          await showFileList();
        }
      } catch (e) {
        const alert = new Alert();
        alert.title = "错误";
        alert.message = "操作失败: " + e;
        alert.addAction("确定");
        await alert.present();
      }
    };
    table.addRow(row);
  });
  await table.present();
}
await showFileList();

async function CheckKu() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "Ku.js");
  const url = "https://raw.githubusercontent.com/bb1026/bing/main/js/Ku.js";
  let needDownload = false;
    try {
    ({
      installation
    } = importModule("Ku"));
    
    if (typeof installation !== "function") {
      console.log("数据库模块无效，准备重新下载");
      needDownload = true;
    }
  } catch {
    console.log("数据库异常，准备重新下载");
    needDownload = true;
  }

  if (needDownload) {
      const req = new Request(url);
      req.timeoutInterval = 5;
    try {
      fm.writeString(path, await req.loadString());
      if (fm.isFileStoredIniCloud(path)) await fm.downloadFileFromiCloud(path);
    console.log("数据库下载完成");

  ({
    installation
  } = importModule("Ku"));
  if (typeof installation !== "function") throw new Error("数据库模块无效");
  } catch (error) {
    console.error("请求失败:" + error.message);
    }
  }
}
