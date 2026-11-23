
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

        // Existing locators - preserved
        this.productTitle = page.locator('#productTitle');
        this.productImage = page.locator('#landingImage');

        this.productPrice = page.locator(
            '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen, ' +
            '#corePrice_feature_div .a-price .a-offscreen, ' +
            '#apex_desktop .a-price .a-offscreen'
        ).first();

        // Product description
        this.productDescription = page.locator(
            '#feature-bullets, #productDescription'
        ).first();

        // Technical specifications
        this.technicalSpecifications = page.locator(
            '#productDetails_techSpec_section_1, ' +
            '#productDetails_detailBullets_sections1, ' +
            '#detailBullets_feature_div'
        ).first();

        // Ratings and reviews
        this.productRating = page.locator(
            '#acrCustomerReviewLink, #averageCustomerReviews'
        ).first();

        this.customerReviewsLink = page.locator(
            '#acrCustomerReviewLink'
        );

        // Delivery information
        this.deliveryInformation = page.locator(
            '#deliveryBlockMessage, #mir-layout-DELIVERY_BLOCK'
        ).first();

        this.updateLocation = page.getByText(
            /Update location/i
        ).first();

        this.pincodeInput = page.locator(
            '#GLUXZipUpdateInput'
        );

        this.pincodeSubmit = page.locator(
            '#GLUXZipUpdate'
        );

        // Offers
        this.offersSection = page.locator(
            '#promoPriceBlockMessage_feature_div, ' +
            '#savings_feature_div, ' +
            '#dealprice_savings'
        ).first();

        // Seller information
        this.sellerInformation = page.locator(
    '#merchant-info, ' +
    '#tabular-buybox, ' +
    '#sellerProfileTriggerId, ' +
    '#fulfillerInfoFeature_feature_div, ' +
    '#merchantInfoFeature_feature_div'
).filter({ visible: true }).first();

        // Purchase buttons
        this.addToCartButton = page.locator(
    '#add-to-cart-button:visible'
).first();

        this.buyNowButton = page.locator(
            '#buy-now-button'
        );
    }

    async waitForProductDetailsPage() {
        await this.productTitle.waitFor({
            state: 'visible',
            timeout: 30000
        });
    }

    async scrollTo(locator: Locator) {
        await locator.scrollIntoViewIfNeeded();
    }

    async changePincode(pincode: string) {
        await this.updateLocation.click();

        await this.pincodeInput.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.pincodeInput.fill(pincode);

        await this.pincodeSubmit.click();
    }
}
