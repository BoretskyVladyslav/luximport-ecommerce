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
        title: 'Кава в зернах Lavazza Qualita Oro 1кг',
        slug: { _type: 'slug', current: 'kava-v-zernah-lavazza-qualita-oro-1kg' },
        price: 19.99,
        wholesalePrice: 14.50,
        wholesaleMinQuantity: 12,
        category: 'КАВА ТА ЧАЙ',
        origin: 'Італія',
        description: 'Lavazza Qualita Oro - це добірна, надзвичайно солодка 100% арабіка. Інтенсивний, ароматний купаж для справжніх поціновувачів кави.',
        stock: 200
    },
    {
        _type: 'product',
        title: 'Кава в зернах Lavazza Espresso Italiano Classico 1кг',
        slug: { _type: 'slug', current: 'kava-v-zernah-lavazza-espresso-italiano-classico-1kg' },
        price: 18.50,
        wholesalePrice: 13.00,
        wholesaleMinQuantity: 10,
        category: 'КАВА ТА ЧАЙ',
        origin: 'Італія',
        description: '100% спеціально відібрана арабіка створює темний, інтенсивно ароматний смак, роблячи її ідеальною кавою еспресо для насолоди в будь-який час доби.',
        stock: 150
    },
    {
        _type: 'product',
        title: 'Кава мелена Illy Classico Espresso 250г',
        slug: { _type: 'slug', current: 'kava-melena-illy-classico-espresso-250g' },
        price: 12.00,
        wholesalePrice: 8.50,
        wholesaleMinQuantity: 24,
        category: 'КАВА ТА ЧАЙ',
        origin: 'Італія',
        description: 'Мелена кава еспресо Illy Classico дрібного помелу забезпечує оптимальну екстракцію в еспресо-машинах, що працюють з меленою кавою.',
        stock: 80
    },
    {
        _type: 'product',
        title: 'Сироп ванільний Monin Vanilla 1л',
        slug: { _type: 'slug', current: 'syrop-vanilnyy-monin-vanilla-1l' },
        price: 10.99,
        wholesalePrice: 7.50,
        wholesaleMinQuantity: 6,
        category: 'БАКАЛІЯ',
        origin: 'Франція',
        description: 'Отриманий зі справжніх стручків мадагаскарської ванілі, цей чистий екстракт надає виняткового смаку каві, смузі та коктейлям.',
        stock: 100
    },
    {
        _type: 'product',
        title: 'Сироп карамельний Monin Caramel 1л',
        slug: { _type: 'slug', current: 'syrop-karamelnyy-monin-caramel-1l' },
        price: 10.99,
        wholesalePrice: 7.50,
        wholesaleMinQuantity: 6,
        category: 'БАКАЛІЯ',
        origin: 'Франція',
        description: 'Багата, солодка та масляниста карамель. Ідеально підходить для кави, лате, фраппе та десертів.',
        stock: 110
    },
    {
        _type: 'product',
        title: 'Чай Twinings Earl Grey 100 пакетиків',
        slug: { _type: 'slug', current: 'chay-twinings-earl-grey-100-paketykiv' },
        price: 8.50,
        wholesalePrice: 5.50,
        wholesaleMinQuantity: 20,
        category: 'КАВА ТА ЧАЙ',
        origin: 'Великобританія',
        description: 'Легкий чай блідо-золотистого кольору з ніжним смаком цитрусового бергамоту.',
        stock: 300
    },
    {
        _type: 'product',
        title: 'Чай матча зелений Premium Grade 100г',
        slug: { _type: 'slug', current: 'chay-matcha-zelenyy-premium-grade-100g' },
        price: 24.00,
        wholesalePrice: 16.00,
        wholesaleMinQuantity: 10,
        category: 'КАВА ТА ЧАЙ',
        origin: 'Японія',
        description: 'Справжній японський зелений чай матча в порошку, ідеальний для вживання як напій, випічки, лате та смузі.',
        stock: 50
    },
    {
        _type: 'product',
        title: 'Чорний шоколад Lindt Excellence 70% 100г',
        slug: { _type: 'slug', current: 'chornyy-shokolad-lindt-excellence-70-100g' },
        price: 3.50,
        wholesalePrice: 2.20,
        wholesaleMinQuantity: 50,
        category: 'СОЛОДОЩІ',
        origin: 'Швейцарія',
        description: 'Насичений чорний шоколад, майстерно збалансований, щоб не бути надто гірким і не домінувати над смаком.',
        stock: 500
    },
    {
        _type: 'product',
        title: 'Цукерки Ferrero Rocher з лісовим горіхом 24шт',
        slug: { _type: 'slug', current: 'tsukerky-ferrero-rocher-z-lisovym-horihom-24sht' },
        price: 15.00,
        wholesalePrice: 10.50,
        wholesaleMinQuantity: 15,
        category: 'СОЛОДОЩІ',
        origin: 'Італія',
        description: 'Спокусливе поєднання соковитої, кремової шоколадної начинки з цілим лісовим горіхом в ніжній хрусткій вафлі.',
        stock: 200
    },
    {
        _type: 'product',
        title: 'Бельгійські шоколадні черепашки Guylian 250г',
        slug: { _type: 'slug', current: 'belhiyski-shokoladni-cherepashky-guylian-250g' },
        price: 11.50,
        wholesalePrice: 8.00,
        wholesaleMinQuantity: 20,
        category: 'СОЛОДОЩІ',
        origin: 'Бельгія',
        description: 'Вишукані бельгійські шоколадні черепашки з мармурового шоколаду з фірмовим праліне зі смаженого лісового горіха.',
        stock: 120
    }
]

async function seedData() {
    console.log('Starting to seed live data...')
    try {
        for (const product of products) {
            console.log(`Creating live product: ${product.title}`)
            await client.create(product)
        }
        console.log('Successfully seeded all live products!')
    } catch (err) {
        console.error('Failed to seed products:', err)
    }
}

seedData()
