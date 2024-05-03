// アイテムのリストを取得
const items = [...document.querySelectorAll(".item")];

// ドラッグ開始イベントを定義
const handleDragStart = (e) => e.target.classList.add("dragging");

// ドラッグ終了イベントを定義
const handleDragEnd = (e) => e.target.classList.remove("dragging");

// アイテムにイベントを登録
for (const item of items) {
	item.addEventListener("dragstart", handleDragStart, false);
	item.addEventListener("dragend", handleDragEnd, false);
}

// 要素が重なった際のイベントを定義
const handleDragEnter = (e) => e.target.classList.add("over");

// 要素が離れた際のイベントを定義
const handleDragLeave = (e) => e.target.classList.remove("over");

// 要素が重なっている最中のイベントを定義
const handleDragOver = (e) => {
	// 要素が重なった際のブラウザ既定の処理を変更
	e.preventDefault();
};

// 要素がドロップされた際のイベントを定義
const handleDrop = (e) => {
	// 要素がドロップされた際のブラウザ既定の処理を変更
	e.preventDefault();
	e.target.classList.remove("over");
	alert("ok, dropped!!");
};

// ドロップ先のリストを取得
const boxes = [...document.querySelectorAll(".box")];

// ドロップ先にイベントを登録
for (const box of boxes) {
	box.addEventListener("dragenter", handleDragEnter, false);
	box.addEventListener("dragleave", handleDragLeave, false);
	box.addEventListener("dragover", handleDragOver, false);
	box.addEventListener("drop", handleDrop, false);
}
