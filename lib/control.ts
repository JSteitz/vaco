import type { ValidationMessages, ValidityStateFlags } from './api';
import type { ListedElement } from './utils';
import {
  checkValidity, createValidityState, getValidationMessage, reportValidity, resetValidity,
  setCustomValidity, setValidity, willValidate
} from './api';
import { cloneProperties } from './utils';

export type NativeControlApi = {
  validationMessage: string;
  validity: ValidityState;
  willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(validationMessage: string): void;
};

export type ControlApi = {
  willValidate(): boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setValidity(flags: ValidityStateFlags, message?: string): void;
  setCustomValidity(validationMessage: string): void;
  getValidationMessage(): string;
  resetValidityState(): void;
  createValidityState(): ValidityState;
};

/**
 * @todo add documentation
 * @signature create :: CallableFunction -> [string] -> ListedElement -> ControlApiInterface
 */
export const createControlApi =
  (reporter: CallableFunction, flags: string[], control: ListedElement): ControlApi => {
    const validationMessages: ValidationMessages = {};

    return {
      willValidate: willValidate(control),
      checkValidity: checkValidity(control),
      reportValidity: reportValidity(reporter)(control),
      setValidity: setValidity(validationMessages)(control),
      setCustomValidity: setCustomValidity(validationMessages)(control),
      getValidationMessage: getValidationMessage(validationMessages)(control),
      resetValidityState: resetValidity(validationMessages)(control)(flags),
      createValidityState: createValidityState(flags)
    };
  };

/**
 * Setup control with the validation api
 *
 * @todo improve documentation
 * Creates the validation api for the given element and binds some of them as public methods to the
 * element itself. Afterwards it return the api.
 *
 * @signature create :: ControlApi -> ListedElement -> NativeControlApi
 */
export const setupControl =
  (api: ControlApi) =>
    (validate: CallableFunction) =>
      (control: ListedElement): NativeControlApi => {
        const validity = api.createValidityState();
        const nativeControlApi = cloneProperties(
          ['willValidate', 'validity', 'validationMessage', 'setCustomValidity', 'checkValidity', 'reportValidity'],
          control
        ) as NativeControlApi;
        const prototype = Object.getPrototypeOf(control);
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        const getter = Object.getOwnPropertyDescriptor(prototype, 'value')?.get;

        // Override with custom api
        Object.defineProperty(control, 'willValidate', {
          configurable: true,
          enumerable: true,
          get: api.willValidate
        });

        Object.defineProperty(control, 'validationMessage', {
          configurable: true,
          enumerable: true,
          get: api.getValidationMessage
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
          value: api.setCustomValidity
        });

        Object.defineProperty(control, 'checkValidity', {
          configurable: true,
          enumerable: true,
          value: api.checkValidity
        });

        Object.defineProperty(control, 'reportValidity', {
          configurable: true,
          enumerable: true,
          value: api.reportValidity
        });

        Object.defineProperty(control, 'value', {
          configurable: true,
          enumerable: true,
          set(...args: any) {
            setter?.apply(this, args);
            validate(control);
          },
          get(...args: any) {
            return getter?.apply(this, args);
          }
        });

        control.addEventListener('input', (): void => validate(control));

        return nativeControlApi;
      };

/**
 * @todo add documentation
 * @signature teardown :: ListedElement
 */
export const teardownControl =
  (control: ListedElement): void => {
    // @ts-ignore: removes overridden properties
    // noinspection JSConstantReassignment
    delete control.willValidate;
    // @ts-ignore: removes overridden properties
    // noinspection JSConstantReassignment
    delete control.validationMessage;
    // @ts-ignore: removes overridden properties
    // noinspection JSConstantReassignment
    delete control.validity;
    // @ts-ignore: removes overridden properties
    delete control.setCustomValidity;
    // @ts-ignore: removes overridden properties
    delete control.checkValidity;
    // @ts-ignore: removes overridden properties
    delete control.reportValidity;
  };
