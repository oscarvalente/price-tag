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

export default [
    {
        input: "background.js",
        output: {
            file: "dist/bg.js",
            format: "iife",
            sourcemap: true
        },
        ...commonConfig
    }, {
        input: "page-agent.js",
        output: [
            {
                file: "dist/pa.js",
                format: "iife",
                sourcemap: true
            }
        ],
        ...commonConfig
    }
];
