import multi from '@rollup/plugin-multi-entry'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import path from 'path'
import analyzer from 'rollup-plugin-analyzer'
import istanbul from 'rollup-plugin-istanbul'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

const isProduction = process.env.PRODUCTION === 'true'
const isTest = process.env.TEST === 'true'
const isTestCoverage = process.env.COVERAGE === 'true'

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
}

const testConfig = [
  {
    input: path.resolve('tools/harness.js'),
    output: [
      {
        file: '.cache/harness.js',
        format: 'iife',
        sourcemap: 'inline'
      }
    ],
    plugins: [
      nodeResolve()
    ]
  },
  {
    external: ['zora'],
    input: [
      path.resolve(pkg.directories.test, 'setup.ts'),
      path.resolve(pkg.directories.test, '**/*.spec.ts')
    ],
    output: [
      {
        file: '.cache/bundle.js',
        format: 'iife',
        sourcemap: 'inline',
        globals: { zora: 'harness' }
      }
    ],
    plugins: [
      multi(),
      typescript(),
      isTestCoverage ? istanbul({
        exclude: [
          path.resolve('node_modules/**'),
          path.resolve(pkg.directories.test, '**')
        ]
      }) : undefined,
      nodeResolve()
    ],
    treeshake: false
  }
]

export default isTest ? testConfig : config
