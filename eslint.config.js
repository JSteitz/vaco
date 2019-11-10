module.exports = {
    root: true,
    env: {
        browser: true,
        node: true
    },
    extends: [
        'airbnb-base',
        'plugin:promise/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript'
    ],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    rules: {
        indent: ['warn', 4],
        semi: ['off'],
        'comma-dangle': ['off'],
        'max-len': ['off']
    },
    overrides: [
        {
            files: ['*.ts'],
            extends: [
                'plugin:@typescript-eslint/recommended'
            ],
            plugins: ['@typescript-eslint'],
            parser: '@typescript-eslint/parser'
        },
        {
            files: ['*.spec.js'],
            env: {
                mocha: true
            }
        }
    ]
}
