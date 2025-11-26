module.exports = [
"[externals]/crypto [external] (crypto, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[externals]/crypto [external] (crypto, cjs)");
    });
});
}),
"[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/https-proxy-agent/dist/index.js [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[root-of-the-server]__8542c561._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/https-proxy-agent/dist/index.js [app-route] (ecmascript)");
    });
});
}),
"[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/node-fetch/src/index.js [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/b3dc8_node-fetch_src_utils_multipart-parser_c565e393.js",
  "server/chunks/b3dc8_220e87be._.js",
  "server/chunks/[root-of-the-server]__87f6e720._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/node-fetch/src/index.js [app-route] (ecmascript)");
    });
});
}),
];