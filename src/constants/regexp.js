export default {
    PRICE: /((?:\d+[.,])?\d+(?:[.,]\d+)?)/,
    HOSTNAME: /https?:\/\/([\w.]+)\/*/,
    DOMAIN: /^([\w-]+\.)+[\w-]+\w$/,
    URL: /^https?:\/\/([\w-]+\.)+[\w-]+\w(\/[\w-=.]+)+\/?(\?([\w]+=?[\w-%!@()\\["#\]]+&?)*)?/,
    CAPTURE: {
        DOMAIN_IN_URL: /https?:\/\/([\w.]+)\/*/,
        HOSTNAME_AND_PATH: /^https?:\/\/((?:[\w-]+\.)+[\w-]+\w(?:\/[\w-=.]+)+\/?)/,
        PROTOCOL_HOSTNAME_AND_PATH: /^(https?:\/\/(?:[\w-]+\.)+[\w-]+\w(?:\/[\w-=.]+)+\/?)/
    }
};
