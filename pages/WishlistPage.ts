import { Page, Locator, expect } from '@playwright/test';

const ADD_TO_CART_CONTROL_SELECTOR = [
  'input[name="submit.addToCart"]',
  'button[name="submit.addToCart"]',
  'button[data-action*="addToCart" i]',
  'button[data-action*="moveToCart" i]',
  '[role="button"][data-action*="addToCart" i]',
  '[role="button"][data-action*="moveToCart" i]',
  'input[type="button"][value*="Add to Cart" i]',
  'input[type="button"][value*="Move to Cart" i]',
  'input[type="submit"][value*="Add to Cart" i]',
  'input[type="submit"][value*="Move to Cart" i]',
  'button:has-text("Add to Cart")',
  'button:has-text("Move to Cart")',
  '[role="button"]:has-text("Add to Cart")',
  '[role="button"]:has-text("Move to Cart")',
  'a:has-text("Add to Cart")',
  'a:has-text("Move to Cart")'
].join(', ');

export class WishlistPage {
  readonly page: Page;

  readonly productTitle: Locator;
  readonly wishlistButton: Locator;
  readonly viewListButton: Locator;

  readonly wishlistItems: Locator;
  readonly removeButtons: Locator;
  readonly addToCartButtons: Locator;
  readonly emptyWishlistMessage: Locator;
  readonly cartContents: Locator;
  readonly signInEmailField: Locator;
  readonly cartCount: Locator;
  readonly addToCartConfirmation: Locator;

  constructor(page: Page) {
    this.page = page;

    this.productTitle =
      page.locator('#productTitle');

    this.wishlistButton = page.locator(
      '#add-to-wishlist-button-submit'
    );

    this.viewListButton = page.getByRole(
      'link',
      {
        name: /View Your List/i
      }
    );

    this.wishlistItems = page.locator(
      '#g-items .g-item-sortable'
    );

    this.removeButtons = page.locator(
      'input[name="submit.deleteItem"], ' +
      'button[name="submit.deleteItem"]'
    );

    this.addToCartButtons = this.wishlistItems.locator(
      ADD_TO_CART_CONTROL_SELECTOR
    );

    this.emptyWishlistMessage = page.getByText(
      /(?:your|this) (?:wish )?list is empty|no items (?:in|on) (?:your|this) (?:wish )?list/i
    ).first();

    this.cartContents = page.locator(
      '#sc-active-cart, #activeCartViewForm'
    ).first();

    this.signInEmailField = page.locator(
      '#ap_email, input[name="email"], input[type="email"]'
    ).first();

    this.cartCount = page.locator('#nav-cart-count');

    this.addToCartConfirmation = page.locator(
      '#NATC_SMART_WAGON_CONF_MSG_SUCCESS, ' +
      '#sw-atc-details-single-container, ' +
      '#attachDisplayAddBaseAlert, ' +
      '.a-size-base.a-color-success'
    ).first();
  }

  async openWishlist(): Promise<void> {
    const currentUrl = new URL(this.page.url());
    const isAmazonPage =
      currentUrl.hostname === 'amazon.in' ||
      currentUrl.hostname.endsWith('.amazon.in');

    if (!isAmazonPage) {
      await this.page.goto('https://www.amazon.in/', {
        waitUntil: 'domcontentloaded'
      });
    }

    await this.assertAuthenticated();

    await this.page.goto(
      'https://www.amazon.in/hz/wishlist/ls',
      {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      }
    );

    if (/\/ap\/signin/i.test(this.page.url())) {
      throw new Error(
        'Amazon redirected Wishlist navigation to sign-in. Refresh the auth state by running the auth-setup project.'
      );
    }

    await expect(this.page).toHaveURL(/wishlist/i, {
      timeout: 20000
    });
    await this.assertAuthenticated();
  }

  async openWishlistAsGuest(): Promise<void> {
    await this.page.goto(
      'https://www.amazon.in/hz/wishlist/intro',
      {
        waitUntil: 'domcontentloaded'
      }
    );
  }

  async expectGuestWishlistPrompt(): Promise<void> {
    await expect(this.page).toHaveURL(
      /\/(?:ap\/signin|hz\/wishlist\/intro)(?:[/?#]|$)/i,
      { timeout: 20000 }
    );

    if (/\/ap\/signin/i.test(this.page.url())) {
      await expect(this.signInEmailField).toBeVisible({
        timeout: 15000
      });
    }
  }

  async clearAuthenticationState(): Promise<void> {
    await this.page.context().clearCookies();
    await this.page.goto('https://www.amazon.in/', {
      waitUntil: 'domcontentloaded'
    });
    await this.page.evaluate(() => window.localStorage.clear());
    await this.page.context().clearCookies();
  }

  async addProductToWishlistAsGuest(): Promise<void> {
    const addToList = this.page.getByRole('button', {
      name: /Add to List/i
    }).first();

    if (await this.wishlistButton.isVisible()) {
      await this.wishlistButton.click();
    } else if (await addToList.isVisible()) {
      await addToList.click();
    } else {
      await this.openWishlistAsGuest();
    }

    await this.expectGuestWishlistPrompt();
  }

  private async assertAuthenticated(): Promise<void> {
    const cookies = await this.page.context().cookies(
      'https://www.amazon.in'
    );
    const hasSessionCookie = cookies.some(({ name }) =>
      ['session-token', 'at-acbin', 'sess-at-acbin'].includes(name)
    );

    if (!hasSessionCookie) {
      throw new Error(
        'Amazon authentication cookies were not loaded. Run the auth-setup project to create a fresh storage state.'
      );
    }

    const accountLabel = this.page.locator(
      '#nav-link-accountList-nav-line-1'
    );

    await expect(accountLabel).toBeVisible({
      timeout: 15000
    });

    const accountText = (await accountLabel.innerText()).trim();

    if (!accountText || /sign in/i.test(accountText)) {
      throw new Error(
        'Amazon rejected the saved session. Run the auth-setup project and complete any verification prompt.'
      );
    }
  }

  async addProductToWishlist() {

  console.log(
    'PRODUCT URL =>',
    this.page.url()
  );

  const addToList = this.page
    .getByRole('button', {
      name: /Add to List/i
    });

  const wishlistButton =
    this.page.locator(
      '#add-to-wishlist-button-submit'
    );

  console.log(
    'Wishlist Button Count:',
    await wishlistButton.count()
  );

  console.log(
    'Add To List Count:',
    await addToList.count()
  );

  if (
    await wishlistButton
      .isVisible()
      .catch(() => false)
  ) {

    await wishlistButton.click();

  } else if (

    await addToList
      .isVisible()
      .catch(() => false)

  ) {

    await addToList.click();

  } else {

    throw new Error(
      'Wishlist button not found'
    );

  }

}
  async openWishlistFromProduct() {
    const viewList = this.page.getByText(
      /View Your List/i
    );

    if (
      await viewList.isVisible().catch(
        () => false
      )
    ) {
      await viewList.click();
    }
  }

  async verifyProductInWishlist(
    productName: string
  ) {
    const wishlistItem = this.wishlistItems
      .filter({ hasText: productName })
      .first();

    await expect(wishlistItem).toBeVisible({
      timeout: 30000
    });
  }

  async getWishlistCount() {
    return await this.wishlistItems.count();
  }

  async getWishlistItemCountByName(productName: string): Promise<number> {
    return await this.wishlistItems
      .filter({ hasText: productName })
      .count();
  }

  async getWishlistItemCountByAsin(asin: string): Promise<number> {
    if (!/^[A-Z0-9]{10}$/i.test(asin)) {
      throw new Error(`Invalid Amazon ASIN: "${asin}"`);
    }

    const productLink = this.page.locator(
      `a[href*="/dp/${asin}"], ` +
      `a[href*="/gp/product/${asin}"], ` +
      `a[href*="/gp/aw/d/${asin}"]`
    );

    return await this.wishlistItems
      .filter({ has: productLink })
      .count();
  }

  async expectEmptyWishlistState(): Promise<void> {
    await expect(this.page).toHaveURL(/wishlist/i, {
      timeout: 20000
    });
    await expect(this.wishlistItems).toHaveCount(0, {
      timeout: 20000
    });

    const emptyMessageVisible =
      await this.emptyWishlistMessage.isVisible();

    console.log(
      '[Wishlist] Empty state confirmed by zero items; empty message visible:',
      emptyMessageVisible
    );
  }

  async openCart(): Promise<void> {
    await this.page.goto(
      'https://www.amazon.in/gp/cart/view.html',
      {
        waitUntil: 'domcontentloaded'
      }
    );
    await expect(this.cartContents).toBeVisible({
      timeout: 20000
    });
  }

  async getProductName() {
    const item =
      this.wishlistItems.first();

    await expect(item).toBeVisible();

    return (
      await item.innerText()
    ).trim();
  }

  async getProductPrice() {
    const price =
      this.wishlistItems
        .first()
        .locator('.a-price')
        .first();

    await expect(price).toBeVisible();

    return (
      await price.innerText()
    ).trim();
  }

  async isProductImageVisible() {
    return await this.wishlistItems
      .first()
      .locator('img')
      .first()
      .isVisible();
  }

  async removeProductFromWishlist() {
    const removeButton =
      this.removeButtons.first();

    await expect(
      removeButton
    ).toBeVisible({
      timeout: 20000
    });

    await removeButton.click();

    await this.page.waitForTimeout(
      3000
    );
  }

  async removeAllProducts(): Promise<void> {
    while (true) {
      const itemCount = await this.wishlistItems.count();

      if (itemCount === 0) {
        return;
      }

      const removeButton = this.removeButtons.first();
      await expect(removeButton).toBeVisible({
        timeout: 15000
      });
      await removeButton.click();
      await expect(this.wishlistItems).toHaveCount(itemCount - 1, {
        timeout: 20000
      });
    }
  }

  async verifyEmptyWishlist() {

    expect(
      await this.wishlistItems.count()
    ).toBe(0);

  }

  async moveProductToCart() {
    await this.logWishlistActionControls();

    const addToCart = this.addToCartButtons
      .filter({ visible: true })
      .first();

    await expect(addToCart).toBeVisible({
      timeout: 20000
    });
    await expect(addToCart).toBeEnabled();

    await expect(this.cartCount).toBeAttached({
      timeout: 15000
    });

    const cartCountBefore = await this.readCartCount();
    const clickedControl = await addToCart.evaluate(element => ({
      tag: element.tagName.toLowerCase(),
      text: (element.textContent || '').trim(),
      value: element instanceof HTMLInputElement ? element.value : '',
      name: element.getAttribute('name'),
      action: element.getAttribute('data-action')
    }));

    console.log(
      '[Wishlist] Clicking Add to Cart control:',
      JSON.stringify(clickedControl),
      'Cart count before:',
      cartCountBefore
    );

    await addToCart.click();

    console.log(
      '[Wishlist] Add to Cart click completed; waiting for cart confirmation.'
    );

    await expect.poll(
      async () => {
        const cartCount = await this.readCartCount();

        return (
          cartCount > cartCountBefore ||
          await this.addToCartConfirmation.isVisible() ||
          /\/gp\/cart\/view\.html/i.test(this.page.url())
        );
      },
      {
        timeout: 20000,
        message: 'Amazon did not confirm the Wishlist item was added to the cart'
      }
    ).toBe(true);

    console.log(
      '[Wishlist] Cart count after action:',
      await this.readCartCount(),
      'Current URL:',
      this.page.url()
    );
  }

  async isRemoveButtonVisible() {

    return await this.removeButtons
      .first()
      .isVisible()
      .catch(() => false);

  }

  async isAddToCartButtonVisible(): Promise<boolean> {
    await this.logWishlistActionControls();

    return await this.addToCartButtons
      .filter({ visible: true })
      .first()
      .isVisible();
  }

  private async logWishlistActionControls(): Promise<void> {
    const controls = this.wishlistItems.locator(
      'button, input[type="button"], input[type="submit"], [role="button"], a'
    );

    const details = await controls.evaluateAll(elements =>
      elements.map(element => {
        const styles = window.getComputedStyle(element);
        const inputValue = element instanceof HTMLInputElement
          ? element.value
          : '';

        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || '').trim(),
          value: inputValue,
          name: element.getAttribute('name'),
          ariaLabel: element.getAttribute('aria-label'),
          visible:
            element.getClientRects().length > 0 &&
            styles.display !== 'none' &&
            styles.visibility !== 'hidden',
          disabled: element.hasAttribute('disabled')
        };
      })
    );

    console.log(
      '[Wishlist] Available item controls:',
      JSON.stringify(details)
    );
  }

  private async readCartCount(): Promise<number> {
    const countText = (await this.cartCount.textContent())?.trim();

    if (!countText) {
      return 0;
    }

    const count = Number(countText);

    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error(`Unexpected Amazon cart count: "${countText}"`);
    }

    return count;
  }

  async getPageTitle() {

    return await this.page.title();

  }

  async isWishlistEmpty() {

    return (
      await this.wishlistItems.count()
    ) === 0;

  }
}