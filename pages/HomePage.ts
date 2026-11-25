import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly searchBox: Locator;
  readonly searchButton: Locator;
  readonly searchResults: Locator;
  readonly amazonLogo: Locator;
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

    this.amazonLogo = page.locator(
      '#nav-logo-sprites'
    );

    this.continueShoppingButton = page.locator(
      'input[value*="Continue shopping" i], ' +
      'button:has-text("Continue shopping"), ' +
      'a:has-text("Continue shopping")'
    ).filter({
      visible: true
    }).first();
  }

  async goto() {
    await this.page.goto(
      'https://www.amazon.in',
      {
        waitUntil: 'domcontentloaded'
      }
    );

    const pageReady = this.searchBox
      .or(this.continueShoppingButton)
      .filter({
        visible: true
      })
      .first();

    await pageReady.waitFor({
      state: 'visible',
      timeout: 30000
    });

    if (await this.continueShoppingButton.isVisible()) {
      await this.continueShoppingButton.click();
    }

    await expect(
      this.searchBox
    ).toBeVisible({
      timeout: 30000
    });
  }

async searchProduct(productName: string) {

  await this.searchBox.waitFor({
    state: 'visible'
  });

  await this.searchBox.fill(productName);

  await this.searchButton.click();

  await this.page.waitForLoadState(
    'domcontentloaded'
  );

  console.log(
    'SEARCH URL =>',
    this.page.url()
  );

  console.log(
    'PAGE TITLE =>',
    await this.page.title()
  );

}

  async openFirstProduct(): Promise<void> {
    const firstProductLink = this.searchResults
      .locator('a[href*="/dp/"]:visible')
      .first();

    await expect(firstProductLink).toBeVisible({
      timeout: 15000
    });

    await expect(firstProductLink).toHaveAttribute(
      'href',
      /\/dp\/[A-Z0-9]{10}/i,
      { timeout: 15000 }
    );

    const href = await firstProductLink.getAttribute('href');

    if (!href) {
      throw new Error('First Amazon search result has no product URL');
    }

    const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})(?:[/?#]|$)/i);

    if (!asinMatch) {
      throw new Error(`Search result URL is not a valid Amazon product URL: ${href}`);
    }

    const productUrl = new URL(
      `/dp/${asinMatch[1]}`,
      this.page.url()
    ).toString();
    const productTitle = this.page.locator('#productTitle');
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.page.goto(productUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });

        await expect(productTitle).toBeVisible({
          timeout: 20000
        });
        await expect(productTitle).toHaveText(/\S/, {
          timeout: 10000
        });

        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }
  }
  async isSearchResultsDisplayed() {
    await expect(
      this.searchResults.first()
    ).toBeVisible();
  }

  async getSearchResultCount() {
    return await this.searchResults.count();
  }

  async searchAndOpenProduct(
    productName: string
  ) {
    await this.searchProduct(productName);

    await this.openFirstProduct();
  }

  async returnToHomePage() {
    await this.amazonLogo.click();

    await expect(
      this.searchBox
    ).toBeVisible({
      timeout: 20000
    });
  }

  async getPageTitle() {
    return await this.page.title();
  }
  async enterProduct(
  productName: string
) {

  await this.searchBox.fill(
    productName
  );

}
async clickSearch() {

  await this.searchButton.click();

}
}