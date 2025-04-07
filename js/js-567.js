<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>简易小组件</title>
</head>
<body>
<p>↓↓使用方法↓↓</p>
<p>1，复制代码。</p>
<p>2，打开scriptable软件。</p>
<p>3，点击右上角➕。</p>
<p>3，粘贴代码并运行。</p>
<p>4，在桌面添加小组件输入Parameter。</p>
<button id="copyButton">一键复制代码</button>
<div id="randomText" style="display: none;">eval(await new Request(`https://bb1026.github.io/bing/js/js-${args.widgetParameter || 105}.js`).loadString());
// 请在桌面添加小组件，然后输入Parameter。</div>
<script>
document.getElementById("copyButton").addEventListener("click", function() {
    var text = document.getElementById("randomText").innerText;
    navigator.clipboard.writeText(text).then(function() {
        alert("代码复制成功，请打开Scriptable...，并粘贴代码运行");
        // Open Scriptable app
        window.location.href = 'scriptable:///add';
    }, function(err) {
        console.error('Failed to copy: ', err);
    });
});
</script>
</body>
</html>
