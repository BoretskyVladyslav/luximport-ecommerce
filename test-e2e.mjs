import { createClient } from 'next-sanity'
import crypto from 'crypto'

const sanityClient = createClient({
    projectId: '70cr4se4',
    dataset: 'production',
    apiVersion: '2024-02-17',
    token: 'skMPXynKj9BPipFIWJ7V6E2jqDfmeSfWF2XtJtSTZFoAiPb1KWKZjdkgHTbAcrLxGxZiKLCDf134aRYHac4Fsy2jr1cqYc44oWGKy5icnCpKP3Boquxw3UUyBstjfUviXqjyKgwH1y4YoLjxhWrVXdgouwKY31yPzbpiQKlSmchZIxKJhkpq',
    useCdn: false,
})

async function runTest() {
    console.log("1. Fetching a product to buy...")
    const products = await sanityClient.fetch(`*[_type == "product" && defined(price)][0]`)
    if (!products) {
        console.error("No products found!")
        return
    }
    console.log(`Found product: ${products.title} (ID: ${products._id}, Stock: ${products.stock || 'undefined'})`)

    const initialStock = products.stock || 0

    console.log("2. Creating pending order...")
    const createRes = await fetch('http://localhost:3000/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderId: "#TEST1234",
            customerName: "Test User",
            customerEmail: "workspacetechdef@gmail.com",
            customerPhone: "+380991234567",
            shippingAddress: "Kyiv, Office 1",
            totalAmount: products.price,
            items: [{
                id: products._id,
                title: products.title,
                quantity: 1,
                price: products.price
            }]
        })
    })

    const orderData = await createRes.json()
    console.log("Order Creation Response:", orderData)
    const orderId = orderData.sanityDocumentId

    console.log("3. Simulating WayForPay Webhook...")
    const secretKey = 'flk3409refn54t54t*FNJRET'
    const merchantAccount = 'test_merch_n1'
    const orderReference = orderId
    const amount = products.price
    const currency = 'UAH'
    const authCode = '123456'
    const cardPan = '4149********1234'
    const transactionStatus = 'Approved'
    const reasonCode = 1100

    const signatureString = [
        merchantAccount,
        orderReference,
        amount,
        currency,
        authCode,
        cardPan,
        transactionStatus,
        reasonCode
    ].join(';')

    const merchantSignature = crypto.createHmac('md5', secretKey).update(signatureString).digest('hex')

    const webhookPayload = {
        merchantAccount,
        orderReference,
        amount,
        currency,
        authCode,
        cardPan,
        transactionStatus,
        reasonCode,
        merchantSignature
    }

    const webhookRes = await fetch('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
    })

    console.log("Webhook Response:", await webhookRes.text())

    console.log("4. Verifying Sanity Updates...")
    // wait a moment for sanity to propagate
    await new Promise(r => setTimeout(r, 2000))

    const updatedOrder = await sanityClient.getDocument(orderId)
    console.log(`Order Status: ${updatedOrder.status}`)

    const updatedProduct = await sanityClient.getDocument(products._id)
    console.log(`Previous Stock: ${initialStock}, New Stock: ${updatedProduct.stock}`)

    if (updatedOrder.status === 'paid' && updatedProduct.stock === initialStock - 1) {
        console.log("TEST SUCCESSFUL! ✅")
    } else {
        console.error("TEST FAILED ❌")
    }
}

runTest()
