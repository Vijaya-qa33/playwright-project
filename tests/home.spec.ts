
import { test, expect } from '@playwright/test';

import { HomePage } from '../pages/HomePage';

import { testData } from '../utils/temp';

test('Verify user can search for iPhone on Amazon', async ({ page }) => {

    const homePage = new HomePage(page);

    // Open Amazon Homepage
    await homePage.goto();

    // Verify Search Box
    await expect(homePage.searchBox).toBeVisible();

    // Enter Product Name
    await homePage.enterProduct(testData.productName);

    // Verify Entered Product
    await expect(homePage.searchBox).toHaveValue('iPhone');

    // Click Search
    await homePage.clickSearch();

    // Verify Search Results URL
    await expect(page).toHaveURL(/\/s\?/);

    // Verify Products Are Displayed
    await expect(homePage.searchResults.first()).toBeVisible();

});
