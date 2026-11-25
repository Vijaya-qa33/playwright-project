import { Browser, expect, Locator, Page, test } from '@playwright/test';
import path from 'node:path';
import { AddressData, AddressPage } from '../pages/AddressPage';
import { addressTestData } from '../utils/addressTestData';

const AUTH_STATE_FILE = path.resolve(
  process.cwd(),
  'playwright',
  '.auth',
  'amazon.json'
);

test.use({
  storageState: AUTH_STATE_FILE
});

let addressSequence = 0;
let createdAddressNames: string[] = [];
let originalDefaultAddressName: string | null = null;

function createAddressData(
  overrides: Partial<AddressData> = {}
): AddressData {
  addressSequence += 1;

  return {
    ...addressTestData,
    fullName: `${addressTestData.fullName} ${Date.now()}-${addressSequence}`,
    ...overrides
  };
}

function trackAddress(address: AddressData): AddressData {
  createdAddressNames.push(address.fullName);
  return address;
}

function replaceTrackedAddressName(
  oldName: string,
  newName: string
): void {
  createdAddressNames = [...new Set(createdAddressNames.map(name =>
    name === oldName ? newName : name
  ))];
}

async function submitAddressWithoutField(
  addressPage: AddressPage,
  address: AddressData,
  omittedField: keyof AddressData,
  field: Locator
): Promise<void> {
  await addressPage.openAddAddressForm();
  const formData = { ...address };
  delete formData[omittedField];
  await addressPage.fillAddress(formData);
  await addressPage.submitAddressForm();
  await addressPage.expectFieldRejected(field);
}

async function restoreTestAddresses(
  browser: Browser
): Promise<void> {
  if (createdAddressNames.length === 0 && !originalDefaultAddressName) {
    return;
  }

  const context = await browser.newContext({
    storageState: AUTH_STATE_FILE
  });

  try {
    const page = await context.newPage();
    const addressPage = new AddressPage(page);
    await addressPage.openAddressManagement();

    for (const fullName of createdAddressNames) {
      if (await addressPage.getAddressCard(fullName).count()) {
        await addressPage.deleteAddress(fullName);
      }
    }

    if (
      originalDefaultAddressName &&
      await addressPage.getAddressCard(originalDefaultAddressName).count()
    ) {
      await addressPage.setDefaultAddress(originalDefaultAddressName);
    }
  } finally {
    await context.close();
  }
}

test.describe('Amazon Address Module', () => {
  test.beforeEach(async ({ page }) => {
    createdAddressNames = [];

    const addressPage = new AddressPage(page);
    await addressPage.openAddressManagement();
    originalDefaultAddressName =
      await addressPage.getDefaultAddressName();
  });

  test.afterEach(async ({ browser }) => {
    await restoreTestAddresses(browser);
    createdAddressNames = [];
    originalDefaultAddressName = null;
  });

  test('TC_ADDR_001 - Verify user can open Address Management page', async ({ page }) => {
    const addressPage = new AddressPage(page);

    await addressPage.openAddressManagement();

    await expect(page).toHaveURL(/\/a\/addresses/i);
    await expect(addressPage.addAddressButton).toBeVisible();
  });

  test('TC_ADDR_002 - Verify user can add a new address with valid details', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData());

    await addressPage.addAddress(address);

    await addressPage.verifyAddressListed(address.fullName);
  });

  test('TC_ADDR_003 - Verify newly added address appears in address list', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData());

    await addressPage.addAddress(address);

    await expect(addressPage.getAddressCard(address.fullName)).toContainText(
      address.addressLine1
    );
  });

  test('TC_ADDR_004 - Verify user can add multiple addresses', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const firstAddress = trackAddress(createAddressData());
    const secondAddress = trackAddress(createAddressData({
      addressLine1: '2 Test Automation Avenue'
    }));

    await addressPage.addAddress(firstAddress);
    await addressPage.addAddress(secondAddress);

    await addressPage.verifyAddressListed(firstAddress.fullName);
    await addressPage.verifyAddressListed(secondAddress.fullName);
  });

  test('TC_ADDR_005 - Verify user can edit an existing address', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData());
    const updatedAddress = createAddressData({
      addressLine1: 'Updated Test Automation Street'
    });

    await addressPage.addAddress(address);
    trackAddress(updatedAddress);
    await addressPage.editAddress(address.fullName, updatedAddress);
    replaceTrackedAddressName(address.fullName, updatedAddress.fullName);

    await addressPage.verifyAddressListed(updatedAddress.fullName);
  });

  test('TC_ADDR_006 - Verify edited address displays updated information', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData());
    const updatedAddress = createAddressData({
      addressLine1: 'Updated Test Automation Road',
      city: 'Mysuru'
    });

    await addressPage.addAddress(address);
    trackAddress(updatedAddress);
    await addressPage.editAddress(address.fullName, updatedAddress);
    replaceTrackedAddressName(address.fullName, updatedAddress.fullName);

    await expect(addressPage.getAddressCard(updatedAddress.fullName))
      .toContainText(updatedAddress.addressLine1);
    await expect(addressPage.getAddressCard(updatedAddress.fullName))
      .toContainText(updatedAddress.city);
  });

  test('TC_ADDR_007 - Verify user can delete an address', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData());

    await addressPage.addAddress(address);
    await addressPage.deleteAddress(address.fullName);

    await expect(addressPage.getAddressCard(address.fullName)).toHaveCount(0);
  });

  test('TC_ADDR_008 - Verify deleted address no longer appears in address list', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData());

    await addressPage.addAddress(address);
    await addressPage.deleteAddress(address.fullName);

    await expect(addressPage.getAddressCard(address.fullName)).toHaveCount(0);
  });

  test('TC_ADDR_009 - Verify user can set an address as default', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData());

    await addressPage.addAddress(address);
    await addressPage.setDefaultAddress(address.fullName);

    await addressPage.verifyDefaultAddress(address.fullName);
  });

  test('TC_ADDR_010 - Verify only one address can be marked as default', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const firstAddress = trackAddress(createAddressData());
    const secondAddress = trackAddress(createAddressData({
      addressLine1: '2 Test Automation Avenue'
    }));

    await addressPage.addAddress(firstAddress);
    await addressPage.addAddress(secondAddress);
    await addressPage.setDefaultAddress(firstAddress.fullName);
    await addressPage.setDefaultAddress(secondAddress.fullName);

    expect(await addressPage.getDefaultAddressCount()).toBe(1);
    await addressPage.verifyDefaultAddress(secondAddress.fullName);
  });

  test('TC_ADDR_011 - Verify Full Name field is mandatory', async ({ page }) => {
    const addressPage = new AddressPage(page);

    await submitAddressWithoutField(
      addressPage,
      createAddressData(),
      'fullName',
      addressPage.fullNameField
    );
  });

  test('TC_ADDR_012 - Verify Mobile Number field is mandatory', async ({ page }) => {
    const addressPage = new AddressPage(page);

    await submitAddressWithoutField(
      addressPage,
      createAddressData(),
      'mobileNumber',
      addressPage.mobileNumberField
    );
  });

  test('TC_ADDR_013 - Verify Pincode field is mandatory', async ({ page }) => {
    const addressPage = new AddressPage(page);

    await submitAddressWithoutField(
      addressPage,
      createAddressData(),
      'pincode',
      addressPage.pincodeField
    );
  });

  test('TC_ADDR_014 - Verify Address Line field is mandatory', async ({ page }) => {
    const addressPage = new AddressPage(page);

    await submitAddressWithoutField(
      addressPage,
      createAddressData(),
      'addressLine1',
      addressPage.addressLine1Field
    );
  });

  test('TC_ADDR_015 - Verify invalid mobile number is rejected', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = createAddressData({
      mobileNumber: '12345'
    });

    await addressPage.openAddAddressForm();
    await addressPage.fillAddress(address);
    await addressPage.submitAddressForm();
    await addressPage.expectFieldRejected(addressPage.mobileNumberField);
  });

  test('TC_ADDR_016 - Verify invalid pincode is rejected', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = createAddressData({
      pincode: '12AB'
    });

    await addressPage.openAddAddressForm();
    await addressPage.fillAddress(address);
    await addressPage.submitAddressForm();
    await addressPage.expectFieldRejected(addressPage.pincodeField);
  });

  test('TC_ADDR_017 - Verify maximum character limit for Full Name', async ({ page }) => {
    const addressPage = new AddressPage(page);
    await addressPage.openAddAddressForm();

    const maximumLength = await addressPage.getMaximumLength(
      addressPage.fullNameField
    );
    const overLimitValue = 'N'.repeat(maximumLength + 1);

    await addressPage.fullNameField.pressSequentially(overLimitValue);

    await expect(addressPage.fullNameField).toHaveValue(
      'N'.repeat(maximumLength)
    );
  });

  test('TC_ADDR_018 - Verify maximum character limit for Address Line', async ({ page }) => {
    const addressPage = new AddressPage(page);
    await addressPage.openAddAddressForm();

    const maximumLength = await addressPage.getMaximumLength(
      addressPage.addressLine1Field
    );
    const overLimitValue = 'A'.repeat(maximumLength + 1);

    await addressPage.addressLine1Field.pressSequentially(overLimitValue);

    await expect(addressPage.addressLine1Field).toHaveValue(
      'A'.repeat(maximumLength)
    );
  });

  test('TC_ADDR_019 - Verify special characters handling in address fields', async ({ page }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData({
      addressLine1: '1 Test Street, Apt #4-B / Block A'
    }));

    await addressPage.addAddress(address);

    await expect(addressPage.getAddressCard(address.fullName))
      .toContainText(address.addressLine1);
  });

  test('TC_ADDR_020 - Verify address persists after logout and login', async ({ page, browser, context }) => {
    const addressPage = new AddressPage(page);
    const address = trackAddress(createAddressData());

    await addressPage.addAddress(address);
    await context.clearCookies();
    await page.goto('https://www.amazon.in/a/addresses', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await expect(page).toHaveURL(/\/ap\/signin/i, {
      timeout: 20000
    });

    const reauthenticatedContext = await browser.newContext({
      storageState: AUTH_STATE_FILE
    });

    try {
      const reauthenticatedPage = await reauthenticatedContext.newPage();
      const reauthenticatedAddressPage =
        new AddressPage(reauthenticatedPage);

      await reauthenticatedAddressPage.openAddressManagement();
      await reauthenticatedAddressPage.verifyAddressListed(address.fullName);
    } finally {
      await reauthenticatedContext.close();
    }
  });
});
