import type { VacoState } from './index';
import type { ValidationMessages, ValidityStateFlags } from './api';
import type { ListedElement } from './utils';

import { checkValidity, createValidityState, getValidationMessage, reportValidity, resetValidity, setCustomValidity, setValidity } from './api';
import { isSubmittableElement } from './utils';

export type ControlApi = {
  setValidity: (flags: ValidityStateFlags, message?: string) => void;
  resetValidityState: () => void;
  reset: () => void;
};

/**
 * @todo add documentation
 */
function reset(state: VacoState, control: ListedElement, validatorEventListener: EventListenerOrEventListenerObject | undefined): void {
  if (isSubmittableElement(control)) {
    state.observer.disconnect(control);

    if (validatorEventListener !== undefined) {
      control.removeEventListener('input', validatorEventListener);
    }
  }

  // @ts-ignore: removes overridden properties
  delete control.validationMessage;
  // @ts-ignore: removes overridden properties
  delete control.validity;
  // @ts-ignore: removes overridden properties
  delete control.setCustomValidity;
  // @ts-ignore: removes overridden properties
  delete control.checkValidity;
  // @ts-ignore: removes overridden properties
  delete control.reportValidity;
  // @ts-ignore: removes overridden properties
  delete control.value;
}

/**
 * Setup control with the validation api
 *
 * @todo improve documentation
 * Creates the validation api for the given element and binds some of them as public methods to the
 * element itself. Afterwards it return the api.
 */
export function setup(state: VacoState, control: ListedElement): ControlApi {
  const { reporter, states, validator, observer } = state;
  const validationMessages: ValidationMessages = {};
  const validity = createValidityState(states);
  let validatorEventListener: EventListenerOrEventListenerObject | undefined;

  Object.defineProperty(control, 'validationMessage', {
    configurable: true,
    enumerable: true,
    get: getValidationMessage.bind(null, validationMessages, control)
  });

  Object.defineProperty(control, 'validity', {
    configurable: true,
    enumerable: true,
    get: (): ValidityState => validity
  });

  Object.defineProperty(control, 'setCustomValidity', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: setCustomValidity.bind(null, validationMessages, control)
  });

  Object.defineProperty(control, 'checkValidity', {
    configurable: true,
    enumerable: true,
    value: checkValidity.bind(null, control)
  });

  Object.defineProperty(control, 'reportValidity', {
    configurable: true,
    enumerable: true,
    value: reportValidity.bind(null, reporter, control)
  });

  if (isSubmittableElement(control)) {
    const prototype = Object.getPrototypeOf(control);
    const valuePropertyDescriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

    validatorEventListener = validator.run.bind(null, control);

    Object.defineProperty(control, 'value', {
      configurable: true,
      enumerable: true,
      set(value: unknown) {
        valuePropertyDescriptor?.set?.apply(this, [value]);
        validator.run(control);
      },
      get() {
        return valuePropertyDescriptor?.get?.apply(this);
      }
    });

    observer.connect(control);
    control.addEventListener('input', validatorEventListener);
  }

  if (control instanceof HTMLFieldSetElement) {
    const prototype = Object.getPrototypeOf(control);
    const disabledPropertyDescriptor = Object.getOwnPropertyDescriptor(control, 'disabled')
      || Object.getOwnPropertyDescriptor(prototype, 'disabled');

    Object.defineProperty(control, 'disabled', {
      configurable: true,
      enumerable: true,
      set(value: unknown) {
        disabledPropertyDescriptor?.set?.apply(this, [value]);
        [...control.elements].filter(isSubmittableElement).forEach(validator.run);
      },
      get() {
        return disabledPropertyDescriptor?.get?.apply(this);
      }
    });
  }

  return {
    setValidity: setValidity.bind(null, validationMessages, control),
    resetValidityState: resetValidity.bind(null, validationMessages, control, states),
    reset: reset.bind(null, state, control, validatorEventListener),
  };
}
