class editorManager {
	constructor() {
		this.setInitConfig();
		this.render();
		window.addEventListener("resize", () => this.reRenderTimer());

		const check_event_mode = (ev) => {
			let now_input_mode;
			if (ev.type.includes("mouse")) now_input_mode = "mouse";
			if (ev.type.includes("touch")) now_input_mode = "touch";
			if (this.input_mode === undefined) this.input_mode = now_input_mode;

			if (this.input_mode !== now_input_mode) return;
			const ev_type = ev.type;
			if (ev_type === "mousemove") this.onMouseMove(ev);
			if (ev_type === "mousedown") this.onMouseDown(ev);
			if (ev_type === "mouseup") this.onMouseUp(ev);
			if (ev_type === "touchstart") this.onTouchStart(ev);
		};

		document.addEventListener("mousedown", check_event_mode.bind(this), false);
		document.addEventListener("mouseup", check_event_mode.bind(this), false);
		document.addEventListener("mousemove", check_event_mode.bind(this), false);
		document.addEventListener("touchstart", check_event_mode.bind(this), false);
		// document.addEventListener("touchend", check_event_mode.bind(this), false);
		// document.addEventListener("touchmove", check_event_mode.bind(this), false);
	}

	setInitConfig() {
		this.ui_elements = [];
		this.dragOffset = { x: undefined, y: undefined };
		this.dragElement = undefined;
		this.selected_element_index = undefined;
		this.input_mode = undefined; //mouse or touch or undefined

		this.operation_past = [];
		this.operation_future = [];

		this.screen_offset_x = 0;
		this.screen_offset_y = 0;
		this.elementlist_offset_x = 0;
		this.elementlist_offset_y = 0;

		this.toolbar_mode = "select";

		this.toolbar_height_px = 50;
		this.toolbar_color = "#cad2de";

		this.screen_width_percent = 80; //windowに対しての値
		this.screen_width_px = 461; //デフォルトのマイクラ内の値
		this.screen_height_px = 225;
		this.screen_color = "#cccee0";

		this.controlpanel_color = "#a5a8ad";

		this.elementlist_height_px = 100;
		this.elementlist_color = "#a5a8ad";
	}
	reRenderTimer() {
		//サイズ変更
		if (this.input_mode === "touch") return;
		this.render_update_time = new Date().getTime();
		let save = this.render_update_time;
		setTimeout(() => {
			if (this.render_update_time === save) this.render(false);
		}, 50);
	}
	render(logger = true) {
		if (logger) {
			this.operation_past.push({
				ui_elements: JSON.parse(JSON.stringify(this.ui_elements)),
				selected_element_index: this.selected_element_index,
			});
			this.operation_future = [];
		}

		//bodyタグのmargin削除
		document.querySelector("body").style.margin = 0;

		const scroll_position_x = window.scrollX;
		const scroll_position_y = window.scrollY;

		//#body_divの子要素を全て削除
		const body = document.querySelector("#body_div");
		for (let child of [...body.children]) {
			body.removeChild(child);
		}

		if (this.input_mode !== "touch") {
			//タッチ以外の操作の変数
			this.screen_offset_x = 1 + 5; //border + margin
			this.screen_offset_y = this.toolbar_height_px + 1 * 2 + 5; //ツールバー + border * 2 + margin
			this.elementlist_offset_x = 1 + 5; //border + margin
			//elementlist_offset_yはスクリーン追加後に設定する
		} else {
			//タッチ操作の時の変数
			const elementlist_height = Math.floor(this.ui_elements.length / (Math.floor(window.innerWidth / 90) - 2) + 1) * 90;
			this.screen_offset_x = 1 + 5; //border + margin
			this.screen_offset_y = this.toolbar_height_px + elementlist_height + 1 * 4 + 5; //ツールバー + エレメントリスト + border * 4 + margin
			this.elementlist_offset_x = 1 + 5; //border + margin
			this.elementlist_offset_y = this.toolbar_height_px + 1 * 2; //ツールバー + border * 2
		}

		//ツールバー
		const toolbar_div = document.createElement("div");
		toolbar_div.style.width = "calc(100vw - 5px)";
		toolbar_div.style.height = `${this.toolbar_height_px}px`;
		toolbar_div.style.backgroundColor = this.toolbar_color;
		toolbar_div.style.border = "1px solid";
		toolbar_div.style.borderBottom = "none";
		toolbar_div.style.display = "flex";
		toolbar_div.style.zIndex = 10;
		toolbar_div.id = "toolbar";
		body.appendChild(toolbar_div);

		//ツールバー - セレクトボタン
		const toolbar_select_input = document.createElement("input");
		toolbar_select_input.type = "image";
		toolbar_select_input.src = "./src/img/select.png";
		toolbar_select_input.style.width = `${this.toolbar_height_px * 0.8}px`;
		toolbar_select_input.style.height = `${this.toolbar_height_px * 0.8}px`;
		toolbar_select_input.style.margin = `${this.toolbar_height_px * 0.1}px`;
		toolbar_select_input.style.padding = `${this.toolbar_height_px * 0.02}px`;
		toolbar_select_input.style.backgroundSize = "80% 80%";
		toolbar_select_input.style.backgroundPosition = "center";
		toolbar_select_input.style.border = "1px solid";
		toolbar_select_input.style.borderColor = this.toolbar_mode === "select" ? "red" : "gray";
		toolbar_select_input.style.zIndex = 10;
		toolbar_select_input.id = "toolbar_select_input";
		toolbar_select_input.alt = "選択モードへ切り替え";
		toolbar_select_input.onclick = (ev) => {
			[...ev.target.parentElement.children].map((x) => {
				if (x.style.borderColor === "red") x.style.borderColor = "gray";
			});
			ev.target.style.borderColor = "red";
			//ここまで共通
			this.toolbar_mode = "select";
		};
		toolbar_div.appendChild(toolbar_select_input);

		//ツールバー - 移動ボタン
		const toolbar_move_input = document.createElement("input");
		toolbar_move_input.type = "image";
		toolbar_move_input.src = "./src/img/move.png";
		toolbar_move_input.style.width = `${this.toolbar_height_px * 0.8}px`;
		toolbar_move_input.style.height = `${this.toolbar_height_px * 0.8}px`;
		toolbar_move_input.style.margin = `${this.toolbar_height_px * 0.1}px`;
		toolbar_move_input.style.border = "1px solid";
		toolbar_move_input.style.zIndex = 10;
		toolbar_move_input.style.borderColor = this.toolbar_mode === "move" ? "red" : "gray";
		toolbar_move_input.id = "toolbar_move_input";
		toolbar_move_input.alt = "移動モードへ切り替え";
		toolbar_move_input.onclick = (ev) => {
			[...ev.target.parentElement.children].map((x) => {
				if (x.style.borderColor === "red") x.style.borderColor = "gray";
			});
			ev.target.style.borderColor = "red";
			//ここまで共通
			this.toolbar_mode = "move";
		};
		toolbar_div.appendChild(toolbar_move_input);

		//パディング
		const toolbar_padding = document.createElement("div");
		toolbar_padding.style.width = "0px";
		toolbar_padding.style.height = `${this.toolbar_height_px * 0.8}px`;
		toolbar_padding.style.marginTop = `${this.toolbar_height_px * 0.1}px`;
		toolbar_padding.style.borderLeft = "2px dashed";
		toolbar_div.appendChild(toolbar_padding);

		//ツールバー - 追加ボタン
		const toolbar_add_input = document.createElement("input");
		toolbar_add_input.type = "image";
		toolbar_add_input.src = "./src/img/add.png";
		toolbar_add_input.style.width = `${this.toolbar_height_px * 0.8}px`;
		toolbar_add_input.style.height = `${this.toolbar_height_px * 0.8}px`;
		toolbar_add_input.style.margin = `${this.toolbar_height_px * 0.1}px`;
		toolbar_add_input.style.border = "1px solid";
		toolbar_add_input.style.zIndex = 10;
		toolbar_add_input.alt = "要素追加";
		toolbar_add_input.id = "toolbar_add_input";
		toolbar_add_input.onclick = () => this.addUIElement();
		toolbar_div.appendChild(toolbar_add_input);

		//ツールバー - undo
		const toolbar_undo_input = document.createElement("input");
		toolbar_undo_input.type = "image";
		toolbar_undo_input.src = "./src/img/undo.png";
		toolbar_undo_input.style.width = `${this.toolbar_height_px * 0.8}px`;
		toolbar_undo_input.style.height = `${this.toolbar_height_px * 0.8}px`;
		toolbar_undo_input.style.margin = `${this.toolbar_height_px * 0.1}px`;
		toolbar_undo_input.style.border = "1px solid";
		toolbar_undo_input.style.zIndex = 10;
		toolbar_undo_input.alt = "undo";
		toolbar_undo_input.id = "toolbar_undo_input";
		toolbar_undo_input.onclick = () => this.undo();
		toolbar_div.appendChild(toolbar_undo_input);

		//ツールバー - redo
		const toolbar_redo_input = document.createElement("input");
		toolbar_redo_input.type = "image";
		toolbar_redo_input.src = "./src/img/redo.png";
		toolbar_redo_input.style.width = `${this.toolbar_height_px * 0.8}px`;
		toolbar_redo_input.style.height = `${this.toolbar_height_px * 0.8}px`;
		toolbar_redo_input.style.margin = `${this.toolbar_height_px * 0.1}px`;
		toolbar_redo_input.style.border = "1px solid";
		toolbar_redo_input.style.zIndex = 10;
		toolbar_redo_input.alt = "redo";
		toolbar_redo_input.id = "toolbar_redo_input";
		toolbar_redo_input.onclick = () => this.redo();
		toolbar_div.appendChild(toolbar_redo_input);

		//ツールバー - github
		const toolbar_github_input = document.createElement("input");
		toolbar_github_input.type = "image";
		toolbar_github_input.src = "./src/img/github-mark.png";
		toolbar_github_input.style.width = `${this.toolbar_height_px * 0.8}px`;
		toolbar_github_input.style.height = `${this.toolbar_height_px * 0.8}px`;
		toolbar_github_input.style.margin = `${this.toolbar_height_px * 0.1}px`;
		toolbar_github_input.style.border = "1px solid";
		toolbar_github_input.style.zIndex = 10;
		toolbar_github_input.style.marginLeft = "auto";
		toolbar_github_input.alt = "github-link";
		toolbar_github_input.id = "toolbar_github_input";
		toolbar_github_input.onclick = () => window.open("https://github.com/Satoyans/JsonUI_custom_form_editor");
		toolbar_div.appendChild(toolbar_github_input);

		//中央のフレックスDiv
		const center_flex_div = document.createElement("div");
		center_flex_div.style.width = "calc(100vw - 5px)";
		center_flex_div.style.height = "max-content";
		center_flex_div.style.display = "flex";
		center_flex_div.style.border = "1px solid";
		center_flex_div.style.borderBottom = "none";
		center_flex_div.style.zIndex = this.ui_elements.length * -1 - 101;
		center_flex_div.id = "center_flex_div";
		body.appendChild(center_flex_div);

		//スクリーン
		const screen_scale = ((window.innerWidth * this.screen_width_percent) / 100 / this.screen_width_px).toFixed(2);

		const screen_div = document.createElement("div");
		screen_div.style.width = `${this.screen_width_px * screen_scale}px`;
		screen_div.style.height = `${this.screen_height_px * screen_scale}px`;
		screen_div.style.margin = "5px";
		screen_div.style.backgroundColor = this.screen_color;
		screen_div.id = "screen";
		center_flex_div.appendChild(screen_div);

		//コントロールパネル
		const controlpanel_div = document.createElement("div");
		controlpanel_div.style.backgroundColor = this.controlpanel_color;
		controlpanel_div.style.flexGrow = 1;
		controlpanel_div.style.borderLeft = "1px solid";
		controlpanel_div.style.marginLeft = "auto";
		controlpanel_div.id = "controlpanel";
		controlpanel_div.style.width = `${((this.screen_width_px * screen_scale) / 0.8) * 0.2}px`;
		center_flex_div.appendChild(controlpanel_div);

		const controlpanel_title_h2 = document.createElement("h2");
		controlpanel_title_h2.textContent = `設定`;
		controlpanel_title_h2.id = "controlpanel_title_h2";
		controlpanel_div.appendChild(controlpanel_title_h2);

		//コントロールパネルの中身
		const selected_element_data = this.ui_elements[this.selected_element_index];
		if (selected_element_data) {
			const controlpanel_input_div = document.createElement("div");

			let element_data_index = this.ui_elements.indexOf(selected_element_data);
			controlpanel_input_div.innerHTML = `
			<button id="controlpanel_delete_button">削除</button>
			<button id="controlpanel_copy_button">コピー</button>
			<p>index: ${element_data_index}</p>
			<p>size_w: <input type="text" value=${selected_element_data.w} id="size_w"></p>
			<p>size_h: <input type="text" value=${selected_element_data.h} id="size_h"></p>
			<p>offset_x: <input type="text" value=${selected_element_data.x} id="offset_x"></p>
			<p>offset_y: <input type="text" value=${selected_element_data.y} id="offset_y"></p>
			<p>text: <input type="text" value="${selected_element_data.text}" id="text"></p>
			<p>image_path: <input type="text" value="${selected_element_data.image}" id="image_path"></p>
			
			<p>テキストを表示するか: <input type="checkbox" ${selected_element_data.is_show_text ? "checked" : ""} id="is_show_text" /></p>
			<p>画像を表示するか: <input type="checkbox" ${selected_element_data.is_show_image ? "checked" : ""} id="is_show_image" /></p>
			<p>ボタンを表示するか: <input type="checkbox" ${selected_element_data.is_show_button ? "checked" : ""} id="is_show_button" /></p>
			<button id="controlpanel_update_button" index=${element_data_index}>更新</button>
			`;
			controlpanel_input_div.querySelector("#controlpanel_delete_button").onclick = (ev) => {
				this.ui_elements.splice(element_data_index, 1);
				this.selected_element_index = undefined;
				this.render();
			};
			controlpanel_input_div.querySelector("#controlpanel_update_button").onclick = (ev) => {
				this.updateElement(ev);
			};
			controlpanel_input_div.querySelector("#controlpanel_copy_button").onclick = (ev) => {
				this.copyElement(ev);
			};
			controlpanel_div.appendChild(controlpanel_input_div);
		} else {
			const controlpanel_input_div = document.createElement("div");
			controlpanel_input_div.innerHTML = `
			<p>スクリーン</p>
			<p>※サイズを変更する場合は'ui/server_form.json'を書き換え</p>
			<p>("size": [475, 255]からタイトル分で[-14,-10]され、上下10pxずつ減った?値になるみたいです。)</p>
			<p>size_x<input type="text" value=${this.screen_width_px} id="size_x"></p>
			<p>size_y<input type="text" value=${this.screen_height_px} id="size_y"></p>
			<button id="controlpanel_update_button" index="screen">更新</button>
			`;
			controlpanel_input_div.querySelector("#controlpanel_update_button").onclick = (ev) => {
				this.updateElement(ev);
			};
			controlpanel_div.appendChild(controlpanel_input_div);
		}

		if (this.input_mode !== "touch") this.elementlist_offset_y = this.toolbar_height_px + 1 * 2 + center_flex_div.offsetHeight; //ツールバー + border * 2 + 中央のdiv

		//エレメントリスト
		const elementlist_div = document.createElement("div");
		elementlist_div.style.backgroundColor = this.elementlist_color;
		elementlist_div.style.width = "calc(100vw - 5px)";
		elementlist_div.style.height = Math.floor(this.ui_elements.length / (Math.floor(window.innerWidth / 90) - 2) + 1) * 90 + "px";
		elementlist_div.style.border = "1px solid";
		elementlist_div.id = "elementlist";
		if (this.input_mode !== "touch") body.appendChild(elementlist_div);
		else body.insertBefore(elementlist_div, center_flex_div);

		//エレメントリストの中身生成

		//0番パディング追加
		const padding_div = document.createElement("div");
		padding_div.classList.add("elementlist_padding");
		padding_div.setAttribute("padding_index", 0);
		padding_div.style.position = "absolute";
		padding_div.style.top = this.elementlist_offset_y + "px";
		padding_div.style.left = this.elementlist_offset_x + 30 - 10 + "px";
		padding_div.style.width = 10 + "px";
		padding_div.style.height = 80 + "px";
		elementlist_div.appendChild(padding_div);

		for (let index_ in this.ui_elements) {
			const index = Number(index_);
			const element_data = this.ui_elements[index];
			let element_div = document.createElement("div");
			const max_grid_x = Math.floor(window.innerWidth / 90) - 2;
			const grid_index_x = index % max_grid_x;
			const grid_index_y = Math.floor(index / max_grid_x);

			element_div.style.position = "absolute";
			element_div.style.top = grid_index_y * 80 + this.elementlist_offset_y + "px";
			element_div.style.left = grid_index_x * 90 + this.elementlist_offset_x + 30 + "px";
			element_div.style.width = 80 - 2 + "px";
			element_div.style.height = 80 - 2 + "px";
			element_div.style.border = "1px solid";
			element_div.style.zIndex = 10;
			element_div.setAttribute("index", this.getElementIndexFromId(element_data.id));
			element_div.classList.add("elementlist");
			if (this.getElementIndexFromId(element_data.id) === this.selected_element_index) element_div.style.borderColor = "red";
			const innerHTML_list = [];
			if (element_data.is_show_image)
				innerHTML_list.push(
					`<img alt="${element_data.image}" style="pointer-events: none;height: 100%;width: 100%;position: absolute;" src="./${element_data.image}">`
				);
			if (element_data.is_show_text)
				innerHTML_list.push(
					`<a style="text-align:center;line-height:80px;margin:0;pointer-events: none;position: absolute;width: 100%;">${element_data.text}</a>`
				);
			innerHTML_list.push(`<a style="margin:0;pointer-events: none;position: absolute;width: 100%;">${index}</a>`);
			if (element_data.is_show_button) element_div.style.backgroundColor = "white";
			element_div.innerHTML = [...innerHTML_list].join("");
			elementlist_div.appendChild(element_div);

			//パディング
			const padding_div = document.createElement("div");
			padding_div.classList.add("elementlist_padding");
			padding_div.setAttribute("padding_index", index + 1);
			padding_div.style.position = "absolute";
			padding_div.style.top = grid_index_y * 80 + this.elementlist_offset_y + "px";
			padding_div.style.left = (grid_index_x + 1) * 90 + this.elementlist_offset_x + 30 - 10 + "px";
			padding_div.style.width = 10 + "px";
			padding_div.style.height = 80 + "px";
			elementlist_div.appendChild(padding_div);
		}

		//エレメント生成
		for (let element_data of this.ui_elements) {
			let element_div = document.createElement("div");
			element_div.style.position = "absolute";
			element_div.style.top = element_data.y * screen_scale + this.screen_offset_y + "px";
			element_div.style.left = element_data.x * screen_scale + this.screen_offset_x + "px";
			element_div.style.width = element_data.w * screen_scale - 2 + "px";
			element_div.style.height = element_data.h * screen_scale - 2 + "px";
			element_div.style.border = "1px solid";
			element_div.setAttribute("index", this.getElementIndexFromId(element_data.id));
			element_div.classList.add("ui_element");
			if (this.getElementIndexFromId(element_data.id) === this.selected_element_index) element_div.style.borderColor = "red";
			const innerHTML_list = [];

			if (element_data.is_show_image)
				innerHTML_list.push(`<img style="pointer-events: none;height: 100%;width: 100%;position: absolute;" src="./${element_data.image}">`);
			if (element_data.is_show_text)
				innerHTML_list.push(
					`<a style="text-align:center;line-height:${
						element_data.h * screen_scale - 2 + "px"
					};margin:0;pointer-events: none;position: absolute;width: 100%;">${element_data.text}</a>`
				);
			if (element_data.is_show_button) element_div.style.backgroundColor = "white";
			element_div.innerHTML = [...innerHTML_list].join("");
			screen_div.appendChild(element_div);
		}

		//ロードボタン追加
		const load_button = document.createElement("button");
		load_button.id = "load";
		load_button.textContent = "ロード";
		load_button.onclick = this.load_button_onClick.bind(this);
		body.appendChild(load_button);

		//コード出力エリア追加
		const output_textarera = document.createElement("textarea");
		output_textarera.id = "output";
		output_textarera.value = JSON.stringify(this.encode(), null, 2);
		output_textarera.style.width = "calc(100vw - 5px)";
		let font_size = 12;
		output_textarera.style.fontSize = font_size + "px";
		let heigth_line = 0;
		if (output_textarera.value.match(/\n/g)) heigth_line = output_textarera.value.match(/\n/g).length * font_size + font_size;
		if (heigth_line < font_size * 5) heigth_line = font_size * 5;

		output_textarera.style.height = heigth_line + "px";
		output_textarera.addEventListener("focus", (ev) => ev.target.select());
		body.appendChild(output_textarera);

		//スクロール設定
		window.scroll({ left: scroll_position_x, top: scroll_position_y });
	}

	undo() {
		if (this.operation_past.length <= 1) return;
		this.operation_future.push(this.operation_past[this.operation_past.length - 1]);
		this.operation_past.pop();
		this.ui_elements = this.operation_past[this.operation_past.length - 1].ui_elements;
		this.selected_element_index = this.operation_past[this.operation_past.length - 1].selected_element_index;
		this.render(false);
	}

	redo() {
		if (this.operation_future.length === 0) return;

		this.operation_past.push(this.operation_future[this.operation_future.length - 1]);
		this.ui_elements = this.operation_future[this.operation_future.length - 1].ui_elements;
		this.selected_element_index = this.operation_future[this.operation_future.length - 1].selected_element_index;
		this.operation_future.pop();
		this.render(false);
	}

	load_button_onClick(ev) {
		const text = document.querySelector("#output").value;
		this.ui_elements = this.decode(text);
		this.render();
	}
	getTextLength = (text) => {
		let all_count = 0;
		for (let char of [...text.split("")]) {
			const code_point_num = char.codePointAt(0);
			if (!code_point_num) continue;
			let now_count = 1;
			if (code_point_num >= 128) now_count += 1;
			if (code_point_num >= 2048) now_count += 1;
			if (code_point_num >= 65536) now_count += 1;
			all_count += now_count;
		}
		return all_count;
	};
	encode() {
		//this.ui_element => text

		const fill_to_length = (text, length, char = ";") => {
			if (this.getTextLength(text) < length) return fill_to_length(`${char}${text}`, length, char);
			return text;
		};
		const data2sendText = (...data) => {
			const max_text_length = Math.max(...data.map((x) => this.getTextLength(x)));
			let send_text = `${String(max_text_length).length}${max_text_length}`;
			for (let text of data) {
				send_text += fill_to_length(text, max_text_length);
			}
			return send_text;
		};
		const data2sendText_inside = (...data) => {
			const fill_to_length2 = (text, length, isminus = false) => {
				if (this.getTextLength(text) < length) return fill_to_length2(`0${text}`, length, isminus);
				if (isminus) {
					let split_text = text.split("");
					split_text[0] = "-";
					return split_text.join("");
				}
				return text;
			};
			const max_text_length = Math.max(...data.map((x) => this.getTextLength(x)));
			let send_text = `${String(max_text_length).length}${max_text_length}`;
			for (let text of data) {
				send_text += fill_to_length2(text.replace("-", "0"), max_text_length, text[0] === "-");
			}
			return send_text;
		};
		const output_obj = [];
		let count = 0;
		for (let ui_element of this.ui_elements) {
			count += 1;
			const { id, x, y, w, h, is_show_button, is_show_image, is_show_text, text, image } = ui_element;
			let data1 = "";
			if (is_show_text) data1 += "text";
			if (is_show_image) data1 += "image";
			if (is_show_button) data1 += "button";
			let data2 = text;
			let data3_temp = [`${w}`, `${h}`, `${x - count}`, `${y - 1}`];
			let data3 = data2sendText_inside(...data3_temp);
			let send_text = data2sendText(data1, data2, data3);
			output_obj.push({ text: send_text, image });
		}
		return output_obj;
	}

	decode(text) {
		//text => this.ui_element
		try {
			const raw_obj = JSON.parse(text);
			const need_keys = ["text", "image"];
			const return_obj = [];
			//keyチェック
			for (let element_data of raw_obj) {
				let flag = 0;
				for (let need_key of need_keys) {
					if (Object.keys(element_data).includes(need_key)) flag += 1;
				}
				//key過多は無視する
				if (need_keys.length > flag) throw new Error("keyが不足しています\n" + JSON.stringify(element_data));
			}

			//text解析
			let count = 0;
			for (let element_data of raw_obj) {
				count += 1;
				const raw_text = element_data.text;
				const field_length_length = Number(raw_text.slice(0, 1));
				const field_length = Number(raw_text.slice(1, field_length_length + 1));
				const prefix_length = 1 + field_length_length;
				const field_string = raw_text.slice(prefix_length);
				const cut = (field_string, field_length, index) => {
					let count = 0;
					let pre = "";
					let text = "";
					while (count < field_length * (index - 1) + 1) {
						pre = field_string.slice(0, count);
						if (this.getTextLength(pre) >= field_length * (index - 1)) break;
						count += 1;
					}
					count = 0;
					while (count < field_length + 1) {
						text = field_string.slice(pre.length, pre.length + count);
						if (this.getTextLength(text) >= field_length) break;
						count += 1;
					}
					return text.replace(/;/g, "");
				};
				const field1 = cut(field_string, field_length, 1);
				const field2 = cut(field_string, field_length, 2);
				const field3 = cut(field_string, field_length, 3);

				const is_show_text = field1.includes("text");
				const is_show_image = field1.includes("image");
				const is_show_button = field1.includes("button");

				const text = field2;

				const field3_field_length_length = Number(field3.slice(0, 1));
				const field3_field_length = Number(field3.slice(1, field3_field_length_length + 1));
				const field3_prefix_length = 1 + field3_field_length_length;
				const field3_field_string = field3.slice(field3_prefix_length);
				const w = Number(cut(field3_field_string, field3_field_length, 1));
				const h = Number(cut(field3_field_string, field3_field_length, 2));
				const x = Number(cut(field3_field_string, field3_field_length, 3)) + count;
				const y = Number(cut(field3_field_string, field3_field_length, 4)) + 1;

				let id = new Date().getTime();
				while (return_obj.filter((x) => x.id === id).length !== 0) {
					id += 1;
				}
				const image = element_data.image;
				return_obj.push({ id, text, image, x, y, w, h, is_show_text, is_show_image, is_show_button });
			}
			return return_obj;
		} catch (e) {
			window.alert(e);
			return [];
		}
	}

	updateElement(ev) {
		const target = ev.target;

		if (target.getAttribute("index") === "screen") {
			let update_flag = false;
			const inputs = [...target.parentElement.querySelectorAll("input")];
			for (let input of inputs) {
				if (input.id === "size_x") {
					const num_value = Number(input.value);
					if (num_value === this.screen_width_px) continue;
					if (Number.isNaN(num_value)) return window.alert("size_xの値が数値ではありません");
					if (num_value % 1 !== 0) return window.alert("size_xの値が整数値ではありません");
					this.screen_width_px = Math.floor(num_value);
					update_flag = true;
				}
				if (input.id === "size_y") {
					const num_value = Number(input.value);
					if (num_value === this.screen_height_px) continue;
					if (Number.isNaN(num_value)) return window.alert("size_yの値が数値ではありません");
					if (num_value % 1 !== 0) return window.alert("size_yの値が整数値ではありません");
					this.screen_height_px = Math.floor(num_value);
					update_flag = true;
				}
			}
			if (update_flag) this.render();
			return;
		}

		//スクリーン以外の時
		const element_data = this.ui_elements[Number(target.getAttribute("index"))];
		const inputs = [...target.parentElement.querySelectorAll("input")];
		let update_flag = false;
		for (let input of inputs) {
			if (input.id === "size_w") {
				const num_value = Number(input.value);
				if (num_value === element_data.w) continue;
				if (Number.isNaN(num_value)) return window.alert("size_wの値が数値ではありません");
				if (num_value % 1 !== 0) return window.alert("size_wの値が整数値ではありません");
				element_data.w = Math.floor(num_value);
				update_flag = true;
			}
			if (input.id === "size_h") {
				const num_value = Number(input.value);
				if (num_value === element_data.h) continue;
				if (Number.isNaN(num_value)) return window.alert("size_hの値が数値ではありません");
				if (num_value % 1 !== 0) return window.alert("size_hの値が整数値ではありません");
				element_data.h = Math.floor(num_value);
				update_flag = true;
			}
			if (input.id === "offset_x") {
				const num_value = Number(input.value);
				if (num_value === element_data.x) continue;
				if (Number.isNaN(num_value)) return window.alert("offset_xの値が数値ではありません");
				if (num_value % 1 !== 0) return window.alert("offset_xの値が整数値ではありません");
				element_data.x = Math.floor(num_value);
				update_flag = true;
			}
			if (input.id === "offset_y") {
				const num_value = Number(input.value);
				if (num_value === element_data.y) continue;
				if (Number.isNaN(num_value)) return window.alert("offset_yの値が数値ではありません");
				if (num_value % 1 !== 0) return window.alert("offset_yの値が整数値ではありません");
				element_data.y = Math.floor(num_value);
				update_flag = true;
			}
			if (input.id === "text") {
				if (input.value === element_data.text) continue;
				element_data.text = input.value;
				update_flag = true;
			}
			if (input.id === "image_path") {
				if (input.value === element_data.image) continue;
				element_data.image = input.value;
				update_flag = true;
			}

			if (input.id === "is_show_text") {
				if (input.checked === element_data.is_show_text) continue;
				element_data.is_show_text = input.checked;
				update_flag = true;
			}
			if (input.id === "is_show_image") {
				if (input.checked === element_data.is_show_image) continue;
				element_data.is_show_image = input.checked;
				update_flag = true;
			}
			if (input.id === "is_show_button") {
				if (input.checked === element_data.is_show_button) continue;
				element_data.is_show_button = input.checked;
				update_flag = true;
			}
		}
		if (update_flag) this.render();
		return;
	}

	getElementIndexFromId(id) {
		let element = this.ui_elements.filter((x) => x.id === id)[0];
		if (!element) return undefined;
		return this.ui_elements.indexOf(element);
	}

	copyElement(ev) {
		const element_data = this.ui_elements[this.selected_element_index];
		const element_data_copy = JSON.parse(JSON.stringify(element_data));
		element_data_copy.id = new Date().getTime();
		this.ui_elements.push(element_data_copy);
		this.selected_element_index = this.ui_elements.length - 1;
		this.render();
	}

	addUIElement() {
		let id = `${new Date().getTime()}`;
		let text = `element${this.ui_elements.length}`;
		let element = {
			id,
			x: 0,
			y: 0,
			w: 30,
			h: 30,
			is_show_button: false,
			is_show_image: false,
			is_show_text: true,
			text,
			image: "",
		};
		this.ui_elements.push(element);
		this.selected_element_index = this.ui_elements.length - 1;
		this.render();
	}

	arrayMoveAt(array, index, at) {
		if (index === at || index > array.length - 1 || at > array.length - 1) {
			return array;
		}

		const value = array[index];
		const tail = array.slice(index + 1);

		array.splice(index);

		Array.prototype.push.apply(array, tail);

		array.splice(at, 0, value);

		return array;
	}

	onMouseDown(ev) {
		const target = ev.target;
		if (!target) return;
		const classList = [...target.classList.values()];
		if (target.id === "screen" && this.toolbar_mode === "select") {
			if (this.selected_element_index === undefined) return;
			this.selected_element_index = undefined;
			this.render();
			return;
		}
		if (classList.includes("ui_element")) {
			if (this.toolbar_mode === "move") {
				const selected_element = document.querySelector("#screen").querySelector(`div.ui_element[index="${this.selected_element_index}"]`);
				if (!selected_element) return; //起きないはず
				const offsetX = ev.pageX - selected_element.offsetLeft;
				const offsetY = ev.pageY - selected_element.offsetTop;
				if (offsetX < 0 || selected_element.offsetWidth < offsetX) return;
				if (offsetY < 0 || selected_element.offsetHeight < offsetY) return;
				this.dragOffset = { x: offsetX, y: offsetY };
				this.dragElement = selected_element;
			}
			if (this.toolbar_mode === "select") {
				const target_element_index = Number(target.getAttribute("index"));
				if (this.selected_element_index !== target_element_index) this.selected_element_index = target_element_index;
				else this.selected_element_index = undefined;
				this.render();
			}
			return;
		}
		if (classList.includes("elementlist")) {
			const target_element_index = Number(target.getAttribute("index"));
			if (this.selected_element_index !== target_element_index) {
				//選択中のアイテムとそのエレメントが
				//違うなら選択
				this.selected_element_index = target_element_index;
				this.render();
			} else {
				//一緒ならドラッグ
				const offsetX = ev.pageX - target.offsetLeft;
				const offsetY = ev.pageY - target.offsetTop;
				this.dragOffset = { x: offsetX, y: offsetY };
				this.dragElement = target;
				//パディングを色づける
				let element_data_index = Number(target.getAttribute("index"));
				document.querySelectorAll(".elementlist_padding").forEach((e) => {
					const padding_index = Number(e.getAttribute("padding_index"));
					if (element_data_index === padding_index || element_data_index + 1 === padding_index) return;
					e.classList.add("elementlist_dragging");
				});
			}
			return;
		}
	}
	onMouseUp(ev) {
		if (!this.dragElement) return;

		const classList = [...this.dragElement.classList.values()];
		if (classList.includes("ui_element")) {
			const screen_scale = (window.innerWidth * this.screen_width_percent) / 100 / this.screen_width_px;
			let element_data = this.ui_elements[Number(this.dragElement.getAttribute("index"))];
			if (!element_data) return (this.dragElement = undefined);
			this.ui_elements[this.ui_elements.indexOf(element_data)].x = Number(
				((Number(this.dragElement.style.left.replace("px", "")) - this.screen_offset_x) / screen_scale).toFixed(0)
			);
			this.ui_elements[this.ui_elements.indexOf(element_data)].y = Number(
				((Number(this.dragElement.style.top.replace("px", "")) - this.screen_offset_y) / screen_scale).toFixed(0)
			);
			this.dragElement = undefined;
			this.render();
		}
		if (classList.includes("elementlist")) {
			//ドラッグしたところにパディングがあるかを調べる
			const mouseX = ev.pageX;
			const mouseY = ev.pageY;
			document.querySelectorAll("div.elementlist_padding.elementlist_dragging").forEach((e) => {
				const elementX = Number(e.style.left.replace("px", ""));
				const elementY = Number(e.style.top.replace("px", ""));
				if (mouseX < elementX || elementX + e.offsetWidth < mouseX) return;
				if (mouseY < elementY || elementY + e.offsetHeight < mouseY) return;
				const padding_index = Number(e.getAttribute("padding_index"));
				const ui_element_index = Number(this.dragElement.getAttribute("index"));
				if (ui_element_index < padding_index) {
					//前から後ろへ
					this.ui_elements = this.arrayMoveAt(this.ui_elements, ui_element_index, padding_index - 1);
					this.selected_element_index = padding_index - 1;
				} else {
					//後ろから前へ
					this.ui_elements = this.arrayMoveAt(this.ui_elements, ui_element_index, padding_index);
					this.selected_element_index = padding_index;
				}
			});
			this.dragElement = undefined;
			this.render();
		}
	}
	onMouseMove(ev) {
		if (!this.dragElement) return;
		const classList = [...this.dragElement.classList.values()];
		let x = ev.pageX - this.dragOffset.x;
		let y = ev.pageY - this.dragOffset.y;
		const element_w = Number(this.dragElement.style.width.replace("px", ""));
		const element_h = Number(this.dragElement.style.height.replace("px", ""));

		if (classList.includes("elementlist")) {
			const elementlist_size_x = window.innerWidth;
			const elementlist_size_y = Math.floor(this.ui_elements.length / (Math.floor(window.innerWidth / 90) - 2) + 1) * 90;
			if (x < this.elementlist_offset_x) x = this.elementlist_offset_x;
			if (this.elementlist_offset_x + elementlist_size_x < x + this.dragElement.offsetWidth)
				x = this.elementlist_offset_x + elementlist_size_x - this.dragElement.offsetWidth;
			if (y < this.elementlist_offset_y) y = this.elementlist_offset_y;
			if (this.elementlist_offset_y + elementlist_size_y < y + this.dragElement.offsetHeight)
				y = this.elementlist_offset_y + elementlist_size_y - this.dragElement.offsetHeight;
		}
		if (classList.includes("ui_element")) {
			const screen_scale = (window.innerWidth * this.screen_width_percent) / 100 / this.screen_width_px;
			const screen_size_x = this.screen_width_px * screen_scale;
			const screen_size_y = this.screen_height_px * screen_scale;
			if (x < this.screen_offset_x - element_w) x = this.screen_offset_x - element_w;
			if (this.screen_offset_x + screen_size_x < x) x = this.screen_offset_x + screen_size_x;
			if (y < this.screen_offset_y - element_h) y = this.screen_offset_y - element_h;
			if (this.screen_offset_y + screen_size_y < y) y = this.screen_offset_y + screen_size_y;
		}

		// 要素のスタイルと場所を変更
		this.dragElement.style.position = "absolute";
		this.dragElement.style.top = y + "px";
		this.dragElement.style.left = x + "px";
	}

	onTouchStart(ev) {
		const target = ev.target;
		if (!target) return;
		const classList = [...target.classList.values()];

		//selectモードの時の挙動
		if (this.toolbar_mode === "select") {
			//スクリーンをクリックしたとき
			if (target.id === "screen") {
				if (this.selected_element_index === undefined) return;
				this.selected_element_index = undefined;
				this.render();
				return;
			}
			//ui_elementをクリックしたとき
			if (classList.includes("ui_element")) {
				const target_element_index = Number(target.getAttribute("index"));
				if (this.selected_element_index !== target_element_index) this.selected_element_index = target_element_index;
				else this.selected_element_index = undefined;
				this.render();
				return;
			}
		}
		//moveモードの時,screenをクリックしたら移動
		if (this.toolbar_mode === "move" && this.selected_element_index !== undefined && target.id === "screen") {
			const changedTouch = ev.changedTouches[ev.changedTouches.length - 1];
			const moveElement = document.querySelector(`div.ui_element[index="${this.selected_element_index}"]`);
			const element_w = Number(moveElement.style.width.replace("px", ""));
			const element_h = Number(moveElement.style.height.replace("px", ""));

			let click_x = changedTouch.pageX;
			let click_y = changedTouch.pageY;
			const screen_scale = (window.innerWidth * this.screen_width_percent) / 100 / this.screen_width_px;
			const screen_size_x = this.screen_width_px * screen_scale;
			const screen_size_y = this.screen_height_px * screen_scale;
			if (click_x < this.screen_offset_x - element_w / 2) click_x = this.screen_offset_x - element_w / 2;
			if (this.screen_offset_x + screen_size_x + element_w / 2 < click_x) click_x = this.screen_offset_x + screen_size_x + element_w / 2;
			if (click_y < this.screen_offset_y - element_h / 2) click_y = this.screen_offset_y - element_h / 2;
			if (this.screen_offset_y + screen_size_y + element_h / 2 < click_y) click_y = this.screen_offset_y + screen_size_y + element_h / 2;

			// 要素のスタイルと場所を変更
			moveElement.style.position = "absolute";
			moveElement.style.top = click_y - element_h / 2 + "px";
			moveElement.style.left = click_x - element_w / 2 + "px";

			this.ui_elements[this.selected_element_index].x = ((click_x - element_w / 2 - this.screen_offset_x) / screen_scale).toFixed(0);
			this.ui_elements[this.selected_element_index].y = ((click_y - element_h / 2 - this.screen_offset_y) / screen_scale).toFixed(0);
			this.render();
			return;
		}

		if (classList.includes("elementlist")) {
			const target_element_index = Number(target.getAttribute("index"));
			if (this.selected_element_index !== target_element_index) {
				//選択中のアイテムとそのエレメントが
				//違うなら選択
				this.selected_element_index = target_element_index;
				this.render();
				return;
			} else {
				//一緒ならパディングを色づける
				document.querySelectorAll(".elementlist_padding").forEach((e) => {
					const padding_index = Number(e.getAttribute("padding_index"));
					if (target_element_index === padding_index || target_element_index + 1 === padding_index) return;
					e.classList.add("elementlist_dragging");
				});
				return;
			}
		}
		if (classList.includes("elementlist_dragging")) {
			const padding_index = Number(target.getAttribute("padding_index"));
			const ui_element_index = this.selected_element_index;
			if (ui_element_index < padding_index) {
				//前から後ろへ
				this.ui_elements = this.arrayMoveAt(this.ui_elements, ui_element_index, padding_index - 1);
				this.selected_element_index = padding_index - 1;
			} else {
				//後ろから前へ
				this.ui_elements = this.arrayMoveAt(this.ui_elements, ui_element_index, padding_index);
				this.selected_element_index = padding_index;
			}
			this.render();
			return;
		}
	}
}
new editorManager();
