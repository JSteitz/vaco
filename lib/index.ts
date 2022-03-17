import { ReporterCallback } from './api';
import { Constraints, I18nCallback } from './constraint';
import { getAttributes, getValidityStates } from './constraint';
import { isListedElement, ListedElement } from './utils';
import createObserver, { Observer } from './observer';
import createValidator, { Validator } from './validator';
import patchControl, { ControlApi } from './control';
import patchForm, { FormApi } from './form';

// @todo add documentation to all functions and types
export type VacoOptions = {
  constraints: Constraints;
  reporter?: ReporterCallback;
  i18n?: I18nCallback;
};

export type VacoState = {
  readonly reporter: ReporterCallback;
  readonly constraints: Constraints;
  readonly attributes: string[];
  readonly states: string[];
  readonly validator: Validator;
  readonly i18n: I18nCallback;
  readonly observer: Observer;
  readonly refs: WeakMap<HTMLFormElement | ListedElement, FormApi | ControlApi>;
};

export const VACO = Symbol('Vaco');
export const VERSION = '1.0.0';

/**
 *
 * @param {VacoState} state
 * @param {HTMLFormElement} element
 */
export const patch =
  (state: VacoState) =>
    (element: HTMLFormElement | ListedElement): void => {
      if (state.refs.has(element)) {
        return;
      }

      if (element instanceof HTMLFormElement) {
        state.refs.set(element, patchForm(state)(element));
      }

      if (isListedElement(element)) {
        state.refs.set(element, patchControl(state)(element));
      }

      if ('elements' in element) {
        (<ListedElement[]>[...element.elements]).forEach(patch(state));
      }
    };

/**
 *
 * @param {VacoState} state
 * @param {HTMLFormElement} element
 */
export const reset =
  (state: VacoState) =>
    (element: HTMLFormElement | ListedElement): void => {
      if (!state.refs.has(element)) {
        return;
      }

      state.refs.get(element)?.reset();
      state.refs.delete(element);

      if ('elements' in element) {
        (<ListedElement[]>[...element.elements]).forEach(reset(state));
      }
    };

/**
 *
 * @param {VacoOptions} options
 * @returns {VacoState}
 */
export const create =
  (options: VacoOptions): VacoState => {
    const state = {} as VacoState;

    Object.defineProperty(state, 'refs', { value: new WeakMap() });
    Object.defineProperty(state, 'reporter', { value: options.reporter ?? (() => { /* */ }) });
    Object.defineProperty(state, 'i18n', { value: options.i18n ?? ((): null => null) });
    Object.defineProperty(state, 'constraints', { value: options.constraints });
    Object.defineProperty(state, 'attributes', { value: getAttributes(state.constraints) });
    Object.defineProperty(state, 'states', { value: getValidityStates(state.constraints) });
    Object.defineProperty(state, 'validator', { value: createValidator(state.refs)(state.constraints)(state.i18n) });
    Object.defineProperty(state, 'observer', { value: createObserver([...state.attributes, 'value'])(state.validator.updateAndRun) });

    return Object.freeze(state);
  };
