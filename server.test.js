const assert = require("node:assert/strict");
const test = require("node:test");
const vm = require("node:vm");

const {
  adminPermissions,
  adminOrderReviewButtonQuery,
  adminOrderReviewWhatsappParameters,
  applyXenditQrCodeStatusToOrder,
  applyXenditPaymentSessionStatusToOrder,
  applyXenditRefundStatusToOrder,
  applyXenditVirtualAccountStatusToOrder,
  buildXenditInvoicePayload,
  buildXenditPaymentRequestPayload,
  buildXenditPaymentSessionPayload,
  adminWhatsappParameters,
  adminWhatsappNumbers,
  availablePaymentMethods,
  configuredWhatsappOrderTemplateName,
  customerShippingWhatsappParameters,
  defaultSecurityHeaders,
  findOrderPaymentByXenditReference,
  formatIndonesianPhone,
  formatPhoneWithCountryCode,
  hasBiteshipShipmentForMessaging,
  isOrderPaymentWindowExpired,
  isSuccessfulXenditPaymentEvent,
  isValidWhatsAppPhone,
  isBaliDeliveryLocation,
  isFailedXenditPaymentEvent,
  isSupportedImageBuffer,
  metaAttributionFromRequest,
  metaUserDataFromOrder,
  isXenditRefundEvent,
  orderUpdateWhatsappParameters,
  orderIdFromWhatsappReplyContext,
  parsePublicOrderReference,
  runWhatsappTemplateDiagnostics,
  maybeSendWhatsappPaymentReceipt,
  maybeSendWhatsappAdminAlert,
  sendWhatsappAdminAlert,
  sendWhatsappAdminRefundUpdate,
  securityTxtBody,
  selectXenditSecretKey,
  sendWhatsappTemplateMessage,
  updateAdminWhatsappDeliveryStatus,
  shippingWhatsappDetails,
  shipmentStatusToOrderStatus,
  normalizedShipmentStatus,
  isRecoverableFailedShipmentStatus,
  replacementTrackingNotificationReady,
  assertDeliveryRecoveryRequest,
  xenditPaymentAmount,
  xenditOrderReferenceIds,
  xenditQrExternalIds,
  xenditPaymentSessionIds,
  xenditCallbackReferenceIds,
  xenditRefundRequestBody,
  xenditKeyMode,
  hashAdminPassword,
  hashRecoveryCode,
  generateRecoveryCodes,
  verifyAdminPassword,
  base32Encode,
  totpCode,
  verifyTotp,
  productionCookieDomain,
  serializeCookie,
  isSupportedClientFunnelEvent,
  productIdFromPathname,
  productPageHtml,
  metaProductDeepLinkConfig
} = require("./server");

test("Meta Collection mapping uses the Ops-ranked available products", () => {
  assert.deepEqual(metaProductDeepLinkConfig("bliss-peanutella"), {
    opsProductId: "PEANUTELLA", barcode: "101066051706", latestStock: 42, featured: true
  });
  assert.deepEqual(metaProductDeepLinkConfig("cookie-lamington"), {
    opsProductId: "LAMINGTON", barcode: "101005051856", latestStock: 20, featured: true
  });
  assert.deepEqual(metaProductDeepLinkConfig("oats-banoffee-pie"), {
    opsProductId: "BANOFFEE", barcode: "101005051850", latestStock: 5, featured: true
  });
  assert.deepEqual(metaProductDeepLinkConfig("mallow-vanilla"), {
    opsProductId: "VANILLAM", barcode: "1010011202401", latestStock: 6, featured: true
  });
  for (const itemId of ["bliss-triple-chocolate", "cookie-choc-chip", "cookie-smores"]) {
    assert.equal(metaProductDeepLinkConfig(itemId).featured, false);
  }
});

test("product deep links resolve exact catalogue ids and reject invalid paths", () => {
  assert.equal(productIdFromPathname("/products/bliss-peanutella"), "bliss-peanutella");
  assert.equal(productIdFromPathname("/products/COOKIE-SMORES/"), "cookie-smores");
  assert.equal(productIdFromPathname("/products/"), "");
  assert.equal(productIdFromPathname("/products/private customer data"), "");
  assert.equal(productIdFromPathname("/products/bliss-peanutella/extra"), "");
});

test("product pages expose Meta metadata for available and unavailable products", () => {
  const template = "<html><head><title>Bakeaholic Online Shop</title></head><body></body></html>";
  const available = productPageHtml(template, {
    id: "bliss-peanutella",
    name: "Peanutella Bliss Balls",
    category: "bliss-balls",
    description: "Chocolate and peanut snack.",
    imagePath: "/assets/products/peanutella.png",
    price: 75000,
    stock: 12
  }, [{ id: "bliss-balls", label: "Bliss Balls", description: "Bali-made snacks." }]);
  assert.match(available, /<title>Peanutella Bliss Balls \| Bakeaholic Bali<\/title>/);
  assert.match(available, /<base href="\/" \/>/);
  assert.match(available, /property="og:type" content="product"/);
  assert.match(available, /property="og:url" content="https:\/\/bakeaholicbali\.com\/products\/bliss-peanutella"/);
  assert.match(available, /property="product:price:amount" content="75000"/);
  assert.match(available, /property="product:availability" content="in stock"/);
  assert.match(available, /https:\/\/schema\.org\/InStock/);

  const opsUnavailable = productPageHtml(template, {
    id: "cookie-choc-chip",
    name: "Chocolate Chip Oatmeal Cookie",
    category: "oatmeal-cookies",
    imagePath: "/assets/products/cookies.jpg",
    price: 20000,
    stock: 36
  }, []);
  assert.match(opsUnavailable, /property="product:availability" content="out of stock"/);
  assert.match(opsUnavailable, /https:\/\/schema\.org\/OutOfStock/);

  const unavailable = productPageHtml(template, {
    id: "cookie-raisin",
    name: "Raisin Oatmeal Cookie",
    category: "oatmeal-cookies",
    imagePath: "/assets/products/cookies.jpg",
    price: 20000,
    stock: 0
  }, []);
  assert.match(unavailable, /property="product:availability" content="out of stock"/);
  assert.match(unavailable, /https:\/\/schema\.org\/OutOfStock/);
});

test("product deep-link UI preserves existing cart and checkout actions", () => {
  const appSource = require("node:fs").readFileSync(require("node:path").join(__dirname, "app.js"), "utf8");
  assert.match(appSource, /addToCart\(selectedProductId, productModalAddButton\)/);
  assert.match(appSource, /window\.location\.href = cartPageUrl\(\)/);
  assert.match(appSource, /applyCatalogPayload\(payload\);\s+document\.title = "Bakeaholic Online Shop";\s+if \(deepLinkedProductId\) \{\s+openProductModal\(deepLinkedProductId, \{ updateHistory: false \}\)/);
  assert.match(appSource, /deepLinkedProductAvailability === "out of stock"/);
  assert.match(appSource, /BakeaholicAnalytics\?\.viewProduct\(item\)/);
});

function createMetaPixelHarness(pathname = "/products/bliss-peanutella") {
  const fetches = [];
  const fbqCalls = [];
  const window = {
    location: { origin: "https://bakeaholicbali.com", pathname },
    crypto: { randomUUID: () => "test-event-id" },
    fetch: async (url, options) => { fetches.push({ url, options }); return { ok: true }; },
    sessionStorage: { getItem: () => null, setItem: () => {} }
  };
  window.fbq = (...args) => fbqCalls.push(args);
  const document = { createElement: () => ({}), head: { appendChild: () => {} } };
  const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "meta-pixel.js"), "utf8");
  vm.runInNewContext(source, { window, document, Date, Math, Number, String, Object, Array });
  return { window, fetches, fbqCalls };
}

test("product ViewContent uses the exact Meta payload once per product view", () => {
  for (const [itemId, price] of [
    ["bliss-peanutella", 75000],
    ["cookie-lamington", 20000],
    ["oats-banoffee-pie", 25000],
    ["mallow-vanilla", 7500]
  ]) {
    const harness = createMetaPixelHarness(`/products/${itemId}`);
    const item = { id: itemId, price };
    harness.window.BakeaholicAnalytics.viewProduct(item);
    harness.window.BakeaholicAnalytics.viewProduct(item);

    const viewContentCalls = harness.fbqCalls.filter((entry) => entry[0] === "track" && entry[1] === "ViewContent");
    assert.equal(viewContentCalls.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(viewContentCalls[0][2])), {
      content_ids: [itemId], content_type: "product", currency: "IDR", value: price
    });
    const serverEvents = harness.fetches
      .filter((entry) => entry.url === "/api/meta/events")
      .map((entry) => JSON.parse(entry.options.body))
      .filter((entry) => entry.eventName === "ViewContent");
    assert.equal(serverEvents.length, 1);
    assert.deepEqual(serverEvents[0].customData, {
      content_ids: [itemId], content_type: "product", currency: "IDR", value: price
    });
  }
});

test("product ViewContent deduplicates hydration and modal reopen but tracks a new exact state", () => {
  const harness = createMetaPixelHarness();
  const item = { id: "cookie-lamington", price: 20000 };
  harness.window.BakeaholicAnalytics.viewProduct(item);
  harness.window.BakeaholicAnalytics.viewProduct(item);
  harness.window.location.pathname = "/products/oats-banoffee-pie";
  harness.window.BakeaholicAnalytics.viewProduct({ id: "oats-banoffee-pie", price: 25000 });
  harness.window.location.pathname = "/products/cookie-lamington";
  harness.window.BakeaholicAnalytics.viewProduct(item);
  const events = harness.fbqCalls.filter((entry) => entry[1] === "ViewContent");
  assert.deepEqual(events.map((entry) => entry[2].content_ids[0]), [
    "cookie-lamington", "oats-banoffee-pie", "cookie-lamington"
  ]);
});

test("invalid product state does not emit ViewContent", () => {
  const harness = createMetaPixelHarness("/products/not-a-real-product");
  assert.equal(harness.window.BakeaholicAnalytics.viewProduct(null), "");
  assert.equal(harness.window.BakeaholicAnalytics.viewProduct({ id: "", price: 75000 }), "");
  assert.equal(harness.window.BakeaholicAnalytics.viewProduct({ id: "not-a-real-product", price: "invalid" }), "");
  assert.equal(harness.fbqCalls.some((entry) => entry[1] === "ViewContent"), false);
});

test("checkout-stage funnel events are fixed and privacy-safe", () => {
  for (const event of [
    "checkout_viewed",
    "address_opened",
    "address_selected",
    "delivery_quote_succeeded",
    "delivery_quote_failed"
  ]) {
    assert.equal(isSupportedClientFunnelEvent(event), true);
  }
  assert.equal(isSupportedClientFunnelEvent("address=private customer data"), false);
  assert.equal(isSupportedClientFunnelEvent("delivery_quote_failed:customer address"), false);
});

test("WhatsApp normalization supports international and Indonesian registrations", () => {
  assert.equal(formatPhoneWithCountryCode("0812 3456 7890", "62"), "6281234567890");
  assert.equal(formatPhoneWithCountryCode("62812 3456 7890", "62"), "6281234567890");
  assert.equal(formatPhoneWithCountryCode("21 97021 6750", "55"), "5521970216750");
  assert.equal(formatPhoneWithCountryCode("55 219 702 1675", "55"), "55552197021675");
  assert.equal(formatPhoneWithCountryCode("+55 21 97021 6750", "55"), "5521970216750");
  assert.equal(formatPhoneWithCountryCode("+55 21 97021 6750", "62"), "");
  assert.equal(formatIndonesianPhone("5521970216750"), "5521970216750");
  assert.equal(isValidWhatsAppPhone("5521970216750"), true);
});

test("delivery geofence accepts Bali and rejects international destinations", () => {
  assert.equal(isBaliDeliveryLocation({ lat: -8.66425, lng: 115.176172 }), true);
  assert.equal(isBaliDeliveryLocation({ lat: -8.7275, lng: 115.5444 }), true);
  assert.equal(isBaliDeliveryLocation({ lat: -23.55052, lng: -46.633308 }), false);
  assert.equal(isBaliDeliveryLocation({ lat: 3.139, lng: 101.6869 }), false);
});

test("delivery recovery accepts only the exact failed shipment and a replay-safe action ID", () => {
  const order = {
    status: "delivery_issue",
    fulfillment: {
      type: "delivery",
      shipment: { orderId: "ship-failed-1", status: "courier_not_found" }
    }
  };
  assert.equal(
    assertDeliveryRecoveryRequest(order, "ship-failed-1", "recovery_action_123456"),
    "ship-failed-1"
  );
  assert.throws(
    () => assertDeliveryRecoveryRequest(order, "ship-stale", "recovery_action_123456"),
    /delivery changed/i
  );
  assert.throws(
    () => assertDeliveryRecoveryRequest(order, "ship-failed-1", "short"),
    /valid recovery action ID/i
  );
});

test("delivery recovery normalizes provider states and excludes active shipments", () => {
  assert.equal(normalizedShipmentStatus("courier not found"), "courier_not_found");
  assert.equal(isRecoverableFailedShipmentStatus("cancelled"), true);
  assert.equal(isRecoverableFailedShipmentStatus("rejected"), true);
  assert.equal(isRecoverableFailedShipmentStatus("courier_not_found"), true);
  assert.equal(isRecoverableFailedShipmentStatus("allocated"), false);
  assert.equal(isRecoverableFailedShipmentStatus("picked_up"), false);
  assert.equal(replacementTrackingNotificationReady({ replacement: true, status: "confirmed" }), false);
  assert.equal(replacementTrackingNotificationReady({ replacement: true, status: "allocated" }), true);
  assert.equal(replacementTrackingNotificationReady({ replacement: true, status: "accepted" }), true);
  assert.equal(replacementTrackingNotificationReady({ status: "confirmed" }), true);
});

test("Meta Purchase attribution uses checkout network data without customer details", () => {
  const attribution = metaAttributionFromRequest({
    headers: {
      "cf-connecting-ip": "203.0.113.8",
      "user-agent": "Bakeaholic customer browser",
      cookie: "_fbp=fb.1.1234567890.123456789; _fbc=fb.1.1234567890.AbCdEf"
    },
    socket: {}
  });
  assert.deepEqual(attribution, {
    clientIpAddress: "203.0.113.8",
    clientUserAgent: "Bakeaholic customer browser",
    fbp: "fb.1.1234567890.123456789",
    fbc: "fb.1.1234567890.AbCdEf"
  });
  const userData = metaUserDataFromOrder({
    metaAttribution: attribution,
    customer: { name: "Private", email: "private@example.com", phone: "+62000", address: "Private" }
  });
  assert.deepEqual(userData, {
    client_ip_address: "203.0.113.8",
    client_user_agent: "Bakeaholic customer browser",
    fbp: "fb.1.1234567890.123456789",
    fbc: "fb.1.1234567890.AbCdEf"
  });
  assert.equal(JSON.stringify(userData).includes("private@example.com"), false);
});

test("production sessions are shared between apex and www hosts", () => {
  assert.equal(productionCookieDomain({ headers: { host: "bakeaholicbali.com" } }), ".bakeaholicbali.com");
  assert.equal(productionCookieDomain({ headers: { host: "www.bakeaholicbali.com" } }), ".bakeaholicbali.com");
  assert.equal(productionCookieDomain({ headers: { host: "localhost:4173" } }), "");
  assert.match(
    serializeCookie("session", "signed", { domain: ".bakeaholicbali.com", path: "/", httpOnly: true }),
    /Domain=\.bakeaholicbali\.com/
  );
});

test("staff roles are limited to their assigned business areas", () => {
  assert.deepEqual(adminPermissions("storefront_manager"), ["storefront"]);
  assert.deepEqual(adminPermissions("orders_manager"), ["orders", "reports"]);
  assert.equal(adminPermissions("storefront_manager").includes("integrations"), false);
  assert.equal(adminPermissions("orders_manager").includes("operations"), false);
});

test("staff passwords are salted and verified securely", () => {
  const stored = hashAdminPassword("A-strong-password-2026");
  assert.match(stored.salt, /^[a-f0-9]{32}$/);
  assert.match(stored.hash, /^[a-f0-9]{128}$/);
  const user = { passwordSalt: stored.salt, passwordHash: stored.hash };
  assert.equal(verifyAdminPassword("A-strong-password-2026", user), true);
  assert.equal(verifyAdminPassword("wrong-password", user), false);
});

test("owner recovery codes are random, normalized and stored only as hashes", () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  for (const code of codes) {
    assert.match(code, /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
    assert.match(hashRecoveryCode(code), /^[a-f0-9]{64}$/);
    assert.equal(hashRecoveryCode(code), hashRecoveryCode(code.toLowerCase().replaceAll("-", " ")));
  }
});

test("staff two-step verification accepts only the current authenticator code", () => {
  const secret = base32Encode(Buffer.from("bakeaholic-staff-test-secret"));
  const now = Date.now();
  assert.equal(verifyTotp(secret, totpCode(secret, now), now), true);
  assert.equal(verifyTotp(secret, "000000", now), false);
});

test("admin alerts fan out to all three configured recipients", async () => {
  const previousFetch = global.fetch;
  const previousEnv = {
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    adminNumbers: process.env.WHATSAPP_ADMIN_NUMBER,
    template: process.env.WHATSAPP_ADMIN_TEMPLATE_NAME
  };
  const recipients = [];
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "123456",
    WHATSAPP_ADMIN_NUMBER: "628111111111, 628222222222;628333333333",
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v2"
  });
  global.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    recipients.push(payload.to);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ messages: [{ id: `wamid.${payload.to}` }] })
    };
  };
  try {
    assert.deepEqual(adminWhatsappNumbers(), ["628111111111", "628222222222", "628333333333"]);
    const result = await sendWhatsappAdminAlert({
      id: "BAK-0999",
      status: "paid",
      customer: { name: "Customer", phone: "628999999999" },
      pricing: { total: 18700 },
      payment: { label: "QRIS" },
      fulfillment: { shipment: {} },
      receiptToken: "token"
    }, "Payment received");
    assert.deepEqual(recipients, ["628111111111", "628222222222", "628333333333"]);
    assert.equal(result.results.length, 3);
    assert.equal(result.results.every((entry) => entry.sent), true);
  } finally {
    global.fetch = previousFetch;
    for (const [key, value] of Object.entries({
      WHATSAPP_ACCESS_TOKEN: previousEnv.token,
      WHATSAPP_PHONE_NUMBER_ID: previousEnv.phoneId,
      WHATSAPP_ADMIN_NUMBER: previousEnv.adminNumbers,
      WHATSAPP_ADMIN_TEMPLATE_NAME: previousEnv.template
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("concurrent paid-event processing sends each WhatsApp notification only once", async () => {
  const previousFetch = global.fetch;
  const previousEnv = {
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    adminNumbers: process.env.WHATSAPP_ADMIN_NUMBER,
    adminTemplate: process.env.WHATSAPP_ADMIN_TEMPLATE_NAME,
    receiptTemplate: process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME
  };
  const recipients = [];
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "123456",
    WHATSAPP_ADMIN_NUMBER: "628111111111,628222222222,628333333333",
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v2",
    WHATSAPP_RECEIPT_TEMPLATE_NAME: "payment_receipt"
  });
  global.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    recipients.push(payload.to);
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ messages: [{ id: `wamid.${payload.to}` }] })
    };
  };
  const order = {
    id: "BAK-CONCURRENT",
    mode: "test",
    status: "paid",
    customer: { name: "Customer", phone: "628999999999" },
    pricing: { total: 18700 },
    payment: { label: "QRIS" },
    fulfillment: { shipment: {} },
    receiptToken: "receipt-token"
  };

  try {
    const receiptResults = await Promise.all([
      maybeSendWhatsappPaymentReceipt(order, "order:BAK-CONCURRENT:receipt"),
      maybeSendWhatsappPaymentReceipt(order, "order:BAK-CONCURRENT:receipt")
    ]);
    const adminResults = await Promise.all([
      maybeSendWhatsappAdminAlert(order, "order:BAK-CONCURRENT:paid", "Payment received"),
      maybeSendWhatsappAdminAlert(order, "order:BAK-CONCURRENT:paid", "Payment received")
    ]);

    assert.equal(receiptResults.filter((result) => result.sent).length, 1);
    assert.equal(adminResults.filter((result) => result.sent).length, 1);
    assert.equal(recipients.filter((recipient) => recipient === "628999999999").length, 1);
    assert.equal(recipients.length, 4);
  } finally {
    global.fetch = previousFetch;
    for (const [key, value] of Object.entries({
      WHATSAPP_ACCESS_TOKEN: previousEnv.token,
      WHATSAPP_PHONE_NUMBER_ID: previousEnv.phoneId,
      WHATSAPP_ADMIN_NUMBER: previousEnv.adminNumbers,
      WHATSAPP_ADMIN_TEMPLATE_NAME: previousEnv.adminTemplate,
      WHATSAPP_RECEIPT_TEMPLATE_NAME: previousEnv.receiptTemplate
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("admin cancellation refund update uses the dedicated refund template", async () => {
  const previousFetch = global.fetch;
  const previousEnv = {
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    adminNumbers: process.env.WHATSAPP_ADMIN_NUMBER,
    template: process.env.WHATSAPP_ADMIN_REFUND_TEMPLATE_NAME
  };
  const payloads = [];
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "123456",
    WHATSAPP_ADMIN_NUMBER: "628111111111,628222222222,628333333333",
    WHATSAPP_ADMIN_REFUND_TEMPLATE_NAME: "admin_refund_update"
  });
  global.fetch = async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ messages: [{ id: `wamid.refund.${payloads.length}` }] })
    };
  };

  try {
    await sendWhatsappAdminRefundUpdate({
      id: "BAK-0122",
      pricing: { total: 18700 },
      refund: { status: "pending", id: "rfd-test" }
    });
  } finally {
    global.fetch = previousFetch;
    if (previousEnv.token === undefined) delete process.env.WHATSAPP_ACCESS_TOKEN;
    else process.env.WHATSAPP_ACCESS_TOKEN = previousEnv.token;
    if (previousEnv.phoneId === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = previousEnv.phoneId;
    if (previousEnv.adminNumbers === undefined) delete process.env.WHATSAPP_ADMIN_NUMBER;
    else process.env.WHATSAPP_ADMIN_NUMBER = previousEnv.adminNumbers;
    if (previousEnv.template === undefined) delete process.env.WHATSAPP_ADMIN_REFUND_TEMPLATE_NAME;
    else process.env.WHATSAPP_ADMIN_REFUND_TEMPLATE_NAME = previousEnv.template;
  }

  assert.equal(payloads.length, 3);
  assert.deepEqual(payloads.map((payload) => payload.template.name), [
    "admin_refund_update",
    "admin_refund_update",
    "admin_refund_update"
  ]);
});

test("admin recipient delivery receipts record Meta failures", () => {
  const order = {
    adminWhatsappNotifications: {
      recipients: [
        { recipient: "628***111", sent: true, messageId: "wamid.one" },
        { recipient: "628***222", sent: true, messageId: "wamid.two" }
      ]
    }
  };
  assert.equal(updateAdminWhatsappDeliveryStatus(order, {
    id: "wamid.two",
    status: "failed",
    timestamp: "1785300000",
    errors: [{ code: 131026, message: "Message undeliverable" }]
  }), true);
  assert.equal(order.adminWhatsappNotifications.recipients[1].deliveryStatus, "failed");
  assert.equal(order.adminWhatsappNotifications.recipients[1].deliveryErrorCode, 131026);
  assert.equal(order.adminWhatsappNotifications.recipients[1].deliveryError, "Message undeliverable");
});

test("WhatsApp quick replies resolve the order from each admin recipient message", () => {
  const orders = [{
    id: "BAK-0133",
    adminWhatsappNotifications: {
      messageId: "wamid.primary",
      recipients: [
        { recipient: "628***111", messageId: "wamid.admin-one" },
        { recipient: "628***222", messageId: "wamid.admin-two" },
        { recipient: "628***333", messageId: "wamid.admin-three" }
      ]
    }
  }];

  assert.equal(orderIdFromWhatsappReplyContext({ context: { id: "wamid.admin-two" } }, orders), "BAK-0133");
  assert.equal(orderIdFromWhatsappReplyContext({ context: { id: "wamid.primary" } }, orders), "BAK-0133");
  assert.equal(orderIdFromWhatsappReplyContext({ context: { id: "wamid.unknown" } }, orders), "");
  assert.equal(orderIdFromWhatsappReplyContext({}, orders), "");
});

test("paid admin alert describes an unbooked delivery and required approval", () => {
  const parameters = adminWhatsappParameters({
    id: "BAK-0105",
    status: "paid",
    customer: { name: "Eduardo", phone: "+6281234567890" },
    pricing: { total: 18700 },
    payment: { label: "QRIS" },
    fulfillment: { shipment: {} },
    receiptToken: "token"
  }, "Payment received");
  assert.equal(parameters[6], "Not booked yet");
  assert.match(parameters[8], /Reply APPROVE/);
  assert.doesNotMatch(JSON.stringify(parameters), /Eduardo|6281234567890/);
});

test("secure order-review alerts exclude customer details and carry only the order reference", async () => {
  const order = {
    id: "BAK-0106",
    status: "paid",
    customer: { name: "Private Customer", phone: "+6281234567890" }
  };
  assert.equal(adminOrderReviewButtonQuery(order), "BAK-0106");
  assert.deepEqual(adminOrderReviewWhatsappParameters(order, "This input is deliberately ignored"), [
    "BAK-0106",
    "Stock and fulfilment review required"
  ]);
  assert.doesNotMatch(JSON.stringify(adminOrderReviewWhatsappParameters(order, "Private Customer +6281234567890")), /Private Customer|6281234567890/);

  const previousFetch = global.fetch;
  const previousEnv = {
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    adminNumbers: process.env.WHATSAPP_ADMIN_NUMBER,
    reviewTemplate: process.env.WHATSAPP_ADMIN_REVIEW_TEMPLATE_NAME
  };
  let payload;
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "123456",
    WHATSAPP_ADMIN_NUMBER: "628111111111",
    WHATSAPP_ADMIN_REVIEW_TEMPLATE_NAME: "admin_order_review"
  });
  global.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ messages: [{ id: "wamid.review" }] })
    };
  };

  try {
    await sendWhatsappAdminAlert(order, "Stock review required");
  } finally {
    global.fetch = previousFetch;
    for (const [key, value] of Object.entries({
      WHATSAPP_ACCESS_TOKEN: previousEnv.token,
      WHATSAPP_PHONE_NUMBER_ID: previousEnv.phoneId,
      WHATSAPP_ADMIN_NUMBER: previousEnv.adminNumbers,
      WHATSAPP_ADMIN_REVIEW_TEMPLATE_NAME: previousEnv.reviewTemplate
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  assert.equal(payload.template.name, "admin_order_review");
  const body = payload.template.components.find((component) => component.type === "body");
  assert.deepEqual(body.parameters.map((parameter) => parameter.text), ["BAK-0106", "Stock and fulfilment review required"]);
  assert.equal(payload.template.components.some((component) => component.type === "header"), false);
  const reviewButton = payload.template.components.find((component) => component.type === "button");
  assert.equal(reviewButton.sub_type, "url");
  assert.equal(reviewButton.parameters[0].text, "BAK-0106");
  assert.doesNotMatch(JSON.stringify(payload), /Private Customer|6281234567890/);
});

function whatsappOrder(overrides = {}) {
  return {
    id: "BAK-0001",
    mode: "live",
    status: "paid",
    customer: { phone: "+6281234567890" },
    fulfillment: { shipment: {} },
    ...overrides
  };
}

test("WhatsApp template parameters keep their approved positions", async () => {
  const previousFetch = global.fetch;
  const previousEnv = {
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID
  };
  let payload;

  process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "123456";
  global.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ messages: [{ id: "wamid.test" }] })
    };
  };

  try {
    await sendWhatsappTemplateMessage(
      "+6281234567890",
      "admin_order_alert",
      ["Paid", "BAK-0001", "Customer", "", "Rp 75.000"]
    );
  } finally {
    global.fetch = previousFetch;
    if (previousEnv.token === undefined) delete process.env.WHATSAPP_ACCESS_TOKEN;
    else process.env.WHATSAPP_ACCESS_TOKEN = previousEnv.token;
    if (previousEnv.phoneId === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = previousEnv.phoneId;
  }

  const body = payload.template.components.find((component) => component.type === "body");
  assert.deepEqual(body.parameters.map((parameter) => parameter.text), [
    "Paid",
    "BAK-0001",
    "Customer",
    "-",
    "Rp 75.000"
  ]);
});

test("admin diagnostics exercise every configured template without creating an order", async () => {
  const previousFetch = global.fetch;
  const envKeys = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_ADMIN_NUMBER",
    "WHATSAPP_OTP_TEMPLATE_NAME",
    "WHATSAPP_ORDER_TEMPLATE_NAME",
    "WHATSAPP_RECEIPT_TEMPLATE_NAME",
    "WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME",
    "WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME",
    "WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME",
    "WHATSAPP_SHIPPING_TEMPLATE_NAME",
    "WHATSAPP_ADMIN_TEMPLATE_NAME",
    "WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME",
    "WHATSAPP_REFUND_COMPLETED_TEMPLATE_NAME",
    "WHATSAPP_ADMIN_REFUND_TEMPLATE_NAME",
    "WHATSAPP_TEMPLATE_LANGUAGE"
  ];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const payloads = [];
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "123456",
    WHATSAPP_ADMIN_NUMBER: "6281234567890",
    WHATSAPP_OTP_TEMPLATE_NAME: "otp_verification",
    WHATSAPP_ORDER_TEMPLATE_NAME: "payment_confirmed",
    WHATSAPP_RECEIPT_TEMPLATE_NAME: "payment_receipt",
    WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME: "payment_update_order",
    WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME: "order_cancelled_unpaid",
    WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME: "order_cancelled",
    WHATSAPP_SHIPPING_TEMPLATE_NAME: "shipping_update",
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v2",
    WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME: "admin_shipping_update",
    WHATSAPP_REFUND_COMPLETED_TEMPLATE_NAME: "refund_completed",
    WHATSAPP_ADMIN_REFUND_TEMPLATE_NAME: "admin_refund_update",
    WHATSAPP_TEMPLATE_LANGUAGE: "en_US"
  });
  global.fetch = async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ messages: [{ id: `wamid.test.${payloads.length}` }] })
    };
  };

  let diagnostic;
  try {
    diagnostic = await runWhatsappTemplateDiagnostics();
  } finally {
    global.fetch = previousFetch;
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }

  assert.equal(diagnostic.ok, true);
  assert.equal(diagnostic.synthetic, true);
  assert.equal(diagnostic.charged, false);
  assert.equal(diagnostic.orderCreated, false);
  assert.equal(payloads.length, 16);
  const bodyCounts = Object.fromEntries(payloads.map((payload) => {
    const body = payload.template.components?.find((component) => component.type === "body");
    return [payload.template.name, body?.parameters?.length || 0];
  }));
  assert.deepEqual(bodyCounts, {
    otp_verification: 1,
    payment_pending: 0,
    order_received: 0,
    order_preparing: 0,
    payment_confirmed: 0,
    order_shipped: 0,
    order_delivered: 0,
    payment_receipt: 2,
    payment_update_order: 1,
    order_cancelled_unpaid: 1,
    order_cancelled: 1,
    shipping_update: 4,
    admin_order_alert_v2: 9,
    admin_shipping_update: 4,
    refund_completed: 3,
    admin_refund_update: 4
  });
  const preparingPayload = payloads.find((payload) => payload.template.name === "order_preparing");
  assert.equal(preparingPayload.template.components, undefined);
});

test("status templates select the paid confirmation for legacy settings", () => {
  const previous = process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
  process.env.WHATSAPP_ORDER_TEMPLATE_NAME = "order_received";
  try {
    assert.equal(configuredWhatsappOrderTemplateName(whatsappOrder()), "payment_confirmed");
  } finally {
    if (previous === undefined) delete process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
    else process.env.WHATSAPP_ORDER_TEMPLATE_NAME = previous;
  }
});

test("shipping notifications wait for a real Biteship booking", () => {
  assert.equal(hasBiteshipShipmentForMessaging(whatsappOrder()), false);
  assert.equal(hasBiteshipShipmentForMessaging(whatsappOrder({
    fulfillment: { shipment: { orderId: "ship-1", trackingLink: "https://track.example/ship-1" } }
  })), true);
});

test("shipping parameters use stable placeholders", () => {
  const order = whatsappOrder({
    fulfillment: { shipment: { orderId: "ship-1" } }
  });
  assert.deepEqual(shippingWhatsappDetails(order), {
    courierName: "-",
    waybillId: "ship-1",
    trackingLink: "https://track.biteship.com/ship-1",
    shippingDocumentUrl: "https://track.biteship.com/ship-1"
  });
  assert.deepEqual(customerShippingWhatsappParameters(order), [
    "BAK-0001",
    "-",
    "ship-1",
    "https://track.biteship.com/ship-1"
  ]);
});

test("shipping parameters fall back to the Biteship tracking identifier", () => {
  const order = whatsappOrder({
    fulfillment: { shipment: { orderId: "ship-1", trackingLink: "https://track.biteship.com/track-987" } }
  });
  assert.equal(shippingWhatsappDetails(order).waybillId, "track-987");
});

test("admin shipping parameters match the four-variable approved template", () => {
  const order = whatsappOrder({
    fulfillment: {
      shipment: {
        orderId: "ship-1",
        waybillId: "WAYBILL-1",
        trackingLink: "https://track.biteship.com/track-987",
        labelUrl: "https://example.com/shipping-label.pdf",
        courier: { company: "Grab" }
      }
    }
  });
  const { adminShippingWhatsappParameters } = require("./server");
  assert.deepEqual(adminShippingWhatsappParameters(order), [
    "BAK-0001",
    "Grab",
    "WAYBILL-1",
    "https://example.com/shipping-label.pdf"
  ]);
});

test("Biteship final delivery statuses map to the delivered customer message", () => {
  for (const status of ["delivered", "finish", "completed", "successful_delivery", "successfully_delivered", "done"]) {
    assert.equal(shipmentStatusToOrderStatus(status), "delivered");
  }
  assert.equal(shipmentStatusToOrderStatus("picked_up"), "on_delivery");
  assert.equal(shipmentStatusToOrderStatus("pickingUp"), "preparing");
  assert.equal(shipmentStatusToOrderStatus("inTransit"), "on_delivery");
  assert.equal(shipmentStatusToOrderStatus("droppingOff"), "on_delivery");
});

test("Biteship pickup notification waits until the parcel is actually picked", () => {
  assert.equal(shipmentStatusToOrderStatus("allocated"), "preparing");
  assert.equal(shipmentStatusToOrderStatus("picking_up"), "preparing");
  assert.equal(shipmentStatusToOrderStatus("picked"), "on_delivery");
});

test("public order references preserve live and test modes", () => {
  assert.deepEqual(parsePublicOrderReference("BAK-0001.token"), {
    orderId: "BAK-0001",
    token: "token",
    mode: "live"
  });
  assert.deepEqual(parsePublicOrderReference("TEST-0001.token.test"), {
    orderId: "TEST-0001",
    token: "token",
    mode: "test"
  });
});

test("responses enforce transport and browser security boundaries", () => {
  const headers = defaultSecurityHeaders();
  assert.equal(headers["Strict-Transport-Security"], "max-age=31536000");
  assert.equal(headers["X-Frame-Options"], "SAMEORIGIN");
  assert.match(headers["Content-Security-Policy"], /default-src 'self'/);
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'self'/);
  assert.doesNotMatch(headers["Content-Security-Policy"], /script-src[^;]*'unsafe-inline'/);
  assert.match(headers["Content-Security-Policy"], /frame-src 'self'/);
  assert.match(headers["Content-Security-Policy"], /checkout\.xendit\.co/);
  assert.match(headers["Content-Security-Policy"], /maps\.googleapis\.com/);
  assert.match(headers["Content-Security-Policy"], /api\.qrserver\.com/);
});

test("admin image uploads verify file signatures instead of trusting MIME labels", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = Buffer.from("RIFF0000WEBP", "ascii");
  const fake = Buffer.from("not-an-image", "ascii");
  assert.equal(isSupportedImageBuffer(jpeg, "jpg"), true);
  assert.equal(isSupportedImageBuffer(png, "png"), true);
  assert.equal(isSupportedImageBuffer(webp, "webp"), true);
  assert.equal(isSupportedImageBuffer(fake, "png"), false);
  assert.equal(isSupportedImageBuffer(png, "jpg"), false);
});

test("live checkout offers the activated Xendit Invoice bank channels", () => {
  assert.deepEqual(availablePaymentMethods("live").map((method) => method.id), [
    "xendit-qris",
    "xendit-va",
    "xendit-card"
  ]);
  const bankTransfer = availablePaymentMethods("live").find((method) => method.id === "xendit-va");
  assert.match(bankTransfer.description, /BJB/);
});

test("security.txt publishes a canonical vulnerability contact policy", () => {
  const body = securityTxtBody(new Date("2026-07-23T00:00:00.000Z"));
  assert.match(body, /^Contact: https:\/\/bakeaholicbali\.com\//m);
  assert.match(body, /^Expires: 2027-01-19T00:00:00\.000Z$/m);
  assert.match(body, /^Canonical: https:\/\/bakeaholicbali\.com\/\.well-known\/security\.txt$/m);
  assert.match(body, /^Policy: https:\/\/bakeaholicbali\.com\/terms\.html#privacy$/m);
});

test("live Xendit selects a production key over a saved development key", () => {
  assert.equal(xenditKeyMode("xnd_development_example"), "test");
  assert.equal(xenditKeyMode("xnd_production_example"), "live");
  assert.equal(xenditKeyMode("xnd_public_production_example"), "unknown");
  assert.equal(xenditKeyMode("public_production_example"), "unknown");
  assert.equal(
    selectXenditSecretKey("live", "xnd_production_railway", "xnd_development_saved"),
    "xnd_production_railway"
  );
  assert.equal(
    selectXenditSecretKey("test", "xnd_production_railway", "xnd_development_saved"),
    "xnd_development_saved"
  );
});

test("Xendit transaction SUCCESS is treated as a completed payment", () => {
  assert.equal(isSuccessfulXenditPaymentEvent({ status: "SUCCESS" }), true);
  assert.equal(isSuccessfulXenditPaymentEvent({ event: "qr.payment", status: "COMPLETED" }), true);
  assert.equal(isSuccessfulXenditPaymentEvent({
    payment_id: "va-payment-1",
    external_id: "BAK-0109",
    bank_code: "BNI",
    paid_amount: 18700
  }), true);
  assert.equal(isSuccessfulXenditPaymentEvent({ status: "ACTIVE" }), false);
});

test("Xendit payment amount accepts Payment Request response amounts", () => {
  assert.equal(xenditPaymentAmount({ request_amount: 18700 }), 18700);
});

test("temporary inactive QRIS or VA status does not expire an active checkout", () => {
  assert.equal(isOrderPaymentWindowExpired({
    expiresAt: "2026-07-27T10:15:00.000Z"
  }, Date.parse("2026-07-27T10:14:59.000Z")), false);
  assert.equal(isOrderPaymentWindowExpired({
    expiresAt: "2026-07-27T10:15:00.000Z"
  }, Date.parse("2026-07-27T10:15:00.000Z")), true);
});

test("inactive QRIS and VA instruments remain payable until the checkout expires", () => {
  const activeOrderBase = {
    id: "BAK-0109",
    mode: "live",
    status: "awaiting_payment",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    customer: { name: "Test Buyer", phone: "+6281234567890", email: "buyer@example.com" },
    fulfillment: { type: "delivery", deliveryNotes: "" },
    items: [],
    orderNotes: "",
    pricing: { subtotal: 18700, deliveryFee: 0, tax: 0, discount: { amount: 0 }, total: 18700 }
  };
  const activeOrder = {
    ...activeOrderBase,
    payment: { provider: "xendit_qr_code", externalId: "BAK-0109", qrCodeData: "qr-data" }
  };
  applyXenditQrCodeStatusToOrder(activeOrder, { status: "INACTIVE" });
  assert.equal(activeOrder.status, "awaiting_payment");

  const activeVaOrder = {
    ...activeOrderBase,
    id: "BAK-0110",
    payment: { provider: "xendit_virtual_account", externalId: "BAK-0110" }
  };
  applyXenditVirtualAccountStatusToOrder(activeVaOrder, { status: "INACTIVE" });
  assert.equal(activeVaOrder.status, "awaiting_payment");
});

test("legacy Xendit QRIS callbacks accept the nominal payment field", () => {
  assert.equal(xenditPaymentAmount({ nominal: 18700 }), 18700);
});

test("cancelled paid orders use the approved dedicated template", () => {
  const previousName = process.env.WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME;
  delete process.env.WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME;
  try {
    assert.equal(configuredWhatsappOrderTemplateName({ status: "cancelled" }), "order_cancelled");
    process.env.WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME = "order_cancelled";
    assert.equal(configuredWhatsappOrderTemplateName({ status: "cancelled" }), "order_cancelled");
  } finally {
    if (previousName === undefined) delete process.env.WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME;
    else process.env.WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME = previousName;
  }
});

test("cancelled template receives exactly the order-number variable", () => {
  assert.deepEqual(
    orderUpdateWhatsappParameters({ id: "BAK-0105" }, "order_cancelled"),
    ["BAK-0105"]
  );
});

test("Xendit refund payload uses the Payment Request contract", () => {
  assert.deepEqual(
    xenditRefundRequestBody(
      { id: "BAK-0106", pricing: { total: 18700 } },
      "pr-123"
    ),
    {
      reference_id: "BAK-0106-refund",
      payment_request_id: "pr-123",
      currency: "IDR",
      amount: 18700,
      reason: "CANCELLATION"
    }
  );
});

test("Xendit refund webhooks distinguish pending, provider-processed, and failed states", () => {
  const order = { refund: { status: "requested", id: "rfd-1" } };
  assert.equal(isXenditRefundEvent({ event: "refund.pending" }), true);
  applyXenditRefundStatusToOrder(order, {
    event: "refund.pending",
    id: "rfd-1",
    payment_request_id: "pr-1",
    reference_id: "BAK-0106-refund",
    status: "PENDING"
  });
  assert.equal(order.refund.status, "pending");
  applyXenditRefundStatusToOrder(order, { event: "refund.succeeded", status: "SUCCEEDED" });
  assert.equal(order.refund.status, "processed");
  assert.ok(order.refund.processedAt);
  applyXenditRefundStatusToOrder(order, {
    event: "refund.failed",
    status: "FAILED",
    failure_code: "INSUFFICIENT_BALANCE"
  });
  assert.equal(order.refund.status, "failed");
  assert.equal(order.refund.failureCode, "INSUFFICIENT_BALANCE");
});

test("QRIS uses a restricted hosted Invoice with automatic return URLs", () => {
  const payload = buildXenditInvoicePayload({
    id: "BAK-0200",
    pricing: { total: 18700 },
    payment: { kind: "qris", externalId: "BAK-0200" },
    customer: { email: "customer@example.com" },
    receiptToken: "token"
  });
  assert.equal(payload.external_id, "BAK-0200");
  assert.equal(payload.amount, 18700);
  assert.deepEqual(payload.payment_methods, ["QRIS"]);
  assert.match(payload.success_redirect_url, /pay\.html\?order=BAK-0200/);
  assert.equal(payload.failure_redirect_url, payload.success_redirect_url);
});

test("every activated bank maps to a restricted Xendit Invoice channel", () => {
  for (const bankCode of ["BNI", "BRI", "CIMB", "BJB", "MANDIRI", "PERMATA"]) {
    const payload = buildXenditInvoicePayload({
      id: `BAK-${bankCode}`,
      pricing: { total: 18700 },
      payment: {
        kind: "va",
        externalId: `BAK-${bankCode}`,
        selectedBankCode: bankCode
      },
      customer: { email: "customer@example.com" },
      receiptToken: "token"
    });
    assert.deepEqual(payload.payment_methods, [bankCode]);
  }
});

test("card session enables the shared debit and credit card rail", () => {
  const payload = buildXenditPaymentSessionPayload({
    id: "BAK-CARD",
    pricing: { total: 18700 },
    payment: { kind: "card", externalId: "BAK-CARD" },
    customer: {
      name: "Bakeaholic Customer",
      email: "customer@example.com",
      phone: "+6281234567890"
    },
    receiptToken: "token"
  });
  assert.equal(payload.amount, 18700);
  assert.deepEqual(payload.allowed_payment_channels, ["CARDS"]);
  assert.equal(payload.capture_method, "AUTOMATIC");
  assert.equal(payload.mode, "COMPONENTS");
  assert.match(payload.success_return_url, /pay\.html\?order=BAK-CARD/);
  assert.equal(payload.cancel_return_url, payload.success_return_url);
  assert.deepEqual(payload.components_configuration, {
    origins: ["https://bakeaholicbali.com"],
    return_url: payload.success_return_url
  });
});

test("virtual accounts use Xendit Payments API present-to-customer fields", () => {
  const payload = buildXenditPaymentRequestPayload({
    id: "BAK-VA",
    pricing: { total: 18700 },
    payment: {
      kind: "va",
      externalId: "BAK-VA-BNI",
      xenditChannelCode: "BNI_VIRTUAL_ACCOUNT"
    },
    customer: {
      name: "Bakeaholic Customer",
      phone: "+6281234567890"
    },
    receiptToken: "token"
  });
  assert.equal(payload.request_amount, 18700);
  assert.equal(payload.channel_code, "BNI_VIRTUAL_ACCOUNT");
  assert.equal(payload.channel_properties.display_name, "Bakeaholic Customer");
  assert.equal(payload.channel_properties.customer_name, "Bakeaholic Customer");
  assert.equal(payload.payment_method, undefined);
  assert.equal(payload.amount, undefined);
});

test("new QRIS orders use a refundable Xendit Payment Request", () => {
  const payload = buildXenditPaymentRequestPayload({
    id: "BAK-QRIS",
    pricing: { total: 18700 },
    payment: { kind: "qris", externalId: "BAK-QRIS-1" },
    customer: { phone: "+6281234567890" },
    receiptToken: "token"
  });
  assert.equal(payload.type, "PAY");
  assert.equal(payload.request_amount, 18700);
  assert.equal(payload.channel_code, "QRIS");
  assert.equal(payload.capture_method, "AUTOMATIC");
  assert.equal(payload.payment_method, undefined);
});

test("payment recovery checks every unique Xendit reference attached to an order", () => {
  assert.deepEqual(xenditOrderReferenceIds({
    id: "BAK-0108",
    payment: { externalId: "BAK-0108-card-1" },
    paymentOptions: {
      card: { externalId: "BAK-0108-card-1" },
      qris: { externalId: "BAK-0108-qris-1" }
    }
  }), [
    "BAK-0108-card-1",
    "BAK-0108",
    "BAK-0108-qris-1"
  ]);
});

test("QRIS reconciliation checks every QR option without using unrelated invoice references", () => {
  const order = {
    payment: { provider: "xendit_qr_code", externalId: "old-invoice-reference" },
    paymentOptions: {
      qris: { provider: "xendit_qr_code", kind: "qris", externalId: "BAK-0109-qr" },
      va: { provider: "xendit", kind: "va", externalId: "BAK-0109-va" }
    }
  };
  assert.deepEqual(xenditQrExternalIds(order), ["old-invoice-reference", "BAK-0109-qr"]);
});

test("Xendit callbacks resolve the exact payment option they describe", () => {
  const qris = { provider: "xendit_qr_code", externalId: "BAK-0109-qr" };
  const va = { provider: "xendit", externalId: "BAK-0109-va" };
  const order = {
    payment: qris,
    paymentOptions: { qris, va }
  };
  assert.equal(findOrderPaymentByXenditReference(order, "BAK-0109-va"), va);
  assert.equal(findOrderPaymentByXenditReference(order, "unknown"), null);
});

test("card recovery prefers the valid cached Xendit session over a corrupted active id", () => {
  assert.deepEqual(xenditPaymentSessionIds({
    payment: {
      kind: "card",
      provider: "xendit_components",
      paymentSessionId: "6a66ba4a96f28daa06b009d0"
    },
    paymentOptions: {
      card: {
        kind: "card",
        provider: "xendit_components",
        paymentSessionId: "ps-6a66ba8c96f28daa06b00cb9"
      }
    }
  }), [
    "ps-6a66ba8c96f28daa06b00cb9",
    "6a66ba4a96f28daa06b009d0"
  ]);
});

test("card callbacks expose every identifier Xendit can use for reconciliation", () => {
  assert.deepEqual(xenditCallbackReferenceIds({
    event: "payment.capture",
    data: {
      reference_id: "BAK-0200-card",
      payment_session_id: "ps-session",
      payment_request_id: "pr-request",
      payment_id: "py-payment"
    }
  }), [
    "BAK-0200-card",
    "ps-session",
    "pr-request",
    "py-payment"
  ]);
});

test("failed card callback ends confirmation instead of leaving the order pending", () => {
  const order = {
    id: "BAK-0126",
    mode: "live",
    status: "awaiting_payment",
    customer: {
      name: "Customer",
      phone: "628999999999",
      email: "customer@example.com",
      address: "Bali",
      notes: ""
    },
    fulfillment: { type: "delivery", deliveryNotes: "" },
    items: [],
    pricing: {
      subtotal: 6000,
      deliveryFee: 11000,
      tax: 1700,
      discount: { code: "", amount: 0 },
      total: 18700
    },
    payment: {
      provider: "xendit_components",
      label: "Credit / Debit Card",
      paymentSessionId: "ps-session",
      externalId: "BAK-0126-card"
    },
    orderNotes: ""
  };
  applyXenditPaymentSessionStatusToOrder(order, {
    event: "payment.failure",
    status: "FAILED",
    payment_id: "py-payment",
    payment_request_id: "pr-request",
    reference_id: "BAK-0126-card",
    failure_code: "INVALID_CVV"
  });
  assert.equal(order.status, "payment_failed");
  assert.equal(order.payment.status, "failed");
  assert.equal(order.payment.failureCode, "INVALID_CVV");
  assert.match(order.payment.failureMessage, /security code \(CVV\) is incorrect/i);
});

test("Xendit failed payment events are recognized during active reconciliation", () => {
  assert.equal(isFailedXenditPaymentEvent({ status: "FAILED", failure_code: "INVALID_CVV" }), true);
  assert.equal(isFailedXenditPaymentEvent({ event: "payment.failure" }), true);
  assert.equal(isFailedXenditPaymentEvent({ status: "DECLINED" }), true);
  assert.equal(isFailedXenditPaymentEvent({ status: "ACTIVE" }), false);
  assert.equal(isFailedXenditPaymentEvent({ status: "SUCCEEDED" }), false);
});

test("card failures explain invalid card numbers and expiry dates", () => {
  const makeOrder = () => ({
    id: "BAK-0127",
    mode: "live",
    status: "awaiting_payment",
    customer: {
      name: "Customer",
      phone: "628999999999",
      email: "customer@example.com",
      address: "Bali",
      notes: ""
    },
    fulfillment: { type: "delivery", deliveryNotes: "" },
    items: [],
    pricing: {
      subtotal: 6000,
      deliveryFee: 11000,
      tax: 1700,
      discount: { code: "", amount: 0 },
      total: 18700
    },
    payment: {
      provider: "xendit_components",
      label: "Credit / Debit Card",
      paymentSessionId: "ps-session",
      externalId: "BAK-0127-card"
    },
    orderNotes: ""
  });

  const invalidNumber = makeOrder();
  applyXenditPaymentSessionStatusToOrder(invalidNumber, {
    event: "payment.failure",
    status: "FAILED",
    failure_code: "INVALID_CARD_NUMBER"
  });
  assert.match(invalidNumber.payment.failureMessage, /card number is invalid/i);

  const invalidExpiry = makeOrder();
  applyXenditPaymentSessionStatusToOrder(invalidExpiry, {
    event: "payment.failure",
    status: "FAILED",
    failure_code: "INVALID_EXPIRY"
  });
  assert.match(invalidExpiry.payment.failureMessage, /expiry date is invalid/i);

  const invalidDetails = makeOrder();
  applyXenditPaymentSessionStatusToOrder(invalidDetails, {
    event: "payment.failure",
    status: "FAILED",
    failure_code: "INVALID_ACCOUNT_DETAILS"
  });
  assert.match(invalidDetails.payment.failureMessage, /some card information is incorrect/i);
  assert.match(invalidDetails.payment.failureMessage, /card number, expiry date, and CVV/i);
});

test("Xendit payment option matching includes request and payment ids", () => {
  const card = {
    provider: "xendit_components",
    paymentRequestId: "pr-request",
    paymentId: "py-payment"
  };
  const order = { payment: card, paymentOptions: { card } };
  assert.equal(findOrderPaymentByXenditReference(order, "pr-request"), card);
  assert.equal(findOrderPaymentByXenditReference(order, "py-payment"), card);
});
