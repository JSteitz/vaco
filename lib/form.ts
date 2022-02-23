import { cloneProperties, SubmittableElement, getSubmitButton, getSubmitter } from './utils';
import { interactivelyValidate, staticallyValidate } from './api';


export type NativeFormApi = {
  noValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
};

export type FormApi = {
  checkValidity(): boolean | SubmittableElement[];
  reportValidity(): boolean | SubmittableElement[];
};

/**
 * Validation guard prevents submitting the form if validation is not disabled
 * and if any submittable element has validity problems.
 *
 * @see https://html.spec.whatwg.org/#form-submission-algorithm:dom-form-submit
 * @see https://html.spec.whatwg.org/#concept-fs-novalidate
 *
 * @param {Event} event
 */
export const submitGuard =
  (event: Event): void => {
    const form = event.currentTarget as HTMLFormElement;
    const submitter = getSubmitter(form);
    const submitButton = getSubmitButton(form);
    const doNotValidate = (submitter && submitter.formNoValidate)
      || (submitButton && submitButton.formNoValidate)
      || form.noValidate;

    if (doNotValidate) {
      return;
    }

    // @todo: we do not need to report when we are still validating

    if (form.reportValidity() === false) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

/**
 * @todo add documentation
 * @signature createFormApi :: CallableFunction -> HTMLFormElement -> FormApi
 */
export const createFormApi =
  (reporter: CallableFunction, form: HTMLFormElement): FormApi => ({
    checkValidity: staticallyValidate(form),
    reportValidity: interactivelyValidate(reporter)(form)
  });

/**
 * Disable native form validation and inject the custom
 * constraint validation api
 *
 * Methods: checkValidity, reportValidity
 * Properties: noValidate
 *
 * @param {VacoState} state
 * @param {HTMLFormElement} form
 */
export const setupForm =
  (api: FormApi) =>
    (form: HTMLFormElement): NativeFormApi => {
      const nativeFormApi = cloneProperties(['noValidate', 'checkValidity', 'reportValidity'], form) as NativeFormApi;

      // Disable native constraint validation and replace the attribute
      // @see https://html.spec.whatwg.org/#concept-fs-novalidate
      form.noValidate = true;

      // Setting the original 'noValidate' property adds the attribute
      // Overriding afterwards with custom attribute
      // @todo: should probably be its own property
      Object.defineProperty(form, 'noValidate', {
        configurable: true,
        enumerable: true,
        get: (): boolean => form.dataset.novalidate !== undefined,
        set: (value: boolean): void => {
          if (value) {
            form.dataset.novalidate = '';
          } else {
            delete form.dataset.novalidate;
          }
        }
      });

      Object.defineProperty(form, 'checkValidity', {
        configurable: true,
        enumerable: true,
        value: (): boolean => api.checkValidity() === true
      });

      Object.defineProperty(form, 'reportValidity', {
        configurable: true,
        enumerable: true,
        value: (): boolean => api.reportValidity() === true
      });

      return nativeFormApi;
    };

/**
 * Reset to original validation constraint properties
 *
 * @param {HTMLFormElement} form
 */
export const teardownForm =
  (form: HTMLFormElement): void => {
    // @ts-ignore: removes overridden properties
    delete form.noValidate;
    // @ts-ignore: removes overridden properties
    delete form.checkValidity;
    // @ts-ignore: removes overridden properties
    delete form.reportValidity;
  };
