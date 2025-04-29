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

  createHTMLContent(scriptsHTML) {
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
    
    .header,.script-row {
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

    .header-item > div:first-child, .script-container {
      margin-bottom: 5px;
    }

    .script-id, .script-name, .script-support {
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 999;
      text-align: center;
    }

    #overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.3);
      z-index: 998;
    }

    #popup button {
      margin-top: 10px;
      padding: 8px 16px;
      border: none;
      background-color: #007AFF;
      color: white;
      border-radius: 8px;
      font-size: 15px;
    }
  </style>
</head>
<body>
  <div id="overlay"></div>
  <div id="popup">
    <p id="popup-message"></p>
    <button onclick="hidePopup()">关闭</button>
  </div>

  <div class="fixed-header">
  
  <marquee behavior="scroll" direction="left" scrollamount="8" style="color: #007AFF; font-size: 18px; padding: 5px 10px;">
欢迎使用脚本中心，请点击下方脚本以安装。最新脚本: Simba话费查询系统(111),缓存清理工具(112)。
  </marquee>  
  
    <div class="clear-db" id="clearBtn">清除数据库</div>
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
    function showPopup(message) {
      document.getElementById('popup-message').innerHTML = message;
      document.getElementById('popup').style.display = 'block';
      document.getElementById('overlay').style.display = 'block';
    }

    function hidePopup() {
      document.getElementById('popup').style.display = 'none';
      document.getElementById('overlay').style.display = 'none';
    }

    document.getElementById('clearBtn').addEventListener('click', () => {
      showPopup("清除指令已发出...");
      window.clicked = 'clear';
    });

    const containers = document.querySelectorAll('.script-container');
    containers.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const name = item.dataset.name;
        window.clicked = id;
        showPopup("正在安装脚本<br>请退出查看<br>" + id "<br>" + name);
      });
    });
  </script>
</body>
</html>`;
  }
};
