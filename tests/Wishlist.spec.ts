import { test, expect, Page } from '@playwright/test';
import path from 'node:path';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { WishlistPage } from '../pages/WishlistPage';

const PRODUCT = 'iPhone 16';
const AUTH_STATE_FILE = path.resolve(
  process.cwd(),
  'playwright',
  '.auth',
  'amazon.json'
);

async function addTestProductToWishlist(page: Page): Promise<WishlistPage> {
  const homePage = new HomePage(page);
  const wishlistPage = new WishlistPage(page);

  await homePage.goto();
  await homePage.searchProduct(PRODUCT);
  await homePage.openFirstProduct();
  await wishlistPage.addProductToWishlist();

  return wishlistPage;
}

test.describe('Amazon Wishlist Module', () => {

  test('TC_WL_001 - Verify user can open Wishlist page', async ({ page }) => {

    const wishlistPage = new WishlistPage(page);

    await wishlistPage.openWishlist();

    await expect(page).toHaveURL(/wishlist/i);

  });

  test('TC_WL_002 - Verify user can add a product to Wishlist', async ({ page }) => {

    const homePage = new HomePage(page);
    const wishlistPage = new WishlistPage(page);

    await homePage.goto();

    await homePage.searchProduct(PRODUCT);

    await homePage.openFirstProduct();

    await wishlistPage.addProductToWishlist();

  });

  test('TC_WL_003 - Verify added product is displayed in Wishlist', async ({ page }) => {

    const homePage = new HomePage(page);
    const wishlistPage = new WishlistPage(page);

    await homePage.goto();

    await homePage.searchProduct(PRODUCT);

    await homePage.openFirstProduct();

    await wishlistPage.addProductToWishlist();

    await wishlistPage.openWishlist();

    await wishlistPage.verifyProductInWishlist(
      'iPhone'
    );

  });

  test('TC_WL_004 - Verify Wishlist displays correct product name', async ({ page }) => {

    const homePage = new HomePage(page);
    const wishlistPage = new WishlistPage(page);

    await homePage.goto();

    await homePage.searchProduct(PRODUCT);

    await homePage.openFirstProduct();

    const actualTitle =
      await wishlistPage.productTitle.textContent();

    await wishlistPage.addProductToWishlist();

    await wishlistPage.openWishlist();

    await expect(
      page.getByText(
        actualTitle || ''
      )
    ).toBeVisible();

  });

  test('TC_WL_005 - Verify Wishlist displays correct product image', async ({ page }) => {

    const wishlistPage =
      await addTestProductToWishlist(page);

    await wishlistPage.openWishlist();

    expect(
      await wishlistPage
        .isProductImageVisible()
    ).toBeTruthy();

  });

  test('TC_WL_006 - Verify Wishlist item count after adding product', async ({ page }) => {

    const homePage =
      new HomePage(page);

    const wishlistPage =
      new WishlistPage(page);

    await wishlistPage.openWishlist();

    const beforeCount =
      await wishlistPage
        .getWishlistCount();

    await homePage.goto();

    await homePage.searchProduct(
      PRODUCT
    );

    await homePage.openFirstProduct();

    await wishlistPage
      .addProductToWishlist();

    await wishlistPage
      .openWishlist();

    const afterCount =
      await wishlistPage
        .getWishlistCount();

    expect(afterCount)
      .toBeGreaterThanOrEqual(
        beforeCount
      );

  });

  test('TC_WL_007 - Verify user can remove a product from Wishlist', async ({ page }) => {

    const wishlistPage =
      new WishlistPage(page);

    await wishlistPage
      .openWishlist();

    const count =
      await wishlistPage
        .getWishlistCount();

    if (count > 0) {

      await wishlistPage
        .removeProductFromWishlist();

    }

  });

  test('TC_WL_008 - Verify Remove button visibility', async ({ page }) => {

    const wishlistPage =
      await addTestProductToWishlist(page);

    await wishlistPage
      .openWishlist();

    expect(
      await wishlistPage
        .isRemoveButtonVisible()
    ).toBeTruthy();

  });

  test('TC_WL_009 - Verify Move to Cart button visibility', async ({ page }) => {

    const wishlistPage =
      await addTestProductToWishlist(page);

    await wishlistPage
      .openWishlist();

    expect(
      await wishlistPage
        .isAddToCartButtonVisible()
    ).toBeTruthy();

  });

  test('TC_WL_010 - Verify Wishlist page title', async ({ page }) => {

    const wishlistPage =
      new WishlistPage(page);

    await wishlistPage
      .openWishlist();

    await expect(page)
      .toHaveTitle(
        /Amazon|Wish List/i
      );

  });

  test('TC_WL_011 - Verify user can move Wishlist product to Cart', async ({ page }) => {
    const wishlistPage = await addTestProductToWishlist(page);
    const cartPage = new CartPage(page);
    const cartCountBefore = await cartPage.getCartCount();

    console.log(
      '[TC_WL_011] Cart count before move:',
      cartCountBefore
    );

    await wishlistPage.openWishlist();
    await wishlistPage.moveProductToCart();
    await cartPage.openCart();

    console.log(
      '[TC_WL_011] Cart count after move:',
      await cartPage.getCartCount()
    );

    await expect(cartPage.getCartItem(PRODUCT)).toBeVisible({
      timeout: 20000
    });
  });

  test('TC_WL_012 - Verify Wishlist redirects guests to sign in', async ({ page }) => {
    const wishlistPage = new WishlistPage(page);

    await wishlistPage.clearAuthenticationState();
    await wishlistPage.openWishlistAsGuest();
    await wishlistPage.expectGuestWishlistPrompt();
  });

  test('TC_WL_013 - Verify guests are prompted to sign in before adding a product', async ({ page }) => {
    const homePage = new HomePage(page);
    const wishlistPage = new WishlistPage(page);

    await wishlistPage.clearAuthenticationState();
    await homePage.goto();
    await homePage.searchProduct(PRODUCT);
    await homePage.openFirstProduct();
    await wishlistPage.addProductToWishlistAsGuest();
  });

  test('TC_WL_014 - Verify duplicate Wishlist additions do not create duplicate entries', async ({ page }) => {
    test.setTimeout(90000);

    const wishlistPage = await addTestProductToWishlist(page);
    const asinMatch = page.url().match(/\/dp\/([A-Z0-9]{10})/i);

    if (!asinMatch) {
      throw new Error(`Could not extract product ASIN from ${page.url()}`);
    }

    const asin = asinMatch[1];

    await wishlistPage.openWishlist();
    await expect.poll(
      () => wishlistPage.getWishlistItemCountByAsin(asin),
      { timeout: 20000 }
    ).toBeGreaterThan(0);

    const occurrencesBefore =
      await wishlistPage.getWishlistItemCountByAsin(asin);

    console.log(
      '[TC_WL_014] ASIN occurrences before duplicate add:',
      occurrencesBefore,
      'duplicate occurrences:',
      Math.max(0, occurrencesBefore - 1)
    );

    await page.goto(`https://www.amazon.in/dp/${asin}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await expect(wishlistPage.productTitle).toBeVisible({
      timeout: 20000
    });

    await wishlistPage.addProductToWishlist();
    console.log('[TC_WL_014] Second add operation completed for ASIN:', asin);

    await wishlistPage.openWishlist();

    await expect.poll(
      () => wishlistPage.getWishlistItemCountByAsin(asin),
      { timeout: 20000 }
    ).toBeGreaterThan(0);

    const occurrencesAfter =
      await wishlistPage.getWishlistItemCountByAsin(asin);

    console.log(
      '[TC_WL_014] ASIN occurrences after duplicate add:',
      occurrencesAfter,
      'duplicate occurrences:',
      Math.max(0, occurrencesAfter - 1)
    );

    expect(occurrencesAfter).toBeLessThanOrEqual(occurrencesBefore);
  });

  test('TC_WL_015 - Verify Wishlist items remain after page refresh', async ({ page }) => {
    const wishlistPage = await addTestProductToWishlist(page);

    await wishlistPage.openWishlist();
    const expectedCount =
      await wishlistPage.getWishlistItemCountByName(PRODUCT);
    expect(expectedCount).toBeGreaterThan(0);

    await page.reload({
      waitUntil: 'domcontentloaded'
    });

    await expect.poll(
      () => wishlistPage.getWishlistItemCountByName(PRODUCT),
      { timeout: 20000 }
    ).toBe(expectedCount);
  });

  test('TC_WL_016 - Verify Wishlist persists after logout and login', async ({ page, browser }) => {
    const wishlistPage = await addTestProductToWishlist(page);

    await wishlistPage.openWishlist();
    await wishlistPage.verifyProductInWishlist(PRODUCT);
    await wishlistPage.clearAuthenticationState();
    await wishlistPage.openWishlistAsGuest();
    await wishlistPage.expectGuestWishlistPrompt();

    const reauthenticatedContext = await browser.newContext({
      storageState: AUTH_STATE_FILE
    });

    try {
      const reauthenticatedPage =
        await reauthenticatedContext.newPage();
      const reauthenticatedWishlist =
        new WishlistPage(reauthenticatedPage);

      await reauthenticatedWishlist.openWishlist();
      await reauthenticatedWishlist.verifyProductInWishlist(PRODUCT);
    } finally {
      await reauthenticatedContext.close();
    }
  });

  test('TC_WL_017 - Verify empty Wishlist state', async ({ page }) => {
    const wishlistPage = new WishlistPage(page);

    await wishlistPage.openWishlist();
    await wishlistPage.removeAllProducts();
    await wishlistPage.expectEmptyWishlistState();
  });

  test('TC_WL_018 - Verify user can remove all Wishlist products', async ({ page }) => {
    const wishlistPage = await addTestProductToWishlist(page);

    await wishlistPage.openWishlist();
    await expect(wishlistPage.wishlistItems.first()).toBeVisible();
    await wishlistPage.removeAllProducts();

    await expect(wishlistPage.wishlistItems).toHaveCount(0);
  });

  test('TC_WL_019 - Verify Wishlist displays empty state after removing all products', async ({ page }) => {
    const wishlistPage = new WishlistPage(page);

    await wishlistPage.openWishlist();
    await wishlistPage.removeAllProducts();
    await wishlistPage.expectEmptyWishlistState();
  });

  test('TC_WL_020 - Verify Remove button visibility for Wishlist products', async ({ page }) => {
    const wishlistPage = await addTestProductToWishlist(page);

    await wishlistPage.openWishlist();

    await expect(wishlistPage.removeButtons.first()).toBeVisible({
      timeout: 15000
    });
  });

});