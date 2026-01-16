import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ config, children }) {
    // Handle Font Injection
    useEffect(() => {
        const fontFamily = config.brand?.font_family || 'Geist'

        // If it's the default font (Geist), we don't need to fetch from Google Fonts
        // as it should be handled by the app's base styles/imports.
        // However, if the user requested to handle Google Fonts support:
        if (fontFamily !== 'Geist' && fontFamily !== 'Inter' && fontFamily !== 'system-ui') {
            const link = document.createElement('link')
            link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
            link.rel = 'stylesheet'
            document.head.appendChild(link)

            return () => {
                document.head.removeChild(link)
            }
        }
    }, [config.brand?.font_family])

    return (
        <div
            className="min-h-screen bg-white"
            style={{
                fontFamily: config.brand?.font_family ? `"${config.brand.font_family}", sans-serif` : undefined
            }}
        >
            {/* Header */}
            <Header brand={config.brand} />

            {/* Main Layout */}
            <div className="flex pt-16">
                {/* Sidebar */}
                <Sidebar navigation={config.navigation} brand={config.brand} />

                {/* Main Content */}
                <main className="flex-1 ml-64 min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>
        </div>
    )
}
