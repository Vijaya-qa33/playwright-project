
import { test, expect } from '@playwright/test';

import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { testData } from '../utils/temp';

test('Verify user can add iPhone 16 to Amazon cart', async ({ page }) => {

    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    // Step 1: Open Amazon
    await homePage.goto();

    // Step 2: Enter iPhone 16
    await homePage.enterProduct(testData.productName);

    // Step 3: Click Search
    await homePage.clickSearch();

    // Step 4: Verify search results
    await expect(homePage.searchResults.first()).toBeVisible();

    // Step 5: Click Add to Cart directly
    await cartPage.addProductToCart();

});
