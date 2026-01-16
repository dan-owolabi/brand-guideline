import { useParams } from 'react-router-dom'
import BlockRenderer from './BlockRenderer'

export default function PageContent({ config }) {
    const { slug } = useParams()
    const pageData = config.pages[slug]

    if (!pageData) {
        return (
            <div className="p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-gray-600">The page "{slug}" does not exist in the configuration.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Page Title */}
            <div className="border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-12 py-10">
                    <h1 className="text-4xl font-bold text-gray-900">{pageData.title}</h1>
                </div>
            </div>

            {/* Blocks */}
            <div className="max-w-5xl mx-auto px-12 py-10">
                <BlockRenderer blocks={pageData.blocks} brand={config.brand} />
            </div>
        </div>
    )
}
