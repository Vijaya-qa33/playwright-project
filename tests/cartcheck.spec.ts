
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { testData } from '../utils/temp';

test('Verify iPhone 16 is added to cart', async ({ page }) => {

    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    // Open Amazon
    await homePage.goto();

    // Search for iPhone 16
    await homePage.enterProduct(testData.productName);
    await homePage.clickSearch();

    // Add first product to cart
    await cartPage.addProductToCart();

    // Verify cart count
    await expect(page.locator('#nav-cart-count')).toHaveText('1');

    // Open cart
    await page.locator('#nav-cart').click();

    // Verify cart page
    await expect(page).toHaveURL(/cart/);

    // Verify product is visible
    await expect(page.getByText(/iPhone 16/i).first()).toBeVisible();

});
