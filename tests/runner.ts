import { createHarness } from 'zora';

const createCounter = () => {
  let success = 0;
  let failure = 0;
  let skip = 0;

  return Object.create(
    {
      increment: (message) => {
        if (message.type === 'TEST_START' && message.data.skip) {
          skip += 1;
        } else if (message.type === 'ASSERTION') {
          success += message.data.pass === true ? 1 : 0;
          failure += message.data.pass === false ? 1 : 0;
        }
      }
    },
    {
      success: { enumerable: true, get() { return success; } },
      failure: { enumerable: true, get() { return failure; } },
      skip: { enumerable: true, get() { return skip; } },
      total: { enumerable: true, get() { return skip + failure + success; } },
    }
  );
};

const createReporter = (counter) => {
  return async (messageStream) => {
    for await (const message of messageStream) {
      counter.increment(message);
    }
  };
};

export const { only, skip, test, report } = createHarness({});
export const counter = createCounter();
export const reporter = createReporter(counter);
