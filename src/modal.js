const setSafeHTML = (element, htmlString) => {
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlString, "text/html");

	// Remove high-risk elements
	const dangerousElements = doc.querySelectorAll(
		"script, iframe, object, embed, style",
	);
	dangerousElements.forEach((el) => el.remove());

	// Strip inline event attributes (e.g., onclick, onerror)
	const allElements = doc.querySelectorAll("*");
	allElements.forEach((el) => {
		Array.from(el.attributes).forEach((attr) => {
			if (attr.name.startsWith("on")) {
				el.removeAttribute(attr.name);
			}
		});
	});

	element.innerHTML = doc.body.innerHTML;
};

export const showModal = (title, msg, check, btn, btnType, callback) => {
	const dlg = document.getElementById("dlgConfirm");
	const continueBtn = dlg.querySelector(".btn-dlg-continue");
	const cancelBtn = dlg.querySelector(".btn-dlg-cancel");
	const checkContainer = dlg.querySelector(".check-dlg");
	const checkSpan = checkContainer.querySelector("span");
	const checkInput = checkContainer.querySelector("input");

	// Populate Content
	setSafeHTML(dlg.querySelector(".dialog-title"), title);
	setSafeHTML(dlg.querySelector(".dialog-body"), msg);
	setSafeHTML(checkSpan, check ?? "");
	continueBtn.textContent = btn;

	// Active State
	dlg._onContinue = callback;
	dlg._hasCheck = Boolean(check);

	// Toggle Cancel Button Visibility
	const isInteractive = typeof callback === "function";
	cancelBtn.classList.toggle("hide", !isInteractive);

	// Toggle Checkbox Section
	checkInput.checked = false;
	checkContainer.classList.toggle("hide", !dlg._hasCheck);

	// Disable continue button initially if checkbox is required
	continueBtn.disabled = dlg._hasCheck;

	// Apply Button Variant
	const validTypes = ["primary", "danger", "secondary"];
	const btnClass = validTypes.includes(btnType)
		? `btn-${btnType}`
		: "btn-secondary";
	continueBtn.classList.remove("btn-primary", "btn-danger", "btn-secondary");
	continueBtn.classList.add(btnClass);

	// Attach Event Handlers (Once)
	if (!dlg.dataset.attached) {
		dlg.dataset.attached = "true";

		// Click outside backdrop to close
		dlg.addEventListener("click", (e) => {
			const rect = dlg.getBoundingClientRect();
			const isClickOutside =
				e.clientX < rect.left ||
				e.clientX > rect.right ||
				e.clientY < rect.top ||
				e.clientY > rect.bottom;

			if (isClickOutside) dlg.close();
		});

		cancelBtn.addEventListener("click", () => dlg.close());

		continueBtn.addEventListener("click", () => {
			dlg.close();
			if (typeof dlg._onContinue === "function") {
				dlg._onContinue();
			}
		});

		// Enable continue button ONLY when checkbox is checked
		checkInput.addEventListener("change", () => {
			if (dlg._hasCheck) {
				continueBtn.disabled = !checkInput.checked;
			}
		});
	}

	dlg.showModal();
};
