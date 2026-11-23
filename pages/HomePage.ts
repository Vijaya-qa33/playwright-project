
import { Page, Locator } from '@playwright/test';

export class HomePage {
    readonly page: Page;
    readonly searchBox: Locator;
    readonly searchButton: Locator;
    readonly searchResults: Locator;
    readonly continueShoppingButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.searchBox = page.locator('#twotabsearchtextbox');

        this.searchButton = page.locator(
            '#nav-search-submit-button'
        );

        this.searchResults = page.locator(
            '[data-component-type="s-search-result"]'
        );

        this.continueShoppingButton = page.locator(
            'input[type="submit"][value*="Continue shopping" i], ' +
            'button:has-text("Continue shopping"), ' +
            'a:has-text("Continue shopping")'
        ).first();
    }

    async goto() {
        await this.page.goto('https://www.amazon.in', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Handle Amazon Continue Shopping page
        const continueVisible = await this.continueShoppingButton
            .isVisible()
            .catch(() => false);

        if (continueVisible) {
            await this.continueShoppingButton.click();

            await this.searchBox.waitFor({
                state: 'visible',
                timeout: 60000
            });
        }

        // Wait for Amazon search box
        await this.searchBox.waitFor({
            state: 'visible',
            timeout: 60000
        });
    }

    async enterProduct(productName: string) {
        await this.searchBox.waitFor({
            state: 'visible',
            timeout: 30000
        });

        await this.searchBox.fill(productName);
    }

    async clickSearch() {
        await this.searchButton.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.searchButton.click();

        await this.searchResults.first().waitFor({
            state: 'visible',
            timeout: 30000
        });
    }

    async searchProduct(productName: string) {
        await this.goto();
        await this.enterProduct(productName);
        await this.clickSearch();
    }
}
