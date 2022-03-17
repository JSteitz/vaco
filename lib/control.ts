import { VacoState } from '.';
import {
  checkValidity,
  createValidityState,
  getValidationMessage,
  reportValidity,
  resetValidity,
  setCustomValidity,
  setValidity,
  ValidationMessages,
  ValidityStateFlags,
} from './api';
import {
  isSubmittableElement,
  ListedElement
} from './utils';

export type ControlApi = {
  setValidity: (flags: ValidityStateFlags, message?: string) => void;
  resetValidityState: () => void;
  reset: () => void;
};

/**
 * @todo add documentation
 * @signature reset :: VacoState -> ListedElement -> () -> void
 */
const reset =
  ({ validator, observer }: VacoState) =>
    (control: ListedElement) =>
      (): void => {
        if (isSubmittableElement(control)) {
          observer.disconnect(control);
          control.removeEventListener('input', validator.run);
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
      };

/**
 * Setup control with the validation api
 *
 * @todo improve documentation
 * Creates the validation api for the given element and binds some of them as public methods to the
 * element itself. Afterwards it return the api.
 *
 * @signature create :: VacoState -> ListedElement -> ControlApi
 */
export default
  ({ reporter, states, validator, observer }: VacoState) =>
    (control: ListedElement): ControlApi => {
      const validationMessages: ValidationMessages = {};
      const validity = createValidityState(states);
      const prototype = Object.getPrototypeOf(control);
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      const getter = Object.getOwnPropertyDescriptor(prototype, 'value')?.get;

      Object.defineProperty(control, 'validationMessage', {
        configurable: true,
        enumerable: true,
        get: getValidationMessage(validationMessages)(control)
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
        value: setCustomValidity(validationMessages)(control)
      });

      Object.defineProperty(control, 'checkValidity', {
        configurable: true,
        enumerable: true,
        value: checkValidity(control)
      });

      Object.defineProperty(control, 'reportValidity', {
        configurable: true,
        enumerable: true,
        value: reportValidity(reporter)(control)
      });

      if (isSubmittableElement(control)) {
        Object.defineProperty(control, 'value', {
          configurable: true,
          enumerable: true,
          set(value: unknown) {
            setter?.apply(this, [value]);
            validator.run(control);
          },
          get() {
            return getter?.apply(this);
          }
        });

        observer.connect(control);
        control.addEventListener('input', validator.run);
      }

      return {
        setValidity: setValidity(validationMessages)(control),
        resetValidityState: resetValidity(validationMessages)(control)(states),
        reset: reset({ validator, observer } as VacoState)(control)
      };
    };
