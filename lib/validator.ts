import { Constraint, ConstraintInternals, Constraints, I18nCallback } from './constraint';
import { ListedElement, SubmittableElement } from './utils';
import { FormApi } from './form';
import { ControlApi } from './control';
import { getByAttributes } from './constraint';

export type Validator = {
  run: (event: Event | SubmittableElement) => void;
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
const validate =
  ({ resetValidityState }: ControlApi) =>
    (constraintInternals: ConstraintInternals) =>
      (constraints: Constraints) =>
        (): void => {
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
        };

/**
 *
 */
export default
  (refs: WeakMap<HTMLFormElement | ListedElement, ControlApi | FormApi>) =>
    (constraints: Constraints) =>
      (i18n: I18nCallback): Validator => {
        const cache: Record<string, CallableFunction> = {};

        return {
          run: (event: Event | SubmittableElement): void => {
            const element = (event instanceof Event) ? event.currentTarget as SubmittableElement : event;
            const attributes = element.getAttributeNames();
            const key = attributes.toString();
            const controlApi = refs.get(element) as ControlApi | undefined;

            if (!(key in cache) && controlApi) {
              const constraintInternals = {
                target: element,
                localize: i18n,
                setValidity: controlApi.setValidity,
              };

              cache[key] = validate(controlApi)(constraintInternals)(getByAttributes(constraints)(attributes));
            }

            cache[key]();
          }
        };
      };
