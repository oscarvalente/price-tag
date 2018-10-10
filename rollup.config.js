export default [
    {
        input: 'background.js',
        output: {
            file: 'dist/bg.js',
            format: 'cjs'
        }
    }, {
        input: 'page-agent.js',
        output: [
            {
                file: 'dist/pa.js',
                format: 'cjs'
            }
        ]
    }
];
