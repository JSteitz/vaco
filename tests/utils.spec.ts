import { test } from 'zora';
import {
  allSettled, isSubmitButton, isListedElement, isSubmittableElement, filterSubmitButtons,
  filterSubmittableElements, getSubmitButton, getSubmittableElements, getSubmitter,
  RejectedElementObject, ResolvedElementObject,
} from '../lib/utils';

test(
  'allSettled :: When called with a list of mixed types, expect a type error',
  async (assert) => {
    const invalidParameterType = Promise.resolve(true);
    const invalidList = [Promise.resolve(true), 'invalid'];
    const validList = [Promise.resolve(true), Promise.reject(new Error('error'))];

    assert.throws(
      // @ts-ignore test
      allSettled.bind(null, invalidParameterType),
      TypeError,
      'throws for invalid parameter type',
    );
    assert.throws(
      // @ts-ignore test
      allSettled.bind(null, invalidList),
      TypeError,
      'throws for non promise based entries',
    );
    await allSettled(validList)
      .finally(() => {
        assert.ok(
          true,
          'does not throw for only promise based entries',
        );
      });
  },
);

test(
  'allSettled :: When called with a list of promises, expect the result to be an ordered list of status descriptions',
  async (assert) => {
    const error = new Error('error');
    const resolvedElementObject: ResolvedElementObject = { status: 'fulfilled', value: true };
    const rejectedElementObject: RejectedElementObject = { status: 'rejected', reason: error };

    assert.equal(
      await allSettled([Promise.resolve(true), Promise.reject(error)]),
      [resolvedElementObject, rejectedElementObject],
      'output order matches input order',
    );
  },
);

test(
  'isSubmitButton :: When called with a candidate, expect result to be positive for submit buttons',
  (assert) => {
    const buttonSubmit = document.createElement('button');
    const buttonReset = document.createElement('button');
    const inputSubmit = document.createElement('input');
    const inputImage = document.createElement('input');
    const inputReset = document.createElement('input');
    const inputButton = document.createElement('input');

    buttonSubmit.type = 'submit';
    buttonReset.type = 'reset';
    inputSubmit.type = 'submit';
    inputImage.type = 'image';
    inputReset.type = 'reset';
    inputButton.type = 'button';

    const submitButtons = [buttonSubmit, inputSubmit, inputImage];
    const nonSubmitButtons = [buttonReset, inputReset, inputButton];

    submitButtons.forEach((element) => {
      assert.ok(
        isSubmitButton(element),
        `${element.localName}[${element.type}] is a submit button`,
      );
    });

    nonSubmitButtons.forEach((element) => {
      assert.notOk(
        isSubmitButton(element),
        `${element.localName}[${element.type}] is not a submit button`,
      );
    });
  },
);

test(
  'isListedElement :: When called with a candidate, expect result to be positive for listed element',
  async (assert) => {
    await customElements.whenDefined('custom-input');

    Array.of(
      document.createElement('button'),
      document.createElement('fieldset'),
      document.createElement('input'),
      document.createElement('object'),
      document.createElement('output'),
      document.createElement('select'),
      document.createElement('textarea'),
      document.createElement('custom-input'),
    )
      .forEach((element: HTMLElement) => {
        assert.ok(
          isListedElement(element),
          `${element.localName} is a form listed element`,
        );
      });
  },
);

test(
  'isSubmittableElement :: When called with a candidate, expect result to be positive for submittable element',
  async (assert) => {
    await customElements.whenDefined('custom-input');

    const button = document.createElement('button');
    const fieldset = document.createElement('fieldset');
    const input = document.createElement('input');
    const object = document.createElement('object');
    const output = document.createElement('output');
    const select = document.createElement('select');
    const textarea = document.createElement('textarea');
    const custom = document.createElement('custom-input');

    const submittable = [button, input, object, select, textarea, custom];
    const nonSubmittable = [fieldset, output];

    submittable.forEach((element: HTMLElement) => {
      assert.ok(
        isSubmittableElement(element),
        `${element.localName} is a submittable element`,
      );
    });

    nonSubmittable.forEach((element: HTMLElement) => {
      assert.notOk(
        isSubmittableElement(element),
        `${element.localName} is not a submittable element`,
      );
    });
  },
);

test(
  'filterSubmitButtons :: When called with a list of candidates, expect result to contain only submit buttons',
  (assert) => {
    const buttonSubmit = document.createElement('button');
    const buttonReset = document.createElement('button');
    const inputSubmit = document.createElement('input');
    const inputImage = document.createElement('input');
    const inputReset = document.createElement('input');
    const inputButton = document.createElement('input');

    buttonSubmit.type = 'submit';
    buttonReset.type = 'reset';
    inputSubmit.type = 'submit';
    inputImage.type = 'image';
    inputReset.type = 'reset';
    inputButton.type = 'button';

    const submitButtons = [buttonSubmit, inputSubmit, inputImage];
    const nonSubmitButtons = [buttonReset, inputReset, inputButton];

    assert.equal(
      filterSubmitButtons([...submitButtons, ...nonSubmitButtons]),
      submitButtons,
      'contains only submit buttons',
    );
  },
);

test(
  'filterSubmittableElements :: When called with a list of candidates, expect result to contain only submittable elements',
  async (assert) => {
    await customElements.whenDefined('custom-input');

    const button = document.createElement('button');
    const fieldset = document.createElement('fieldset');
    const input = document.createElement('input');
    const object = document.createElement('object');
    const output = document.createElement('output');
    const select = document.createElement('select');
    const textarea = document.createElement('textarea');
    const custom = document.createElement('custom-input');

    const submittable = [button, input, object, select, textarea, custom];
    const nonSubmittable = [fieldset, output];

    assert.equal(
      filterSubmittableElements([...submittable, ...nonSubmittable]),
      submittable,
      'contains only submittable elements',
    );
  },
);

test(
  'getSubmitButton :: When called with a form element, expect result to be a possible submit button',
  async (assert) => {
    const form = document.createElement('form');
    const buttonSubmit = document.createElement('button');
    const buttonReset = document.createElement('button');
    const inputSubmit = document.createElement('input');

    buttonSubmit.type = 'submit';
    buttonReset.type = 'reset';
    inputSubmit.type = 'submit';

    form.appendChild(buttonReset);

    assert.notOk(
      getSubmitButton(form),
      'form does not contain a submit button',
    );

    form.appendChild(buttonSubmit);
    form.appendChild(inputSubmit);

    assert.equal(
      getSubmitButton(form),
      buttonSubmit,
      'found first existing submit button',
    );
  },
);

test(
  'getSubmittableElements :: When called with a from or fieldset, expect to get a list of submittable elements',
  async (assert) => {
    await customElements.whenDefined('custom-input');

    const form = document.createElement('form');
    const button = document.createElement('button');
    const fieldset = document.createElement('fieldset');
    const fieldset2 = document.createElement('fieldset');
    const input = document.createElement('input');
    const object = document.createElement('object');
    const output = document.createElement('output');
    const select = document.createElement('select');
    const textarea = document.createElement('textarea');

    // not all browsers include a custom element in the HTMLFormControlsCollection
    // @see isSubmittableElement test which includes custom elements

    // const custom = document.createElement('custom-input')

    form.appendChild(button);
    form.appendChild(fieldset);
    form.appendChild(input);
    form.appendChild(object);
    form.appendChild(output);
    form.appendChild(select);
    form.appendChild(textarea);

    assert.equal(
      getSubmittableElements(form),
      [button, input, object, select, textarea],
      'form contains only submittable elements',
    );

    fieldset.appendChild(button);
    fieldset.appendChild(fieldset2);
    fieldset.appendChild(input);
    fieldset.appendChild(object);
    fieldset.appendChild(output);
    fieldset.appendChild(select);
    fieldset.appendChild(textarea);

    assert.equal(
      getSubmittableElements(fieldset),
      [button, input, object, select, textarea],
      'fieldset contains only submittable elements',
    );
  },
);

test(
  'getSubmitter :: When called with a form element, expect to get the element that issued the submit',
  async (assert) => {
    const form = document.createElement('form');
    const submitButton1 = document.createElement('button');
    const submitButton2 = document.createElement('button');

    submitButton1.type = 'submit';
    submitButton2.type = 'submit';

    form.appendChild(submitButton2);

    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      enumerable: true,
      get() { return submitButton1; },
    });

    assert.equal(getSubmitter(form), null, 'submitter does not belong to the tested form');

    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      enumerable: true,
      get() { return submitButton2; },
    });

    assert.equal(getSubmitter(form), submitButton2, 'submitter belongs to the tested form');
  },
);
