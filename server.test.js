const assert = require("node:assert/strict");
const test = require("node:test");

const {
  configuredWhatsappOrderTemplateName,
  customerShippingWhatsappParameters,
  hasBiteshipShipmentForMessaging,
  parsePublicOrderReference,
  sendWhatsappTemplateMessage,
  shippingWhatsappDetails
} = require("./server");

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
    waybillId: "-",
    trackingLink: "https://track.biteship.com/ship-1",
    shippingDocumentUrl: "https://track.biteship.com/ship-1"
  });
  assert.deepEqual(customerShippingWhatsappParameters(order), [
    "BAK-0001",
    "-",
    "-",
    "https://track.biteship.com/ship-1",
    "https://track.biteship.com/ship-1"
  ]);
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
