
import { Page, Locator } from '@playwright/test';

export class CartPage {

    readonly page: Page;
    readonly firstProduct: Locator;
    readonly addToCartButton: Locator;

    constructor(page: Page) {

        this.page = page;
        this.firstProduct = page
            .locator('[data-component-type="s-search-result"]')
            .first();
        this.addToCartButton = this.firstProduct.locator(
            'button:has-text("Add to cart"), ' +
            'input[name="submit.addToCart"], ' +
            'input[value="Add to Cart"]'
        );
    }
    async addProductToCart() {

        await this.addToCartButton.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.addToCartButton.scrollIntoViewIfNeeded();

        await this.addToCartButton.click();
    }
}
