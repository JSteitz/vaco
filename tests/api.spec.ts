import { test } from 'zora';
import { noop, spy } from './helpers';
import {
  ValidationMessages,
  isBarredFromConstraintValidation,
  setValidity,
  setCustomValidity,
  checkValidity,
  reportValidity,
  willValidate,
  getValidationMessage,
  createValidityState,
  ValidityStateFlags
} from '../lib/api';

test(
  'createValidityState :: Creates a validity state object',
  (assert) => {
    const result = createValidityState(['badInput'])();

    assert.ok('badInput' in result, 'given flags exist');
    assert.equal(result.badInput, false, 'given flags are set to false');

    assert.ok('customError' in result, 'default flag customError exists');
    assert.equal(result.customError, false, 'default flag customErrors is set to false');

    assert.ok('valid' in result, 'state flag exists');
    assert.equal(result.valid, true, 'state flag is set to true');
  }
);

test(
  'setValidity :: Throw an error if no message with a positive flag is given',
  (assert) => {
    const input = document.createElement('input');

    assert.throws(
      setValidity({})(input).bind(null, { customError: true }),
      'throws for missing message'
    );

    assert.throws(
      setValidity({})(input).bind(null, { customError: true }, ''),
      'throws for empty message'
    );

    setValidity({})(input)({ customError: false });
    assert.ok(
      true,
      'does not throw for negative flag'
    );
  }
);

test(
  'setValidity :: Set validity flags',
  (assert) => {
    const input = document.createElement('input');
    const invalidInput = document.createElement('input');

    Object.defineProperty(invalidInput, 'willValidate', { value: false });

    setValidity({})(invalidInput)({ customError: true }, 'validation message');
    assert.equal(
      invalidInput.validity.customError,
      false,
      'does not change validity for invalid inputs'
    );

    assert.equal(input.validity.customError, false, 'initial state verified');
    setValidity({})(input)({ customError: true }, 'validation message');
    assert.equal(input.validity.customError, true, 'validity state is set');
  }
);

test(
  'setValidity :: Set validation message',
  (assert) => {
    const input = document.createElement('input');
    const validationMessages: ValidationMessages = {};
    const validationMessage = 'validation message';

    setValidity(validationMessages)(input)({ customError: true }, validationMessage);
    assert.equal(
      validationMessages.customError,
      validationMessage,
      'validation message is set'
    );
  }
);

test(
  'setValidity :: Set validity state to false if a positive validity flag is set',
  (assert) => {
    const input = document.createElement('input');

    assert.equal(input.validity.valid, true, 'initial state verified');
    setValidity({})(input)({ customError: true }, 'validation message');
    assert.equal(input.validity.valid, false, 'validity state is set to false');
  }
);

test(
  'setValidity :: Clear validation message for negative validity flags',
  (assert) => {
    const input = document.createElement('input');
    const validationMessages: ValidationMessages = {};
    const validationMessage = 'validation message';

    setValidity(validationMessages)(input)({ customError: true }, validationMessage);
    setValidity(validationMessages)(input)({ customError: false });

    assert.equal(
      validationMessages.customError,
      undefined,
      'validation message is unset'
    );
  }
);

test(
  'setCustomValidity :: Set customError validity with message',
  (assert) => {
    const input = document.createElement('input');
    const validationMessages: ValidationMessages = {};
    const validationMessage = 'validation message';

    setCustomValidity(validationMessages)(input)(validationMessage);
    assert.equal(input.validity.customError, true, 'customError flag is set');
    assert.equal(
      validationMessages.customError,
      validationMessage,
      'validation message is set'
    );
  }
);

test(
  'setCustomValidity :: Clear customError validity if the message is an empty string',
  (assert) => {
    const input = document.createElement('input');
    const validationMessages: ValidationMessages = {};

    setCustomValidity(validationMessages)(input)('validation message');
    setCustomValidity(validationMessages)(input)('');

    assert.equal(input.validity.customError, false, 'customError flag is unset');
    assert.equal(validationMessages.customError, undefined, 'validation message is unset');
  }
);

test(
  'checkValidity :: Test validity status',
  (assert) => {
    const validInput = document.createElement('input');
    const invalidInput = document.createElement('input');
    const willNotValidateInput = document.createElement('input');

    Object.defineProperty(validInput, 'validity', {
      get: () => ({ valid: true })
    });

    Object.defineProperty(invalidInput, 'validity', {
      get: () => ({ valid: false })
    });

    Object.defineProperty(willNotValidateInput, 'validity', {
      get: () => ({ valid: false })
    });

    Object.defineProperty(willNotValidateInput, 'willValidate', {
      get: () => false
    });

    assert.equal(checkValidity(validInput)(), true, 'result is positive for valid inputs');
    assert.equal(checkValidity(invalidInput)(), false, 'result is negative for invalid inputs');
    assert.equal(
      checkValidity(willNotValidateInput)(),
      true,
      'result is positive for invalid inputs with property willValidate = false'
    );
  }
);

test(
  'checkValidity :: Dispatch event "invalid" if the result is negative',
  (assert) => {
    const input = document.createElement('input');
    const eventHandler = spy();

    Object.defineProperty(input, 'validity', {
      get: () => ({ valid: false })
    });

    input.addEventListener('invalid', eventHandler);

    checkValidity(input)();

    assert.equal(eventHandler.callCount, 1, 'event "invalid" dispatched');
  }
);

test(
  'checkValidity :: Dispatch event "valid" if the result is positive',
  (assert) => {
    const input = document.createElement('input');
    const eventHandler = spy();

    input.addEventListener('valid', eventHandler);

    checkValidity(input)();

    assert.equal(eventHandler.callCount, 1, 'event "valid" dispatched');
  }
);

test(
  'reportValidity :: Test validity status',
  (assert) => {
    const validInput = document.createElement('input');
    const invalidInput = document.createElement('input');
    const willNotValidateInput = document.createElement('input');
    const reporter = noop;

    Object.defineProperty(validInput, 'validity', {
      get: () => ({ valid: true })
    });

    Object.defineProperty(invalidInput, 'validity', {
      get: () => ({ valid: false })
    });

    Object.defineProperty(willNotValidateInput, 'validity', {
      get: () => ({ valid: false })
    });

    Object.defineProperty(willNotValidateInput, 'willValidate', {
      get: () => false
    });

    assert.equal(
      reportValidity(reporter)(validInput)(),
      true,
      'result is positive for valid inputs'
    );
    assert.equal(
      reportValidity(reporter)(invalidInput)(),
      false,
      'result is negative for invalid inputs'
    );
    assert.equal(
      reportValidity(reporter)(willNotValidateInput)(),
      true,
      'result is positive for invalid inputs with property willValidate = false'
    );
  }
);

test(
  'reportValidity :: Dispatch event "invalid" if the result is negative',
  (assert) => {
    const input = document.createElement('input');
    const reporter = noop;
    const eventHandler = spy();

    Object.defineProperty(input, 'validity', {
      get: () => ({ valid: false })
    });

    input.addEventListener('invalid', eventHandler);

    reportValidity(reporter)(input)();

    assert.equal(eventHandler.callCount, 1, 'event "invalid" dispatched');
  }
);

test(
  'reportValidity :: Dispatch event "valid" if the result is positive',
  (assert) => {
    const input = document.createElement('input');
    const reporter = noop;
    const eventHandler = spy();

    input.addEventListener('valid', eventHandler);

    reportValidity(reporter)(input)();

    assert.equal(eventHandler.callCount, 1, 'event "valid" dispatched');
  }
);

test(
  'reportValidity :: Invoke the validity reporter regardless of result',
  (assert) => {
    const inputValid = document.createElement('input');
    const inputInvalid = document.createElement('input');
    const reporter = spy();

    Object.defineProperty(inputInvalid, 'validity', {
      get: () => ({ valid: false })
    });

    reportValidity(reporter)(inputValid)();
    assert.equal(reporter.callCount, 1, 'validityReporter invoked for valid inputs');

    reportValidity(reporter)(inputInvalid)();
    assert.equal(reporter.callCount, 2, 'validityReporter invoked for invalid inputs');
  }
);

test(
  'reportValidity :: Allow to cancel the events to prevent invoking validityReporter',
  (assert) => {
    const inputValid = document.createElement('input');
    const inputInvalid = document.createElement('input');
    const reporter = spy();

    Object.defineProperty(inputInvalid, 'validity', {
      get: () => ({ valid: false })
    });

    // valid
    inputValid.addEventListener('valid', (event) => {
      event.preventDefault();
    });

    reportValidity(reporter)(inputValid)();
    assert.equal(reporter.callCount, 0, 'validityReporter is not invoked for valid inputs');

    // invalid
    inputInvalid.addEventListener('invalid', (event) => {
      event.preventDefault();
    });

    reportValidity(reporter)(inputValid)();
    assert.equal(reporter.callCount, 0, 'validityReporter is not invoked for invalid inputs');
  }
);

test(
  'isBarredFromConstraintValidation :: Test all barred submittable elements',
  (assert) => {
    const fieldset = document.createElement('fieldset');
    const object = document.createElement('object');
    const inputTypeHidden = document.createElement('input');
    const inputTypeReset = document.createElement('input');
    const inputTypeButton = document.createElement('input');
    const readOnly = document.createElement('input');
    const disabled = document.createElement('input');
    const hidden = document.createElement('input');
    const datalist = document.createElement('datalist');
    const inDatalist = document.createElement('input');
    const buttonTypeReset = document.createElement('button');

    inputTypeHidden.type = 'hidden';
    inputTypeReset.type = 'reset';
    inputTypeButton.type = 'button';
    readOnly.readOnly = true;
    disabled.disabled = true;
    hidden.hidden = true;
    datalist.appendChild(inDatalist);
    buttonTypeReset.type = 'reset';

    assert.ok(
      isBarredFromConstraintValidation(fieldset),
      'fieldset is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(object),
      'object is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(inputTypeHidden),
      'input[type="hidden"] is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(inputTypeReset),
      'input[type"reset"] is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(inputTypeButton),
      'input[type"button"] is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(readOnly),
      'input[readonly] is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(disabled),
      'input[disabled] is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(hidden),
      'input[hidden] is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(inDatalist),
      'input in datalist is barred from constraint validation'
    );

    assert.ok(
      isBarredFromConstraintValidation(buttonTypeReset),
      'button[type="reset"] is barred from constraint validation'
    );
  }
);

test(
  'willValidate :: Test elements for the ability to validate',
  (assert) => {
    const barredElement = document.createElement('object');
    const notBarredElement = document.createElement('input');

    assert.notOk(willValidate(barredElement)(), 'barred element will not validate');
    assert.ok(willValidate(notBarredElement)(), 'not barred element will validate');
  }
);

test(
  'getValidationMessage :: Return an empty string if element will not validate',
  (assert) => {
    const input = document.createElement('input');
    const validationMessages: ValidationMessages = {};

    Object.defineProperty(input, 'willValidate', {
      get: () => false
    });

    assert.equal(
      getValidationMessage(validationMessages)(input)(),
      '',
      'validation message is an empty string'
    );
  }
);

test(
  'getValidationMessage :: Return an empty string if no message was found for element',
  (assert) => {
    const input = document.createElement('input');
    const validationMessages: ValidationMessages = {};

    Object.defineProperty(input, 'willValidate', {
      get: () => true
    });

    assert.equal(
      getValidationMessage(validationMessages)(input)(),
      '',
      'validation message is an empty string'
    );
  }
);

test(
  'getValidationMessage :: Return first message in the validation message bag',
  (assert) => {
    const input = document.createElement('input');
    const validationMessages: ValidationMessages = {};
    const firstErrorMessage = 'error 1';
    const secondErrorMessage = 'error 2';

    Object.defineProperty(input, 'willValidate', {
      get: () => true
    });

    setValidity(validationMessages)(input)({ badInput: true } as ValidityStateFlags, firstErrorMessage);
    setValidity(validationMessages)(input)({ customError: true }, secondErrorMessage);
    assert.equal(getValidationMessage(validationMessages)(input)(), firstErrorMessage);
  }
);

// test(
//   'resetValidity :: ',
//   (assert) => {
//     const input = document.createElement('input')
//   },
// )


// suite('Validation :: Form :: interactivelyValidate', () => {
//   setup(browser.setup)
//   teardown(browser.teardown)
//
//   test('When a control is barred from validation, then skip it', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const controlValid = window.document.createElement('input')
//     const controlInvalid = window.document.createElement('input')
//
//     form.appendChild(controlValid)
//     form.appendChild(controlInvalid)
//     // the disabled state is one of many options to be barred from validation
//     controlValid.disabled = true
//     controlInvalid.disabled = true
//     Object.defineProperty(controlInvalid, 'validity', { get() { return { valid: false } } })
//
//     const result = interactivelyValidate(validityReporter, form)
//
//     assert.isTrue(result)
//   })
//
//   test('When all controls are valid, then expect result to be true', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//
//     form.appendChild(control)
//
//     const result = interactivelyValidate(validityReporter, form)
//
//     assert.isTrue(result)
//   })
//
//   test('When a control is invalid, then expect the result to be a list of unhandled controls', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//
//     form.appendChild(control)
//     Object.defineProperty(control, 'validity', { get() { return { valid: false } } })
//
//     const result = interactivelyValidate(validityReporter, form)
//
//     assert.deepEqual(result, [control])
//   })
//
//   test('When a control is valid, then emit the event "valid" on the control', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//     const eventSpy = sinon.spy()
//
//     form.appendChild(control)
//     control.addEventListener('valid', eventSpy)
//
//     interactivelyValidate(validityReporter, form)
//
//     assert.isTrue(eventSpy.calledOnce)
//   })
//
//   test('When all controls are valid, then emit the event "valid" on the form', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//     const eventSpy = sinon.spy()
//
//     form.appendChild(control)
//     form.addEventListener('valid', eventSpy)
//
//     interactivelyValidate(validityReporter, form)
//
//     assert.isTrue(eventSpy.calledOnce)
//   })
//
//   test('When a control is invalid, then emit the event "invalid" on the control', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//     const eventSpy = sinon.spy()
//
//     form.appendChild(control)
//     control.addEventListener('invalid', eventSpy)
//     Object.defineProperty(control, 'validity', { get() { return { valid: false } } })
//
//     interactivelyValidate(validityReporter, form)
//
//     assert.isTrue(eventSpy.calledOnce)
//   })
//
//   test('When a control is invalid, then emit the event "invalid" on the form', () => {
//     const validityReporter = (): void => { /* */ }
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//     const eventSpy = sinon.spy()
//
//     form.appendChild(control)
//     form.addEventListener('invalid', eventSpy)
//     Object.defineProperty(control, 'validity', { get() { return { valid: false } } })
//
//     interactivelyValidate(validityReporter, form)
//
//     assert.isTrue(eventSpy.calledOnce)
//   })
//
//   test('When the events "valid" and "invalid" are not cancelled, then call the validity reporter', () => {
//     const validityReporter = sinon.spy()
//     const form = window.document.createElement('form')
//     const controlValid = window.document.createElement('input')
//     const controlInvalid = window.document.createElement('input')
//
//     form.appendChild(controlValid)
//     form.appendChild(controlInvalid)
//
//     // without cancelling
//     interactivelyValidate(validityReporter, form)
//
//     assert.isTrue(validityReporter.calledTwice)
//
//     // with cancelling
//     controlValid.addEventListener('valid', (event: Event): void => event.preventDefault())
//     controlInvalid.addEventListener('invalid', (event: Event): void => event.preventDefault())
//     Object.defineProperty(controlInvalid, 'validity', { get(): object { return { valid: false } } })
//
//     interactivelyValidate(validityReporter, form)
//
//     // no change in calls
//     assert.isTrue(validityReporter.calledTwice)
//   })
// })

// suite('Validation :: Form :: staticallyValidate', () => {
//   setup(browser.setup)
//   teardown(browser.teardown)
//
//   test('When a control is barred from validation, then skip it', () => {
//     const form = window.document.createElement('form')
//     const controlValid = window.document.createElement('input')
//     const controlInvalid = window.document.createElement('input')
//
//     form.appendChild(controlValid)
//     form.appendChild(controlInvalid)
//     // the disabled state is one of many options to be barred from validation
//     controlValid.disabled = true
//     controlInvalid.disabled = true
//     Object.defineProperty(controlInvalid, 'validity', { get() { return { valid: false } } })
//
//     const result = staticallyValidate(form)
//
//     assert.isTrue(result)
//   })
//
//   test('When all controls are valid, then expect result to be true', () => {
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//
//     form.appendChild(control)
//
//     const result = staticallyValidate(form)
//
//     assert.isTrue(result)
//   })
//
//   test('When a control is invalid, then expect the result to be a list of unhandled controls', () => {
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//
//     form.appendChild(control)
//     Object.defineProperty(control, 'validity', { get() { return { valid: false } } })
//
//     const result = staticallyValidate(form)
//
//     assert.deepEqual(result, [control])
//   })
//
//   test('When a control is valid, then emit the event "valid" on the control', () => {
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//     const eventSpy = sinon.spy()
//
//     form.appendChild(control)
//     control.addEventListener('valid', eventSpy)
//
//     staticallyValidate(form)
//
//     assert.isTrue(eventSpy.calledOnce)
//   })
//
//   test('When all controls are valid, then emit the event "valid" on the form', () => {
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//     const eventSpy = sinon.spy()
//
//     form.appendChild(control)
//     form.addEventListener('valid', eventSpy)
//
//     staticallyValidate(form)
//
//     assert.isTrue(eventSpy.calledOnce)
//   })
//
//   test('When a control is invalid, then emit the event "invalid" on the control', () => {
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//     const eventSpy = sinon.spy()
//
//     form.appendChild(control)
//     control.addEventListener('invalid', eventSpy)
//     Object.defineProperty(control, 'validity', { get() { return { valid: false } } })
//
//     staticallyValidate(form)
//
//     assert.isTrue(eventSpy.calledOnce)
//   })
//
//   test('When a control is invalid, then emit the event "invalid" on the form', () => {
//     const form = window.document.createElement('form')
//     const control = window.document.createElement('input')
//     const eventSpy = sinon.spy()
//
//     form.appendChild(control)
//     form.addEventListener('invalid', eventSpy)
//     Object.defineProperty(control, 'validity', { get() { return { valid: false } } })
//
//     staticallyValidate(form)
//
//     assert.isTrue(eventSpy.calledOnce)
//   })
// })
