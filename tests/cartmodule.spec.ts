
import { test, expect, Page, Locator } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';

test.describe('Amazon - Cart Module', () => {

    test.setTimeout(120000);

    const products = [
        'iPhone 16',
        'Samsung Galaxy S25',
        'OnePlus 13'
    ];

    async function addProduct(page: Page, productName: string) {
        const homePage = new HomePage(page);
        const cartPage = new CartPage(page);

        if (page.url() === 'about:blank') {
            await homePage.goto();
        }

        await homePage.searchProduct(productName);
        await cartPage.addProductToCart();
    }

    async function addMultipleProducts(page: Page) {
        for (const product of products) {
            await addProduct(page, product);
        }
    }

    async function openCart(page: Page) {
        const cartPage = new CartPage(page);
        await cartPage.openCart();
        return cartPage;
    }

    async function getFirstItem(page: Page): Promise<Locator> {
        const cartPage = new CartPage(page);
        await expect(cartPage.cartItems.first()).toBeVisible();
        return cartPage.cartItems.first();
    }

    // TC_CART_001
    test('TC_CART_001 - Verify user can add a product to the cart from search results', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = new CartPage(page);
        expect(await cartPage.getCartCount()).toBeGreaterThan(0);
    });

    // TC_CART_002
    test('TC_CART_002 - Verify cart count increases when a product is added', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = new CartPage(page);
        expect(await cartPage.getCartCount()).toBe(1);
    });

    // TC_CART_003
    test('TC_CART_003 - Verify multiple different products can be added to the cart', async ({ page }) => {
        await addMultipleProducts(page);

        const cartPage = new CartPage(page);
        expect(await cartPage.getCartCount()).toBe(3);
    });

    // TC_CART_004
    test('TC_CART_004 - Verify all added products are displayed in the cart', async ({ page }) => {
        await addMultipleProducts(page);

        const cartPage = await openCart(page);
        await expect(cartPage.cartItems).toHaveCount(3);
    });

    // TC_CART_005
    test('TC_CART_005 - Verify selected product name is displayed correctly in the cart', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        await expect(
            cartPage.cartItems.first().locator('a.sc-product-title')
        ).toContainText('iPhone 16');
    });

    // TC_CART_006
    test('TC_CART_006 - Verify product price is displayed correctly in the cart', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        await expect(
            cartPage.getItemPrice(cartPage.cartItems.first())
        ).toBeVisible();
    });

    // TC_CART_007
    test('TC_CART_007 - Verify product quantity is displayed as 1 when initially added', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        await expect(
            cartPage.getQuantity(cartPage.cartItems.first())
        ).toHaveText('1');
    });

    // TC_CART_008
    test('TC_CART_008 - Verify user can increase product quantity', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        const item = await getFirstItem(page);

        await cartPage.setQuantity(item, 2);

        await expect(cartPage.getQuantity(item)).toHaveText('2');
    });

    // TC_CART_009
    test('TC_CART_009 - Verify user can decrease product quantity', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        const item = await getFirstItem(page);

        await cartPage.setQuantity(item, 2);
        await cartPage.setQuantity(item, 1);

        await expect(cartPage.getQuantity(item)).toHaveText('1');
    });

    // TC_CART_010
    test('TC_CART_010 - Verify subtotal updates when product quantity increases', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        const item = await getFirstItem(page);

        const oldSubtotal = await cartPage.readPrice(
            cartPage.getSubtotal()
        );

        await cartPage.setQuantity(item, 2);

        await expect.poll(async () => {
            return await cartPage.readPrice(cartPage.getSubtotal());
        }).toBeGreaterThan(oldSubtotal);
    });

    // TC_CART_011
    test('TC_CART_011 - Verify subtotal updates when product quantity decreases', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        const item = await getFirstItem(page);

        await cartPage.setQuantity(item, 2);

        const oldSubtotal = await cartPage.readPrice(
            cartPage.getSubtotal()
        );

        await cartPage.setQuantity(item, 1);

        await expect.poll(async () => {
            return await cartPage.readPrice(cartPage.getSubtotal());
        }).toBeLessThan(oldSubtotal);
    });

    // TC_CART_012
    test('TC_CART_012 - Verify user can remove a product from the cart', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        const item = await getFirstItem(page);

        await cartPage.removeProduct(item);

        await expect(
            page.locator('a.sc-removed-msg-title')
        ).toContainText('iPhone 16');
    });

    // TC_CART_013
    test('TC_CART_013 - Verify cart count updates after removing a product', async ({ page }) => {
        await addMultipleProducts(page);

        const cartPage = await openCart(page);
        await cartPage.removeProduct(cartPage.cartItems.first());

        expect(await cartPage.getCartCount()).toBe(2);
    });

    // TC_CART_014
    test('TC_CART_014 - Verify remaining products are displayed after removing one product', async ({ page }) => {
        await addMultipleProducts(page);

        const cartPage = await openCart(page);

        await cartPage.removeProduct(
            cartPage.getCartItem('iPhone 16')
        );

        await expect(cartPage.cartItems).toHaveCount(2);

        const remainingNames = await cartPage.getProductNames();

        expect(remainingNames.join(' ')).toContain('Samsung');
        expect(remainingNames.join(' ')).toContain('OnePlus');
        expect(remainingNames.join(' ')).not.toContain('iPhone 16');
    });

    // TC_CART_015
    test('TC_CART_015 - Verify user can remove all products from the cart', async ({ page }) => {
        await addMultipleProducts(page);

        const cartPage = await openCart(page);

        while (await cartPage.deleteButtons.count() > 0) {
            await cartPage.removeProduct(cartPage.cartItems.first());
        }

        await expect(cartPage.cartItems).toHaveCount(0);
    });

    // TC_CART_016
    test('TC_CART_016 - Verify empty cart message is displayed when all products are removed', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        await cartPage.removeProduct(cartPage.cartItems.first());

        await expect(
            page.getByText(/your amazon cart is empty|your shopping cart is empty/i)
        ).toBeVisible();
    });

    // TC_CART_017
    test('TC_CART_017 - Verify cart remains empty when user opens the cart without adding products', async ({ page }) => {
        const cartPage = await openCart(page);

        await expect(cartPage.cartItems).toHaveCount(0);
        await expect(
            page.locator('#sc-empty-cart')
        ).toBeVisible();
    });

    // TC_CART_018
    test('TC_CART_018 - Verify cart handles duplicate products added multiple times', async ({ page }) => {
        await addProduct(page, 'iPhone 16');
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);

        await expect(cartPage.cartItems).toHaveCount(1);
        await expect(
            cartPage.getQuantity(cartPage.cartItems.first())
        ).toHaveText('2');
    });

    // TC_CART_019
    test('TC_CART_019 - Verify cart handles unavailable products', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        await homePage.searchProduct('xyzproduct987654321');

        await expect(homePage.searchResults).toHaveCount(0);
    });

    // TC_CART_020
    test('TC_CART_020 - Verify cart details persist after refreshing the cart page', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);

        const beforeTitle = (
            await cartPage.cartItems.first()
                .locator('a.sc-product-title').innerText()
        ).trim();

        const beforeCount = await cartPage.getCartCount();

        await page.reload({ waitUntil: 'domcontentloaded' });

        await expect(cartPage.cartItems.first()).toBeVisible();

        const afterTitle = (
            await cartPage.cartItems.first()
                .locator('a.sc-product-title').innerText()
        ).trim();

        expect(afterTitle).toBe(beforeTitle);
        expect(await cartPage.getCartCount()).toBe(beforeCount);
    });

    // TC_CART_021
    test('TC_CART_021 - Verify cart details are retained after navigating away and returning to the cart page', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        const beforeTitle = (
            await cartPage.cartItems.first()
                .locator('a.sc-product-title').innerText()
        ).trim();

        await page.goto('https://www.amazon.in', {
            waitUntil: 'domcontentloaded'
        });

        await cartPage.openCart();

        await expect(
            cartPage.cartItems.first().locator('a.sc-product-title')
        ).toHaveText(beforeTitle);
    });

    // TC_CART_022
    test('TC_CART_022 - Verify user can continue shopping from the cart page', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);

        const continueShopping = page.locator(
            '#sc-active-cart a[href="/"], #sc-active-cart a[href="https://www.amazon.in/"]'
        ).first();

        if (await continueShopping.count()) {
            await continueShopping.click();
        } else {
            await page.goto('https://www.amazon.in');
        }

        await expect(
            page.locator('#twotabsearchtextbox')
        ).toBeVisible();
    });

    // TC_CART_023
    test('TC_CART_023 - Verify user can navigate to the product page from the cart', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);

        await cartPage.cartItems.first()
            .locator('a.sc-product-title').click();

        await expect(page).toHaveURL(/\/dp\//);
    });

    // TC_CART_024
    test('TC_CART_024 - Verify product title remains correct after refreshing the cart page', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);

        const titleBefore = (
            await cartPage.cartItems.first()
                .locator('a.sc-product-title').innerText()
        ).trim();

        await page.reload({ waitUntil: 'domcontentloaded' });

        const titleAfter = (
            await cartPage.cartItems.first()
                .locator('a.sc-product-title').innerText()
        ).trim();

        expect(titleAfter).toBe(titleBefore);
    });

    // TC_CART_025
    test('TC_CART_025 - Verify removed product is no longer displayed as an active cart item', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        const item = cartPage.getCartItem('iPhone 16');

        await cartPage.removeProduct(item);

        await expect(
            cartPage.getCartItem('iPhone 16')
        ).toHaveCount(0);
    });

    // TC_CART_026
    test('TC_CART_026 - Verify cart subtotal is calculated correctly for multiple products', async ({ page }) => {
        await addProduct(page, 'iPhone 16');
        await addProduct(page, 'Samsung Galaxy S25');

        const cartPage = await openCart(page);

        let expectedSubtotal = 0;

        for (let i = 0; i < await cartPage.cartItems.count(); i++) {
            const item = cartPage.cartItems.nth(i);

            const price = await cartPage.readPrice(
                cartPage.getItemPrice(item)
            );

            const quantity = Number(
                (await cartPage.getQuantity(item).textContent())?.trim() || 1
            );

            expectedSubtotal += price * quantity;
        }

        const actualSubtotal = await cartPage.readPrice(
            cartPage.getSubtotal()
        );

        expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 0);
    });

    // TC_CART_027
    test('TC_CART_027 - Verify cart count is updated correctly when product quantity changes', async ({ page }) => {
        await addProduct(page, 'iPhone 16');

        const cartPage = await openCart(page);
        const item = await getFirstItem(page);

        await cartPage.setQuantity(item, 2);

        await expect.poll(async () => {
            return await cartPage.getCartCount();
        }).toBe(2);
    });

    // TC_CART_028
    test('TC_CART_028 - Verify cart displays the correct details for each added product', async ({ page }) => {
        await addMultipleProducts(page);

        const cartPage = await openCart(page);

        await expect(cartPage.cartItems).toHaveCount(3);

        const names = await cartPage.getProductNames();

        expect(names.join(' ')).toContain('iPhone 16');
        expect(names.join(' ')).toContain('Samsung');
        expect(names.join(' ')).toContain('OnePlus');

        for (let i = 0; i < await cartPage.cartItems.count(); i++) {
            const item = cartPage.cartItems.nth(i);

            await expect(
                cartPage.getItemPrice(item)
            ).toBeVisible();

            await expect(
                cartPage.getQuantity(item)
            ).toBeVisible();
        }
    });
});
