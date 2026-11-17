
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';

test('Verify product quantity can be increased and decreased', async ({ page }) => {

    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    // Step 1: Open Amazon
    await homePage.goto();

    // Step 2: Search for iPhone 16
    await homePage.enterProduct('iPhone 16');
    await homePage.clickSearch();

    // Step 3: Add product to cart
    await cartPage.addProductToCart();

    // Step 4: Open cart
    await page.goto('https://www.amazon.in/gp/cart/view.html');

    // Step 5: Locate first cart product
    const cartItem = page.locator('.sc-list-item[data-asin]').first();

    await expect(cartItem).toBeVisible();

    // Step 6: Locate quantity controls
    const quantityValue = cartItem.locator(
        'span[data-a-selector="value"]'
    );

    const increaseButton = cartItem.locator(
        'button[data-action="a-stepper-increment"]'
    );

    const decreaseButton = cartItem.locator(
        'button[data-action="a-stepper-decrement"]'
    );

    // Step 7: Verify initial quantity is 1
    await expect(quantityValue).toHaveText('1');

    // Step 8: Increase quantity to 2
    await increaseButton.click();

    // Step 9: Verify quantity is 2
    await expect(quantityValue).toHaveText('2');

    // Step 10: Decrease quantity to 1
    await decreaseButton.click();

    // Step 11: Verify quantity is 1
    await expect(quantityValue).toHaveText('1');

});
