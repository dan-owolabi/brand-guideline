import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'

/**
 * The rule that matters here is `no-restricted-imports` on the Mongo driver
 * and on src/server/db/client.
 *
 * Moving off Postgres means giving up RLS, which denied by default. Authorization
 * now lives in application code, which leaks by default. The mitigation is to
 * make an unscoped query unreachable rather than merely discouraged:
 *
 *   route handler -> guard (produces ctx) -> repo (folds ctx into the filter)
 *                                              |
 *                                              +-> getDb()  <- only reachable here
 *
 * That shrinks the audit surface from every call site to the handful of files
 * in src/server/db/. Without this rule the architecture is a convention, and
 * conventions are exactly what fail during a 20-day migration.
 */
export default [
    {
        ignores: ['.next/**', 'node_modules/**', 'dist/**'],
    },

    js.configs.recommended,

    // The ported components carry inline
    // `eslint-disable-next-line react-hooks/set-state-in-effect` comments from
    // the Vite config. Without the plugin registered those disables are
    // themselves errors ("rule definition not found"), so it has to be loaded
    // even though the migration does not otherwise depend on it.
    {
        files: ['src/**/*.{js,jsx}'],
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/set-state-in-effect': 'warn',
        },
    },

    {
        files: ['**/*.{js,jsx,mjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser, ...globals.node },
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: {
            'no-unused-vars': ['warn', {
                varsIgnorePattern: '^[A-Z_]',
                argsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
        },
    },

    // ── The architectural boundary ────────────────────────────────────────
    {
        files: ['**/*.{js,jsx,mjs}'],
        ignores: ['src/server/db/**', 'scripts/**'],
        rules: {
            'no-restricted-imports': ['error', {
                paths: [
                    {
                        name: 'mongodb',
                        message:
                            'Do not use the Mongo driver directly. Go through a repo in ' +
                            'src/server/db/repos/, which requires an authorization ctx. ' +
                            'Direct driver access bypasses the only tenant scoping we have.',
                    },
                ],
                patterns: [
                    {
                        // no-restricted-imports matches the literal import
                        // STRING, not the resolved path. So this needs to cover
                        // every spelling that can reach the module — including
                        // bare relative forms like '../db/client.js', which the
                        // server-prefixed patterns alone would miss.
                        group: [
                            '**/server/db/client', '**/server/db/client.js', '@/server/db/client',
                            '**/db/client', '**/db/client.js',
                        ],
                        message:
                            'getDb()/getClient() are private to src/server/db/. Add or extend a ' +
                            'repo function instead — repos fold ctx.accountId into every filter.',
                    },
                ],
            }],
        },
    },

    // src/server/auth/ is inside the trusted tree and legitimately needs the
    // raw handles: guard.js resolves memberships, and config.js hands the Db
    // and MongoClient to Better Auth's adapter. Narrow exemption, granted
    // explicitly rather than by leaving the pattern above too loose.
    {
        files: ['src/server/auth/**'],
        rules: { 'no-restricted-imports': 'off' },
    },

    // Client components must never reach server-only modules.
    //
    // NOTE: flat config REPLACES a rule's options rather than merging them, so
    // this block must restate the driver ban above. Dropping it here would
    // silently re-permit `import { MongoClient } from 'mongodb'` inside
    // components — the exact hole this whole layer exists to close.
    {
        files: ['src/components/**', 'src/contexts/**', 'src/hooks/**'],
        rules: {
            'no-restricted-imports': ['error', {
                paths: [
                    {
                        name: 'mongodb',
                        message:
                            'Do not use the Mongo driver directly. Go through a repo in ' +
                            'src/server/db/repos/, which requires an authorization ctx.',
                    },
                ],
                patterns: [
                    {
                        group: ['**/server/**', '@/server/*', '@/server/**'],
                        message:
                            'Client code cannot import from src/server/ — it would pull ' +
                            'MONGODB_URI into the browser bundle. Call an /api route instead.',
                    },
                ],
            }],
        },
    },
]
