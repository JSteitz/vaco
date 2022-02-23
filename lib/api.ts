import type { ListedElement, SubmittableElement } from './utils';
import { getSubmittableElements, isSubmittableElement } from './utils';

declare global {
  interface ValidityState {
    [key: string]: boolean;
  }
}

export interface ValidityStateFlags {
  readonly customError?: boolean;
}

export type ValidationMessages = {
  [key: string]: string;
};

export type ReporterCallback = (element: SubmittableElement) => void;

/**
 * Create property descriptor for validity states with the given value
 *
 * @signature ValidityStateDescriptor :: boolean a => a -> TypedPropertyDescriptor<a>
 */
export const ValidityStateDescriptor =
  (value: boolean): TypedPropertyDescriptor<boolean> => ({
    configurable: true,
    enumerable: true,
    writable: false,
    value
  });

/**
 * Create a validity state object with the provided flags
 *
 * All flags are initially set to false and the valid property to true.
 * The flag "custom" error is always included and should not be in list.
 *
 * @signature createValidityState :: [string] -> ValidityState
 */
export const createValidityState =
  (flags: string[]): ValidityState =>
    Object.create(null, flags.reduce(
      (result: PropertyDescriptorMap, flag: string) =>
        ({ ...result, [flag]: ValidityStateDescriptor(false) }),
      { customError: ValidityStateDescriptor(false), valid: ValidityStateDescriptor(true) }
    ));

/**
 * Test if internals target element has no validity problems
 *
 * Returns the current validity state for the internals target element and
 * fires an event at the element with "valid" if validity has no problems,
 * otherwise "invalid".
 *
 * @signature checkValidity :: ListedElement -> f -> boolean
 */
export const checkValidity =
  (element: ListedElement) =>
    (): boolean => {
      if (element.willValidate && !element.validity.valid) {
        element.dispatchEvent(new window.CustomEvent('invalid', { cancelable: true }));

        return false;
      }

      element.dispatchEvent(new window.CustomEvent('valid', { cancelable: true }));

      return true;
    };

/**
 * Get latest validation message for internals target element, if any
 *
 * Will always return an empty string, if element will not validate or
 * no message was found.
 *
 * @signature getValidationMessage :: ValidationMessages -> ListedElement -> f -> string
 */
export const getValidationMessage =
  (validationMessages: ValidationMessages) =>
    (element: ListedElement) =>
      (): string =>
        (element.willValidate ? Object.values(validationMessages)[0] ?? '' : '');

/**
 * Test element if it is a candidate for constraint validation
 *
 * @see https://html.spec.whatwg.org/#barred-from-constraint-validation
 *
 * @signature isBarredFromConstraintValidation :: SubmittableElement -> boolean
 */
export const isBarredFromConstraintValidation =
  (element: SubmittableElement): boolean => (
    element instanceof HTMLObjectElement
    || element instanceof HTMLFieldSetElement
    || element.type === 'hidden'
    || element.type === 'reset'
    || element.type === 'button'
    || ('readOnly' in element && element.readOnly)
    || element.disabled
    || element.hidden
    || element.closest('datalist') !== null
  );

/**
 * Test if internals target element has no validity problems and report to user
 *
 * Returns the current validity state for the internals target element and
 * fires an event at the element with "valid" if validity has no problems,
 * otherwise "invalid".
 *
 * For both states the user will get a report if the events are not canceled.
 *
 * @signature reportValidity :: CallableFunction -> ListedElement -> f -> boolean
 */
export const reportValidity =
  (validityReporter: CallableFunction) =>
    (element: ListedElement) =>
      (): boolean => {
        if (element.willValidate && !element.validity.valid) {
          if (element.dispatchEvent(new CustomEvent('invalid', { cancelable: true }))) {
            validityReporter(element);
          }

          return false;
        }

        if (element.dispatchEvent(new CustomEvent('valid', { cancelable: true }))) {
          validityReporter(element);
        }

        return true;
      };

/**
 * Marks internals target element as suffering from the constraints indicated
 * by the flags argument, and sets the element's validation message to message.
 *
 * @signature setValidity :: ValidationMessages -> ListedElement -> (ValidityStateFlags, string?) -> void
 */
export const setValidity =
  (validationMessages: ValidationMessages) =>
    (element: ListedElement) =>
      (flags: ValidityStateFlags, message?: string): void => {
        if (!element.willValidate) {
          return;
        }

        if (Object.values(flags).includes(true) && (!message || message === '')) {
          throw new TypeError('Message can not be empty for the given flags');
        }

        Object.entries(flags).forEach(([flag, value]) => {
          Object.defineProperty(element.validity, flag, ValidityStateDescriptor(value));

          if (value && message !== undefined) {
            validationMessages[flag] = message;
          } else {
            delete validationMessages[flag];
          }
        });

        Object.defineProperty(
          element.validity,
          'valid',
          ValidityStateDescriptor(
            Object.getOwnPropertyNames(element.validity)
              .filter((property: string): boolean => property !== 'valid')
              .every((property: string): boolean => (element.validity[property] === false))
          )
        );
      };

/**
 * Reset provided validity state flags to initial state for the element
 *
 * All existing related validation messages will be deleted and the valid state will be updated
 * for the current state of the elements validity.
 *
 * @signature resetValidity :: ValidationMessages -> ListedElement -> [string] -> f -> void
 */
export const resetValidity =
  (validationMessages: ValidationMessages) =>
    (element: ListedElement) =>
      (flags: string[]) =>
        (): void => {
          if (!element.willValidate) {
            return;
          }

          flags.forEach((flag: string) => {
            Object.defineProperty(element.validity, flag, ValidityStateDescriptor(false));
            delete validationMessages[flag];
          });

          Object.defineProperty(
            element.validity,
            'valid',
            ValidityStateDescriptor(
              Object.getOwnPropertyNames(element.validity)
                .filter((property: string): boolean => property !== 'valid')
                .every((property: string): boolean => (element.validity[property] === false))
            )
          );
        };

/**
 * Sets a custom error, so that the element would fail to validate
 *
 * The given message is the message to be shown to the user when reporting
 * the problem to the user. If the argument is the empty string, clears the
 * custom error.
 *
 * @signature setCustomValidity :: ValidationMessages -> ListedElement -> string -> void
 */
export const setCustomValidity =
  (validationMessages: ValidationMessages) =>
    (element: ListedElement) =>
      (validationMessage: string): void =>
        setValidity(validationMessages)(element)(
          { customError: validationMessage?.length > 0 ?? false },
          validationMessage
        );

/**
 * Test if internals target element will be validated
 *
 * @signature willValidate :: ListedElement -> f -> boolean
 */
export const willValidate =
  (element: ListedElement) =>
    (): boolean =>
      isSubmittableElement(element) && !isBarredFromConstraintValidation(element);

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
 *
 * @signature CallableFunction -> HTMLFormElement -> f -> ([SubmittableElement] | boolean)
 */
export const interactivelyValidate =
  (validityReporter: CallableFunction) =>
    (element: HTMLFormElement) =>
      (): boolean | SubmittableElement[] => {
        const controls: SubmittableElement[] = getSubmittableElements(element);
        const validControls: SubmittableElement[] = [];
        const invalidControls: SubmittableElement[] = [];
        const unhandledInvalidControls: SubmittableElement[] = [];

        controls.forEach((field) => {
          if (!field.willValidate) {
            return;
          }

          if (field.validity.valid) {
            validControls.push(field);
          } else {
            invalidControls.push(field);
          }
        });

        validControls.forEach((field) => {
          if (field.dispatchEvent(new window.CustomEvent('valid', { cancelable: true }))) {
            validityReporter(field);
          }
        });

        invalidControls.forEach((field) => {
          if (field.dispatchEvent(new window.CustomEvent('invalid', { cancelable: true }))) {
            validityReporter(field);
            unhandledInvalidControls.push(field);
          }
        });

        if (invalidControls.length === 0) {
          element.dispatchEvent(new window.CustomEvent('valid', { cancelable: true }));

          return true;
        } else {
          element.dispatchEvent(new window.CustomEvent('invalid', { cancelable: true }));

          return unhandledInvalidControls;
        }
      };

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
 *
 * @signature HTMLFormElement -> f -> ([SubmittableElement] | boolean)
 */
export const staticallyValidate =
  (element: HTMLFormElement) =>
    (): boolean | SubmittableElement[] => {
      const controls: SubmittableElement[] = getSubmittableElements(element);
      const invalidControls: SubmittableElement[] = [];
      const unhandledInvalidControls: SubmittableElement[] = [];

      controls.forEach((field) => {
        if (!field.willValidate) {
          return;
        }

        if (field.validity.valid) {
          field.dispatchEvent(new window.CustomEvent('valid', { cancelable: true }));
          return;
        }

        invalidControls.push(field);
      });

      if (invalidControls.length === 0) {
        element.dispatchEvent(new window.CustomEvent('valid', { cancelable: true }));

        return true;
      }

      element.dispatchEvent(new window.CustomEvent('invalid', { cancelable: true }));

      invalidControls.forEach((field) => {
        if (field.dispatchEvent(new window.CustomEvent('invalid', { cancelable: true }))) {
          unhandledInvalidControls.push(field);
        }
      });

      return unhandledInvalidControls;
    };
