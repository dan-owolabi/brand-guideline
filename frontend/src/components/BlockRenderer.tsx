import { Block } from '@/components/blocks/types'
import BlockHero from './blocks/BlockHero'
import BlockText from './blocks/BlockText'
import BlockColorGrid from './blocks/BlockColorGrid'
import BlockTypographyShowcase from './blocks/BlockTypographyShowcase'
import BlockAssetGrid from './blocks/BlockAssetGrid'
import BlockLogoShowcase from './blocks/BlockLogoShowcase'
import BlockDoDont from './blocks/BlockDoDont'
import BlockValueGrid from './blocks/BlockValueGrid'
import AssetBlock from './blocks/AssetBlock'

interface BlockRendererProps {
    blocks: Block[]
    brand?: any
}

export default function BlockRenderer({ blocks, brand }: BlockRendererProps) {
    if (!blocks || !Array.isArray(blocks)) return null

    return (
        <div className="space-y-12">
            {blocks.map((block: Block, index: number) => {
                const key = `${block.type}-${index}`

                // Some legacy data might have 'file-upload' or 'assets' types
                // We map them to the AssetBlock
                if (block.type === 'file-upload' || block.type === 'assets') {
                    return <AssetBlock key={key} content={block.data as any} brand={brand} />
                }

                switch (block.type) {
                    case 'hero':
                        return <BlockHero key={key} data={block.data as any} brand={brand} />

                    case 'text':
                        return <BlockText key={key} data={block.data as any} />

                    case 'color-grid':
                        return <BlockColorGrid key={key} data={block.data as any} />

                    case 'typography-showcase':
                        return <BlockTypographyShowcase key={key} data={block.data as any} />

                    case 'asset-grid':
                        return <BlockAssetGrid key={key} data={block.data as any} brand={brand} />

                    case 'logo-showcase':
                        return <BlockLogoShowcase key={key} data={block.data as any} />

                    case 'do-dont':
                        return <BlockDoDont key={key} data={block.data as any} />

                    case 'value-grid':
                        return <BlockValueGrid key={key} data={block.data as any} brand={brand} />

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
