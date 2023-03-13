// import {
//   suite, test, setup, teardown,
// } from 'mocha'
// import { assert } from 'chai'
// import browser from '../../../../jsdom'
// import attach from '../../../../../lib/core/validation/form/attach'
//
// suite('Validation :: Form:: attach', () => {
//   setup(browser.setup)
//   teardown(browser.teardown)
//
//   test('When a form is attached, then polyfill required methods and properties', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//
//     // get previous state from the from
//     const noValidate = Object.getOwnPropertyDescriptor(form, 'noValidate')
//     const checkValidity = Object.getOwnPropertyDescriptor(form, 'checkValidity')
//     const reportValidity = Object.getOwnPropertyDescriptor(form, 'reportValidity')
//
//     // has side-effects on the form
//     attach(validityReporter, form)
//
//     assert.notDeepEqual(Object.getOwnPropertyDescriptor(form, 'noValidate'), noValidate)
//     assert.notDeepEqual(Object.getOwnPropertyDescriptor(form, 'checkValidity'), checkValidity)
//     assert.notDeepEqual(Object.getOwnPropertyDescriptor(form, 'reportValidity'), reportValidity)
//   })
//
//   test('When an already polyfilled form is attached, then do nothing', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//
//     // has side-effects on the form
//     attach(validityReporter, form)
//
//     // get polyfilled state from the from
//     const noValidate = Object.getOwnPropertyDescriptor(form, 'noValidate')
//     const checkValidity = Object.getOwnPropertyDescriptor(form, 'checkValidity')
//     const reportValidity = Object.getOwnPropertyDescriptor(form, 'reportValidity')
//
//     attach(validityReporter, form)
//
//     assert.deepStrictEqual(Object.getOwnPropertyDescriptor(form, 'noValidate'), noValidate)
//     assert.deepStrictEqual(Object.getOwnPropertyDescriptor(form, 'checkValidity'), checkValidity)
//     assert.deepStrictEqual(Object.getOwnPropertyDescriptor(form, 'reportValidity'), reportValidity)
//   })
//
//   test('When the form checks for validity, then the result should always be a boolean', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const input = window.document.createElement('input')
//
//     form.appendChild(input)
//
//     // has side-effects on the form
//     attach(validityReporter, form)
//     const resultPositive = form.checkValidity()
//
//     assert.isBoolean(resultPositive)
//     assert.isTrue(resultPositive)
//
//     Object.defineProperty(input, 'validity', { get() { return { validity: false } } })
//
//     const resultNegative = form.checkValidity()
//
//     assert.isBoolean(resultNegative)
//     assert.isFalse(resultNegative)
//   })
//
//   test('When the form reports validity problems, then the result should always be a boolean', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const input = window.document.createElement('input')
//
//     form.appendChild(input)
//
//     // has side-effects on the form
//     attach(validityReporter, form)
//     const resultPositive = form.reportValidity()
//
//     assert.isBoolean(resultPositive)
//     assert.isTrue(resultPositive)
//
//     Object.defineProperty(input, 'validity', { get() { return { validity: false } } })
//
//     const resultNegative = form.reportValidity()
//
//     assert.isBoolean(resultNegative)
//     assert.isFalse(resultNegative)
//   })
//
//   test('When the noValidate property is set, then set the attribute "data-novalidate" accordingly', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//
//     // has side-effects on the form
//     attach(validityReporter, form)
//
//     // default state
//     const defaultNoAttribute = form.hasAttribute('data-novalidate')
//
//     assert.isFalse(defaultNoAttribute)
//
//     form.noValidate = false
//     const noAttribute = form.hasAttribute('data-novalidate')
//
//     assert.isFalse(noAttribute)
//
//     form.noValidate = true
//     const withAttribute = form.hasAttribute('data-novalidate')
//     const attributeValue = form.getAttribute('data-novalidate')
//
//     assert.isTrue(withAttribute)
//     assert.isEmpty(attributeValue)
//   })
//
//   test('When the attribute "data-novalidate" is set, then set the property noValidate accordingly', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//
//     // has side-effects on the form
//     attach(validityReporter, form)
//
//     assert.isFalse(form.noValidate)
//
//     form.setAttribute('data-novalidate', '')
//
//     assert.isTrue(form.noValidate)
//   })
// })




// import {
//   suite, test, setup, teardown,
// } from 'mocha'
// import { assert } from 'chai'
// import sinon from 'sinon'
// import browser from '../../../../jsdom'
// import submitGuard from '../../../../../lib/core/validation/form/submit-guard'
//
// suite('Validation :: Form :: submitGuard', () => {
//   setup(browser.setup)
//   teardown(browser.teardown)
//
//   test('When the form is invalid, then cancel the submit', () => {
//     const form = window.document.createElement('form')
//     const submitEventSpy = sinon.spy()
//     const validityReporterStub = sinon.stub()
//
//     form.addEventListener('submit', submitGuard)
//     form.addEventListener('submit', submitEventSpy)
//     Object.defineProperty(form, 'reportValidity', { value: validityReporterStub })
//
//     // with valid form
//     validityReporterStub.returns(true)
//     form.dispatchEvent(new window.Event('submit'))
//
//     assert.isTrue(submitEventSpy.calledOnce)
//
//     // with invalid from
//     validityReporterStub.returns(false)
//     form.dispatchEvent(new window.Event('submit'))
//
//     assert.isTrue(submitEventSpy.calledOnce)
//   })
//
//   test('When the form property noValidate is true, then submit without reporting errors', () => {
//     const form = window.document.createElement('form')
//     const submitEventSpy = sinon.spy()
//     const validityReporterStub = sinon.stub()
//
//     form.noValidate = true
//     form.addEventListener('submit', submitGuard)
//     form.addEventListener('submit', submitEventSpy)
//     Object.defineProperty(form, 'reportValidity', { value: validityReporterStub })
//
//     form.dispatchEvent(new window.Event('submit'))
//
//     assert.isTrue(submitEventSpy.calledOnce)
//     assert.isTrue(validityReporterStub.notCalled)
//   })
//
//   test('When the submit button with formNoValidate set to true is the first submit button, then submit without reporting errors', () => {
//     const form = window.document.createElement('form')
//     const submitButton = window.document.createElement('button')
//     const fakeButton = window.document.createElement('button')
//     const submitEventSpy = sinon.spy()
//     const validityReporterStub = sinon.stub().returns(true)
//
//     submitButton.formNoValidate = true
//     form.addEventListener('submit', submitGuard)
//     form.addEventListener('submit', submitEventSpy)
//     Object.defineProperty(form, 'reportValidity', { value: validityReporterStub })
//
//     // submitButton is first
//     form.appendChild(submitButton)
//     form.appendChild(fakeButton)
//
//     form.dispatchEvent(new window.Event('submit'))
//
//     assert.isTrue(submitEventSpy.calledOnce)
//     assert.isTrue(validityReporterStub.notCalled)
//
//     // submitButton is second
//     form.appendChild(submitButton)
//
//     form.dispatchEvent(new window.Event('submit'))
//
//     assert.isTrue(validityReporterStub.calledOnce)
//   })
//
//   test('When the submit button with formNoValidate set to true is the submitter, then submit without reporting errors', () => {
//     const form = window.document.createElement('form')
//     const submitButton = window.document.createElement('button')
//     const submitEventSpy = sinon.spy()
//     const validityReporterStub = sinon.stub().returns(true)
//
//     submitButton.formNoValidate = true
//     form.appendChild(submitButton)
//     form.addEventListener('submit', submitGuard)
//     form.addEventListener('submit', submitEventSpy)
//     Object.defineProperty(form, 'reportValidity', { value: validityReporterStub })
//     Object.defineProperty(window.document, 'activeElement', { get() { return submitButton } })
//
//     form.dispatchEvent(new window.Event('submit'))
//
//     assert.isTrue(submitEventSpy.calledOnce)
//     assert.isTrue(validityReporterStub.notCalled)
//   })
// })
