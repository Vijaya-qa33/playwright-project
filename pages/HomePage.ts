
import { Page, Locator } from '@playwright/test';

export class HomePage {

    readonly page: Page;
    readonly searchBox: Locator;
    readonly searchButton: Locator;
    readonly searchResults: Locator;

    constructor(page: Page) {

        this.page = page;

        this.searchBox = page.locator('#twotabsearchtextbox');

        this.searchButton = page.locator('#nav-search-submit-button');

        this.searchResults = page.locator('[data-component-type="s-search-result"]');
    }

    // Open Amazon Homepage
    async goto() {

        await this.page.goto('https://www.amazon.in', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
    }

    // Enter Product Name
    async enterProduct(productName: string) {

        await this.searchBox.fill(productName);
    }

    // Click Search Button
    async clickSearch() {

        await this.searchButton.click();
    }
}
