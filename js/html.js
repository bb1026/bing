// 注入工具数据到 HTML 模板
const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>工具列表</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
      .dragon-icon {
      position: fixed;
      top: 15px;
      right: 15px;
      font-size: 2rem;
      color: #ff5722;
      cursor: pointer;
      z-index: 1000;
      transition: transform 0.2s;
      transform: scaleX(-1); /* 左右反转 */
    }
    
    .dragon-icon:hover {
      transform: scaleX(-1) scale(1.1);
    }
    
    /* 迷你菜单样式 */
    .mini-menu {
      position: fixed;
      top: 70px;
      right: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 1000;
      display: none;
      overflow: hidden;
    }
    
    .mini-menu a {
      display: flex;
      flex-direction: row-reverse; /* 反转菜单项布局 */
      justify-content: space-between;
      padding: 10px 15px;
      text-decoration: none;
      color: #333;
      transition: background 0.2s;
    }
    
    .mini-menu a:hover {
      background: #f0f0f0;
    }
    
    .mini-menu a i {
      width: 20px;
      text-align: center;
      margin-left: 8px; /* 调整图标位置 */
      margin-right: 0;
    }
    
    .clear-library {
      color: #ff0000 !important;
      font-weight: bold;
    }
    
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, sans-serif;
      background: #f0f0f0;
    }

    .tool-box {
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      color: #fff;
      position: relative;
      overflow: hidden;
    }

    .tool-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .tool-icon {
      width: 40px;
      height: 40px;
      margin-right: 0.75rem;
      font-size: 1.8rem;
      flex-shrink: 0;
    }

    .tool-name {
      font-size: 1.2rem;
      font-weight: bold;
    }

    .tool-info {
      font-size: 0.95rem;
      line-height: 1.4;
      margin-left: 2.4rem;
    }

    .tool-intro {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 6px;
    }

    .add-btn {
      position: absolute;
      bottom: 10px;
      right: 16px;
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .add-btn i {
      margin-right: 6px;
    }

    .add-btn:hover {
      background: rgba(255, 255, 255, 0.4);
    }

    .modal {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99;
    }

    .modal-content {
      background: #fff;
      border-radius: 12px;
      padding: 1rem;
      max-width: 90%;
      width: 420px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    .modal-close {
      position: absolute;
      top: 0.7rem;
      right: 0.75rem;
      font-size: 1.3rem;
      cursor: pointer;
    }

    .modal-title {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
    }

    .modal-title i {
      font-size: 1.5rem;
      margin-right: 0.6rem;
    }

    .modal-title span {
      font-size: 1.2rem;
      font-weight: bold;
      color: #333;
    }

    .modal-field {
      margin: 10px 0;
      font-size: 0.95rem;
      color: #333;
    }

    .modal-field b {
      display: inline-block;
      width: 90px;
      color: #444;
    }

    .modal-install {
      margin-top: 1.5rem;
      background: #3b82f6;
      color: white;
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      width: 100%;
      cursor: pointer;
    }

    .modal-install i {
      margin-right: 8px;
    }

    .modal-install:hover {
      background: #2563eb;
    }

    /* New styles for the install modal */
    .install-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(40, 40, 40, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
      box-sizing: border-box;
    }

    .install-btn {
      width: 80%;
      max-width: 300px;
      padding: 15px 20px;
      margin: 10px 0;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.3s ease;
    }

    .install-btn i {
      margin-bottom: 8px;
      font-size: 1.5rem;
    }

    .install-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    .install-btn-primary {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .install-btn-secondary {
      background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
      color: #333;
    }

    .install-btn-close {
      background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
      color: white;
    }

    .install-tip {
      font-size: 0.85rem;
      color: white;
      margin-top: 5px;
      text-align: center;
    }
  </style>
</head>
<body>

    <!-- 新增的悬浮龙图标和迷你菜单 -->
  <div class="dragon-icon" id="dragonIcon">
    <i class="fas fa-dragon"></i>
  </div>
  <div class="mini-menu" id="miniMenu">
    <a href="#" id="homeLink"><i class="fas fa-home"></i>首页</a>
    <a href="#" id="clearLibrary"><i class="fas fa-trash"></i><span class="clear-library">清除库文件</span></a>
    <a href="#" id="backToTop"><i class="fas fa-arrow-alt-circle-up"></i>回到顶部</a>
  </div>

  <div id="tool-list">加载中...</div>

  <div id="modal" class="modal" style="display:none;">
    <div class="modal-content">
      <div class="modal-close" id="modalClose"><i class="fa-solid fa-ban"></i></div>
      <div class="modal-title">
        <i id="modalIcon" class="fa-solid fa-toolbox"></i>
        <span id="modalName">工具名称</span>
      </div>
      <div id="modalContent"></div>
      <button class="modal-install" id="modalInstallBtn">
        <i class="fa-solid fa-plus-circle"></i> 添加
      </button>
    </div>
  </div>

  <div id="installModal" class="install-modal" style="display:none;">
    <button class="install-btn install-btn-primary" id="addLibraryBtn">
      <i class="fa-solid fa-book"></i>
      添加库文件
      <span class="install-tip">首次使用请添加此文件(粘贴后运行)</span>
    </button>
    <button class="install-btn install-btn-secondary" id="addScriptBtn">
      <i class="fa-solid fa-file-code"></i>
      添加脚本文件
      <span class="install-tip">已添加库文件请直接运行</span>
    </button>
    <button class="install-btn install-btn-close" id="closeInstallModalBtn">
      <i class="fa-solid fa-times"></i>
      关闭
    </button>
  </div>

  <script>
    // 统一的操作处理函数
    function handleAction(content, redirectUrl = "scriptable:///run/master") {
      copyToClipboard(content);
      window.location.href = redirectUrl;
    }

    // 使用现有的 getRandomColorPair 函数设置龙图标颜色
    function setRandomDragonColor() {
      const dragonIcon = document.querySelector('.dragon-icon i');
      const colors = getRandomColorPair();
      dragonIcon.style.color = colors[0];
    }
    
    // 页面加载时设置随机颜色
    setRandomDragonColor();
  
    // 新增的龙图标和迷你菜单功能
    const dragonIcon = document.getElementById('dragonIcon');
    const miniMenu = document.getElementById('miniMenu');
    const backToTop = document.getElementById('backToTop');
    
    // 点击龙图标切换菜单显示
    dragonIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      setRandomDragonColor();
      miniMenu.style.display = miniMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // 点击页面其他地方关闭菜单
    document.addEventListener('click', function() {
      miniMenu.style.display = 'none';
    });
    
    // 阻止菜单内部点击事件冒泡
    miniMenu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // 首页链接处理
    document.getElementById('homeLink').addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleAction('SG9tZUxpbms');
    });
    
    // 清除库文件功能
    document.getElementById('clearLibrary').addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleAction('Q2xlYW5LdQ');
    });
    
    // 回到顶部功能
    backToTop.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({top: 0, behavior: 'smooth'});
    });
  
    const tools = %TOOLS%;
    function getRandomColorPair() {
      let bg, icon;
      do {
        bg = \`hsl(\${Math.floor(Math.random() * 360)}, 70%, 50%)\`;
        icon = \`hsl(\${Math.floor(Math.random() * 360)}, 70%, 50%)\`;
      } while (bg === icon);
      return [bg, icon];
    }

    let currentTool = null;

    async function loadTools() {
  try {
    const container = document.getElementById("tool-list");
    container.innerHTML = "";

    for (const key in tools) {
      const tool = tools[key];
      const iconClass = tool.icon ? \`fa-solid fa-\${tool.icon}\` : "fa-solid fa-toolbox";
      const [bgColor, iconColor] = getRandomColorPair();

      const box = document.createElement("div");
      box.className = "tool-box";
      box.style.backgroundColor = bgColor;

      // 点击整个 box 显示详情
      box.onclick = () => showModal(tool, iconClass);

      // 设置 box 内部结构（不含安装按钮）
      box.innerHTML = \`
        <div class="tool-header">
          <i class="tool-icon \${iconClass}" style="color:\${iconColor}"></i>
          <div class="tool-name">\${tool.name}</div>
        </div>
        <div class="tool-info">
          <div><strong>版本:</strong> \${tool.version}</div>
          <div class="tool-intro"><strong>简介：</strong>\${tool.introduction || ""}</div>
        </div>
      \`;

      // 创建安装按钮并添加事件
      const installBtn = document.createElement("div");
      installBtn.className = "add-btn";
      installBtn.innerHTML = \`<i class="fa-solid fa-plus-circle"></i>安装\`;
      installBtn.onclick = (e) => {
        e.stopPropagation(); // 阻止点击事件冒泡，避免触发详情
        showInstallModal(tool);
      };
      box.appendChild(installBtn);

      container.appendChild(box);
    }
  } catch (e) {
    document.getElementById("tool-list").innerText = "加载失败，请检查网络或数据格式。";
    console.error(e);
  }
}

    function showModal(tool, iconClass) {
      currentTool = tool;
      const closeColor = getRandomColorPair()[1];

      document.getElementById("modal").style.display = "flex";
      document.getElementById("modalIcon").className = iconClass;
      document.getElementById("modalName").textContent = tool.name;
      document.getElementById("modalClose").style.color = closeColor;

      function mark(val) {
        return val ? '<i class="fa-solid fa-check" style="color: #4ade80;"></i>' : '<i class="fa-solid fa-times" style="color: #f87171;"></i>';
      }

      document.getElementById("modalContent").innerHTML = \`
        <div class="modal-field"><b>版本：</b>\${tool.version}</div>
        <div class="modal-field"><b>简介：</b>\${tool.introduction || "无"}</div>
        <div class="modal-field"><b>文件：</b>\${tool.url}</div>
        <div class="modal-field"><b>ID：</b>\${tool.ID}</div>
        <div class="modal-field"><b>argsID：</b>\${tool.argsID}</div>
        <div class="modal-field"><b>更新内容：</b>\${tool.update || "无"}</div>
        <div class="modal-field"><b>组件支持：</b>大 \${mark(tool.large)} 中 \${mark(tool.medium)} 小 \${mark(tool.small)}</div>
      \`;
    }

    function closeModal() {
      document.getElementById("modal").style.display = "none";
    }

    document.getElementById("modalClose").onclick = closeModal;

    document.getElementById("modalInstallBtn").onclick = () => {
      if (currentTool) {
        showInstallModal(currentTool);
        closeModal();
      }
    };

    function showInstallModal(tool) {
      document.getElementById("installModal").style.display = "flex";
      document.getElementById("addScriptBtn").onclick = () => {
      const data = JSON.stringify([{
      name: tool.name,
      ID: tool.ID,
      version: tool.version
    }]); 
    handleAction(data);
    };
  }

    function closeInstallModal() {
      document.getElementById("installModal").style.display = "none";
    }

    document.getElementById("closeInstallModalBtn").onclick = closeInstallModal;

    document.getElementById("addLibraryBtn").onclick = () => {
      const libraryCode = \`const obtain = new Request('https://bing.0515364.xyz/js/package.json');obtain.headers = {'X-Auth-Key': 'scriptable-key'};eval(await obtain.loadString());await Script.Installer();\`;
      handleAction(libraryCode, "scriptable:///add");
    };

    function copyToClipboard(text) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    loadTools();
  </script>
</body>
</html>
`;
module.exports = html;