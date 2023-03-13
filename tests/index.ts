// Runner Setup
//
// required for collecting test reports from inside the browser
// and to display in terminal
// @see ../tools/test.local.js
export * from 'zora';

import './specs/api.spec';
import './specs/constraint.spec';
import './specs/form.spec';
import './specs/utils.spec';

// Setup
// @NOTE currently it is not possible to downgrade a custom element
// or redefining an existing. For this we will register ours once
// and use it in our tests.
customElements.define('custom-input', class extends HTMLElement {
  static formAssociated = true;
});
