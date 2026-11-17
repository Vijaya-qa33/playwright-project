
import { test, expect } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';

import { testData } from '../utils/temp';

test('Verify user can enter email on Amazon Sign In page', async ({ page }) => {

    const loginPage = new LoginPage(page);

    // Open Amazon Homepage
    await loginPage.goto();

    // Click Account & Lists
    await loginPage.clickSignIn();

    // Verify Email Field
    await expect(loginPage.emailField).toBeVisible({
        timeout: 15000
    });

    // Enter Email
    await loginPage.enterEmail(testData.email);

    // Verify Email
    await expect(loginPage.emailField).toHaveValue(testData.email);

});
