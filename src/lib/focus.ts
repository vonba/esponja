export const focusOnFirstError = (form: HTMLFormElement) => {
	// Reset
	for (const field of Array.from(form.elements)) {
		const formField = field as Element;
		formField.classList.remove('invalid');
	}
	// Add .invalid class and focus
	for (const field of Array.from(form.elements)) {
		const formField = field as Element;
		if (
			(formField instanceof HTMLInputElement || 
			 formField instanceof HTMLTextAreaElement || 
			 formField instanceof HTMLSelectElement) && 
			!formField.checkValidity()
		) {
			formField.classList.add('invalid');
			formField.focus();
			break;
		}
	}
}
