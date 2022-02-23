import type { ValidityStateFlags } from './api';
import type { SubmittableElement } from './utils';

export type Constraints = { [key: string]: Constraint; };

export type I18nCallback = (key: string, name: string, ...attributes: unknown[]) => string | null;

export type ConstraintInternals = {
  /**
   * Identifies the internals target for the current running constraint validation
   *
   * @var {SubmittableElement}
   * @readonly
   */
  readonly target: SubmittableElement;

  /**
   * Request localizing a key with the control name and optional attribute values.
   * It will return a string only if an i18n callback was provided as option while creating the
   * vaco instance and the request was successful. Otherwise it will always return null.
   *
   * @signature localize :: (string, string, unknown[]) -> string | null
   * @readonly
   */
  readonly localize: I18nCallback;

  /**
   * Marks internals target element as suffering from the constraints indicated
   * by the flags argument, and sets the element's validation message to message.
   *
   * @signature setValidity :: (ValidityStateFlags, string?) -> void
   */
  setValidity(flags: ValidityStateFlags, message?: string): void;
};

export type Constraint = {
  /**
   * List of all validity states that will be used
   *
   * All listed states will get their value set to false initially and can
   * later be set with setValidity(). Method will be attached as an internal
   * to the class when registered.
   *
   * @var {string[]}
   * @readonly
   */
  readonly states: string[];

  /**
   * List of attributes that are relevant for the constraint
   *
   * This list is used to auto track re-validations and to optimize constraint
   * calls.
   *
   * @var {string[]}
   * @readonly
   */
  readonly attributes: string[];

  /**
   * Validate the constraint asynchronous
   *
   * @param {ConstraintInternals} internals
   * @return {Promise<void>}
   */
  validate(internals: ConstraintInternals): Promise<unknown>;
};

/**
 * Filter constraints that match at least one item of the provided attributes list
 *
 * @signature getByAttributes :: Constraints c => c -> [string] -> c
 */
export const getByAttributes =
  (constraints: Constraints) =>
    (attributes: string[]): Constraints =>
      Object.entries(constraints).reduce(
        (result: Constraints, [name, constraint]: [string, Constraint]): Constraints =>
          (constraint.attributes.some((a: string) => attributes.includes(a)))
            ? { ...result, [name]: constraint }
            : result,
        {}
      );

/**
 * Extracts validity states from all constrains as a string list
 *
 * @signature getValidityStates :: Constraints c => c -> [string]
 */
export const getValidityStates =
  (constraints: Constraints): string[] =>
    Object.entries(constraints).reduce(
      (result: string[], [, constraint]: [string, Constraint]) =>
        [...result, ...constraint.states],
      []
    );

/**
 * Extracts unique attributes from all constrains as a string list
 *
 * @signature getAttributes :: Constraints c => c -> Set<string>
 */
export const getAttributes =
  (constraints: Constraints): Set<string> =>
    Object.entries(constraints).reduce(
      (result: Set<string>, [, constraint]: [string, Constraint]) =>
        new Set([...result, ...constraint.attributes]),
      new Set()
    );
