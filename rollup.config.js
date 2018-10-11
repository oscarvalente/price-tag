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
            file: "dist/background.js",
            format: "iife"
        },
        ...commonConfig
    }, {
        input: "page-agent.js",
        output: {
            file: "dist/page-agent.js",
            format: "iife"
        },
        ...commonConfig
    }, {
        input: "popup.js",
        output: {
            file: "dist/popup.js",
            format: "iife"
        },
        ...commonConfig
    }, {
        input: "tracked-items.js",
        output: {
            file: "dist/tracked-items.js",
            format: "iife"
        },
        ...commonConfig
    }, {
        input: "views/modal.js",
        output: {
            file: "dist/views/modal.js",
            format: "iife"
        },
        ...commonConfig
    }
];
