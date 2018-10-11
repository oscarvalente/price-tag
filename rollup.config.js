import babel from "rollup-plugin-babel";
import {terser} from "rollup-plugin-terser";

const commonConfig = {
    plugins: [
        babel({
            exclude: "node_modules/**",
            plugins: ["@babel/plugin-proposal-object-rest-spread"]
        }),
        terser()
    ]
};

const prodOutputConfig = {
    sourcemap: true
};

const getOutputConfig = ((env) => {
    switch (env) {
        case "production":
            return {};
        default:
            return prodOutputConfig;
    }
}).bind(null, process.env.BUILD);

export default [
    {
        input: "background.js",
        output: {
            file: "dist/bg.js",
            format: "iife",
            ...getOutputConfig()
        },
        ...commonConfig
    }, {
        input: "page-agent.js",
        output: [
            {
                file: "dist/pa.js",
                format: "iife",
                ...getOutputConfig()
            }
        ],
        ...commonConfig
    }
];
