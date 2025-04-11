// 游戏状态跟踪
const GAME_STATE = {
  NOT_STARTED: 0,
  PLAYING: 1,
  FINISHED: 2
};

// 游戏统计变量
let startTime = null;
let endTime = null;
let totalWords = 0;
let wrongAttempts = 0;
let gameState = GAME_STATE.NOT_STARTED;

// 游戏核心变量
let rawData = null;
const usedWordsByCategory = new Map();
let currentCategory = "all";
let wordPairs = [];
let currentWord = "";
let shuffledLetters = [];
let score = 0;
let selectedLetters = [];
let questionCount = 0;
let answerDisplayCount = 0;
let chenkCount = 0;
let isChangingWord = false;
let hiddenLetters = [];
let revealedLetters = [];
let userAnswer = []; // 用户当前已输入的字母

// 游戏配置
const levels = [
  {
    score: 0,
    name: "Lv0.萌新"
  },
  {
    score: 3,
    name: "Lv1.菜鸟"
  },
  {
    score: 8,
    name: "Lv2.初学者"
  },
  {
    score: 14,
    name: "Lv3.熟练者"
  },
  {
    score: 22,
    name: "Lv4.专家"
  },
  {
    score: 35,
    name: "Lv5.大神"
  },
  {
    score: 48,
    name: "Lv6.宗师"
  },
  {
    score: 60,
    name: "Lv7.传奇"
  },
  {
    score: 75,
    name: "Lv8.王者"
  },
  {
    score: 88,
    name: "Lv9.至尊"
  },
  {
    score: 100,
    name: "Lv10.神话"
  }
];
const MAX_QUESTIONS = 100;

// DOM元素
const elements = {
  startButton: document.getElementById("startButton"),
  endButton: document.getElementById("endButton"),
  chineseWord: document.getElementById("chineseWord"),
  userInput: document.getElementById("userInput"),
  message: document.getElementById("message"),
  letterChoices: document.getElementById("letterChoices"),
  correctAnswers: document.getElementById("correct-answers"),
  progressBar: document.getElementById("progress-bar"),
  levelDisplay: document.getElementById("level"),
  extraLetters: document.getElementById("extraLetters"),
  difficulty: document.getElementById("difficulty"),
  wordType: document.getElementById("wordType"),
  answerContainer: document.getElementById("answerContainer")
};

// 在文件开头添加音乐控制功能
document.addEventListener("DOMContentLoaded", function () {
  const audio = new Audio();
  audio.src = "music/千与千寻.mp3";
  audio.loop = true;

  const musicControl = document.getElementById("music-control");
  const musicIcon = document.getElementById("music-icon");

  // 静音图标路径
  const soundOnIcon =
    '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>';
  const soundOffIcon =
    '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';

  // 尝试自动播放（添加用户交互检测）
  function attemptAutoplay() {
    audio
      .play()
      .then(() => {
        musicControl.classList.remove("muted");
        musicIcon.innerHTML = soundOnIcon;
      })
      .catch(e => {
        document.body.addEventListener("click", enableAudioOnInteraction, {
          once: true
        });
      });
  }

  function enableAudioOnInteraction() {
    audio.play().then(() => {
      musicControl.classList.remove("muted");
      musicIcon.innerHTML = soundOnIcon;
    });
  }

  attemptAutoplay();

  musicControl.addEventListener("click", function (e) {
    e.stopPropagation();

    if (audio.paused) {
      audio.play();
      musicControl.classList.remove("muted");
      musicIcon.innerHTML = soundOnIcon;
    } else {
      audio.pause();
      musicControl.classList.add("muted");
      musicIcon.innerHTML = soundOffIcon;
    }
  });
});

// 初始化游戏
async function initGame() {
  try {
    const response = await fetch(
      "js/game3.json"
    );
    rawData = await response.json();

    initCategorySelect();
    setupWordPairs();
    setupEventListeners();

    updateProgress();
  } catch (error) {
    console.error("获取单词数据失败:", error);
    alert("加载单词失败，请刷新重试");
  }

  document.getElementById("level").addEventListener("click", showLevelsPopup);
  document
    .getElementById("progress-container")
    .addEventListener("click", showGameStats);
  document
    .getElementById("showAnswerButton")
    .addEventListener("click", showAnswer);
}

// 开始游戏函数
function startGame() {
  if (isChangingWord) return;
  isChangingWord = true;
  elements.startButton.disabled = true;

  resetRound();

  if (gameState === GAME_STATE.NOT_STARTED) {
    startTime = new Date();
    gameState = GAME_STATE.PLAYING;
    elements.endButton.style.display = "inline";
    elements.startButton.textContent = "换一个";
  }

  totalWords++;
  questionCount++;

  const extraCount = parseInt(elements.extraLetters.value);
  const availableWords = getAvailableWords();

  if (availableWords.length === 0) {
    handleNoWordsAvailable();
    return;
  }

  const selectedPair = selectRandomWord(availableWords);
  currentWord = selectedPair.en;
  elements.chineseWord.textContent = selectedPair.zh;

  setupHiddenLetters();
  setupLetterChoices(extraCount);

  updateProgress();

  setTimeout(() => {
    isChangingWord = false;
    elements.startButton.disabled = false;
  }, 500);
}

// 初始化分类选择
function initCategorySelect() {
  const wordTypeSelect = elements.wordType;
  wordTypeSelect.innerHTML = '<option value="all">全部</option>';
  for (const category in rawData) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    wordTypeSelect.appendChild(option);
  }
}

// 设置单词对
function setupWordPairs() {
  wordPairs = [];
  for (const category in rawData) {
    usedWordsByCategory.set(category, new Set());
    rawData[category].forEach(item => {
      for (const en in item) {
        wordPairs.push({
          en,
          zh: item[en],
          category
        });
      }
    });
  }
  usedWordsByCategory.set("all", new Set());
}

// 设置事件监听
function setupEventListeners() {
  elements.startButton.addEventListener("click", startGame);
  elements.endButton.addEventListener("click", endGame);
  elements.wordType.addEventListener("change", function () {
    currentCategory = this.value;
    if (!usedWordsByCategory.has(currentCategory)) {
      usedWordsByCategory.set(currentCategory, new Set());
    }
    if (gameState === GAME_STATE.PLAYING) {
      alert(
        `已切换到${this.options[this.selectedIndex].text}分类，将在下一题生效`
      );
    }
  });
}

// 获取可用单词
function getAvailableWords() {
  const difficulty = elements.difficulty.value;
  const maxLength =
    difficulty === "easy" ? 5 : difficulty === "hard" ? 7 : Infinity;
  const usedWords = usedWordsByCategory.get(currentCategory) || new Set();

  return wordPairs.filter(pair => {
    return (
      pair.en.length <= maxLength &&
      (currentCategory === "all" || pair.category === currentCategory) &&
      !usedWords.has(pair.en)
    );
  });
}

// 处理无可用单词情况
function handleNoWordsAvailable() {
  const difficultyName =
    elements.difficulty.options[elements.difficulty.selectedIndex].text;
  const categoryName = currentCategory === "all" ? "所有分类" : currentCategory;
  alert(
    `当前分类（${categoryName}）和难度（${difficultyName}）的所有单词已用完！`
  );
  isChangingWord = false;
  elements.startButton.disabled = false;
}

// 选择随机单词
function selectRandomWord(availableWords) {
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  const selectedPair = availableWords[randomIndex];

  const currentUsedWords =
    usedWordsByCategory.get(currentCategory) || new Set();
  currentUsedWords.add(selectedPair.en);
  if (currentCategory !== "all") {
    usedWordsByCategory.get("all").add(selectedPair.en);
  }

  return selectedPair;
}

// 设置隐藏字母
function setupHiddenLetters() {
  let hideCount =
    currentWord.length <= 4
      ? Math.min(2, Math.max(1, Math.floor(currentWord.length / 2)))
      : Math.min(4, Math.max(2, Math.floor(currentWord.length / 2)));

  hiddenLetters = [];
  const positions = [...Array(currentWord.length).keys()];
  for (let i = 0; i < hideCount && positions.length > 0; i++) {
    const randomPos = Math.floor(Math.random() * positions.length);
    const pos = positions.splice(randomPos, 1)[0];
    hiddenLetters.push({
      position: pos,
      letter: currentWord[pos]
    });
    elements.userInput.innerHTML = "";
    for (let i = 0; i < currentWord.length; i++) {
      const charSpan = document.createElement("span");
      if (hiddenLetters.some(h => h.position === i)) {
        charSpan.textContent = "*";
        charSpan.className = "revealed-char hidden-char";
      } else {
        charSpan.textContent = currentWord[i].toUpperCase();
        charSpan.className = "revealed-char default-char";
        charSpan.style.pointerEvents = "none";
      }
      elements.userInput.appendChild(charSpan);
    }
  }

  elements.userInput.innerHTML = "";
  for (let i = 0; i < currentWord.length; i++) {
    const charSpan = document.createElement("span");
    if (hiddenLetters.some(h => h.position === i)) {
      charSpan.textContent = "*";
      charSpan.className = "revealed-char hidden-char";
    } else {
      charSpan.textContent = currentWord[i].toUpperCase();
      charSpan.className = "revealed-char default-char";
    }
    elements.userInput.appendChild(charSpan);
  }
}

// 设置字母选择区
function setupLetterChoices(extraCount) {
  const extraLetters = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .filter(l => !currentWord.includes(l))
    .sort(() => Math.random() - 0.5)
    .slice(0, extraCount);

  shuffledLetters = [...hiddenLetters.map(h => h.letter), ...extraLetters].sort(
    () => Math.random() - 0.5
  );

  renderLetters(shuffledLetters);
}

// 渲染字母选择区
function renderLetters(letters) {
  elements.letterChoices.innerHTML = "";
  letters.forEach(letter => {
    const btn = document.createElement("div");
    btn.className = "letter";
    btn.textContent = letter.toUpperCase();
    btn.addEventListener("click", e => addLetter(letter, e));
    elements.letterChoices.appendChild(btn);
  });
}

// 添加字母到答案区
function addLetter(letter, event) {
  if (isChangingWord) return;

  const target = event.target;
  if (target.classList.contains("selected")) return;

  target.classList.add("selected");
  selectedLetters.push(letter);

  const hiddenSpans = elements.userInput.querySelectorAll("span.hidden-char");
  for (const span of hiddenSpans) {
    if (span.textContent === "*") {
      span.textContent = letter.toUpperCase();
      span.className = "revealed-char user-char";

      span.addEventListener("click", () => removeLetter(span, target));
      break;
    }
  }

  checkCompletion();
}

//新增RemoveLetter函数
function removeLetter(spanElement, letterElement) {
  if (
    isChangingWord ||
    elements.userInput.classList.contains("answered-correctly")
  ) {
    return;
  }

  const letter = spanElement.textContent.toLowerCase();
  letterElement.classList.remove("selected");

  const index = selectedLetters.indexOf(letter);
  if (index > -1) {
    selectedLetters.splice(index, 1);
  }

  spanElement.textContent = "*";
  spanElement.className = "revealed-char hidden-char";
  spanElement.onclick = null;

  checkCompletion();
}

// 检查是否完成
function checkCompletion() {
  const hiddenSpans = elements.userInput.querySelectorAll("span.hidden-char");
  if (hiddenSpans.length === 0) {
    const userAnswer = Array.from(elements.userInput.children)
      .map(span => span.textContent.toLowerCase())
      .join("");

    if (userAnswer === currentWord.toLowerCase()) {
      elements.userInput.classList.add("answered-correctly");

      showFeedback("✅回答正确!", "correct-message");
      score++;
      answerDisplayCount++;
      updateProgress();
      displayCorrectAnswer(currentWord);

      elements.answerContainer.style.border = "none";

      setTimeout(() => {
        if (!checkGameCompletion()) {
          setTimeout(startGame, 1000);
        }
      }, 1000);
    } else {
      showFeedback("❌错误，请继续选择字母!", "wrong-message");
      wrongAttempts++;
    }
  }
}

// 显示反馈信息
function showFeedback(message, className) {
  elements.message.textContent = message;
  elements.message.className = className;
  setTimeout(() => {
    elements.message.textContent = "";
    elements.message.className = "";
  }, 1000);
}

// 已答区显示正确答案
function displayCorrectAnswer(word) {
  const wordDiv = document.createElement("div");
  const currentPair = wordPairs.find(pair => pair.en === word);
  wordDiv.textContent = `${answerDisplayCount}. ${
    currentPair.zh
  }: ${word.toUpperCase()}`;
  elements.correctAnswers.appendChild(wordDiv);
}

// 检查游戏是否完成
function checkGameCompletion() {
  if (score >= MAX_QUESTIONS) {
    endGame();
    return true;
  }
  return false;
}

// 结束游戏
function endGame() {
  gameState = GAME_STATE.FINISHED;
  endTime = new Date();
  const totalSeconds = Math.round((endTime - startTime) / 1000);

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
    👀 查看次数: ${chenkCount}次
    📈 准确率: ${accuracy}%
    🏆 最终等级: ${currentLevel.name}
    --------------------------
    `);

  resetGame();
}

// 重置游戏
function resetGame() {
  startTime = null;
  score = 0;
  totalWords = 0;
  wrongAttempts = 0;
  answerDisplayCount = 0;
  questionCount = 0;
  chenkCount = 0;
  gameState = GAME_STATE.NOT_STARTED;

  usedWordsByCategory.forEach(set => set.clear());

  selectedLetters = [];
  currentWord = "";
  shuffledLetters = [];
  isChangingWord = false;
  hiddenLetters = [];
  revealedLetters = [];

  document.querySelectorAll(".letter").forEach(letter => {
    letter.style.visibility = "visible";
    letter.classList.remove("selected");
  });

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

  void progressBar.offsetWidth;
  void progressText.offsetWidth;

  setTimeout(() => {
    progressBar.style.transition = "width 0.3s ease";
    progressText.style.transition = "transform 0.2s ease";
  }, 50);

  elements.startButton.textContent = "开始游戏";
  elements.endButton.style.display = "none";
  elements.startButton.disabled = false;
  elements.levelDisplay.textContent = "Lv0.萌新 | 简单(≤5字母)";
  elements.correctAnswers.innerHTML = "";
  elements.userInput.textContent = "";
  elements.message.textContent = "";
  elements.chineseWord.textContent = "";
  elements.letterChoices.innerHTML = "";
  elements.answerContainer.style.border = "2px dashed #000";
}

// 重置当前回合
function resetRound() {
  document.querySelectorAll(".letter").forEach(letter => {
    letter.style.visibility = "visible";
    letter.classList.remove("selected");
  });
  elements.userInput.textContent = "";
  elements.message.textContent = "";
  elements.userInput.classList.remove("answered-correctly");
  selectedLetters = [];
  hiddenLetters = [];
  revealedLetters = [];
  elements.answerContainer.style.border = "2px dashed #000";
}

// 更新进度
function updateProgress() {
  const progress = Math.min(100, (score / MAX_QUESTIONS) * 100);
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${score} / ${totalWords} / 100`;
  let currentLevel = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (score >= levels[i].score) {
      currentLevel = levels[i];
      break;
    }
  }
  const difficultyName =
    elements.difficulty.options[elements.difficulty.selectedIndex].text;
  elements.levelDisplay.textContent = `${currentLevel.name} | ${difficultyName}`;
  const lastLevel = elements.levelDisplay.textContent.split("|")[0].trim();
  if (currentLevel.name !== lastLevel) {
    elements.levelDisplay.classList.add("level-up");
    setTimeout(() => {
      elements.levelDisplay.classList.remove("level-up");
    }, 1000);
  }
}

// 显示等级弹窗
function showLevelsPopup() {
  const popup = document.createElement("div");
  popup.className = "levels-popup";
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
  popup.querySelector(".levels-popup-close").addEventListener("click", () => {
    document.body.removeChild(popup);
  });
  popup.addEventListener("click", e => {
    if (e.target === popup) {
      document.body.removeChild(popup);
    }
  });
  document.body.appendChild(popup);
}

// 显示游戏统计
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
        <div><span class="stats-icon">👀</span> 查看次数: ${chenkCount}次</div>
        <div><span class="stats-icon">📈</span> 准确率: ${accuracy}%</div>
        <div class="stats-popup-divider"></div>
        <div style="font-weight:bold; color: #4CAF50;">
          <span class="stats-icon">🏆</span> 最终等级: ${currentLevel.name}
        </div>
      </div>
    </div>
  `;
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

// 获取当前等级
function getCurrentLevel() {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (score >= levels[i].score) {
      return levels[i];
    }
  }
  return levels[0];
}

// 显示答案的函数（所有字母输出为大写）
function showAnswer() {
  const messageElement = document.getElementById("message");

  if (!currentWord) {
    messageElement.textContent = "当前没有题目";
    messageElement.style.color = "#f44336";
    return;
  }

  // 获取用户当前输入并转为大写
  const userInputElement = document.getElementById("userInput");
  userAnswer = userInputElement.textContent.trim().toUpperCase().split("");

  userInputElement.innerHTML = "";

  currentWord
    .toUpperCase()
    .split("")
    .forEach((letter, index) => {
      const span = document.createElement("span");
      span.textContent = letter;

      // 判断是否用户已输入正确
      if (index < userAnswer.length && userAnswer[index] === letter) {
        span.className = "user-correct";
      } else {
        span.className = "system-completed";
      }

      userInputElement.appendChild(span);
    });

  const letterElements = document.querySelectorAll(".letter");
  const lettersToHide = [];

  currentWord
    .toUpperCase()
    .split("")
    .forEach((letter, index) => {
      if (index >= userAnswer.length || userAnswer[index] !== letter) {
        lettersToHide.push(letter);
      }
    });

  letterElements.forEach(el => {
    const letter = el.textContent.toUpperCase();
    if (lettersToHide.includes(letter)) {
      const index = lettersToHide.indexOf(letter);

      el.classList.add("hidden");
      if (index > -1) {
        lettersToHide.splice(index, 1);
      }
    }
  });

  answerDisplayCount++;

  const answerEntry = document.createElement("div");
  answerEntry.className = "answer-entry";
  answerEntry.appendChild(
    document.createTextNode(
      `${answerDisplayCount}. ${
        document.getElementById("chineseWord").textContent
      }: `
    )
  );

  currentWord
    .toUpperCase()
    .split("")
    .forEach((letter, index) => {
      const span = document.createElement("span");
      span.textContent = letter;

      if (index < userAnswer.length && userAnswer[index] === letter) {
        span.className = "user-correct2";
      } else {
        span.className = "system-completed2";
      }

      answerEntry.appendChild(span);
    });

  document.getElementById("correct-answers").appendChild(answerEntry);

  messageElement.textContent = "答案已显示";
  messageElement.style.color = "#1e88e5";
  chenkCount++;

  setTimeout(function () {
    if (!checkGameCompletion()) {
      startGame();
    }
    messageElement.textContent = "";
  }, 1500);
}

// 启动游戏
window.addEventListener("DOMContentLoaded", initGame);
