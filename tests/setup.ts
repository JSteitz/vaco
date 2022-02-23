// @NOTE currently it is not possible to downgrade a custom element
// or redefining an existing. For this we will register ours once
// and use it in our tests.
customElements.define('custom-input', class extends HTMLElement {
  static formAssociated = true;
});
