
import { Page, Locator } from '@playwright/test';

export class CartPage {

    readonly page: Page;
    readonly firstProduct: Locator;
    readonly addToCartButton: Locator;

    constructor(page: Page) {

        this.page = page;

        // First product in search results
        this.firstProduct = page
            .locator('[data-component-type="s-search-result"]')
            .first();

        // Add to Cart button inside first product
        this.addToCartButton = this.firstProduct.locator(
            'button:has-text("Add to cart"), ' +
            'input[name="submit.addToCart"], ' +
            'input[value="Add to Cart"]'
        );
    }

    // Click Add to Cart directly from search results
    async addProductToCart() {

        await this.addToCartButton.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.addToCartButton.scrollIntoViewIfNeeded();

        await this.addToCartButton.click();
    }
}
