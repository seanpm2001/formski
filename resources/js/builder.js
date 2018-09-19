import h from "./helpers/h";

class Builder {

	// Properties
	// =========================================================================

	// Properties: Static
	// -------------------------------------------------------------------------

	static _uidChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	static _uidCharsLength = Builder._uidChars.length;

	// Properties: Instance
	// -------------------------------------------------------------------------

	editingField : HTMLElement = null;
	editingSettings : HTMLElement = null;

	// Constructor
	// =========================================================================

	constructor () {
		this.fieldsWrap = document.getElementById("formskiFields");
		this.formWrap = document.getElementById("formskiForm");
		this.settingsWrap = document.getElementById("field-settings");

		this.initFieldTemplates();
		this.initDragDrop();
		this.bindClickEvents();
	}

	// Init
	// =========================================================================

	// Init: Fields
	// -------------------------------------------------------------------------

	initFieldTemplates () {
		this.rowTemplate = document.getElementById("formskiRow");
		this.dropZoneHTemplate = document.getElementById("formskiDropZoneH");
		this.dropZoneVTemplate = document.getElementById("formskiDropZoneV");
		this.fieldTemplates = {};

		const fieldTemplates = document.querySelectorAll("[data-formski-field]");

		for (let i = 0, l = fieldTemplates.length; i < l; ++i) {
			const tmpl = fieldTemplates[i];
			this.fieldTemplates[tmpl.dataset.formskiField] = tmpl;
		}
	}

	// Init: Drag / Drop
	// -------------------------------------------------------------------------

	initDragDrop () {
		const fields = this.fieldsWrap.querySelectorAll("[data-type]");

		for (let i = 0, l = fields.length; i < l; ++i) {
			const field = fields[i];
			field.addEventListener(
				"dragstart",
				this.onFieldTypeDrag.bind(this, field)
			);
		}

		this.bindDropZones();
	}

	// Actions
	// =========================================================================

	// Actions: Add Field
	// -------------------------------------------------------------------------

	createField (row, type) {
		// Get the field template & a UID
		const field  = this.getFieldTemplate(type)
			, rowUid = row.dataset.rowUid
			, uid    = this.getUid();

		// Set the UID data
		field.setAttribute("data-uid", uid);

		// Add layout input
		const layout = document.createElement("input");
		layout.setAttribute("type", "hidden");
		layout.setAttribute("name", "fieldLayout[" + rowUid + "][]");
		layout.value = uid;
		field.appendChild(layout);

		// Create the settings
		this.createFieldSettings(field, type, uid);

		return field;
	}

	createRow (form, before) {
		const row = this.getRowTemplate()
			, uid = this.getUid();

		// Row UID
		row.setAttribute("data-row-uid", uid);

		// Row layout input
		const layout = document.createElement("input");
		layout.setAttribute("type", "hidden");
		layout.setAttribute("name", "rowLayout[]");
		layout.value = uid;
		row.appendChild(layout);

		return form.insertBefore(row, before);
	}

	addFieldToForm (before, type) {
		const form = before.parentNode;

		// Add Row
		const row = this.createRow(form, before);

		// Add Field
		const field = this.createField(row, type);
		row.replaceChild(field, row.childNodes[3]);

		// Add new H drop zone
		form.insertBefore(this.getDropZone("h"), row);

		// Bind new drop zones
		this.bindDropZones();

		// Bind new clicks
		this.bindClickEvents();

		// Edit Field
		this.editField(field);
	}

	addFieldToRow (before, type) {
		const row = before.parentNode;

		// Add Field
		const field = this.createField(row, type);
		row.insertBefore(field, before);

		// Add new V drop zone
		row.insertBefore(this.getDropZone("v"), field);

		// Bind new drop zones
		this.bindDropZones();

		// Bind new clicks
		this.bindClickEvents();

		// Edit Field
		this.editField(field);
	}

	// Actions: Edit Field
	// -------------------------------------------------------------------------

	editField (field) {
		// Skip if already editing
		if (this.editingField === field)
			return;

		// Add edit class to field
		if (this.editingField !== null)
			this.editingField.classList.remove("edit");

		this.editingField = field;
		this.editingField.classList.add("edit");

		// Show settings
		if (this.editingSettings !== null)
			this.editingSettings.classList.add("hidden");

		this.editingSettings =
			this.settingsWrap.querySelector("[data-uid='" + field.dataset.uid + "']");
		this.editingSettings.classList.remove("hidden");
	}

	// Actions: Delete Field
	// -------------------------------------------------------------------------

	deleteFieldByUid (uid) {
		// Remove settings
		const settings = this.settingsWrap.querySelector("[data-uid='" + uid + "']");
		settings.parentNode.removeChild(settings);

		// Remove field
		const field = this.formWrap.querySelector("[data-uid='" + uid + "']");
		const row = field.parentNode
			, beingEdited = field === this.editingField;

		if (row.children.length === 4) {
			// If field is only field in row, remove the row and next drop zone
			const parent = row.parentNode;
			const dropZone = row.nextElementSibling;
			parent.removeChild(row);
			parent.removeChild(dropZone);
		} else {
			// Else remove the field and next drop zone
			const dropZone = field.nextElementSibling;
			row.removeChild(field);
			row.removeChild(dropZone);
		}

		// If active, select another field
		if (beingEdited) {
			this.editingField = null;
			this.editingSettings = null;

			const nextField = this.formWrap.querySelector("[data-uid]");
			if (nextField) this.editField(nextField);
		}
	}

	// Actions: Field Settings
	// -------------------------------------------------------------------------

	createFieldSettings (uiField, type, uid) {
		const fieldSettings = {
			handle: "",
			label: "Label",
			instructions: "",
			required: false,
		};

		switch (type) {
			case "text":
				fieldSettings.type = "text";
				fieldSettings.placeholder = "";
				break;
			case "textarea":
				fieldSettings.placeholder = "";
				fieldSettings.rows = 5;
				break;
			case "dropdown":
			case "radio":
			case "checkbox":
				fieldSettings.options = [
					{ label: "Label", value: "value", default: false },
				];
				break;
		}

		// Settings wrapping div
		const settingsDiv = document.createElement("div");
		settingsDiv.setAttribute("data-uid", uid);
		settingsDiv.className = "meta hidden";
		this.settingsWrap.appendChild(settingsDiv);

		// Field Type
		const fieldType = document.createElement("div");
		fieldType.classList.add("formski-settings-type");
		fieldType.textContent = this.getFriendlyTypeName(type);
		settingsDiv.appendChild(fieldType);

		// Field Type input
		const typeInput = document.createElement("input");
		typeInput.setAttribute("type", "hidden");
		typeInput.setAttribute("name", `fieldSettings[${uid}][_type]`);
		typeInput.value = type;
		settingsDiv.appendChild(typeInput);

		// Settings Fields
		for (let [name, value] of Object.entries(fieldSettings)) {
			const field = this.createSettingsField(uiField, uid, typeof value, name, value);
			settingsDiv.appendChild(field);
		}

		// Footer
		const footer = document.createElement("footer");
		footer.className = "footer";
		settingsDiv.appendChild(footer);

		// Delete
		const deleteBtn = document.createElement("button");
		deleteBtn.textContent = "Delete";
		deleteBtn.className = "btn small";
		deleteBtn.setAttribute("type", "button");
		deleteBtn.addEventListener(
			"click",
			this.onDeleteFieldClick.bind(this, uid)
		);
		footer.appendChild(deleteBtn);
	}

	// Events
	// =========================================================================

	// Events: Drag / Drop Binders
	// -------------------------------------------------------------------------

	bindDropZones () {
		const dropZones = this.formWrap.querySelectorAll("[class*='formski-form-drop']");

		for (let i = 0, l = dropZones.length; i < l; ++i) {
			const dropZone = dropZones[i];

			if (dropZone.dropBound === true)
				continue;

			dropZone.dropBound = true;

			const type = ~dropZone.className.indexOf("-h") ? "h" : "v";

			dropZone.addEventListener(
				"dragover",
				this.onDropZoneDragOver.bind(this, dropZone)
			);

			dropZone.addEventListener(
				"dragleave",
				this.onDropZoneDragLeave.bind(this, dropZone)
			);

			dropZone.addEventListener(
				"drop",
				this.onDropZoneDrop.bind(this, dropZone, type)
			);
		}
	}

	// Events: Drag / Drop Handlers
	// -------------------------------------------------------------------------

	onFieldTypeDrag = (field, e) => {
		e.dataTransfer.setData("text/field", field.dataset.type);
	};

	onDropZoneDragOver = (zone, e) => {
		e.preventDefault();

		if (![...event.dataTransfer.types].includes("text/field"))
			return;

		zone.classList.add("drop");
	};

	onDropZoneDragLeave = zone => {
		zone.classList.remove("drop");
	};

	onDropZoneDrop = (zone, zoneType, e) => {
		e.preventDefault();
		zone.classList.remove("drop");
		const type = e.dataTransfer.getData("text/field");

		if (zoneType === "h") this.addFieldToForm(zone, type);
		else this.addFieldToRow(zone, type);
	};

	// Events: Click Binders
	// -------------------------------------------------------------------------

	bindClickEvents () {
		const fields = this.formWrap.getElementsByClassName("formski-field");

		for (let i = 0, l = fields.length; i < l; ++i) {
			const field = fields[i];

			if (field.clickBound === true)
				continue;

			field.clickBound = true;

			field.addEventListener("click", this.onFieldClick.bind(this, field));
		}
	}

	// Events: Click Handlers
	// -------------------------------------------------------------------------

	onFieldClick = (field, e) => {
		e.preventDefault();
		this.editField(field);
	};

	onDeleteFieldClick = (uid, e) => {
		e.preventDefault();

		if (confirm("Are you sure?"))
			this.deleteFieldByUid(uid);
	};

	// Events: Settings Handlers
	// -------------------------------------------------------------------------

	onSettingChange = (field, name, e) => {
		const value = e.target.value;

		switch (name) {
			case "label":
				field.querySelector(".formski-field-label").textContent = value;
				break;
			case "instructions":
				field.querySelector(".formski-field-instructions").textContent = value;
				break;
			case "type":
				field.querySelector("input").setAttribute("type", value);
				break;
			case "placeholder":
				field.querySelector("input,textarea").setAttribute("placeholder", value);
				break;
			case "rows":
				field.querySelector("textarea").setAttribute("rows", value);
				break;
			case "required":
				field.querySelector(".formski-field-label")
					 .classList[e.target.checked ? "add" : "remove"]("required");
				break;
		}
	};

	// Helpers
	// =========================================================================

	getRowTemplate () {
		return document.importNode(
			this.rowTemplate.content,
			true
		).firstElementChild;
	}

	getFieldTemplate (type) {
		return document.importNode(
			this.fieldTemplates[type].content,
			true
		).firstElementChild;
	}

	getDropZone (type) {
		return document.importNode(
			(type === "h" ? this.dropZoneHTemplate : this.dropZoneVTemplate).content,
			true
		).firstElementChild;
	}

	getUid (l = 5) {
		let array = new Uint8Array(l);
		crypto.getRandomValues(array);
		array = array.map(x => Builder._uidChars.charCodeAt(x % Builder._uidCharsLength));
		return String.fromCharCode.apply(null, array);
	}

	createSettingsField (uiField, uid, type, name, value) {
		const labelId = "label" + this.getUid(10)
			, onSettingChange = this.onSettingChange.bind(this, uiField, name);

		const inputName = `fieldSettings[${uid}][${name}]`;
		let f;

		if (name === "type") {
			f = h("div", { class: "select" }, [
				h("select", {
					name: inputName,
					change: onSettingChange,
				}, [
					h("option", { value: "text" }, "Text"),
					h("option", { value: "email" }, "Email"),
					h("option", { value: "tel" }, "Phone"),
					h("option", { value: "url" }, "URL"),
					h("option", { value: "date" }, "Date"),
					h("option", { value: "time" }, "Time"),
					h("option", { value: "datetime-local" }, "Date Time"),
				]),
			]);
		} else {
			switch (type) {
				case "boolean": {
					f = h("input", {
						type: "checkbox",
						name: inputName,
						input: onSettingChange,
					});
					break;
				}
				case "object":
					f = document.createTextNode("TODO: Table");
					break;
				default: {
					f = h("input", {
						class: "text fullwidth",
						type: type === "number" ? "number" : "text",
						autocomplete: "off",
						name: inputName,
						value,
						input: onSettingChange,
					});
				}
			}
		}

		return h("div", { class: "field" }, [
			h("div", { class: "heading" }, [
				h("label", { id: labelId }, this.capitalize(name)),
			]),
			h("div", { class: "input" }, f)
		]);
	}

	getFriendlyTypeName (type) {
		switch (type) {
			case "radio":
				return "Radio Buttons";
			case "textarea":
				return "Text Area";
			case "checkbox":
				return "Checkboxes";
			default:
				return this.capitalize(type);
		}
	}

	capitalize (str) {
		return str[0].toUpperCase() + str.slice(1);
	}

}

window.FormskiBuilder = Builder;