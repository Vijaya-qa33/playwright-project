
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { testData } from '../utils/temp';

test('Verify iPhone 16 is added to cart', async ({ page }) => {

    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);
    await homePage.goto();
    await homePage.enterProduct(testData.productName);
    await homePage.clickSearch();
    await cartPage.addProductToCart();
    await expect(page.locator('#nav-cart-count')).toHaveText('1');
    await page.locator('#nav-cart').click();
    await expect(page).toHaveURL(/cart/);
    await expect(page.getByText(/iPhone 16/i).first()).toBeVisible();

});
