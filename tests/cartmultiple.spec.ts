
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

    for (const product of products) {
        await homePage.goto();
        await homePage.enterProduct(product);
        await homePage.clickSearch();
        await cartPage.addProductToCart();
    }

    await expect(page.locator('#nav-cart-count')).toHaveText('3');
    await page.locator('#nav-cart').click();
    await expect(page).toHaveURL(/cart/);
    const cartItems = page.locator('.sc-list-item[data-asin]');
    await expect(cartItems).toHaveCount(3);
    const firstProduct = cartItems.first();
    await firstProduct.locator(
        'button:has-text("Delete"), input[value="Delete"]'
    ).click();
    await expect(cartItems).toHaveCount(2);

});
