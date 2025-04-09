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
let rawData = null;
const usedWordsByCategory = new Map();
let currentCategory = 'all';
let wordPairs = [];
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
const levels = [{
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
    hintCount: document.getElementById("hint-count"),
    wordType: document.getElementById("wordType")
};

// 在文件开头添加音乐控制功能
document.addEventListener('DOMContentLoaded', function() {
    // 创建音频元素
    const audio = new Audio();
    audio.src = 'https://bb1026.github.io/bing/music/ 千与千寻 主题曲《いつも何度で...-里德可以Houche.mp3'; // 替换为您想要的音乐URL
    audio.loop = true;
    
    // 获取音乐控制元素
    const musicControl = document.getElementById('music-control');
    const musicIcon = document.getElementById('music-icon');
    
    // 静音图标路径
    const soundOnIcon = '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>';
    const soundOffIcon = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    
    // 尝试自动播放（添加用户交互检测）
    function attemptAutoplay() {
        audio.play().then(() => {
            musicControl.classList.remove('muted');
            musicIcon.innerHTML = soundOnIcon;
        }).catch(e => {
            // 自动播放被阻止，等待用户交互
            document.body.addEventListener('click', enableAudioOnInteraction, { once: true });
        });
    }
    
    function enableAudioOnInteraction() {
        audio.play().then(() => {
            musicControl.classList.remove('muted');
            musicIcon.innerHTML = soundOnIcon;
        });
    }
    
    attemptAutoplay();
    
    // 点击控制音乐
    musicControl.addEventListener('click', function(e) {
        e.stopPropagation(); // 防止触发body的交互检测
        
        if (audio.paused) {
            audio.play();
            musicControl.classList.remove('muted');
            musicIcon.innerHTML = soundOnIcon;
        } else {
            audio.pause();
            musicControl.classList.add('muted');
            musicIcon.innerHTML = soundOffIcon;
        }
    });
});

// 初始化游戏
async function initGame() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/bb1026/bing/refs/heads/main/js/game3.json");
        rawData = await response.json();

        // 初始化分类选择下拉菜单
        initCategorySelect();

        // 转换数据格式为统一的wordPairs数组
        wordPairs = [];
        for (const category in rawData) {
            usedWordsByCategory.set(category, new Set());
            const categoryWords = rawData[category];
            categoryWords.forEach(item => {
                for (const en in item) {
                    wordPairs.push({
                        en,
                        zh: item[en],
                        category
                    });
                }
            });
        }

        // 初始化"全部"分类的已用单词集合
        usedWordsByCategory.set('all', new Set());

        setupEventListeners();
    } catch (error) {
        console.error("获取单词数据失败:", error);
        alert("加载单词失败，请刷新重试");
    }

    const levelElement = document.getElementById("level");
    levelElement.addEventListener("click", showLevelsPopup);
    document.getElementById("progress-container").addEventListener("click", showGameStats);
}

// 新增函数：初始化分类选择下拉菜单
function initCategorySelect() {
    const wordTypeSelect = document.getElementById("wordType");
    wordTypeSelect.innerHTML = '<option value="all">全部</option>';

    // 添加从JSON中获取的分类
    for (const category in rawData) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        wordTypeSelect.appendChild(option);
    }
}

// 修改获取可用单词函数，考虑分类筛选
function getAvailableWords() {
    const difficulty = elements.difficulty.value;
    const maxLength = difficulty === "easy" ? 5 : difficulty === "hard" ? 7 : Infinity;
    const usedWords = usedWordsByCategory.get(currentCategory) || new Set();

    return wordPairs.filter(pair => {
        const lengthMatch = pair.en.length <= maxLength;
        const categoryMatch = currentCategory === 'all' || pair.category === currentCategory;
        const notUsed = !usedWords.has(pair.en);

        return lengthMatch && categoryMatch && notUsed;
    });
}

// 修改startGame函数中的单词选择逻辑
function startGame() {
    if (isChangingWord) return;
    isChangingWord = true;
    if (isShowAndSubmit) {
        elements.startButton.disabled = true;
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
        const difficultyName = elements.difficulty.options[elements.difficulty.selectedIndex].text;
        const categoryName = currentCategory === 'all' ? '所有分类' : currentCategory;
        alert(`当前分类（${categoryName}）和难度（${difficultyName}）的所有单词已用完！`);
        isChangingWord = false;
        elements.startButton.disabled = false;
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedPair = availableWords[randomIndex];
    currentWord = selectedPair.en;

    // 记录已用单词
    const currentUsedWords = usedWordsByCategory.get(currentCategory) || new Set();
    currentUsedWords.add(currentWord);

    if (currentCategory !== 'all') {
        const allUsedWords = usedWordsByCategory.get('all') || new Set();
        allUsedWords.add(currentWord);
    }

    elements.chineseWord.textContent = selectedPair.zh;
    shuffledLetters = shuffleLetters(currentWord, extraCount);
    renderLetters(shuffledLetters);
    updateProgress();

    setTimeout(() => {
        isChangingWord = false;
        elements.startButton.disabled = false;
    }, 1000);
}

// 修改分类变化事件处理
function setupEventListeners() {
    elements.startButton.addEventListener("click", startGame);
    elements.endButton.addEventListener("click", endGame);
    elements.submitButton.addEventListener("click", checkAnswer);
    elements.hintButton.addEventListener("click", showAnswer);

    elements.wordType.addEventListener("change", function() {
        currentCategory = this.value;
        if (!usedWordsByCategory.has(currentCategory)) {
            usedWordsByCategory.set(currentCategory, new Set());
        }
        if (gameState === GAME_STATE.PLAYING) {
            alert(`已切换到${this.options[this.selectedIndex].text}分类，将在下一题生效`);
        }
    });
}

// 以下所有函数保持原样不变
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

function showGameStats() {
    if (gameState === GAME_STATE.NOT_STARTED) return;
    const now = new Date();
    const totalSeconds =
        gameState === GAME_STATE.PLAYING ?
        Math.round((now - startTime) / 1000) :
        Math.round((endTime - startTime) / 1000);
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

function filterWordsByDifficulty(words) {
    const difficulty = elements.difficulty.value;
    const maxLength = difficulty === "easy" ? 5 : difficulty === "hard" ? 7 : Infinity;
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
        btn.textContent = letter.toUpperCase();
        btn.addEventListener("click", e => addLetter(letter, e));
        elements.letterChoices.appendChild(btn);
    });
}

function addLetter(letter, event) {
    const clickedBtn = event.target;
    if (!clickedBtn.classList.contains("selected")) {
        clickedBtn.classList.add("selected");
        selectedLetters.push({
            element: clickedBtn,
            letter
        });
        elements.userInput.textContent += letter.toUpperCase();
    } else {
        clickedBtn.classList.remove("selected");
        const index = selectedLetters.findIndex(item => item.element === clickedBtn);
        if (index > -1) selectedLetters.splice(index, 1);
        const inputText = elements.userInput.textContent;

        const lastIndex = inputText.toUpperCase().lastIndexOf(letter.toUpperCase());
        if (lastIndex > -1) {
            elements.userInput.textContent = inputText.slice(0, lastIndex) + inputText.slice(lastIndex + 1);
        }
    }
}

function checkAnswer() {
    elements.submitButton.disabled = true;
    elements.hintButton.disabled = true;
    if (gameState !== GAME_STATE.PLAYING) return;
    const userAnswer = elements.userInput.textContent.trim();
    const isCorrect = userAnswer.toLowerCase() === currentWord.toLowerCase();
    if (isCorrect) {
        showFeedback("✓ 正确!", "correct-message");
        score++;
        answerDisplayCount++;
        updateProgress();
        displayCorrectAnswer(currentWord);
        setTimeout(() => {
            elements.submitButton.disabled = false;
            if (hintCount <= 0) {
                elements.hintButton.disabled = true;
            } else {
                elements.hintButton.disabled = false;
            }
            if (!checkGameCompletion()) startGame();
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
    elements.userInput.textContent = currentWord.toUpperCase();
    showFeedback("已查看答案", "hint-message");
    answerDisplayCount++;
    updateProgress();
    displayAnswerWithMark(currentWord, true);
    setTimeout(() => {
        elements.submitButton.disabled = false;
        elements.hintButton.disabled = false;
        const usedWords = usedWordsByCategory.get(currentCategory) || new Set();
        usedWords.add(currentWord);
        if (!checkGameCompletion()) startGame();
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
    wordDiv.textContent = `${answerDisplayCount}. ${currentPair.zh}: ${word.toUpperCase()}${isHint ? " (查)" : ""}`;
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

    // 修复：重置游戏状态
    resetGame();
}

function resetGame() {
    // 重置游戏数据
    startTime = null;
    score = 0;
    totalWords = 0;
    wrongAttempts = 0;
    totalHintsUsed = 0;
    answerDisplayCount = 0;
    hintCount = 3;
    questionCount = 0;
    gameState = GAME_STATE.NOT_STARTED;

    // 修复：清空所有分类的已用单词
    usedWordsByCategory.forEach(set => set.clear());

    selectedLetters = [];
    currentWord = "";
    shuffledLetters = [];
    isChangingWord = false;
    isShowAndSubmit = false;

    // 重置UI状态
    document.querySelectorAll(".letter.selected").forEach(letter => {
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

    // 强制重绘
    void progressBar.offsetWidth;
    void progressText.offsetWidth;

    setTimeout(() => {
        progressBar.style.transition = "width 0.3s ease";
        progressText.style.transition = "transform 0.2s ease";
    }, 50);

    // 更新UI元素
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
    document.querySelectorAll(".letter.selected").forEach(letter => {
        letter.classList.remove("selected");
    });
    elements.userInput.textContent = "";
    elements.message.textContent = "";
    selectedLetters = [];
}

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
    const difficultyName = elements.difficulty.options[elements.difficulty.selectedIndex].text;
    elements.levelDisplay.textContent = `${currentLevel.name} | ${difficultyName}`;
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
