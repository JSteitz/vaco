import type { Constraint, ConstraintInternals, Constraints, I18nCallback } from './constraint';
import type { ControlApi, NativeControlApi } from './control';
import type { ListedElement, SubmittableElement } from './utils';
import { getByAttributes } from './constraint';
import { allSettled } from './utils';
import { RefObject } from './core';

export type Validator = {
  run: (element: SubmittableElement) => void;
  runStream: (event: Event) => void;
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
 *
 * @signature validate :: ControlApi -> ConstraintInternals -> Constraints -> Function
 */
export const validate =
  (controlApi: ControlApi) =>
    (constraintInternals: ConstraintInternals) =>
      (constraints: Constraints) =>
        (): void => {
          controlApi.resetValidityState();

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

          allSettled(runners)
            .finally(() => constraintInternals.target.dispatchEvent(new CustomEvent('validated')));
        };

/**
 *
 */
export const createValidator =
  (refs: WeakMap<HTMLFormElement | ListedElement, RefObject>, constraints: Constraints, i18n: I18nCallback): Validator => {
    const cache: Record<string, CallableFunction> = {};

    const run = (element: SubmittableElement): void => {
      const attributes = element.getAttributeNames();
      const key = attributes.toString();
      const t = refs.get(element);

      if (!(key in cache) && t) {
        const controlApi = t.api as ControlApi;
        const constraintInternals = {
          target: element,
          localize: i18n,
          setValidity: controlApi.setValidity,
          nativeControlApi: t.native as NativeControlApi
        };

        // eslint-disable-next-line max-len
        cache[key] = validate(controlApi)(constraintInternals)(getByAttributes(constraints)(attributes));
      }

      cache[key]();
    };

    return {
      run,
      // @todo: don't like the word runStream
      runStream: ({ currentTarget }: Event): void => run(currentTarget as SubmittableElement)
    };
  };