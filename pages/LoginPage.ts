
import { Page, Locator } from '@playwright/test';

export class LoginPage {

    readonly page: Page;
    readonly emailField: Locator;
    readonly continueButton: Locator;

    constructor(page: Page) {

        this.page = page;

        this.emailField = page.locator(
            'input[type="email"], input[name="email"], input#ap_email'
        );

        this.continueButton = page.locator('#continue');
    }

    async goto() {

        await this.page.goto('https://www.amazon.in', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
    }

    async clickSignIn() {

        await this.page.locator('#nav-link-accountList').click();
    }

    async enterEmail(email: string) {

        await this.emailField.fill(email);
    }
}
