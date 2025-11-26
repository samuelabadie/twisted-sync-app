(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Dashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function Dashboard() {
    _s();
    const [services, setServices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [syncing, setSyncing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showAddForm, setShowAddForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [newService, setNewService] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        price: 100,
        duration: 120,
        bufferBefore: 15,
        bufferAfter: 15
    });
    const [addingService, setAddingService] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [deletingService, setDeletingService] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [togglingVisibility, setTogglingVisibility] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [syncResult, setSyncResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Dashboard.useEffect": ()=>{
            loadServices();
        }
    }["Dashboard.useEffect"], []);
    async function loadServices() {
        try {
            setLoading(true);
            const res = await fetch('/api/services');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setServices(data.services || []);
        } catch (err) {
            setError(err.message);
        } finally{
            setLoading(false);
        }
    }
    async function handleSync() {
        setSyncing(true);
        setSyncResult(null);
        try {
            const res = await fetch('/api/sync', {
                method: 'POST'
            });
            const data = await res.json();
            setSyncResult(data);
            await loadServices();
        } catch (err) {
            setError(err.message);
        } finally{
            setSyncing(false);
        }
    }
    async function handleAddService(e) {
        e.preventDefault();
        setAddingService(true);
        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newService)
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setShowAddForm(false);
            setNewService({
                name: '',
                price: 100,
                duration: 120,
                bufferBefore: 15,
                bufferAfter: 15
            });
            await loadServices();
        } catch (err) {
            setError(err.message);
        } finally{
            setAddingService(false);
        }
    }
    async function handleDeleteService(serviceName) {
        if (!confirm(`Supprimer "${serviceName}" et toutes ses options ?`)) return;
        setDeletingService(serviceName);
        try {
            const res = await fetch(`/api/services?name=${encodeURIComponent(serviceName)}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            await loadServices();
        } catch (err) {
            setError(err.message);
        } finally{
            setDeletingService(null);
        }
    }
    async function handleToggleVisibility(serviceName, currentVisible) {
        setTogglingVisibility(serviceName);
        try {
            const res = await fetch('/api/services', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: serviceName,
                    visible: !currentVisible
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            // Update local state immediately for better UX
            setServices((prev)=>prev.map((s)=>s.name === serviceName ? {
                        ...s,
                        visible: !currentVisible
                    } : s));
        } catch (err) {
            setError(err.message);
        } finally{
            setTogglingVisibility(null);
        }
    }
    const totalServices = services.length;
    const totalWithOptions = services.reduce((acc, s)=>acc + 1 + s.options.length, 0);
    const syncedCount = services.filter((s)=>s.isFullySynced).length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "border-b border-stone-800 bg-stone-900/50 backdrop-blur-sm sticky top-0 z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-6 py-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xl",
                                            children: "✂️"
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 148,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                        lineNumber: 147,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                className: "font-display text-2xl font-bold text-amber-100",
                                                children: "Twisted Admin"
                                            }, void 0, false, {
                                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                lineNumber: 151,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-stone-400",
                                                children: "Gestion des services"
                                            }, void 0, false, {
                                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                lineNumber: 152,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                        lineNumber: 150,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleSync,
                                        disabled: syncing,
                                        className: "px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: syncing ? 'animate-spin' : '',
                                                children: "🔄"
                                            }, void 0, false, {
                                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                lineNumber: 161,
                                                columnNumber: 17
                                            }, this),
                                            syncing ? 'Synchronisation...' : 'Sync Now'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                        lineNumber: 156,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowAddForm(true),
                                        className: "px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "➕"
                                            }, void 0, false, {
                                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                lineNumber: 168,
                                                columnNumber: 17
                                            }, this),
                                            "Nouveau service"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                        lineNumber: 164,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 155,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                        lineNumber: 145,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                    lineNumber: 144,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                lineNumber: 143,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "max-w-7xl mx-auto px-6 py-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-12 h-12 rounded-xl bg-amber-900/30 flex items-center justify-center text-2xl",
                                            children: "💇"
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 181,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-3xl font-bold text-amber-100",
                                                    children: totalServices
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 185,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-stone-400",
                                                    children: "Services parents"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 184,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 180,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-12 h-12 rounded-xl bg-emerald-900/30 flex items-center justify-center text-2xl",
                                            children: "📦"
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 192,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-3xl font-bold text-emerald-100",
                                                    children: totalWithOptions
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 196,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-stone-400",
                                                    children: "Total avec options"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 197,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 195,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 191,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 190,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-12 h-12 rounded-xl bg-blue-900/30 flex items-center justify-center text-2xl",
                                            children: "✅"
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 203,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-3xl font-bold text-blue-100",
                                                    children: [
                                                        syncedCount,
                                                        "/",
                                                        totalServices
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 207,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-stone-400",
                                                    children: "Synchronisés"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 208,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 206,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 202,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 201,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    syncResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-4 mb-6 animate-fade-in",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-2xl",
                                    children: syncResult.error ? '❌' : '✅'
                                }, void 0, false, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 218,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-medium",
                                            children: syncResult.message || syncResult.error
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 220,
                                            columnNumber: 17
                                        }, this),
                                        syncResult.summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-stone-400",
                                            children: [
                                                "Vérifié: ",
                                                syncResult.summary.checked,
                                                " | Créé Bookla: ",
                                                syncResult.summary.bookla_created,
                                                " | Créé Webflow: ",
                                                syncResult.summary.webflow_created
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 222,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 219,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setSyncResult(null),
                                    className: "ml-auto text-stone-500 hover:text-stone-300",
                                    children: "✕"
                                }, void 0, false, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 229,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                            lineNumber: 217,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                        lineNumber: 216,
                        columnNumber: 11
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-2xl shadow-xl p-4 mb-6 animate-fade-in",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-2xl",
                                    children: "⚠️"
                                }, void 0, false, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 238,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-red-200",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 239,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setError(null),
                                    className: "ml-auto text-red-400 hover:text-red-300",
                                    children: "✕"
                                }, void 0, false, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 240,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                            lineNumber: 237,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                        lineNumber: 236,
                        columnNumber: 11
                    }, this),
                    loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "animate-spin text-4xl mb-4",
                                children: "🔄"
                            }, void 0, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 248,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-stone-400",
                                children: "Chargement des services..."
                            }, void 0, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 249,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                        lineNumber: 247,
                        columnNumber: 11
                    }, this) : services.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-4xl mb-4",
                                children: "📭"
                            }, void 0, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 253,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-stone-400",
                                children: "Aucun service trouvé"
                            }, void 0, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 254,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowAddForm(true),
                                className: "px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg mt-4",
                                children: "Ajouter un service"
                            }, void 0, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 255,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                        lineNumber: 252,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-4",
                        children: services.map((service, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-6 animate-fade-in hover:border-stone-700 transition-colors",
                                style: {
                                    animationDelay: `${idx * 50}ms`
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3 mb-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-xl font-semibold text-amber-100",
                                                            children: service.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                            lineNumber: 270,
                                                            columnNumber: 23
                                                        }, this),
                                                        service.isFullySynced ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/40 text-emerald-400 text-xs font-medium rounded-full border border-emerald-800/50",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "w-1.5 h-1.5 rounded-full bg-emerald-400"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 273,
                                                                    columnNumber: 27
                                                                }, this),
                                                                "Synchronisé"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                            lineNumber: 272,
                                                            columnNumber: 25
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-900/40 text-amber-400 text-xs font-medium rounded-full border border-amber-800/50",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "w-1.5 h-1.5 rounded-full bg-amber-400"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 278,
                                                                    columnNumber: 27
                                                                }, this),
                                                                "En attente"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                            lineNumber: 277,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 269,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-6 text-sm text-stone-400 mb-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "flex items-center gap-1.5",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: "💰"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 285,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " ",
                                                                service.price,
                                                                "€"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                            lineNumber: 284,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "flex items-center gap-1.5",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: "⏱️"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 288,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " ",
                                                                service.duration,
                                                                " min"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                            lineNumber: 287,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "flex items-center gap-1.5",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: "🔗"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 291,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " ",
                                                                service.slug
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                            lineNumber: 290,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 283,
                                                    columnNumber: 21
                                                }, this),
                                                service.options.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-4 pl-4 border-l-2 border-stone-700 space-y-2",
                                                    children: service.options.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-4 text-sm",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-stone-500",
                                                                    children: "↳"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 300,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-stone-300",
                                                                    children: [
                                                                        "+ ",
                                                                        opt.option_extra_slug?.replace(/-/g, ' ')
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 301,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-stone-500",
                                                                    children: [
                                                                        "+",
                                                                        opt.option_extra_price,
                                                                        "€"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 302,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-stone-500",
                                                                    children: [
                                                                        "+",
                                                                        opt.option_extra_duration,
                                                                        "min"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 303,
                                                                    columnNumber: 29
                                                                }, this),
                                                                opt.bookla_service_id && opt.webflow_id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-emerald-500 text-xs",
                                                                    children: "✓"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 305,
                                                                    columnNumber: 31
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-amber-500 text-xs",
                                                                    children: "○"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                                    lineNumber: 307,
                                                                    columnNumber: 31
                                                                }, this)
                                                            ]
                                                        }, opt.rowIndex, true, {
                                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                            lineNumber: 299,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 297,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 268,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleToggleVisibility(service.name, service.visible),
                                                    disabled: togglingVisibility === service.name,
                                                    className: `relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${service.visible ? 'bg-emerald-600' : 'bg-stone-700'} ${togglingVisibility === service.name ? 'opacity-50' : ''}`,
                                                    title: service.visible ? 'Visible sur le site' : 'Masqué du site',
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${service.visible ? 'translate-x-6' : 'translate-x-1'}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                        lineNumber: 327,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 317,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-xs font-medium ${service.visible ? 'text-emerald-400' : 'text-stone-500'}`,
                                                    children: togglingVisibility === service.name ? '...' : service.visible ? 'Visible' : 'Masqué'
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 333,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleDeleteService(service.name),
                                                    disabled: deletingService === service.name,
                                                    className: "px-4 py-2 bg-red-900/50 hover:bg-red-800/70 text-red-200 font-medium rounded-lg transition-all duration-300 border border-red-800/50 hover:border-red-700 text-sm",
                                                    children: deletingService === service.name ? '...' : '🗑️ Supprimer'
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 338,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 315,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 267,
                                    columnNumber: 17
                                }, this)
                            }, service.slug, false, {
                                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                lineNumber: 262,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                        lineNumber: 260,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                lineNumber: 176,
                columnNumber: 7
            }, this),
            showAddForm && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-stone-900/95 backdrop-blur-sm border border-stone-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold text-amber-100 mb-6",
                            children: "Nouveau service"
                        }, void 0, false, {
                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                            lineNumber: 357,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleAddService,
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-stone-300 mb-2",
                                            children: "Nom du service"
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 360,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            value: newService.name,
                                            onChange: (e)=>setNewService({
                                                    ...newService,
                                                    name: e.target.value
                                                }),
                                            placeholder: "Ex: Tresses africaines",
                                            className: "w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300",
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 361,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 359,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-stone-300 mb-2",
                                                    children: "Prix (€)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 372,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    value: newService.price,
                                                    onChange: (e)=>setNewService({
                                                            ...newService,
                                                            price: parseInt(e.target.value)
                                                        }),
                                                    className: "w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300",
                                                    min: "0",
                                                    required: true
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 373,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 371,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-stone-300 mb-2",
                                                    children: "Durée (min)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 383,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    value: newService.duration,
                                                    onChange: (e)=>setNewService({
                                                            ...newService,
                                                            duration: parseInt(e.target.value)
                                                        }),
                                                    className: "w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300",
                                                    min: "15",
                                                    step: "15",
                                                    required: true
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 384,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 382,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 370,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-stone-300 mb-2",
                                                    children: "Buffer avant (min)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 397,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    value: newService.bufferBefore,
                                                    onChange: (e)=>setNewService({
                                                            ...newService,
                                                            bufferBefore: parseInt(e.target.value)
                                                        }),
                                                    className: "w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300",
                                                    min: "0",
                                                    step: "5"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 398,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 396,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-stone-300 mb-2",
                                                    children: "Buffer après (min)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 408,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    value: newService.bufferAfter,
                                                    onChange: (e)=>setNewService({
                                                            ...newService,
                                                            bufferAfter: parseInt(e.target.value)
                                                        }),
                                                    className: "w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300",
                                                    min: "0",
                                                    step: "5"
                                                }, void 0, false, {
                                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                                    lineNumber: 409,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 407,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 395,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-stone-500",
                                    children: "Les 3 options (Coupe des pointes, Shampoing démêlant, Shampoing et soin) seront ajoutées automatiquement."
                                }, void 0, false, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 419,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-3 pt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setShowAddForm(false),
                                            className: "px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium rounded-xl transition-all duration-300 border border-stone-700 hover:border-stone-600 flex-1",
                                            children: "Annuler"
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 423,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "submit",
                                            disabled: addingService,
                                            className: "px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg flex-1",
                                            children: addingService ? 'Création...' : 'Créer le service'
                                        }, void 0, false, {
                                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                            lineNumber: 430,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                                    lineNumber: 422,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                            lineNumber: 358,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                    lineNumber: 356,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
                lineNumber: 355,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Documents/auto-entreprise/clients/Twisted/sync-app/app/page.tsx",
        lineNumber: 141,
        columnNumber: 5
    }, this);
}
_s(Dashboard, "2MVAzZBo+6rwS2vaX9DhCZMlxhA=");
_c = Dashboard;
var _c;
__turbopack_context__.k.register(_c, "Dashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$auto$2d$entreprise$2f$clients$2f$Twisted$2f$sync$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/Documents/auto-entreprise/clients/Twisted/sync-app/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=Documents_auto-entreprise_clients_Twisted_sync-app_6c7b35f7._.js.map