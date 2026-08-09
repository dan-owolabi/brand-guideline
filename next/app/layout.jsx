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
            <body>{children}</body>
        </html>
    )
}
