import type { Constraint, ConstraintInternals, Constraints, I18nCallback } from './constraint';
import type { ListedElement } from './utils';
import type { ControlApi } from './control';
import type { Refs } from './index';

import { getByAttributes } from './constraint';

export type Validator = {
  run: (element: ListedElement) => void;
  updateAndRun: (element: ListedElement) => void;
};

/**
 * Run all possible registered constraints for the given element
 *
 * Only constraints with listening attributes on the element will run.
 * The constraints will be run in parallel and will not stop if an
 * validation fails. Events are fired before and after the validation
 * process.
 *
 * The first event "validate" is fired before the validation process starts.
 * The event is cancelable. If the event is cancelled so is the validation
 * for that element also cancelled.
 *
 * The second event "validated" is fired after all constraints are run.
 *
 * If the element has an associated form, then the above events will also be
 * fired on the form with the same conditions.
 */
function validate(
  { resetValidityState }: ControlApi,
  constraintInternals: ConstraintInternals,
  constraints: Constraints,
) {
  resetValidityState();

  if (!constraintInternals.target.willValidate || Object.keys(constraints).length === 0) {
    return;
  }

  const runners = Object.entries(constraints)
    .filter(([name, constraint]: [string, Constraint]): unknown =>
      constraintInternals.target.dispatchEvent(
        new CustomEvent('validate', { cancelable: true, detail: { name, constraint } })
      )
    )
    .map(([, constraint]): Promise<unknown> => (
      constraint.validate(constraintInternals)
    ));

  Promise.allSettled(runners)
    .finally(() => constraintInternals.target.dispatchEvent(new CustomEvent('validated')));
}

/**
 *
 */
export function createValidator(
  refs: Refs<HTMLFormElement | ListedElement>,
  constraints: Constraints,
  i18n: I18nCallback,
): Validator {
  const cache = new WeakMap<ListedElement, CallableFunction>();

  return {
    updateAndRun: (element: ListedElement): void => {
      const attributes = element.getAttributeNames();
      const controlApi = refs.get(element);
      let validator = cache.get(element);

      if (controlApi) {
        const constraintInternals = {
          target: element,
          localize: i18n,
          setValidity: controlApi.setValidity,
        };

        validator = validate.bind(null, controlApi, constraintInternals, getByAttributes(constraints, attributes));

        cache.set(element, validator);
      }

      if (validator !== undefined) {
        validator();
      }
    },
    run: (element: ListedElement): void => {
      const validator = cache.get(element);

      if (validator !== undefined) {
        validator();
      }
    }
  };
}
