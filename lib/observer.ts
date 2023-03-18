import type { SubmittableElement } from './utils';
import { isSubmittableElement } from './utils';

// @todo add documentation to all functions and types

export type ObserverCallbackArg = (element: SubmittableElement) => void;
export type Observable = HTMLFormElement | SubmittableElement;
export type Observables = Set<Observable>;
export type Observer = {
  /**
   * Connect element to observe and append to stack of listeners
   */
  connect(element: Observable): void;

  /**
   * Disconnect element from observe and remove from stack of listeners
   */
  disconnect(element: Observable): void;
};

/**
 * Internal callback that must be passed to MutationObserver
 */
function attributeMutationCallback(onChange: ObserverCallbackArg): MutationCallback {
  return (records: MutationRecord[]): void => {
    const uniq = new Set();

    records.filter((record: MutationRecord): boolean => record.type === 'attributes')
      .filter((record: MutationRecord): boolean => isSubmittableElement(record.target))
      .forEach((record: MutationRecord): void => {
        if (!uniq.has(record.target)) {
          uniq.add(record.target);
          onChange(record.target as SubmittableElement);
        }
      });
  };
}

/**
 * Create an observer that listens to attribute changes for the observable element
 *
 * For every observable with a changed attribute the callback onChange will be invoked, with the
 * observable as the parameter.
 */
export function createAttributeObserver(attributes: string[], onChange: ObserverCallbackArg): Observer {
  const mutationObserver = new MutationObserver(attributeMutationCallback(onChange));
  const options = { attributes: true, attributeFilter: attributes };
  const observables = new Set<Observable>();

  return {
    connect: (element: Observable): void => {
      mutationObserver.observe(element, options);
      observables.add(element);
    },
    disconnect: (element: Observable): void => {
      observables.delete(element);
      mutationObserver.disconnect();
      observables.forEach((item: Observable) => mutationObserver.observe(item, options));
    }
  };
}
