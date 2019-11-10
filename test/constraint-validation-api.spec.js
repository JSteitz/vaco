import './browser'
import { strict as assert } from 'assert'
import sinon from 'sinon'
import {
    willValidate,
    isBarredFromConstraintValidation,
    setValidity,
    getValidationMessage,
    setCustomValidity,
    checkValidity,
    reportValidity,
    staticallyValidateTheConstraint,
    interactivelyValidateTheConstraints,
    rewire$isBarredFromConstraintValidation, // eslint-disable-line import/named
    restore // eslint-disable-line import/named
} from '../src/constraint-validation-api'

suite('Constraint Validation API', () => {
    suite('setValidity', () => {
        test('Throw an error if no message with a positive flag is given', () => {
            const element = document.createElement('input')

            assert.throws(setValidity.bind(null, element, { badInput: true }))
            assert.throws(setValidity.bind(null, element, { badInput: true }, ''))
        })

        test('Set elements validity flags to the given states', () => {
            const element = document.createElement('input')

            assert.equal(element.validity.badInput, false)
            setValidity(element, { badInput: true }, 'Bad Input')
            assert.equal(element.validity.badInput, true)
        })

        test('Set validity state to false if a positive validity flag is set', () => {
            const element = document.createElement('input')

            assert.equal(element.validity.valid, true)
            setValidity(element, { badInput: true }, 'Bad Input')
            assert.equal(element.validity.valid, false)
        })

        test('Set elements validation message to the given message', () => {
            const element = document.createElement('input')
            const validationMessage = 'My Validation Message'

            setValidity(element, {
                badInput: true,
                patternMismatch: true
            }, validationMessage)
            assert.equal(getValidationMessage(element), validationMessage)
        })

        test('Set elements validation message to empty string if message is not given or all of elements validity flags are false', () => {
            const element1 = document.createElement('input')
            const element2 = document.createElement('input')

            setValidity(element1, { customError: true }, 'not empty')
            setValidity(element2, { customError: true }, 'not empty')

            setValidity(element1, { customError: false })
            setValidity(element2, { customError: false }, 'discard me!')

            assert.equal(getValidationMessage(element1), '')
            assert.equal(getValidationMessage(element2), '')
        })
    })

    suite('setCustomValidity', () => {
        test('Set customError validity flag with the given message', () => {
            const element = document.createElement('input')
            const validationMessage = 'Validation Message'

            setCustomValidity(element, validationMessage)
            assert.equal(element.validity.customError, true)
            assert.equal(getValidationMessage(element), validationMessage)
        })

        test('Clear custom error validation message if the message is an empty string', () => {
            const element = document.createElement('input')

            setCustomValidity(element, 'Validation Message')
            setCustomValidity(element, '')

            assert.equal(element.validity.customError, false)
            assert.equal(getValidationMessage(element), '')
        })
    })

    suite('checkValidity', () => {
        test('Return a negative result if element is not valid', () => {
            const element = document.createElement('input')

            Object.defineProperty(element, 'validity', {
                get: () => ({ valid: false })
            })

            assert.equal(checkValidity(element), false, 'result is positive for invalid element')
        })

        test('Return a positive result if element is valid', () => {
            const element = document.createElement('input')

            assert.equal(checkValidity(element), true, 'result is negative for valid element')

            Object.defineProperty(element, 'willValidate', {
                get: () => false
            })

            assert.equal(checkValidity(element), true, 'result is negative for element with willValidate = false')
        })

        test('Fire event "invalid" if the result is negative', () => {
            const element = document.createElement('input')
            const spy = sinon.spy()

            Object.defineProperty(element, 'validity', {
                get: () => ({ valid: false })
            })

            element.addEventListener('invalid', spy)

            checkValidity(element)
            assert.equal(spy.called, true, 'Event "invalid" not fired')
        })

        test('Fire event "valid" if the result is positive', () => {
            const element = document.createElement('input')
            const spy = sinon.spy()

            element.addEventListener('valid', spy)

            checkValidity(element)
            assert.equal(spy.called, true, 'Event "valid" not fired')
        })
    })

    suite('reportValidity', () => {
        test('Return a negative result if element is not valid', () => {
            const element = document.createElement('input')

            Object.defineProperty(element, 'validity', {
                get: () => ({ valid: false })
            })

            assert.equal(reportValidity(element), false, 'result is positive for invalid element')
        })

        test('Return a positive result if element is valid', () => {
            const element = document.createElement('input')

            assert.equal(reportValidity(element), true, 'result is negative for valid element')

            Object.defineProperty(element, 'willValidate', {
                get: () => false
            })

            assert.equal(reportValidity(element), true, 'result is negative for element with willValidate = false')
        })

        test('Fire event "invalid" if the result is negative', () => {
            const element = document.createElement('input')
            const spy = sinon.spy()

            Object.defineProperty(element, 'validity', {
                get: () => ({ valid: false })
            })

            element.addEventListener('invalid', spy)

            reportValidity(element)
            assert.equal(spy.called, true, 'Event "invalid" not fired')
        })

        test('Fire event "valid" if the result is positive', () => {
            const element = document.createElement('input')
            const spy = sinon.spy()

            element.addEventListener('valid', spy)

            reportValidity(element)
            assert.equal(spy.called, true, 'Event "valid" not fired')
        })

        test('Invoke the validity reporter regardless of result', () => {
            const elementValid = document.createElement('input')
            const elementInvalid = document.createElement('input')
            const spy = sinon.spy()

            Object.defineProperty(elementInvalid, 'validity', {
                get: () => ({ valid: false })
            })

            reportValidity(elementValid, spy)
            assert.equal(spy.calledOnce, true, 'validityReporter was not called for valid element')

            reportValidity(elementInvalid, spy)
            assert.equal(spy.calledTwice, true, 'validityReporter was not called for invalid element')
        })

        test('Allow to cancel the events to prevent invoking report validity', () => {
            const elementValid = document.createElement('input')
            const elementInvalid = document.createElement('input')
            const spy = sinon.spy()

            Object.defineProperty(elementInvalid, 'validity', {
                get: () => ({ valid: false })
            })

            // valid
            elementValid.addEventListener('valid', (event) => {
                event.preventDefault()
            })

            reportValidity(elementValid, spy)
            assert.equal(spy.notCalled, true, 'validityReporter was called for valid element')

            // invalid
            elementInvalid.addEventListener('invalid', (event) => {
                event.preventDefault()
            })

            reportValidity(elementInvalid, spy)
            assert.equal(spy.notCalled, true, 'validityReporter was called for invalid element')
        })
    })

    suite('isBarredFromConstraintValidation', () => {
        test('Test all barred submittable elements', () => {
            const fieldset = document.createElement('fieldset')
            const object = document.createElement('object')
            const inputTypeHidden = document.createElement('input')
            const inputTypeReset = document.createElement('input')
            const inputTypeButton = document.createElement('input')
            const readonly = document.createElement('input')
            const disabled = document.createElement('input')
            const hidden = document.createElement('input')
            const datalist = document.createElement('datalist')
            const inDatalist = document.createElement('input')
            const buttonTypeReset = document.createElement('button')

            inputTypeHidden.type = 'hidden'
            inputTypeReset.type = 'reset'
            inputTypeButton.type = 'button'
            readonly.readOnly = true
            disabled.disabled = true
            hidden.hidden = true
            datalist.appendChild(inDatalist)
            buttonTypeReset.type = 'reset'

            // barred
            assert.equal(isBarredFromConstraintValidation(fieldset), true)
            assert.equal(isBarredFromConstraintValidation(object), true)
            assert.equal(isBarredFromConstraintValidation(inputTypeHidden), true)
            assert.equal(isBarredFromConstraintValidation(inputTypeReset), true)
            assert.equal(isBarredFromConstraintValidation(inputTypeButton), true)
            assert.equal(isBarredFromConstraintValidation(readonly), true)
            assert.equal(isBarredFromConstraintValidation(disabled), true)
            assert.equal(isBarredFromConstraintValidation(hidden), true)
            assert.equal(isBarredFromConstraintValidation(inDatalist), true)
            assert.equal(isBarredFromConstraintValidation(buttonTypeReset), true)
        })

        test('Test all non barred submittable elements', () => {
            const input = document.createElement('input')
            const select = document.createElement('select')
            const textarea = document.createElement('textarea')
            const button = document.createElement('button')

            assert.equal(isBarredFromConstraintValidation(input), false)
            assert.equal(isBarredFromConstraintValidation(select), false)
            assert.equal(isBarredFromConstraintValidation(textarea), false)
            assert.equal(isBarredFromConstraintValidation(button), false)
        })
    })

    suite('willValidate', () => {
        test('Will validate if element is not barred from constraint validation', () => {
            const element = document.createElement('input')

            rewire$isBarredFromConstraintValidation(() => true)
            assert.equal(willValidate(element), false)

            rewire$isBarredFromConstraintValidation(() => false)
            assert.equal(willValidate(element), true)

            restore()
        })
    })

    suite('getValidationMessage', () => {
        test('Return an empty string if element will not validate', () => {
            const element = document.createElement('input')

            Object.defineProperty(element, 'willValidate', {
                get: () => false
            })

            assert.equal(getValidationMessage(element), '')
        })

        test('Return an empty string if no message was found for element', () => {
            const element = document.createElement('input')

            Object.defineProperty(element, 'willValidate', {
                get: () => true
            })
            assert.equal(getValidationMessage(element), '')
        })

        test('Return first message in the validation message bag', () => {
            const elementFail = document.createElement('input')
            const elementOk = document.createElement('input')
            const firstErrorMessage = 'Error 1'
            const secondErrorMessage = 'Error 2'

            Object.defineProperty(elementFail, 'willValidate', {
                get: () => true
            })
            Object.defineProperty(elementOk, 'willValidate', {
                get: () => true
            })

            setValidity(elementOk, { badInput: true }, firstErrorMessage)
            setValidity(elementOk, { customError: true }, secondErrorMessage)
            assert.equal(getValidationMessage(elementOk), firstErrorMessage)

            setValidity(elementFail, { badInput: true }, secondErrorMessage)
            setValidity(elementFail, { customError: true }, firstErrorMessage)
            assert.notEqual(getValidationMessage(elementFail), firstErrorMessage)

            restore()
        })
    })

    suite('staticallyValidateTheConstraint', () => {
        test('Should return true if all controls are valid', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')

            form.appendChild(control)

            assert.equal(staticallyValidateTheConstraint(form), true)
        })

        test('Skip controls that will not validate', () => {
            const form = document.createElement('form')
            const barred = document.createElement('object')
            const spy = sinon.spy()

            form.appendChild(barred)
            barred.addEventListener('valid', spy)
            barred.addEventListener('invalid', spy)

            assert.equal(staticallyValidateTheConstraint(form), true)
            assert.equal(spy.notCalled, true)
        })

        test('Fire event "valid" on all valid controls', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(control)
            control.addEventListener('valid', spy)

            assert.equal(staticallyValidateTheConstraint(form), true)
            assert.equal(spy.called, true)
        })

        test('Fire event "valid" on form if all controls are valid', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(control)
            form.addEventListener('valid', spy)

            assert.equal(staticallyValidateTheConstraint(form), true)
            assert.equal(spy.called, true)
        })

        test('Fire event "invalid" on all invalid controls', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(control)
            control.addEventListener('invalid', spy)

            Object.defineProperty(control, 'validity', {
                get: () => ({ valid: false })
            })

            assert.notEqual(staticallyValidateTheConstraint(form), true)
            assert.equal(spy.called, true)
        })

        test('Fire event "invalid" on form if any control is invalid', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(control)
            form.addEventListener('invalid', spy)

            Object.defineProperty(control, 'validity', {
                get: () => ({ valid: false })
            })

            assert.notEqual(staticallyValidateTheConstraint(form), true)
            assert.equal(spy.called, true)
        })

        test('Return list with unhandled invalid controls', () => {
            const form = document.createElement('form')
            const handledControl = document.createElement('input')
            const unhandledControl = document.createElement('input')

            form.appendChild(handledControl)
            form.appendChild(unhandledControl)

            Object.defineProperty(handledControl, 'validity', {
                get: () => ({ valid: false })
            })
            Object.defineProperty(unhandledControl, 'validity', {
                get: () => ({ valid: false })
            })

            handledControl.addEventListener('invalid', (event) => {
                event.preventDefault()
            })

            assert.deepEqual(staticallyValidateTheConstraint(form), [unhandledControl])
        })
    })

    suite('interactivelyValidateTheConstraints', () => {
        test('Should return true if all controls are valid', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')

            form.appendChild(control)

            assert.equal(interactivelyValidateTheConstraints(form), true)
        })

        test('Skip controls that will not validate', () => {
            const form = document.createElement('form')
            const barred = document.createElement('object')
            const spy = sinon.spy()

            form.appendChild(barred)
            barred.addEventListener('valid', spy)
            barred.addEventListener('invalid', spy)

            assert.equal(interactivelyValidateTheConstraints(form), true)
            assert.equal(spy.notCalled, true)
        })

        test('Fire event "valid" on all valid controls', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(control)
            control.addEventListener('valid', spy)

            assert.equal(interactivelyValidateTheConstraints(form), true)
            assert.equal(spy.called, true)
        })

        test('Fire event "valid" on form if all controls are valid', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(control)
            form.addEventListener('valid', spy)

            assert.equal(interactivelyValidateTheConstraints(form), true)
            assert.equal(spy.called, true)
        })

        test('Fire event "invalid" on all invalid controls', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(control)
            control.addEventListener('invalid', spy)

            Object.defineProperty(control, 'validity', {
                get: () => ({ valid: false })
            })

            assert.notEqual(interactivelyValidateTheConstraints(form), true)
            assert.equal(spy.called, true)
        })

        test('Fire event "invalid" on form if any control is invalid', () => {
            const form = document.createElement('form')
            const control = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(control)
            form.addEventListener('invalid', spy)

            Object.defineProperty(control, 'validity', {
                get: () => ({ valid: false })
            })

            assert.notEqual(interactivelyValidateTheConstraints(form), true)
            assert.equal(spy.called, true)
        })

        test('Return list with unhandled invalid controls', () => {
            const form = document.createElement('form')
            const handledControl = document.createElement('input')
            const unhandledControl = document.createElement('input')

            form.appendChild(handledControl)
            form.appendChild(unhandledControl)

            Object.defineProperty(handledControl, 'validity', {
                get: () => ({ valid: false })
            })
            Object.defineProperty(unhandledControl, 'validity', {
                get: () => ({ valid: false })
            })

            handledControl.addEventListener('invalid', (event) => {
                event.preventDefault()
            })

            assert.deepEqual(interactivelyValidateTheConstraints(form), [unhandledControl])
        })

        test('Invoke validity reporter on all controls that do not cancel their corresponding event', () => {
            const form = document.createElement('form')
            const validControl = document.createElement('input')
            const unhandledValidControl = document.createElement('input')
            const invalidControl = document.createElement('input')
            const unhandledInvalidControl = document.createElement('input')
            const spy = sinon.spy()

            form.appendChild(validControl)
            form.appendChild(unhandledValidControl)

            const cancelEvent = (event) => event.preventDefault()
            const invalidValidity = { get: () => ({ valid: false }) }

            Object.defineProperty(invalidControl, 'validity', invalidValidity)
            Object.defineProperty(unhandledInvalidControl, 'validity', invalidValidity)

            validControl.addEventListener('valid', cancelEvent)
            invalidControl.addEventListener('invalid', cancelEvent)

            assert.equal(interactivelyValidateTheConstraints(form, spy), true)
            assert.equal(spy.callCount, 1)

            form.appendChild(invalidControl)
            form.appendChild(unhandledInvalidControl)

            assert.notEqual(interactivelyValidateTheConstraints(form, spy), true)
            assert.equal(spy.callCount, 2)
        })
    })
})
