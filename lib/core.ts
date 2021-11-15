import type { ReporterCallback } from './api'
import type { Constraints, I18nCallback } from './constraint'
import type { Observer } from './observer'
import type { ListedElement } from './utils'
import type { Validator } from './validator'
import { getAttributes, getValidityStates } from './constraint'
import { ControlApi, createControlApi, setupControl, teardownControl } from './control'
import { createFormApi, FormApi, setupForm, submitGuard, teardownForm } from './form'
import { createObserver } from './observer'
import { isListedElement, isSubmittableElement } from './utils'
import { createValidator } from './validator'

// @todo add documentation to all functions and types
export type VacoOptions = {
  constraints: Constraints;
  reporter?: ReporterCallback;
  i18n?: I18nCallback;
}

export type VacoState = {
  readonly reporter: ReporterCallback;
  readonly constraints: Constraints;
  readonly attributes: string[];
  readonly states: string[];
  readonly validator: Validator;
  readonly i18n: I18nCallback;
  readonly observer: Observer;
  readonly refs: WeakMap<HTMLFormElement|ListedElement, RefObject>
}

export type RefObject = {
  readonly api: FormApi | ControlApi;
  readonly native: Record<string, unknown>;
}

export const VACO = Symbol('Vaco')
export const VERSION = '1.0.0'

/**
 *
 * @param {VacoState} state
 * @param {HTMLFormElement} element
 */
export const mount =
  (state: VacoState) =>
    (element: HTMLFormElement | ListedElement): void => {
      if (state.refs.has(element)) {
        return
      }

      if (element instanceof HTMLFormElement) {
        const api = createFormApi(state.reporter, element)
        const native = setupForm(api)(element)

        state.refs.set(element, { api, native })

        element.addEventListener('submit', submitGuard)
        Array.from(element.elements).forEach(mount(state))

        return
      }

      if (isSubmittableElement(element)) {
        const api = createControlApi(state.reporter, state.states, element)
        const native = setupControl(api)(element)

        state.refs.set(element, { api, native })

        state.observer.connect(element)
        element.addEventListener('input', state.validator.runStream)
        state.validator.run(element)

        return
      }

      if (isListedElement(element)) {
        const api = createControlApi(state.reporter, state.states, element)
        const native = setupControl(api)(element)

        state.refs.set(element, { api, native })

        if (element instanceof HTMLFieldSetElement) {
          Array.from(element.elements).forEach(mount(state))
        }
      }
    }

/**
 *
 * @param {VacoState} state
 * @param {HTMLFormElement} element
 */
export const unmount =
  (state: VacoState) =>
    (element: HTMLFormElement | ListedElement): void => {
      if (!state.refs.has(element)) {
        return
      }

      if (element instanceof HTMLFormElement) {
        Array.from(element.elements).forEach(unmount(state))
        element.removeEventListener('submit', submitGuard)
        teardownForm(element)
        state.refs.delete(element)

        return
      }

      if (isSubmittableElement(element)) {
        element.removeEventListener('input', state.validator.runStream)
        state.observer.disconnect(element)
        teardownControl(element)
        state.refs.delete(element)

        return
      }

      if (isListedElement(element)) {
        if (element instanceof HTMLFieldSetElement) {
          Array.from(element.elements).forEach(unmount(state))
        }

        teardownControl(element)
        state.refs.delete(element)
      }
    }

/**
 *
 * @param {VacoOptions} options
 * @returns {VacoState}
 */
export const create =
  (options: VacoOptions): VacoState => {
    const state = {} as VacoState

    Object.defineProperty(state, 'reporter', { value: options.reporter ?? (() => { /* */ }) })
    Object.defineProperty(state, 'i18n', { value: options.i18n ?? ((): null => null) })
    Object.defineProperty(state, 'constraints', { value: options.constraints })
    Object.defineProperty(state, 'attributes', { value: getAttributes(state.constraints) })
    Object.defineProperty(state, 'states', { value: getValidityStates(state.constraints) })
    Object.defineProperty(state, 'validator', { value: createValidator(state.constraints, state.i18n) })
    Object.defineProperty(state, 'observer', { value: createObserver(state.attributes, state.validator.run) })
    Object.defineProperty(state, 'refs', { value: new WeakMap() })

    return Object.freeze(state)
  }
