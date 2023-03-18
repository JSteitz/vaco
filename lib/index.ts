import type { ReporterCallback } from './api';
import type { Constraints, I18nCallback } from './constraint';
import type { ListedElement } from './utils';
import type { Observer } from './observer';
import type { Validator } from './validator';
import type { ControlApi } from './control';
import type { FormApi } from './form';

import { getAttributes, getValidityStates } from './constraint';
import { isListedElement } from './utils';
import { createAttributeObserver } from './observer';
import { createValidator } from './validator';
import { setup as setupControl } from './control';
import { setup as setupForm } from './form';

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
export const VERSION = '0.0.1';

export function patch(state: VacoState, element: HTMLFormElement | ListedElement): void {
  if (state.refs.has(element)) {
    return;
  }

  if (element instanceof HTMLFormElement) {
    state.refs.set(element, setupForm(state, element));
  }

  if (isListedElement(element)) {
    state.refs.set(element, setupControl(state, element));
    // update depence on an existing refs
    state.validator.updateAndRun(element);
  }

  if ('elements' in element) {
    (<ListedElement[]>[...element.elements]).forEach(patch.bind(null, state));
  }
}

export function reset(state: VacoState, element: HTMLFormElement | ListedElement): void {
  if (!state.refs.has(element)) {
    return;
  }

  state.refs.get(element)?.reset();
  state.refs.delete(element);

  if ('elements' in element) {
    (<ListedElement[]>[...element.elements]).forEach(reset.bind(null, state));
  }
}

export function create(options: VacoOptions): VacoState {
  const state = {} as VacoState;

  Object.defineProperty(state, 'refs', { value: new WeakMap() });
  Object.defineProperty(state, 'reporter', { value: options.reporter ?? (() => { /* */ }) });
  Object.defineProperty(state, 'i18n', { value: options.i18n ?? ((): null => null) });
  Object.defineProperty(state, 'constraints', { value: options.constraints });
  Object.defineProperty(state, 'attributes', { value: getAttributes(state.constraints) });
  Object.defineProperty(state, 'states', { value: getValidityStates(state.constraints) });
  Object.defineProperty(state, 'validator', { value: createValidator(state.refs, state.constraints, state.i18n) });
  Object.defineProperty(state, 'observer', { value: createAttributeObserver([...state.attributes, 'value'], state.validator.updateAndRun) });

  return Object.freeze(state);
}
