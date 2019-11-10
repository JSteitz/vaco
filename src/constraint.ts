import { SubmittableElements } from './types'

export interface Constraint {
    /**
     * Name of the constraint
     *
     * @var {string}
     * @readonly
     */
    readonly name: string;

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
     * Validate the constraint asynchronous for the given element
     *
     * @param {SubmittableElements} element
     * @return {Promise<void>}
     */
    validate(element: SubmittableElements): Promise<void>;
}
