import { ValidityStateDescriptor, ValidityStateFlags } from './validity-state'
import { SubmittableElements } from './types'
import { filterSubmittableElements } from './filters'

type ValidationMessages = Map<string, string>;
type ValidationMessageBag = WeakMap<SubmittableElements, ValidationMessages>;

const validationMessageBag: ValidationMessageBag = new WeakMap()

/**
 * Marks internals's target element as suffering from the constraints indicated
 * by the flags argument, and sets the element's validation message to message.
 *
 * @param {SubmittableElements} element
 * @param {ValidityStateFlags} flags
 * @param {string} [message]
 */
export function setValidity(
    element: SubmittableElements,
    flags: ValidityStateFlags,
    message?: string
): void {
    const messages: ValidationMessages = validationMessageBag.get(element) || new Map()
    const hasPositiveFlag: boolean = Object.values(flags).includes(true)

    if (hasPositiveFlag && (!message || message === '')) {
        throw new TypeError('Message can not be empty for the given flags')
    }

    Object.entries(flags).forEach(([flag, value]) => {
        Object.defineProperty(
            element.validity,
            flag,
            ValidityStateDescriptor(value)
        )

        if (value && message !== null) {
            messages.set(flag, message as string)
        } else {
            messages.delete(flag)
        }
    })

    Object.defineProperty(
        element.validity,
        'valid',
        ValidityStateDescriptor(!hasPositiveFlag)
    )

    validationMessageBag.set(element, messages)
}

/**
 * Sets a custom error, so that the element would fail to validate
 *
 * The given message is the message to be shown to the user when reporting
 * the problem to the user. If the argument is the empty string, clears the
 * custom error.
 *
 * @param {SubmittableElements} element
 * @param {string} validationMessage
 */
export function setCustomValidity(
    element: SubmittableElements,
    validationMessage: string
): void {
    setValidity(
        element,
        { customError: validationMessage.length > 0 },
        validationMessage
    )
}

/**
 * Test if internals's target element has no validity problems
 *
 * Returns the current validity state for the internals's target element and
 * fires an event at the element with "valid" if validity has no problems,
 * otherwise "invalid".
 *
 * @param {SubmittableElements} element
 * @return {boolean}
 */
export function checkValidity(element: SubmittableElements): boolean {
    if (element.willValidate && !element.validity.valid) {
        element.dispatchEvent(new CustomEvent('invalid', { cancelable: true }))

        return false
    }

    element.dispatchEvent(new CustomEvent('valid', { cancelable: true }))

    return true
}

/**
 * Test if internals's target element has no validity problems and report to user
 *
 * Returns the current validity state for the internals's target element and
 * fires an event at the element with "valid" if validity has no problems,
 * otherwise "invalid".
 *
 * For both states the user will get a report if the events are not canceled.
 *
 * @param {SubmittableElements} element
 * @param {Function} validityReporter
 * @return {boolean}
 */
export function reportValidity(
    element: SubmittableElements,
    validityReporter: Function = (): void => {}
): boolean {
    if (element.willValidate && !element.validity.valid) {
        if (element.dispatchEvent(new CustomEvent('invalid', { cancelable: true }))) {
            validityReporter.call(element)
        }

        return false
    }

    if (element.dispatchEvent(new CustomEvent('valid', { cancelable: true }))) {
        validityReporter.call(element)
    }

    return true
}

/**
 * Test element if it is a candidate for constraint validation
 *
 * @see https://html.spec.whatwg.org/#barred-from-constraint-validation
 * @param {SubmittableElements} element
 * @return {boolean}
 */
export function isBarredFromConstraintValidation(
    element: SubmittableElements
): boolean {
    return (
        element instanceof HTMLObjectElement
        || element instanceof HTMLFieldSetElement
        || element.type === 'hidden'
        || element.type === 'reset'
        || element.type === 'button'
        || element.hasAttribute('readonly')
        || element.disabled
        || element.hidden
        || element.closest('datalist') !== null
    )
}

/**
 * Test if internals's target element will be validated
 *
 * @param {SubmittableElements} element
 * @return {boolean}
 */
export function willValidate(element: SubmittableElements): boolean {
    return !isBarredFromConstraintValidation(element)
}

/**
 * Get latest validation message for internals's target element, if any
 *
 * Will always return an empty string, if element will not validate or
 * no message was found.
 *
 * @param {SubmittableElements} element
 * @return {string}
 */
export function getValidationMessage(element: SubmittableElements): string {
    if (!element.willValidate) {
        return ''
    }

    const messages: ValidationMessages | undefined = validationMessageBag.get(element)

    if (messages && messages.size) {
        return messages.values().next().value
    }

    return ''
}

/**
 * Test all submittable elements for the provided form
 *
 * Returns a positive result if no submittable element has validity problems,
 * otherwise a list with unhandled controls will be returned. All controls will
 * fire the event "valid", if no validity problems were detected, otherwise the
 * event "invalid" will be fired.
 *
 * Cancelling the "invalid" event will remove the control from the unhandled
 * controls list.
 *
 * @see https://html.spec.whatwg.org/#constraint-validation
 * @param {HTMLFormElement} form
 * @return {boolean|SubmittableElements[]} unhandled controls
 */
export function staticallyValidateTheConstraint(
    form: HTMLFormElement
): boolean | SubmittableElements[] {
    const controls: SubmittableElements[] = Array.from(form.elements)
        .filter(filterSubmittableElements) as SubmittableElements[]
    const invalidControls: SubmittableElements[] = []
    const unhandledInvalidControls: SubmittableElements[] = []

    controls.forEach((field) => {
        if (!field.willValidate) {
            return
        }

        if (field.validity.valid) {
            field.dispatchEvent(new CustomEvent('valid', { cancelable: true }))
            return
        }

        invalidControls.push(field)
    })

    if (invalidControls.length === 0) {
        form.dispatchEvent(new CustomEvent('valid', { cancelable: true }))

        return true
    }

    form.dispatchEvent(new CustomEvent('invalid', { cancelable: true }))

    invalidControls.forEach((field) => {
        if (field.dispatchEvent(new CustomEvent('invalid', { cancelable: true }))) {
            unhandledInvalidControls.push(field)
        }
    })

    return unhandledInvalidControls
}

/**
 * Test all submittable elements for the provided form and report to user
 *
 * Returns a positive result if no submittable element has validity problems,
 * otherwise a list with unhandled controls will be returned. All controls will
 * fire the event "valid", if no validity problems were detected, otherwise the
 * event "invalid" will be fired.
 *
 * Invoking the validity reporter can be prevented individually by cancelling
 * the events on the controls.
 *
 * As in staticallyValidateTheConstraint() cancelling the "invalid" event will
 * remove the control from the unhandled controls list.
 *
 * NOTE: According to the spec it has to call staticallyValidateTheConstraint().
 * This behavior has been changed to allow us to call the validity reporter on
 * valid controls as well.
 *
 * @see https://html.spec.whatwg.org/#constraint-validation
 * @param {HTMLFormElement} form
 * @param {Function} validityReporter
 * @return {boolean|SubmittableElements[]} unhandled controls
 */
export function interactivelyValidateTheConstraints(
    form: HTMLFormElement,
    validityReporter: Function = (): void => {}
): boolean | SubmittableElements[] {
    const controls: SubmittableElements[] = Array.from(form.elements)
        .filter(filterSubmittableElements) as SubmittableElements[]
    const validControls: SubmittableElements[] = []
    const invalidControls: SubmittableElements[] = []
    const unhandledInvalidControls: SubmittableElements[] = []

    controls.forEach((field) => {
        if (!field.willValidate) {
            return
        }

        if (field.validity.valid) {
            validControls.push(field)
        } else {
            invalidControls.push(field)
        }
    })

    if (invalidControls.length === 0) {
        form.dispatchEvent(new CustomEvent('valid', { cancelable: true }))

        validControls.forEach((field) => {
            if (field.dispatchEvent(new CustomEvent('valid', { cancelable: true }))) {
                validityReporter.call(field)
            }
        })

        return true
    }

    form.dispatchEvent(new CustomEvent('invalid', { cancelable: true }))

    invalidControls.forEach((field) => {
        if (field.dispatchEvent(new CustomEvent('invalid', { cancelable: true }))) {
            validityReporter.call(field)
            unhandledInvalidControls.push(field)
        }
    })

    return unhandledInvalidControls
}
