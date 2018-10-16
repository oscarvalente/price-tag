import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import {terser} from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";
import postcssInlineSvg from "postcss-inline-svg";
import postcssModules from "postcss-modules";
import replace from "rollup-plugin-replace";

const commonConfig = {
    plugins: [
        babel({
            babelrc: true,
            exclude: "node_modules/**"
        }),
        resolve({
            customResolveOptions: {
                moduleDirectory: "node_modules"
            }
        })
    ]
};

const getCommonConfig = (env => {
    switch (env) {
        case "production":
            return {
                ...commonConfig,
                plugins: [
                    ...commonConfig.plugins,
                    terser()
                ]
            };
        default:
            return {
                ...commonConfig,
                watch: {
                    exclude: ["node_modules/**"]
                }
            };
    }
}).bind(null, process.env.BUILD);

const getOutputEntryConfig = (env => {
    switch (env) {
        case "production":
            return {};
        default:
            return {
                sourcemap: true
            };
    }
}).bind(null, process.env.BUILD);

const getPostCSSConfig = (env => {
    switch (env) {
        case "production":
            return {};
        default:
            return {
                sourceMap: true
            };
    }
}).bind(null, process.env.BUILD);

const viewConfig = {
    ...getCommonConfig(),
    plugins: [
        ...getCommonConfig().plugins,
        postcss({
            modules: true,
            extensions: [".css", ".scss"],
            // extract: true,
            syntax: "postcss-scss",
            use: ["sass"],
            plugins: [
                postcssInlineSvg()
            ],
            ...getPostCSSConfig()
        }),
        replace({
            "process.env.NODE_ENV": JSON.stringify(process.env.BUILD)
        }),
        commonjs({
            sourceMap: false,
            include: [
                "node_modules/**"
            ],
            namedExports: {
                "node_modules/react/index.js": ["Children", "Component", "Fragment", "PropTypes", "createElement"],
                "node_modules/react-dom/index.js": ["render"]
            }
        })
    ]
};

export default [
    {
        input: "background.js",
        output: {
            file: "dist/background.js",
            format: "iife",
            ...getOutputEntryConfig()
        },
        ...getCommonConfig()
    }, {
        input: "page-agent.js",
        output: {
            file: "dist/page-agent.js",
            format: "iife",
            ...getOutputEntryConfig()
        },
        ...getCommonConfig()
    }, {
        input: "popup.js",
        output: {
            file: "dist/popup.js",
            format: "iife",
            ...getOutputEntryConfig()
        },
        ...viewConfig
    }, {
        input: "tracked-items.js",
        output: {
            file: "dist/tracked-items.js",
            format: "iife",
            ...getOutputEntryConfig()
        },
        ...viewConfig
    }, {
        input: "views/modal.js",
        output: {
            file: "dist/views/modal.js",
            format: "iife",
            ...getOutputEntryConfig()
        },
        ...commonConfig
    }
];
