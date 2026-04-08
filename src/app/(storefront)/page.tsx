import { Suspense } from 'react'
import { client } from '@/lib/sanity'
import { PRODUCTS_HOME_TEASER_QUERY, type HomeTeaserProduct } from '@/lib/sanity-queries'
import { HomeBestSellersSkeleton } from '@/components/ui/skeletons'
import { HomePageFrame, HomeBestSellers } from './HomeClient'
import styles from './page.module.scss'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function HomeBestSellersLoader() {
    let products: HomeTeaserProduct[] = []
    try {
        products = await client.fetch<HomeTeaserProduct[]>(
            PRODUCTS_HOME_TEASER_QUERY,
            {},
            { cache: 'no-store' }
        )
    } catch (e) {
        console.error('Home: failed to fetch products', e)
    }
    return <HomeBestSellers products={products} />
}

export default function Home() {
    return (
        <div className={styles.pageRouteRoot}>
            <HomePageFrame>
                <Suspense fallback={<HomeBestSellersSkeleton count={4} />}>
                    <HomeBestSellersLoader />
                </Suspense>
            </HomePageFrame>
        </div>
    )
}
