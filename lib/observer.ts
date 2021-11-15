import type { SubmittableElement } from './utils'
import { isSubmittableElement } from './utils'

// @todo add documentation to all functions and types

export type ObserverCallbackArg = (element: SubmittableElement) => void;
export type Observable = HTMLFormElement | SubmittableElement;
export type Observables = Set<Observable>;
export type Observer = {
  connect(element: Observable): void;
  disconnect(element: Observable): void;
}

/**
 * Connect element to observe and append to stack of listeners
 *
 * @signature connect :: Observables -> MutationObserver -> MutationObserverInit -> ObservableElement -> Observables
 */
export const connect =
  (observables: Observables) =>
    (observer: MutationObserver) =>
      (options: MutationObserverInit) =>
        (element: Observable): Observables => {
          observer.observe(element, options)

          return new Set([...observables, element])
        }

/**
 * Disconnect element from observe and remove from stack of listeners
 *
 * @signature disconnect :: Observables -> MutationObserver -> MutationObserverInit -> ObservableElement -> Observables
 */
export const disconnect =
  (observables: Observables) =>
    (observer: MutationObserver) =>
      (options: MutationObserverInit) =>
        (element: Observable): Observables => {
          const newObservables = new Set(
            [...observables].filter((item: Observable) => item !== element)
          )

          observer.disconnect()
          newObservables.forEach((item: Observable) => observer.observe(item, options))

          return newObservables
        }

/**
 * Internal callback that must be passed to MutationObserver
 *
 * @internal
 * @signature attributeMutationCallback :: ObserverCallbackArg -> MutationRecord[] -> void
 */
export const attributeMutationCallback =
  (onChange: ObserverCallbackArg): MutationCallback =>
    (records: MutationRecord[]): void => {
      const uniq = new Set()

      records.filter((record: MutationRecord): boolean => record.type === 'attributes')
        .filter((record: MutationRecord): boolean => isSubmittableElement(record.target))
        .forEach((record: MutationRecord): void => {
          if (!uniq.has(record.target)) {
            uniq.add(record.target)
            onChange(record.target as SubmittableElement)
          }
        })
    }

/**
 * Create an observer that listens to attribute changes for the observable element
 *
 * For every observable with a changed attribute the callback onChange will be invoked, with the
 * observable as the parameter.
 *
 * @signature createAttributeObserver :: (string[], ObserverCallbackArg) -> Observer
 */
export const createObserver =
  (attributes: string[], onChange: ObserverCallbackArg): Observer => {
    const mutationObserver = new MutationObserver(attributeMutationCallback(onChange))
    const options = { attributes: true, attributeFilter: attributes }
    let observables = new Set<Observable>()

    return {
      connect: (element: Observable): void => {
        observables = connect(observables)(mutationObserver)(options)(element)
      },

      disconnect: (element: Observable): void => {
        observables = disconnect(observables)(mutationObserver)(options)(element)
      }
    }
  }
