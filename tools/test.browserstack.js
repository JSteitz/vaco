/* globals TestRunner */
import BrowserStackOptions from './browserstack.conf.js';
import BrowserStack from './browserstack.js';
import chalk from 'chalk';

const runTests =
  (driver) =>
    () => driver.executeAsyncScript((cb) => {
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

const evaluateTestResults =
  (driver) =>
    async (result) => {
      const status = result.pass ? 'passed' : 'failed';
      const capabilities = await driver.getCapabilities();

      await driver.executeScript(`browserstack_executor: {"action": "setSessionStatus", "arguments": {"status": "${status}"}}`);

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

const runRemoteTestInstances =
  (drivers) => {
    console.log('Run tests - this process will take some time');

    return Promise.all(drivers.map(
      (driver) => driver.get(BrowserStackOptions.url)
        .then(runTests(driver))
        .then(evaluateTestResults(driver))
        .finally(() => driver.quit())
        .catch(console.error)
    ))
      .then((results) => results.every((result) => result === 0) ? 0 : 1);
  };

const browserstack = BrowserStack();

browserstack.boot()
  .then(browserstack.setup(BrowserStackOptions.capabilities))
  .then(runRemoteTestInstances)
  .finally(() => browserstack.shutdown())
  .then(process.exit)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
