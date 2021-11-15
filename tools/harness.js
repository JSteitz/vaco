import { createHarness } from 'zora'

window.harness = createHarness()
window.logs = []

Array.of('log', 'info', 'warn', 'error')
  .forEach((method) => {
    const old = console[method]

    console[method] = (message, ...args) => {
      old(message, ...args)
      window.logs.push(message)
    }
  })

