
import { test, expect, Page, Locator } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductDetailsPage } from '../pages/ProductDetailspage';

async function openProductDetails(page: Page) {
    const homePage = new HomePage(page);
    const productDetailsPage = new ProductDetailsPage(page);

    await homePage.goto();
    await homePage.enterProduct('iPhone 16');
    await homePage.clickSearch();

    await homePage.searchResults.first().waitFor({
        state: 'visible',
        timeout: 15000
    });

    const productCard = homePage.searchResults
        .filter({ hasText: 'iPhone 16 128 GB: 5G Mobile Phone' })
        .filter({ hasNotText: 'Sponsored' })
        .first();

    const productLink = productCard.locator('a[href*="/dp/"]').first();

    await productLink.waitFor({
        state: 'visible',
        timeout: 15000
    });

    const href = await productLink.getAttribute('href');

    if (!href) {
        throw new Error('Product URL was not found in the search result');
    }

    const productUrl = new URL(href, page.url()).toString();

    await page.goto(productUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    await productDetailsPage.waitForProductDetailsPage();

    return productDetailsPage;
}

// Locate the visible current product price container.
// Excludes crossed-out/old prices.
function getVisibleProductPrice(page: Page): Locator {
    return page.locator(
        '#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price):visible, ' +
        '#corePrice_feature_div .a-price:not(.a-text-price):visible, ' +
        '#apex_desktop .a-price:not(.a-text-price):visible'
    ).first();
}

// Read price using textContent because Amazon's a-offscreen
// element may be hidden to Playwright's visibility checks.
async function getProductPriceText(page: Page): Promise<string> {
    const priceContainer = getVisibleProductPrice(page);

    await expect(priceContainer).toBeVisible({
        timeout: 15000
    });

    const priceText = await priceContainer
        .locator('.a-offscreen')
        .first()
        .textContent();

    return (priceText || '').trim();
}

test.describe('Amazon Product Details Module - First 10 Test Cases', () => {

    test('TC_PD_001 - Verify user can open Product Details page', async ({ page }) => {
        const product = await openProductDetails(page);
        await expect(product.productTitle).toBeVisible();
    });

    test('TC_PD_002 - Verify product title is displayed', async ({ page }) => {
        const product = await openProductDetails(page);
        await expect(product.productTitle).toBeVisible();
    });

    test('TC_PD_003 - Verify product title is not empty', async ({ page }) => {
        const product = await openProductDetails(page);
        const title = await product.productTitle.innerText();
        expect(title.trim()).not.toBe('');
    });

    test('TC_PD_004 - Verify product title contains iPhone 16', async ({ page }) => {
        const product = await openProductDetails(page);
        await expect(product.productTitle).toContainText(/iPhone 16/i);
    });

    test('TC_PD_005 - Verify main product image is displayed', async ({ page }) => {
        const product = await openProductDetails(page);
        await expect(product.productImage).toBeVisible();
    });

    test('TC_PD_006 - Verify product image has a valid source', async ({ page }) => {
        const product = await openProductDetails(page);
        const imageSource = await product.productImage.getAttribute('src');
        expect(imageSource).toBeTruthy();
    });

    test('TC_PD_007 - Verify product price is displayed', async ({ page }) => {
        await openProductDetails(page);

        const priceContainer = getVisibleProductPrice(page);

        await expect(priceContainer).toBeVisible({
            timeout: 15000
        });
    });

   test('TC_PD_008 - Verify product price is not empty', async ({ page }) => {
    const product = await openProductDetails(page);
    const price = await product.getProductPriceText();

    console.log('TC_PD_008 - Product Price:', price);

    expect(price).not.toBe('');
});

test('TC_PD_009 - Verify product price contains numeric value', async ({ page }) => {
    const product = await openProductDetails(page);
    const price = await product.getProductPriceText();

    console.log('TC_PD_009 - Product Price:', price);

    expect(price).toMatch(/[0-9]/);
});

    test('TC_PD_010 - Verify user is navigated to the product URL', async ({ page }) => {
        await openProductDetails(page);

        await expect(page).toHaveURL(/\/dp\/[A-Z0-9]{10}/i);
    });

});

test.describe('Amazon Product Details Module - Additional 10 Test Cases', () => {

    test('TC_PD_011 - Verify user can view product description', async ({ page }) => {
        const product = await openProductDetails(page);

        await product.scrollTo(product.productDescription);

        await expect(product.productDescription).toBeVisible();

        const description = (await product.productDescription.innerText()).trim();

        console.log('\nTC_PD_011 - Product Description:');
        console.log(description);

        expect(description).not.toBe('');
    });

    test('TC_PD_012 - Verify user can view technical specifications', async ({ page }) => {
        const product = await openProductDetails(page);

        await product.scrollTo(product.technicalSpecifications);

        await expect(product.technicalSpecifications).toBeVisible();

        const specifications = (await product.technicalSpecifications.innerText()).trim();

        console.log('\nTC_PD_012 - Technical Specifications:');
        console.log(specifications);

        expect(specifications).not.toBe('');
    });

    test('TC_PD_013 - Verify user can view product ratings and reviews', async ({ page }) => {
        const product = await openProductDetails(page);

        await expect(product.productRating).toBeVisible();

        const rating = (await product.productRating.innerText()).trim();

        console.log('\nTC_PD_013 - Product Rating and Reviews:', rating);

        expect(rating).toMatch(/[0-9]/);
    });

    test('TC_PD_014 - Verify user can navigate to customer reviews', async ({ page }) => {
        const product = await openProductDetails(page);

        await product.customerReviewsLink.waitFor({
            state: 'visible',
            timeout: 15000
        });

        const reviewLinkText = (await product.customerReviewsLink.innerText()).trim();

        console.log('\nTC_PD_014 - Customer Reviews Link:', reviewLinkText);

        await product.customerReviewsLink.click();

        const reviewsSection = page.locator(
            '#customerReviews, #reviewsMedley'
        ).first();

        await expect(reviewsSection).toBeVisible({
            timeout: 15000
        });

        console.log('TC_PD_014 - Result: Customer reviews section displayed');
    });

    test('TC_PD_015 - Verify delivery information is displayed for a valid pincode', async ({ page }) => {
        const product = await openProductDetails(page);

        await product.scrollTo(product.deliveryInformation);

        await expect(product.deliveryInformation).toBeVisible();

        const deliveryDetails = (await product.deliveryInformation.innerText()).trim();

        console.log('\nTC_PD_015 - Delivery Information:');
        console.log(deliveryDetails);

        expect(deliveryDetails).not.toBe('');
    });

    test('TC_PD_016 - Verify user can change the delivery pincode', async ({ page }) => {
        const product = await openProductDetails(page);

        await product.updateLocation.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await product.changePincode('600001');

        await expect(product.pincodeInput).not.toBeVisible({
            timeout: 15000
        });

        const deliveryDetails = (await product.deliveryInformation.innerText()).trim();

        console.log('\nTC_PD_016 - Entered Delivery Pincode: 600001');
        console.log('TC_PD_016 - Updated Delivery Information:');
        console.log(deliveryDetails);

        expect(deliveryDetails).not.toBe('');
    });

    test('TC_PD_017 - Verify available product offers are displayed', async ({ page }) => {
        const product = await openProductDetails(page);

        const offerText = page.getByText(
            /Cashback|No Cost EMI|Partner Offers/i
        ).first();

        await expect(offerText).toBeVisible({
            timeout: 15000
        });

        const offers = (await offerText.innerText()).trim();

        console.log('\nTC_PD_017 - Available Product Offers:', offers);

        expect(offers).not.toBe('');
    });

    test('TC_PD_018 - Verify seller and fulfilment information is displayed', async ({ page }) => {
        const product = await openProductDetails(page);

        await product.sellerInformation.waitFor({
            state: 'visible',
            timeout: 20000
        });

        const sellerDetails = (await product.sellerInformation.innerText()).trim();

        console.log('\nTC_PD_018 - Seller and Fulfilment Information:');
        console.log(sellerDetails);

        await expect(product.sellerInformation).toContainText(
            /Sold by|Ships from/i
        );

        expect(sellerDetails).not.toBe('');
    });

    test('TC_PD_019 - Verify user can proceed using Buy Now', async ({ page }) => {
        const product = await openProductDetails(page);

        await product.buyNowButton.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await expect(product.buyNowButton).toBeEnabled();

        await product.buyNowButton.click();

        await expect(page).toHaveURL(
            /buy|checkout|signin|\/ap\/signin/i,
            { timeout: 20000 }
        );

        console.log('\nTC_PD_019 - Buy Now Navigation URL:', page.url());
        console.log('TC_PD_019 - Result: Purchase flow opened successfully');
    });

});
