import PublicBrandApp from '@/components/PublicBrandApp'
export default async function Page({ params }) {
    const { host } = await params
    return <PublicBrandApp brandIdentifier={host} isCustomDomain view="guidelines" basePath="" />
}
