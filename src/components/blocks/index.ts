'use client'

import HeadingBlock from './HeadingBlock'
import ParagraphBlock from './ParagraphBlock'
import ImageBlock from './ImageBlock'
import DividerBlock from './DividerBlock'
import CalloutBlock from './CalloutBlock'
import LinkBlock from './LinkBlock'
import VideoBlock from './VideoBlock'
import ListBlock from './ListBlock'
import EmbedBlock from './EmbedBlock'
import TableBlock from './TableBlock'
import ImageGridBlock from './ImageGridBlock'
import TextBlock from './TextBlock'
import AssetBlock from './AssetBlock'


export {
    HeadingBlock,
    ParagraphBlock,
    ImageBlock,
    DividerBlock,
    CalloutBlock,
    LinkBlock,
    VideoBlock,
    ListBlock,
    EmbedBlock,
    TableBlock,
    ImageGridBlock,
    TextBlock,
    AssetBlock,
}

export interface BlockType {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType<any>
    label: string
    icon: string
}

export const BLOCK_TYPES: Record<string, BlockType> = {
    // Text blocks
    text: { component: TextBlock, label: 'Text', icon: 'T' },
    heading: { component: HeadingBlock, label: 'Heading', icon: 'H' },
    paragraph: { component: ParagraphBlock, label: 'Paragraph', icon: '¶' },
    // List blocks
    list: { component: ListBlock, label: 'List', icon: '•' },
    bulletList: { component: ListBlock, label: 'Bulleted List', icon: '•' },
    numberedList: { component: ListBlock, label: 'Numbered List', icon: '1.' },
    // Media blocks
    image: { component: ImageBlock, label: 'Image', icon: '🖼' },
    imageGrid: { component: ImageGridBlock, label: 'Image Grid', icon: '🖼' },
    video: { component: VideoBlock, label: 'Video', icon: '🎥' },
    embed: { component: EmbedBlock, label: 'Embed', icon: '</>' },
    // Layout blocks
    divider: { component: DividerBlock, label: 'Divider', icon: '—' },
    callout: { component: CalloutBlock, label: 'Callout', icon: '!' },
    link: { component: LinkBlock, label: 'Link', icon: '🔗' },
    table: { component: TableBlock, label: 'Table', icon: '▦' },
}

export function getBlockComponent(type: string) {
    return BLOCK_TYPES[type]?.component || ParagraphBlock
}

