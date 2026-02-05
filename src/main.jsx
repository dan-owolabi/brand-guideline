import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { resolveDomainContext } from './lib/domainResolver'
import MarketingApp from './components/MarketingApp'
import AuthenticatedApp from './components/AuthenticatedApp'
import PublicBrandApp from './components/PublicBrandApp'
import './index.css'

/**
 * App Root
 * 
 * Determines which app shell to render based on the current domain.
 * - guidr.space → MarketingApp
 * - app.guidr.space → AuthenticatedApp (with auth)
 * - {brand}.guidr.space → PublicBrandApp
 * - custom domain → PublicBrandApp (with hostname lookup)
 */
import App from './App'

function AppRoot() {
  const context = resolveDomainContext()

  // DEV MODE: On localhost, use the simple App.jsx with direct routes
  // This bypasses the accounts system for local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return <App />
  }

  // Marketing site (guidr.space)
  if (context.type === 'marketing') {
    return <MarketingApp />
  }


  // Authenticated app (app.guidr.space)
  if (context.type === 'app') {
    return (
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    )
  }

  // Brand subdomain ({brand}.guidr.space)
  if (context.type === 'brand') {
    return <PublicBrandApp brandIdentifier={context.brand} />
  }

  // Custom domain
  if (context.type === 'custom') {
    return <PublicBrandApp brandIdentifier={context.hostname} isCustomDomain />
  }

  // Fallback to marketing
  return <MarketingApp />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoot />
    </BrowserRouter>
  </React.StrictMode>
)
