import HeadingBlock from './HeadingBlock'
import ParagraphBlock from './ParagraphBlock'
import ImageBlock from './ImageBlock'
import ImageGridBlock from './ImageGridBlock'
import TableBlock from './TableBlock'
import CalloutBlock from './CalloutBlock'
import DividerBlock from './DividerBlock'
import LinkBlock from './LinkBlock'
import TextBlock from './TextBlock'
import VideoBlock from './VideoBlock'
import EmbedBlock from './EmbedBlock'
import ListBlock from './ListBlock'
import AssetBlock from './AssetBlock'

export {
    HeadingBlock,
    ParagraphBlock,
    ImageBlock,
    ImageGridBlock,
    TableBlock,
    CalloutBlock,
    DividerBlock,
    LinkBlock,
    TextBlock,
    VideoBlock,
    EmbedBlock,
    ListBlock,
    AssetBlock
}

export const BLOCK_TYPES = {
    // Notion-like text block (recommended)
    text: { component: TextBlock, label: 'Text', icon: 'T' },
    // List blocks
    list: { component: ListBlock, label: 'List', icon: '•' },
    bulletList: { component: ListBlock, label: 'Bulleted List', icon: '•' },
    numberedList: { component: ListBlock, label: 'Numbered List', icon: '1.' },
    // Legacy blocks
    heading: { component: HeadingBlock, label: 'Heading', icon: 'H' },
    paragraph: { component: ParagraphBlock, label: 'Paragraph', icon: '¶' },
    image: { component: ImageBlock, label: 'Image', icon: '🖼' },
    imageGrid: { component: ImageGridBlock, label: 'Image Grid', icon: '⊞' },
    table: { component: TableBlock, label: 'Table', icon: '▦' },
    video: { component: VideoBlock, label: 'Video', icon: '🎥' },
    embed: { component: EmbedBlock, label: 'Embed', icon: '</>' },
    callout: { component: CalloutBlock, label: 'Callout', icon: '!' },
    divider: { component: DividerBlock, label: 'Divider', icon: '—' },
    link: { component: LinkBlock, label: 'Link', icon: '🔗' },
    asset: { component: AssetBlock, label: 'Assets', icon: '📦' }
}

export function getBlockComponent(type) {
    return BLOCK_TYPES[type]?.component || TextBlock
}

