import type { Constraint, ConstraintInternals, Constraints, I18nCallback } from './constraint';
import type { ListedElement, SubmittableElement } from './utils';
import type { FormApi } from './form';
import type { ControlApi } from './control';

import { getByAttributes } from './constraint';

export type Validator = {
  run: (event: Event | SubmittableElement) => void;
  updateAndRun: (event: Event | SubmittableElement) => void;
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
  refs: WeakMap<HTMLFormElement | ListedElement, ControlApi | FormApi>,
  constraints: Constraints,
  i18n: I18nCallback,
): Validator {
  const cache = new WeakMap<SubmittableElement, CallableFunction>();

  return {
    updateAndRun: (event: Event | SubmittableElement): void => {
      const element = (event instanceof Event) ? event.currentTarget as SubmittableElement : event;
      const attributes = element.getAttributeNames();
      const controlApi = refs.get(element) as ControlApi | undefined;

      if (controlApi) {
        const constraintInternals = {
          target: element,
          localize: i18n,
          setValidity: controlApi.setValidity,
        };

        cache.set(element, validate.bind(null, controlApi, constraintInternals, getByAttributes(constraints, attributes)));
      }

      if (cache.has(element)) {
        // @ts-ignore see https://github.com/microsoft/TypeScript/issues/21732
        cache.get(element)();
      }
    },
    run: (event: Event | SubmittableElement): void => {
      const element = (event instanceof Event) ? event.currentTarget as SubmittableElement : event;

      if (cache.has(element)) {
        // @ts-ignore see https://github.com/microsoft/TypeScript/issues/21732
        cache.get(element)();
      }
    }
  };
}
