this.name = "Master List";
this.widgetID = "js-105";
this.version = "v1.0";

let scriptListURL = "https://bb1026.github.io/bing/js/Master.json";
let scriptList = await new Request(scriptListURL).loadJSON();
let sortedScripts = Object.values(scriptList).sort((a, b) => parseInt(a.ID.slice(3)) - parseInt(b.ID.slice(3)));

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
        Safari.open(
            "scriptable:///run?scriptName=安装小助手"
        );
    };
    table.addRow(row);
}

QuickLook.present(table);
