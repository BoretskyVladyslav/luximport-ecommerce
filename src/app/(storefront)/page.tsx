import { client } from '@/lib/sanity'
import { HomeClient } from './HomeClient'

export const revalidate = 60

const categories = [
  { name: 'КАВА ТА ЧАЙ', count: '24 ITEMS' },
  { name: 'СОЛОДОЩІ', count: '18 ITEMS' },
  { name: "М'ЯСО ТА СИРИ", count: '31 ITEMS' },
  { name: 'БАКАЛІЯ', count: '42 ITEMS' },
]

export default async function Home() {
  const products = await client.fetch(`*[_type == "product"][0...3]{
    _id,
    title,
    price,
    wholesalePrice,
    wholesaleMinQuantity,
    category,
    "slug": slug.current,
    image,
    stock
  }`)

  return (
    <HomeClient products={products} />
  )
}
