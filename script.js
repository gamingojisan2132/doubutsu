const ingredients = {
  "バンズ": "#deb887",
  "パティ": "#5c4033",
  "レタス": "#9acd32",
  "ベーコン": "#d2691e",
  "トマト": "#ff6347",
  "チーズ": "#ffd700"
};

const tower = document.getElementById("tower-container");
const stack = document.getElementById("stack-container");
const guide = document.getElementById("guide-container");
const resultElem = document.getElementById("result");
const checkBtn = document.getElementById("check-button");
const timerElem = document.getElementById("timer");

const blockHeight = 40;
const maxHeight = 400;
const lineY = 320;
const normalSpeed = 1;
const fastSpeed = 3;
let scrollSpeed = normalSpeed;
let stackCount = 0;
let timeLeft = 45; // 制限時間を45秒に変更
const blocks = [];
let goal = [];

function generateGoal() {
  const names = Object.keys(ingredients);
  const innerLength = 4; // 中間の材料を4つに固定（変更）
  goal = ["バンズ"]; // 最初はバンズ
  for (let i = 0; i < innerLength; i++) {
    // バンズは上下のみなので、中間の具材はバンズ以外から選択
    const availableIngredients = names.filter(name => name !== "バンズ");
    goal.push(availableIngredients[Math.floor(Math.random() * availableIngredients.length)]);
  }
  goal.push("バンズ"); // 最後もバンズ
  guide.innerHTML = "";
  
  // ガイドのブロックサイズを小さく
  const guideBlockHeight = 30;
  const guideMaxHeight = 300;
  
  goal.forEach((item, i) => {
    const block = document.createElement("div");
    block.className = "guide-block";
    block.style.background = ingredients[item];
    block.textContent = item;
    block.style.top = `${guideMaxHeight - (i + 1) * guideBlockHeight}px`;
    guide.appendChild(block);
  });
}

function updateTimer() {
  timerElem.textContent = `⏱ 残り: ${timeLeft} 秒`;
  if (timeLeft <= 0) {
    resultElem.textContent = "⌛ タイムアップ！";
    window.removeEventListener("click", onGlobalClick);
    clearInterval(timerInterval);
  }
}

const timerInterval = setInterval(() => {
  timeLeft--;
  updateTimer();
}, 1000);

let isPressed = false;

tower.addEventListener("mousedown", () => {
  scrollSpeed = fastSpeed;
  isPressed = true;
});
tower.addEventListener("touchstart", () => {
  scrollSpeed = fastSpeed;
  isPressed = true;
});

window.addEventListener("mouseup", () => {
  scrollSpeed = normalSpeed;
  if (isPressed) {
    trySlide(); // ホールドから離した時もスライド判定
    isPressed = false;
  }
});
window.addEventListener("touchend", () => {
  scrollSpeed = normalSpeed;
  if (isPressed) {
    trySlide(); // ホールドから離した時もスライド判定
    isPressed = false;
  }
});

function trySlide() {
  const target = getHighlightedBlock();
  if (target) {
    const clone = document.createElement("div");
    clone.className = "stack-block animate";
    clone.style.background = target.style.background;
    clone.textContent = target.textContent;
    const top = maxHeight - (stackCount + 1) * blockHeight;
    clone.style.top = `${top}px`;
    stack.appendChild(clone);
    stackCount++;

    const removedTop = parseFloat(target.style.top);
    tower.removeChild(target);
    const index = blocks.indexOf(target);
    if (index !== -1) blocks.splice(index, 1);

    setTimeout(() => {
      for (let b of blocks) {
        const top = parseFloat(b.style.top);
        if (top < removedTop) {
          b.style.top = `${top + blockHeight}px`;
        }
      }
    }, 300); // 300msに延長

    if ((maxHeight - stackCount * blockHeight) < 0) {
      resetStack();
      return;
    }

    checkReachState(); // スタック更新後にリーチ状態をチェック
  }
}

function getHighlightedBlock() {
  const candidates = blocks.filter(block => {
    const top = parseFloat(block.style.top);
    const bottom = top + blockHeight;
    return bottom >= lineY && top <= lineY;
  });
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => parseFloat(a.style.top) > parseFloat(b.style.top) ? a : b);
}

function onGlobalClick(e) {
  if (!checkBtn.contains(e.target)) {
    trySlide();
  }
}

window.addEventListener("click", onGlobalClick);

function resetStack() {
  stack.innerHTML = "";
  stackCount = 0;
  resultElem.textContent = "";
  checkBtn.classList.remove("glow");
}

function checkReachState() {
  const stackBlocks = Array.from(stack.children);
  const sorted = stackBlocks.slice().sort((a, b) => parseFloat(b.style.top) - parseFloat(a.style.top));
  const stackItems = sorted.map(b => b.textContent);

  // ガイドから上のバンズを除いた部分と一致するかチェック
  const goalWithoutTopBun = goal.slice(0, -1);
  const isReach = matchesGuide(stackItems, goalWithoutTopBun);

  if (isReach) {
    checkBtn.classList.add("glow"); // リーチ状態でボタンを光らせる
  } else {
    checkBtn.classList.remove("glow");
  }
}

checkBtn.addEventListener("click", () => {
  const stackBlocks = Array.from(stack.children);
  const sorted = stackBlocks.slice().sort((a, b) => parseFloat(b.style.top) - parseFloat(a.style.top));
  const stackItems = sorted.map(b => b.textContent);

  const goalWithoutTopBun = goal.slice(0, -1); // 上のバンズを除いたガイド
  const isReach = matchesGuide(stackItems, goalWithoutTopBun);

  if (isReach) {
    // 上のバンズを追加
    const topBun = document.createElement("div");
    topBun.className = "stack-block animate";
    topBun.style.background = ingredients["バンズ"];
    topBun.textContent = "バンズ";
    const top = maxHeight - (stackCount + 1) * blockHeight;
    topBun.style.top = `${top}px`;
    stack.appendChild(topBun);
    stackCount++;

    // クリア処理
    resultElem.textContent = "🎉 クリア！";
    timeLeft += 15; // クリアで15秒追加
    updateTimer();
    
    // 完成したバーガーを見せてから消す
    setTimeout(() => {
      resetStack();
      generateGoal();
    }, 1200); // 1.2秒後に消す
  } else {
    resultElem.textContent = "❌ 不一致！";
  }
});

function matchesGuide(stackItems, guide) {
  // スタックの末尾がガイドと一致するかをチェック
  if (stackItems.length < guide.length) {
    return false; // スタックの長さがガイドより短いなら一致しない
  }
  
  // スタックの末尾部分を取得
  const stackEnd = stackItems.slice(-guide.length);
  
  // 末尾部分とガイドを比較
  for (let i = 0; i < guide.length; i++) {
    if (stackEnd[i] !== guide[i]) {
      return false;
    }
  }
  
  return true;
}

function spawnBlock(y = -blockHeight) {
  const names = Object.keys(ingredients);
  const item = names[Math.floor(Math.random() * names.length)];
  const block = document.createElement("div");
  block.className = "block";
  block.textContent = item;
  block.style.background = ingredients[item];
  block.style.top = `${y}px`;
  tower.appendChild(block);
  blocks.push(block);
}

for (let i = 0; i < 10; i++) {
  spawnBlock(i * blockHeight);
}

function animate() {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    let top = parseFloat(block.style.top);
    top += scrollSpeed;
    block.style.top = `${top}px`;

    const bottom = top + blockHeight;
    block.style.border = (bottom >= lineY && top <= lineY) ? "4px solid black" : "none";

    if (top >= maxHeight) {
      tower.removeChild(block);
      blocks.splice(i, 1);
    }
  }

  const highestTop = Math.min(...blocks.map(b => parseFloat(b.style.top)), 9999);
  if (highestTop > 0) {
    spawnBlock(highestTop - blockHeight);
  }

  requestAnimationFrame(animate);
}

generateGoal();
animate();
updateTimer(); // 初期タイマー表示