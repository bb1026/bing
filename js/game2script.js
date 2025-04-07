// 游戏状态跟踪
const GAME_STATE = {
  NOT_STARTED: 0,
  PLAYING: 1,
  FINISHED: 2
};

// 游戏统计变量
let startTime = null;
let totalWords = 0;
let wrongAttempts = 0;
let totalHintsUsed = 0;
let gameState = GAME_STATE.NOT_STARTED;

// 游戏核心变量
let wordPairs = [];
let usedWords = new Set();
let currentWord = "";
let shuffledLetters = [];
let score = 0;
let selectedLetters = [];
let hintCount = 3;
let questionCount = 0;
let answerDisplayCount = 0;
let isChangingWord = false;
let isShowAndSubmit = false;

// 游戏配置
const levels = [
  { score: 0, name: "Lv0.萌新" },
  { score: 3, name: "Lv1.菜鸟" },
  { score: 8, name: "Lv2.初学者" },
  { score: 14, name: "Lv3.熟练者" },
  { score: 22, name: "Lv4.专家" },
  { score: 35, name: "Lv5.大神" },
  { score: 48, name: "Lv6.宗师" },
  { score: 60, name: "Lv7.传奇" },
  { score: 75, name: "Lv8.王者" },
  { score: 88, name: "Lv9.至尊" },
  { score: 100, name: "Lv10.神话" }
];
const MAX_QUESTIONS = 100;

// DOM元素
const elements = {
  startButton: document.getElementById("startButton"),
  endButton: document.getElementById("endButton"),
  submitButton: document.getElementById("submitButton"),
  hintButton: document.getElementById("hintButton"),
  chineseWord: document.getElementById("chineseWord"),
  userInput: document.getElementById("userInput"),
  message: document.getElementById("message"),
  letterChoices: document.getElementById("letterChoices"),
  correctAnswers: document.getElementById("correct-answers"),
  progressBar: document.getElementById("progress-bar"),
  levelDisplay: document.getElementById("level"),
  extraLetters: document.getElementById("extraLetters"),
  difficulty: document.getElementById("difficulty"),
  hintCount: document.getElementById("hint-count")
};

// 初始化游戏
async function initGame() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/bb1026/bing/refs/heads/main/js/game1.json");
    const rawData = await response.json();
    wordPairs = rawData
      .map(pair => ({ en: pair[0].trim(), zh: pair[1].trim() }))
      .filter(pair => pair.en && pair.zh);

    setupEventListeners();
  } catch (error) {
    console.error("获取单词数据失败:", error);
    alert("加载单词失败，请刷新重试");
  }
  const levelElement = document.getElementById("level");
  levelElement.addEventListener("click", showLevelsPopup);
  document
    .getElementById("progress-container")
    .addEventListener("click", showGameStats);
}

// 创建等级提示弹窗
function showLevelsPopup() {
  // 创建弹窗容器
  const popup = document.createElement("div");
  popup.className = "levels-popup";

  // 创建弹窗内容 (使用 levels-popup-* 类名)
  popup.innerHTML = `
    <div class="levels-popup-content">
      <div class="levels-popup-header">
        <h3>游戏等级说明</h3>
        <span class="levels-popup-close">&times;</span>
      </div>
      <div class="levels-popup-body">
        <ul class="levels-popup-list">
          ${levels
            .map(
              level => `
            <li>
              <span class="levels-popup-name">${level.name}</span>
              <span class="levels-popup-score">${level.score}分</span>
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    </div>
  `;

  // 关闭按钮事件
  popup.querySelector(".levels-popup-close").addEventListener("click", () => {
    document.body.removeChild(popup);
  });

  // 点击遮罩层关闭
  popup.addEventListener("click", e => {
    if (e.target === popup) {
      document.body.removeChild(popup);
    }
  });

  // 添加到页面
  document.body.appendChild(popup);
}

// 2. 创建显示统计的函数
function showGameStats() {
  if (gameState === GAME_STATE.NOT_STARTED) return;

  const now = new Date();
  const totalSeconds =
    gameState === GAME_STATE.PLAYING
      ? Math.round((now - startTime) / 1000)
      : Math.round((endTime - startTime) / 1000);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const accuracy = totalWords > 0 ? Math.round((score / totalWords) * 100) : 0;
  const currentLevel = getCurrentLevel();

  const popup = document.createElement("div");
  popup.className = "stats-popup";
  popup.innerHTML = `
    <div class="stats-popup-content">
      <span class="stats-popup-close">&times;</span>
      <h3 class="stats-popup-title">🎮 游戏统计</h3>
      <div class="stats-popup-details">
        <div><span class="stats-icon">🕒</span> 总用时: ${minutes}分${seconds}秒</div>
        <div><span class="stats-icon">📊</span> 总单词数: ${totalWords}个</div>
        <div><span class="stats-icon">✅</span> 正确次数: ${score}次</div>
        <div><span class="stats-icon">❌</span> 错误次数: ${wrongAttempts}次</div>
        <div><span class="stats-icon">🔍</span> 查看答案次数: ${totalHintsUsed}次</div>
        <div><span class="stats-icon">📈</span> 准确率: ${accuracy}%</div>
        <div class="stats-popup-divider"></div>
        <div style="font-weight:bold; color: #4CAF50;">
          <span class="stats-icon">🏆</span> 最终等级: ${currentLevel.name}
        </div>
      </div>
    </div>
  `;

  // 关闭功能
  popup.querySelector(".stats-popup-close").addEventListener("click", () => {
    document.body.removeChild(popup);
  });

  popup.addEventListener("click", e => {
    if (e.target === popup) {
      document.body.removeChild(popup);
    }
  });

  document.body.appendChild(popup);
}

function getCurrentLevel() {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (score >= levels[i].score) {
      return levels[i];
    }
  }
  return levels[0];
}

function setupEventListeners() {
  elements.startButton.addEventListener("click", startGame);
  elements.endButton.addEventListener("click", endGame);
  elements.submitButton.addEventListener("click", checkAnswer);
  elements.hintButton.addEventListener("click", showAnswer);
}

function startGame() {
  if (isChangingWord) return;
  isChangingWord = true;
  if (isShowAndSubmit) {
    elements.startButton.disabled = true; // 禁用按钮
    wrongAttempts++;
  }
  isShowAndSubmit = true;

  if (gameState === GAME_STATE.NOT_STARTED) {
    startTime = new Date();
    gameState = GAME_STATE.PLAYING;
    elements.endButton.style.display = "inline";
    elements.startButton.textContent = "换一个";
  }

  totalWords++;
  questionCount++;
  if (questionCount % 10 === 0) {
    hintCount = 3;
    elements.hintCount.textContent = hintCount;
    elements.hintButton.disabled = false;
  }

  resetRound();

  const extraCount = parseInt(elements.extraLetters.value);
  const availableWords = getAvailableWords();

  if (availableWords.length === 0) {
    const difficultyName =
      elements.difficulty.options[elements.difficulty.selectedIndex].text;
    alert(`当前难度（${difficultyName}）的所有单词已用完！`);
    isChangingWord = false; // 重置状态
    elements.startButton.disabled = false; // 重新启用按钮
    return;
  }

  const randomPair =
    availableWords[Math.floor(Math.random() * availableWords.length)];
  currentWord = randomPair.en;
  usedWords.add(currentWord);
  elements.chineseWord.textContent = randomPair.zh;

  shuffledLetters = shuffleLetters(currentWord, extraCount);
  renderLetters(shuffledLetters);
  updateProgress();

  // 1000毫秒后重新启用按钮
  setTimeout(() => {
    isChangingWord = false;
    elements.startButton.disabled = false;
  }, 1000);
}

function getAvailableWords() {
  return filterWordsByDifficulty(
    wordPairs.filter(pair => !usedWords.has(pair.en))
  );
}

function filterWordsByDifficulty(words) {
  const difficulty = elements.difficulty.value;
  const maxLength =
    difficulty === "easy" ? 5 : difficulty === "hard" ? 7 : Infinity;

  return words.filter(pair => pair.en.length <= maxLength);
}

function shuffleLetters(word, extraCount) {
  const letters = word.split("");
  const extraLetters = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .filter(l => !letters.includes(l))
    .sort(() => Math.random() - 0.5)
    .slice(0, extraCount);

  return [...letters, ...extraLetters].sort(() => Math.random() - 0.5);
}

function renderLetters(letters) {
  elements.letterChoices.innerHTML = "";

  letters.forEach(letter => {
    const btn = document.createElement("div");
    btn.className = "letter";
    btn.textContent = letter;
    btn.addEventListener("click", e => addLetter(letter, e));
    elements.letterChoices.appendChild(btn);
  });
}

function addLetter(letter, event) {
  const clickedBtn = event.target;

  if (!clickedBtn.classList.contains("selected")) {
    // 选中字母
    clickedBtn.classList.add("selected");
    selectedLetters.push({ element: clickedBtn, letter });
    elements.userInput.textContent += letter;
  } else {
    // 取消选中
    clickedBtn.classList.remove("selected");
    const index = selectedLetters.findIndex(
      item => item.element === clickedBtn
    );
    if (index > -1) selectedLetters.splice(index, 1);

    // 移除最后一次出现的该字母
    const inputText = elements.userInput.textContent;
    const lastIndex = inputText.lastIndexOf(letter);
    if (lastIndex > -1) {
      elements.userInput.textContent =
        inputText.slice(0, lastIndex) + inputText.slice(lastIndex + 1);
    }
  }
}

function checkAnswer() {
  if (gameState === GAME_STATE.NOT_STARTED) return;
  elements.submitButton.disabled = true;
  elements.hintButton.disabled = true;
  if (gameState !== GAME_STATE.PLAYING) return;

  const userAnswer = elements.userInput.textContent.trim();

  if (userAnswer === currentWord) {
    showFeedback("✓ 正确!", "correct-message");
    score++;
    answerDisplayCount++;
    // 修复：确保正确显示答案
    displayCorrectAnswer(currentWord);

    setTimeout(() => {
      elements.submitButton.disabled = false;
      if (hintCount <= 0) {
        elements.hintButton.disabled = true;
      } else {
        elements.hintButton.disabled = false;
      }
      if (!checkGameCompletion()) {
        startGame();
      }
    }, 1000);
  } else {
    wrongAttempts++;
    showFeedback("✗ 错误，请重试!", "wrong-message");

    setTimeout(() => {
      elements.submitButton.disabled = false;
      if (hintCount <= 0) {
        elements.hintButton.disabled = true;
      } else {
        elements.hintButton.disabled = false;
      }
    }, 1000);
  }
  updateProgress();
  isShowAndSubmit = false;
}

function showAnswer() {
  if (gameState === GAME_STATE.NOT_STARTED) return;
  isShowAndSubmit = false;
  elements.hintButton.disabled = true;
  if (gameState !== GAME_STATE.PLAYING || hintCount <= 0) {
    if (hintCount <= 0) {
      alert("查看答案次数已用完！");
      elements.submitButton.disabled = false;
    }
    return;
  }

  hintCount--;
  totalHintsUsed++;
  elements.hintCount.textContent = hintCount;

  elements.userInput.textContent = currentWord;
  showFeedback("已查看答案", "hint-message");

  answerDisplayCount++;
  updateProgress();
  displayAnswerWithMark(currentWord, true);

  setTimeout(() => {
    elements.submitButton.disabled = false;
    elements.hintButton.disabled = false;
    usedWords.add(currentWord);
    if (!checkGameCompletion()) {
      startGame();
    }
  }, 1000);
}

function showFeedback(message, className) {
  elements.message.textContent = message;
  elements.message.className = className;
}

function displayCorrectAnswer(word) {
  displayAnswerWithMark(word, false);
}

function displayAnswerWithMark(word, isHint) {
  const wordDiv = document.createElement("div");
  const currentPair = wordPairs.find(pair => pair.en === word);

  wordDiv.textContent = `${answerDisplayCount}. ${currentPair.zh}: ${word}${
    isHint ? " (查)" : ""
  }`;
  if (isHint) wordDiv.style.color = "#888";

  elements.correctAnswers.appendChild(wordDiv);
}

function checkGameCompletion() {
  if (score + totalHintsUsed >= MAX_QUESTIONS) {
    endGame();
    return true;
  }
  return false;
}

function endGame() {
  gameState = GAME_STATE.FINISHED;
  const endTime = new Date();
  const totalSeconds = Math.round((endTime - startTime) / 1000);

  // 显示结果统计
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const correctAnswers = score;
  const accuracy = Math.round((correctAnswers / totalWords) * 100);
  const currentLevel =
    levels.find(level => score >= level.score) || levels[levels.length - 1];

  alert(`
		🎮 游戏结果：
		--------------------------
		🕒 总用时: ${minutes}分${seconds}秒
		📊 总单词数: ${totalWords}个
		✅ 正确次数: ${correctAnswers}次
		❌ 错误次数: ${wrongAttempts}次
		🔍 查看答案次数: ${totalHintsUsed}次
		📈 准确率: ${accuracy}%
		🏆 最终等级: ${currentLevel.name}
		--------------------------
		`);

  // 修复：确保重置所有状态和UI
  resetGame();
}

function resetGame() {
  // ===== 重置游戏数据 =====
  startTime = null;
  score = 0;
  totalWords = 0;
  wrongAttempts = 0;
  totalHintsUsed = 0;
  answerDisplayCount = 0;
  hintCount = 3;
  questionCount = 0;
  gameState = GAME_STATE.NOT_STARTED;
  usedWords.clear();
  selectedLetters = [];
  currentWord = "";
  shuffledLetters = [];
  isChangingWord = false;
  isShowAndSubmit = false;
  document.querySelectorAll(".letter.selected").forEach(letter => {
    letter.classList.remove("selected");
  });
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  progressBar.style.transition = "none";
  progressText.style.transition = "none";
  progressBar.style.width = "0";
  progressText.textContent = "0 / 0 / 100";
  progressText.style.left = "50%";
  progressText.style.top = "50%";
  progressText.style.transform = "translate(-50%, -50%) scale(1)";
  progressText.style.color = "#000";

  void progressContainer.offsetWidth;
  void progressBar.offsetWidth;
  void progressText.offsetWidth;

  setTimeout(() => {
    progressBar.style.transition = "width 0.3s ease";
    progressText.style.transition = "transform 0.2s ease";
  }, 50);

  elements.hintCount.textContent = hintCount;
  elements.startButton.textContent = "开始游戏";
  elements.endButton.style.display = "none";
  elements.submitButton.disabled = false;
  elements.hintButton.disabled = false;
  elements.startButton.disabled = false;
  elements.levelDisplay.textContent = "Lv0.萌新 | 简单(≤5字母)";
  elements.correctAnswers.innerHTML = "";
  elements.userInput.textContent = "";
  elements.message.textContent = "";
  elements.chineseWord.textContent = "";
  elements.letterChoices.innerHTML = "";
}

function resetRound() {
  // 清除所有字母的选中状态
  document.querySelectorAll(".letter.selected").forEach(letter => {
    letter.classList.remove("selected");
  });

  // 清空输入和消息
  elements.userInput.textContent = "";
  elements.message.textContent = "";
  selectedLetters = [];
}

function updateProgress() {
  // 更新进度条

  const progress = Math.min(100, (score / MAX_QUESTIONS) * 100);
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${score} / ${totalWords} / 100`;

  // 确定当前等级
  let currentLevel = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (score >= levels[i].score) {
      currentLevel = levels[i];
      break;
    }
  }

  // 更新显示
  const difficultyName =
    elements.difficulty.options[elements.difficulty.selectedIndex].text;
  elements.levelDisplay.textContent = `${currentLevel.name} | ${difficultyName}`;

  // 等级提升特效
  const lastLevel = elements.levelDisplay.textContent.split("|")[0].trim();
  if (currentLevel.name !== lastLevel) {
    elements.levelDisplay.classList.add("level-up");
    setTimeout(() => {
      elements.levelDisplay.classList.remove("level-up");
    }, 1000);
  }
}

// 启动游戏
window.addEventListener("DOMContentLoaded", initGame);
