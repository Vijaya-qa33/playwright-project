
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';

test('Verify product quantity can be increased and decreased', async ({ page }) => {

    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);
    await homePage.goto();
    await homePage.enterProduct('iPhone 16');
    await homePage.clickSearch();
    await cartPage.addProductToCart();
    await page.goto('https://www.amazon.in/gp/cart/view.html');
    const cartItem = page.locator('.sc-list-item[data-asin]').first();

    await expect(cartItem).toBeVisible();
    const quantityValue = cartItem.locator(
        'span[data-a-selector="value"]'
    );

    const increaseButton = cartItem.locator(
        'button[data-action="a-stepper-increment"]'
    );

    const decreaseButton = cartItem.locator(
        'button[data-action="a-stepper-decrement"]'
    );
    await expect(quantityValue).toHaveText('1');
    await increaseButton.click();
    await expect(quantityValue).toHaveText('2');
    await decreaseButton.click();
    await expect(quantityValue).toHaveText('1');

});
