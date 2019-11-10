import { ValidityState } from './validity-state'

export interface HTMLFormAssociatedCustomElement extends HTMLElement {
    constructor: HTMLFormAssociatedCustomElementConstructor;
    form?: HTMLFormElement;
    name: string;
    type: string;
    disabled: boolean;
    readonly willValidate: boolean;
    readonly validity: ValidityState;
    readonly validationMessage: string;

    setCustomValidity (message: string): void;
    checkValidity (): boolean;
    reportValidity (): boolean;
    formAssociatedCallback? (form: HTMLFormElement): void;
    formDisabledCallback? (disabled: boolean): void;
    formResetCallback? (): void;
    formStateRestoreCallback? (state: string, mode: string): void;
}

export interface HTMLFormAssociatedCustomElementConstructor {
    new (): HTMLFormAssociatedCustomElement;
    readonly formAssociated: boolean;
}

export type FormAssociatedElements =
    HTMLButtonElement
    | HTMLFieldSetElement
    | HTMLInputElement
    | HTMLObjectElement
    | HTMLOutputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | HTMLImageElement
    | HTMLFormAssociatedCustomElement

export type ListedElements =
    HTMLButtonElement
    | HTMLFieldSetElement
    | HTMLInputElement
    | HTMLObjectElement
    | HTMLOutputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | HTMLFormAssociatedCustomElement

export type SubmittableElements =
    HTMLButtonElement
    | HTMLFieldSetElement
    | HTMLInputElement
    | HTMLObjectElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | HTMLFormAssociatedCustomElement
