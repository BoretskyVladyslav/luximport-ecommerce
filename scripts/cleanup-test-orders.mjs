import { createClient } from 'next-sanity'

const sanityClient = createClient({
    projectId: '70cr4se4',
    dataset: 'production',
    apiVersion: '2024-02-17',
    token: 'skMPXynKj9BPipFIWJ7V6E2jqDfmeSfWF2XtJtSTZFoAiPb1KWKZjdkgHTbAcrLxGxZiKLCDf134aRYHac4Fsy2jr1cqYc44oWGKy5icnCpKP3Boquxw3UUyBstjfUviXqjyKgwH1y4YoLjxhWrVXdgouwKY31yPzbpiQKlSmchZIxKJhkpq',
    useCdn: false,
})

async function cleanupTestOrders() {
    console.log("Searching for test orders...")
    try {
        const testOrders = await sanityClient.fetch(`*[_type == "order" && customerName match "Test User"]`)

        if (testOrders.length === 0) {
            console.log("No test orders found!")
            return
        }

        console.log(`Found ${testOrders.length} test order(s). Deleting...`)

        for (const order of testOrders) {
            console.log(`Deleting document ID: ${order._id}`)
            await sanityClient.delete(order._id)
        }

        console.log("Cleanup complete! ✅")
    } catch (error) {
        console.error("Error during cleanup:", error)
    }
}

cleanupTestOrders()
