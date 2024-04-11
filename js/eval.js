let code = `
(async () => {
    // 这里放你想让 eval 访问的代码
    let scriptName = (await new Request("https://bb1026.github.io/bing/js/Master.json").loadJSON())["js-100"].name;
    FileManager.iCloud().writeString(FileManager.iCloud().joinPath(FileManager.iCloud().documentsDirectory(), \`\${scriptName}.js\`), await(new Request(\`https://bb1026.github.io/bing/js/js-100.js\`).loadString()));
    Safari.open(\`scriptable:///run?scriptName=\${encodeURIComponent(scriptName)}\`);
    FileManager.iCloud().remove(FileManager.iCloud().joinPath(FileManager.iCloud().documentsDirectory(),\`\${Script.name()}.js\`));
})();
`;
