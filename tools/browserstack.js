/* globals Tests */
import { spawn } from 'node:child_process';
import path from 'node:path';
import url from 'node:url'
import WebDriver from 'selenium-webdriver/index.js';
import BrowserStackLocal from 'browserstack-local/index.js';
import * as BrowserStackOptions from './browserstack.conf.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

function BrowserStack() {
  const local = new BrowserStackLocal.Local();

  return {
    boot: () => {
      console.log('Booting BrowserStack');

      return new Promise((resolve, reject) => {
        local.start(BrowserStackOptions.localOptions, (error) => error ? reject(error) : resolve());
      });
    },

    setup: (capabilitiesList) => {
      console.log(
        'Setup browsers:',
        capabilitiesList
          .map((capabilities) => `${capabilities.browserName} (${capabilities.browserVersion})`)
          .join(', ')
      );

      return capabilitiesList.map((capabilities) => new WebDriver.Builder()
        .usingServer('https://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(capabilities)
        .build());
    },

    shutdown: () => {
      console.log('Shutting down BrowserStack');

      return new Promise((resolve) => {
        local.stop(resolve);
      });
    }
  };
}

async function runTests(driver) {
  return driver.executeAsyncScript(async (cb) => {
    const logs = [];
    const logger = (message) => {
      logs.push(message);
      console.log(message);
    };

    await Tests.report({ reporter: Tests.createTAPReporter({ log: logger }) });

    const summary = logs.slice(-4);

    cb({
      total: parseInt(summary[0].slice(6), 10),
      pass: parseInt(summary[1].slice(6), 10),
      fail: parseInt(summary[2].slice(6), 10),
      skip: parseInt(summary[3].slice(6), 10),
      logs,
    });
  });
}

async function printTestResults(driver, result) {
  const capabilities = await driver.getCapabilities();
  console.log(
    "\nTest result for %s-%s\n",
    capabilities.get('browserName'),
    capabilities.get('browserVersion'),
  );

  const tap = spawn(`${__dirname}/node_modules/.bin/tap-arc`, ['--color']);

  tap.stdout.pipe(process.stdout);
  tap.stderr.pipe(process.stderr);

  result.logs.forEach(message => tap.stdin.write(`${message}\n`));
  tap.stdin.end();

  return result;
}

async function updateBrowserstackStatus(driver, result) {
  await driver.executeScript(`browserstack_executor: {"action": "setSessionStatus", "arguments": {"status": "${result.fail === 0 ? 'passed' : 'failed'}"}}`);

  return result;
}

async function runRemoteTestInstances(drivers) {
  console.log('Run tests - this process will take some time');

  return Promise.all(drivers.map(
    (driver) => driver.get(BrowserStackOptions.url)
      .then(() => runTests(driver))
      .then((result) => printTestResults(driver, result))
      .then((result) => updateBrowserstackStatus(driver, result))
      .finally(() => driver.quit())
      .catch(console.error)
  )).then((results) => results.every((result) => result.fail > 0) ? 1 : 0);
}

const browserstack = BrowserStack();

browserstack.boot()
  .then(() => browserstack.setup(BrowserStackOptions.capabilities))
  .then((drivers) => runRemoteTestInstances(drivers))
  .finally(() => browserstack.shutdown())
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
