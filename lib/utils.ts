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
}

export type HTMLCustomElementStatic = {
  prototype: HTMLCustomElement;
  new(): HTMLCustomElement;
  readonly formAssociated?: boolean;
}

export type FormAssociatedElement =
  HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLImageElement
  | HTMLCustomElement

export type ListedElement =
  HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLCustomElement

export type SubmittableElement =
  HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLCustomElement

export type SubmitButton = HTMLButtonElement | (HTMLInputElement & { type: 'submit' })

export interface ResolvedElementObject {
  status: string;
  value: unknown;
}

export interface RejectedElementObject {
  status: string;
  reason: unknown;
}

/**
 * The method returns a promise that resolves after all of the given promises
 * have either resolved or rejected, with an array of objects that each
 * describes the outcome of each promise.
 *
 * @signature allSettled :: Promise -> ???
 */
export const allSettled =
  (promises: Promise<unknown>[]): Promise<Array<ResolvedElementObject | RejectedElementObject>> =>
    Promise.all(
      promises.map(
        (promise: Promise<unknown>) => {
          if (!(promise instanceof Promise)) {
            throw new TypeError(`${typeof promise} is not a type of Promise`)
          }

          return promise
            .then((result: unknown): ResolvedElementObject => ({
              status: 'fulfilled',
              value: result
            }))
            .catch((result: unknown): RejectedElementObject => ({
              status: 'rejected',
              reason: result
            }))
        }
      )
    )

export const isListedElement =
  (node: Node): node is SubmittableElement => (
    node instanceof HTMLElement && (
      [
        'button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea'
      ].includes(node.localName)
      || ('constructor' in node && 'formAssociated' in node.constructor)
    )
  )

/**
 * Test if given node is a submittable element
 *
 * @see https://html.spec.whatwg.org/#category-submit
 * @see https://html.spec.whatwg.org/#the-form-element For web developers (non-normative form.elements)
 * @see https://html.spec.whatwg.org/#dom-form-elements
 * @see https://html.spec.whatwg.org/#form-associated-custom-element
 *
 * @signature isSubmittableElement :: Node -> boolean
 */
export const isSubmittableElement =
  (node: Node): node is SubmittableElement => (
    node instanceof HTMLElement && (
      ['button', 'input', 'object', 'select', 'textarea'].includes(node.localName)
      || ('constructor' in node && 'formAssociated' in node.constructor)
    )
  )

/**
 * Test if given element is a submit button
 *
 * @signature isSubmitButton :: Element -> boolean
 */
export const isSubmitButton =
  (element: Element): element is SubmitButton => (
    (element instanceof HTMLButtonElement && element.type === 'submit')
    || (element instanceof HTMLInputElement && ['submit', 'image'].includes(element.type))
  )

/**
 * Filter submit buttons from the given list
 *
 * @signature isSubmitButton :: [Element] -> [SubmitButton]
 */
export const filterSubmitButtons =
  (elements: Element[]): SubmitButton[] =>
    elements.filter(isSubmitButton)

/**
 * Filter elements that can be used for constructing the form data set when a
 * form element is submitted
 *
 * @signature filterSubmittableElements :: [Element] -> [SubmittableElement]
 */
export const filterSubmittableElements =
  (elements: Element[]): SubmittableElement[] =>
    elements.filter(isSubmittableElement)

/**
 * Get first submit button from listed elements
 *
 * @signature getSubmitButton :: HTMLFormElement -> SubmitButton
 */
export const getSubmitButton =
  (form: HTMLFormElement): SubmitButton =>
    filterSubmitButtons(Array.from(form.elements))[0]

/**
 * Get submittable elements from the given form
 *
 * @signature getSubmittableElements :: (HTMLFormElement | HTMLFieldSetElement) -> [SubmittableElement]
 */
export const getSubmittableElements =
  (element: HTMLFormElement | HTMLFieldSetElement): SubmittableElement[] =>
    filterSubmittableElements(Array.from(element.elements))

/**
 * Get submit button that initiated the form submit
 *
 * Note that the submit event fires on the <form> element itself, and not on any
 * <button> or <input type="submit"> inside it. (Forms are submitted, not buttons.)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event
 *
 * The last active element before the submit is tested if is an instance of a
 * submit button that belongs to the submitted form.
 *
 * @signature getSubmitter :: HTMlFormElement -> SubmitButton
 */
export const getSubmitter =
  (form: HTMLFormElement): SubmitButton => {
    const element = document.activeElement

    if (isSubmitButton(element) && element.form === form) {
      return element
    }

    return null
  }

/**
 * Partially clone a object by providing properties
 *
 * @signature cloneProperties :: (string[], T) -> T
 */
export const cloneProperties =
  <T>(properties: string[], obj: T):  Partial<T> => {
    const clone = {}

    properties.forEach((property: string) => Object.defineProperty(
      obj,
      property,
      Object.getOwnPropertyDescriptor(clone,property)
    ))

    return clone
  }

