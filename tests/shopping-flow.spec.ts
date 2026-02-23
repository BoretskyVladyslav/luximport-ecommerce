import { test, expect } from '@playwright/test';

test('Critical user journey: Catalog to Checkout', async ({ page }) => {
    // Populate the authentication store to bypass the login redirect
    await page.addInitScript(() => {
        window.localStorage.setItem('auth-storage', JSON.stringify({
            state: {
                user: { id: '1', name: 'Test User', email: 'test@example.com' },
                isAuthenticated: true
            },
            version: 0
        }));
    });

    // 1. Go to the Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Luximport/i);

    // 2. Navigate to Catalog
    await page.click('text=Каталог');
    await expect(page).toHaveURL(/.*\/catalog/);

    // 3 & 4. Click the "ДОДАТИ" (Add to Cart) button on the first product card
    // Wait for product cards to load in the DOM
    await page.waitForSelector('button:has-text("ДОДАТИ")');
    await page.locator('button:has-text("ДОДАТИ")').first().click();

    // 5. Verify that the Cart UI opens and item is added
    // The cart sidebar should fly out causing the overlay or the sidebar title to be visible
    await expect(page.locator('span:has-text("Кошик")')).toBeVisible();

    // Ensure an item appears in the cart (by checking that the item price/title div exists within the cart)
    // Our cart has .item elements when populated
    await expect(page.locator('div[class*="cart-sidebar_item__"]')).toHaveCount(1, { timeout: 10000 });

    // 6. Click "Оформити замовлення" (Checkout)
    await page.click('button:has-text("ОФОРМИТИ ЗАМОВЛЕННЯ")');

    // 7. Verify we reached the checkout page
    await expect(page).toHaveURL(/.*\/checkout/);
    await expect(page.locator('h1', { hasText: 'ОФОРМЛЕННЯ ЗАМОВЛЕННЯ' })).toBeVisible({ timeout: 10000 });
});
