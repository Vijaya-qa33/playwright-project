import { expect, Locator, Page } from '@playwright/test';

export interface AddressData {
  fullName: string;
  mobileNumber: string;
  pincode: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
}

const ADDRESSES_URL = 'https://www.amazon.in/a/addresses?ref_=ya_d_c_addr';
const AUTH_COOKIE_NAMES = new Set([
  'session-token',
  'at-acbin',
  'sess-at-acbin'
]);
const DEFAULT_ADDRESS_MARKER = /^default:$/i;
const DEFAULT_ADDRESS_IMAGE_NAME = /^Amazon default shipping address$/i;

export class AddressPage {
  readonly page: Page;
  readonly addressCards: Locator;
  readonly addAddressButton: Locator;
  readonly fullNameField: Locator;
  readonly mobileNumberField: Locator;
  readonly pincodeField: Locator;
  readonly addressLine1Field: Locator;
  readonly addressLine2Field: Locator;
  readonly landmarkField: Locator;
  readonly cityField: Locator;
  readonly stateField: Locator;
  readonly submitAddressButton: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addressCards = page.locator(
      '[id^="ya-myab-display-address-block-"].normal-desktop-address-tile'
    );

    this.addAddressButton = page.locator(
      '#ya-myab-address-add-link, ' +
      'a[href*="/a/addresses/add"], ' +
      'button:has-text("Add address"), ' +
      'a:has-text("Add address")'
    ).filter({ visible: true }).first();

    this.fullNameField = page.locator(
      '#address-ui-widgets-enterAddressFullName'
    );
    this.mobileNumberField = page.locator(
      '#address-ui-widgets-enterAddressPhoneNumber'
    );
    this.pincodeField = page.locator(
      '#address-ui-widgets-enterAddressPostalCode'
    );
    this.addressLine1Field = page.locator(
      '#address-ui-widgets-enterAddressLine1'
    );
    this.addressLine2Field = page.locator(
      '#address-ui-widgets-enterAddressLine2'
    );
    this.landmarkField = page.locator(
      '#address-ui-widgets-landmark'
    );
    this.cityField = page.locator(
      '#address-ui-widgets-enterAddressCity'
    );
    this.stateField = page.locator(
      '#address-ui-widgets-enterAddressStateOrRegion-dropdown-nativeId'
    );
    this.submitAddressButton = page.getByRole('button', {
      name: 'Add address',
      exact: true
    }).filter({ visible: true }).last();
    this.validationErrors = page.locator(
      '#address-ui-widgets-form .a-alert-error, ' +
      '#address-ui-widgets-form .a-alert-inline-error, ' +
      '#address-ui-widgets-form .a-form-error, ' +
      '#address-ui-widgets-form [aria-invalid="true"]'
    ).filter({ visible: true });
  }

  async openAddressManagement(): Promise<void> {
    await this.page.goto(ADDRESSES_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    if (/\/ap\/signin/i.test(this.page.url())) {
      throw new Error(
        'Amazon redirected Address Management to sign-in. Run the auth-setup project to refresh the saved session.'
      );
    }

    await this.assertAuthenticated();
    await expect(this.addAddressButton).toBeVisible({
      timeout: 20000
    });
  }

  async openAddAddressForm(): Promise<void> {
    await this.openAddressManagement();
    await this.addAddressButton.click();
    await expect(this.fullNameField).toBeVisible({
      timeout: 20000
    });
  }

  async fillAddress(data: Partial<AddressData>): Promise<void> {
    if (data.fullName !== undefined) {
      await this.fullNameField.fill(data.fullName);
    }
    if (data.mobileNumber !== undefined) {
      await this.mobileNumberField.fill(data.mobileNumber);
    }
    if (data.pincode !== undefined) {
      await this.pincodeField.fill(data.pincode);
    }
    if (data.addressLine1 !== undefined) {
      await this.addressLine1Field.fill(data.addressLine1);
    }
    if (data.addressLine2 !== undefined) {
      await this.addressLine2Field.fill(data.addressLine2);
    }
    if (data.landmark !== undefined) {
      await this.landmarkField.fill(data.landmark);
    }
    if (data.city !== undefined) {
      await this.cityField.fill(data.city);
    }
    if (data.state !== undefined) {
      await expect(this.stateField).toBeVisible();
      const stateValue = await this.stateField.evaluate(
        (element, requestedState) => {
          if (!(element instanceof HTMLSelectElement)) {
            throw new Error('Amazon State field is not a native select');
          }

          const normalizedState = requestedState.trim().toLocaleLowerCase();
          return Array.from(element.options).find(option =>
            option.label.trim().toLocaleLowerCase() === normalizedState
          )?.value || null;
        },
        data.state
      );

      if (!stateValue) {
        throw new Error(
          `Amazon did not provide a State option matching "${data.state}"`
        );
      }

      await this.stateField.selectOption(stateValue);
    }
  }

  async submitAddressForm(): Promise<void> {
    await this.submitAddressButton.click();
  }

  async addAddress(data: AddressData): Promise<void> {
    await this.openAddAddressForm();
    await this.fillAddress(data);
    await this.submitAddressForm();
    await this.verifyAddressListed(data.fullName);
  }

  getAddressCard(fullName: string): Locator {
    return this.addressCards.filter({
      hasText: fullName
    }).first();
  }

  async verifyAddressListed(fullName: string): Promise<void> {
    await expect(this.getAddressCard(fullName)).toBeVisible({
      timeout: 20000
    });
  }

  async editAddress(
    currentFullName: string,
    updatedAddress: AddressData
  ): Promise<void> {
    const card = this.getAddressCard(currentFullName);
    await expect(card).toBeVisible();

    const editButton = card.getByRole('link', {
      name: /^Edit this address$/i
    });

    await expect(editButton).toBeVisible();
    await editButton.click();
    await expect(this.fullNameField).toBeVisible({
      timeout: 20000
    });
    await this.fillAddress(updatedAddress);
    await this.submitAddressForm();
    await this.verifyAddressListed(updatedAddress.fullName);
  }

  async deleteAddress(fullName: string): Promise<void> {
    const card = this.getAddressCard(fullName);
    await expect(card).toBeVisible();

    const removeButton = card.getByRole('link', {
      name: /^Delete this address$/i
    });

    await expect(removeButton).toBeVisible();
    await removeButton.click();

    const confirmationDialog = this.page.locator(
      '[role="dialog"]:visible, .a-popover-wrapper:visible'
    ).filter({
      hasText: /remove|delete address/i
    }).first();

    if (await confirmationDialog.isVisible()) {
      const confirmButton = confirmationDialog.locator(
        'button:has-text("Yes"), ' +
        'button:has-text("Remove"), ' +
        'button:has-text("Delete"), ' +
        'input[type="submit"][value*="Remove" i], ' +
        'input[type="submit"][value*="Delete" i]'
      ).filter({ visible: true }).first();

      await expect(confirmButton).toBeVisible();
      await confirmButton.click();
    }

    await expect(this.getAddressCard(fullName)).toHaveCount(0, {
      timeout: 20000
    });
  }

  async setDefaultAddress(fullName: string): Promise<void> {
    const card = this.getAddressCard(fullName);
    await expect(card).toBeVisible();

    if (await this.isAddressDefault(card)) {
      return;
    }

    const setDefaultButton = card.getByRole('link', {
      name: /^Set this address as default$/i
    });

    await expect(setDefaultButton).toBeVisible();
    await setDefaultButton.click();
    await expect.poll(
      () => this.isAddressDefault(this.getAddressCard(fullName)),
      { timeout: 20000 }
    ).toBe(true);
  }

  async getDefaultAddressCount(): Promise<number> {
    let defaultCount = 0;
    const cardCount = await this.addressCards.count();

    for (let index = 0; index < cardCount; index += 1) {
      if (await this.isAddressDefault(this.addressCards.nth(index))) {
        defaultCount += 1;
      }
    }

    return defaultCount;
  }

  async getDefaultAddressName(): Promise<string | null> {
    const cardCount = await this.addressCards.count();

    for (let index = 0; index < cardCount; index += 1) {
      const card = this.addressCards.nth(index);
      if (!(await this.isAddressDefault(card))) {
        continue;
      }

      const name = card.locator('h5').first();
      return (await name.textContent())?.trim() || null;
    }

    return null;
  }

  async verifyDefaultAddress(fullName: string): Promise<void> {
    const card = this.getAddressCard(fullName);
    await expect(card).toBeVisible();
    await expect(
      card.getByRole('img', { name: DEFAULT_ADDRESS_IMAGE_NAME })
    ).toBeVisible();
  }

  async expectFieldRejected(field: Locator): Promise<void> {
    await expect.poll(async () => {
      const nativeInvalid = await field.evaluate(element => {
        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
        ) {
          return !element.validity.valid;
        }

        return false;
      });

      return (
        nativeInvalid ||
        (await field.getAttribute('aria-invalid')) === 'true' ||
        (await this.validationErrors.count()) > 0
      );
    }, {
      timeout: 5000,
      message: 'Expected Amazon to reject the invalid address field'
    }).toBe(true);
  }

  async getMaximumLength(field: Locator): Promise<number> {
    const attribute = await field.getAttribute('maxlength');
    const maximumLength = Number(attribute);

    if (!attribute || !Number.isInteger(maximumLength) || maximumLength < 1) {
      throw new Error(
        `The address field does not expose a valid maxlength: ${attribute}`
      );
    }

    return maximumLength;
  }

  private async isAddressDefault(card: Locator): Promise<boolean> {
    return (
      (await card.getByText(DEFAULT_ADDRESS_MARKER, {
        exact: true
      }).filter({ visible: true }).count()) > 0 ||
      (await card.getByRole('img', {
        name: DEFAULT_ADDRESS_IMAGE_NAME
      }).filter({ visible: true }).count()) > 0
    );
  }

  private async assertAuthenticated(): Promise<void> {
    const cookies = await this.page.context().cookies(
      'https://www.amazon.in'
    );
    const hasSessionCookie = cookies.some(cookie =>
      AUTH_COOKIE_NAMES.has(cookie.name)
    );

    if (!hasSessionCookie) {
      throw new Error(
        'Amazon authentication cookies were not loaded. Run the auth-setup project to refresh the saved storage state.'
      );
    }

    const accountLabel = this.page.locator(
      '#nav-link-accountList-nav-line-1'
    );

    await expect(accountLabel).toBeVisible({
      timeout: 15000
    });
    await expect(accountLabel).not.toContainText(/sign in/i);
  }
}
