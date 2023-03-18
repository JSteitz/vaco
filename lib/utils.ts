export type HTMLCustomElement = HTMLElement & {
  constructor: HTMLCustomElementStatic;
  form: HTMLFormElement;
  name: string;
  type: string;
  disabled: boolean;
  readonly willValidate: boolean;
  readonly validity: ValidityState;
  readonly validationMessage: string;

  setCustomValidity(message: string): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
};

export type HTMLCustomElementStatic = {
  prototype: HTMLCustomElement;
  new(): HTMLCustomElement;
  readonly formAssociated?: boolean;
};

export type FormAssociatedElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLImageElement
  | HTMLCustomElement;

export type ListedElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLCustomElement;

export type SubmittableElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLCustomElement;

export type SubmitButton =
  | HTMLButtonElement
  | (HTMLInputElement & { type: 'submit'; });

export function isListedElement(node: Node): node is SubmittableElement {
  return node instanceof HTMLElement && (
    ['button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea',].includes(node.localName)
    || ('constructor' in node && 'formAssociated' in node.constructor)
  );
}

/**
 * Test if given node is a submittable element
 *
 * @see https://html.spec.whatwg.org/#category-submit
 * @see https://html.spec.whatwg.org/#the-form-element For web developers (non-normative form.elements)
 * @see https://html.spec.whatwg.org/#dom-form-elements
 * @see https://html.spec.whatwg.org/#form-associated-custom-element
 */
export function isSubmittableElement(node: Node): node is SubmittableElement {
  return node instanceof HTMLElement && (
    ['button', 'input', 'object', 'select', 'textarea'].includes(node.localName)
    || ('constructor' in node && 'formAssociated' in node.constructor)
  );
}

/**
 * Test if given element is a submit button
 */
export function isSubmitButton(element: Element): element is SubmitButton {
  return (element instanceof HTMLButtonElement && element.type === 'submit')
    || (element instanceof HTMLInputElement && ['submit', 'image'].includes(element.type));
}

/**
 * Filter submit buttons from the given list
 */
export function filterSubmitButtons(elements: Element[]): SubmitButton[] {
  return elements.filter(isSubmitButton);
}

/**
 * Filter elements that can be used for constructing the form data set when a
 * form element is submitted
 */
export function filterSubmittableElements(elements: Element[]): SubmittableElement[] {
  return elements.filter(isSubmittableElement);
}

/**
 * Get first submit button from listed elements
 */
export function getSubmitButton(form: HTMLFormElement): SubmitButton {
  return filterSubmitButtons(Array.from(form.elements))[0];
}

/**
 * Get submittable elements from the given form
 */
export function getSubmittableElements(element: HTMLFormElement | HTMLFieldSetElement): SubmittableElement[] {
  return filterSubmittableElements(Array.from(element.elements));
}

/**
 * Get submit button that initiated the form submit
 *
 * Note that the submit event fires on the <form> element itself, and not on any
 * <button> or <input type="submit"> inside it. (Forms are submitted, not buttons.)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event
 *
 * The last active element before the submit is tested is an instance of a
 * submit button that belongs to the submitted form.
 */
export function getSubmitter(form: HTMLFormElement): SubmitButton | null {
  return document.activeElement
    && isSubmitButton(document.activeElement)
    && document.activeElement.form === form
    ? document.activeElement
    : null;
}
