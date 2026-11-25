
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
        const eligibleProducts = this.productCards
            .filter({
                has: this.page.locator('a[href*="/dp/"]')
            })
            .filter({
                hasNotText: 'Sponsored'
            });
        const productCard = eligibleProducts.first();

        const productLink = productCard.locator(
            'a[href*="/dp/"]:visible'
        ).first();

        await productLink.waitFor({
            state: 'visible',
            timeout: 30000
        });

        const href = await productLink.getAttribute('href');

        if (!href) {
            throw new Error('Product URL was not found in search results');
        }

        const asin = href.match(/\/dp\/([A-Z0-9]{10})(?:[/?#]|$)/i)?.[1];

        if (!asin) {
            throw new Error(`Product URL does not contain a valid ASIN: ${href}`);
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
            '#add-to-cart-button:visible'
        ).first();

        await addButton.waitFor({
            state: 'visible',
            timeout: 30000
        });

        await expect(addButton).toBeEnabled();

        const previousCartCount = await this.getCartCount();

        // Click Add to Cart
        await addButton.click();

        // Verify Amazon confirmation message
        const addedMessage = this.page.getByText(
            'Added to cart',
            { exact: true }
        ).filter({
            visible: true
        }).first();

        await expect(addedMessage).toBeVisible({
            timeout: 30000
        });

        await this.openCart();

        // Verify product is actually added
        await expect(this.cartItems.first()).toBeVisible({
            timeout: 20000
        });

        await expect(
            this.page.locator(
                `#sc-active-cart .sc-list-item[data-asin="${asin}"]`
            )
        ).toBeVisible({
            timeout: 20000
        });

        await expect(this.cartCount).toHaveText(
            String(previousCartCount + 1)
        );
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
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error('Quantity must be a positive integer');
        }

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

            await expect(quantityLocator).toHaveText(String(quantity));
        }
    }

    // Increase quantity
    async increaseQuantity(item: Locator) {
        const quantityLocator = this.getQuantity(item);

        const current = Number(
            (await quantityLocator.textContent())?.trim() || 1
        );

        await item.locator(
            'button[data-action="a-stepper-increment"]'
        ).click();

        await expect(quantityLocator).toHaveText(
            String(current + 1)
        );
    }

    // Decrease quantity
    async decreaseQuantity(item: Locator) {
        const quantityLocator = this.getQuantity(item);

        const current = Number(
            (await quantityLocator.textContent())?.trim() || 1
        );

        if (current <= 1) {
            throw new Error('Quantity cannot be decreased below 1');
        }

        await item.locator(
            'button[data-action="a-stepper-decrement"]'
        ).click();

        await expect(quantityLocator).toHaveText(
            String(current - 1)
        );
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

    // Verify product in cart
    async verifyProductInCart(productName: string) {
        await expect(
            this.getCartItem(productName).first()
        ).toBeVisible({
            timeout: 20000
        });
    }

    // Verify cart count
    async verifyCartCount(expectedCount: number) {
        await expect(this.cartCount).toHaveText(
            String(expectedCount)
        );
    }

    // Verify product price
    async verifyProductPrice(item: Locator) {
        await expect(this.getItemPrice(item)).toBeVisible();
    }

    // Verify subtotal
    async verifySubtotal() {
        await expect(this.getSubtotal()).toBeVisible();
    }

    // Verify multiple products
    async verifyMultipleProducts(expectedCount: number) {
        await expect(this.cartItems).toHaveCount(expectedCount);
    }

    // Read price
    async readPrice(locator: Locator): Promise<number> {
        const text = await locator.textContent();

        return Number(
            (text || '').replace(/[^\d.]/g, '')
        );
    }
}
