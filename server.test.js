const assert = require("node:assert/strict");
const test = require("node:test");

const {
  applyXenditRefundStatusToOrder,
  buildXenditInvoicePayload,
  buildXenditPaymentRequestPayload,
  buildXenditPaymentSessionPayload,
  adminWhatsappParameters,
  availablePaymentMethods,
  configuredWhatsappOrderTemplateName,
  customerShippingWhatsappParameters,
  defaultSecurityHeaders,
  hasBiteshipShipmentForMessaging,
  isSuccessfulXenditPaymentEvent,
  isSupportedImageBuffer,
  isXenditRefundEvent,
  orderUpdateWhatsappParameters,
  parsePublicOrderReference,
  runWhatsappTemplateDiagnostics,
  securityTxtBody,
  selectXenditSecretKey,
  sendWhatsappTemplateMessage,
  shippingWhatsappDetails,
  shipmentStatusToOrderStatus,
  xenditPaymentAmount,
  xenditOrderReferenceIds,
  xenditPaymentSessionIds,
  xenditRefundRequestBody,
  xenditKeyMode
} = require("./server");

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
    admin_shipping_update: 4
  });
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
  assert.equal(isSuccessfulXenditPaymentEvent({ status: "ACTIVE" }), false);
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

test("Xendit refund webhooks update pending, succeeded, and failed states", () => {
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
  assert.equal(order.refund.status, "succeeded");
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
  assert.equal(payload.mode, "PAYMENT_LINK");
  assert.match(payload.success_return_url, /pay\.html\?order=BAK-CARD/);
  assert.equal(payload.cancel_return_url, payload.success_return_url);
  assert.equal(payload.components_configuration, undefined);
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
