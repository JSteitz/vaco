module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                useBuiltIns: 'entry',
                corejs: 3
            }
        ],
        '@babel/typescript'
    ],
    plugins: [
        '@babel/plugin-transform-parameters',
        '@babel/proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        'rewire-exports'
    ]
}
