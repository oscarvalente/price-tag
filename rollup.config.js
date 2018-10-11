import babel from "rollup-plugin-babel";
import {terser} from "rollup-plugin-terser";
import copy from "rollup-plugin-copy-assets";

const commonConfig = {
    watch: {
        exclude: ["node_modules/**"]
    },
    plugins: [
        babel({
            exclude: "node_modules/**",
            plugins: ["@babel/plugin-proposal-object-rest-spread"]
        }),
        terser()
    ]
};

const popupConfig = {
    ...commonConfig,
    plugins: [
        ...commonConfig.plugins,
        copy({
            assets: [
                "./vendor",
                "./assets",
                "./views",
                "./popup.html",
                "./popup.css"
            ]
        })
    ]
};

const trackedItemsConfig = {
    ...commonConfig,
    plugins: [
        ...commonConfig.plugins,
        copy({
            assets: [
                "./tracked-items.html",
                "./tracked-items.css"
            ]
        })
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
        ...popupConfig
    }, {
        input: "tracked-items.js",
        output: {
            file: "dist/tracked-items.js",
            format: "iife"
        },
        ...trackedItemsConfig
    }
];
