import 'server-only'
import { setSessionResolver } from './guard.js'

/**
 * Session resolution now lives in guard.js itself, which resolves Better Auth
 * directly. This module used to install that resolver as an import side
 * effect — an approach that failed intermittently, because route handlers are
 * bundled separately and any route that did not transitively import this file
 * kept the fail-closed default and returned 401.
 *
 * Kept only as the documented seam for tests, which inject fake personas
 * without standing up real sessions. Nothing in the app needs to call it.
 */
export { setSessionResolver }
