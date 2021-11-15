import path from 'path'
import WebDriver from 'selenium-webdriver/index.js'
import ChromeDriver from 'selenium-webdriver/chrome.js'
import chalk from 'chalk/source/index.js'

const runTests =
  (driver) =>
    () => {
      console.log('Run tests')

      return driver.executeAsyncScript((cb) => {
        harness.report()
          // eslint-disable-next-line promise/no-callback-in-promise
          .then(() => cb({
            logs,
            pass: harness.pass,
            count: harness.count,
            failureCount: harness.failureCount,
            successCount: harness.successCount,
            skipCount: harness.skipCount
          }))
          // eslint-disable-next-line promise/no-callback-in-promise
          .catch((error) => cb(error))
      })
    }

const evaluateTestResults =
  (driver) =>
    async (result) => {
      const status = result.pass ? 'passed' : 'failed'
      const capabilities = await driver.getCapabilities()

      // output test result infos
      console.log('')
      console.log(
        chalk.bold.black('Test result for %s-%s: %s'),
        capabilities.get('browserName'),
        capabilities.get('browserVersion'),
        result.pass ? chalk.green(status) : chalk.red(status.toUpperCase())
      )
      console.log(chalk.gray('Assertions: %s'), result.count)
      console.log(chalk.green('Success: %s'), result.successCount)
      console.log(chalk.red('Failure: %s'), result.failureCount)
      console.log('')

      return result.pass ? 0 : 1
    }

console.log('Setup local browser')
const driver = new WebDriver.Builder()
  .setChromeOptions(new ChromeDriver.Options().headless())
  .setChromeService(new ChromeDriver.ServiceBuilder())
  .forBrowser(WebDriver.Browser.CHROME)
  .build()


driver.get(`file://${path.resolve('tools/index.html')}`)
  .then(runTests(driver))
  .then(evaluateTestResults(driver))
  .finally(() => driver.quit())
  .then(process.exit)
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
