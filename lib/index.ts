import type { VacoState } from './core';
import type { SubmittableElement } from './utils';
import { create, mount as _mount, unmount as _unmount } from './core';

export { create };

export const mount =
  (state: VacoState, element: HTMLFormElement | SubmittableElement): void =>
    _mount(state)(element);

export const unmount =
  (state: VacoState, element: HTMLFormElement | SubmittableElement): void =>
    _unmount(state)(element);
