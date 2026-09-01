import '../src/index.css'

export const metadata = {
    title: 'Guidr',
    description: 'Guidr - Brand Guidelines Platform',
    icons: {
        icon: '/guidr-icon.png'
    }
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                {/*
                  Load the same faces the Vite app loaded, so the port renders
                  identically.

                  index.css declares --font-sans as:
                      "Zalando Sans", "Geist Sans", "Geist", "Inter", …

                  The Vite app never actually loaded Zalando Sans — only Inter
                  and Geist — so the stack fell through and production has
                  always rendered in Geist. The Next port briefly imported
                  Zalando Sans in index.css, which made it the first available
                  face and silently changed the typography of every screen.

                  Matching production is deliberate. To adopt Zalando Sans as
                  the real UI face, add its stylesheet here rather than in the
                  CSS, so all three faces are declared in one place.
                */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css"
                />
            </head>
            <body>{children}</body>
        </html>
    )
}
