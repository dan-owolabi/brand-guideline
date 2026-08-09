import PublicBrandApp from '@/components/PublicBrandApp'
export default async function Page({ params }) {
    const { slug } = await params
    return <PublicBrandApp brandIdentifier={slug} view="assets" basePath="" />
}
