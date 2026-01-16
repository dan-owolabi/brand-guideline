import BlockHero from './blocks/BlockHero'
import BlockText from './blocks/BlockText'
import BlockColorGrid from './blocks/BlockColorGrid'
import BlockTypographyShowcase from './blocks/BlockTypographyShowcase'
import BlockAssetGrid from './blocks/BlockAssetGrid'
import BlockLogoShowcase from './blocks/BlockLogoShowcase'
import BlockDoDont from './blocks/BlockDoDont'
import BlockValueGrid from './blocks/BlockValueGrid'

export default function BlockRenderer({ blocks, brand }) {
    return (
        <div className="space-y-12">
            {blocks.map((block, index) => {
                const key = `${block.type}-${index}`

                switch (block.type) {
                    case 'hero':
                        return <BlockHero key={key} data={block.data} brand={brand} />

                    case 'text':
                        return <BlockText key={key} data={block.data} />

                    case 'color-grid':
                        return <BlockColorGrid key={key} data={block.data} brand={brand} />

                    case 'typography-showcase':
                        return <BlockTypographyShowcase key={key} data={block.data} />

                    case 'asset-grid':
                        return <BlockAssetGrid key={key} data={block.data} brand={brand} />

                    case 'logo-showcase':
                        return <BlockLogoShowcase key={key} data={block.data} />

                    case 'do-dont':
                        return <BlockDoDont key={key} data={block.data} />

                    case 'value-grid':
                        return <BlockValueGrid key={key} data={block.data} brand={brand} />

                    default:
                        return (
                            <div key={key} className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-800 font-medium">Unknown block type: {block.type}</p>
                            </div>
                        )
                }
            })}
        </div>
    )
}
