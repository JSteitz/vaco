export const user = process.env.BROWSERSTACK_USERNAME;
export const key = process.env.BROWSERSTACK_ACCESS_KEY;
export const browserstackOptions = {
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

export const capabilities = [
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
export const url = `http://${user}.browserstack.com/tests`;
export const localOptions = { key, f: process.cwd() };
