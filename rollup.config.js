import path from 'path';
import multiEntry from '@rollup/plugin-multi-entry';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import analyzer from 'rollup-plugin-analyzer';
import istanbul from 'rollup-plugin-istanbul';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const isProduction = process.env.PRODUCTION === 'true';
const isTest = process.env.TEST === 'true';
const isTestCoverage = process.env.COVERAGE === 'true';

const config = {
  input: path.resolve(pkg.directories.lib, 'index.ts'),
  output: [
    {
      file: pkg.browser,
      format: 'umd',
      name: 'Vaco',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    typescript(),
    isProduction ? terser() : undefined,
    isProduction ? analyzer({ summaryOnly: true }) : undefined
  ]
};

const testConfig = [
  {
    input: path.resolve(pkg.directories.test, 'runner.ts'),
    output: [
      {
        file: '.cache/runner.js',
        format: 'iife',
        name: 'TestRunner',
        sourcemap: 'inline'
      }
    ],
    plugins: [
      resolve({ extensions: ['.mjs', '.js', '.ts', '.json'] }),
      typescript(),
    ]
  },
  {
    external: ['zora'],
    input: [
      path.resolve(pkg.directories.test, 'setup.ts'),
      path.resolve(pkg.directories.test, '**/*.spec.ts')
    ],
    output: {
      file: '.cache/tests.js',
      format: 'iife',
      sourcemap: 'inline',
      globals: { zora: 'TestRunner' },
    },
    plugins: [
      resolve({ extensions: ['.mjs', '.js', '.ts', '.json'] }),
      typescript(),
      multiEntry(),
      isTestCoverage ? istanbul({
        exclude: [
          path.resolve('node_modules/**'),
          path.resolve(pkg.directories.test, '**')
        ]
      }) : undefined,
    ],
    treeshake: false
  }
];

export default isTest ? testConfig : config;
