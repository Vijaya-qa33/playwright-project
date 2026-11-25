
import { Page, Locator } from '@playwright/test';

export class ProductDetailsPage {

    readonly page: Page;
    readonly productTitle: Locator;
    readonly productImage: Locator;
    readonly productPrice: Locator;

    // Product information
    readonly productDescription: Locator;
    readonly technicalSpecifications: Locator;
    readonly productRating: Locator;
    readonly customerReviewsLink: Locator;

    // Delivery and offers
    readonly deliveryInformation: Locator;
    readonly updateLocation: Locator;
    readonly pincodeInput: Locator;
    readonly pincodeSubmit: Locator;
    readonly offersSection: Locator;

    // Seller and purchase
    readonly sellerInformation: Locator;
    readonly addToCartButton: Locator;
    readonly buyNowButton: Locator;

    constructor(page: Page) {

        this.page = page;

        this.productTitle = page.locator('#productTitle');

        this.productImage = page.locator('#landingImage');

        // Current visible product price
        this.productPrice = page.locator(
            '#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price):visible, ' +
            '#corePrice_feature_div .a-price:not(.a-text-price):visible, ' +
            '#apex_desktop .a-price:not(.a-text-price):visible'
        ).first();

        // Product description
        this.productDescription = page.locator(
            '#feature-bullets:visible, #productDescription:visible'
        ).first();

        // Technical specifications
        this.technicalSpecifications = page.locator(
            '#productDetails_techSpec_section_1:visible, ' +
            '#productDetails_detailBullets_sections1:visible, ' +
            '#detailBullets_feature_div:visible'
        ).first();

        // Product ratings
        this.productRating = page.locator(
            '#acrCustomerReviewLink:visible, #averageCustomerReviews:visible'
        ).first();

        // Customer reviews
        this.customerReviewsLink = page.locator(
            '#acrCustomerReviewLink'
        );

        // Delivery information
        this.deliveryInformation = page.locator(
            '#deliveryBlockMessage:visible, ' +
            '#mir-layout-DELIVERY_BLOCK:visible'
        ).first();

        // Update location
        this.updateLocation = page.getByText(
            /Update location/i
        ).first();

        // Pincode input
        this.pincodeInput = page.locator(
            '#GLUXZipUpdateInput'
        );

        // Pincode submit
        this.pincodeSubmit = page.locator(
            '#GLUXZipUpdate'
        );

        // Offers
        this.offersSection = page.locator(
            '#promoPriceBlockMessage_feature_div:visible, ' +
            '#savings_feature_div:visible, ' +
            '#dealprice_savings:visible'
        ).first();

        // Seller and fulfilment information
        this.sellerInformation = page.locator(
            '#merchant-info:visible, ' +
            '#tabular-buybox:visible, ' +
            '#sellerProfileTriggerId:visible, ' +
            '#fulfillerInfoFeature_feature_div:visible, ' +
            '#merchantInfoFeature_feature_div:visible'
        ).first();

        // Add to cart
        this.addToCartButton = page.locator(
            '#add-to-cart-button:visible'
        ).first();

        // Buy Now
        this.buyNowButton = page.locator(
            '#buy-now-button:visible'
        ).first();
    }

    // Wait for Product Details page
    async waitForProductDetailsPage() {

        await this.productTitle.waitFor({
            state: 'visible',
            timeout: 30000
        });
    }

    // Scroll to required section
    async scrollTo(locator: Locator) {

        await locator.scrollIntoViewIfNeeded();
    }

    // Get product price text
    async getProductPriceText(): Promise<string> {

        await this.productPrice.waitFor({
            state: 'visible',
            timeout: 15000
        });

        // Read price directly from the existing DOM element.
        // Optional child elements will not cause Playwright timeouts.
        const priceText = await this.productPrice.evaluate((element) => {

            const offscreen = element.querySelector('.a-offscreen');

            const wholePrice = element.querySelector('.a-price-whole');

            const fractionPrice = element.querySelector('.a-price-fraction');

            const currencySymbol = element.querySelector('.a-price-symbol');

            const accessiblePrice = (
                element.getAttribute('aria-label') || ''
            ).trim();

            const offscreenText = (
                offscreen?.textContent || ''
            ).trim();

            if (offscreenText) {
                return offscreenText;
            }

            if (accessiblePrice) {
                return accessiblePrice;
            }

            const whole = (
                wholePrice?.textContent || ''
            ).replace(/[^0-9,]/g, '');

            const fraction = (
                fractionPrice?.textContent || ''
            ).replace(/[^0-9]/g, '');

            const symbol = (
                currencySymbol?.textContent || ''
            ).trim();

            if (whole) {
                return `${symbol}${whole}${fraction ? '.' + fraction : ''}`;
            }

            // Final fallback: read complete price container
            return (
                (element instanceof HTMLElement ? element.innerText : '') ||
                element.textContent ||
                ''
            ).trim();
        });

        if (!priceText || !/[0-9]/.test(priceText)) {
            throw new Error(
                'Product price is empty or could not be extracted from Amazon DOM'
            );
        }

        return priceText.trim();
    }

    // Change delivery pincode
    async changePincode(pincode: string) {

        await this.updateLocation.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.updateLocation.click();

        await this.pincodeInput.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.pincodeInput.fill(pincode);

        await this.pincodeSubmit.click();

        await this.pincodeInput.waitFor({
            state: 'hidden',
            timeout: 15000
        });
    }
}
