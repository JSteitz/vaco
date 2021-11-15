import WebDriver from 'selenium-webdriver/index.js'
import BrowserStackLocal from 'browserstack-local/index.js'
import BrowserStackOptions from './browserstack.conf.js'

export default () => {
  const local = new BrowserStackLocal.Local()

  return {
    boot: () => {
      console.log('Booting BrowserStack')

      return new Promise((resolve, reject) => {
        local.start(BrowserStackOptions.localOptions, (error) => error ? reject(error) : resolve())
      })
    },

    setup: (capabilitiesList) =>
      () => {
        console.log(
          'Setup browsers:',
          capabilitiesList
            .map((capabilities) => `${capabilities.browserName} (${capabilities.browserVersion})`)
            .join(', ')
        )

        return capabilitiesList.map((capabilities) => new WebDriver.Builder()
          .usingServer('https://hub-cloud.browserstack.com/wd/hub')
          .withCapabilities(capabilities)
          .build())
      },

    shutdown: () => {
      console.log('Shutting down BrowserStack')

      return new Promise((resolve) => {
        local.stop(resolve)
      })
    }
  }
}
