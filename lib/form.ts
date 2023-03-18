import type { VacoState } from './index';

import { getSubmitButton, getSubmitter } from './utils';
import { interactivelyValidate, staticallyValidate } from './api';

export type FormApi = {
  reset: () => void;
};

/**
 * Validation guard prevents submitting the form if validation is not disabled
 * and if any submittable element has validity problems.
 *
 * @see https://html.spec.whatwg.org/#form-submission-algorithm:dom-form-submit
 * @see https://html.spec.whatwg.org/#concept-fs-novalidate
 */
function submitGuard(event: Event): void {
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
}

/**
 * Reset to original validation constraint properties
 */
function reset(form: HTMLFormElement): void {
  form.removeEventListener('submit', submitGuard);

  // @ts-ignore: removes overridden properties
  delete form.noValidate;
  // @ts-ignore: removes overridden properties
  delete form.checkValidity;
  // @ts-ignore: removes overridden properties
  delete form.reportValidity;
}

/**
 * Disable native form validation and inject the custom
 * constraint validation api
 *
 * Methods: checkValidity, reportValidity
 * Properties: noValidate
 */
export function setup({ reporter }: VacoState, form: HTMLFormElement): FormApi {
  const checkValidity = staticallyValidate.bind(null, form);
  const reportValidity = interactivelyValidate.bind(null, reporter, form);

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
    value: (): boolean => checkValidity() === true
  });

  Object.defineProperty(form, 'reportValidity', {
    configurable: true,
    enumerable: true,
    value: (): boolean => reportValidity() === true
  });

  form.addEventListener('submit', submitGuard);

  return {
    reset: reset.bind(null, form)
  };
}
