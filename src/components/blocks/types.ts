
export interface BlockContent {
    text?: string
    variant?: string
    [key: string]: any
}

export interface Block {
    id: string
    type: string
    content?: BlockContent // Legacy or specific usage
    data?: BlockContent // Preferred generic usage
    group?: string
    [key: string]: any
}
