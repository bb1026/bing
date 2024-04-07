this.name = "Master List";
this.widget_ID = "js-105";
this.version = "v1.0";

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
} else {
    let sortedScripts = Object.values(scriptList).sort(
        (a, b) => parseInt(a.ID.slice(3)) - parseInt(b.ID.slice(3))
    );

    let table = new UITable();
    let headerRow = new UITableRow();
    headerRow.isHeader = true;
    headerRow.addText("ID");
    headerRow.addText("名称");
    headerRow.addText("更新信息");
    headerRow.addText("版本");
    table.addRow(headerRow);

    for (let script of sortedScripts) {
        let row = new UITableRow();
        row.addText(script.ID.toString());
        row.addText(script.name);
        row.addText(script.update);
        row.addText(script.version);
        row.onSelect = async () => {
            await Pasteboard.copy(script.url);
            const alert = new Alert();
            alert.message = "复制成功";
            alert.addAction("OK");
            await alert.present();
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
        };
        table.addRow(row);
    }

    QuickLook.present(table);
}
