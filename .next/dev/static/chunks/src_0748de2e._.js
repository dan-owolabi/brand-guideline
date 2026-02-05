(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteFile",
    ()=>deleteFile,
    "getPublicUrl",
    ()=>getPublicUrl,
    "supabase",
    ()=>supabase,
    "uploadFile",
    ()=>uploadFile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
'use client';
;
// Environment variables
const supabaseUrl = ("TURBOPACK compile-time value", "https://ahfsosoabcvxgcwharui.supabase.co");
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZnNvc29hYmN2eGdjd2hhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjk1NTQsImV4cCI6MjA4NDcwNTU1NH0.Gi4EodMwX7sQSaOhGKuH9bCYl-3zxicuSxXQhUmApdc");
// Validate environment variables
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
async function uploadFile(file, path, bucket = 'brand-assets') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${path}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });
        if (uploadError) {
            return {
                url: null,
                error: uploadError
            };
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return {
            url: data.publicUrl,
            error: null
        };
    } catch (error) {
        return {
            url: null,
            error: error
        };
    }
}
async function deleteFile(filePath, bucket = 'brand-assets') {
    try {
        const { error } = await supabase.storage.from(bucket).remove([
            filePath
        ]);
        if (error) {
            return {
                success: false,
                error
            };
        }
        return {
            success: true,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            error: error
        };
    }
}
function getPublicUrl(filePath, bucket = 'brand-assets') {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// ============================================
// TIMEOUT HELPER - ensures loading never gets stuck
// ============================================
const TIMEOUT_MS = 5000 // 5 seconds max for any operation
;
function withTimeout(promise, fallback) {
    return Promise.race([
        promise,
        new Promise((resolve)=>setTimeout(()=>resolve(fallback), TIMEOUT_MS))
    ]);
}
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [workspaces, setWorkspaces] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentWorkspace, setCurrentWorkspace] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [workspacesLoading, setWorkspacesLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false) // Start false!
    ;
    // ============================================
    // FETCH WORKSPACES - with timeout protection
    // ============================================
    const fetchWorkspaces = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[fetchWorkspaces]": async (userId)=>{
            console.log('[Auth] Fetching workspaces for:', userId);
            setWorkspacesLoading(true);
            try {
                // Try RPC - simple and direct, no timeout wrapper needed
                const { data, error: rpcError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].rpc('get_user_workspaces');
                if (!rpcError && data && Array.isArray(data) && data.length > 0) {
                    console.log('[Auth] Found', data.length, 'workspaces');
                    const mapped = data.map({
                        "AuthProvider.useCallback[fetchWorkspaces].mapped": (w)=>({
                                id: w.workspace_id,
                                name: w.workspace_name,
                                slug: w.workspace_slug,
                                logo_url: w.workspace_logo_url,
                                owner_id: w.is_owner ? userId : '',
                                role: w.role,
                                can_invite: w.can_invite ?? false,
                                brand_access_type: w.brand_access_type ?? 'all'
                            })
                    }["AuthProvider.useCallback[fetchWorkspaces].mapped"]);
                    setWorkspaces(mapped);
                    selectDefaultWorkspace(mapped);
                    return;
                }
                console.log('[Auth] No workspaces found, creating one...');
                await createDefaultWorkspace(userId);
            } catch (err) {
                console.error('[Auth] Workspace fetch error:', err);
                // Still try to create workspace on error
                await createDefaultWorkspace(userId);
            } finally{
                // ALWAYS set loading to false
                setWorkspacesLoading(false);
            }
        }
    }["AuthProvider.useCallback[fetchWorkspaces]"], []);
    // Select default workspace
    function selectDefaultWorkspace(workspaceList) {
        if (workspaceList.length === 0) return;
        const savedId = localStorage.getItem('currentWorkspaceId');
        const saved = savedId ? workspaceList.find((w)=>w.id === savedId) : null;
        if (saved) {
            setCurrentWorkspace(saved);
        } else {
            setCurrentWorkspace(workspaceList[0]);
            localStorage.setItem('currentWorkspaceId', workspaceList[0].id);
        }
    }
    // Create workspace - direct DB insert, no RPC
    async function createDefaultWorkspace(userId) {
        try {
            console.log('[Auth] Creating workspace directly...');
            // Get user email for naming
            const { data: userData } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            const email = userData?.user?.email || 'user';
            const name = email.split('@')[0];
            const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);
            // Create workspace
            const { data: ws, error: wsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('workspaces').insert({
                name: `${name}'s Workspace`,
                slug: slug,
                owner_id: userId
            }).select().single();
            if (wsError) {
                console.error('[Auth] Create workspace failed:', wsError.message);
                return;
            }
            // Add membership
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('workspace_members').insert({
                workspace_id: ws.id,
                user_id: userId,
                role: 'owner',
                can_invite: true
            });
            // Set as current
            const workspace = {
                id: ws.id,
                name: ws.name,
                slug: ws.slug,
                owner_id: userId,
                role: 'owner',
                can_invite: true,
                brand_access_type: 'all'
            };
            setWorkspaces([
                workspace
            ]);
            setCurrentWorkspace(workspace);
            localStorage.setItem('currentWorkspaceId', ws.id);
            console.log('[Auth] Workspace created:', ws.name);
        } catch (err) {
            console.error('[Auth] Create workspace error:', err);
        }
    }
    // ============================================
    // INITIALIZE AUTH
    // ============================================
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            console.log('[Auth] Initializing...');
            let mounted = true;
            // Hard timeout - loading NEVER exceeds 3 seconds
            const hardTimeout = setTimeout({
                "AuthProvider.useEffect.hardTimeout": ()=>{
                    if (mounted) {
                        console.log('[Auth] Hard timeout - stopping loading');
                        setLoading(false);
                        setWorkspacesLoading(false);
                    }
                }
            }["AuthProvider.useEffect.hardTimeout"], 3000);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then({
                "AuthProvider.useEffect": ({ data: { session } })=>{
                    if (!mounted) return;
                    console.log('[Auth] Session:', session ? 'Found' : 'None');
                    setSession(session);
                    setUser(session?.user ?? null);
                    setLoading(false);
                    if (session?.user) {
                        fetchWorkspaces(session.user.id);
                    }
                }
            }["AuthProvider.useEffect"]);
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AuthProvider.useEffect": (event, session)=>{
                    if (!mounted) return;
                    console.log('[Auth] State change:', event);
                    setSession(session);
                    setUser(session?.user ?? null);
                    setLoading(false);
                    if (event === 'SIGNED_IN' && session?.user) {
                        fetchWorkspaces(session.user.id);
                    } else if (event === 'SIGNED_OUT') {
                        setWorkspaces([]);
                        setCurrentWorkspace(null);
                        localStorage.removeItem('currentWorkspaceId');
                    }
                }
            }["AuthProvider.useEffect"]);
            return ({
                "AuthProvider.useEffect": ()=>{
                    mounted = false;
                    clearTimeout(hardTimeout);
                    subscription.unsubscribe();
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], [
        fetchWorkspaces
    ]);
    // ============================================
    // AUTH ACTIONS
    // ============================================
    const signIn = async (email, password)=>{
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
            email,
            password
        });
        return {
            error: error
        };
    };
    const signUp = async (email, password, fullName)=>{
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        return {
            error: error
        };
    };
    const signInWithOAuth = async (provider)=>{
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        return {
            error: error
        };
    };
    const signOut = async ()=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
        setWorkspaces([]);
        setCurrentWorkspace(null);
    };
    const switchWorkspace = (workspaceId)=>{
        const ws = workspaces.find((w)=>w.id === workspaceId);
        if (ws) {
            setCurrentWorkspace(ws);
            localStorage.setItem('currentWorkspaceId', workspaceId);
        }
    };
    const createWorkspace = async (name, slug)=>{
        if (!user) return {
            data: null,
            error: new Error('Not authenticated')
        };
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('workspaces').insert({
            name,
            slug,
            owner_id: user.id
        }).select().single();
        if (error) return {
            data: null,
            error
        };
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('workspace_members').insert({
            workspace_id: data.id,
            user_id: user.id,
            role: 'owner',
            can_invite: true
        });
        await fetchWorkspaces(user.id);
        return {
            data: data,
            error: null
        };
    };
    const refreshWorkspaces = async ()=>{
        if (user) await fetchWorkspaces(user.id);
    };
    // ============================================
    // CONTEXT VALUE
    // ============================================
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            session,
            loading,
            workspaces,
            currentWorkspace,
            workspacesLoading,
            signIn,
            signUp,
            signInWithOAuth,
            signOut,
            switchWorkspace,
            createWorkspace,
            refreshWorkspaces,
            // Legacy aliases
            accounts: workspaces,
            currentAccount: currentWorkspace,
            authLoading: loading,
            switchAccount: switchWorkspace,
            createAccount: async (name, slug)=>{
                const res = await createWorkspace(name, slug);
                return {
                    error: res.error
                };
            },
            refreshAccounts: refreshWorkspaces
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/AuthContext.tsx",
        lineNumber: 308,
        columnNumber: 9
    }, this);
}
_s(AuthProvider, "f7hU5XTbXdTcHIPPeDJt5vbBN1s=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_0748de2e._.js.map