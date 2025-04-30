module.exports = {
  generateScriptsHTML(scriptList) {
    let scriptsHTML = "";

    const scripts = Object.values(scriptList).sort((a, b) => {
      const aID = parseInt(a.argsID || "0", 10);
      const bID = parseInt(b.argsID || "0", 10);
      return aID - bID;
    });

    for (const script of scripts) {
      const small = script.small ? "✅" : "❌";
      const medium = script.medium ? "✅" : "❌";
      const large = script.large ? "✅" : "❌";

      scriptsHTML += `
      <div class="script-container" data-id="${script.ID}" data-name="${
        script.name
      }">
        <div class="script-row">
          <div class="script-id">${script.argsID || ""}</div>
          <div class="script-name">${script.name || ""}</div>
          <div class="script-support">
            <div class="support-icons">
              <span class="support-icon">${large}</span>
              <span class="support-icon">${medium}</span>
              <span class="support-icon">${small}</span>
            </div>
          </div>
        </div>
        <div class="update-row">${script.update || "无更新说明"}</div>
        <div class="divider"></div>
      </div>
    `;
    }

    return scriptsHTML;
  },

  createHTMLContent(scriptsHTML, scripts) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, sans-serif;
    }

    .fixed-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background-color: white;
    }

    .scroll-container {
      overflow-y: auto;
      flex: 1;
    }

    .clear-db {
      color: red;
      font-weight: bold;
      text-align: center;
      margin-bottom: 10px;
      cursor: pointer;
      padding: 10px;
      background-color: #f8f8f8;
      border-radius: 5px;
      font-size: 20px;
    }
    
    .header,
    .script-row {
      display: grid;
      grid-template-columns: 0.5fr 1.5fr 1fr;
      align-items: center;
      padding: 5px 0;
    }

    .header-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      font-size: 20px;
    }

    .header-item > div:first-child,
    .script-container {
      margin-bottom: 5px;
    }

    .script-id,
    .script-name,
    .script-support {
      text-align: center;
      font-size: 20px;
      padding: 5px;
    }

    .support-icons {
      display: flex;
      justify-content: space-around;
      width: 100%;
    }

    .support-icon {
      flex: 1;
      font-size: 0.9em;
      text-align: center;
    }

    .update-row {
      text-align: center;
      font-size: 1.2em;
      color: #666;
      margin: 5px 0;
      padding: 5px;
      background-color: #f5f5f5;
      border-radius: 3px;
    }

    .divider {
      border-bottom: 1px solid #eee;
      margin: 5px 0;
    }

    #popup {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 999;
      text-align: center;
      max-width: 90vw;
      min-width: 80%;
      word-wrap: break-word;
    }

    #overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 998;
    }

    #popup-buttons {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 10px;
    }

    #popup-buttons button {
      font-size: 15px;
      padding: 10px 20px;
      color: white;
      background-color: #007AFF;
      border: none;
      border-radius: 8px;
    }
    
    .search-container {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin: 0 10px 10px;
    }

    #searchInput {
      padding: 10px;
      font-size: 18px;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-sizing: border-box;
      text-align: center;
    }
    
    @keyframes scroll {
      0% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
  </style>
</head>
<body>
  <div id="overlay"></div>
  <div id="popup">
    <p id="popup-message"></p>
    <div id="popup-buttons">
      <button id="confirmBtn" onclick="confirmPopup()">安装</button>
      <button onclick="hidePopup()">关闭</button>
    </div>
  </div>

  <div class="fixed-header">
  <div class="marquee" style="color: #007AFF; font-size: 18px; padding: 5px 10px; white-space: nowrap; overflow: hidden;">
  <div class="marquee-inner" style="display: inline-block; animation: scroll 10s linear infinite;">
    欢迎使用，请点击下方ID或者搜索ID进行安装。最新脚本: Simba话费查询系统(111) | 今年百分比(113)
  </div>
  </div>
    
    <div class="clear-db" id="clearBtn">清除数据库</div>
    <!-- 添加在清除按钮下方 -->
    <div class="search-container">
      <input type="text" id="searchInput" placeholder="输入ID并按回车" />
    </div>
    
    <div class="divider"></div>
    <div class="header">
      <div class="header-item">ID</div>
      <div class="header-item">名称</div>
      <div class="header-item">
        <div>组件支持</div>
        <div class="support-icons">
          <span>大</span>
          <span>中</span>
          <span>小</span>
        </div>
      </div>
    </div>
    <div class="divider"></div>
  </div>

  <div class="scroll-container">
    ${scriptsHTML}
  </div>

  <script>
    const allScripts = ${JSON.stringify(scripts)};

    let currentScriptID = null;
    
    function showPopup(message, type = 'dual', id = null) {
      document.getElementById('popup-message').innerHTML = message;
      document.getElementById('popup').style.display = 'block';
      document.getElementById('overlay').style.display = 'block';
      
      currentScriptID = id;

      const confirmBtn = document.getElementById('confirmBtn');
      confirmBtn.style.display = type === 'single' ? 'none' : 'inline-block';
    }

    function hidePopup() {
      document.getElementById('popup').style.display = 'none';
      document.getElementById('overlay').style.display = 'none';
    }
    
    function confirmPopup() {
      if (currentScriptID) {
        window.clicked = currentScriptID;
        console.log("已确认 ID:" + currentScriptID);
      }
      hidePopup();
    }
    
document.getElementById('clearBtn').addEventListener('click', () => {
      showPopup("清除指令已发出...", 'single');
      window.clicked = 'clear';
    });

    const containers = document.querySelectorAll('.script-container');
    containers.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const name = item.dataset.name;
        showPopup("确认安装脚本: " + name, 'dual', id);
      });
    });
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
      if (e.keyCode === 13) {
        const value = e.target.value.trim();
        window.searchValue = value;

        if (value) {
          const matchedScript = allScripts.find(s => s.argsID === value);
          if (matchedScript) {
            showPopup(
              '<div style="font-weight:bold; font-size:18px; margin-bottom:15px;">匹配脚本</div>' +
              '<div style="display: grid; grid-template-columns: 0.5fr 1.5fr 1fr; font-weight: bold; text-align: center; font-size: 16px; margin-bottom: 15px;">' +
                '<div>ID</div>' +
                '<div>名称</div>' +
                '<div>' +
                  '<div>组件支持</div>' +
                  '<div style="display: flex; justify-content: space-around; font-weight: normal; margin-top: 5px;">' +
                    '<span>大</span>' +
                    '<span>中</span>' +
                    '<span>小</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display: grid; grid-template-columns: 0.5fr 1.5fr 1fr; text-align: center; font-size: 16px; margin-bottom: 15px;">' +
                '<div>' + (matchedScript.argsID || matchedScript.ID) + '</div>' +
                '<div>' + (matchedScript.name || '') + '</div>' +
                '<div>' +
                  '<div style="display: flex; justify-content: space-around;">' +
                    '<span>' + (matchedScript.large ? '✅' : '❌') + '</span>' +
                    '<span>' + (matchedScript.medium ? '✅' : '❌') + '</span>' +
                    '<span>' + (matchedScript.small ? '✅' : '❌') + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div style="text-align: center; font-size: 1.2em; color: #666; margin: 5px 0; padding: 5px; background-color: #f5f5f5; border-radius: 3px;">' +
                (matchedScript.update || '无更新说明') +
              '</div>',
              'dual',
              matchedScript.ID
            );
          } else {
            showPopup("未找到匹配的脚本: <br>" + value, 'single');
          }
        }
      }
    });
  </script>
</body>
</html>`;
  }
};