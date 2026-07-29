const params = new URLSearchParams(window.location.search);
const appMode = params.get("mode") === "test" ? "test" : "live";

const state = {
  catalog: null,
  orders: [],
  vouchers: [],
  integrations: null,
  health: null,
  catalogDirty: false
};

const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const saveCatalogButton = document.getElementById("saveCatalogButton");
const saveIntegrationsButton = document.getElementById("saveIntegrationsButton");
const testWhatsappTemplatesButton = document.getElementById("testWhatsappTemplatesButton");
const inspectWhatsappTemplatesButton = document.getElementById("inspectWhatsappTemplatesButton");
const whatsappTemplateTestResults = document.getElementById("whatsappTemplateTestResults");
const addProductButton = document.getElementById("addProductButton");
const addCategoryButton = document.getElementById("addCategoryButton");
const addStorySlideButton = document.getElementById("addStorySlideButton");
const adminLogoutButton = document.getElementById("adminLogoutButton");
const adminStatus = document.getElementById("adminStatus");
const adminPageEyebrow = document.getElementById("adminPageEyebrow");
const adminPageTitle = document.getElementById("adminPageTitle");
const adminMain = document.querySelector(".admin-main");
const storefrontPreviewPanel = document.getElementById("storefrontPreviewPanel");
const storefrontPreviewFrame = document.getElementById("storefrontPreviewFrame");
const storefrontPreviewViewport = document.getElementById("storefrontPreviewViewport");
const storefrontPublishState = document.getElementById("storefrontPublishState");
const adminLoginPanel = document.getElementById("adminLoginPanel");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminLoginButton = document.getElementById("adminLoginButton");
const categoryList = document.getElementById("categoryList");
const productList = document.getElementById("productList");
const adminOrderList = document.getElementById("adminOrderList");
const refreshOrdersButton = document.getElementById("refreshOrdersButton");
const reportPeriodSelect = document.getElementById("reportPeriodSelect");
const exportCustomersButton = document.getElementById("exportCustomersButton");
const downloadReportPdfButton = document.getElementById("downloadReportPdfButton");
const printReportButton = document.getElementById("printReportButton");
const voucherList = document.getElementById("voucherList");
const addVoucherButton = document.getElementById("addVoucherButton");
const saveVouchersButton = document.getElementById("saveVouchersButton");
const adminSectionSelect = document.getElementById("adminSectionSelect");
const adminNavButtons = document.querySelectorAll("[data-admin-target]");
const adminSections = document.querySelectorAll("[data-admin-section]");
const storefrontStudioSections = new Set(["store", "promo", "story", "categories", "catalog", "checkout-page", "orders-page", "addresses-page", "invoice-page"]);
const pageEditorSections = new Set(["checkout-page", "orders-page", "addresses-page", "invoice-page", "terms-page", "privacy-page"]);
const catalogActionSections = new Set([...storefrontStudioSections, "operations-settings", ...pageEditorSections]);
const liveTestStorageKey = "bakeaholic-admin-live-tests-20260724";
const sectionHeadings = {
  dashboard: ["Bakeaholic Operations", "Good decisions start here."],
  store: ["Storefront", "Business settings"],
  "operations-settings": ["Operations", "Checkout and business rules"],
  "checkout-page": ["Pages", "Checkout"],
  "orders-page": ["Pages", "Order history"],
  "addresses-page": ["Pages", "Your addresses"],
  "invoice-page": ["Pages", "Invoice"],
  "terms-page": ["Pages", "Terms and Conditions"],
  "privacy-page": ["Pages", "Privacy Policy"],
  promo: ["Storefront", "Promo spotlight"],
  orders: ["Operations", "Orders and fulfilment"],
  reports: ["Commerce intelligence", "Sales and customer reports"],
  discounts: ["Commerce", "Discount codes"],
  story: ["Homepage", "Story carousel"],
  categories: ["Catalog", "Product categories"],
  catalog: ["Catalog", "Products and stock"],
  integrations: ["System", "Connected services"],
  documentation: ["Knowledge base", "How Bakeaholic works"]
};

const storeFields = {
  name: document.getElementById("storeName"),
  logoPath: document.getElementById("storeLogoPathInput"),
  logoScale: document.getElementById("storeLogoScaleInput"),
  logoOffsetX: document.getElementById("storeLogoPositionXInput"),
  logoOffsetY: document.getElementById("storeLogoPositionYInput"),
  orderWhatsapp: document.getElementById("orderWhatsapp"),
  eyebrow: document.getElementById("storeEyebrowInput"),
  perkLabel: document.getElementById("perkLabelInput"),
  footerLogoPath: document.getElementById("footerLogoPathInput"),
  footerLogoScale: document.getElementById("footerLogoScaleInput"),
  footerLogoOffsetX: document.getElementById("footerLogoPositionXInput"),
  footerLogoOffsetY: document.getElementById("footerLogoPositionYInput"),
  footerTagline: document.getElementById("footerTaglineInput"),
  footerContactLabel: document.getElementById("footerContactLabelInput"),
  termsLabel: document.getElementById("termsLabelInput"),
  privacyLabel: document.getElementById("privacyLabelInput"),
  instagramUrl: document.getElementById("instagramUrlInput"),
  termsUrl: document.getElementById("termsUrlInput"),
  privacyUrl: document.getElementById("privacyUrlInput"),
  deliveryFee: document.getElementById("deliveryFeeInput"),
  taxRate: document.getElementById("taxRateInput"),
  addressLabel: document.getElementById("addressLabelInput"),
  defaultAddress: document.getElementById("defaultAddressInput"),
  kitchenAddress: document.getElementById("kitchenAddressInput"),
  kitchenLat: document.getElementById("kitchenLatInput"),
  kitchenLng: document.getElementById("kitchenLngInput"),
  pickupAddress: document.getElementById("pickupAddressInput"),
  pickupDescription: document.getElementById("pickupDescriptionInput"),
  whatsappPrompt: document.getElementById("whatsappPromptInput"),
  testModeTitle: document.getElementById("testModeTitleInput"),
  testModeDescription: document.getElementById("testModeDescriptionInput"),
  businessHoursOpen: document.getElementById("businessHoursOpenInput"),
  businessHoursClose: document.getElementById("businessHoursCloseInput"),
  businessHoursTimezone: document.getElementById("businessHoursTimezoneInput"),
  searchPlaceholder: document.getElementById("searchPlaceholderInput"),
  searchIconStyle: document.getElementById("searchIconStyleInput"),
  cartIconStyle: document.getElementById("cartIconStyleInput"),
  cartButtonLabel: document.getElementById("cartButtonLabelInput"),
  loginIconStyle: document.getElementById("loginIconStyleInput"),
  loginButtonLabel: document.getElementById("loginButtonLabelInput"),
  momentGuideKicker: document.getElementById("momentGuideKickerInput"),
  momentGuideTitle: document.getElementById("momentGuideTitleInput"),
  momentCard0Label: document.getElementById("momentCard0LabelInput"),
  momentCard1Label: document.getElementById("momentCard1LabelInput"),
  momentCard2Label: document.getElementById("momentCard2LabelInput"),
  momentCard3Label: document.getElementById("momentCard3LabelInput"),
  checkoutPageTitle: document.getElementById("checkoutPageTitleInput"),
  checkoutPageSubtitle: document.getElementById("checkoutPageSubtitleInput"),
  checkoutCustomerTitle: document.getElementById("checkoutCustomerTitleInput"),
  checkoutPaymentTitleText: document.getElementById("checkoutPaymentTitleTextInput"),
  checkoutSubmitLabel: document.getElementById("checkoutSubmitLabelInput"),
  checkoutSummaryTitle: document.getElementById("checkoutSummaryTitleInput"),
  ordersPageTitle: document.getElementById("ordersPageTitleInput"),
  ordersPageSubtitle: document.getElementById("ordersPageSubtitleInput"),
  ordersIdHeading: document.getElementById("ordersIdHeadingInput"),
  ordersTotalHeading: document.getElementById("ordersTotalHeadingInput"),
  ordersStatusHeading: document.getElementById("ordersStatusHeadingInput"),
  ordersViewLabel: document.getElementById("ordersViewLabelInput"),
  ordersEmptyTitle: document.getElementById("ordersEmptyTitleInput"),
  ordersEmptyCopy: document.getElementById("ordersEmptyCopyInput"),
  addressesPageTitle: document.getElementById("addressesPageTitleInput"),
  addressesPageSubtitle: document.getElementById("addressesPageSubtitleInput"),
  addressesAddLabel: document.getElementById("addressesAddLabelInput"),
  addressesDefaultLabel: document.getElementById("addressesDefaultLabelInput"),
  addressesEmptyTitle: document.getElementById("addressesEmptyTitleInput"),
  addressesEmptyCopy: document.getElementById("addressesEmptyCopyInput"),
  invoicePageLabel: document.getElementById("invoicePageLabelInput"),
  invoiceFooterNote: document.getElementById("invoiceFooterNoteInput"),
  invoiceCustomerHeading: document.getElementById("invoiceCustomerHeadingInput"),
  invoiceAddressHeading: document.getElementById("invoiceAddressHeadingInput"),
  invoicePaymentHeading: document.getElementById("invoicePaymentHeadingInput"),
  invoiceOrderHeading: document.getElementById("invoiceOrderHeadingInput"),
  invoiceItemHeading: document.getElementById("invoiceItemHeadingInput"),
  invoiceQuantityHeading: document.getElementById("invoiceQuantityHeadingInput"),
  invoicePriceHeading: document.getElementById("invoicePriceHeadingInput"),
  invoiceTotalHeading: document.getElementById("invoiceTotalHeadingInput"),
  invoiceTotalPaidLabel: document.getElementById("invoiceTotalPaidLabelInput"),
  termsPageTitle: document.getElementById("termsPageTitleInput"),
  termsEffectiveDate: document.getElementById("termsEffectiveDateInput"),
  termsIntro: document.getElementById("termsIntroInput"),
  termsPoints: document.getElementById("termsPointsInput"),
  privacyPageTitle: document.getElementById("privacyPageTitleInput"),
  privacyEffectiveDate: document.getElementById("privacyEffectiveDateInput"),
  privacyIntro: document.getElementById("privacyIntroInput"),
  privacyPoints: document.getElementById("privacyPointsInput")
};
const numericStoreFields = new Set(["deliveryFee", "taxRate", "kitchenLat", "kitchenLng", "logoScale", "logoOffsetX", "logoOffsetY", "footerLogoScale", "footerLogoOffsetX", "footerLogoOffsetY"]);
const storeFieldDefaults = {
  logoScale: 100,
  logoOffsetX: 0,
  logoOffsetY: 0,
  footerLogoScale: 100,
  footerLogoOffsetX: 0,
  footerLogoOffsetY: 0,
  footerTagline: "Bali's original packaged treats and wholesome snacks.",
  footerContactLabel: "CONTACT US",
  termsLabel: "Terms and Conditions",
  privacyLabel: "Privacy Policy",
  searchPlaceholder: "Search products...",
  searchIconStyle: "magnifier",
  cartIconStyle: "cart",
  cartButtonLabel: "Open cart",
  loginIconStyle: "person",
  loginButtonLabel: "Login or open account",
  momentGuideKicker: "Shop by Category",
  momentGuideTitle: "Pick the snack for what you need today.",
  momentCard0Label: "Sweet craving",
  momentCard1Label: "Coffee break",
  momentCard2Label: "Morning pantry",
  momentCard3Label: "Kids favorite",
  checkoutPageTitle: "Checkout",
  checkoutPageSubtitle: "Complete your delivery and payment details.",
  checkoutCustomerTitle: "Customer details",
  checkoutPaymentTitleText: "Choose payment method",
  checkoutSubmitLabel: "Continue to payment",
  checkoutSummaryTitle: "Order summary",
  ordersPageTitle: "Your Orders",
  ordersPageSubtitle: "Track your recent purchases and open full order details any time.",
  ordersIdHeading: "Purchase ID",
  ordersTotalHeading: "Total price",
  ordersStatusHeading: "Status",
  ordersViewLabel: "View Order",
  ordersEmptyTitle: "No orders yet.",
  ordersEmptyCopy: "Your completed and cancelled orders will appear here.",
  addressesPageTitle: "Your Addresses",
  addressesPageSubtitle: "Choose a default delivery address or save another one for future orders.",
  addressesAddLabel: "+ Add new",
  addressesDefaultLabel: "Default",
  addressesEmptyTitle: "No saved addresses yet.",
  addressesEmptyCopy: "Add your first delivery address and we’ll remember it for next time.",
  invoicePageLabel: "Invoice / Receipt",
  invoiceFooterNote: "Use this invoice for delivery handoff and customer payment receipt.",
  invoiceCustomerHeading: "Customer",
  invoiceAddressHeading: "Your address",
  invoicePaymentHeading: "Payment",
  invoiceOrderHeading: "Order",
  invoiceItemHeading: "Item",
  invoiceQuantityHeading: "Qty",
  invoicePriceHeading: "Price",
  invoiceTotalHeading: "Total",
  invoiceTotalPaidLabel: "Total paid",
  termsPageTitle: "Terms and Conditions",
  termsEffectiveDate: "April 21, 2026",
  termsIntro: "By placing an order with Bakeaholic Bali, you agree to these terms. Orders are subject to product availability, delivery availability, payment confirmation, and address accuracy.",
  termsPoints: "Order confirmation: Orders are confirmed after checkout and payment instructions are generated.\nDelivery: Delivery fees are estimated from your pinned map location and may change if the address is incorrect or incomplete.\nPayments: Orders must be paid through the approved payment methods shown at checkout.\nOrder issues: Missing, incorrect, or damaged items should be reported within 24 hours after delivery.\nCancellations: Orders may be cancelled before payment or before fulfilment begins. Paid orders may require manual review before refund or replacement.\nCustomer conduct: Customers are expected to provide accurate contact and delivery details.",
  privacyPageTitle: "Privacy Policy",
  privacyEffectiveDate: "April 21, 2026",
  privacyIntro: "We collect the information needed to process your order, including name, WhatsApp number, delivery address, map pin, order notes, and payment status. We use this information only for order processing, delivery coordination, customer support, and service improvement.",
  privacyPoints: "Data collection: We collect contact, delivery, order, and payment-status information.\nData use: Your information is used to process orders, estimate delivery, confirm payment, and provide support.\nData sharing: Delivery and payment information may be shared with service providers such as payment gateways, courier partners, and WhatsApp messaging tools when needed to fulfil your order.\nData protection: We take reasonable steps to protect customer information from unauthorized access or misuse.\nCustomer support: For privacy or order questions, contact us through the WhatsApp link on the site."
};
const operationsSettingsGrid = document.getElementById("operationsSettingsGrid");
document.querySelectorAll("[data-operation-field]").forEach((field) => operationsSettingsGrid?.appendChild(field));
const headerSettingsGrid = document.getElementById("headerSettingsGrid");
["storeName", "storeLogoPathInput", "searchIconStyleInput", "searchPlaceholderInput", "cartIconStyleInput", "cartButtonLabelInput", "loginIconStyleInput", "loginButtonLabelInput"].forEach((id) => {
  const field = document.getElementById(id)?.closest(".admin-field");
  if (field) headerSettingsGrid?.appendChild(field);
});
const footerSettingsGrid = document.getElementById("footerSettingsGrid");
["footerLogoPathInput", "footerTaglineInput", "footerContactLabelInput", "orderWhatsapp", "instagramUrlInput", "termsUrlInput", "termsLabelInput", "privacyUrlInput", "privacyLabelInput"].forEach((id) => {
  const field = document.getElementById(id)?.closest(".admin-field");
  if (field) footerSettingsGrid?.appendChild(field);
});
const storySection = document.querySelector('[data-admin-section="story"]');
const shopByCategoryEditor = document.getElementById("shopByCategoryEditor");
if (storySection && shopByCategoryEditor) storySection.appendChild(shopByCategoryEditor);
const kitchenMapElements = {
  search: document.getElementById("kitchenMapSearchInput"),
  map: document.getElementById("kitchenLocationMap"),
  status: document.getElementById("kitchenMapStatus"),
  openLink: document.getElementById("openKitchenMapLink")
};
const kitchenMapState = {
  map: null,
  marker: null,
  geocoder: null,
  autocomplete: null,
  mapsApi: null
};
let adminGoogleMapsLoaderPromise;

const promoFields = {
  itemId: document.getElementById("promoItemId"),
  buttonLabel: document.getElementById("promoButtonLabel"),
  kicker: document.getElementById("promoKickerInput")
};

const brandStorySlideList = document.getElementById("brandStorySlideList");
const storyIconOptions = [
  { value: "oats", label: "Oats" },
  { value: "coconut", label: "Coconut" },
  { value: "cashew", label: "Cashew" },
  { value: "gift", label: "Gift" },
  { value: "leaf", label: "Leaf" },
  { value: "batch", label: "Small batch" },
  { value: "spoon", label: "Flavor spoon" },
  { value: "pack", label: "Retail pack" },
  { value: "cart", label: "Online order" },
  { value: "cup", label: "Cafe" },
  { value: "boxes", label: "Wholesale" }
  ,{ value: "heart", label: "Favorite" }
  ,{ value: "star", label: "Quality" }
  ,{ value: "home", label: "Homemade" }
  ,{ value: "truck", label: "Delivery" }
  ,{ value: "sparkle", label: "New" }
];

const integrationFields = {
  googleMapsApiKey: document.getElementById("googleMapsApiKeyInput"),
  biteshipApiKey: document.getElementById("biteshipApiKeyInput"),
  biteshipCouriers: document.getElementById("biteshipCouriersInput"),
  biteshipWebhookHeaderName: document.getElementById("biteshipWebhookHeaderNameInput"),
  biteshipWebhookHeaderSecret: document.getElementById("biteshipWebhookHeaderSecretInput"),
  xenditEnvironment: document.getElementById("xenditEnvironmentInput"),
  xenditSecretKey: document.getElementById("xenditSecretKeyInput"),
  xenditCallbackToken: document.getElementById("xenditCallbackTokenInput"),
  whatsappAccessToken: document.getElementById("whatsappAccessTokenInput"),
  whatsappPhoneNumberId: document.getElementById("whatsappPhoneNumberIdInput"),
  whatsappBusinessAccountId: document.getElementById("whatsappBusinessAccountIdInput"),
  whatsappVerifyToken: document.getElementById("whatsappVerifyTokenInput"),
  whatsappAppId: document.getElementById("whatsappAppIdInput"),
  whatsappAppSecret: document.getElementById("whatsappAppSecretInput"),
  whatsappGraphVersion: document.getElementById("whatsappGraphVersionInput"),
  whatsappOtpTemplateName: document.getElementById("whatsappOtpTemplateNameInput"),
  whatsappOrderTemplateName: document.getElementById("whatsappOrderTemplateNameInput"),
  whatsappReceiptTemplateName: document.getElementById("whatsappReceiptTemplateNameInput"),
  whatsappPaymentReminderTemplateName: document.getElementById("whatsappPaymentReminderTemplateNameInput"),
  whatsappPaymentExpiredTemplateName: document.getElementById("whatsappPaymentExpiredTemplateNameInput"),
  whatsappShippingTemplateName: document.getElementById("whatsappShippingTemplateNameInput"),
  whatsappAdminNumber: document.getElementById("whatsappAdminNumberInput"),
  whatsappAdminNumber2: document.getElementById("whatsappAdminNumber2Input"),
  whatsappAdminNumber3: document.getElementById("whatsappAdminNumber3Input"),
  whatsappAdminTemplateName: document.getElementById("whatsappAdminTemplateNameInput"),
  whatsappAdminShippingTemplateName: document.getElementById("whatsappAdminShippingTemplateNameInput"),
  whatsappTemplateLanguage: document.getElementById("whatsappTemplateLanguageInput")
};
const secretIntegrationKeys = new Set([
  "googleMapsApiKey",
  "biteshipApiKey",
  "biteshipWebhookHeaderSecret",
  "xenditSecretKey",
  "xenditCallbackToken",
  "whatsappAccessToken",
  "whatsappVerifyToken",
  "whatsappAppSecret"
]);

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      "X-App-Mode": appMode
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.error || `Request failed: ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return response.json();
}

async function ensureAdminSession() {
  try {
    await request("/api/admin/session");
    adminLoginPanel.hidden = true;
    return;
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }
  }

  adminLoginPanel.hidden = false;
  adminPasswordInput.focus();
  setStatus("Enter the admin password to continue.");

  await new Promise((resolve) => {
    adminLoginForm.onsubmit = async (event) => {
      event.preventDefault();
      const password = adminPasswordInput.value.trim();
      if (!password) {
        setStatus("Please enter the admin password.");
        return;
      }

      adminLoginButton.disabled = true;
      setStatus("Checking admin password...");
      try {
        await request("/api/admin/login", {
          method: "POST",
          body: JSON.stringify({ password })
        });
        adminPasswordInput.value = "";
        adminLoginPanel.hidden = true;
        resolve();
      } catch (error) {
        adminLoginButton.disabled = false;
        setStatus(error.message);
      }
    };
  });

  adminLoginButton.disabled = false;
  setStatus("Admin login successful. Session lasts 15 minutes.");
}

async function logoutAdmin() {
  try {
    await request("/api/admin/logout", {
      method: "POST"
    });
    setStatus("Logged out. Reloading admin login...");
    window.location.reload();
  } catch (error) {
    setStatus(error.message);
  }
}

function setStatus(message) {
  adminStatus.textContent = message;
}

function showAdminSection(sectionName) {
  const isStorefrontStudio = storefrontStudioSections.has(sectionName);
  const isCatalogEditor = catalogActionSections.has(sectionName);
  adminSections.forEach((section) => {
    section.hidden = section.dataset.adminSection !== sectionName;
  });
  adminNavButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminTarget === sectionName);
  });
  saveCatalogButton.hidden = !isCatalogEditor || !state.catalogDirty;
  storefrontPublishState.hidden = !isCatalogEditor;
  storefrontPreviewPanel.hidden = !isStorefrontStudio;
  adminMain.classList.toggle("is-storefront-studio", isStorefrontStudio);
  if (isStorefrontStudio && !adminMain.classList.contains("is-desktop-preview")) {
    adminMain.classList.add("is-mobile-preview");
  }
  if (!isStorefrontStudio) {
    adminMain.classList.remove("is-desktop-preview");
  }
  addProductButton.hidden = sectionName !== "catalog";
  if (adminSectionSelect) {
    adminSectionSelect.value = sectionName;
  }
  if (isStorefrontStudio) ensurePreviewPage(sectionName);
  const heading = sectionHeadings[sectionName] || sectionHeadings.dashboard;
  if (adminPageEyebrow) adminPageEyebrow.textContent = heading[0];
  if (adminPageTitle) adminPageTitle.textContent = heading[1];
  window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}#${sectionName}`);
  if (sectionName === "orders") {
    loadOrders();
  }
  if (sectionName === "reports") {
    renderReports();
  }
  if (sectionName === "dashboard") {
    renderDashboard();
  }
  if (sectionName === "store" && kitchenMapState.mapsApi && kitchenMapState.map) {
    window.setTimeout(() => {
      kitchenMapState.mapsApi.event.trigger(kitchenMapState.map, "resize");
      syncKitchenMapFromFields();
    }, 0);
  }
  if (isStorefrontStudio) window.setTimeout(() => focusStorefrontPreview(sectionName), 120);
}

function updatePublishState() {
  if (!storefrontPublishState) return;
  storefrontPublishState.classList.toggle("has-changes", state.catalogDirty);
  storefrontPublishState.innerHTML = state.catalogDirty
    ? "<span></span>Unpublished changes"
    : "<span></span>All changes published";
  saveCatalogButton.textContent = "Publish changes";
  const sectionName = adminSectionSelect?.value || "";
  saveCatalogButton.hidden = !catalogActionSections.has(sectionName) || !state.catalogDirty;
  saveCatalogButton.disabled = false;
}

function markCatalogDirty(syncPreview = true) {
  if (!state.catalogDirty) {
    state.catalogDirty = true;
    updatePublishState();
    setStatus("Draft preview updated. Publish when you are ready.");
  }
  if (syncPreview) scheduleDraftPreview();
}

function refreshStorefrontPreview() {
  if (!storefrontPreviewFrame) return;
  const sectionName = adminSectionSelect?.value || "store";
  const url = new URL(previewPathForSection(sectionName), window.location.origin);
  url.searchParams.set("admin-preview", String(Date.now()));
  storefrontPreviewFrame.src = url.toString();
}

function previewPathForSection(sectionName) {
  return {
    "checkout-page": "/cart.html",
    "orders-page": "/orders.html",
    "addresses-page": "/addresses.html",
    "invoice-page": "/invoice.html"
  }[sectionName] || "/index.html";
}

function ensurePreviewPage(sectionName) {
  if (!storefrontPreviewFrame) return;
  const desiredPath = previewPathForSection(sectionName);
  const pageNames = {
    "checkout-page": "Checkout",
    "orders-page": "Order history",
    "addresses-page": "Your addresses",
    "invoice-page": "Invoice"
  };
  const pageName = pageNames[sectionName];
  const editorLabel = document.getElementById("previewEditorLabel");
  const editorTitle = document.getElementById("previewEditorTitle");
  const openLink = document.getElementById("previewOpenLink");
  if (editorLabel) editorLabel.textContent = pageName ? "Page editor" : "Storefront editor";
  if (editorTitle) editorTitle.textContent = pageName ? `${pageName} draft preview` : "Draft preview";
  if (openLink) {
    openLink.href = desiredPath;
    openLink.textContent = `Open ${pageName || "storefront"} ↗`;
  }
  try {
    if (new URL(storefrontPreviewFrame.src, window.location.origin).pathname === desiredPath) return;
  } catch (_error) {
    // Replace an invalid or incomplete preview URL below.
  }
  const url = new URL(desiredPath, window.location.origin);
  url.searchParams.set("admin-preview", String(Date.now()));
  storefrontPreviewFrame.src = url.toString();
}

function collectCatalogDraft() {
  return {
    store: collectStore(),
    promo: collectPromo(),
    brandStory: collectBrandStory(),
    categories: collectCategories(),
    items: collectProducts()
  };
}

let draftPreviewTimer = 0;

function sendDraftPreview() {
  if (!storefrontPreviewFrame?.contentWindow || !state.catalog) return;
  storefrontPreviewFrame.contentWindow.postMessage({
    type: "bakeaholic:catalog-preview",
    catalog: collectCatalogDraft()
  }, window.location.origin);
  window.setTimeout(() => focusStorefrontPreview(adminSectionSelect?.value || "store"), 60);
}

function scheduleDraftPreview() {
  window.clearTimeout(draftPreviewTimer);
  draftPreviewTimer = window.setTimeout(sendDraftPreview, 220);
}

function focusStorefrontPreview(sectionName, itemIndex = 0, field = "") {
  if (["checkout-page", "orders-page", "addresses-page", "invoice-page"].includes(sectionName) && storefrontPreviewFrame?.contentDocument) {
    const selectors = {
      checkoutPageTitleInput: "#checkoutPageTitle",
      checkoutPageSubtitleInput: "#checkoutPageSubtitle",
      checkoutCustomerTitleInput: "#checkoutCustomerTitle",
      checkoutPaymentTitleTextInput: "#checkoutPaymentTitle",
      checkoutSubmitLabelInput: "#submitOrderButton",
      checkoutSummaryTitleInput: "#checkoutSummaryTitle",
      ordersPageTitleInput: ".account-page-hero h1",
      ordersPageSubtitleInput: ".account-page-copy",
      ordersIdHeadingInput: ".orders-table-head span:nth-child(1)",
      ordersTotalHeadingInput: ".orders-table-head span:nth-child(2)",
      ordersStatusHeadingInput: ".orders-table-head span:nth-child(3)",
      ordersViewLabelInput: ".order-row-actions a",
      ordersEmptyTitleInput: ".account-empty-state strong",
      ordersEmptyCopyInput: ".account-empty-state p",
      addressesPageTitleInput: ".account-page-hero h1",
      addressesPageSubtitleInput: ".account-page-copy",
      addressesAddLabelInput: "#addAddressButton",
      addressesDefaultLabelInput: ".default-tag",
      addressesEmptyTitleInput: ".account-empty-state strong",
      addressesEmptyCopyInput: ".account-empty-state p",
      invoicePageLabelInput: ".invoice-title-row .eyebrow",
      invoiceCustomerHeadingInput: ".invoice-grid > div:nth-child(1) h2",
      invoiceAddressHeadingInput: ".invoice-grid > div:nth-child(2) h2",
      invoicePaymentHeadingInput: ".invoice-grid > div:nth-child(3) h2",
      invoiceOrderHeadingInput: ".invoice-grid > div:nth-child(4) h2",
      invoiceItemHeadingInput: ".invoice-table th:nth-child(1)",
      invoiceQuantityHeadingInput: ".invoice-table th:nth-child(2)",
      invoicePriceHeadingInput: ".invoice-table th:nth-child(3)",
      invoiceTotalHeadingInput: ".invoice-table th:nth-child(4)",
      invoiceTotalPaidLabelInput: ".invoice-grand-total span",
      invoiceFooterNoteInput: ".invoice-note"
    };
    const doc = storefrontPreviewFrame.contentDocument;
    doc.querySelectorAll("[data-admin-page-highlight]").forEach((element) => {
      element.style.outline = "";
      element.style.outlineOffset = "";
      element.removeAttribute("data-admin-page-highlight");
    });
    const selector = selectors[field];
    const element = selector ? doc.querySelector(selector) : null;
    if (element) {
      element.setAttribute("data-admin-page-highlight", "true");
      element.style.outline = "1px solid #b86f3f";
      element.style.outlineOffset = "3px";
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }
  const productCard = productList?.querySelector(`[data-product-index="${itemIndex}"]`);
  storefrontPreviewFrame?.contentWindow?.postMessage({
    type: "bakeaholic:preview-focus",
    section: sectionName,
    itemIndex,
    field,
    itemId: productCard?.querySelector('[data-product-field="id"]')?.value || ""
  }, window.location.origin);
}

function previewFocusDetails(target) {
  const section = target?.closest?.("[data-admin-section]")?.dataset.adminSection || adminSectionSelect?.value || "store";
  const storyCard = target?.closest?.("[data-story-slide-index]");
  const productCard = target?.closest?.("[data-product-index]");
  const categoryCard = target?.closest?.("[data-category-index]");
  const field = target?.dataset?.storyField
    || (target?.dataset?.storyPointLabel !== undefined ? `point-label-${target.dataset.storyPointLabel}` : "")
    || (target?.dataset?.storyPointIcon !== undefined ? `point-icon-${target.dataset.storyPointIcon}` : "")
    || target?.dataset?.productField
    || target?.dataset?.categoryField
    || target?.id
    || "";
  return {
    section,
    itemIndex: Number(storyCard?.dataset.storySlideIndex ?? productCard?.dataset.productIndex ?? categoryCard?.dataset.categoryIndex ?? 0),
    field
  };
}

function dashboardAttentionItems() {
  const items = [];
  state.orders.forEach((order) => {
    if (order.status === "paid") {
      items.push({ tone: "pending", title: `${order.id} is paid and waiting`, detail: "Prepare the package, print the invoice, then approve delivery." });
    }
    if (["delivery_issue", "delivery_failed", "returned"].includes(order.status)) {
      items.push({ tone: "danger", title: `${order.id} has a delivery issue`, detail: "Review Biteship status before contacting the customer." });
    }
    if (["manual_required", "failed"].includes(order.refund?.status)) {
      items.push({ tone: "danger", title: `${order.id} needs refund attention`, detail: order.refund?.message || "Review this refund in Xendit." });
    }
    const messageErrors = [
      order.whatsappNotificationError,
      order.whatsappShippingNotificationError,
      order.adminWhatsappNotificationError,
      order.adminWhatsappShippingNotificationError
    ].filter(Boolean);
    const recipientDeliveryError = (order.adminWhatsappNotifications?.recipients || [])
      .find((recipient) => recipient.deliveryStatus === "failed")?.deliveryError;
    if (recipientDeliveryError) messageErrors.push(recipientDeliveryError);
    if (messageErrors.length) {
      items.push({ tone: "danger", title: `${order.id} has a WhatsApp failure`, detail: messageErrors[0] });
    }
  });
  return items;
}

function configuredIntegrationHealth() {
  const integrations = state.integrations || {};
  return [
    { name: "Xendit live payments", ok: integrations.xenditEnvironment === "live" && Boolean(integrations.xenditSecretKey), note: integrations.xenditEnvironment === "live" ? "Live mode" : "Not in live mode" },
    { name: "WhatsApp Cloud API", ok: Boolean(integrations.whatsappAccessToken && integrations.whatsappPhoneNumberId), note: "Customer and admin notifications" },
    { name: "Biteship delivery", ok: Boolean(integrations.biteshipApiKey), note: "Quotes, courier booking and tracking" },
    { name: "Google Maps", ok: Boolean(integrations.googleMapsApiKey), note: "Address validation and pickup pin" },
    { name: "Cloudflare protection", ok: true, note: "TLS, WAF and Admin challenge active" }
  ];
}

function renderDashboard() {
  if (!state.catalog) return;
  const attentionItems = dashboardAttentionItems();
  const openStatuses = new Set(["paid", "preparing", "on_delivery", "shipped", "delivery_issue"]);
  const openOrders = state.orders.filter((order) => openStatuses.has(order.status));
  const lowStock = (state.catalog.items || []).filter((item) => Number(item.stock || 0) <= 5);
  const health = configuredIntegrationHealth();
  const healthyCount = health.filter((item) => item.ok).length;

  document.getElementById("dashboardAttentionCount").textContent = String(attentionItems.length);
  document.getElementById("dashboardAttentionSummary").textContent = attentionItems.length
    ? "Review these items before routine work"
    : "No operational blockers detected";
  document.getElementById("dashboardOpenOrdersCount").textContent = String(openOrders.length);
  document.getElementById("dashboardLowStockCount").textContent = String(lowStock.length);
  document.getElementById("dashboardSystemStatus").textContent = healthyCount === health.length ? "Healthy" : `${healthyCount}/${health.length}`;
  document.getElementById("dashboardSystemSummary").textContent = healthyCount === health.length
    ? "All required services are configured"
    : "One or more services needs configuration";

  const priorityList = document.getElementById("dashboardPriorityList");
  priorityList.innerHTML = attentionItems.length
    ? attentionItems.slice(0, 6).map((item) => `
      <div class="admin-priority-item is-${item.tone}">
        <span class="admin-priority-dot"></span>
        <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></div>
      </div>
    `).join("")
    : `<div class="admin-dashboard-clear"><span>✓</span><div><strong>Nothing urgent</strong><small>Payments, delivery, refunds and messages have no recorded blockers.</small></div></div>`;

  document.getElementById("dashboardHealthList").innerHTML = health.map((item) => `
    <div class="admin-health-row">
      <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.note)}</small></div>
      <span class="admin-health-state ${item.ok ? "is-good" : "is-warning"}">${item.ok ? "Ready" : "Check"}</span>
    </div>
  `).join("");
}

async function runSystemCheck() {
  const button = document.getElementById("runSystemCheckButton");
  try {
    button.disabled = true;
    button.textContent = "Checking…";
    const [xendit, whatsapp, securityResponse] = await Promise.all([
      request("/api/admin/xendit-health").catch((error) => ({ ok: false, error: error.message })),
      request("/api/admin/whatsapp-health").catch((error) => ({ ok: false, error: error.message })),
      fetch("/.well-known/security.txt", { cache: "no-store" }).then((response) => ({ ok: response.ok })).catch(() => ({ ok: false }))
    ]);
    state.health = { xendit, whatsapp, security: securityResponse };
    const failures = [
      !xendit.ok ? "Xendit" : "",
      !whatsapp.ok ? "WhatsApp" : "",
      !securityResponse.ok ? "Security policy" : ""
    ].filter(Boolean);
    document.getElementById("dashboardLastChecked").textContent = `Checked ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    setStatus(failures.length ? `Check required: ${failures.join(", ")}.` : "System check passed.");
    renderDashboard();
  } finally {
    button.disabled = false;
    button.textContent = "Run system check";
  }
}

function restoreLiveTestChecklist() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(liveTestStorageKey) || "{}");
  } catch (_error) {
    saved = {};
  }
  document.querySelectorAll("[data-live-test]").forEach((input) => {
    input.checked = Boolean(saved[input.dataset.liveTest]);
  });
}

function saveLiveTestChecklist() {
  const saved = {};
  document.querySelectorAll("[data-live-test]").forEach((input) => {
    saved[input.dataset.liveTest] = input.checked;
  });
  localStorage.setItem(liveTestStorageKey, JSON.stringify(saved));
}

function resetLiveTestChecklist() {
  localStorage.removeItem(liveTestStorageKey);
  document.querySelectorAll("[data-live-test]").forEach((input) => {
    input.checked = false;
  });
  setStatus("Tomorrow's live-test checklist was reset.");
}

function renderIntegrations(integrations) {
  const adminNumbers = String(integrations?.whatsappAdminNumber || "")
    .split(/[,\n;]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);
  Object.entries(integrationFields).forEach(([key, field]) => {
    if (secretIntegrationKeys.has(key)) {
      field.value = "";
      field.placeholder = integrations?.[key] ? "Saved. Leave blank to keep current value." : "";
      return;
    }
    if (key === "whatsappAdminNumber") field.value = adminNumbers[0] || "";
    else if (key === "whatsappAdminNumber2") field.value = adminNumbers[1] || "";
    else if (key === "whatsappAdminNumber3") field.value = adminNumbers[2] || "";
    else field.value = integrations?.[key] || "";
  });
  const providerStates = {
    googleMaps: {
      ready: Boolean(integrations?.googleMapsApiKey),
      label: integrations?.googleMapsApiKey ? "Configured" : "Needs setup"
    },
    biteship: {
      ready: Boolean(integrations?.biteshipApiKey),
      label: integrations?.biteshipApiKey ? "Configured" : "Needs setup"
    },
    xendit: {
      ready: Boolean(integrations?.xenditSecretKey),
      live: integrations?.xenditEnvironment === "live" && Boolean(integrations?.xenditSecretKey),
      label: integrations?.xenditSecretKey
        ? (integrations.xenditEnvironment === "live" ? "Live" : "Test")
        : "Needs setup"
    },
    whatsapp: {
      ready: Boolean(integrations?.whatsappAccessToken && integrations?.whatsappPhoneNumberId),
      label: integrations?.whatsappAccessToken && integrations?.whatsappPhoneNumberId ? "Configured" : "Needs setup"
    }
  };
  document.querySelectorAll("[data-provider-status]").forEach((element) => {
    const provider = providerStates[element.dataset.providerStatus];
    if (!provider) return;
    element.textContent = provider.label;
    element.classList.toggle("is-live", Boolean(provider.live));
    element.classList.toggle("is-warning", !provider.ready);
  });
}

function renderStore() {
  Object.entries(storeFields).forEach(([key, field]) => {
    const saved = state.catalog.store[key];
    field.value = saved ?? storeFieldDefaults[key] ?? "";
  });
  const logoPreview = document.getElementById("storeLogoPreview");
  if (logoPreview) logoPreview.src = storeFields.logoPath.value || "/assets/bakeaholic-logo.jpg";
  const footerLogoPreview = document.getElementById("footerLogoPreview");
  if (footerLogoPreview) footerLogoPreview.src = storeFields.footerLogoPath.value || storeFields.logoPath.value || "/assets/bakeaholic-logo.jpg";
  syncLogoEditorPreview("store");
  syncLogoEditorPreview("footer");
  syncRangeOutputs(document);
  syncKitchenMapFromFields();
}

function clampedMediaValue(value, fallback, min, max) {
  return Math.min(max, Math.max(min, Number(value ?? fallback) || fallback));
}

function mediaRangeControlsMarkup(fieldAttribute, item = {}) {
  const scale = clampedMediaValue(item.imageScale, 100, 50, 180);
  const positionX = clampedMediaValue(item.imageOffsetX, 0, -100, 100);
  const positionY = clampedMediaValue(item.imageOffsetY, 0, -100, 100);
  const frameX = clampedMediaValue(item.frameOffsetX, 0, -30, 30);
  const frameY = clampedMediaValue(item.frameOffsetY, 0, -30, 30);
  return `
    <div class="admin-media-controls admin-grid-wide">
      <div class="admin-media-control-group">
        <div class="admin-media-control-heading">
          <div>
            <strong>1. Frame position on the webpage</strong>
            <span>Moves the complete allocated picture frame. It does not crop the picture.</span>
          </div>
        </div>
        <label><span>Frame left ↔ right <output>${frameX}%</output></span><input ${fieldAttribute}="frameOffsetX" type="range" min="-30" max="30" step="1" value="${frameX}" /></label>
        <label><span>Frame up ↕ down <output>${frameY}%</output></span><input ${fieldAttribute}="frameOffsetY" type="range" min="-30" max="30" step="1" value="${frameY}" /></label>
      </div>
      <div class="admin-media-control-group">
        <div class="admin-media-control-heading">
          <div>
            <strong>2. Picture crop inside the frame</strong>
            <span>Zoom and reposition only the picture. You can also drag directly inside the preview.</span>
          </div>
        </div>
        <label><span>Picture zoom <output>${scale}%</output></span><input ${fieldAttribute}="imageScale" type="range" min="50" max="180" step="1" value="${scale}" /></label>
        <label><span>Picture left ↔ right <output>${positionX}%</output></span><input ${fieldAttribute}="imageOffsetX" type="range" min="-100" max="100" step="1" value="${positionX}" /></label>
        <label><span>Picture up ↕ down <output>${positionY}%</output></span><input ${fieldAttribute}="imageOffsetY" type="range" min="-100" max="100" step="1" value="${positionY}" /></label>
      </div>
    </div>
  `;
}

function syncRangeOutputs(scope) {
  scope.querySelectorAll('input[type="range"]').forEach((range) => {
    const output = range.closest("label")?.querySelector("output")
      || document.querySelector(`[data-range-output-for="${range.id}"]`);
    if (output) output.textContent = `${range.value}%`;
  });
}

function syncLogoEditorPreview(type) {
  const isFooter = type === "footer";
  const preview = document.getElementById(isFooter ? "footerLogoPreview" : "storeLogoPreview");
  if (!preview) return;
  const scale = clampedMediaValue(storeFields[isFooter ? "footerLogoScale" : "logoScale"]?.value, 100, 50, 180);
  const x = clampedMediaValue(storeFields[isFooter ? "footerLogoOffsetX" : "logoOffsetX"]?.value, 0, -100, 100);
  const y = clampedMediaValue(storeFields[isFooter ? "footerLogoOffsetY" : "logoOffsetY"]?.value, 0, -100, 100);
  preview.style.transform = `translate(${x}%, ${y}%) scale(${scale / 100})`;
  preview.style.transformOrigin = "center";
  preview.style.objectPosition = "center";
}

function kitchenLocationFromFields() {
  const lat = Number(storeFields.kitchenLat.value);
  const lng = Number(storeFields.kitchenLng.value);
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    address: storeFields.kitchenAddress.value.trim()
  };
}

function kitchenGoogleMapsUrl(location = kitchenLocationFromFields()) {
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.lat},${location.lng}`)}`;
}

function updateKitchenMapLink(location = kitchenLocationFromFields()) {
  const url = kitchenGoogleMapsUrl(location);
  kitchenMapElements.openLink.hidden = !url;
  kitchenMapElements.openLink.href = url || "#";
}

function syncKitchenMapFromFields() {
  const location = kitchenLocationFromFields();
  updateKitchenMapLink(location);
  if (!kitchenMapState.map || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return;
  const point = { lat: location.lat, lng: location.lng };
  kitchenMapState.map.setCenter(point);
  kitchenMapState.marker.setPosition(point);
}

function updateKitchenLocation(location, message = "Pickup pin updated. Save storefront settings to use it for new Biteship orders.") {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const point = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  storeFields.kitchenLat.value = String(point.lat);
  storeFields.kitchenLng.value = String(point.lng);
  if (location?.address) {
    storeFields.kitchenAddress.value = String(location.address).trim();
  }
  updateKitchenMapLink({ ...point, address: storeFields.kitchenAddress.value.trim() });
  if (kitchenMapState.map) {
    kitchenMapState.map.setCenter(point);
    kitchenMapState.marker.setPosition(point);
  }
  kitchenMapElements.status.textContent = message;
}

function loadAdminGoogleMaps(apiKey) {
  if (!apiKey) return Promise.resolve(null);
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (adminGoogleMapsLoaderPromise) return adminGoogleMapsLoaderPromise;

  adminGoogleMapsLoaderPromise = new Promise((resolve, reject) => {
    const callbackName = "__bakeaholicAdminGoogleMapsReady";
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async&callback=${callbackName}`;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error("Google Maps could not load"));
    };
    document.head.appendChild(script);
  });
  return adminGoogleMapsLoaderPromise;
}

async function reverseGeocodeKitchenLocation(position) {
  if (!kitchenMapState.geocoder) return;
  const response = await kitchenMapState.geocoder.geocode({ location: position });
  const address = response.results?.[0]?.formatted_address || storeFields.kitchenAddress.value.trim();
  updateKitchenLocation({ ...position, address });
}

async function initializeKitchenMap(apiKey) {
  if (!kitchenMapElements.map || kitchenMapState.map) return;
  const location = kitchenLocationFromFields();
  updateKitchenMapLink(location);
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    kitchenMapElements.status.textContent = "Add a valid pickup latitude and longitude to load the map.";
    return;
  }

  try {
    const mapsApi = await loadAdminGoogleMaps(apiKey);
    if (!mapsApi) {
      kitchenMapElements.status.textContent = "Google Maps key is not configured. Add it under Integrations to edit the pickup pin.";
      return;
    }
    const point = { lat: location.lat, lng: location.lng };
    kitchenMapState.mapsApi = mapsApi;
    kitchenMapState.geocoder = new mapsApi.Geocoder();
    kitchenMapState.map = new mapsApi.Map(kitchenMapElements.map, {
      center: point,
      zoom: 17,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true
    });
    kitchenMapState.marker = new mapsApi.Marker({
      map: kitchenMapState.map,
      position: point,
      draggable: true,
      title: "Bakeaholic pickup location"
    });
    kitchenMapState.map.addListener("click", (event) => reverseGeocodeKitchenLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    }).catch(() => updateKitchenLocation({ lat: event.latLng.lat(), lng: event.latLng.lng() })));
    kitchenMapState.marker.addListener("dragend", (event) => reverseGeocodeKitchenLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    }).catch(() => updateKitchenLocation({ lat: event.latLng.lat(), lng: event.latLng.lng() })));
    kitchenMapState.autocomplete = new mapsApi.places.Autocomplete(kitchenMapElements.search, {
      componentRestrictions: { country: "id" },
      fields: ["formatted_address", "geometry", "name"]
    });
    kitchenMapState.autocomplete.addListener("place_changed", () => {
      const place = kitchenMapState.autocomplete.getPlace();
      if (!place.geometry?.location) {
        kitchenMapElements.status.textContent = "Choose an address from the Google Maps suggestions.";
        return;
      }
      updateKitchenLocation({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.name || kitchenMapElements.search.value
      });
    });
    kitchenMapElements.status.textContent = "Search, click, or drag the pin. Save storefront settings when the point is correct.";
  } catch (error) {
    kitchenMapElements.status.textContent = `${error.message}. You can still use the latitude and longitude fields.`;
  }
}

function renderPromoOptions() {
  promoFields.itemId.innerHTML = state.catalog.items
    .map((item) => `<option value="${item.id}">${item.name}</option>`)
    .join("");
}

function renderPromo() {
  renderPromoOptions();
  Object.entries(promoFields).forEach(([key, field]) => {
    field.value = state.catalog.promo[key] || "";
  });
}

function statusLabel(status = "") {
  const labels = {
    awaiting_payment: "Awaiting payment",
    paid: "Paid - prepare order",
    preparing: "Preparing / driver requested",
    on_delivery: "On delivery",
    shipped: "On delivery",
    delivered: "Delivered",
    delivery_issue: "Delivery needs attention",
    returned: "Delivery returned",
    delivery_failed: "Delivery failed",
    complete: "Complete",
    cancelled: "Cancelled",
    expired: "Expired",
    payment_failed: "Payment failed"
  };
  return labels[status] || String(status || "Order").replace(/[_-]+/g, " ");
}

function renderAdminOrders() {
  if (!adminOrderList) return;
  const orders = state.orders || [];
  if (!orders.length) {
    adminOrderList.innerHTML = `
      <div class="empty-state">
        <strong>No orders yet.</strong>
        <p>Paid orders will appear here for staff approval before delivery.</p>
      </div>
    `;
    return;
  }

  adminOrderList.innerHTML = orders.map((order) => {
    const canRetryFailedBooking = order.status === "delivery_issue"
      && order.payment?.status === "paid"
      && !order.fulfillment?.shipment?.orderId;
    const canApprove = (order.status === "paid" || canRetryFailedBooking)
      && order.fulfillment?.type === "delivery"
      && !order.fulfillment?.shipment?.orderId;
    const canRebook = Boolean(order.fulfillment?.shipment?.orderId)
      && order.fulfillment?.type === "delivery"
      && !["delivered", "cancelled", "returned", "delivery_failed"].includes(order.status);
    const canCancelDelivery = Boolean(order.fulfillment?.shipment?.orderId)
      && order.fulfillment?.type === "delivery"
      && !["delivery_issue", "delivered", "cancelled", "returned", "delivery_failed"].includes(order.status);
    const canSyncDelivery = Boolean(order.fulfillment?.shipment?.orderId)
      && order.fulfillment?.type === "delivery";
    const isDeliveryIssue = order.status === "delivery_issue";
    const statusClass = ["delivery_issue", "returned", "delivery_failed", "cancelled", "expired", "payment_failed"].includes(order.status)
      ? "status-negative"
      : order.status === "paid"
        ? "status-pending"
        : ["preparing", "on_delivery", "shipped", "delivered", "complete"].includes(order.status)
          ? "status-paid"
          : "";
    const deliveryActions = canApprove
      ? `<button class="admin-button" type="button" data-approve-delivery="${escapeHtml(order.id)}">${canRetryFailedBooking ? "Retry delivery booking" : "Approve delivery"}</button>`
      : isDeliveryIssue
        ? `
          <button class="admin-button secondary" type="button" data-sync-delivery="${escapeHtml(order.id)}">Sync delivery status</button>
          <button class="admin-button" type="button" data-rebook-delivery="${escapeHtml(order.id)}" ${canRebook ? "" : "disabled"}>Check &amp; rebook</button>
        `
        : canSyncDelivery
          ? `
            <button class="admin-button secondary" type="button" data-sync-delivery="${escapeHtml(order.id)}">Sync delivery status</button>
            <button class="admin-button secondary" type="button" data-cancel-delivery="${escapeHtml(order.id)}" ${canCancelDelivery ? "" : "disabled"}>Cancel delivery</button>
          `
          : "";
    const lineItems = (order.lineItems || []).map((entry) => `
      <li>${entry.quantity}x ${escapeHtml(entry.item?.name || entry.itemId)} (${formatRupiah.format(entry.lineTotal || 0)})</li>
    `).join("");
    const shipmentText = order.fulfillment?.shipment?.orderId
      ? `Biteship ${order.fulfillment.shipment.orderId}`
      : order.fulfillment?.shipmentError
        ? order.fulfillment.shipmentError
        : "Not requested yet";
    const notificationErrors = [
      order.whatsappShippingNotificationError ? `Customer shipping WhatsApp: ${order.whatsappShippingNotificationError}` : "",
      order.adminWhatsappShippingNotificationError ? `Admin shipping WhatsApp: ${order.adminWhatsappShippingNotificationError}` : "",
      order.adminWhatsappNotificationError ? `Admin alert WhatsApp: ${order.adminWhatsappNotificationError}` : "",
      ...(order.adminWhatsappNotifications?.recipients || [])
        .filter((recipient) => !recipient.sent || recipient.deliveryStatus === "failed")
        .map((recipient) => `Admin ${recipient.recipient || "recipient"}: ${recipient.deliveryError || recipient.error || "WhatsApp delivery failed"}`)
    ].filter(Boolean);
    const adminRecipients = order.adminWhatsappNotifications?.recipients || [];
    const adminRecipientDetails = adminRecipients.length
      ? `
        <div class="admin-recipient-status">
          <strong>Admin WhatsApp delivery</strong>
          <div class="admin-recipient-status-list">
            ${adminRecipients.map((recipient) => `
              <span class="${recipient.sent && recipient.deliveryStatus !== "failed" ? "is-sent" : "is-failed"}">
                <b>${recipient.sent && recipient.deliveryStatus !== "failed" ? "✓" : "!"}</b>
                Admin ${escapeHtml(recipient.recipient || "recipient")}
                <small>${escapeHtml(
                  recipient.deliveryStatus === "failed"
                    ? recipient.deliveryError || "Meta could not deliver"
                    : ["delivered", "read"].includes(recipient.deliveryStatus)
                      ? `${recipient.deliveryStatus === "read" ? "Read" : "Delivered"} by WhatsApp`
                      : recipient.sent
                        ? "Accepted by Meta — awaiting delivery receipt"
                        : recipient.error || "Delivery failed"
                )}</small>
              </span>
            `).join("")}
          </div>
        </div>
      `
      : `
        <div class="admin-recipient-status is-empty">
          <strong>Admin WhatsApp delivery</strong>
          <span>No per-recipient delivery result has been recorded for this order.</span>
        </div>
      `;
    const refund = order.refund || null;
    const refundTone = ["succeeded"].includes(refund?.status)
      ? "status-paid"
      : ["failed", "manual_required"].includes(refund?.status)
        ? "status-negative"
        : "status-pending";
    const refundDetails = refund
      ? `
        <div class="admin-refund-note ${refundTone}">
          <strong>Refund: ${escapeHtml(String(refund.status || "unknown").replace(/_/g, " "))}</strong>
          <span>${escapeHtml(refund.message || "")}</span>
          ${refund.failureCode ? `<small>Failure: ${escapeHtml(refund.failureCode)}</small>` : ""}
          ${refund.id ? `<small>Xendit refund: ${escapeHtml(refund.id)}</small>` : ""}
        </div>
      `
      : "";
    return `
      <article class="admin-order-card" data-order-id="${escapeHtml(order.id)}">
        <div class="admin-order-main">
          <div>
            <span class="status-pill ${statusClass}">${escapeHtml(statusLabel(order.status))}</span>
            <h3>${escapeHtml(order.id)}</h3>
            <p>${escapeHtml(order.customer?.name || "Customer")} · ${escapeHtml(order.customer?.phone || "")}</p>
          </div>
          <strong>${formatRupiah.format(order.pricing?.total || 0)}</strong>
        </div>
        <div class="admin-order-grid">
          <div>
            <strong>Items</strong>
            <ul>${lineItems}</ul>
          </div>
          <div>
            <strong>Delivery</strong>
            <p>${escapeHtml(order.fulfillment?.address || order.customer?.address || "-")}</p>
            <small>${escapeHtml(shipmentText)}</small>
          </div>
        </div>
        <div class="admin-order-actions">
          <a class="admin-button secondary" href="${escapeHtml(order.documentUrl || "#")}" target="_blank" rel="noreferrer">Open &amp; print invoice</a>
          <a class="admin-button secondary" href="${escapeHtml(order.whatsappUrl || "#")}" target="_blank" rel="noreferrer">WhatsApp handoff</a>
          ${deliveryActions}
        </div>
        ${notificationErrors.length ? `<p class="admin-delivery-note status-negative">${notificationErrors.map(escapeHtml).join("<br>")}</p>` : ""}
        ${adminRecipientDetails}
        ${refundDetails}
        ${isDeliveryIssue ? `<p class="admin-delivery-note">${canRetryFailedBooking ? "Biteship did not create a delivery. Correct the cause, then use Retry delivery booking. The customer must not pay again." : "The courier booking needs attention. Payment is still paid. Rebook after correcting the issue, or process a refund through the verified refund workflow."}</p>` : ""}
      </article>
    `;
  }).join("");
}

function orderDate(order) {
  const value = order.createdAt || order.updatedAt || order.payment?.paidAt || order.paidAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function reportOrders() {
  const period = reportPeriodSelect?.value || "30";
  if (period === "all") return [...state.orders];
  const cutoff = Date.now() - Number(period) * 86400000;
  return state.orders.filter((order) => (orderDate(order)?.getTime() || 0) >= cutoff);
}

function buyerLocation(order) {
  const address = String(order.fulfillment?.address || order.customer?.address || "").trim();
  if (!address) return "Not recorded";
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.slice(Math.max(0, parts.length - 3)).join(", ");
}

function buildBuyerRows(orders) {
  const buyers = new Map();
  orders.forEach((order) => {
    const phone = String(order.customer?.phone || "").trim();
    const email = String(order.customer?.email || "").trim().toLowerCase();
    const key = phone || email || `${order.customer?.name || "Guest"}-${order.id}`;
    const current = buyers.get(key) || {
      name: order.customer?.name || "Guest",
      phone,
      email,
      location: buyerLocation(order),
      orders: 0,
      spent: 0,
      lastDate: null
    };
    current.orders += 1;
    if (!["cancelled", "expired", "payment_failed", "awaiting_payment"].includes(order.status)) {
      current.spent += Number(order.pricing?.total || 0);
    }
    const date = orderDate(order);
    if (date && (!current.lastDate || date > current.lastDate)) {
      current.lastDate = date;
      current.location = buyerLocation(order);
      current.name = order.customer?.name || current.name;
    }
    buyers.set(key, current);
  });
  return [...buyers.values()].sort((a, b) => b.spent - a.spent);
}

function renderReports() {
  if (!document.getElementById("reportNetSales")) return;
  const orders = reportOrders();
  const saleStatuses = new Set(["paid", "preparing", "on_delivery", "shipped", "delivered", "complete"]);
  const paidOrders = orders.filter((order) => saleStatuses.has(order.status));
  const cancelled = orders.filter((order) => order.status === "cancelled");
  const pending = orders.filter((order) => ["awaiting_payment", "paid", "preparing"].includes(order.status));
  const netSales = paidOrders.reduce((sum, order) => sum + Number(order.pricing?.total || 0), 0);
  const cancelledValue = cancelled.reduce((sum, order) => sum + Number(order.pricing?.total || 0), 0);
  document.getElementById("reportNetSales").textContent = formatRupiah.format(netSales);
  document.getElementById("reportPaidCount").textContent = `${paidOrders.length} paid order${paidOrders.length === 1 ? "" : "s"}`;
  document.getElementById("reportAverageOrder").textContent = formatRupiah.format(paidOrders.length ? netSales / paidOrders.length : 0);
  document.getElementById("reportCancelledCount").textContent = String(cancelled.length);
  document.getElementById("reportCancelledValue").textContent = `${formatRupiah.format(cancelledValue)} order value`;
  document.getElementById("reportPendingCount").textContent = String(pending.length);

  const productTotals = new Map();
  paidOrders.forEach((order) => {
    (order.lineItems || []).forEach((entry) => {
      const key = entry.itemId || entry.item?.id || entry.item?.name || "Unknown product";
      const current = productTotals.get(key) || { name: entry.item?.name || key, quantity: 0, revenue: 0 };
      current.quantity += Number(entry.quantity || 0);
      current.revenue += Number(entry.lineTotal || 0);
      productTotals.set(key, current);
    });
  });
  const products = [...productTotals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);
  const maxQuantity = Math.max(1, ...products.map((item) => item.quantity));
  document.getElementById("reportTopSellers").innerHTML = products.length
    ? products.map((item, index) => `<div class="admin-report-row"><span class="admin-report-rank">${index + 1}</span><div><strong>${escapeHtml(item.name)}</strong><span class="admin-report-bar"><i style="width:${Math.max(8, item.quantity / maxQuantity * 100)}%"></i></span><small>${item.quantity} sold · ${formatRupiah.format(item.revenue)}</small></div></div>`).join("")
    : '<div class="admin-dashboard-empty">No paid product sales in this period.</div>';

  const statusCounts = new Map();
  orders.forEach((order) => statusCounts.set(statusLabel(order.status), (statusCounts.get(statusLabel(order.status)) || 0) + 1));
  const statuses = [...statusCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxStatus = Math.max(1, ...statuses.map((entry) => entry[1]));
  document.getElementById("reportStatusMix").innerHTML = statuses.length
    ? statuses.map(([label, count]) => `<div class="admin-report-row is-status"><div><strong>${escapeHtml(label)}</strong><span class="admin-report-bar"><i style="width:${Math.max(8, count / maxStatus * 100)}%"></i></span><small>${count} order${count === 1 ? "" : "s"}</small></div></div>`).join("")
    : '<div class="admin-dashboard-empty">No orders in this period.</div>';

  const buyers = buildBuyerRows(orders);
  document.getElementById("reportBuyerTable").innerHTML = buyers.length
    ? buyers.map((buyer) => `<tr><td><strong>${escapeHtml(buyer.name)}</strong>${buyer.email ? `<small>${escapeHtml(buyer.email)}</small>` : ""}</td><td>${escapeHtml(buyer.phone || "—")}</td><td>${escapeHtml(buyer.location)}</td><td>${buyer.orders}</td><td>${formatRupiah.format(buyer.spent)}</td><td>${buyer.lastDate ? buyer.lastDate.toLocaleDateString("en-GB") : "—"}</td></tr>`).join("")
    : '<tr><td colspan="6">No buyers in this period.</td></tr>';
}

function exportBuyerCsv() {
  const rows = [["Customer", "Email", "Phone", "Location", "Orders", "Total spent", "Last purchase"], ...buildBuyerRows(reportOrders()).map((buyer) => [
    buyer.name, buyer.email, buyer.phone, buyer.location, buyer.orders, buyer.spent, buyer.lastDate?.toISOString() || ""
  ])];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `bakeaholic-buyers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function reportPeriodLabel() {
  return reportPeriodSelect?.selectedOptions?.[0]?.textContent?.trim() || "All time";
}

function reportTextLines() {
  const orders = reportOrders();
  const saleStatuses = new Set(["paid", "preparing", "on_delivery", "shipped", "delivered", "complete"]);
  const paidOrders = orders.filter((order) => saleStatuses.has(order.status));
  const cancelled = orders.filter((order) => order.status === "cancelled");
  const pending = orders.filter((order) => ["awaiting_payment", "paid", "preparing"].includes(order.status));
  const netSales = paidOrders.reduce((sum, order) => sum + Number(order.pricing?.total || 0), 0);
  const productTotals = new Map();
  paidOrders.forEach((order) => (order.lineItems || []).forEach((entry) => {
    const key = entry.itemId || entry.item?.id || entry.item?.name || "Unknown product";
    const current = productTotals.get(key) || { name: entry.item?.name || key, quantity: 0, revenue: 0 };
    current.quantity += Number(entry.quantity || 0);
    current.revenue += Number(entry.lineTotal || 0);
    productTotals.set(key, current);
  }));
  const lines = [
    "BAKEAHOLIC BALI — SALES REPORT",
    `Period: ${reportPeriodLabel()}`,
    `Generated: ${new Date().toLocaleString("en-GB")}`,
    "",
    `Net sales: ${formatRupiah.format(netSales)}`,
    `Paid orders: ${paidOrders.length}`,
    `Average order: ${formatRupiah.format(paidOrders.length ? netSales / paidOrders.length : 0)}`,
    `Cancelled: ${cancelled.length}`,
    `Pending: ${pending.length}`,
    "",
    "TOP SELLERS"
  ];
  [...productTotals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 12)
    .forEach((item, index) => lines.push(`${index + 1}. ${item.name} — ${item.quantity} sold — ${formatRupiah.format(item.revenue)}`));
  lines.push("", "BUYERS");
  buildBuyerRows(orders).forEach((buyer) => lines.push(
    `${buyer.name} | ${buyer.phone || "—"} | ${buyer.location} | ${buyer.orders} orders | ${formatRupiah.format(buyer.spent)}`
  ));
  return lines;
}

function pdfEscape(value) {
  return String(value).replace(/[^\x20-\x7E]/g, "-").replace(/([\\()])/g, "\\$1");
}

function createSimplePdf(lines) {
  const pageLines = [];
  for (let index = 0; index < lines.length; index += 48) pageLines.push(lines.slice(index, index + 48));
  const objects = [null];
  const addObject = (value) => {
    objects.push(value);
    return objects.length - 1;
  };
  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = pageLines.map((page, pageIndex) => {
    const commands = page.map((line, lineIndex) => {
      const size = pageIndex === 0 && lineIndex === 0 ? 16 : 9;
      return `BT /F1 ${size} Tf 42 ${800 - lineIndex * 15} Td (${pdfEscape(line)}) Tj ET`;
    }).join("\n");
    const contentId = addObject(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
    return addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  });
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let output = "%PDF-1.4\n";
  const offsets = [0];
  objects.slice(1).forEach((object, index) => {
    offsets.push(output.length);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = output.length;
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { output += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  output += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([output], { type: "application/pdf" });
}

function downloadReportPdf() {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(createSimplePdf(reportTextLines()));
  link.download = `bakeaholic-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function printReportA4() {
  const lines = reportTextLines();
  const reportWindow = window.open("", "bakeaholic-a4-report", "width=960,height=1100");
  if (!reportWindow) {
    setStatus("The print window was blocked. Allow pop-ups for this admin page, then try again.");
    return;
  }
  const title = lines.shift() || "BAKEAHOLIC BALI — SALES REPORT";
  const summaryEnd = lines.indexOf("TOP SELLERS");
  const summary = lines.slice(0, Math.max(0, summaryEnd));
  const detail = lines.slice(Math.max(0, summaryEnd));
  reportWindow.document.open();
  reportWindow.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4 portrait; margin: 14mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #302018;
            background: #fff;
            font: 12px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          main { width: 100%; }
          header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 14px;
            border-bottom: 2px solid #754525;
          }
          h1 { margin: 0; font-size: 22px; line-height: 1.15; letter-spacing: .02em; }
          .brand { color: #754525; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
          .summary {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 18px;
            margin: 18px 0 22px;
            padding: 14px 16px;
            border: 1px solid #e4d6cc;
            border-radius: 10px;
            background: #fbf7f3;
          }
          .summary p { margin: 0; }
          pre {
            margin: 0;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            color: #302018;
            font: 11px/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          }
          footer {
            margin-top: 24px;
            padding-top: 10px;
            border-top: 1px solid #e4d6cc;
            color: #836d60;
            font-size: 9px;
          }
          @media screen {
            body { padding: 24px; background: #eee8e3; }
            main {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 14mm;
              background: #fff;
              box-shadow: 0 18px 55px rgba(63, 36, 20, .15);
            }
          }
          @media print {
            .screen-note { display: none; }
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <div>
              <div class="brand">Bakeaholic Bali</div>
              <h1>${escapeHtml(title.replace("BAKEAHOLIC BALI — ", ""))}</h1>
            </div>
            <div class="screen-note">A4 report</div>
          </header>
          <section class="summary">${summary.filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</section>
          <pre>${escapeHtml(detail.join("\n"))}</pre>
          <footer>Generated by Bakeaholic Admin · ${escapeHtml(reportPeriodLabel())}</footer>
        </main>
      </body>
    </html>`);
  reportWindow.document.close();
  reportWindow.focus();
  window.setTimeout(() => reportWindow.print(), 250);
}

function defaultBrandStory() {
  return {
    kicker: "Bakeaholic Bali",
    title: "Bali-born treats for everyday good moments.",
    body: "Bakeaholic started from a small Bali kitchen with a simple idea: make packaged treats that feel homemade, travel well, and are easy to share.",
    secondaryBody: "Every snack is built for real life, with retail-ready packs, familiar flavors, and shelf lives that make gifting, stocking, and daily snacking simple.",
    imagePath: "/assets/products/bliss-salted-caramel-lifestyle-20260422.png",
    points: [
      { label: "Bali kitchen roots", icon: "oats" },
      { label: "Ready to share", icon: "gift" },
      { label: "Feel-good treats", icon: "leaf" }
    ],
    slides: [
      {
        kicker: "Bakeaholic Bali",
        title: "Bali-born treats for everyday good moments.",
        body: "Bakeaholic started from a small Bali kitchen with a simple idea: make packaged treats that feel homemade, travel well, and are easy to share.",
        secondaryBody: "Every snack is built for real life, with retail-ready packs, familiar flavors, and shelf lives that make gifting, stocking, and daily snacking simple.",
        imagePath: "/assets/products/bliss-salted-caramel-lifestyle-20260422.png",
        imageAlt: "Bakeaholic packaged snacks",
        points: [
          { label: "Bali kitchen roots", icon: "oats" },
          { label: "Ready to share", icon: "gift" },
          { label: "Feel-good treats", icon: "leaf" }
        ]
      },
      {
        kicker: "Our history",
        title: "From kitchen batches to packed Bali favorites.",
        body: "Bakeaholic grew from testing flavors, textures, and shelf-ready packs until the snacks felt just right: familiar, generous, and easy to bring anywhere.",
        secondaryBody: "The range now moves from bliss balls to cookies, oats, and mellow treats, all made to support busy days, retail shelves, and thoughtful gifting.",
        imagePath: "/assets/products/bliss-cranberry-lifestyle-20260422.png",
        imageAlt: "Bakeaholic Cranberry Bliss Balls",
        points: [
          { label: "Small-batch roots", icon: "batch" },
          { label: "Flavor testing", icon: "spoon" },
          { label: "Retail-ready", icon: "pack" }
        ]
      },
      {
        kicker: "Where we sell",
        title: "Made for homes, cafés, villas, and retail shelves.",
        body: "Our snacks are easy to stock, display, and share, whether customers are ordering for daily treats, hospitality welcome packs, or grab-and-go retail.",
        secondaryBody: "Order online for delivery, or contact us for wholesale and stocking conversations around Bali.",
        imagePath: "/assets/products/overnight-oats-assorted.jpg",
        imageAlt: "Bakeaholic assorted overnight oats",
        points: [
          { label: "Online orders", icon: "cart" },
          { label: "Café shelves", icon: "cup" },
          { label: "Wholesale packs", icon: "boxes" }
        ]
      }
    ]
  };
}

function normalizeStoryPoint(point, fallbackIcon = "leaf") {
  if (typeof point === "string") {
    return { label: point, icon: fallbackIcon };
  }
  return {
    label: point?.label || "",
    icon: point?.icon || fallbackIcon
  };
}

function normalizeBrandStorySlides(story) {
  const defaults = defaultBrandStory().slides;
  const slides = Array.isArray(story?.slides) && story.slides.length
    ? story.slides
    : [{ ...defaults[0], ...(story || {}) }, ...defaults.slice(1)];

  return slides.map((slide, index) => {
    const fallback = defaults[index] || defaults[0];
    return {
      ...fallback,
      ...slide,
      points: [0, 1, 2].map((pointIndex) => normalizeStoryPoint(
        slide.points?.[pointIndex],
        fallback.points[pointIndex]?.icon || "leaf"
      ))
    };
  });
}

function storyIconPickerMarkup(selectedIcon, pointIndex) {
  const selected = storyIconOptions.find((option) => option.value === selectedIcon) || storyIconOptions[0];
  return `<input type="hidden" data-story-point-icon="${pointIndex}" value="${selected.value}" />
    <details class="admin-icon-dropdown">
      <summary><span class="admin-icon-glyph" data-selected-icon>${storyIconGlyph(selected.value)}</span><strong data-selected-label>${selected.label}</strong><span class="admin-icon-chevron">⌄</span></summary>
      <div class="admin-icon-menu" role="listbox" aria-label="Choose icon">
        ${storyIconOptions.map((option) => `<button type="button" class="${option.value === selected.value ? "is-selected" : ""}" data-story-icon-choice="${option.value}" role="option" aria-selected="${option.value === selected.value}"><span>${storyIconGlyph(option.value)}</span><small>${option.label}</small></button>`).join("")}
      </div>
    </details>`;
}

function storyIconGlyph(value) {
  return ({ oats:"🌾", coconut:"🥥", cashew:"🥜", gift:"🎁", leaf:"🌿", batch:"🧁", spoon:"🥄", pack:"📦", cart:"🛒", cup:"☕", boxes:"🏪", heart:"❤️", star:"⭐", home:"🏠", truck:"🚚", sparkle:"✨" })[value] || "•";
}

function storySlideMarkup(slide, index) {
  const points = [0, 1, 2].map((pointIndex) => normalizeStoryPoint(slide.points?.[pointIndex]));
  return `
    <article class="story-slide-editor-card" data-story-slide-index="${index}">
      <div class="story-slide-editor-head"><h3>Slide ${index + 1}</h3><button class="admin-text-button is-danger" type="button" data-remove-story-slide="${index}">Remove</button></div>
      <div class="admin-grid">
        <div class="admin-field">
          <label>Small label</label>
          <input data-story-field="kicker" type="text" value="${escapeHtml(slide.kicker || "")}" />
        </div>
        <div class="admin-field">
          <label>Slide image</label>
          <input class="admin-code-input" data-story-field="imagePath" type="text" value="${escapeHtml(slide.imagePath || "")}" />
          ${imageUploadMarkup("story", index)}
        </div>
        <div class="admin-field" style="grid-column: 1 / -1;">
          <label>Title</label>
          <input data-story-field="title" type="text" value="${escapeHtml(slide.title || "")}" />
        </div>
        <div class="admin-field" style="grid-column: 1 / -1;">
          <label>Paragraph 1</label>
          <textarea data-story-field="body">${escapeHtml(slide.body || "")}</textarea>
        </div>
        <div class="admin-field" style="grid-column: 1 / -1;">
          <label>Paragraph 2</label>
          <textarea data-story-field="secondaryBody">${escapeHtml(slide.secondaryBody || "")}</textarea>
        </div>
        <div class="admin-field">
          <label>Note 1</label>
          <input data-story-point-label="0" type="text" value="${escapeHtml(points[0].label)}" />
        </div>
        <div class="admin-field">
          <label>Icon 1</label>
          ${storyIconPickerMarkup(points[0].icon, 0)}
        </div>
        <div class="admin-field">
          <label>Note 2</label>
          <input data-story-point-label="1" type="text" value="${escapeHtml(points[1].label)}" />
        </div>
        <div class="admin-field">
          <label>Icon 2</label>
          ${storyIconPickerMarkup(points[1].icon, 1)}
        </div>
        <div class="admin-field">
          <label>Note 3</label>
          <input data-story-point-label="2" type="text" value="${escapeHtml(points[2].label)}" />
        </div>
        <div class="admin-field">
          <label>Icon 3</label>
          ${storyIconPickerMarkup(points[2].icon, 2)}
        </div>
        <div class="admin-field"><label>Image fit</label><select data-story-field="imageFit"><option value="cover" ${slide.imageFit !== "contain" ? "selected" : ""}>Fill frame</option><option value="contain" ${slide.imageFit === "contain" ? "selected" : ""}>Show whole image</option></select></div>
        ${mediaRangeControlsMarkup("data-story-field", slide)}
        <div class="admin-field admin-image-preview-field">
          <label>Slide image preview</label>
          <div class="admin-image-preview-frame wide" style="${mediaFramePreviewStyle(slide)}">
            <img class="admin-image-preview" data-story-preview src="${escapeHtml(slide.imagePath || defaultBrandStory().imagePath)}" alt="Homepage carousel preview" style="${productPreviewStyle(slide)}" />
          </div>
        </div>
      </div>
    </article>
  `;
}

function imagePositionOptions(value = "center") {
  return ["center", "top", "bottom", "left", "right"].map((position) => `<option value="${position}" ${position === value ? "selected" : ""}>${position[0].toUpperCase()}${position.slice(1)}</option>`).join("");
}

function imageUploadMarkup(kind, index) {
  return `<label class="admin-image-dropzone" data-image-dropzone><input type="file" accept="image/png,image/jpeg,image/webp" data-image-upload="${kind}" data-image-index="${index}" /><span><strong>Choose image</strong> or drag and drop</span><small>JPG, PNG or WebP · max 6 MB</small></label>`;
}

function syncBrandStoryPreview(card) {
  const preview = card?.querySelector("[data-story-preview]");
  const imageInput = card?.querySelector('[data-story-field="imagePath"]');
  if (!preview || !imageInput) return;
  preview.src = imageInput.value.trim() || defaultBrandStory().imagePath;
  const draft = {};
  card.querySelectorAll("[data-story-field]").forEach((field) => {
    draft[field.dataset.storyField] = field.value;
  });
  const frame = card.querySelector(".admin-image-preview-frame");
  if (frame) frame.style.cssText = mediaFramePreviewStyle(draft);
  preview.style.cssText = productPreviewStyle(draft);
  syncRangeOutputs(card);
  sendMediaPreview("story", Number(card.dataset.storySlideIndex || 0), "", draft);
}

function renderBrandStory() {
  const story = {
    ...defaultBrandStory(),
    ...(state.catalog.brandStory || {})
  };
  const slides = normalizeBrandStorySlides(story);
  brandStorySlideList.innerHTML = slides.map((slide, index) => storySlideMarkup(slide, index)).join("");
  brandStorySlideList.querySelectorAll("[data-story-slide-index]").forEach((card) => {
    card.querySelectorAll('[data-story-field="imagePath"], [data-story-field="imageFit"], [data-story-field="imageOffsetX"], [data-story-field="imageOffsetY"], [data-story-field="imageScale"], [data-story-field="frameOffsetX"], [data-story-field="frameOffsetY"]').forEach((field) => {
      field.addEventListener("input", () => syncBrandStoryPreview(card));
      field.addEventListener("change", () => syncBrandStoryPreview(card));
    });
    syncBrandStoryPreview(card);
    card.querySelectorAll("[data-story-icon-choice]").forEach((button) => button.addEventListener("click", () => {
      const dropdown = button.closest(".admin-icon-dropdown");
      const input = dropdown.previousElementSibling;
      dropdown.querySelectorAll("button").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      input.value = button.dataset.storyIconChoice;
      dropdown.querySelector("[data-selected-icon]").textContent = storyIconGlyph(button.dataset.storyIconChoice);
      dropdown.querySelector("[data-selected-label]").textContent = storyIconOptions.find((option) => option.value === button.dataset.storyIconChoice)?.label || "";
      dropdown.open = false;
      focusStorefrontPreview("story", Number(card.dataset.storySlideIndex), `point-icon-${input.dataset.storyPointIcon}`);
      markCatalogDirty();
    }));
  });
  brandStorySlideList.querySelectorAll("[data-remove-story-slide]").forEach((button) => button.addEventListener("click", () => {
    const slides = normalizeBrandStorySlides(collectBrandStory());
    if (slides.length <= 1) return;
    slides.splice(Number(button.dataset.removeStorySlide), 1);
    state.catalog.brandStory = { ...slides[0], slides };
    renderBrandStory();
    markCatalogDirty();
  }));
  wireImageUploads(brandStorySlideList);
}

async function uploadImage(file, pathInput) {
  if (!file || file.size > 6 * 1024 * 1024) throw new Error("Choose an image smaller than 6 MB.");
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const response = await request("/api/admin/upload-image", {
    method: "POST",
    body: JSON.stringify({ name: file.name, dataUrl })
  });
  pathInput.value = response.path;
  pathInput.dispatchEvent(new Event("input", { bubbles: true }));
}

function wireImageUploads(root) {
  if (!root) return;
  root.querySelectorAll("[data-image-upload]").forEach((input) => {
    const zone = input.closest("[data-image-dropzone]");
    const card = input.closest("[data-story-slide-index],[data-product-index],[data-admin-section]");
    const pathInput = document.getElementById(input.dataset.pathInput) || card.querySelector('[data-story-field="imagePath"],[data-product-field="imagePath"],[data-store-field="logoPath"],[data-store-field="footerLogoPath"]');
    input.addEventListener("change", () => uploadImage(input.files[0], pathInput).catch((error) => setStatus(error.message)));
    ["dragenter", "dragover"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.add("is-dragging"); }));
    ["dragleave", "drop"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.remove("is-dragging"); }));
    zone.addEventListener("drop", (event) => uploadImage(event.dataTransfer.files[0], pathInput).catch((error) => setStatus(error.message)));
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeImageFit(value) {
  return value === "cover" ? "cover" : "contain";
}

function normalizeImagePosition(value) {
  switch (value) {
    case "top":
      return "center top";
    case "bottom":
      return "center bottom";
    case "left":
      return "left center";
    case "right":
      return "right center";
    default:
      return "center center";
  }
}

function productPreviewStyle(product) {
  const x = clampedMediaValue(product.imageOffsetX, 0, -100, 100);
  const y = clampedMediaValue(product.imageOffsetY, 0, -100, 100);
  const scale = clampedMediaValue(product.imageScale, 100, 50, 180);
  return `object-fit: ${normalizeImageFit(product.imageFit)}; object-position: center; transform: translate(${x}%, ${y}%) scale(${scale / 100}); transform-origin: center;`;
}

function mediaFramePreviewStyle(item) {
  const x = clampedMediaValue(item.frameOffsetX, 0, -30, 30);
  const y = clampedMediaValue(item.frameOffsetY, 0, -30, 30);
  return `transform: translate(${x}%, ${y}%); transform-origin: center;`;
}

function sendMediaPreview(itemType, itemIndex, itemId, item) {
  const media = {
    imageFit: normalizeImageFit(item.imageFit),
    imageScale: clampedMediaValue(item.imageScale, 100, 50, 180),
    imageOffsetX: clampedMediaValue(item.imageOffsetX, 0, -100, 100),
    imageOffsetY: clampedMediaValue(item.imageOffsetY, 0, -100, 100),
    frameOffsetX: clampedMediaValue(item.frameOffsetX, 0, -30, 30),
    frameOffsetY: clampedMediaValue(item.frameOffsetY, 0, -30, 30)
  };
  const doc = storefrontPreviewFrame?.contentDocument;
  let frame = null;
  let image = null;
  if (doc && itemType === "story") {
    const slide = doc.querySelector(`.brand-story-slide:nth-child(${Number(itemIndex) + 1})`);
    frame = slide?.querySelector(".brand-story-media-frame");
    image = slide?.querySelector(".brand-story-image");
  } else if (doc && itemType === "product") {
    const cards = [...doc.querySelectorAll(".product-card")];
    const product = cards.find((card) => card.dataset.productId === itemId) || cards[Number(itemIndex)];
    frame = product?.querySelector(".product-thumb-wrap");
    image = product?.querySelector(".product-thumb");
  }
  if (frame && image) {
    frame.style.transform = `translate(${media.frameOffsetX}%, ${media.frameOffsetY}%)`;
    frame.style.transformOrigin = "center";
    image.style.objectFit = media.imageFit;
    image.style.objectPosition = "center";
    image.style.transform = `translate(${media.imageOffsetX}%, ${media.imageOffsetY}%) scale(${media.imageScale / 100})`;
    image.style.transformOrigin = "center";
    return;
  }
  storefrontPreviewFrame?.contentWindow?.postMessage({
    type: "bakeaholic:media-preview",
    itemType,
    itemIndex,
    itemId,
    media
  }, window.location.origin);
}

function categoryMarkup(category, index) {
  return `
    <article class="product-editor-card" data-category-index="${index}">
      <div class="admin-grid three">
        <div class="admin-field">
          <label>Category id</label>
          <input data-category-field="id" type="text" value="${escapeHtml(category.id || "")}" />
        </div>
        <div class="admin-field">
          <label>Label</label>
          <input data-category-field="label" type="text" value="${escapeHtml(category.label || "")}" />
        </div>
        <div class="admin-field">
          <label>Description</label>
          <input data-category-field="description" type="text" value="${escapeHtml(category.description || "")}" />
        </div>
      </div>
    </article>
  `;
}

function productMarkup(product, index) {
  const categoryOptions = state.catalog.categories
    .map((category) => `
      <option value="${category.id}" ${category.id === product.category ? "selected" : ""}>
        ${category.label}
      </option>
    `)
    .join("");

  return `
    <article class="product-editor-card is-collapsed" data-product-index="${index}">
      <div class="product-editor-head">
        <div>
          <h3>${product.name || "New product"}</h3>
          <p>${escapeHtml(product.category || "Uncategorized")} · ${formatRupiah.format(product.price || 0)} · ${Number(product.stock || 0)} in stock</p>
        </div>
        <div class="product-editor-actions">
          <button class="admin-button secondary" type="button" data-toggle-product="${index}">Edit product</button>
          <button class="admin-text-button is-danger" type="button" data-remove-product="${index}">Remove</button>
        </div>
      </div>
      <div class="product-editor-body">
      <div class="admin-grid three">
        <div class="admin-field">
          <label>Product id</label>
          <input data-product-field="id" type="text" value="${escapeHtml(product.id || "")}" />
        </div>
        <div class="admin-field">
          <label>Name</label>
          <input data-product-field="name" type="text" value="${escapeHtml(product.name || "")}" />
        </div>
        <div class="admin-field">
          <label>Category</label>
          <select data-product-field="category">${categoryOptions}</select>
        </div>
        <div class="admin-field">
          <label>Retail price</label>
          <input data-product-field="price" type="number" min="0" step="1" value="${product.price || 0}" />
        </div>
        <div class="admin-field">
          <label>Wholesale price</label>
          <input data-product-field="wholesalePrice" type="number" min="0" step="1" value="${product.wholesalePrice || 0}" />
        </div>
        <div class="admin-field">
          <label>Stock</label>
          <input data-product-field="stock" type="number" min="0" step="1" value="${product.stock || 0}" />
        </div>
        <div class="admin-field">
          <label>Rating</label>
          <input data-product-field="rating" type="number" min="0" max="5" step="0.1" value="${product.rating || 0}" />
        </div>
        <div class="admin-field">
          <label>Reviews</label>
          <input data-product-field="reviews" type="number" min="0" step="1" value="${product.reviews || 0}" />
        </div>
        <div class="admin-field">
          <label>Badge</label>
          <input data-product-field="badge" type="text" value="${escapeHtml(product.badge || "")}" />
        </div>
        <div class="admin-field">
          <label>SKU</label>
          <input data-product-field="sku" type="text" value="${escapeHtml(product.sku || "")}" />
        </div>
        <div class="admin-field">
          <label>Barcode</label>
          <input data-product-field="barcode" type="text" value="${escapeHtml(product.barcode || "")}" />
        </div>
        <div class="admin-field">
          <label>Product image</label>
          <input class="admin-code-input" data-product-field="imagePath" type="text" value="${escapeHtml(product.imagePath || "")}" />
          ${imageUploadMarkup("product", index)}
        </div>
        <div class="admin-field">
          <label>Image fit</label>
          <select data-product-field="imageFit">
            <option value="contain" ${normalizeImageFit(product.imageFit) === "contain" ? "selected" : ""}>Contain</option>
            <option value="cover" ${normalizeImageFit(product.imageFit) === "cover" ? "selected" : ""}>Cover</option>
          </select>
        </div>
        ${mediaRangeControlsMarkup("data-product-field", product)}
        <div class="admin-field">
          <label>Min order</label>
          <input data-product-field="minOrder" type="text" value="${escapeHtml(product.minOrder || "")}" />
        </div>
        <div class="admin-field">
          <label>Shelf life</label>
          <input data-product-field="shelfLife" type="text" value="${escapeHtml(product.shelfLife || "")}" />
        </div>
        <div class="admin-field admin-image-preview-field">
          <label>Image preview</label>
          <div class="admin-image-preview-frame" style="${mediaFramePreviewStyle(product)}">
            ${product.imagePath ? `<img class="admin-image-preview" data-product-preview src="${escapeHtml(product.imagePath)}" alt="${escapeHtml(product.name || "Product preview")}" style="${productPreviewStyle(product)}" />` : `<div class="admin-image-preview-empty" data-product-preview-empty>No image yet</div>`}
          </div>
        </div>
        <div class="admin-field" style="grid-column: 1 / -1;">
          <label>Description</label>
          <textarea data-product-field="description">${escapeHtml(product.description || "")}</textarea>
        </div>
      </div>
      </div>
    </article>
  `;
}

function renderCategories() {
  categoryList.innerHTML = state.catalog.categories
    .map((category, index) => categoryMarkup(category, index))
    .join("");
}

function renderProducts() {
  productList.innerHTML = state.catalog.items
    .map((product, index) => productMarkup(product, index))
    .join("");

  productList.querySelectorAll("[data-remove-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.removeProduct);
      const productName = state.catalog.items[index]?.name || "this product";
      if (!window.confirm(`Remove ${productName}? This is not published until you click Publish changes.`)) {
        return;
      }
      state.catalog.items.splice(index, 1);
      renderPromoOptions();
      renderProducts();
      markCatalogDirty();
    });
  });

  productList.querySelectorAll("[data-toggle-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-product-index]");
      const isCollapsed = card.classList.toggle("is-collapsed");
      button.textContent = isCollapsed ? "Edit product" : "Close editor";
    });
  });

  productList.querySelectorAll("[data-product-index]").forEach((card) => {
    const syncPreview = () => {
      const pathField = card.querySelector('[data-product-field="imagePath"]');
      const fitField = card.querySelector('[data-product-field="imageFit"]');
      const positionXField = card.querySelector('[data-product-field="imageOffsetX"]');
      const positionYField = card.querySelector('[data-product-field="imageOffsetY"]');
      const scaleField = card.querySelector('[data-product-field="imageScale"]');
      const frameXField = card.querySelector('[data-product-field="frameOffsetX"]');
      const frameYField = card.querySelector('[data-product-field="frameOffsetY"]');
      const preview = card.querySelector("[data-product-preview]");
      const frame = card.querySelector(".admin-image-preview-frame");
      const emptyState = card.querySelector("[data-product-preview-empty]");
      const imagePath = pathField?.value.trim() || "";
      const x = clampedMediaValue(positionXField?.value, 0, -100, 100);
      const y = clampedMediaValue(positionYField?.value, 0, -100, 100);
      const scale = clampedMediaValue(scaleField?.value, 100, 50, 180);
      const previewStyle = `object-fit: ${normalizeImageFit(fitField?.value)}; object-position: center; transform: translate(${x}%, ${y}%) scale(${scale / 100}); transform-origin: center;`;
      const mediaDraft = {
        imageFit: fitField?.value,
        imageOffsetX: x,
        imageOffsetY: y,
        imageScale: scale,
        frameOffsetX: frameXField?.value,
        frameOffsetY: frameYField?.value
      };
      if (frame) {
        frame.style.cssText = mediaFramePreviewStyle(mediaDraft);
      }

      if (imagePath) {
        if (preview) {
          preview.src = imagePath;
          preview.style.cssText = previewStyle;
        } else if (emptyState) {
          emptyState.outerHTML = `<img class="admin-image-preview" data-product-preview src="${imagePath}" alt="Product preview" style="${previewStyle}" />`;
        }
      } else if (preview) {
        preview.outerHTML = '<div class="admin-image-preview-empty" data-product-preview-empty>No image yet</div>';
      }
      sendMediaPreview(
        "product",
        Number(card.dataset.productIndex || 0),
        card.querySelector('[data-product-field="id"]')?.value || "",
        mediaDraft
      );
    };

    card.querySelectorAll('[data-product-field="imagePath"], [data-product-field="imageFit"], [data-product-field="imageOffsetX"], [data-product-field="imageOffsetY"], [data-product-field="imageScale"], [data-product-field="frameOffsetX"], [data-product-field="frameOffsetY"]').forEach((field) => {
      field.addEventListener("input", syncPreview);
      field.addEventListener("change", syncPreview);
    });
    syncRangeOutputs(card);
  });
  wireImageUploads(productList);
}

function voucherTypeOptions(selectedType) {
  const options = [
    ["percent", "Percentage off products"],
    ["product_fixed", "Fixed amount off products"],
    ["delivery", "Free delivery"],
    ["fixed", "Fixed amount off whole order"]
  ];
  return options.map(([value, label]) => (
    `<option value="${value}" ${value === selectedType ? "selected" : ""}>${label}</option>`
  )).join("");
}

function voucherExpiryInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

function voucherMarkup(voucher, index) {
  return `
    <article class="voucher-editor-card" data-voucher-index="${index}">
      <div class="product-editor-head">
        <h3>${escapeHtml(voucher.code || "New discount")}</h3>
        <button class="admin-button secondary" type="button" data-remove-voucher="${index}">Remove</button>
      </div>
      <div class="admin-grid three">
        <div class="admin-field">
          <label>Code</label>
          <input class="admin-code-input" data-voucher-field="code" type="text" maxlength="32" value="${escapeHtml(voucher.code || "")}" />
        </div>
        <div class="admin-field">
          <label>Label</label>
          <input data-voucher-field="label" type="text" maxlength="90" value="${escapeHtml(voucher.label || "")}" />
        </div>
        <div class="admin-field">
          <label>Discount type</label>
          <select data-voucher-field="type">${voucherTypeOptions(voucher.type || "percent")}</select>
        </div>
        <div class="admin-field">
          <label>Value</label>
          <input data-voucher-field="value" type="number" min="0" step="1" value="${Number(voucher.value || 0)}" />
        </div>
        <div class="admin-field">
          <label>Maximum discount</label>
          <input data-voucher-field="maxDiscount" type="number" min="0" step="1" value="${Number(voucher.maxDiscount || 0)}" />
        </div>
        <div class="admin-field">
          <label>Usage limit</label>
          <input data-voucher-field="usageLimit" type="number" min="0" step="1" value="${Number(voucher.usageLimit || 0)}" />
        </div>
        <div class="admin-field">
          <label>Expires at</label>
          <input data-voucher-field="expiresAt" type="datetime-local" value="${voucherExpiryInput(voucher.expiresAt)}" />
        </div>
        <label class="admin-toggle-field">
          <input data-voucher-field="active" type="checkbox" ${voucher.active !== false ? "checked" : ""} />
          <span>Active</span>
        </label>
      </div>
    </article>
  `;
}

function renderVouchers() {
  if (!voucherList) return;
  if (!state.vouchers.length) {
    voucherList.innerHTML = `<div class="empty-state"><strong>No discount codes yet.</strong><p>Add one when you are ready to run the delivery-fee-only payment test.</p></div>`;
    return;
  }
  voucherList.innerHTML = state.vouchers.map(voucherMarkup).join("");
}

function renderAll() {
  renderStore();
  renderPromo();
  renderBrandStory();
  renderCategories();
  renderProducts();
  renderVouchers();
  wireImageUploads(document.querySelector('[data-admin-section="store"]'));
}

function collectStore() {
  const store = {};
  Object.entries(storeFields).forEach(([key, field]) => {
    store[key] = numericStoreFields.has(key)
      ? Number(field.value || 0)
      : field.value.trim();
  });
  return {
    ...state.catalog.store,
    ...store
  };
}

function collectPromo() {
  const promo = {};
  Object.entries(promoFields).forEach(([key, field]) => {
    promo[key] = field.value.trim();
  });
  return promo;
}

function collectBrandStory() {
  const slides = [...brandStorySlideList.querySelectorAll("[data-story-slide-index]")].map((card) => {
    const slide = {};
    card.querySelectorAll("[data-story-field]").forEach((field) => {
      slide[field.dataset.storyField] = field.value.trim();
    });
    slide.points = [0, 1, 2].map((pointIndex) => ({
      label: card.querySelector(`[data-story-point-label="${pointIndex}"]`)?.value.trim() || "",
      icon: card.querySelector(`[data-story-point-icon="${pointIndex}"]`)?.value || "leaf"
    })).filter((point) => point.label);
    return slide;
  });
  return {
    ...slides[0],
    points: slides[0]?.points || [],
    slides
  };
}

function collectCategories() {
  return [...categoryList.querySelectorAll("[data-category-index]")].map((card) => {
    const category = {};
    card.querySelectorAll("[data-category-field]").forEach((field) => {
      category[field.dataset.categoryField] = field.value.trim();
    });
    return category;
  });
}

function collectProducts() {
  return [...productList.querySelectorAll("[data-product-index]")].map((card, index) => {
    const product = {};
    card.querySelectorAll("[data-product-field]").forEach((field) => {
      const key = field.dataset.productField;
      if (["price", "wholesalePrice", "stock", "rating", "reviews"].includes(key)) {
        product[key] = Number(field.value || 0);
      } else {
        product[key] = field.value.trim();
      }
    });
    return {
      ...(state.catalog.items[index] || {}),
      ...product
    };
  });
}

async function saveCatalog() {
  try {
    setStatus("Saving catalog...");
    const payload = collectCatalogDraft();
    const response = await request("/api/admin/catalog", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    state.catalog = response.catalog;
    renderAll();
    state.catalogDirty = false;
    updatePublishState();
    refreshStorefrontPreview();
    setStatus("Storefront changes published successfully.");
  } catch (error) {
    setStatus(error.message);
  }
}

async function saveIntegrations() {
  try {
    setStatus("Saving integrations...");
    const payload = {
      googleMapsApiKey: integrationFields.googleMapsApiKey.value.trim(),
      biteshipApiKey: integrationFields.biteshipApiKey.value.trim(),
      biteshipCouriers: integrationFields.biteshipCouriers.value.trim(),
      biteshipWebhookHeaderName: integrationFields.biteshipWebhookHeaderName.value.trim(),
      biteshipWebhookHeaderSecret: integrationFields.biteshipWebhookHeaderSecret.value.trim(),
      xenditEnvironment: integrationFields.xenditEnvironment.value,
      xenditSecretKey: integrationFields.xenditSecretKey.value.trim(),
      xenditCallbackToken: integrationFields.xenditCallbackToken.value.trim(),
      whatsappAccessToken: integrationFields.whatsappAccessToken.value.trim(),
      whatsappPhoneNumberId: integrationFields.whatsappPhoneNumberId.value.trim(),
      whatsappBusinessAccountId: integrationFields.whatsappBusinessAccountId.value.trim(),
      whatsappVerifyToken: integrationFields.whatsappVerifyToken.value.trim(),
      whatsappAppId: integrationFields.whatsappAppId.value.trim(),
      whatsappAppSecret: integrationFields.whatsappAppSecret.value.trim(),
      whatsappGraphVersion: integrationFields.whatsappGraphVersion.value.trim(),
      whatsappOtpTemplateName: integrationFields.whatsappOtpTemplateName.value.trim(),
      whatsappOrderTemplateName: integrationFields.whatsappOrderTemplateName.value.trim(),
      whatsappReceiptTemplateName: integrationFields.whatsappReceiptTemplateName.value.trim(),
      whatsappPaymentReminderTemplateName: integrationFields.whatsappPaymentReminderTemplateName.value.trim(),
      whatsappPaymentExpiredTemplateName: integrationFields.whatsappPaymentExpiredTemplateName.value.trim(),
      whatsappShippingTemplateName: integrationFields.whatsappShippingTemplateName.value.trim(),
      whatsappAdminNumber: [
        integrationFields.whatsappAdminNumber.value,
        integrationFields.whatsappAdminNumber2.value,
        integrationFields.whatsappAdminNumber3.value
      ].map((value) => value.trim()).filter(Boolean).slice(0, 3).join(","),
      whatsappAdminTemplateName: integrationFields.whatsappAdminTemplateName.value.trim(),
      whatsappAdminShippingTemplateName: integrationFields.whatsappAdminShippingTemplateName.value.trim(),
      whatsappTemplateLanguage: integrationFields.whatsappTemplateLanguage.value.trim()
    };
    const response = await request("/api/admin/integrations", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    renderIntegrations(response.integrations);
    setStatus("Integrations saved to local .env.");
  } catch (error) {
    setStatus(error.message);
  }
}

async function testWhatsappTemplates() {
  const diagnosticLine = (result) => {
    const summary = `${result.ok ? "PASS" : "FAIL"}  ${result.key}  ${result.templateName || "not configured"}${result.error ? `  ${result.error}` : ""}`;
    const recipients = (result.recipients || [])
      .map((recipient) => `\n      ${recipient.sent ? "PASS" : "FAIL"}  Admin ${recipient.recipient || "recipient"}  ${recipient.sent ? "Accepted by Meta" : recipient.error || "Delivery failed"}`)
      .join("");
    return `${summary}${recipients}`;
  };
  try {
    testWhatsappTemplatesButton.disabled = true;
    whatsappTemplateTestResults.hidden = false;
    whatsappTemplateTestResults.textContent = "Sending synthetic WhatsApp template tests...";
    const response = await request("/api/admin/whatsapp-template-tests", { method: "POST" });
    whatsappTemplateTestResults.textContent = response.results
      .map(diagnosticLine)
      .join("\n");
    setStatus(response.ok ? "All WhatsApp templates were accepted by Meta." : "One or more WhatsApp templates failed.");
  } catch (error) {
    const results = error.payload?.results || [];
    whatsappTemplateTestResults.textContent = results.length
      ? results.map(diagnosticLine).join("\n")
      : error.message;
    setStatus("One or more WhatsApp templates failed.");
  } finally {
    testWhatsappTemplatesButton.disabled = false;
  }
}

async function inspectWhatsappTemplates() {
  try {
    inspectWhatsappTemplatesButton.disabled = true;
    whatsappTemplateTestResults.hidden = false;
    whatsappTemplateTestResults.textContent = "Reading approved template schemas from Meta...";
    const response = await request("/api/admin/whatsapp-template-schemas");
    whatsappTemplateTestResults.textContent = JSON.stringify(response.templates, null, 2);
    setStatus(`Loaded ${response.templates.length} WhatsApp template schemas from Meta.`);
  } catch (error) {
    whatsappTemplateTestResults.textContent = error.message;
    setStatus("Could not load WhatsApp template schemas.");
  } finally {
    inspectWhatsappTemplatesButton.disabled = false;
  }
}

function collectVouchers() {
  return [...voucherList.querySelectorAll("[data-voucher-index]")].map((card) => ({
    code: card.querySelector('[data-voucher-field="code"]')?.value.trim().toUpperCase() || "",
    label: card.querySelector('[data-voucher-field="label"]')?.value.trim() || "",
    type: card.querySelector('[data-voucher-field="type"]')?.value || "percent",
    value: Number(card.querySelector('[data-voucher-field="value"]')?.value || 0),
    maxDiscount: Number(card.querySelector('[data-voucher-field="maxDiscount"]')?.value || 0),
    usageLimit: Number(card.querySelector('[data-voucher-field="usageLimit"]')?.value || 0),
    expiresAt: card.querySelector('[data-voucher-field="expiresAt"]')?.value || "",
    active: Boolean(card.querySelector('[data-voucher-field="active"]')?.checked)
  }));
}

async function saveVouchers() {
  try {
    setStatus("Saving discounts...");
    const response = await request("/api/admin/vouchers", {
      method: "PUT",
      body: JSON.stringify({ vouchers: collectVouchers() })
    });
    state.vouchers = response.vouchers || [];
    renderVouchers();
    setStatus("Discount codes saved.");
  } catch (error) {
    setStatus(error.message);
  }
}

function addVoucher() {
  state.vouchers.push({
    code: "",
    label: "",
    type: "percent",
    value: 10,
    maxDiscount: 0,
    usageLimit: 0,
    expiresAt: "",
    active: true
  });
  renderVouchers();
}

async function loadOrders() {
  if (!adminOrderList) return;
  try {
    adminOrderList.innerHTML = `<div class="empty-state">Loading orders...</div>`;
    const response = await request("/api/orders");
    state.orders = Array.isArray(response.orders) ? response.orders : [];
    renderAdminOrders();
    renderDashboard();
    renderReports();
  } catch (error) {
    adminOrderList.innerHTML = `
      <div class="empty-state">
        <strong>Unable to load orders.</strong>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

async function approveDelivery(orderId) {
  try {
    setStatus(`Approving delivery for ${orderId}...`);
    await request(`/api/admin/orders/${encodeURIComponent(orderId)}/approve-delivery`, {
      method: "POST",
      body: JSON.stringify({})
    });
    await loadOrders();
    setStatus(`Delivery approved for ${orderId}.`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function rebookDelivery(orderId) {
  try {
    setStatus(`Checking Biteship delivery for ${orderId}...`);
    await request(`/api/admin/orders/${encodeURIComponent(orderId)}/rebook-delivery`, {
      method: "POST",
      body: JSON.stringify({})
    });
    await loadOrders();
    setStatus(`Replacement delivery booked for ${orderId}.`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function cancelDelivery(orderId) {
  try {
    setStatus(`Cancelling Biteship delivery for ${orderId}...`);
    await request(`/api/admin/orders/${encodeURIComponent(orderId)}/cancel-delivery`, {
      method: "POST",
      body: JSON.stringify({})
    });
    await loadOrders();
    setStatus(`Delivery cancelled for ${orderId}. Update the pickup pin, then rebook.`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function syncDeliveryStatus(orderId) {
  try {
    setStatus(`Syncing Biteship delivery for ${orderId}...`);
    await request(`/api/admin/orders/${encodeURIComponent(orderId)}/sync-delivery`, {
      method: "POST",
      body: JSON.stringify({})
    });
    await loadOrders();
    setStatus(`Biteship delivery status synced for ${orderId}.`);
  } catch (error) {
    setStatus(error.message);
  }
}

function addProduct() {
  const firstCategory = state.catalog.categories[0]?.id || "";
  state.catalog.items.push({
    id: "",
    category: firstCategory,
    name: "",
    description: "",
    price: 0,
    wholesalePrice: 0,
    rating: 0,
    reviews: 0,
    badge: "",
    sku: "",
    barcode: "",
    minOrder: "",
    shelfLife: "",
    imagePath: "",
    imageFit: "contain",
    imagePosition: "center",
    stock: 0
  });
  renderPromoOptions();
  renderProducts();
  markCatalogDirty();
}

function addCategory() {
  state.catalog.categories.push({ id: `category-${Date.now()}`, label: "New category", description: "" });
  renderCategories();
  markCatalogDirty();
}

function addStorySlide() {
  const slides = normalizeBrandStorySlides(collectBrandStory());
  const fallback = defaultBrandStory().slides[0];
  slides.push({ ...fallback, kicker: "New story", title: "New carousel slide", body: "", secondaryBody: "", imageFit: "cover", imagePosition: "center", points: [] });
  state.catalog.brandStory = { ...slides[0], slides };
  renderBrandStory();
  markCatalogDirty();
}

async function bootstrap() {
  await ensureAdminSession();
  const [catalog, integrations, voucherResponse, publicConfig, orderResponse] = await Promise.all([
    request("/api/admin/catalog"),
    request("/api/admin/integrations"),
    request("/api/admin/vouchers"),
    request("/api/public-config"),
    request("/api/orders")
  ]);
  state.catalog = catalog;
  state.vouchers = voucherResponse.vouchers || [];
  state.integrations = integrations;
  state.orders = Array.isArray(orderResponse.orders) ? orderResponse.orders : [];
  renderAll();
  renderIntegrations(integrations);
  renderAdminOrders();
  renderReports();
  restoreLiveTestChecklist();
  updatePublishState();
  await initializeKitchenMap(publicConfig.googleMapsApiKey).catch(() => {
    // The operations overview should remain usable if the optional map preview
    // cannot initialize. The Storefront section still exposes the saved address.
  });
  const requestedSection = window.location.hash.slice(1);
  const initialSection = requestedSection.startsWith("docs-")
    ? "documentation"
    : (sectionHeadings[requestedSection] ? requestedSection : "dashboard");
  showAdminSection(initialSection);
  setStatus("Operations console ready.");
}

saveCatalogButton.addEventListener("click", saveCatalog);
saveIntegrationsButton.addEventListener("click", saveIntegrations);
testWhatsappTemplatesButton.addEventListener("click", testWhatsappTemplates);
inspectWhatsappTemplatesButton.addEventListener("click", inspectWhatsappTemplates);
addProductButton.addEventListener("click", addProduct);
addCategoryButton?.addEventListener("click", addCategory);
addStorySlideButton?.addEventListener("click", addStorySlide);
saveVouchersButton?.addEventListener("click", saveVouchers);
addVoucherButton?.addEventListener("click", addVoucher);
adminLogoutButton.addEventListener("click", logoutAdmin);
refreshOrdersButton?.addEventListener("click", loadOrders);
reportPeriodSelect?.addEventListener("change", renderReports);
exportCustomersButton?.addEventListener("click", exportBuyerCsv);
downloadReportPdfButton?.addEventListener("click", downloadReportPdf);
printReportButton?.addEventListener("click", printReportA4);
adminOrderList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-approve-delivery]");
  if (button) {
    approveDelivery(button.dataset.approveDelivery);
    return;
  }
  const syncButton = event.target.closest("[data-sync-delivery]");
  if (syncButton) {
    syncDeliveryStatus(syncButton.dataset.syncDelivery);
    return;
  }
  const cancelButton = event.target.closest("[data-cancel-delivery]");
  if (cancelButton) {
    cancelDelivery(cancelButton.dataset.cancelDelivery);
    return;
  }
  const rebookButton = event.target.closest("[data-rebook-delivery]");
  if (rebookButton) {
    rebookDelivery(rebookButton.dataset.rebookDelivery);
  }
});
voucherList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-voucher]");
  if (!button) return;
  state.vouchers.splice(Number(button.dataset.removeVoucher), 1);
  renderVouchers();
});
adminNavButtons.forEach((button) => {
  button.addEventListener("click", () => showAdminSection(button.dataset.adminTarget));
});
storeFields.kitchenLat.addEventListener("change", syncKitchenMapFromFields);
storeFields.kitchenLng.addEventListener("change", syncKitchenMapFromFields);
storeFields.kitchenAddress.addEventListener("change", updateKitchenMapLink);
adminSectionSelect?.addEventListener("change", () => showAdminSection(adminSectionSelect.value));
document.getElementById("runSystemCheckButton")?.addEventListener("click", runSystemCheck);
document.getElementById("resetLiveTestChecklistButton")?.addEventListener("click", resetLiveTestChecklist);
document.getElementById("liveTestChecklist")?.addEventListener("change", saveLiveTestChecklist);
document.querySelectorAll("[data-dashboard-target]").forEach((button) => {
  button.addEventListener("click", () => showAdminSection(button.dataset.dashboardTarget));
});
adminMain?.addEventListener("input", (event) => {
  const isMediaRange = event.target.matches('.admin-media-controls input[type="range"]');
  if (isMediaRange) {
    syncRangeOutputs(event.target.closest(".admin-media-controls") || document);
  }
  if (event.target === storeFields.logoPath) {
    const logoPreview = document.getElementById("storeLogoPreview");
    if (logoPreview) logoPreview.src = event.target.value.trim() || "/assets/bakeaholic-logo.jpg";
  }
  if (event.target === storeFields.footerLogoPath) {
    const footerLogoPreview = document.getElementById("footerLogoPreview");
    if (footerLogoPreview) footerLogoPreview.src = event.target.value.trim() || storeFields.logoPath.value || "/assets/bakeaholic-logo.jpg";
  }
  if ([storeFields.logoScale, storeFields.logoOffsetX, storeFields.logoOffsetY].includes(event.target)) {
    syncLogoEditorPreview("store");
  }
  if ([storeFields.footerLogoScale, storeFields.footerLogoOffsetX, storeFields.footerLogoOffsetY].includes(event.target)) {
    syncLogoEditorPreview("footer");
  }
  const section = event.target.closest("[data-admin-section]");
  if (section && catalogActionSections.has(section.dataset.adminSection)) {
    markCatalogDirty(!isMediaRange);
  }
});
adminMain?.addEventListener("focusin", (event) => {
  if (!event.target.matches("input, textarea, select, button, summary")) return;
  const details = previewFocusDetails(event.target);
  focusStorefrontPreview(details.section, details.itemIndex, details.field);
});
adminMain?.addEventListener("change", (event) => {
  const section = event.target.closest("[data-admin-section]");
  if (section && catalogActionSections.has(section.dataset.adminSection)) {
    markCatalogDirty();
  }
});

let mediaDrag = null;

function syncDraggedMediaPreview(drag) {
  if (!drag) return;
  syncRangeOutputs(drag.editor || drag.frame);
  if (drag.xRange.id === "storeLogoPositionXInput") {
    syncLogoEditorPreview("store");
    return;
  }
  if (drag.xRange.id === "footerLogoPositionXInput") {
    syncLogoEditorPreview("footer");
    return;
  }
  const image = drag.frame.querySelector("img");
  if (!image) return;
  const fitField = drag.editor?.querySelector('[data-story-field="imageFit"], [data-product-field="imageFit"]');
  const scaleField = drag.editor?.querySelector('[data-story-field="imageScale"], [data-product-field="imageScale"]');
  image.style.cssText = productPreviewStyle({
    imageFit: fitField?.value,
    imageOffsetX: drag.xRange.value,
    imageOffsetY: drag.yRange.value,
    imageScale: scaleField?.value
  });
}

adminMain?.addEventListener("pointerdown", (event) => {
  const frame = event.target.closest(".admin-image-preview-frame, .admin-logo-preview");
  const image = frame?.querySelector("img");
  if (!frame || !image) return;
  const localField = frame.closest(".admin-field");
  const editor = localField?.querySelector(".admin-media-controls")
    ? localField
    : frame.closest("[data-story-slide-index], [data-product-index], [data-admin-section]");
  const controls = editor?.querySelector(".admin-media-controls");
  const ranges = controls ? [...controls.querySelectorAll('input[type="range"]')] : [];
  const fieldName = (range) => range.dataset.storyField || range.dataset.productField || range.id;
  const xRange = ranges.find((range) => frame.classList.contains("admin-logo-preview")
    ? /PositionX/.test(fieldName(range))
    : fieldName(range) === "imageOffsetX");
  const yRange = ranges.find((range) => frame.classList.contains("admin-logo-preview")
    ? /PositionY/.test(fieldName(range))
    : fieldName(range) === "imageOffsetY");
  if (!xRange || !yRange) return;
  event.preventDefault();
  frame.setPointerCapture(event.pointerId);
  frame.classList.add("is-dragging");
  mediaDrag = {
    frame,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    valueX: Number(xRange.value || 0),
    valueY: Number(yRange.value || 0),
    xRange,
    yRange,
    editor,
    moved: false
  };
});

adminMain?.addEventListener("pointermove", (event) => {
  if (!mediaDrag || mediaDrag.pointerId !== event.pointerId) return;
  const rect = mediaDrag.frame.getBoundingClientRect();
  const x = mediaDrag.valueX + ((event.clientX - mediaDrag.startX) / Math.max(rect.width, 1)) * 100;
  const y = mediaDrag.valueY + ((event.clientY - mediaDrag.startY) / Math.max(rect.height, 1)) * 100;
  mediaDrag.xRange.value = String(Math.max(-100, Math.min(100, Math.round(x))));
  mediaDrag.yRange.value = String(Math.max(-100, Math.min(100, Math.round(y))));
  mediaDrag.moved = true;
  syncDraggedMediaPreview(mediaDrag);
});

function finishMediaDrag(event) {
  if (!mediaDrag || mediaDrag.pointerId !== event.pointerId) return;
  const completedDrag = mediaDrag;
  completedDrag.frame.classList.remove("is-dragging");
  mediaDrag = null;
  if (completedDrag.moved) markCatalogDirty();
}

adminMain?.addEventListener("pointerup", finishMediaDrag);
adminMain?.addEventListener("pointercancel", finishMediaDrag);
adminMain?.addEventListener("lostpointercapture", finishMediaDrag);
document.getElementById("refreshStorefrontPreview")?.addEventListener("click", refreshStorefrontPreview);
storefrontPreviewFrame?.addEventListener("load", () => {
  if (state.catalogDirty) {
    window.setTimeout(sendDraftPreview, 80);
  }
  window.setTimeout(() => focusStorefrontPreview(adminSectionSelect?.value || "store"), 240);
});
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin || event.source !== storefrontPreviewFrame?.contentWindow) return;
  if (event.data?.type === "bakeaholic:preview-ready") {
    if (state.catalogDirty) sendDraftPreview();
    window.setTimeout(() => focusStorefrontPreview(adminSectionSelect?.value || "store"), 80);
  }
});
document.getElementById("adminProductSearch")?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  productList.querySelectorAll("[data-product-index]").forEach((card) => {
    const searchable = [
      card.querySelector('[data-product-field="name"]')?.value,
      card.querySelector('[data-product-field="sku"]')?.value,
      card.querySelector('[data-product-field="category"]')?.value,
      card.querySelector('[data-product-field="id"]')?.value
    ].join(" ").toLowerCase();
    card.hidden = Boolean(query) && !searchable.includes(query);
  });
});
document.querySelectorAll("[data-preview-device]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-preview-device]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    storefrontPreviewViewport.classList.toggle("is-mobile", button.dataset.previewDevice === "mobile");
    storefrontPreviewViewport.classList.toggle("is-desktop", button.dataset.previewDevice === "desktop");
    adminMain.classList.toggle("is-desktop-preview", button.dataset.previewDevice === "desktop");
    adminMain.classList.toggle("is-mobile-preview", button.dataset.previewDevice === "mobile");
  });
});
window.addEventListener("beforeunload", (event) => {
  if (!state.catalogDirty) return;
  event.preventDefault();
  event.returnValue = "";
});
brandStorySlideList.addEventListener("input", (event) => {
  if (event.target.matches('[data-story-field="imagePath"]')) {
    syncBrandStoryPreview(event.target.closest("[data-story-slide-index]"));
  }
});

bootstrap().catch((error) => {
  setStatus(error.message);
});
