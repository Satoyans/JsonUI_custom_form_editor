class dragManager {
	constructor() {
		this.dragOffset = { x: undefined, y: undefined };
		this.dragElement = undefined;

		document.addEventListener("mousedown", this.onMouseDown.bind(this), false);
		document.addEventListener("mouseup", this.onMouseUp.bind(this), false);
		document.addEventListener("mousemove", this.onMouseMove.bind(this), false);
	}

	/**
	 *
	 * @param {MouseEvent} ev
	 */
	onMouseDown(ev) {
		const target = ev.target;
		if (!target) return;
		if (![...target.classList.values()].includes("drag")) return;
		const offsetX = ev.pageX - target.offsetLeft;
		const offsetY = ev.pageY - target.offsetTop;
		this.dragOffset = { x: offsetX, y: offsetY };
		this.dragElement = target;
	}
	onMouseUp(ev) {
		this.dragElement = undefined;
	}
	onMouseMove(ev) {
		if (!this.dragElement) return;
		const x = ev.pageX - this.dragOffset.x;
		const y = ev.pageY - this.dragOffset.y;

		// 要素のスタイルと場所を変更
		this.dragElement.style.position = "absolute";
		this.dragElement.style.top = y + "px";
		this.dragElement.style.left = x + "px";
	}
}
