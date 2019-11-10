import {
    SubmittableElements
} from '../types'

/**
 * Filter for submittable elements
 *
 * @see https://html.spec.whatwg.org/#category-submit
 * @see https://html.spec.whatwg.org/#the-form-element For web developers (non-normative form.elements)
 * @see https://html.spec.whatwg.org/#dom-form-elements
 * @see https://html.spec.whatwg.org/#form-associated-custom-element
 * @param {Element} element
 */
export default function filterSubmittableElements(
    element: Element
): element is SubmittableElements {
    return (element instanceof HTMLButtonElement && element.type !== 'image')
    || element instanceof HTMLFieldSetElement
    || (element instanceof HTMLInputElement && element.type !== 'image')
    || element instanceof HTMLObjectElement
    || element instanceof HTMLSelectElement
    || element instanceof HTMLTextAreaElement
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    // ignore problem for form associated custom elements
    // until it is final in all browsers and in the typescript declaration
    || element.constructor.formAssociated
}
