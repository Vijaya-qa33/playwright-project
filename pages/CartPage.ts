
import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
    readonly page: Page;
    readonly productCards: Locator;
    readonly cartCount: Locator;
    readonly activeCart: Locator;
    readonly cartItems: Locator;
    readonly deleteButtons: Locator;

    constructor(page: Page) {
        this.page = page;

        this.productCards = page.locator(
            '[data-component-type="s-search-result"]'
        );

        this.cartCount = page.locator('#nav-cart-count');

        this.activeCart = page.locator('#sc-active-cart');

        this.cartItems = page.locator(
            '#sc-active-cart .sc-list-item[data-asin]'
        );

        this.deleteButtons = page.locator(
            '#sc-active-cart input[data-action="delete-active"]'
        );
    }

    // Get cart count
    async getCartCount(): Promise<number> {
        const text = await this.cartCount.textContent().catch(() => '');

        return Number((text || '').trim()) || 0;
    }

    // Add first non-sponsored search result to cart
    async addProductToCart() {
        const productCard = this.productCards
            .filter({
                has: this.page.locator('a[href*="/dp/"]')
            })
            .filter({
                hasNotText: 'Sponsored'
            })
            .first();

        const productLink = productCard.locator(
            'a[href*="/dp/"]'
        ).first();

        await productLink.waitFor({
            state: 'visible',
            timeout: 30000
        });

        const href = await productLink.getAttribute('href');

        if (!href) {
            throw new Error(
                'Product URL was not found in search results'
            );
        }

        const productUrl = new URL(
            href,
            this.page.url()
        ).toString();

        // Open product details page
        await this.page.goto(productUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Locate Add to Cart button
        const addButton = this.page.locator(
            '#add-to-cart-button'
        ).last();

        await addButton.waitFor({
            state: 'visible',
            timeout: 30000
        });

        await expect(addButton).toBeEnabled();

        // Click Add to Cart
        await addButton.click();

        // Verify Amazon confirmation
        const addedMessage = this.page.getByText(
            'Added to cart',
            { exact: true }
        ).first();

        await expect(addedMessage).toBeVisible({
            timeout: 30000
        });

        // Click Cart button in Amazon confirmation panel
        const goToCartButton = this.page.locator(
            '#sw-gtc, #attach-sidesheet-view-cart-button'
        ).first();

        await goToCartButton.waitFor({
            state: 'visible',
            timeout: 20000
        });

        await goToCartButton.click();

        // Wait for cart page
        await this.page.locator(
            '#sc-active-cart, #sc-empty-cart'
        ).first().waitFor({
            state: 'visible',
            timeout: 30000
        });

        // Verify at least one cart item
        await expect(this.cartItems.first()).toBeVisible({
            timeout: 20000
        });
    }

    // Open cart page
    async openCart() {
        await this.page.goto(
            'https://www.amazon.in/gp/cart/view.html',
            {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            }
        );

        await this.page.locator(
            '#sc-active-cart, #sc-empty-cart'
        ).first().waitFor({
            state: 'visible',
            timeout: 30000
        });
    }

    // Get product names
    async getProductNames(): Promise<string[]> {
        return await this.cartItems.locator(
            'a.sc-product-title'
        ).allTextContents();
    }

    // Get a particular cart item
    getCartItem(productName: string): Locator {
        return this.cartItems.filter({
            hasText: productName
        });
    }

    // Get quantity
    getQuantity(item: Locator): Locator {
        return item.locator(
            'span[data-a-selector="value"]'
        );
    }

    // Get item price
    getItemPrice(item: Locator): Locator {
        return item.locator(
            '.a-price .a-offscreen'
        ).first();
    }

    // Get subtotal
    getSubtotal(): Locator {
        return this.page.locator(
            '#sc-subtotal-amount-buybox .sc-price, ' +
            '#sc-subtotal-amount-activecart .sc-price'
        ).first();
    }

    // Change quantity
    async setQuantity(item: Locator, quantity: number) {
        const dropdown = item.locator(
            'select[name="quantity"]'
        );

        if (await dropdown.count()) {
            await dropdown.selectOption(String(quantity));

            await expect(dropdown).toHaveValue(
                String(quantity)
            );
        } else {
            const quantityLocator = this.getQuantity(item);

            const increment = item.locator(
                'button[data-action="a-stepper-increment"]'
            );

            const decrement = item.locator(
                'button[data-action="a-stepper-decrement"]'
            );

            let current = Number(
                (await quantityLocator.textContent())?.trim() || 1
            );

            while (current < quantity) {
                await increment.click();

                current = Number(
                    (await quantityLocator.textContent())?.trim() || 1
                );
            }

            while (current > quantity) {
                await decrement.click();

                current = Number(
                    (await quantityLocator.textContent())?.trim() || 1
                );
            }
        }
    }

    // Remove product
    async removeProduct(item: Locator) {
        await item.locator(
            'input[data-action="delete-active"]'
        ).click();

        await expect(item).toBeHidden({
            timeout: 20000
        });
    }

    // Verify empty cart
    async verifyEmptyCart() {
        await expect(
            this.page.locator('#sc-empty-cart')
        ).toBeVisible({
            timeout: 20000
        });
    }

    // Read price
    async readPrice(locator: Locator): Promise<number> {
        const text = await locator.textContent();

        return Number(
            (text || '').replace(/[^\d.]/g, '')
        );
    }
}
