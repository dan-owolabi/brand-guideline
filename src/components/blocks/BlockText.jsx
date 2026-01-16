export default function BlockText({ data }) {
    const { title, body } = data

    return (
        <div className="max-w-3xl">
            {title && (
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
            )}
            {body && (
                <div className="prose prose-lg text-gray-600 leading-relaxed">
                    {body.split('\n\n').map((paragraph, index) => (
                        <p key={index} className={index > 0 ? 'mt-4' : ''}>
                            {paragraph}
                        </p>
                    ))}
                </div>
            )}
        </div>
    )
}
