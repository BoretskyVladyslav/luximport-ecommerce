import { client } from '@/lib/sanity'
import { PRODUCTS_HOME_TEASER_QUERY, type HomeTeaserProduct } from '@/lib/sanity-queries'
import { HomeClient } from './HomeClient'
import styles from './page.module.scss'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
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

  return (
    <div className={styles.pageRouteRoot}>
      <HomeClient products={products} />
    </div>
  )
}
