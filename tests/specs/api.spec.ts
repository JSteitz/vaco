import type { ValidationMessages, ValidityStateFlags } from '../../lib/api';

import { test } from 'zora';
import { spy, noop } from '../utils';
import {
  setValidity,
  setCustomValidity,
  checkValidity,
  reportValidity,
  getValidationMessage,
  createValidityState,
  resetValidity,
  interactivelyValidate,
  staticallyValidate,
  ValidityStateDescriptor,
} from '../../lib/api';

test(
  'createValidityState :: Creates a validity state object',
  (assert) => {
    const validityState = createValidityState(['badInput']);

    assert.ok('badInput' in validityState, 'given flags exist');
    assert.notOk(validityState.badInput, 'given flags are set to false');

    assert.ok('customError' in validityState, 'default flag customError exists');
    assert.notOk(validityState.customError, 'default flag customErrors is set to false');

    assert.ok('valid' in validityState, 'state flag exists');
    assert.ok(validityState.valid, 'state flag is set to true');
  }
);

test(
  'setValidity :: Throw an error if no message with a positive flag is given',
  (assert) => {
    const control = document.createElement('input');

    assert.throws(setValidity.bind(null, {}, control, { customError: true }, undefined), 'throws for missing message');
    assert.throws(setValidity.bind(null, {}, control, { customError: true }, ''), 'throws for empty message');
  }
);

test(
  'setValidity :: Set validity flags',
  (assert) => {
    const validControl = document.createElement('input');
    const invalidControl = document.createElement('input');

    Object.defineProperty(invalidControl, 'willValidate', { value: false });

    assert.notOk(invalidControl.validity.customError, 'initial state verified');
    setValidity({}, invalidControl, { customError: true }, 'validation message');
    assert.notOk(invalidControl.validity.customError, 'does not change validity for invalid controls');

    assert.notOk(validControl.validity.customError, 'initial state verified');
    setValidity({}, validControl, { customError: true }, 'validation message');
    assert.ok(validControl.validity.customError, 'validity state is set');
  }
);

test(
  'setValidity :: Set validation message',
  (assert) => {
    const control = document.createElement('input');
    const validationMessages: ValidationMessages = {};
    const validationMessage = 'validation message';

    setValidity(validationMessages, control, { customError: true }, validationMessage);
    assert.equal(validationMessages.customError, validationMessage, 'validation message is set');
  }
);

test(
  'setValidity :: Set validity state to false if a positive validity flag is set',
  (assert) => {
    const control = document.createElement('input');

    assert.ok(control.validity.valid, 'initial state verified');
    setValidity({}, control, { customError: true }, 'validation message');
    assert.notOk(control.validity.valid, 'validity state is set to false');
  }
);

test(
  'setValidity :: Clear validation message for negative validity flags',
  (assert) => {
    const control = document.createElement('input');
    const validationMessages: ValidationMessages = {};
    const validationMessage = 'validation message';

    setValidity(validationMessages, control, { customError: true }, validationMessage);
    setValidity(validationMessages, control, { customError: false });

    assert.equal(validationMessages.customError, undefined, 'validation message is unset');
  }
);

test(
  'setCustomValidity :: Set customError validity with message',
  (assert) => {
    const control = document.createElement('input');
    const validationMessages: ValidationMessages = {};
    const validationMessage = 'validation message';

    setCustomValidity(validationMessages, control, validationMessage);
    assert.ok(control.validity.customError, 'customError flag is set');
    assert.equal(validationMessages.customError, validationMessage, 'validation message is set');
  }
);

test(
  'setCustomValidity :: Clear customError validity if the message is an empty string',
  (assert) => {
    const control = document.createElement('input');
    const validationMessages: ValidationMessages = {};

    setCustomValidity(validationMessages, control, 'validation message');
    setCustomValidity(validationMessages, control, '');

    assert.notOk(control.validity.customError, 'customError flag is unset');
    assert.equal(validationMessages.customError, undefined, 'validation message is unset');
  }
);

test(
  'resetValidity :: Resets the validity state',
  (assert) => {
    const control = document.createElement('input');
    const validationMessages: ValidationMessages = {
      customError: "validation message",
      customError2: "validation message",
    };

    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false));
    Object.defineProperty(control.validity, 'customError', ValidityStateDescriptor(true));
    Object.defineProperty(control.validity, 'customError2', ValidityStateDescriptor(true));

    resetValidity(validationMessages, control, ['customError']);

    assert.equal(validationMessages.customError, undefined, 'validation message is removed');
    assert.notOk(control.validity.customError, 'customError flag is false');
    assert.notOk(control.validity.valid, 'valid flag is false (not all flags reset)');

    resetValidity(validationMessages, control, ['customError2']);
    assert.equal(validationMessages.customError2, undefined, 'validation message is removed');
    assert.notOk(control.validity.customError2, 'customError2 flag is false');
    assert.ok(control.validity.valid, 'valid flag is true (all flags reset)');
  },
)

test(
  'checkValidity :: Test validity state',
  (assert) => {
    const validControl = document.createElement('input');
    const invalidControl = document.createElement('input');
    const willNotValidateInput = document.createElement('input');

    Object.defineProperty(validControl.validity, 'valid', ValidityStateDescriptor(true));
    Object.defineProperty(invalidControl.validity, 'valid', ValidityStateDescriptor(false));
    Object.defineProperty(willNotValidateInput.validity, 'valid', ValidityStateDescriptor(false));
    Object.defineProperty(willNotValidateInput, 'willValidate', { get: () => false });

    assert.ok(checkValidity(validControl), 'result is positive for valid controls');
    assert.notOk(checkValidity(invalidControl), 'result is negative for invalid controls');
    assert.ok(checkValidity(willNotValidateInput), 'result is positive for controls barred from validation');
  }
);

test(
  'checkValidity :: Emit event "invalid" when the result is negative',
  (assert) => {
    const control = document.createElement('input');
    const eventHandler = spy();

    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false));

    control.addEventListener('invalid', eventHandler);

    assert.notOk(checkValidity(control), 'result is negative')
    assert.equal(eventHandler.callCount, 1, 'event "invalid" emitted');
  }
);

test(
  'checkValidity :: Emit event "valid" when the result is positive',
  (assert) => {
    const control = document.createElement('input');
    const eventHandler = spy();

    control.addEventListener('valid', eventHandler);

    assert.ok(checkValidity(control), 'result is positive')
    assert.equal(eventHandler.callCount, 1, 'event "valid" emitted');
  }
);

test(
  'reportValidity :: Test validity state',
  (assert) => {
    const validControl = document.createElement('input');
    const invalidControl = document.createElement('input');
    const willNotValidateInput = document.createElement('input');
    const reporter = noop;

    Object.defineProperty(validControl.validity, 'valid', ValidityStateDescriptor(true));
    Object.defineProperty(invalidControl.validity, 'valid', ValidityStateDescriptor(false));
    Object.defineProperty(willNotValidateInput.validity, 'valid', ValidityStateDescriptor(false));
    Object.defineProperty(willNotValidateInput, 'willValidate', { get: () => false });

    assert.ok(reportValidity(reporter, validControl), 'result is positive for valid controls');
    assert.notOk(reportValidity(reporter, invalidControl), 'result is negative for invalid controls');
    assert.ok(reportValidity(reporter, willNotValidateInput), 'result is positive for controls barred from validation');
  }
);

test(
  'reportValidity :: Emit event "invalid" when the result is negative',
  (assert) => {
    const control = document.createElement('input');
    const reporter = noop;
    const eventHandler = spy();

    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false));

    control.addEventListener('invalid', eventHandler);

    assert.notOk(reportValidity(reporter, control), 'result is negative');
    assert.equal(eventHandler.callCount, 1, 'event "invalid" emitted');
  }
);

test(
  'reportValidity :: Emit event "valid" if the result is positive',
  (assert) => {
    const control = document.createElement('input');
    const reporter = noop;
    const eventHandler = spy();

    control.addEventListener('valid', eventHandler);

    assert.ok(reportValidity(reporter, control), 'result is positive');
    assert.equal(eventHandler.callCount, 1, 'event "valid" emitted');
  }
);

test(
  'reportValidity :: Invoke the validity reporter regardless of result',
  (assert) => {
    const validControl = document.createElement('input');
    const invalidControl = document.createElement('input');
    const reporter = spy();

    Object.defineProperty(invalidControl.validity, 'valid', ValidityStateDescriptor(false));

    assert.ok(reportValidity(reporter, validControl), 'result is positive');
    assert.equal(reporter.callCount, 1, 'validityReporter invoked for valid controls');

    assert.notOk(reportValidity(reporter, invalidControl), 'result is negative');
    assert.equal(reporter.callCount, 2, 'validityReporter invoked for invalid controls');
  }
);

test(
  'reportValidity :: Allow to cancel the events to prevent invoking validityReporter',
  (assert) => {
    const validControl = document.createElement('input');
    const invalidControl = document.createElement('input');
    const reporter = spy();

    Object.defineProperty(invalidControl.validity, 'valid', ValidityStateDescriptor(false));

    // valid
    validControl.addEventListener('valid', (event) => {
      event.preventDefault();
    });

    assert.ok(reportValidity(reporter, validControl), 'result is positive');
    assert.equal(reporter.callCount, 0, 'validityReporter is not invoked for valid controls');

    // invalid
    invalidControl.addEventListener('invalid', (event) => {
      event.preventDefault();
    });

    assert.notOk(reportValidity(reporter, invalidControl), 'result is negative');
    assert.equal(reporter.callCount, 0, 'validityReporter is not invoked for invalid controls');
  }
);

test(
  'getValidationMessage :: Return an empty string when control will not validate',
  (assert) => {
    const control = document.createElement('input');
    const validationMessages: ValidationMessages = {};

    Object.defineProperty(control, 'willValidate', { get: () => false });

    assert.equal(getValidationMessage(validationMessages, control), '', 'validation message is an empty string');
  }
);

test(
  'getValidationMessage :: Return an empty string when no message was found for control',
  (assert) => {
    const control = document.createElement('input');
    const validationMessages: ValidationMessages = {};

    Object.defineProperty(control, 'willValidate', { get: () => true });

    assert.equal(getValidationMessage(validationMessages, control), '', 'validation message is an empty string');
  }
);

test(
  'getValidationMessage :: Return first message in the validation message bag',
  (assert) => {
    const control = document.createElement('input');
    const validationMessages: ValidationMessages = {};
    const firstErrorMessage = 'error 1';
    const secondErrorMessage = 'error 2';

    Object.defineProperty(control, 'willValidate', { get: () => true });

    setValidity(validationMessages, control, { badInput: true } as ValidityStateFlags, firstErrorMessage);
    setValidity(validationMessages, control, { customError: true }, secondErrorMessage);
    assert.equal(getValidationMessage(validationMessages, control), firstErrorMessage, 'correct message returned');
  }
);

test(
  'interativelyValidate :: Skip controls barred from validation',
  (assert) => {
    const form = window.document.createElement('form')
    const validControl = window.document.createElement('input')
    const invalidControl = window.document.createElement('input')
    const reporter = noop;

    form.appendChild(validControl)
    form.appendChild(invalidControl)

    // the disabled state is one of many options to be barred from validation
    validControl.disabled = true
    invalidControl.disabled = true
    Object.defineProperty(invalidControl.validity, 'valid', ValidityStateDescriptor(false))

    assert.notOk(validControl.willValidate, 'valid controls are barred from validation')
    assert.notOk(invalidControl.willValidate, 'invalid controls are barred from validation')
    assert.ok(interactivelyValidate(reporter, form), 'result is positive')
  }
);

test(
  'interativelyValidate :: Return positive result when all controls are valid',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const reporter = noop;

    form.appendChild(control)

    assert.ok(interactivelyValidate(reporter, form), 'result is positive')
  }
);

test(
  'interativelyValidate :: Return list of unhandled controls when a control is invalid',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const reporter = noop

    form.appendChild(control)
    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false))

    assert.deepEqual(interactivelyValidate(reporter, form), [control], 'result is negative with unhandled controls')
  }
);

test(
  'interativelyValidate :: Emit event "valid" for valid controls',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const reporter = noop;
    const eventHandler = spy();

    form.appendChild(control)
    control.addEventListener('valid', eventHandler)

    assert.ok(interactivelyValidate(reporter, form), 'result is positive')
    assert.equal(eventHandler.callCount, 1, 'event "valid" emitted')
  }
);

test(
  'interativelyValidate :: Emit event "valid" for a form when all controls are valid',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const reporter = noop;
    const eventHandler = spy();

    form.appendChild(control)
    form.addEventListener('valid', eventHandler)

    assert.ok(interactivelyValidate(reporter, form), 'result is positive')
    assert.equal(eventHandler.callCount, 1, 'event "valid" emitted')
  }
);

test(
  'interativelyValidate :: Emit event "invalid" for invalid controls',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const reporter = noop;
    const eventHandler = spy();

    form.appendChild(control)
    control.addEventListener('invalid', eventHandler)
    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false))

    assert.deepEqual(interactivelyValidate(reporter, form), [control], 'result is negative with unhandled controls')
    assert.equal(eventHandler.callCount, 1, 'event "invalid" emitted')
  }
);

test(
  'interativelyValidate :: Emit event "invalid" for a form when a control is invalid',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const reporter = noop;
    const eventHandler = spy();

    form.appendChild(control)
    form.addEventListener('invalid', eventHandler)
    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false))

    assert.deepEqual(interactivelyValidate(reporter, form), [control], 'result is negative with unhandled controls')
    assert.equal(eventHandler.callCount, 1, 'event "invalid" emitted')
  }
);

test(
  'interativelyValidate :: Invoke validity reporter when the emitted events "valid" and "invalid" are not cancelled',
  (assert) => {
    const form = window.document.createElement('form')
    const validControl = window.document.createElement('input')
    const invalidControl = window.document.createElement('input')
    const reporter = spy();

    form.appendChild(validControl)
    form.appendChild(invalidControl)
    Object.defineProperty(invalidControl.validity, 'valid', ValidityStateDescriptor(false))

    // without cancelling
    assert.deepEqual(interactivelyValidate(reporter, form), [invalidControl], 'result is negative with unhandled controls')
    assert.equal(reporter.callCount, 2, 'validity reporter invoked for all controls')

    // with cancelling
    validControl.addEventListener('valid', (event: Event): void => event.preventDefault())
    invalidControl.addEventListener('invalid', (event: Event): void => event.preventDefault())

    // no change in calls
    assert.deepEqual(interactivelyValidate(reporter, form), [], 'result is negative')
    assert.equal(reporter.callCount, 2, 'validity reporter not invoked for cancelled control events')
  }
);

test(
  'staticallyValidate :: Skip controls barred from validation',
  (assert) => {
    const form = window.document.createElement('form')
    const validControl = window.document.createElement('input')
    const invalidControl = window.document.createElement('input')

    form.appendChild(validControl)
    form.appendChild(invalidControl)

    // the disabled state is one of many options to be barred from validation
    validControl.disabled = true
    invalidControl.disabled = true
    Object.defineProperty(invalidControl.validity, 'valid', ValidityStateDescriptor(false))

    assert.notOk(validControl.willValidate, 'valid controls are barred from validation')
    assert.notOk(invalidControl.willValidate, 'invalid controls are barred from validation')
    assert.ok(staticallyValidate(form), 'result is positive')
  }
);

test(
  'staticallyValidate :: Return positive result when all controls are valid',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')

    form.appendChild(control)

    assert.ok(staticallyValidate(form), 'form is valid')
  }
);

test(
  'staticallyValidate :: Return list of unhandled controls when a control is invalid',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')

    form.appendChild(control)
    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false))

    assert.deepEqual(staticallyValidate(form), [control], 'result is negative with unhandled controls')
  }
);

test(
  'staticallyValidate :: Emit event "valid" for valid controls',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const eventHandler = spy();

    form.appendChild(control)
    control.addEventListener('valid', eventHandler)

    assert.ok(staticallyValidate(form), 'result is positive')
    assert.equal(eventHandler.callCount, 1, 'event "valid" emitted')
  }
);

test(
  'staticallyValidate :: Emit event "valid" for a form when all controls are valid',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const eventHandler = spy();

    form.appendChild(control)
    form.addEventListener('valid', eventHandler)

    assert.ok(staticallyValidate(form), 'result is positive')
    assert.equal(eventHandler.callCount, 1, 'event "valid" emitted')
  }
);

test(
  'staticallyValidate :: Emit event "invalid" for invalid controls',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const eventHandler = spy();

    form.appendChild(control)
    control.addEventListener('invalid', eventHandler)
    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false))

    assert.deepEqual(staticallyValidate(form), [control], 'result is negative with unhandled controls')
    assert.equal(eventHandler.callCount, 1, 'event "invalid" emitted')
  }
);

test(
  'staticallyValidate :: Emit event "invalid" for a form when a control is invalid',
  (assert) => {
    const form = window.document.createElement('form')
    const control = window.document.createElement('input')
    const eventHandler = spy();

    form.appendChild(control)
    form.addEventListener('invalid', eventHandler)
    Object.defineProperty(control.validity, 'valid', ValidityStateDescriptor(false))

    assert.deepEqual(staticallyValidate(form), [control], 'result is negative with unhandled controls')
    assert.equal(eventHandler.callCount, 1, 'event "invalid" emitted')
  }
);
