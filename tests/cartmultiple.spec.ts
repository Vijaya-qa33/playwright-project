
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';

test('Verify adding three products and removing one from cart', async ({ page }) => {

    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    const products = [
        'iPhone 16',
        'Samsung Galaxy S25',
        'OnePlus 13'
    ];

    // Add three products to cart
    for (const product of products) {

        // Open Amazon homepage
        await homePage.goto();

        // Search for product
        await homePage.enterProduct(product);
        await homePage.clickSearch();

        // Add first search result to cart
        await cartPage.addProductToCart();
    }

    // Verify cart count is 3
    await expect(page.locator('#nav-cart-count')).toHaveText('3');

    // Open cart
    await page.locator('#nav-cart').click();

    // Verify cart page is displayed
    await expect(page).toHaveURL(/cart/);

    // Identify cart products
    const cartItems = page.locator('.sc-list-item[data-asin]');

    // Verify all three products are present
    await expect(cartItems).toHaveCount(3);

    // Select first product
    const firstProduct = cartItems.first();

    // Remove first product from cart
    await firstProduct.locator(
        'button:has-text("Delete"), input[value="Delete"]'
    ).click();

    // Verify only two products remain
    await expect(cartItems).toHaveCount(2);

});
