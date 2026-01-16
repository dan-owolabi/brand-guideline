/**
 * Default sections for a new brand guideline.
 * Based on Trustpilot brand guidelines structure.
 */

export function createDefaultSections() {
    return [
        // Introduction
        {
            id: crypto.randomUUID(),
            slug: 'introduction',
            title: 'Introduction',
            group: '',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: '', variant: 'paragraph' }
                }
            ]
        },

        // Writing
        {
            id: crypto.randomUUID(),
            slug: 'tone-of-voice',
            title: 'Tone of voice',
            group: 'Writing',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'Define how your brand speaks to the world.', variant: 'paragraph' }
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            slug: 'writing-guide',
            title: 'Writing guide',
            group: 'Writing',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'Guidelines for creating consistent written content.', variant: 'paragraph' }
                }
            ]
        },

        // Design
        {
            id: crypto.randomUUID(),
            slug: 'logos',
            title: 'Logos',
            group: 'Design',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'Our logo is the most recognizable element of our brand.', variant: 'paragraph' }
                }
            ],
            subsections: [
                {
                    id: crypto.randomUUID(),
                    title: 'Our logo',
                    blocks: [
                        { id: crypto.randomUUID(), type: 'text', content: { text: 'Primary Logo', variant: 'heading2' } },
                        { id: crypto.randomUUID(), type: 'text', content: { text: 'Use this logo in most applications.', variant: 'paragraph' } }
                    ]
                },
                {
                    id: crypto.randomUUID(),
                    title: 'Logo positioning',
                    blocks: [
                        { id: crypto.randomUUID(), type: 'text', content: { text: 'Clearspace', variant: 'heading2' } },
                        { id: crypto.randomUUID(), type: 'text', content: { text: 'Always maintain clear space around the logo.', variant: 'paragraph' } }
                    ]
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            slug: 'colors',
            title: 'Colors',
            group: 'Design',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'Our color palette defines our visual identity.', variant: 'paragraph' }
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            slug: 'typography',
            title: 'Typography',
            group: 'Design',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'Typography is a key part of our visual language.', variant: 'paragraph' }
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            slug: 'photography',
            title: 'Photography',
            group: 'Design',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'Guidelines for selecting and using photography.', variant: 'paragraph' }
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            slug: 'layouts',
            title: 'Layouts',
            group: 'Design',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'How we structure content across different formats.', variant: 'paragraph' }
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            slug: 'illustration',
            title: 'Illustration',
            group: 'Design',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'Our illustration style and guidelines.', variant: 'paragraph' }
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            slug: 'icons',
            title: 'Icons',
            group: 'Design',
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: 'Our icon library and usage guidelines.', variant: 'paragraph' }
                }
            ]
        }
    ]
}

export function getDefaultDraft() {
    return {
        tokens: {
            primaryColor: '#0066FF',
            fontFamily: 'Geist'
        },
        sections: createDefaultSections()
    }
}
