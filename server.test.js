const assert = require("node:assert/strict");
const test = require("node:test");
const vm = require("node:vm");
const path = require("node:path");

const {
  addressArea,
  adminOrderActionReviewMessage,
  adminCustomerWhatsappUrl,
  adminPermissions,
  adminOrderReviewButtonQuery,
  adminOrderReviewWhatsappParameters,
  applyXenditInvoiceStatusToOrder,
  applyXenditPaymentRequestStatusToOrder,
  applyXenditQrCodeStatusToOrder,
  applyXenditPaymentSessionStatusToOrder,
  applyXenditRefundStatusToOrder,
  applyXenditVirtualAccountStatusToOrder,
  buildXenditInvoicePayload,
  buildXenditPaymentRequestPayload,
  buildXenditPaymentSessionPayload,
  adminWhatsappParameters,
  adminWhatsappNumbers,
  approveV5PaidOrderFromWhatsapp,
  isProductionRuntime,
  isPublicStaticFile,
  isShipmentAllocatedForMessaging,
  availablePaymentMethods,
  configuredWhatsappOrderTemplateName,
  customerShippingWhatsappParameters,
  defaultSecurityHeaders,
  findOrderPaymentByXenditReference,
  hasBiteshipShipmentForMessaging,
  isCurrentStaffV5ContactReply,
  isOrderPaymentWindowExpired,
  isSuccessfulXenditPaymentEvent,
  isFailedXenditPaymentEvent,
  isSupportedImageBuffer,
  metaAttributionFromRequest,
  metaUserDataFromOrder,
  isXenditRefundEvent,
  orderUpdateWhatsappParameters,
  paymentReminderFlowTimes,
  orderIdFromWhatsappReplyContext,
  parsePublicOrderReference,
  runWhatsappTemplateDiagnostics,
  maybeSendWhatsappPaymentReceipt,
  maybeSendWhatsappPaymentReminder,
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
  finalizePendingAdminOrderAction,
  normalizeWhatsappOrderTemplateName,
  shipmentHasObservedHandoff,
  providerStatusCanCompleteOrder,
  isDeliveryRecoveryStatus,
  isRecoverableFailedShipmentStatus,
  replacementTrackingNotificationReady,
  assertDeliveryRecoveryRequest,
  shipmentRequestSnapshot,
  replaceStoreOrdersForTest,
  xenditPaymentAmount,
  xenditOrderReferenceIds,
  xenditQrExternalIds,
  xenditPaymentSessionIds,
  xenditCallbackReferenceIds,
  xenditRefundRequestBody,
  xenditKeyMode,
  hashAdminPassword,
  hashRecoveryCode,
  isCurrentCartMutationTimestamp,
  normalizeCustomerDetails,
  generateRecoveryCodes,
  verifyAdminPassword,
  base32Encode,
  totpCode,
  verifyTotp,
  verifiedCustomerWhatsappNumber,
  verifiedBiteshipDeliveryProofUrl,
  verifyMetaWebhookSignature,
  scheduleV5CancelFromWhatsapp,
  undoPendingAdminOrderAction,
  productionCookieDomain,
  serializeCookie,
  bundlePromotionIsActive,
  computeAutomaticBundleDiscount,
  combineDiscounts,
  buildFixedA5ReceiptPdf
} = require("./server");

test("cart mutation expiry handles exact, stale, missing, invalid and future timestamps", () => {
  const now = Date.parse("2026-09-03T09:00:00.000Z");
  const day = 24 * 60 * 60 * 1000;
  assert.equal(isCurrentCartMutationTimestamp(now - day + 1, now), true);
  assert.equal(isCurrentCartMutationTimestamp(now - day, now), false);
  assert.equal(isCurrentCartMutationTimestamp(now - day - 1, now), false);
  assert.equal(isCurrentCartMutationTimestamp(0, now), false);
  assert.equal(isCurrentCartMutationTimestamp("invalid", now), false);
  assert.equal(isCurrentCartMutationTimestamp(now + 1, now), false);
});

test("fixed customer receipts are one A5 PDF page for standard and longer orders", () => {
  const line = (index) => ({
    itemId: `bliss-${index}`,
    quantity: index % 3 + 1,
    item: { name: `Bakeaholic Bliss Ball flavour ${index + 1}`, price: 75000 },
    lineTotal: (index % 3 + 1) * 75000
  });
  const document = (lineCount) => ({
    store: { name: "Bakeaholic Bali", perkTitle: "WhatsApp +62 815-5700-627" },
    order: {
      id: "BAK-0147",
      status: "preparing",
      itemCount: lineCount,
      customer: { name: "Ibu Lina", phone: "628111596778", email: "maiareview@gmail.com" },
      fulfillment: {
        address: "Gg. Tunjung Sari, Sanur, Denpasar Selatan, Kota Denpasar, Bali 80227, Indonesia",
        shipment: { orderId: "biteship-0147", status: "allocated", courier: { company: "Grab" } }
      },
      payment: { label: "Credit / Debit Card" },
      lineItems: Array.from({ length: lineCount }, (_, index) => line(index)),
      pricing: { subtotal: lineCount * 75000, deliveryFee: 26000, tax: 26100, total: lineCount * 75000 + 52100 }
    }
  });
  for (const lineCount of [3, 18]) {
    const pdf = buildFixedA5ReceiptPdf(document(lineCount)).toString("ascii");
    assert.match(pdf, /\/MediaBox \[0 0 419\.53 595\.28\]/);
    assert.match(pdf, /\/Type \/Pages \/Kids \[3 0 R\] \/Count 1/);
    assert.match(pdf, /BAK-0147/);
    assert.match(pdf, new RegExp(`flavour ${lineCount}`));
  }
});

test("A5 invoice print stylesheet is publicly served with the invoice", () => {
  assert.equal(isPublicStaticFile(path.join(process.cwd(), "invoice-print.css")), true);
  assert.equal(isPublicStaticFile(path.join(process.cwd(), ".env")), false);
});

test("five-day mix-and-match promotion applies across flavours and then expires", () => {
  const lineItems = [
    { item: { category: "bliss-balls", price: 75000 }, quantity: 1 },
    { item: { category: "bliss-balls", price: 75000 }, quantity: 3 },
    { item: { category: "oatmeal-cookies", price: 20000 }, quantity: 4 },
    { item: { category: "oatmeal-cookies", price: 20000 }, quantity: 8 }
  ];
  const activeAt = Date.parse("2026-09-03T12:00:00+08:00");
  assert.equal(bundlePromotionIsActive(activeAt), true);
  assert.equal(bundlePromotionIsActive(activeAt, "BLISS4"), true);
  assert.equal(bundlePromotionIsActive(activeAt, "COOKIES12"), false);
  const active = computeAutomaticBundleDiscount(lineItems, activeAt);
  assert.equal(active.amount, 50000);
  assert.equal(active.code, "BLISS4");
  const blissHandover = Date.parse("2026-09-07T08:00:00+08:00");
  const expiredAt = Date.parse("2026-09-14T00:00:00+08:00");
  assert.equal(bundlePromotionIsActive(blissHandover - 1, "BLISS4"), true);
  assert.equal(bundlePromotionIsActive(blissHandover, "BLISS4"), false);
  assert.equal(bundlePromotionIsActive(blissHandover - 1, "COOKIES12"), false);
  assert.equal(bundlePromotionIsActive(blissHandover, "COOKIES12"), true);
  assert.equal(bundlePromotionIsActive(expiredAt), false);
  const expired = computeAutomaticBundleDiscount(lineItems, expiredAt);
  assert.equal(expired.amount, 0);
  assert.equal(expired.code, "");
  const cookieStart = Date.parse("2026-09-07T08:00:00+08:00");
  const cookieEnd = Date.parse("2026-09-14T00:00:00+08:00");
  assert.equal(bundlePromotionIsActive(cookieStart - 1, "COOKIES12"), false);
  assert.equal(bundlePromotionIsActive(cookieStart, "COOKIES12"), true);
  assert.equal(bundlePromotionIsActive(cookieEnd - 1, "COOKIES12"), true);
  assert.equal(bundlePromotionIsActive(cookieEnd, "COOKIES12"), false);
  const cookieOnly = computeAutomaticBundleDiscount(lineItems, Date.parse("2026-09-08T12:00:00+08:00"));
  assert.equal(cookieOnly.amount, 40000);
  assert.equal(cookieOnly.code, "COOKIES12");
});

test("bundle and voucher discounts remain separate from tax and delivery", () => {
  const bundle = computeAutomaticBundleDiscount([
    { item: { category: "bliss-balls", price: 75000 }, quantity: 4 }
  ], Date.parse("2026-09-02T12:00:00+08:00"));
  const combined = combineDiscounts(bundle, { code: "WELCOME", label: "Welcome", amount: 10000 });
  assert.equal(bundle.amount, 50000);
  assert.equal(combined.amount, 60000);
  assert.equal(combined.code, "BLISS4+WELCOME");
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

test("product ViewContent uses one stable exact product payload", () => {
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

test("pixel is public and product UI calls the privacy-safe ViewContent helper", () => {
  const serverSource = require("node:fs").readFileSync(require("node:path").join(__dirname, "server.js"), "utf8");
  const appSource = require("node:fs").readFileSync(require("node:path").join(__dirname, "app.js"), "utf8");
  assert.match(serverSource, /"meta-pixel\.js"/);
  assert.match(appSource, /BakeaholicAnalytics\?\.viewProduct\(item\)/);
});

test("provider delivered status cannot complete an order without observed courier handoff", () => {
  assert.equal(shipmentHasObservedHandoff({}), false);
  assert.equal(providerStatusCanCompleteOrder({}, "delivered"), false);
  assert.equal(providerStatusCanCompleteOrder({ pickupObservedAt: "2026-09-01T00:00:00.000Z" }, "delivered"), true);
  assert.equal(providerStatusCanCompleteOrder({}, "picked_up"), true);
});

test("shipping successors wait for Biteship courier allocation", () => {
  assert.equal(isShipmentAllocatedForMessaging({ status: "confirmed" }), false);
  assert.equal(isShipmentAllocatedForMessaging({ status: "allocated" }), true);
  assert.equal(isShipmentAllocatedForMessaging({ status: "accepted" }), true);
  assert.equal(isShipmentAllocatedForMessaging({ status: "picked_up" }), true);
  assert.equal(isShipmentAllocatedForMessaging({ status: "courier_not_found" }), false);
});

test("Meta webhook verification fails closed in production when the app secret is absent", () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
    appSecret: process.env.WHATSAPP_APP_SECRET
  };
  const request = { headers: {} };
  try {
    process.env.NODE_ENV = "production";
    delete process.env.RAILWAY_ENVIRONMENT;
    delete process.env.WHATSAPP_APP_SECRET;
    assert.equal(isProductionRuntime(), true);
    assert.equal(verifyMetaWebhookSignature(request, "{}"), false);
    process.env.NODE_ENV = "test";
    assert.equal(isProductionRuntime(), false);
    assert.equal(verifyMetaWebhookSignature(request, "{}"), true);
    process.env.WHATSAPP_APP_SECRET = "test-secret";
    const signature = `sha256=${require("node:crypto").createHmac("sha256", "test-secret").update("{}").digest("hex")}`;
    assert.equal(verifyMetaWebhookSignature({ headers: { "x-hub-signature-256": signature } }, "{}"), true);
    assert.equal(verifyMetaWebhookSignature({ headers: { "x-hub-signature-256": "sha256:wrong" } }, "{}"), false);
  } finally {
    for (const [key, value] of Object.entries({ NODE_ENV: previous.nodeEnv, RAILWAY_ENVIRONMENT: previous.railwayEnvironment, WHATSAPP_APP_SECRET: previous.appSecret })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("delivery proof redirect exposes only verified HTTPS provider proof", () => {
  const order = {
    fulfillment: {
      shipment: {
        deliveryProof: {
          verified: true,
          available: true,
          images: ["https://proof.biteship.com/delivery-1.jpg", "http://unsafe.example/proof.jpg"],
          signatureUrl: "https://proof.biteship.com/signature-1.png"
        }
      }
    }
  };
  assert.equal(verifiedBiteshipDeliveryProofUrl(order), "https://proof.biteship.com/delivery-1.jpg");
  assert.equal(verifiedBiteshipDeliveryProofUrl(order, 1), "https://proof.biteship.com/signature-1.png");
  assert.equal(verifiedBiteshipDeliveryProofUrl(order, 2), "");
  assert.equal(verifiedBiteshipDeliveryProofUrl({ fulfillment: { shipment: { deliveryProof: { ...order.fulfillment.shipment.deliveryProof, verified: false } } } }), "");
});

test("delivery recovery alerts are limited to verified recoverable courier states", () => {
  assert.equal(isDeliveryRecoveryStatus("cancelled"), true);
  assert.equal(isDeliveryRecoveryStatus("rejected"), true);
  assert.equal(isDeliveryRecoveryStatus("courier_not_found"), true);
  assert.equal(isDeliveryRecoveryStatus("delivered"), false);
  assert.equal(isDeliveryRecoveryStatus("picked_up"), false);
});

test("customer WhatsApp templates use only the verified order owner, including an owner who is also staff", () => {
  const customer = {
    customer: {
      phone: "+62 811 222 3333",
      verifiedPhone: "628112223333",
      phoneVerifiedAt: "2026-09-01T00:00:00.000Z"
    }
  };
  assert.equal(verifiedCustomerWhatsappNumber(customer), "628112223333");
  assert.equal(verifiedCustomerWhatsappNumber({
    customer: { phone: "628111111111", verifiedPhone: "628111111111", phoneVerifiedAt: "2026-09-01T00:00:00.000Z" }
  }), "628111111111");
  assert.throws(
    () => verifiedCustomerWhatsappNumber({
      customer: { phone: "628111111111", verifiedPhone: "628999999999", phoneVerifiedAt: "2026-09-01T00:00:00.000Z" }
    }),
    /must match the verified order owner/i
  );
  assert.throws(
    () => verifiedCustomerWhatsappNumber({ customer: { phone: "+62 811 222 3333" } }, []),
    /verified customer WhatsApp number is required/i
  );
});

test("checkout preserves the verified owner snapshot and Admin contact targets only that customer", () => {
  const customer = normalizeCustomerDetails({
    name: "Customer Example",
    phone: "+62 811 222 3333",
    verifiedPhone: "628112223333",
    phoneVerifiedAt: "2026-09-04T08:51:58.948Z"
  });
  assert.equal(customer.verifiedPhone, "628112223333");

  const contactUrl = new URL(adminCustomerWhatsappUrl({ id: "BAK-0147", customer }));
  assert.equal(contactUrl.hostname, "wa.me");
  assert.equal(contactUrl.pathname, "/628112223333");
  assert.match(contactUrl.searchParams.get("text"), /Bakeaholic Bali/);
  assert.match(contactUrl.searchParams.get("text"), /BAK-0147/);
  assert.equal(adminCustomerWhatsappUrl({
    id: "BAK-0148",
    customer: { ...customer, verifiedPhone: "628999999999" }
  }), "");
});

test("payment reminders preserve customer/staff roles, deduplicate retries, and stop after payment or cancellation", async () => {
  const previousFetch = global.fetch;
  const envKeys = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ADMIN_NUMBER", "WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME", "WHATSAPP_ADMIN_TEMPLATE_NAME"];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const recipients = [];
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "123456",
    WHATSAPP_ADMIN_NUMBER: "628111111111,628222222222",
    WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME: "payment_update_order",
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v5"
  });
  global.fetch = async (_url, options) => {
    recipients.push(JSON.parse(options.body).to);
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { ok: true, status: 200, text: async () => JSON.stringify({ messages: [{ id: "wamid.reminder" }] }) };
  };
  const order = {
    id: "BAK-ROLE-TEST",
    status: "awaiting_payment",
    customer: { phone: "628111111111", verifiedPhone: "628111111111", phoneVerifiedAt: "2026-09-01T00:00:00.000Z" },
    pricing: { subtotal: 75000, deliveryFee: 0, tax: 0, discount: { amount: 0 }, total: 75000 },
    payment: {},
    receiptToken: "role-test-token"
  };
  try {
    const results = await Promise.all([
      maybeSendWhatsappPaymentReminder(order, "first"),
      maybeSendWhatsappPaymentReminder(order, "first")
    ]);
    assert.equal(results.filter((result) => result.sent).length, 1);
    assert.deepEqual(recipients, ["628111111111"]);
    assert.equal(order.paymentReminderFlow.firstMessageId, "wamid.reminder");
    assert.equal(order.paymentReminderFlow.firstQueuedAt, undefined);

    await sendWhatsappAdminAlert(order, "Staff review only");
    assert.deepEqual(recipients, ["628111111111", "628111111111", "628222222222"]);

    order.status = "paid";
    assert.deepEqual(await maybeSendWhatsappPaymentReminder(order, "second"), {
      sent: false, skipped: true, reason: "not_awaiting_payment"
    });
    order.status = "cancelled";
    assert.deepEqual(await maybeSendWhatsappPaymentReminder(order, "second"), {
      sent: false, skipped: true, reason: "not_awaiting_payment"
    });
    order.status = "expired";
    assert.deepEqual(await maybeSendWhatsappPaymentReminder(order, "second"), {
      sent: false, skipped: true, reason: "not_awaiting_payment"
    });
    assert.deepEqual(recipients, ["628111111111", "628111111111", "628222222222"]);
  } finally {
    global.fetch = previousFetch;
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }
});

test("delivery recovery accepts only the exact failed shipment and a replay-safe action ID", () => {
  const order = {
    status: "preparing",
    payment: { status: "paid" },
    pricing: { deliveryFee: 10000, shipping: { total: 10000 } },
    customer: { address: "Customer road", phone: "6281234567890" },
    fulfillment: {
      type: "delivery",
      address: "Customer road", location: { lat: -8.6, lng: 115.2 },
      shipment: { orderId: "ship-failed-1", status: "courier_not_found" }
    }
  };
  order.fulfillment.shipment.requestSnapshot = shipmentRequestSnapshot(order);
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
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v5"
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
      customer: { name: "Customer", phone: "628999999999", phoneVerifiedAt: "2026-09-01T00:00:00.000Z" },
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
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v5",
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
    customer: { name: "Customer", phone: "628999999999", phoneVerifiedAt: "2026-09-01T00:00:00.000Z" },
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

test("Contact customer accepts only the current recipient-bound v5 quick reply", () => {
  const now = Date.parse("2026-09-04T10:00:00.000Z");
  const current = {
    order: { id: "BAK-0134", status: "paid" },
    recipient: { recipient: "628111111111", messageId: "wamid.current" },
    staffNumber: "628111111111",
    notification: { templateName: "admin_order_alert_v5", lastSentAt: "2026-09-04T09:55:00.000Z" }
  };
  assert.equal(isCurrentStaffV5ContactReply(current, now), true);
  assert.equal(isCurrentStaffV5ContactReply({ ...current, notification: { ...current.notification, templateName: "legacy_template" } }, now), false);
  assert.equal(isCurrentStaffV5ContactReply({ ...current, recipient: null }, now), false);
  assert.equal(isCurrentStaffV5ContactReply({ ...current, staffNumber: "" }, now), false);
  assert.equal(isCurrentStaffV5ContactReply({ ...current, notification: { ...current.notification, lastSentAt: "2026-09-04T09:49:59.000Z" } }, now), false);
  assert.equal(isCurrentStaffV5ContactReply({ ...current, notification: { ...current.notification, lastSentAt: "2026-09-04T10:00:01.000Z" } }, now), false);
});

test("v5 Approve orchestrates one snapshot-bound Biteship booking and allocation-gated shipping notices", async () => {
  const envKeys = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ADMIN_NUMBER", "WHATSAPP_ADMIN_TEMPLATE_NAME", "WHATSAPP_SHIPPING_TEMPLATE_NAME", "WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME", "BITESHIP_API_KEY", "BITESHIP_COURIERS"];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const previousFetch = global.fetch;
  const calls = [];
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "test-token", WHATSAPP_PHONE_NUMBER_ID: "123", WHATSAPP_ADMIN_NUMBER: "628111111111",
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v5", WHATSAPP_SHIPPING_TEMPLATE_NAME: "shipping_update_v2",
    WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME: "admin_shipping_update_v2", BITESHIP_API_KEY: "biteship-test", BITESHIP_COURIERS: "grab"
  });
  const order = {
    id: "TEST-V5-APPROVE", mode: "test", status: "paid", paidAt: "2026-09-04T09:00:00.000Z",
    items: [{ itemId: "bliss-peanutella", quantity: 1 }],
    customer: { name: "Verified owner", phone: "628222222222", verifiedPhone: "628222222222", phoneVerifiedAt: "2026-09-04T09:00:00.000Z", address: "Verified customer drop-off" },
    fulfillment: { type: "delivery", address: "Verified customer drop-off", location: { lat: -8.65, lng: 115.22 } },
    pricing: { subtotal: 75000, deliveryFee: 10000, tax: 0, discount: { amount: 0 }, total: 85000, shipping: { courierCode: "grab", courierServiceCode: "instant", total: 10000 } },
    payment: { status: "paid", label: "QRIS" }, receiptToken: "v5-approve-token"
  };
  order.adminWhatsappNotifications = {
    templateName: "admin_order_alert_v5", lastSentAt: new Date().toISOString(),
    v5ApprovalSnapshot: shipmentRequestSnapshot(order),
    recipients: [{ recipientNumber: "628111111111", messageId: "wamid.v5.approve" }]
  };
  const restore = replaceStoreOrdersForTest("test", [order]);
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), body: options.body ? JSON.parse(options.body) : null });
    if (String(url).includes("/rates/couriers")) return { ok: true, json: async () => ({ pricing: [{ courier_code: "grab", courier_service_code: "instant", price: 10000 }] }) };
    if (String(url).includes("api.biteship.com/v1/orders")) return { ok: true, text: async () => JSON.stringify({ id: "ship-v5-1", status: "allocated", courier: { company: "Grab", link: "https://track.biteship.com/ship-v5-1" } }) };
    return { ok: true, status: 200, text: async () => JSON.stringify({ messages: [{ id: `wamid.${calls.length}` }] }) };
  };
  const message = { id: "inbound-v5-approve-1", from: "628111111111", context: { id: "wamid.v5.approve" }, button: { payload: "APPROVE TEST-V5-APPROVE" } };
  try {
    const first = await approveV5PaidOrderFromWhatsapp(message, "test");
    const second = await approveV5PaidOrderFromWhatsapp(message, "test");
    assert.equal(first.shipmentId, "ship-v5-1");
    assert.equal(second.reason, "already_claimed");
    assert.equal(order.fulfillment.shipment.orderId, "ship-v5-1");
    assert.deepEqual(order.fulfillment.shipment.requestSnapshot, shipmentRequestSnapshot(order));
    const booking = calls.find((call) => call.url.includes("api.biteship.com/v1/orders"));
    assert.equal(calls.filter((call) => call.url.includes("api.biteship.com/v1/orders")).length, 1);
    assert.equal(booking.body.origin_address, order.adminWhatsappNotifications.v5ApprovalSnapshot.pickup.address);
    assert.equal(booking.body.destination_address, "Verified customer drop-off");
    assert.deepEqual(calls.filter((call) => call.body?.template?.name).map((call) => call.body.template.name), ["shipping_update_v2", "admin_shipping_update_v2"]);
    await assert.rejects(() => approveV5PaidOrderFromWhatsapp({ ...message, id: "inbound-v5-mismatch" }, "test", "TEST-OTHER"), /does not match/i);
    order.status = "paid";
    order.fulfillment.shipment = undefined;
    order.fulfillment.address = "Changed drop-off";
    order.customer.address = "Changed drop-off";
    await assert.rejects(() => approveV5PaidOrderFromWhatsapp({ ...message, id: "inbound-v5-stale" }, "test"), /changed after this alert/i);
  } finally {
    restore(); global.fetch = previousFetch;
    for (const key of envKeys) { if (previousEnv[key] === undefined) delete process.env[key]; else process.env[key] = previousEnv[key]; }
  }
});

test("v5 Cancel keeps a 60-second undo window then commits cancellation/refund effects once", async () => {
  const envKeys = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ADMIN_NUMBER", "WHATSAPP_ADMIN_TEMPLATE_NAME", "WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME"];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const previousFetch = global.fetch;
  Object.assign(process.env, { WHATSAPP_ACCESS_TOKEN: "test-token", WHATSAPP_PHONE_NUMBER_ID: "123", WHATSAPP_ADMIN_NUMBER: "628111111111", WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v5", WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME: "order_cancelled" });
  const order = {
    id: "TEST-V5-CANCEL", mode: "test", status: "paid", paidAt: "2026-09-04T09:00:00.000Z", items: [{ itemId: "bliss-peanutella", quantity: 1 }],
    customer: { name: "Verified owner", phone: "628222222222", verifiedPhone: "628222222222", phoneVerifiedAt: "2026-09-04T09:00:00.000Z", address: "Customer drop-off" },
    fulfillment: { type: "delivery", address: "Customer drop-off", location: { lat: -8.65, lng: 115.22 } },
    pricing: { subtotal: 75000, deliveryFee: 10000, tax: 0, discount: { amount: 0 }, total: 85000, shipping: { courierCode: "grab", courierServiceCode: "instant", total: 10000 } }, payment: { status: "paid", label: "QRIS" }, receiptToken: "v5-cancel-token"
  };
  order.adminWhatsappNotifications = { templateName: "admin_order_alert_v5", lastSentAt: new Date().toISOString(), v5ApprovalSnapshot: shipmentRequestSnapshot(order), recipients: [{ recipientNumber: "628111111111", messageId: "wamid.v5.cancel" }] };
  const restore = replaceStoreOrdersForTest("test", [order]);
  const templateNames = [];
  global.fetch = async (_url, options = {}) => { const body = options.body ? JSON.parse(options.body) : {}; if (body.template?.name) templateNames.push(body.template.name); return { ok: true, status: 200, text: async () => JSON.stringify({ messages: [{ id: "wamid.cancel" }] }) }; };
  const message = { id: "inbound-v5-cancel-1", from: "628111111111", context: { id: "wamid.v5.cancel" }, button: { payload: "CANCEL TEST-V5-CANCEL" } };
  try {
    const pending = await scheduleV5CancelFromWhatsapp(message, "test");
    assert.ok(pending.undoToken); assert.equal(order.status, "paid"); assert.ok(order.adminPendingAction);
    await undoPendingAdminOrderAction("test", { orderId: order.id, token: pending.undoToken });
    assert.equal(order.status, "paid"); assert.equal(order.adminPendingAction, undefined);
    await assert.rejects(() => scheduleV5CancelFromWhatsapp({ ...message, id: "inbound-v5-cancel-mismatch" }, "test", "TEST-OTHER"), /does not match/i);
    const committed = await scheduleV5CancelFromWhatsapp({ ...message, id: "inbound-v5-cancel-2" }, "test");
    order.adminPendingAction.executeAt = new Date(Date.now() - 1).toISOString();
    await finalizePendingAdminOrderAction("test", order.id, committed.undoToken);
    assert.equal(order.status, "cancelled");
    assert.equal(templateNames.includes("order_cancelled"), true);
    assert.notEqual(order.refund?.status, "processed");
  } finally {
    restore(); global.fetch = previousFetch;
    for (const key of envKeys) { if (previousEnv[key] === undefined) delete process.env[key]; else process.env[key] = previousEnv[key]; }
  }
});

test("paid admin alert describes an unbooked delivery and required approval", () => {
  const parameters = adminWhatsappParameters({
    id: "BAK-0105",
    status: "paid",
    customer: { name: "Eduardo", phone: "+6281234567890", verifiedPhone: "6281234567890", phoneVerifiedAt: "2026-09-01T00:00:00.000Z" },
    pricing: { total: 18700 },
    payment: { label: "QRIS" },
    fulfillment: { shipment: {} },
    receiptToken: "token"
  }, "Payment received");
  assert.equal(parameters[6], "Not booked yet");
  assert.equal(parameters[2], "Eduardo");
  assert.equal(parameters[3], "+6281234567890");
  assert.match(parameters[8], /requests one governed Biteship driver/i);
  assert.match(parameters[8], /60-second governed Undo window/i);
});

test("approved detailed admin alert overrides the deprecated review template", async () => {
  const order = {
    id: "BAK-0106",
    status: "paid",
    customer: {
      name: "Verified Customer",
      phone: "+6281234567890",
      verifiedPhone: "6281234567890",
      phoneVerifiedAt: "2026-09-01T00:00:00.000Z"
    },
    pricing: { total: 187000 },
    payment: { label: "QRIS" },
    fulfillment: { type: "delivery", address: "Customer road, Denpasar Selatan, Kota Denpasar, Bali", shipment: {} },
    receiptToken: "receipt-token"
  };

  const previousFetch = global.fetch;
  const previousEnv = {
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    adminNumbers: process.env.WHATSAPP_ADMIN_NUMBER,
    reviewTemplate: process.env.WHATSAPP_ADMIN_REVIEW_TEMPLATE_NAME,
    template: process.env.WHATSAPP_ADMIN_TEMPLATE_NAME
  };
  let payload;
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "123456",
    WHATSAPP_ADMIN_NUMBER: "628111111111",
    WHATSAPP_ADMIN_REVIEW_TEMPLATE_NAME: "__retired_template_sentinel__",
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v5"
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
    const result = await sendWhatsappAdminAlert(order, "Payment received - awaiting staff approval");
    assert.equal(result.templateName, "admin_order_alert_v5");
  } finally {
    global.fetch = previousFetch;
    for (const [key, value] of Object.entries({
      WHATSAPP_ACCESS_TOKEN: previousEnv.token,
      WHATSAPP_PHONE_NUMBER_ID: previousEnv.phoneId,
      WHATSAPP_ADMIN_NUMBER: previousEnv.adminNumbers,
      WHATSAPP_ADMIN_REVIEW_TEMPLATE_NAME: previousEnv.reviewTemplate,
      WHATSAPP_ADMIN_TEMPLATE_NAME: previousEnv.template
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  assert.equal(payload.template.name, "admin_order_alert_v5");
  const body = payload.template.components.find((component) => component.type === "body");
  assert.equal(body.parameters.length, 9);
  assert.equal(body.parameters[1].text, "BAK-0106");
  assert.equal(body.parameters[2].text, "Customer details available by quick reply");
  assert.equal(body.parameters[3].text, "Verified order owner only");
  assert.equal(payload.template.components.some((component) => component.type === "header"), false);
  const buttons = payload.template.components.filter((component) => component.type === "button");
  assert.deepEqual(buttons.map((button) => [button.index, button.sub_type, button.parameters[0].payload]), [
    ["0", "quick_reply", "APPROVE BAK-0106"],
    ["1", "quick_reply", "CONTACT_CUSTOMER"],
    ["2", "quick_reply", "CANCEL BAK-0106"]
  ]);
});

test("legacy staff-review helper remains redacted and does not book delivery", () => {
  const previousSiteUrl = process.env.PUBLIC_SITE_URL;
  process.env.PUBLIC_SITE_URL = "https://bakeaholicbali.com";
  try {
    const order = {
      id: "BAK-0147",
      fulfillment: {
        type: "delivery",
        address: "12 Customer Street, Denpasar Selatan, Kota Denpasar, Bali 80227, Indonesia"
      },
      customer: { address: "12 Customer Street, Denpasar Selatan, Kota Denpasar, Bali 80227, Indonesia" }
    };
    const message = adminOrderActionReviewMessage(order, "approve");
    assert.match(message, /No driver has been requested/);
    assert.match(message, /Pickup:/);
    assert.match(message, /Drop-off: Denpasar Selatan, Kota Denpasar, Bali, Indonesia/);
    assert.match(message, /admin\.html\?section=orders&order=BAK-0147/);
    assert.doesNotMatch(message, /12 Customer Street|80227/);
    assert.equal(addressArea("12 Customer Street, Denpasar Selatan, Kota Denpasar, Bali 80227, Indonesia"), "Denpasar Selatan, Kota Denpasar, Bali, Indonesia");
  } finally {
    if (previousSiteUrl === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = previousSiteUrl;
  }
});

function whatsappOrder(overrides = {}) {
  return {
    id: "BAK-0001",
    mode: "live",
    status: "paid",
    customer: { phone: "+6281234567890", phoneVerifiedAt: "2026-09-01T00:00:00.000Z" },
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
    "WHATSAPP_ADMIN_DELIVERY_RECOVERY_TEMPLATE_NAME",
    "WHATSAPP_ADMIN_DELIVERY_COMPLETE_TEMPLATE_NAME",
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
    WHATSAPP_SHIPPING_TEMPLATE_NAME: "shipping_update_v2",
    WHATSAPP_ADMIN_TEMPLATE_NAME: "admin_order_alert_v5",
    WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME: "admin_shipping_update_v2",
    WHATSAPP_ADMIN_DELIVERY_RECOVERY_TEMPLATE_NAME: "admin_driver_cancelled_v1",
    WHATSAPP_ADMIN_DELIVERY_COMPLETE_TEMPLATE_NAME: "admin_delivery_complete_v1",
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
  assert.equal(payloads.length, 14);
  const bodyCounts = Object.fromEntries(payloads.map((payload) => {
    const body = payload.template.components?.find((component) => component.type === "body");
    return [payload.template.name, body?.parameters?.length || 0];
  }));
  assert.deepEqual(bodyCounts, {
    otp_verification: 1,
    payment_confirmed: 0,
    order_delivered: 0,
    payment_receipt: 2,
    payment_update_order: 1,
    order_cancelled_unpaid: 1,
    order_cancelled: 1,
    shipping_update_v2: 4,
    admin_order_alert_v5: 9,
    admin_driver_cancelled_v1: 4,
    admin_delivery_complete_v1: 3,
    admin_shipping_update_v2: 4,
    refund_completed: 3,
    admin_refund_update: 4
  });
  assert.equal(payloads.some((payload) => payload.template.name === "order_preparing"), false);
  const driverCancelledPayload = payloads.find((payload) => payload.template.name === "admin_driver_cancelled_v1");
  const driverCancelledParameters = driverCancelledPayload.template.components.find((component) => component.type === "body").parameters.map((parameter) => parameter.text);
  assert.equal(driverCancelledParameters.length, 4);
  assert.match(driverCancelledParameters[0], /^WA-TEST-/);
  assert.deepEqual(driverCancelledParameters.slice(1), [
    "Template Test Courier",
    "bakeaholic-template-test",
    "Biteship courier_not_found before pickup/handoff"
  ]);
  assert.deepEqual(driverCancelledPayload.template.components.filter((component) => component.type === "button").map((button) => [button.index, button.sub_type, button.parameters[0].payload]), [
    ["0", "quick_reply", "REQUEST_NEW_DRIVER"]
  ]);
  for (const templateName of ["payment_receipt", "payment_update_order", "order_cancelled_unpaid", "shipping_update_v2", "refund_completed"]) {
    const payload = payloads.find((item) => item.template.name === templateName);
    const button = payload.template.components.find((component) => component.type === "button" && component.sub_type === "url");
    assert.equal(button.parameters.length, 1);
    assert.equal(button.parameters[0].type, "text");
    assert.match(button.parameters[0].text, /^[a-f0-9]{36}$/);
  }
  const deliveryCompletePayload = payloads.find((payload) => payload.template.name === "admin_delivery_complete_v1");
  const deliveryCompleteButton = deliveryCompletePayload.template.components.find((component) => component.type === "button" && component.sub_type === "url");
  assert.deepEqual(deliveryCompleteButton.parameters.map((parameter) => parameter.type), ["text"]);
  assert.match(deliveryCompleteButton.parameters[0].text, /^WA-TEST-/);
});

test("status templates normalize retired order-received settings to payment confirmation", () => {
  const previous = process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
  process.env.WHATSAPP_ORDER_TEMPLATE_NAME = "__retired_template_sentinel__";
  try {
    assert.equal(configuredWhatsappOrderTemplateName(whatsappOrder()), "payment_confirmed");
  } finally {
    if (previous === undefined) delete process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
    else process.env.WHATSAPP_ORDER_TEMPLATE_NAME = previous;
  }
});

test("saved integration template names migrate to payment confirmation", () => {
  assert.equal(normalizeWhatsappOrderTemplateName("order_status_update"), "payment_confirmed");
  assert.equal(normalizeWhatsappOrderTemplateName("order_received"), "payment_confirmed");
  assert.equal(normalizeWhatsappOrderTemplateName("payment_confirmed"), "payment_confirmed");
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

test("unpaid lifecycle is exactly +2/+4/+5 minutes", () => {
  const createdAt = "2026-09-04T00:00:00.000Z";
  const flow = paymentReminderFlowTimes(createdAt);
  assert.equal(flow.version, 2);
  assert.equal(Date.parse(flow.firstReminderAt) - Date.parse(createdAt), 2 * 60 * 1000);
  assert.equal(Date.parse(flow.secondReminderAt) - Date.parse(createdAt), 4 * 60 * 1000);
  assert.equal(Date.parse(flow.expireAt) - Date.parse(createdAt), 5 * 60 * 1000);
});

test("late Xendit success is held for staff review across providers and stale expiry cannot reopen it", () => {
  const lateOrder = (provider) => ({
    id: `BAK-LATE-${provider}`,
    status: "expired",
    expiresAt: "2026-09-04T00:00:00.000Z",
    customer: { phone: "6281234567890" },
    items: [],
    lineItems: [],
    pricing: { subtotal: 75000, deliveryFee: 0, tax: 0, discount: { amount: 0 }, total: 75000 },
    payment: { provider, status: "expired" },
    fulfillment: { type: "delivery" }
  });
  const cases = [
    ["xendit_invoice", applyXenditInvoiceStatusToOrder, { status: "PAID" }, { status: "EXPIRED" }],
    ["xendit_qr_code", applyXenditQrCodeStatusToOrder, { status: "SUCCESS" }, { status: "EXPIRED" }],
    ["xendit_virtual_account", applyXenditVirtualAccountStatusToOrder, { status: "PAID" }, { status: "EXPIRED" }],
    ["xendit_payments_api", applyXenditPaymentRequestStatusToOrder, { status: "SUCCEEDED" }, { status: "EXPIRED" }],
    ["xendit_components", applyXenditPaymentSessionStatusToOrder, { status: "COMPLETED" }, { status: "EXPIRED" }]
  ];
  for (const [provider, applyStatus, success, staleExpiry] of cases) {
    const order = lateOrder(provider);
    applyStatus(order, success);
    assert.equal(order.status, "paid_late_review", provider);
    assert.equal(order.payment.status, "paid", provider);
    assert.equal(order.latePaymentReview.status, "manual_review_required", provider);
    assert.match(order.latePaymentReview.message, /Do not prepare or book delivery/i, provider);
    assert.equal(order.fulfillment.shipment, undefined, provider);
    applyStatus(order, staleExpiry);
    assert.equal(order.status, "paid_late_review", `${provider} stale expiry`);
    assert.equal(order.payment.status, "paid", `${provider} stale expiry`);
  }
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
