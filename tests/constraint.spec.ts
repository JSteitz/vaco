import { test } from 'zora';
import {
  getByAttributes,
  getValidityStates,
  getAttributes,
  Constraint,
} from '../lib/constraint';

test(
  'getByAttributes :: When called with a list of constraints and a list of predicates, expect to get a sublist of the constraints',
  (assert) => {
    const constraintA = { attributes: ['a', 'b'] } as Constraint;
    const constraintB = { attributes: ['b', 'c'] } as Constraint;
    const constraints = { a: constraintA, b: constraintB };

    assert.equal(
      getByAttributes(constraints)(['f']),
      {},
      'no constraint matches the attribute list',
    );

    assert.equal(
      getByAttributes(constraints)(['a']),
      { a: constraintA },
      'at least one constraint matches the attribute list',
    );

    assert.equal(
      getByAttributes(constraints)(['a', 'c']),
      { a: constraintA, b: constraintB },
      'multiple constraints match at least one attribute',
    );

    assert.equal(
      getByAttributes(constraints)(['b']),
      { a: constraintA, b: constraintB },
      'multiple constraints match the same attribute',
    );
  },
);

test(
  'getValidityStates :: When called with a list of constraints, expect to get a list of accumulated validity states',
  (assert) => {
    const constraintA = { states: ['a'] } as Constraint;
    const constraintB = { states: ['b'] } as Constraint;

    assert.equal(
      getValidityStates({ a: constraintA, b: constraintB }),
      ['a', 'b'],
      'contains all states defined in each constraint',
    );
  },
);

test(
  'getAttributes :: When called with a list of constraints, expect to get a unique list of accumulated attributes',
  (assert) => {
    const constraintA = { attributes: ['a', 'b'] } as Constraint;
    const constraintB = { attributes: ['b', 'c'] } as Constraint;

    assert.equal(
      getAttributes({ a: constraintA, b: constraintB }),
      new Set(['a', 'b', 'c']),
      'contains all attributes defined in each constraint',
    );
  },
);
