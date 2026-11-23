
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Amazon - Product Search Module', () => {

    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goto();
    });

    test('TC_SRCH_001 - Verify user can search for a valid product', async ({ page }) => {

        await homePage.enterProduct('iPhone 16');
        await homePage.clickSearch();

        await expect(page.locator('[data-component-type="s-search-result"]').first())
            .toBeVisible();
    });

    test('TC_SRCH_002 - Verify search with another product name', async ({ page }) => {

        await homePage.enterProduct('Samsung Galaxy S25');
        await homePage.clickSearch();

        await expect(page.locator('[data-component-type="s-search-result"]').first())
            .toBeVisible();
    });
    test('TC_SRCH_003 - Verify search with a partial product name', async ({ page }) => {

        await homePage.enterProduct('iPhone');
        await homePage.clickSearch();

        await expect(page.locator('[data-component-type="s-search-result"]').first())
            .toBeVisible();
    });

    test('TC_SRCH_004 - Verify search with an invalid product name', async ({ page }) => {

        await homePage.enterProduct('xyzproduct987654321');
        await homePage.clickSearch();

        await expect(page.locator('[data-component-type="s-search-result"]'))
            .toHaveCount(0);
    });
    test('TC_SRCH_005 - Verify search with empty input', async ({ page }) => {

        await homePage.enterProduct('');
        await homePage.clickSearch();

        await expect(page).toHaveURL(/amazon\.in/);
    });

    test('TC_SRCH_006 - Verify search using special characters', async ({ page }) => {

        await homePage.enterProduct('@#$%^&*');
        await homePage.clickSearch();

        await expect(page).toHaveURL(/s\?/);
    });

});
