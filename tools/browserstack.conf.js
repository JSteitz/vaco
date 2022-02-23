const user = process.env.BROWSERSTACK_USERNAME;
const key = process.env.BROWSERSTACK_ACCESS_KEY;
const browserstackOptions = {
  'userName': user,
  'accessKey': key,
  'projectName': 'Vaco',
  'buildName': 'Core Tests',
  'local': true,
  'consoleLogs': 'verbose',
  'networkLogs': true,
  'seleniumLogs': true,
  'seleniumVersion': '4.1.0',
  'video': false
};

const capabilities = [
  {
    'browserName': 'Chrome',
    'browserVersion': 'latest',
    'bstack:options': {
      ...browserstackOptions,
      'os': 'Windows',
      'osVersion': '10'
    }
  },
  {
    'browserName': 'Firefox',
    'browserVersion': 'latest',
    'bstack:options': {
      ...browserstackOptions,
      'os': 'Windows',
      'osVersion': '10'
    }
  },
  {
    'browserName': 'Edge',
    'browserVersion': 'latest',
    'bstack:options': {
      ...browserstackOptions,
      'os': 'Windows',
      'osVersion': '10'
    }
  },
  {
    'browserName': 'Safari',
    'browserVersion': 'latest',
    'bstack:options': {
      ...browserstackOptions,
      'os': 'OS X',
      'osVersion': 'Catalina'
    }
  }
];
const url = `http://${user}.browserstack.com/tests`;
const localOptions = { key, f: process.cwd() };

export default { user, key, capabilities, url, localOptions };
