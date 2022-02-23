/* globals TestRunner */
import path from 'path';
import WebDriver from 'selenium-webdriver/index.js';
import ChromeDriver from 'selenium-webdriver/chrome.js';
import chalk from 'chalk';

const runTests =
  (driver) =>
    () => {
      console.log('Run tests');

      return driver.executeAsyncScript((cb) => {
        TestRunner.report({ reporter: TestRunner.reporter })
          .then(() => cb({
            pass: TestRunner.counter.failure === 0,
            success: TestRunner.counter.success,
            failure: TestRunner.counter.failure,
            skip: TestRunner.counter.skip,
            total: TestRunner.counter.total,
          }))
          .catch((error) => cb(error));
      });
    };

const evaluateTestResults =
  (driver) =>
    async (result) => {
      const status = result.pass ? 'passed' : 'failed';
      const capabilities = await driver.getCapabilities();

      // output test result infos
      console.log('');
      console.log(
        chalk.bold.black('Test result for %s-%s: %s'),
        capabilities.get('browserName'),
        capabilities.get('browserVersion'),
        result.pass ? chalk.green(status) : chalk.red(status.toUpperCase())
      );
      console.log(chalk.gray('Assertions: %s'), result.total);
      console.log(chalk.green('Success: %s'), result.success);
      console.log(chalk.red('Failure: %s'), result.failure);
      console.log(chalk.gray('Skipped: %s'), result.skip);
      console.log('');

      return result.pass ? 0 : 1;
    };

console.log('Setup local browser');
const driver = new WebDriver.Builder()
  .setChromeOptions(new ChromeDriver.Options()
    .addArguments(['--allow-file-access-from-files'])
    .headless())
  .setChromeService(new ChromeDriver.ServiceBuilder())
  .forBrowser(WebDriver.Browser.CHROME)
  .build();

driver.get(`file://${path.resolve('tests/index.html')}`)
  .then(runTests(driver))
  .then(evaluateTestResults(driver))
  .then((exitCode) => {
    driver.quit();
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
