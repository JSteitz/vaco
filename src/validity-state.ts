export interface ValidityStateFlags {
    valueMissing?: boolean;
    typeMismatch?: boolean;
    patternMismatch?: boolean;
    tooLong?: boolean;
    tooShort?: boolean;
    rangeUnderflow?: boolean;
    rangeOverflow?: boolean;
    stepMismatch?: boolean;
    badInput?: boolean;
    customError?: boolean;
}

export function ValidityStateDescriptor(value: boolean): object {
    return {
        configurable: true,
        enumerable: true,
        writable: false,
        value
    }
}

export const ValidityState: ValidityState = Object.create(null, {
    valueMissing: ValidityStateDescriptor(false),
    typeMismatch: ValidityStateDescriptor(false),
    patternMismatch: ValidityStateDescriptor(false),
    tooLong: ValidityStateDescriptor(false),
    tooShort: ValidityStateDescriptor(false),
    rangeUnderflow: ValidityStateDescriptor(false),
    rangeOverflow: ValidityStateDescriptor(false),
    stepMismatch: ValidityStateDescriptor(false),
    badInput: ValidityStateDescriptor(false),
    customError: ValidityStateDescriptor(false),
    valid: ValidityStateDescriptor(true)
})
