import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
    console.error("Missing required environment variables for Sanity.")
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    useCdn: false,
    token,
    apiVersion: '2024-02-17'
})

const products = [
    {
        _type: 'product',
        title: 'Ethiopian Yirgacheffe Coffee',
        slug: { _type: 'slug', current: 'ethiopian-yirgacheffe-coffee' },
        price: 24.99,
        wholesalePrice: 15.00,
        wholesaleMinQuantity: 10,
        category: 'Coffee',
        origin: 'Ethiopia',
        stock: 50
    },
    {
        _type: 'product',
        title: 'Colombian Supremo Beans',
        slug: { _type: 'slug', current: 'colombian-supremo-beans' },
        price: 19.99,
        wholesalePrice: 12.00,
        wholesaleMinQuantity: 15,
        category: 'Coffee',
        origin: 'Colombia',
        stock: 100
    },
    {
        _type: 'product',
        title: 'Swiss Dark Chocolate Truffles',
        slug: { _type: 'slug', current: 'swiss-dark-chocolate-truffles' },
        price: 34.50,
        wholesalePrice: 22.00,
        wholesaleMinQuantity: 20,
        category: 'Chocolates',
        origin: 'Switzerland',
        stock: 200
    },
    {
        _type: 'product',
        title: 'Belgian Milk Chocolate Pralines',
        slug: { _type: 'slug', current: 'belgian-milk-chocolate-pralines' },
        price: 29.99,
        wholesalePrice: 18.00,
        wholesaleMinQuantity: 10,
        category: 'Chocolates',
        origin: 'Belgium',
        stock: 150
    },
    {
        _type: 'product',
        title: 'Matcha Green Tea Powder Premium',
        slug: { _type: 'slug', current: 'matcha-green-tea-powder-premium' },
        price: 45.00,
        wholesalePrice: 28.00,
        wholesaleMinQuantity: 5,
        category: 'Tea',
        origin: 'Japan',
        stock: 75
    },
    {
        _type: 'product',
        title: 'Darjeeling First Flush Black Tea',
        slug: { _type: 'slug', current: 'darjeeling-first-flush-black-tea' },
        price: 38.00,
        wholesalePrice: 24.00,
        wholesaleMinQuantity: 10,
        category: 'Tea',
        origin: 'India',
        stock: 60
    },
    {
        _type: 'product',
        title: 'Italian Espresso Roast',
        slug: { _type: 'slug', current: 'italian-espresso-roast' },
        price: 22.99,
        wholesalePrice: 14.00,
        wholesaleMinQuantity: 20,
        category: 'Coffee',
        origin: 'Italy',
        stock: 120
    },
    {
        _type: 'product',
        title: 'French Lavender Macarons (12-pack)',
        slug: { _type: 'slug', current: 'french-lavender-macarons-12-pack' },
        price: 28.00,
        wholesalePrice: 17.50,
        wholesaleMinQuantity: 10,
        category: 'Sweets',
        origin: 'France',
        stock: 45
    }
]

async function seedData() {
    console.log('Starting to seed data...')
    try {
        for (const product of products) {
            console.log(`Creating product: ${product.title}`)
            await client.create(product)
        }
        console.log('Successfully seeded all products!')
    } catch (err) {
        console.error('Failed to seed products:', err)
    }
}

seedData()
