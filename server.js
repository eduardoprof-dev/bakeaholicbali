const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

function loadEnvFiles(paths) {
  paths.forEach((targetPath) => {
    if (!targetPath || !fs.existsSync(targetPath)) {
      return;
    }

    const raw = fs.readFileSync(targetPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key]) {
        return;
      }

      const value = trimmed.slice(separatorIndex + 1).trim();
      process.env[key] = value.replace(/^['"]|['"]$/g, "");
    });
  });
}

const rootDir = __dirname;
const defaultEnvPath = path.join(rootDir, ".env");

loadEnvFiles([
  defaultEnvPath,
  path.join(process.cwd(), ".env")
]);

const bundledDataDir = path.join(rootDir, "data");
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : bundledDataDir;
const envPath = process.env.ENV_FILE_PATH
  ? path.resolve(process.env.ENV_FILE_PATH)
  : defaultEnvPath;

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);
const bundledCatalogPath = path.join(bundledDataDir, "catalog.json");
const catalogPath = path.join(dataDir, "catalog.json");
const integrationsPath = path.join(dataDir, "integrations.json");

const DEFAULT_BRAND_STORY = {
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
const customersPath = path.join(dataDir, "customers.json");
const ordersLivePath = path.join(dataDir, "orders-live.json");
const ordersTestPath = path.join(dataDir, "orders-test.json");
const biteshipWebhookLogPath = path.join(dataDir, "biteship-webhook-log.json");
const PAYMENT_METHODS = [
  {
    id: "xendit-card",
    label: "Credit / Debit Card",
    kind: "card",
    logoText: "CARD",
    description: "Visa, Mastercard, JCB, Amex",
    xenditPaymentMethods: ["CREDIT_CARD"]
  },
  {
    id: "xendit-qris",
    label: "QRIS",
    kind: "qris",
    logoText: "QRIS",
    description: "Scan QRIS to pay from any e-wallet or banking app",
    xenditPaymentMethods: ["QRIS"]
  },
  {
    id: "xendit-va",
    label: "Bank Transfer",
    kind: "va",
    logoText: "BANK",
    description: "Mandiri, Permata, BNI, CIMB Niaga, BRI",
    xenditPaymentMethods: ["MANDIRI", "PERMATA", "BNI", "CIMB", "BRI"]
  }
];
const MAX_DELIVERY_DISTANCE_KM = 100;

const DEMO_VOUCHERS = [
  { code: "SWEET10", label: "10% off subtotal", type: "percent", value: 10, maxDiscount: 15000 },
  { code: "FREESHIP", label: "Free delivery", type: "delivery", value: 0 },
  { code: "FULLTEST", label: "100% test discount", type: "fixed", value: 999999999 }
];

function loadCatalog() {
  if (!fs.existsSync(catalogPath)) {
    ensureParentDir(catalogPath);
    const bundledRaw = fs.readFileSync(bundledCatalogPath, "utf8");
    fs.writeFileSync(catalogPath, bundledRaw, "utf8");
  }

  const sourcePath = fs.existsSync(catalogPath) ? catalogPath : bundledCatalogPath;
  const raw = fs.readFileSync(sourcePath, "utf8");
  return JSON.parse(raw);
}

function ensureParentDir(targetPath) {
  const parentDir = path.dirname(targetPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
}

function loadEnvMap(targetPath) {
  const env = {};
  if (!targetPath || !fs.existsSync(targetPath)) {
    return env;
  }

  const raw = fs.readFileSync(targetPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  });

  return env;
}

function writeEnvMap(targetPath, envMap) {
  ensureParentDir(targetPath);
  const preferredOrder = [
    "HOST",
    "PORT",
    "DATA_DIR",
    "ENV_FILE_PATH",
    "GOOGLE_MAPS_API_KEY",
    "BITESHIP_API_KEY",
    "BITESHIP_COURIERS",
    "XENDIT_SECRET_KEY",
    "XENDIT_CALLBACK_TOKEN",
    "XENDIT_ENVIRONMENT",
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "WHATSAPP_VERIFY_TOKEN",
    "WHATSAPP_APP_ID",
    "WHATSAPP_APP_SECRET",
    "WHATSAPP_GRAPH_VERSION",
    "WHATSAPP_OTP_TEMPLATE_NAME",
    "WHATSAPP_ORDER_TEMPLATE_NAME",
    "WHATSAPP_RECEIPT_TEMPLATE_NAME",
    "WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME",
    "WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME",
    "WHATSAPP_SHIPPING_TEMPLATE_NAME",
    "WHATSAPP_ADMIN_NUMBER",
    "WHATSAPP_ADMIN_TEMPLATE_NAME",
    "WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME",
    "WHATSAPP_TEMPLATE_LANGUAGE"
  ];
  const writtenKeys = new Set();
  const lines = [];

  preferredOrder.forEach((key) => {
    if (!(key in envMap)) {
      return;
    }
    lines.push(`${key}=${envMap[key] ?? ""}`);
    writtenKeys.add(key);
  });

  Object.keys(envMap)
    .filter((key) => !writtenKeys.has(key))
    .sort()
    .forEach((key) => {
      lines.push(`${key}=${envMap[key] ?? ""}`);
    });

  fs.writeFileSync(targetPath, `${lines.join("\n")}\n`, "utf8");
}

function readJsonFileSafely(targetPath, fallback = {}) {
  try {
    if (!fs.existsSync(targetPath)) {
      return fallback;
    }
    return JSON.parse(fs.readFileSync(targetPath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJsonFile(targetPath, payload) {
  ensureParentDir(targetPath);
  fs.writeFileSync(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function getEnvironmentIntegrationConfig() {
  return {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    biteshipApiKey: process.env.BITESHIP_API_KEY || "",
    biteshipCouriers: process.env.BITESHIP_COURIERS || "gojek,grab",
    xenditSecretKey: process.env.XENDIT_SECRET_KEY || "",
    xenditCallbackToken: process.env.XENDIT_CALLBACK_TOKEN || "",
    xenditEnvironment: process.env.XENDIT_ENVIRONMENT === "live" ? "live" : "test",
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
    whatsappAppId: process.env.WHATSAPP_APP_ID || "",
    whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || "",
    whatsappGraphVersion: process.env.WHATSAPP_GRAPH_VERSION || "v22.0",
    whatsappOtpTemplateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME || "",
    whatsappOrderTemplateName: process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "",
    whatsappReceiptTemplateName: process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME || "",
    whatsappPaymentReminderTemplateName: process.env.WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME || "",
    whatsappPaymentExpiredTemplateName: process.env.WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME || "",
    whatsappShippingTemplateName: process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME || "",
    whatsappAdminNumber: process.env.WHATSAPP_ADMIN_NUMBER || "",
    whatsappAdminTemplateName: process.env.WHATSAPP_ADMIN_TEMPLATE_NAME || "",
    whatsappAdminShippingTemplateName: process.env.WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME || "",
    whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en"
  };
}

function getIntegrationConfig() {
  return readIntegrationSettings();
}

function parseJsonSafely(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function isWhatsappCloudReady() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

function whatsappGraphVersion() {
  return process.env.WHATSAPP_GRAPH_VERSION || "v22.0";
}

function whatsappMessagesUrl() {
  const phoneNumberId = encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID || "");
  return `https://graph.facebook.com/${whatsappGraphVersion()}/${phoneNumberId}/messages`;
}

function describeToken(token = "") {
  const value = String(token || "").trim();
  return {
    present: Boolean(value),
    length: value.length,
    prefix: value ? value.slice(0, 4) : "",
    looksLikeMetaToken: value.startsWith("EAA")
  };
}

async function checkWhatsappCloudConfig() {
  const token = String(process.env.WHATSAPP_ACCESS_TOKEN || "").trim();
  const phoneNumberId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const result = {
    token: describeToken(token),
    phoneNumberId,
    graphVersion: whatsappGraphVersion(),
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
    orderTemplateName: process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "",
    otpTemplateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME || "",
    receiptTemplateName: process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME || "",
    shippingTemplateName: process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME || "",
    adminTemplateName: process.env.WHATSAPP_ADMIN_TEMPLATE_NAME || "",
    adminShippingTemplateName: process.env.WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME || "",
    adminNumberConfigured: Boolean(process.env.WHATSAPP_ADMIN_NUMBER),
    ok: false
  };

  if (!token || !phoneNumberId) {
    result.error = "WhatsApp access token or phone number ID is missing";
    return result;
  }

  const url = `https://graph.facebook.com/${whatsappGraphVersion()}/${encodeURIComponent(phoneNumberId)}?fields=id,display_phone_number,verified_name`;
  const metaResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const responseText = await metaResponse.text();
  const parsed = parseJsonSafely(responseText, {});
  result.ok = metaResponse.ok;
  result.status = metaResponse.status;
  result.meta = metaResponse.ok
    ? parsed
    : {
        error: parsed?.error?.message || responseText,
        code: parsed?.error?.code,
        type: parsed?.error?.type
      };
  return result;
}

async function sendWhatsappTemplateMessage(to, templateName, parameters = [], options = {}) {
  if (!isWhatsappCloudReady()) {
    throw new Error("WhatsApp Cloud API is not configured");
  }

  if (!templateName) {
    throw new Error("WhatsApp template name is missing");
  }

  const recipient = formatIndonesianPhone(to);
  if (!recipient) {
    throw new Error("Recipient WhatsApp number is missing");
  }

  const bodyParameters = parameters
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .map((value) => ({
      type: "text",
      text: String(value).trim()
    }));

  const templateComponents = [];
  if (options.headerDocumentUrl) {
    templateComponents.push({
      type: "header",
      parameters: [
        {
          type: "document",
          document: {
            link: String(options.headerDocumentUrl).trim(),
            filename: String(options.headerDocumentFilename || "document.pdf").trim()
          }
        }
      ]
    });
  }

  if (bodyParameters.length) {
    templateComponents.push({
      type: "body",
      parameters: bodyParameters
    });
  }

  if (options.authenticationCode) {
    templateComponents.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [
        {
          type: "text",
          text: String(options.authenticationCode).trim()
        }
      ]
    });
  }

  if (Array.isArray(options.urlButtonParameters)) {
    options.urlButtonParameters.forEach((button) => {
      const text = String(button?.text || "").trim();
      if (!text) return;
      templateComponents.push({
        type: "button",
        sub_type: "url",
        index: String(button?.index || "0"),
        parameters: [
          {
            type: "text",
            text
          }
        ]
      });
    });
  }

  if (Array.isArray(options.quickReplyButtons)) {
    options.quickReplyButtons.slice(0, 3).forEach((button, index) => {
      const payload = String(button?.payload || "").trim();
      if (!payload) return;
      templateComponents.push({
        type: "button",
        sub_type: "quick_reply",
        index: String(index),
        parameters: [
          {
            type: "payload",
            payload
          }
        ]
      });
    });
  }

  const buildPayload = (languageCode) => ({
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      ...(templateComponents.length ? { components: templateComponents } : {})
    }
  });

  const sendTemplate = async (languageCode) => {
    const response = await fetch(whatsappMessagesUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(buildPayload(languageCode))
    });

    const responseText = await response.text();
    const parsed = parseJsonSafely(responseText, {});
    if (!response.ok) {
      const message =
        parsed?.error?.message ||
        `WhatsApp message failed with status ${response.status}`;
      const error = new Error(`${message} (template: ${templateName}, language: ${languageCode})`);
      error.metaCode = parsed?.error?.code;
      error.languageCode = languageCode;
      throw error;
    }

    return parsed;
  };

  const primaryLanguage = options.languageCode || process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
  try {
    return await sendTemplate(primaryLanguage);
  } catch (error) {
    const fallbackLanguage = primaryLanguage === "en" ? "en_US" : primaryLanguage === "en_US" ? "en" : "";
    if (error.metaCode !== 132001 || !fallbackLanguage) {
      throw error;
    }
    try {
      return await sendTemplate(fallbackLanguage);
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
}

async function sendWhatsappInteractiveButtons(to, bodyText = "", buttons = []) {
  if (!isWhatsappCloudReady()) {
    throw new Error("WhatsApp Cloud API is not configured");
  }

  const recipient = formatIndonesianPhone(to);
  if (!recipient) {
    throw new Error("Recipient WhatsApp number is missing");
  }

  const normalizedButtons = buttons
    .map((button) => ({
      id: String(button?.id || "").trim(),
      title: String(button?.title || "").trim()
    }))
    .filter((button) => button.id && button.title)
    .slice(0, 3);

  if (!normalizedButtons.length) {
    throw new Error("WhatsApp interactive message needs at least one button");
  }

  const response = await fetch(whatsappMessagesUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: String(bodyText || "").trim()
        },
        action: {
          buttons: normalizedButtons.map((button) => ({
            type: "reply",
            reply: button
          }))
        }
      }
    })
  });

  const responseText = await response.text();
  const parsed = parseJsonSafely(responseText, {});
  if (!response.ok) {
    const message =
      parsed?.error?.message ||
      `WhatsApp interactive message failed with status ${response.status}`;
    throw new Error(message);
  }
  return parsed;
}

async function sendWhatsappOtpCode(phone, code) {
  const templateName = String(process.env.WHATSAPP_OTP_TEMPLATE_NAME || "").trim();
  if (!templateName) {
    throw new Error("WHATSAPP_OTP_TEMPLATE_NAME is not configured");
  }

  return sendWhatsappTemplateMessage(phone, templateName, [code], {
    authenticationCode: code,
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US"
  });
}

function humanizeOrderStatus(order) {
  switch (order.status) {
    case "awaiting_payment":
      return "Awaiting payment";
    case "paid":
      return "Payment received - awaiting staff approval";
    case "preparing":
      return "Preparing order";
    case "cancelled":
      return "Order cancelled";
    case "expired":
      return "Payment expired";
    case "payment_failed":
      return "Payment failed";
    default:
      return String(order.status || "Order update")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

function ensureOrderReceiptToken(order) {
  if (!order.receiptToken) {
    order.receiptToken = crypto.randomBytes(18).toString("hex");
  }
  return order.receiptToken;
}

function getPublicDocumentUrl(order) {
  const baseUrl = String(process.env.PUBLIC_SITE_URL || "https://bakeaholicbali.com").replace(/\/+$/, "");
  const modeParam = order.mode === "test" ? "&mode=test" : "";
  return `${baseUrl}/invoice.html?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(ensureOrderReceiptToken(order))}${modeParam}`;
}

function publicDocumentButtonQuery(order) {
  const modeSuffix = order.mode === "test" ? ".test" : "";
  return `${order.id}.${ensureOrderReceiptToken(order)}${modeSuffix}`;
}

function xenditInvoiceUrl(order) {
  return order.payment?.invoiceUrl || order.payment?.paymentUrl || getPublicDocumentUrl(order);
}

function xenditReceiptButtonPath(order) {
  const receiptUrl = xenditInvoiceUrl(order);
  try {
    const parsed = new URL(receiptUrl);
    if (parsed.hostname === "checkout.xendit.co") {
      return `${parsed.pathname.replace(/^\/+/, "")}${parsed.search}${parsed.hash}`;
    }
  } catch (_error) {
    return String(receiptUrl || "").trim();
  }
  return String(receiptUrl || "").trim();
}

function xenditCheckoutButtonToken(order) {
  const receiptUrl = xenditInvoiceUrl(order);
  try {
    const parsed = new URL(receiptUrl);
    if (parsed.hostname === "checkout.xendit.co") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "web" && parts[1]) {
        return parts.slice(1).join("");
      }
    }
  } catch (_error) {
    return String(receiptUrl || "").trim();
  }
  return String(receiptUrl || "").trim();
}

function biteshipDocumentUrl(order) {
  const shipment = order.fulfillment?.shipment || {};
  return shipment.labelUrl ||
    shipment.invoiceUrl ||
    shipment.waybillUrl ||
    shipment.trackingLink ||
    shipment.raw?.label_url ||
    shipment.raw?.invoice_url ||
    shipment.raw?.waybill_url ||
    shipment.raw?.courier?.link ||
    "";
}

function whatsappDocumentAttachmentUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";
  return /\.(pdf|png|jpe?g|webp)(\?|#|$)/i.test(value) ? value : "";
}

function defaultWhatsappOrderTemplateName(order) {
  const statusTemplates = {
    awaiting_payment: "payment_pending",
    paid: "payment_confirmed",
    preparing: "order_preparing",
    on_delivery: "order_shipped",
    shipped: "order_shipped",
    delivered: "order_delivered",
    complete: "order_delivered"
  };
  return statusTemplates[order.status] || "order_received";
}

function configuredWhatsappOrderTemplateName(order) {
  const templateName = String(process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "").trim();
  if (order.status !== "paid" || !templateName || templateName === "order_status_update") {
    return defaultWhatsappOrderTemplateName(order);
  }
  return templateName;
}

async function sendWhatsappOrderUpdate(order) {
  const templateName = configuredWhatsappOrderTemplateName(order);
  if (!templateName) {
    throw new Error("WHATSAPP_ORDER_TEMPLATE_NAME is not configured");
  }

  return sendWhatsappTemplateMessage(order.customer.phone, templateName, [], { languageCode: "en" });
}

function adminWhatsappParameters(order, eventLabel = "") {
  const documentUrl = biteshipDocumentUrl(order) || xenditInvoiceUrl(order);
  return [
    eventLabel || humanizeOrderStatus(order),
    order.id,
    order.customer?.name || "Customer",
    order.customer?.phone || "",
    `Rp ${Number(order.pricing?.total || 0).toLocaleString("id-ID")}`,
    order.payment?.label || "",
    order.fulfillment?.shipment?.status || order.status || "",
    documentUrl,
    order.status === "paid" ? `Reply APPROVE when packed, or CANCEL if stock is empty. If there is more than one waiting order, reply APPROVE ${order.id} or CANCEL ${order.id}.` : "No staff action needed."
  ];
}

function receiptWhatsappParameters(order) {
  return [
    order.id,
    `Rp ${Number(order.pricing?.total || 0).toLocaleString("id-ID")}`
  ];
}

function paymentReminderWhatsappParameters(order) {
  return [
    order.id
  ];
}

function paymentExpiredWhatsappParameters(order) {
  return [
    order.id
  ];
}

function shippingWhatsappParameters(order) {
  const shipment = order.fulfillment?.shipment || {};
  const courierName = shipment.courier?.company || shipment.courier?.name || shipment.raw?.courier?.company || shipment.raw?.courier?.name || "";
  return [
    order.id,
    courierName || "Courier",
    shipment.waybillId || "-",
    shipment.trackingLink || biteshipDocumentUrl(order) || "-",
    biteshipDocumentUrl(order) || shipment.trackingLink || "-"
  ];
}

async function sendWhatsappAdminAlert(order, eventLabel = "") {
  const adminNumber = String(process.env.WHATSAPP_ADMIN_NUMBER || "").trim();
  const templateName = String(process.env.WHATSAPP_ADMIN_TEMPLATE_NAME || "").trim();
  if (!adminNumber || !templateName) {
    throw new Error("Admin WhatsApp number or template name is missing");
  }

  return sendWhatsappTemplateMessage(adminNumber, templateName, adminWhatsappParameters(order, eventLabel), {
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
    headerDocumentUrl: whatsappDocumentAttachmentUrl(xenditInvoiceUrl(order)),
    headerDocumentFilename: `${order.id}-xendit-invoice.pdf`,
    quickReplyButtons: order.status === "paid"
      ? [
          { payload: `APPROVE ${order.id}` },
          { payload: `CANCEL ${order.id}` }
        ]
      : []
  });
}

async function sendWhatsappPaymentReceipt(order) {
  const templateName = String(process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME || "").trim();
  if (!templateName) {
    throw new Error("WHATSAPP_RECEIPT_TEMPLATE_NAME is not configured");
  }

  return sendWhatsappTemplateMessage(order.customer.phone, templateName, receiptWhatsappParameters(order), {
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
    headerDocumentUrl: whatsappDocumentAttachmentUrl(xenditInvoiceUrl(order)),
    headerDocumentFilename: `${order.id}-payment-receipt.pdf`,
    urlButtonParameters: [
      {
        index: "0",
        text: xenditCheckoutButtonToken(order)
      }
    ]
  });
}

async function sendWhatsappPaymentReminder(order) {
  const templateName = String(process.env.WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME || "").trim();
  if (!templateName) {
    throw new Error("WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME is not configured");
  }

  return sendWhatsappTemplateMessage(order.customer.phone, templateName, paymentReminderWhatsappParameters(order), {
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
    urlButtonParameters: [
      {
        index: "0",
        text: xenditReceiptButtonPath(order)
      }
    ]
  });
}

async function sendWhatsappPaymentExpired(order) {
  const templateName = String(process.env.WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME || "").trim();
  if (!templateName) {
    throw new Error("WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME is not configured");
  }

  return sendWhatsappTemplateMessage(order.customer.phone, templateName, paymentExpiredWhatsappParameters(order), {
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
    urlButtonParameters: [
      {
        index: "0",
        text: publicDocumentButtonQuery(order)
      }
    ]
  });
}

async function maybeSendWhatsappPaymentReceipt(order, eventKey = "") {
  const skipReason = (() => {
    if (order.mode === "test") return "test_order";
    if (!isWhatsappCloudReady()) return "whatsapp_not_configured";
    if (!process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME) return "receipt_template_not_configured";
    if (eventKey && order.whatsappReceiptNotification?.lastNotificationKey === eventKey) return "already_sent";
    return "";
  })();
  if (skipReason) {
    return { sent: false, skipped: true, reason: skipReason };
  }

  try {
    const messageResponse = await sendWhatsappPaymentReceipt(order);
    order.whatsappReceiptNotification = {
      lastNotificationKey: eventKey,
      lastSentAt: new Date().toISOString(),
      messageId: messageResponse?.messages?.[0]?.id || ""
    };
    delete order.whatsappReceiptNotificationError;
    return { sent: true, messageId: messageResponse?.messages?.[0]?.id || "" };
  } catch (error) {
    order.whatsappReceiptNotificationError = error.message;
    return { sent: false, skipped: false, error: error.message };
  }
}

function paymentTimerKey(mode, orderId, step) {
  return `${mode}:${orderId}:${step}`;
}

function clearPaymentReminderTimer(mode, orderId, step) {
  const key = paymentTimerKey(mode, orderId, step);
  const timer = pendingPaymentTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingPaymentTimers.delete(key);
  }
}

function clearPaymentReminderTimers(mode, orderId) {
  ["first", "second", "expire"].forEach((step) => clearPaymentReminderTimer(mode, orderId, step));
}

function paymentReminderFlowTimes(createdAt = new Date().toISOString()) {
  const created = Date.parse(createdAt) || Date.now();
  return {
    firstReminderAt: new Date(created + 5 * 60 * 1000).toISOString(),
    secondReminderAt: new Date(created + 10 * 60 * 1000).toISOString(),
    expireAt: new Date(created + 15 * 60 * 1000).toISOString()
  };
}

async function refreshUnpaidOrderFromXendit(order) {
  if (!order || order.status !== "awaiting_payment") {
    return order;
  }
  const previousStatus = order.status;
  const xenditStatus = await fetchXenditInvoiceStatus(order).catch(() => null);
  if (xenditStatus) {
    applyXenditInvoiceStatusToOrder(order, xenditStatus);
  }
  if (previousStatus !== order.status && order.status === "paid") {
    clearPaymentReminderTimers(order.mode || "live", order.id);
    await maybeSendWhatsappPaymentReceipt(order, `order:${order.id}:receipt`);
    await maybeSendWhatsappAdminAlert(order, `order:${order.id}:xendit:${order.status}`, humanizeOrderStatus(order));
  }
  return order;
}

async function processPaymentReminderStep(mode, orderId, step) {
  const order = findOrder(mode, orderId);
  if (!order || order.status !== "awaiting_payment") {
    return { handled: false, reason: "not_awaiting_payment" };
  }

  await refreshUnpaidOrderFromXendit(order);
  if (order.status !== "awaiting_payment") {
    saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
    return { handled: false, reason: `order_${order.status}` };
  }

  order.paymentReminderFlow = {
    ...paymentReminderFlowTimes(order.createdAt),
    ...(order.paymentReminderFlow || {})
  };

  const expireTime = Date.parse(order.paymentReminderFlow.expireAt || order.expiresAt || "");
  if ((step === "first" || step === "second") && expireTime && expireTime <= Date.now()) {
    return { handled: false, reason: "expired_due" };
  }

  if (step === "first" || step === "second") {
    const eventKey = `order:${order.id}:payment-reminder:${step}`;
    if (order.paymentReminderFlow[`${step}SentAt`]) {
      return { handled: false, reason: "already_sent" };
    }
    if (order.mode !== "test" && isWhatsappCloudReady() && process.env.WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME) {
      try {
        const response = await sendWhatsappPaymentReminder(order);
        order.paymentReminderFlow[`${step}SentAt`] = new Date().toISOString();
        order.paymentReminderFlow[`${step}MessageId`] = response?.messages?.[0]?.id || "";
        delete order.paymentReminderFlow[`${step}Error`];
      } catch (error) {
        order.paymentReminderFlow[`${step}Error`] = error.message;
      }
    } else {
      order.paymentReminderFlow[`${step}Skipped`] = order.mode === "test" ? "test_order" : "template_or_whatsapp_not_configured";
    }
    order.whatsappNotifications = {
      ...order.whatsappNotifications,
      lastNotificationKey: eventKey
    };
    saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
    return { handled: true, action: `${step}_reminder`, orderId };
  }

  order.status = "expired";
  order.payment.status = "expired";
  order.expiredAt = new Date().toISOString();
  order.whatsappUrl = buildWhatsappUrl(order);
  order.paymentReminderFlow.expiredAt = order.expiredAt;

  if (order.mode !== "test" && isWhatsappCloudReady() && process.env.WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME) {
    try {
      const response = await sendWhatsappPaymentExpired(order);
      order.paymentReminderFlow.expiredMessageSentAt = new Date().toISOString();
      order.paymentReminderFlow.expiredMessageId = response?.messages?.[0]?.id || "";
      delete order.paymentReminderFlow.expiredError;
    } catch (error) {
      order.paymentReminderFlow.expiredError = error.message;
    }
  } else {
    order.paymentReminderFlow.expiredSkipped = order.mode === "test" ? "test_order" : "template_or_whatsapp_not_configured";
  }

  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  return { handled: true, action: "expired", orderId };
}

function schedulePaymentReminderTimer(mode, orderId, step, executeAt) {
  clearPaymentReminderTimer(mode, orderId, step);
  const delay = Math.max(0, Date.parse(executeAt || "") - Date.now());
  const key = paymentTimerKey(mode, orderId, step);
  const timer = setTimeout(() => {
    pendingPaymentTimers.delete(key);
    processPaymentReminderStep(mode, orderId, step).catch((error) => {
      const order = findOrder(mode, orderId);
      if (order?.paymentReminderFlow) {
        order.paymentReminderFlow[`${step}Error`] = error.message;
        saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
      }
    });
  }, delay);
  pendingPaymentTimers.set(key, timer);
}

function schedulePaymentReminderFlow(mode, order) {
  if (!order || order.status !== "awaiting_payment" || order.pricing?.total <= 0) {
    return;
  }
  order.paymentReminderFlow = {
    ...paymentReminderFlowTimes(order.createdAt),
    ...(order.paymentReminderFlow || {})
  };
  const now = Date.now();
  const expireTime = Date.parse(order.paymentReminderFlow.expireAt || order.expiresAt || "");
  if (expireTime && expireTime <= now) {
    schedulePaymentReminderTimer(mode, order.id, "expire", order.paymentReminderFlow.expireAt || order.expiresAt);
    return;
  }
  if (!order.paymentReminderFlow.firstSentAt) {
    schedulePaymentReminderTimer(mode, order.id, "first", order.paymentReminderFlow.firstReminderAt);
  }
  if (!order.paymentReminderFlow.secondSentAt) {
    schedulePaymentReminderTimer(mode, order.id, "second", order.paymentReminderFlow.secondReminderAt);
  }
  if (!order.paymentReminderFlow.expiredAt) {
    schedulePaymentReminderTimer(mode, order.id, "expire", order.paymentReminderFlow.expireAt || order.expiresAt);
  }
}

async function sendWhatsappShippingUpdate(order, { admin = false } = {}) {
  const templateName = String(admin
    ? process.env.WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME || process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME || ""
    : process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME || ""
  ).trim();
  if (!templateName) {
    throw new Error(admin ? "WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME is not configured" : "WHATSAPP_SHIPPING_TEMPLATE_NAME is not configured");
  }
  const recipient = admin ? process.env.WHATSAPP_ADMIN_NUMBER : order.customer.phone;
  const documentUrl = whatsappDocumentAttachmentUrl(biteshipDocumentUrl(order));
  return sendWhatsappTemplateMessage(recipient, templateName, shippingWhatsappParameters(order), {
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
    headerDocumentUrl: documentUrl,
    headerDocumentFilename: `${order.id}-shipping.pdf`,
    urlButtonParameters: [
      {
        index: "0",
        text: publicDocumentButtonQuery(order)
      }
    ]
  });
}

async function maybeSendWhatsappShippingUpdate(order, eventKey = "", { admin = false } = {}) {
  const skipReason = (() => {
    if (order.mode === "test") return "test_order";
    if (!isWhatsappCloudReady()) return "whatsapp_not_configured";
    if (admin && !process.env.WHATSAPP_ADMIN_NUMBER) return "admin_number_not_configured";
    if (admin && !(process.env.WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME || process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME)) return "admin_shipping_template_not_configured";
    if (!admin && !process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME) return "shipping_template_not_configured";
    const bucket = admin ? order.adminWhatsappShippingNotification : order.whatsappShippingNotification;
    if (eventKey && bucket?.lastNotificationKey === eventKey) return "already_sent";
    return "";
  })();
  if (skipReason) {
    return { sent: false, skipped: true, reason: skipReason };
  }

  try {
    const messageResponse = await sendWhatsappShippingUpdate(order, { admin });
    const record = {
      lastNotificationKey: eventKey,
      lastSentAt: new Date().toISOString(),
      messageId: messageResponse?.messages?.[0]?.id || ""
    };
    if (admin) {
      order.adminWhatsappShippingNotification = record;
      delete order.adminWhatsappShippingNotificationError;
    } else {
      order.whatsappShippingNotification = record;
      delete order.whatsappShippingNotificationError;
    }
    return { sent: true, messageId: record.messageId };
  } catch (error) {
    if (admin) {
      order.adminWhatsappShippingNotificationError = error.message;
    } else {
      order.whatsappShippingNotificationError = error.message;
    }
    return { sent: false, skipped: false, error: error.message };
  }
}

async function maybeSendWhatsappAdminAlert(order, eventKey = "", eventLabel = "") {
  const skipReason = (() => {
    if (order.mode === "test") return "test_order";
    if (!isWhatsappCloudReady()) return "whatsapp_not_configured";
    if (!process.env.WHATSAPP_ADMIN_NUMBER) return "admin_number_not_configured";
    if (!process.env.WHATSAPP_ADMIN_TEMPLATE_NAME) return "admin_template_not_configured";
    if (eventKey && order.adminWhatsappNotifications?.lastNotificationKey === eventKey) return "already_sent";
    return "";
  })();
  if (skipReason) {
    return { sent: false, skipped: true, reason: skipReason };
  }

  try {
    const messageResponse = await sendWhatsappAdminAlert(order, eventLabel);
    order.adminWhatsappNotifications = {
      ...order.adminWhatsappNotifications,
      lastNotificationKey: eventKey,
      lastSentAt: new Date().toISOString(),
      messageId: messageResponse?.messages?.[0]?.id || order.adminWhatsappNotifications?.messageId || ""
    };
    delete order.adminWhatsappNotificationError;
    return { sent: true, messageId: messageResponse?.messages?.[0]?.id || "" };
  } catch (error) {
    order.adminWhatsappNotificationError = error.message;
    return { sent: false, skipped: false, error: error.message };
  }
}

async function maybeSendWhatsappOrderStatus(order, previousStatus = "", options = {}) {
  const notificationKey = String(options.notificationKey || "").trim();
  const skipReason = (() => {
    if (order.mode === "test") return "test_order";
    if (!isWhatsappCloudReady()) return "whatsapp_not_configured";
    if (!configuredWhatsappOrderTemplateName(order)) return "template_not_configured";
    if (previousStatus === order.status && !notificationKey) return "same_order_status";
    if (notificationKey && order.whatsappNotifications?.lastNotificationKey === notificationKey) return "same_biteship_status";
    if (!notificationKey && order.whatsappNotifications?.lastStatusSent === order.status) return "already_sent_status";
    return "";
  })();
  if (skipReason) {
    return { sent: false, skipped: true, reason: skipReason };
  }

  try {
    const messageResponse = await sendWhatsappOrderUpdate(order);
    order.whatsappNotifications = {
      ...order.whatsappNotifications,
      lastStatusSent: order.status,
      ...(notificationKey ? { lastNotificationKey: notificationKey } : {}),
      lastSentAt: new Date().toISOString(),
      messageId: messageResponse?.messages?.[0]?.id || order.whatsappNotifications?.messageId || ""
    };
    delete order.whatsappNotificationError;
    return {
      sent: true,
      messageId: messageResponse?.messages?.[0]?.id || ""
    };
  } catch (error) {
    order.whatsappNotificationError = error.message;
    return { sent: false, skipped: false, error: error.message };
  }
}

function verifyMetaWebhookSignature(request, rawBody) {
  const appSecret = String(process.env.WHATSAPP_APP_SECRET || "").trim();
  if (!appSecret) {
    return true;
  }

  const signatureHeader = String(request.headers["x-hub-signature-256"] || "");
  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;

  return timingSafeEqualString(signatureHeader, expectedSignature);
}

function incomingWhatsappMessages(payload) {
  const valueEntries = Array.isArray(payload?.entry)
    ? payload.entry.flatMap((entry) => Array.isArray(entry.changes) ? entry.changes : [])
    : [];
  return valueEntries.flatMap((change) => Array.isArray(change?.value?.messages) ? change.value.messages : []);
}

function isConfiguredAdminWhatsapp(from = "") {
  const adminNumber = formatIndonesianPhone(process.env.WHATSAPP_ADMIN_NUMBER || "");
  const sender = formatIndonesianPhone(from);
  return Boolean(adminNumber && sender && adminNumber === sender);
}

function parseAdminApproveCommand(text = "") {
  const normalized = String(text || "").trim().toUpperCase();
  const match = normalized.match(/^(APPROVE|READY|KIRIM|SEND)(?:\s+([A-Z]+-\d+))?$/);
  return match ? { action: match[1], orderId: match[2] || "" } : null;
}

function parseAdminCancelCommand(text = "") {
  const normalized = String(text || "").trim().toUpperCase();
  const match = normalized.match(/^(CANCEL|REFUND|EMPTY|NO STOCK|OUT OF STOCK)(?:\s+([A-Z]+-\d+))?$/);
  return match ? { action: match[1], orderId: match[2] || "" } : null;
}

function parseAdminUndoCommand(text = "") {
  const normalized = String(text || "").trim().toUpperCase();
  const match = normalized.match(/^UNDO(?:\s+([A-Z]+-\d+))?(?:\s+([A-F0-9]+))?$/);
  return match ? { action: "UNDO", orderId: match[1] || "", token: match[2] || "" } : null;
}

function latestOrderTimestamp(order = {}) {
  return Date.parse(order.paidAt || order.createdAt || "") || 0;
}

function resolveAdminCommandOrderId(command = {}, candidateStatuses = []) {
  if (!command) {
    return "";
  }
  if (command.orderId) {
    return command.orderId;
  }
  const candidates = stores.live.orders
    .filter((order) => candidateStatuses.includes(order.status))
    .filter((order) => !order.fulfillment?.shipment?.orderId)
    .sort((a, b) => latestOrderTimestamp(b) - latestOrderTimestamp(a));

  if (candidates.length === 1) {
    return candidates[0].id;
  }
  if (!candidates.length) {
    throw new Error(`No order is waiting for ${command.action}. Use ${command.action} BAK-0001 if needed.`);
  }
  throw new Error(`More than one order is waiting. Reply ${command.action} BAK-0001 with the order number.`);
}

function resolvePendingAdminActionOrderId(command = {}) {
  if (command.orderId) {
    return command.orderId;
  }
  const candidates = stores.live.orders.filter((order) => order.adminPendingAction?.token);
  if (candidates.length === 1) {
    return candidates[0].id;
  }
  if (!candidates.length) {
    throw new Error("No admin action is waiting to undo.");
  }
  throw new Error("More than one action is waiting. Reply UNDO BAK-0001 with the order number.");
}

function adminActionTimerKey(mode, orderId, token) {
  return `${mode}:${orderId}:${token}`;
}

function clearAdminActionTimer(mode, orderId, token) {
  const key = adminActionTimerKey(mode, orderId, token);
  const timer = pendingAdminActionTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingAdminActionTimers.delete(key);
  }
}

async function sendAdminActionUndoPrompt(order, action) {
  const adminNumber = String(process.env.WHATSAPP_ADMIN_NUMBER || "").trim();
  const pending = order.adminPendingAction || {};
  if (!adminNumber || !pending.token) {
    return { sent: false, skipped: true, reason: "admin_pending_action_missing" };
  }

  const actionLabel = action === "cancel" ? "Cancel" : "Approve";
  const resultText = action === "cancel"
    ? "cancel the order and start the refund flow"
    : "request the Biteship delivery";
  return sendWhatsappInteractiveButtons(
    adminNumber,
    `${actionLabel} selected for ${order.id}. The app will ${resultText} in 60 seconds. Tap Undo if this was a mistake.`,
    [
      {
        id: `UNDO ${order.id} ${pending.token}`,
        title: "Undo"
      }
    ]
  );
}

async function cancelPaidOrderFromAdmin(mode, orderId, reason = "Cancelled by admin") {
  const order = findOrder(mode, orderId);
  if (!order) {
    throw new Error("Order not found");
  }
  if (!["paid", "preparing"].includes(order.status)) {
    throw new Error("Only paid or preparing orders can be cancelled from WhatsApp");
  }
  if (order.fulfillment?.shipment?.orderId) {
    throw new Error("Delivery already requested. Cancel the shipment in Biteship before refunding.");
  }

  const previousStatus = order.status;
  clearPaymentReminderTimers(mode, order.id);
  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  order.cancelReason = reason;
  order.whatsappUrl = buildWhatsappUrl(order);
  await attemptXenditRefund(order, reason);
  await maybeSendWhatsappOrderStatus(order, previousStatus, { notificationKey: `order:${order.id}:cancelled` });
  await maybeSendWhatsappAdminAlert(order, `order:${order.id}:cancelled`, `Order cancelled - ${order.refund?.status || "refund pending"}`);
  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  return enrichOrder(order);
}

async function finalizePendingAdminOrderAction(mode, orderId, token) {
  const order = findOrder(mode, orderId);
  const pending = order?.adminPendingAction;
  if (!order || !pending || pending.token !== token) {
    return { handled: false, reason: "pending_action_missing" };
  }
  if (Date.parse(pending.executeAt || "") > Date.now()) {
    scheduleAdminActionTimer(mode, orderId, token);
    return { handled: false, reason: "pending_action_not_due" };
  }

  const action = pending.action;
  delete order.adminPendingAction;
  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);

  if (action === "cancel") {
    const cancelledOrder = await cancelPaidOrderFromAdmin(mode, orderId, "Cancelled from WhatsApp by admin");
    return { handled: true, action, orderId: cancelledOrder.id };
  }

  const approvedOrder = await approveOrderForDelivery(mode, orderId, { role: "whatsapp_admin" });
  return { handled: true, action: "approve", orderId: approvedOrder.id };
}

function scheduleAdminActionTimer(mode, orderId, token) {
  const order = findOrder(mode, orderId);
  const pending = order?.adminPendingAction;
  if (!pending || pending.token !== token) {
    return;
  }

  clearAdminActionTimer(mode, orderId, token);
  const delay = Math.max(0, Date.parse(pending.executeAt || "") - Date.now());
  const key = adminActionTimerKey(mode, orderId, token);
  const timer = setTimeout(() => {
    pendingAdminActionTimers.delete(key);
    finalizePendingAdminOrderAction(mode, orderId, token).catch((error) => {
      const currentOrder = findOrder(mode, orderId);
      if (currentOrder?.adminPendingAction?.token === token) {
        currentOrder.adminPendingAction.error = error.message;
        currentOrder.adminPendingAction.failedAt = new Date().toISOString();
        saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
      }
    });
  }, delay);
  pendingAdminActionTimers.set(key, timer);
}

async function scheduleAdminOrderAction(mode, orderId, action) {
  const order = findOrder(mode, orderId);
  if (!order) {
    throw new Error("Order not found");
  }
  if (action === "approve") {
    if (order.status !== "paid") {
      throw new Error("Only paid orders can be approved for delivery");
    }
    if (order.fulfillment?.type !== "delivery") {
      throw new Error("Only delivery orders can be approved for Biteship");
    }
  }
  if (action === "cancel") {
    if (!["paid", "preparing"].includes(order.status)) {
      throw new Error("Only paid or preparing orders can be cancelled from WhatsApp");
    }
    if (order.fulfillment?.shipment?.orderId) {
      throw new Error("Delivery already requested. Cancel the shipment in Biteship before refunding.");
    }
  }

  if (order.adminPendingAction?.token) {
    clearAdminActionTimer(mode, orderId, order.adminPendingAction.token);
  }

  const token = crypto.randomBytes(4).toString("hex").toUpperCase();
  order.adminPendingAction = {
    action,
    token,
    requestedAt: new Date().toISOString(),
    executeAt: new Date(Date.now() + 60 * 1000).toISOString(),
    requestedBy: "whatsapp_admin"
  };
  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  scheduleAdminActionTimer(mode, orderId, token);

  try {
    await sendAdminActionUndoPrompt(order, action);
    delete order.adminPendingAction.notificationError;
  } catch (error) {
    order.adminPendingAction.notificationError = error.message;
    saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  }

  return enrichOrder(order);
}

async function undoPendingAdminOrderAction(mode, command = {}) {
  const orderId = resolvePendingAdminActionOrderId(command);
  const order = findOrder(mode, orderId);
  const pending = order?.adminPendingAction;
  if (!order || !pending) {
    throw new Error("No admin action is waiting to undo.");
  }
  if (command.token && pending.token !== command.token) {
    throw new Error("This undo button is no longer valid.");
  }
  if (Date.parse(pending.executeAt || "") <= Date.now()) {
    throw new Error("Undo window has already expired.");
  }

  clearAdminActionTimer(mode, order.id, pending.token);
  const undoneAction = pending.action;
  delete order.adminPendingAction;
  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);

  try {
    await sendWhatsappInteractiveButtons(
      process.env.WHATSAPP_ADMIN_NUMBER,
      `Undo confirmed for ${order.id}. The ${undoneAction} action was cancelled.`,
      [{ id: `APPROVE ${order.id}`, title: "Approve" }]
    );
  } catch (_error) {
    // The undo itself is already saved; this confirmation is best-effort.
  }

  return enrichOrder(order);
}

function scheduleExistingPendingAdminActions() {
  Object.entries(stores).forEach(([mode, storeState]) => {
    storeState.orders.forEach((order) => {
      const pending = order.adminPendingAction;
      if (pending?.token) {
        scheduleAdminActionTimer(mode, order.id, pending.token);
      }
    });
  });
}

function scheduleExistingPaymentReminderFlows() {
  Object.entries(stores).forEach(([mode, storeState]) => {
    storeState.orders.forEach((order) => schedulePaymentReminderFlow(mode, order));
  });
}

async function processWhatsappAdminCommand(message = {}) {
  if (!isConfiguredAdminWhatsapp(message.from)) {
    return { handled: false, reason: "not_admin" };
  }
  const text =
    message.text?.body ||
    message.button?.payload ||
    message.button?.text ||
    message.interactive?.button_reply?.id ||
    message.interactive?.button_reply?.title ||
    "";
  const undoCommand = parseAdminUndoCommand(text);
  if (undoCommand) {
    const order = await undoPendingAdminOrderAction("live", undoCommand);
    return { handled: true, action: "undo", orderId: order.id };
  }
  const cancelCommand = parseAdminCancelCommand(text);
  if (cancelCommand) {
    const cancelOrderId = resolveAdminCommandOrderId(cancelCommand, ["paid", "preparing"]);
    const order = await scheduleAdminOrderAction("live", cancelOrderId, "cancel");
    return { handled: true, action: "cancel_scheduled", orderId: order.id };
  }
  const approveCommand = parseAdminApproveCommand(text);
  if (!approveCommand) {
    return { handled: false, reason: "not_approve_command" };
  }
  const orderId = resolveAdminCommandOrderId(approveCommand, ["paid"]);
  const order = await scheduleAdminOrderAction("live", orderId, "approve");
  return { handled: true, action: "approve_scheduled", orderId: order.id };
}

async function processWhatsappWebhook(payload) {
  const valueEntries = Array.isArray(payload?.entry)
    ? payload.entry.flatMap((entry) => Array.isArray(entry.changes) ? entry.changes : [])
    : [];
  const statuses = valueEntries.flatMap((change) => Array.isArray(change?.value?.statuses) ? change.value.statuses : []);
  const messages = incomingWhatsappMessages(payload);

  if (statuses.length) {
    stores.live.orders.forEach((order) => {
      if (!order.whatsappNotifications?.messageId) {
        return;
      }
      const status = statuses.find((entry) => entry.id === order.whatsappNotifications.messageId);
      if (!status) {
        return;
      }
      order.whatsappNotifications.lastDeliveryStatus = status.status || "";
      order.whatsappNotifications.lastDeliveryAt = status.timestamp
        ? new Date(Number(status.timestamp) * 1000).toISOString()
        : new Date().toISOString();
    });
    saveOrders(ordersLivePath, stores.live.orders);
  }

  for (const message of messages) {
    try {
      await processWhatsappAdminCommand(message);
    } catch (error) {
      console.warn("Unable to process WhatsApp admin command:", error.message);
    }
  }
}

function isPlaceholderValue(value = "") {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase();
  return !normalized
    || normalized.startsWith("your_")
    || normalized === "order_status_update"
    || /^[•*]+$/.test(raw);
}

function configuredValue(...values) {
  return values.find((value) => !isPlaceholderValue(value)) || "";
}

function readIntegrationSettings() {
  const envMap = loadEnvMap(envPath);
  const savedSettings = readJsonFileSafely(integrationsPath, {});
  const config = getEnvironmentIntegrationConfig();
  const settings = {
    googleMapsApiKey: configuredValue(savedSettings.googleMapsApiKey, envMap.GOOGLE_MAPS_API_KEY, config.googleMapsApiKey),
    biteshipApiKey: configuredValue(savedSettings.biteshipApiKey, envMap.BITESHIP_API_KEY, config.biteshipApiKey),
    biteshipCouriers: configuredValue(savedSettings.biteshipCouriers, envMap.BITESHIP_COURIERS, config.biteshipCouriers) || "gojek,grab",
    xenditSecretKey: configuredValue(savedSettings.xenditSecretKey, envMap.XENDIT_SECRET_KEY, config.xenditSecretKey),
    xenditCallbackToken: configuredValue(savedSettings.xenditCallbackToken, envMap.XENDIT_CALLBACK_TOKEN, config.xenditCallbackToken),
    xenditEnvironment: configuredValue(savedSettings.xenditEnvironment, envMap.XENDIT_ENVIRONMENT, config.xenditEnvironment) || "test",
    whatsappAccessToken: configuredValue(savedSettings.whatsappAccessToken, envMap.WHATSAPP_ACCESS_TOKEN, config.whatsappAccessToken),
    whatsappPhoneNumberId: configuredValue(savedSettings.whatsappPhoneNumberId, envMap.WHATSAPP_PHONE_NUMBER_ID, config.whatsappPhoneNumberId),
    whatsappBusinessAccountId: configuredValue(savedSettings.whatsappBusinessAccountId, envMap.WHATSAPP_BUSINESS_ACCOUNT_ID, config.whatsappBusinessAccountId),
    whatsappVerifyToken: configuredValue(savedSettings.whatsappVerifyToken, envMap.WHATSAPP_VERIFY_TOKEN, config.whatsappVerifyToken),
    whatsappAppId: configuredValue(savedSettings.whatsappAppId, envMap.WHATSAPP_APP_ID, config.whatsappAppId),
    whatsappAppSecret: configuredValue(savedSettings.whatsappAppSecret, envMap.WHATSAPP_APP_SECRET, config.whatsappAppSecret),
    whatsappGraphVersion: configuredValue(savedSettings.whatsappGraphVersion, envMap.WHATSAPP_GRAPH_VERSION, config.whatsappGraphVersion) || "v22.0",
    whatsappOtpTemplateName: configuredValue(savedSettings.whatsappOtpTemplateName, envMap.WHATSAPP_OTP_TEMPLATE_NAME, config.whatsappOtpTemplateName),
    whatsappOrderTemplateName: configuredValue(savedSettings.whatsappOrderTemplateName, envMap.WHATSAPP_ORDER_TEMPLATE_NAME, config.whatsappOrderTemplateName),
    whatsappReceiptTemplateName: configuredValue(savedSettings.whatsappReceiptTemplateName, envMap.WHATSAPP_RECEIPT_TEMPLATE_NAME, config.whatsappReceiptTemplateName),
    whatsappPaymentReminderTemplateName: configuredValue(savedSettings.whatsappPaymentReminderTemplateName, envMap.WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME, config.whatsappPaymentReminderTemplateName),
    whatsappPaymentExpiredTemplateName: configuredValue(savedSettings.whatsappPaymentExpiredTemplateName, envMap.WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME, config.whatsappPaymentExpiredTemplateName),
    whatsappShippingTemplateName: configuredValue(savedSettings.whatsappShippingTemplateName, envMap.WHATSAPP_SHIPPING_TEMPLATE_NAME, config.whatsappShippingTemplateName),
    whatsappAdminNumber: configuredValue(savedSettings.whatsappAdminNumber, envMap.WHATSAPP_ADMIN_NUMBER, config.whatsappAdminNumber),
    whatsappAdminTemplateName: configuredValue(savedSettings.whatsappAdminTemplateName, envMap.WHATSAPP_ADMIN_TEMPLATE_NAME, config.whatsappAdminTemplateName),
    whatsappAdminShippingTemplateName: configuredValue(savedSettings.whatsappAdminShippingTemplateName, envMap.WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME, config.whatsappAdminShippingTemplateName),
    whatsappTemplateLanguage: configuredValue(savedSettings.whatsappTemplateLanguage, envMap.WHATSAPP_TEMPLATE_LANGUAGE, config.whatsappTemplateLanguage) || "en"
  };
  settings.xenditEnvironment = settings.xenditEnvironment === "live" ? "live" : "test";
  return settings;
}

function saveIntegrationSettings(input = {}) {
  const existingEnvMap = loadEnvMap(envPath);
  const existingSettings = readIntegrationSettings();
  const secretValue = (key) => {
    const value = String(input[key] || "").trim();
    return isPlaceholderValue(value) ? existingSettings[key] || "" : value;
  };
  const nextSettings = {
    googleMapsApiKey: secretValue("googleMapsApiKey"),
    biteshipApiKey: secretValue("biteshipApiKey"),
    biteshipCouriers: String(input.biteshipCouriers || "gojek,grab")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
      .join(",") || "gojek,grab",
    xenditSecretKey: secretValue("xenditSecretKey"),
    xenditCallbackToken: secretValue("xenditCallbackToken"),
    xenditEnvironment: String(input.xenditEnvironment || "test") === "live"
      ? "live"
      : "test",
    whatsappAccessToken: secretValue("whatsappAccessToken"),
    whatsappPhoneNumberId: String(input.whatsappPhoneNumberId || "").trim(),
    whatsappBusinessAccountId: String(input.whatsappBusinessAccountId || "").trim(),
    whatsappVerifyToken: secretValue("whatsappVerifyToken"),
    whatsappAppId: String(input.whatsappAppId || "").trim(),
    whatsappAppSecret: secretValue("whatsappAppSecret"),
    whatsappGraphVersion: String(input.whatsappGraphVersion || "v22.0").trim() || "v22.0",
    whatsappOtpTemplateName: String(input.whatsappOtpTemplateName || "").trim(),
    whatsappOrderTemplateName: String(input.whatsappOrderTemplateName || "").trim() === "order_status_update"
      ? "order_received"
      : String(input.whatsappOrderTemplateName || "").trim(),
    whatsappReceiptTemplateName: String(input.whatsappReceiptTemplateName || "").trim(),
    whatsappPaymentReminderTemplateName: String(input.whatsappPaymentReminderTemplateName || "").trim(),
    whatsappPaymentExpiredTemplateName: String(input.whatsappPaymentExpiredTemplateName || "").trim(),
    whatsappShippingTemplateName: String(input.whatsappShippingTemplateName || "").trim(),
    whatsappAdminNumber: String(input.whatsappAdminNumber || "").trim(),
    whatsappAdminTemplateName: String(input.whatsappAdminTemplateName || "").trim(),
    whatsappAdminShippingTemplateName: String(input.whatsappAdminShippingTemplateName || "").trim(),
    whatsappTemplateLanguage: String(input.whatsappTemplateLanguage || "en").trim() || "en"
  };

  writeJsonFile(integrationsPath, nextSettings);
  try {
    writeEnvMap(envPath, {
      ...existingEnvMap,
      GOOGLE_MAPS_API_KEY: nextSettings.googleMapsApiKey,
      BITESHIP_API_KEY: nextSettings.biteshipApiKey,
      BITESHIP_COURIERS: nextSettings.biteshipCouriers,
      XENDIT_SECRET_KEY: nextSettings.xenditSecretKey,
      XENDIT_CALLBACK_TOKEN: nextSettings.xenditCallbackToken,
      XENDIT_ENVIRONMENT: nextSettings.xenditEnvironment,
      WHATSAPP_ACCESS_TOKEN: nextSettings.whatsappAccessToken,
      WHATSAPP_PHONE_NUMBER_ID: nextSettings.whatsappPhoneNumberId,
      WHATSAPP_BUSINESS_ACCOUNT_ID: nextSettings.whatsappBusinessAccountId,
      WHATSAPP_VERIFY_TOKEN: nextSettings.whatsappVerifyToken,
      WHATSAPP_APP_ID: nextSettings.whatsappAppId,
      WHATSAPP_APP_SECRET: nextSettings.whatsappAppSecret,
      WHATSAPP_GRAPH_VERSION: nextSettings.whatsappGraphVersion,
      WHATSAPP_OTP_TEMPLATE_NAME: nextSettings.whatsappOtpTemplateName,
      WHATSAPP_ORDER_TEMPLATE_NAME: nextSettings.whatsappOrderTemplateName,
      WHATSAPP_RECEIPT_TEMPLATE_NAME: nextSettings.whatsappReceiptTemplateName,
      WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME: nextSettings.whatsappPaymentReminderTemplateName,
      WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME: nextSettings.whatsappPaymentExpiredTemplateName,
      WHATSAPP_SHIPPING_TEMPLATE_NAME: nextSettings.whatsappShippingTemplateName,
      WHATSAPP_ADMIN_NUMBER: nextSettings.whatsappAdminNumber,
      WHATSAPP_ADMIN_TEMPLATE_NAME: nextSettings.whatsappAdminTemplateName,
      WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME: nextSettings.whatsappAdminShippingTemplateName,
      WHATSAPP_TEMPLATE_LANGUAGE: nextSettings.whatsappTemplateLanguage
    });
  } catch (error) {
    console.warn(`Unable to mirror integrations to ${envPath}: ${error.message}`);
  }

  process.env.GOOGLE_MAPS_API_KEY = nextSettings.googleMapsApiKey;
  process.env.BITESHIP_API_KEY = nextSettings.biteshipApiKey;
  process.env.BITESHIP_COURIERS = nextSettings.biteshipCouriers;
  process.env.XENDIT_SECRET_KEY = nextSettings.xenditSecretKey;
  process.env.XENDIT_CALLBACK_TOKEN = nextSettings.xenditCallbackToken;
  process.env.XENDIT_ENVIRONMENT = nextSettings.xenditEnvironment;
  process.env.WHATSAPP_ACCESS_TOKEN = nextSettings.whatsappAccessToken;
  process.env.WHATSAPP_PHONE_NUMBER_ID = nextSettings.whatsappPhoneNumberId;
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = nextSettings.whatsappBusinessAccountId;
  process.env.WHATSAPP_VERIFY_TOKEN = nextSettings.whatsappVerifyToken;
  process.env.WHATSAPP_APP_ID = nextSettings.whatsappAppId;
  process.env.WHATSAPP_APP_SECRET = nextSettings.whatsappAppSecret;
  process.env.WHATSAPP_GRAPH_VERSION = nextSettings.whatsappGraphVersion;
  process.env.WHATSAPP_OTP_TEMPLATE_NAME = nextSettings.whatsappOtpTemplateName;
  process.env.WHATSAPP_ORDER_TEMPLATE_NAME = nextSettings.whatsappOrderTemplateName;
  process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME = nextSettings.whatsappReceiptTemplateName;
  process.env.WHATSAPP_PAYMENT_REMINDER_TEMPLATE_NAME = nextSettings.whatsappPaymentReminderTemplateName;
  process.env.WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME = nextSettings.whatsappPaymentExpiredTemplateName;
  process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME = nextSettings.whatsappShippingTemplateName;
  process.env.WHATSAPP_ADMIN_NUMBER = nextSettings.whatsappAdminNumber;
  process.env.WHATSAPP_ADMIN_TEMPLATE_NAME = nextSettings.whatsappAdminTemplateName;
  process.env.WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME = nextSettings.whatsappAdminShippingTemplateName;
  process.env.WHATSAPP_TEMPLATE_LANGUAGE = nextSettings.whatsappTemplateLanguage;

  return nextSettings;
}

let catalog = loadCatalog();

function loadCustomers() {
  if (!fs.existsSync(customersPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(customersPath, "utf8"));
  } catch (_error) {
    return {};
  }
}

function saveCustomers(customers) {
  ensureParentDir(customersPath);
  fs.writeFileSync(customersPath, `${JSON.stringify(customers, null, 2)}\n`, "utf8");
}

let customers = loadCustomers();

function loadOrders(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveOrders(targetPath, orders) {
  ensureParentDir(targetPath);
  fs.writeFileSync(targetPath, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

function loadJsonArray(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function recordBiteshipWebhookLog(entry) {
  const log = loadJsonArray(biteshipWebhookLogPath);
  log.unshift({
    receivedAt: new Date().toISOString(),
    ...entry
  });
  ensureParentDir(biteshipWebhookLogPath);
  fs.writeFileSync(biteshipWebhookLogPath, `${JSON.stringify(log.slice(0, 50), null, 2)}\n`, "utf8");
}

function ordersPathForMode(mode) {
  return mode === "test" ? ordersTestPath : ordersLivePath;
}

const stores = {
  live: {
    cart: new Map(),
    carts: new Map(),
    orders: loadOrders(ordersLivePath),
    registrations: new Map()
  },
  test: {
    cart: new Map(),
    carts: new Map(),
    orders: loadOrders(ordersTestPath),
    registrations: new Map()
  }
};
const pendingAdminActionTimers = new Map();
const pendingPaymentTimers = new Map();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

const CUSTOMER_SESSION_COOKIE = "bakeaholic_customer_session";
const ADMIN_SESSION_COOKIE = "bakeaholic_admin_session";
const CART_SESSION_COOKIE = "bakeaholic_cart_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ADMIN_SESSION_TTL_SECONDS = 60 * 15;
const SESSION_SECRET = process.env.SESSION_SECRET
  || process.env.WHATSAPP_APP_SECRET
  || process.env.XENDIT_SECRET_KEY
  || crypto.randomBytes(32).toString("hex");
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
const rateLimitBuckets = new Map();

function defaultSecurityHeaders() {
  return {
    "Cache-Control": "no-store",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)"
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...defaultSecurityHeaders()
  });
  response.end(JSON.stringify(payload));
}

function sendPlainOk(response) {
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    ...defaultSecurityHeaders()
  });
  response.end("ok");
}

function sendBareOk(response) {
  response.writeHead(200, {
    "Content-Type": "text/plain"
  });
  response.end("ok");
}

function sendBareUpperOk(response) {
  response.writeHead(200, {
    "Content-Type": "text/plain"
  });
  response.end("OK");
}

function sendBareJsonOk(response) {
  response.writeHead(200, {
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify({ ok: true }));
}

function sendBareNoContent(response) {
  response.writeHead(204, {
    "Content-Type": "text/plain"
  });
  response.end();
}

function sendFile(response, targetPath) {
  const ext = path.extname(targetPath).toLowerCase();
  const contentType = contentTypes[ext] || "application/octet-stream";
  fs.readFile(targetPath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: "File not found" });
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      ...defaultSecurityHeaders()
    });
    response.end(content);
  });
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function tokenDebug(value = "") {
  const token = String(value || "").trim();
  return {
    present: Boolean(token),
    length: token.length,
    prefix: token ? `${token.slice(0, 6)}...` : "",
    suffix: token ? `...${token.slice(-6)}` : ""
  };
}

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signValue(value) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createSignedSession(payload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseSignedSession(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) {
    return null;
  }
  if (!timingSafeEqualString(signValue(encodedPayload), signature)) {
    return null;
  }
  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));
    if (!payload?.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch (_error) {
    return null;
  }
}

function parseCookies(request) {
  const cookieHeader = String(request.headers.cookie || "");
  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex <= 0) {
        return cookies;
      }
      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || "/"}`);
  parts.push(`SameSite=${options.sameSite || "Lax"}`);
  if (options.maxAge != null) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }
  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }
  if (options.secure !== false) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function appendSetCookie(response, cookieValue) {
  const existing = response.getHeader("Set-Cookie");
  if (!existing) {
    response.setHeader("Set-Cookie", cookieValue);
    return;
  }
  const next = Array.isArray(existing) ? existing.concat(cookieValue) : [existing, cookieValue];
  response.setHeader("Set-Cookie", next);
}

function isSecureRequest(request) {
  return String(request.headers["x-forwarded-proto"] || "").toLowerCase() === "https";
}

function setSignedSessionCookie(response, request, cookieName, payload, maxAgeSeconds) {
  const token = createSignedSession({
    ...payload,
    exp: Date.now() + maxAgeSeconds * 1000
  });
  appendSetCookie(response, serializeCookie(cookieName, token, {
    maxAge: maxAgeSeconds,
    secure: isSecureRequest(request)
  }));
}

function clearSessionCookie(response, request, cookieName) {
  appendSetCookie(response, serializeCookie(cookieName, "", {
    maxAge: 0,
    secure: isSecureRequest(request)
  }));
}

function ensureCartSession(request, response) {
  const cookies = parseCookies(request);
  const existingId = String(cookies[CART_SESSION_COOKIE] || "");
  const sessionId = /^[a-f0-9]{32}$/i.test(existingId)
    ? existingId.toLowerCase()
    : crypto.randomBytes(16).toString("hex");

  appendSetCookie(response, serializeCookie(CART_SESSION_COOKIE, sessionId, {
    maxAge: SESSION_TTL_SECONDS,
    secure: isSecureRequest(request),
    httpOnly: false
  }));
  return sessionId;
}

function getSessionCartState(mode, request, response) {
  const storeState = getStoreState(mode);
  const sessionId = ensureCartSession(request, response);
  if (!storeState.carts.has(sessionId)) {
    storeState.carts.set(sessionId, new Map());
  }
  return {
    storeState,
    cartState: {
      ...storeState,
      cart: storeState.carts.get(sessionId)
    }
  };
}

function currentCustomerSession(request) {
  const cookies = parseCookies(request);
  const payload = parseSignedSession(cookies[CUSTOMER_SESSION_COOKIE]);
  if (!payload || payload.role !== "customer" || !payload.phone) {
    return null;
  }
  return payload;
}

function currentAdminSession(request) {
  const cookies = parseCookies(request);
  const payload = parseSignedSession(cookies[ADMIN_SESSION_COOKIE]);
  if (!payload || payload.role !== "admin") {
    return null;
  }
  return payload;
}

function requireCustomerSession(request, response) {
  const session = currentCustomerSession(request);
  if (!session) {
    sendJson(response, 401, { error: "Please log in again to continue" });
    return null;
  }
  return session;
}

function requireAdminSession(request, response) {
  if (!ADMIN_PASSWORD) {
    sendJson(response, 503, { error: "Admin access is disabled until ADMIN_PASSWORD is configured" });
    return null;
  }
  const session = currentAdminSession(request);
  if (!session) {
    sendJson(response, 401, { error: "Admin login required" });
    return null;
  }
  return session;
}

function requestIpAddress(request) {
  const forwarded = String(request.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || request.socket.remoteAddress || "unknown";
}

function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || [];
  const freshEvents = bucket.filter((entry) => now - entry < windowMs);
  freshEvents.push(now);
  rateLimitBuckets.set(key, freshEvents);
  return freshEvents.length <= limit;
}

function enforceSameOrigin(request, response) {
  const origin = String(request.headers.origin || "");
  if (!origin) {
    return true;
  }
  const expectedOrigin = `${isSecureRequest(request) ? "https" : "http"}://${request.headers.host}`;
  if (origin !== expectedOrigin) {
    sendJson(response, 403, { error: "Blocked cross-origin request" });
    return false;
  }
  return true;
}

function parseBody(request) {
  return parseRawBody(request).then((raw) => {
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch (_error) {
      throw new Error("Invalid JSON body");
    }
  });
}

function parseRawBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      resolve(raw);
    });
    request.on("error", reject);
  });
}

function getAppMode(requestUrl, request) {
  const headerMode = String(request.headers["x-app-mode"] || "").toLowerCase();
  const queryMode = String(requestUrl.searchParams.get("mode") || "").toLowerCase();
  return headerMode === "test" || queryMode === "test" ? "test" : "live";
}

function getStoreState(mode) {
  return stores[mode] || stores.live;
}

function getStoreConfig() {
  const integrationConfig = getIntegrationConfig();
  const businessHours = {
    enabled: catalog.store.businessHoursEnabled !== false,
    timezone: String(catalog.store.businessHoursTimezone || "Asia/Makassar"),
    open: String(catalog.store.businessHoursOpen || "09:00"),
    close: String(catalog.store.businessHoursClose || "17:00"),
    days: Array.isArray(catalog.store.businessHoursDays) && catalog.store.businessHoursDays.length
      ? catalog.store.businessHoursDays
      : [1, 2, 3, 4, 5, 6, 0]
  };
  return {
    ...catalog.store,
    deliveryFee: Number(catalog.store.deliveryFee || 21000),
    taxRate: Number(catalog.store.taxRate || 0.1),
    kitchenLat: Number(catalog.store.kitchenLat || -8.637741),
    kitchenLng: Number(catalog.store.kitchenLng || 115.184925),
    kitchenAddress: String(
      catalog.store.kitchenAddress || "85PG+7H Padangsambian Klod, Denpasar City, Bali"
    ),
    addressLabel: String(catalog.store.addressLabel || "Set your delivery address"),
    defaultAddress: String(
      catalog.store.defaultAddress ||
        "85RG+78P, Jl. Gunung Salak Utara, Padangsambian Klod, Kec. Kuta Utara, Kota Denpasar, Bali, Indonesia"
    ),
    pickupAddress: String(
      catalog.store.pickupAddress || "Bakeaholic Bali Kitchen, Denpasar, Bali"
    ),
    pickupDescription: String(
      catalog.store.pickupDescription || "Pickup orders are packed fresh from the Bali kitchen."
    ),
    whatsappPrompt: String(
      catalog.store.whatsappPrompt || "Enter your WhatsApp number to continue ordering."
    ),
    businessHours,
    isOpenNow: isStoreOpenNow(businessHours),
    integrations: {
      googleMapsApiKey: integrationConfig.googleMapsApiKey,
      biteshipEnabled: Boolean(integrationConfig.biteshipApiKey),
      biteshipCouriers: integrationConfig.biteshipCouriers,
      liveQuoteProvider: integrationConfig.biteshipApiKey ? "Biteship Rates API" : "",
      xenditEnabled: Boolean(integrationConfig.xenditSecretKey),
      xenditEnvironment: integrationConfig.xenditEnvironment
    }
  };
}

function baliDateParts(date = new Date(), timeZone = "Asia/Makassar") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: dayMap[parts.weekday] ?? 0,
    minutes: Number(parts.hour || 0) * 60 + Number(parts.minute || 0)
  };
}

function timeToMinutes(value = "00:00") {
  const [hour, minute] = String(value).split(":").map((entry) => Number(entry || 0));
  return hour * 60 + minute;
}

function isStoreOpenNow(hours = {}, date = new Date()) {
  if (hours.enabled === false) return true;
  const parts = baliDateParts(date, hours.timezone || "Asia/Makassar");
  const days = Array.isArray(hours.days) ? hours.days.map(Number) : [1, 2, 3, 4, 5, 6, 0];
  if (!days.includes(parts.day)) return false;
  const open = timeToMinutes(hours.open || "09:00");
  const close = timeToMinutes(hours.close || "17:00");
  return parts.minutes >= open && parts.minutes < close;
}

function assertStoreIsOpen() {
  const store = getStoreConfig();
  if (!isStoreOpenNow(store.businessHours)) {
    throw new Error(`Online ordering is open daily from ${store.businessHours.open} to ${store.businessHours.close} Bali time.`);
  }
}

function findMenuItem(itemId) {
  return catalog.items.find((entry) => entry.id === itemId);
}

function findVoucher(code) {
  return DEMO_VOUCHERS.find((voucher) => voucher.code === code);
}

function normalizePhoneNumber(input) {
  return String(input || "").replace(/[^\d]/g, "");
}

function formatIndonesianPhone(input) {
  const digits = normalizePhoneNumber(input);
  if (!digits) {
    return "";
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  return `62${digits.replace(/^0+/, "")}`;
}

function normalizeCustomerDetails(input = {}) {
  const firstName = String(input.firstName || "").trim();
  const lastName = String(input.lastName || "").trim();
  const name = String(input.name || [firstName, lastName].filter(Boolean).join(" ")).trim();
  return {
    name,
    firstName,
    lastName,
    email: String(input.email || "").trim().toLowerCase(),
    phone: normalizePhoneNumber(input.phone),
    address: String(input.address || "").trim(),
    notes: String(input.notes || "").trim(),
    phoneVerifiedAt: String(input.phoneVerifiedAt || "").trim()
  };
}

function publicCustomerProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    phone: profile.phone,
    firstName: profile.firstName,
    lastName: profile.lastName,
    name: profile.name,
    email: profile.email,
    addresses: Array.isArray(profile.addresses) ? profile.addresses : [],
    defaultAddressId: profile.defaultAddressId || "",
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    lastLoginAt: profile.lastLoginAt
  };
}

function getCustomerProfile(phone) {
  return publicCustomerProfile(customers[formatIndonesianPhone(phone)]);
}

function getCustomerProfileFromSession(session) {
  return getCustomerProfile(session?.phone);
}

function normalizeAddressEntry(input = {}) {
  const id = String(input.id || crypto.randomUUID()).trim();
  const label = String(input.label || input.name || "").trim() || "Saved address";
  const formattedAddress = String(input.formattedAddress || input.address || "").trim();
  const locationNotes = String(input.locationNotes || "").trim();
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  return {
    id,
    label,
    formattedAddress,
    locationNotes,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
  };
}

function saveCustomerProfile(input = {}, verifiedPhone = "") {
  const phone = formatIndonesianPhone(verifiedPhone || input.phone);
  if (!phone) {
    throw new Error("Verified WhatsApp number is required");
  }

  const firstName = String(input.firstName || "").trim();
  const lastName = String(input.lastName || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Valid email is required");
  }

  const now = new Date().toISOString();
  const existing = customers[phone] || {};
  const profile = {
    phone,
    firstName,
    lastName,
    name: [firstName, lastName].join(" "),
    email,
    addresses: Array.isArray(existing.addresses) ? existing.addresses : [],
    defaultAddressId: existing.defaultAddressId || "",
    createdAt: existing.createdAt || now,
    updatedAt: now,
    lastLoginAt: now
  };

  customers[phone] = profile;
  saveCustomers(customers);
  return publicCustomerProfile(profile);
}

function getCustomerAddresses(phone) {
  const customer = customers[formatIndonesianPhone(phone)];
  if (!customer) {
    return { addresses: [], defaultAddressId: "" };
  }
  return {
    addresses: Array.isArray(customer.addresses) ? customer.addresses : [],
    defaultAddressId: customer.defaultAddressId || ""
  };
}

function getCustomerAddressesFromSession(session) {
  return getCustomerAddresses(session?.phone);
}

function saveCustomerAddress(input = {}, verifiedPhone = "") {
  const phone = formatIndonesianPhone(verifiedPhone || input.phone);
  const customer = customers[phone];
  if (!customer) {
    throw new Error("Customer profile not found");
  }

  const entry = normalizeAddressEntry(input);
  if (!entry.formattedAddress) {
    throw new Error("Address is required");
  }

  const existingAddresses = Array.isArray(customer.addresses) ? customer.addresses : [];
  const nextAddresses = existingAddresses.filter((address) => address.id !== entry.id);
  nextAddresses.unshift(entry);
  customer.addresses = nextAddresses;
  if (!customer.defaultAddressId || input.setAsDefault) {
    customer.defaultAddressId = entry.id;
  }
  customer.updatedAt = new Date().toISOString();
  saveCustomers(customers);
  return getCustomerAddresses(phone);
}

function setDefaultCustomerAddress(input = {}, verifiedPhone = "") {
  const phone = formatIndonesianPhone(verifiedPhone || input.phone);
  const customer = customers[phone];
  if (!customer) {
    throw new Error("Customer profile not found");
  }
  const addressId = String(input.addressId || "").trim();
  const exists = (customer.addresses || []).some((entry) => entry.id === addressId);
  if (!exists) {
    throw new Error("Address not found");
  }
  customer.defaultAddressId = addressId;
  customer.updatedAt = new Date().toISOString();
  saveCustomers(customers);
  return getCustomerAddresses(phone);
}

function normalizeDestination(input = {}) {
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  const routeDistanceKm = Number(input.routeDistanceKm);

  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    label: String(input.label || "").trim(),
    formattedAddress: String(input.formattedAddress || "").trim(),
    locationNotes: String(input.locationNotes || "").trim(),
    routeDistanceKm: Number.isFinite(routeDistanceKm) ? routeDistanceKm : null
  };
}

function hasCompleteDestination(destination) {
  return destination.lat != null
    && destination.lng != null
    && Boolean(String(destination.formattedAddress || "").trim());
}

function normalizeCheckoutDraft(input = {}) {
  const customer = normalizeCustomerDetails(input.customer);
  const fulfillmentType = "delivery";
  const paymentMethodId = String(input.paymentMethodId || "xendit-card").trim() || "xendit-card";

  return {
    customer,
    destination: normalizeDestination(input.destination),
    fulfillmentType,
    deliveryNotes: String(input.deliveryNotes || "").trim(),
    orderNotes: String(input.orderNotes || "").trim(),
    voucherCode: String(input.voucherCode || "").trim().toUpperCase(),
    paymentMethodId
  };
}

function validateCatalog(nextCatalog) {
  if (!nextCatalog || typeof nextCatalog !== "object") {
    throw new Error("Catalog payload must be an object");
  }

  if (!nextCatalog.store?.name) {
    throw new Error("Store name is required");
  }

  if (!Array.isArray(nextCatalog.categories) || !nextCatalog.categories.length) {
    throw new Error("At least one category is required");
  }

  if (!Array.isArray(nextCatalog.items) || !nextCatalog.items.length) {
    throw new Error("At least one product is required");
  }

  const categoryIds = new Set(nextCatalog.categories.map((category) => category.id).filter(Boolean));
  if (categoryIds.size !== nextCatalog.categories.length) {
    throw new Error("Category ids must be unique");
  }

  const itemIds = new Set();
  nextCatalog.items.forEach((item, index) => {
    if (!item.id || !item.name) {
      throw new Error(`Product ${index + 1} needs an id and name`);
    }
    if (itemIds.has(item.id)) {
      throw new Error(`Duplicate product id: ${item.id}`);
    }
    itemIds.add(item.id);
    if (!categoryIds.has(item.category)) {
      throw new Error(`Unknown category for product ${item.id}`);
    }
    if (!Number.isFinite(Number(item.price))) {
      throw new Error(`Invalid retail price for product ${item.id}`);
    }
    if (!Number.isFinite(Number(item.wholesalePrice))) {
      throw new Error(`Invalid wholesale price for product ${item.id}`);
    }
    if (!Number.isFinite(Number(item.stock))) {
      throw new Error(`Invalid stock value for product ${item.id}`);
    }
  });

  if (!itemIds.has(nextCatalog.promo?.itemId)) {
    throw new Error("Promo item must reference an existing product");
  }
}

function normalizeStoryPoint(point, fallbackIcon = "leaf") {
  if (typeof point === "string") {
    return {
      label: point.trim(),
      icon: fallbackIcon
    };
  }

  return {
    label: String(point?.label || "").trim(),
    icon: String(point?.icon || fallbackIcon).trim()
  };
}

function normalizeBrandStorySlides(brandStoryInput) {
  const inputSlides = Array.isArray(brandStoryInput.slides) && brandStoryInput.slides.length
    ? brandStoryInput.slides
    : [
        {
          ...DEFAULT_BRAND_STORY.slides[0],
          ...brandStoryInput
        },
        ...DEFAULT_BRAND_STORY.slides.slice(1)
      ];

  return inputSlides
    .slice(0, 3)
    .map((slide, index) => {
      const fallback = DEFAULT_BRAND_STORY.slides[index] || DEFAULT_BRAND_STORY.slides[0];
      return {
        kicker: String(slide?.kicker || fallback.kicker).trim(),
        title: String(slide?.title || fallback.title).trim(),
        body: String(slide?.body || fallback.body).trim(),
        secondaryBody: String(slide?.secondaryBody || fallback.secondaryBody).trim(),
        imagePath: String(slide?.imagePath || fallback.imagePath).trim(),
        imageAlt: String(slide?.imageAlt || fallback.imageAlt).trim(),
        points: (Array.isArray(slide?.points) ? slide.points : fallback.points)
          .map((point, pointIndex) => normalizeStoryPoint(point, fallback.points[pointIndex]?.icon || "leaf"))
          .filter((point) => point.label)
          .slice(0, 3)
      };
    });
}

function withDefaultBrandStory(brandStoryInput = {}) {
  const merged = {
    ...DEFAULT_BRAND_STORY,
    ...brandStoryInput
  };
  const slides = normalizeBrandStorySlides(merged);
  return {
    ...merged,
    ...slides[0],
    points: slides[0]?.points || merged.points,
    slides
  };
}

function sanitizeCatalog(nextCatalog) {
  const brandStoryInput = nextCatalog.brandStory || {};
  const brandStorySlides = normalizeBrandStorySlides(brandStoryInput);
  const primarySlide = brandStorySlides[0] || DEFAULT_BRAND_STORY.slides[0];
  return {
    store: {
      ...nextCatalog.store,
      orderWhatsapp: normalizePhoneNumber(nextCatalog.store.orderWhatsapp)
    },
    promo: {
      itemId: String(nextCatalog.promo?.itemId || "").trim(),
      buttonLabel: String(nextCatalog.promo?.buttonLabel || "").trim(),
      kicker: String(nextCatalog.promo?.kicker || "").trim()
    },
    brandStory: {
      kicker: primarySlide.kicker,
      title: primarySlide.title,
      body: primarySlide.body,
      secondaryBody: primarySlide.secondaryBody,
      imagePath: primarySlide.imagePath,
      imageAlt: primarySlide.imageAlt,
      points: primarySlide.points,
      slides: brandStorySlides
    },
    categories: nextCatalog.categories.map((category) => ({
      id: String(category.id).trim(),
      label: String(category.label || "").trim(),
      description: String(category.description || "").trim()
    })),
    items: nextCatalog.items.map((item) => ({
      id: String(item.id).trim(),
      category: String(item.category).trim(),
      name: String(item.name || "").trim(),
      description: String(item.description || "").trim(),
      price: Number(item.price),
      wholesalePrice: Number(item.wholesalePrice),
      rating: Number(item.rating || 0),
      reviews: Number(item.reviews || 0),
      badge: String(item.badge || "").trim(),
      sku: String(item.sku || "").trim(),
      barcode: String(item.barcode || "").trim(),
      minOrder: String(item.minOrder || "").trim(),
      shelfLife: String(item.shelfLife || "").trim(),
      imagePath: String(item.imagePath || "").trim(),
      stock: Number(item.stock)
    }))
  };
}

function saveCatalog(nextCatalog) {
  validateCatalog(nextCatalog);
  const sanitized = sanitizeCatalog(nextCatalog);
  ensureParentDir(catalogPath);
  fs.writeFileSync(catalogPath, `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");
  catalog = sanitized;
  return sanitized;
}

function cartItems(storeState) {
  return [...storeState.cart.entries()].map(([itemId, quantity]) => ({
    itemId,
    quantity
  }));
}

function clampCartToStock(storeState) {
  for (const [itemId, quantity] of storeState.cart.entries()) {
    const item = findMenuItem(itemId);
    if (!item || item.stock <= 0) {
      storeState.cart.delete(itemId);
      continue;
    }
    if (quantity > item.stock) {
      storeState.cart.set(itemId, item.stock);
    }
  }
}

function clampAllCartsToStock(storeState) {
  clampCartToStock(storeState);
  for (const cart of storeState.carts.values()) {
    clampCartToStock({
      ...storeState,
      cart
    });
  }
}

function roundCurrency(value) {
  return Math.max(0, Math.round(value));
}

function haversineDistanceKm(origin, destination) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(destination.lat - origin.lat);
  const lngDelta = toRadians(destination.lng - origin.lng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(origin.lat))
      * Math.cos(toRadians(destination.lat))
      * Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function estimateRoadDistanceKm(origin, destination, clientRouteDistanceKm) {
  const straightDistance = haversineDistanceKm(origin, destination);
  if (Number.isFinite(clientRouteDistanceKm) && clientRouteDistanceKm > 0) {
    const boundedDistance = Math.max(
      straightDistance,
      Math.min(clientRouteDistanceKm, straightDistance * 1.8)
    );
    return Number(boundedDistance.toFixed(1));
  }
  return Number((straightDistance * 1.18).toFixed(1));
}

function calculateGoSendStyleFee(distanceKm) {
  if (!distanceKm || distanceKm <= 0) {
    return {
      distanceKm: 0,
      bikeFare: 0,
      serviceFee: 0,
      total: 0
    };
  }

  const bikeFare = Math.max(10000, roundCurrency(distanceKm * 2000));
  const serviceFee = 5500;
  return {
    distanceKm,
    bikeFare,
    serviceFee,
    total: bikeFare + serviceFee
  };
}

function defaultWeightGrams(item) {
  if (Number.isFinite(Number(item.weightGrams))) {
    return Number(item.weightGrams);
  }

  const badgeMatch = String(item.badge || "").match(/(\d+)\s*gr/i);
  if (badgeMatch) {
    return Number(badgeMatch[1]);
  }

  if (String(item.category).includes("bliss")) return 150;
  if (String(item.category).includes("cookie")) return 80;
  if (String(item.category).includes("oats")) return 60;
  if (String(item.category).includes("mallow")) return 20;
  return 250;
}

function buildShipmentItems(storeState) {
  return cartItems(storeState)
    .map(({ itemId, quantity }) => {
      const item = findMenuItem(itemId);
      if (!item) return null;
      return {
        name: item.name,
        description: item.description,
        category: "food_and_drink",
        value: item.price,
        quantity,
        weight: defaultWeightGrams(item)
      };
    })
    .filter(Boolean);
}

function buildShipmentItemsFromOrder(order) {
  return (Array.isArray(order.items) ? order.items : [])
    .map(({ itemId, quantity }) => {
      const item = findMenuItem(itemId);
      if (!item) return null;
      return {
        name: item.name,
        description: item.description,
        category: "food_and_drink",
        value: item.price,
        quantity,
        height: Number(item.heightCm || 5),
        length: Number(item.lengthCm || 10),
        width: Number(item.widthCm || 10),
        weight: defaultWeightGrams(item)
      };
    })
    .filter(Boolean);
}

function localIndonesianPhone(phone) {
  const normalized = formatIndonesianPhone(phone);
  return normalized ? normalized.replace(/^62/, "0") : "";
}

function preferredInstantCourier(couriers) {
  const entries = String(couriers || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return entries[0] || "grab";
}

function recalculateSummary(summary, options = {}) {
  const store = getStoreConfig();
  const deliveryFee = Number(options.deliveryFee || 0);
  const shipping = options.shipping || summary.shipping;
  const discount = computeDiscount(
    summary.subtotal,
    deliveryFee,
    String(options.voucherCode || summary.discount?.code || "").trim().toUpperCase(),
    summary.fulfillmentType
  );
  const taxableAmount = Math.max(0, summary.subtotal + deliveryFee - discount.amount);
  const tax = roundCurrency(taxableAmount * store.taxRate);
  const total = Math.max(0, summary.subtotal + deliveryFee + tax - discount.amount);

  return {
    ...summary,
    deliveryFee,
    shipping,
    discount,
    tax,
    total
  };
}

async function fetchBiteshipLiveQuote(storeState, destination) {
  const integrationConfig = getIntegrationConfig();
  if (!integrationConfig.biteshipApiKey) {
    return null;
  }

  const shipmentItems = buildShipmentItems(storeState);
  if (!shipmentItems.length || destination.lat == null || destination.lng == null) {
    return null;
  }

  const store = getStoreConfig();
  const response = await fetch("https://api.biteship.com/v1/rates/couriers", {
    method: "POST",
    headers: {
      Authorization: integrationConfig.biteshipApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      origin_latitude: store.kitchenLat,
      origin_longitude: store.kitchenLng,
      destination_latitude: destination.lat,
      destination_longitude: destination.lng,
      couriers: integrationConfig.biteshipCouriers,
      items: shipmentItems
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Biteship quote failed: ${response.status} ${payload}`);
  }

  const payload = await response.json();
  const pricing = Array.isArray(payload.pricing) ? payload.pricing : [];
  if (!pricing.length) {
    return null;
  }

  const preferredOption = pricing
    .filter((entry) => ["gojek", "grab"].includes(String(entry.courier_code || "").toLowerCase()))
    .sort((left, right) => Number(left.price || 0) - Number(right.price || 0))[0]
    || pricing.sort((left, right) => Number(left.price || 0) - Number(right.price || 0))[0];

  if (!preferredOption) {
    return null;
  }

  return {
    provider: "biteship",
    courierCode: preferredOption.courier_code,
    courierName: preferredOption.courier_name,
    courierServiceName: preferredOption.courier_service_name,
    courierServiceCode: preferredOption.courier_service_code || preferredOption.service_type || "",
    serviceType: preferredOption.service_type,
    duration: preferredOption.duration,
    distanceKm: destination.routeDistanceKm || 0,
    bikeFare: Number(preferredOption.shipping_fee || preferredOption.price || 0),
    serviceFee: Number((preferredOption.price || 0) - (preferredOption.shipping_fee || 0)),
    total: Number(preferredOption.price || 0)
  };
}

async function getCartSummaryPayload(storeState, options = {}) {
  const summary = buildCartSummary(storeState, options);
  const destination = normalizeDestination(options.destination);
  if (summary.fulfillmentType !== "delivery" || destination.lat == null || destination.lng == null) {
    return summary;
  }

  try {
    const liveQuote = await fetchBiteshipLiveQuote(storeState, destination);
    if (!liveQuote) {
      return summary;
    }
    return {
      ...recalculateSummary(summary, {
        deliveryFee: liveQuote.total,
        shipping: liveQuote,
        voucherCode: options.voucherCode
      }),
      quoteSource: "biteship"
    };
  } catch (_error) {
    return summary;
  }
}

async function createBiteshipShipment(order) {
  const integrationConfig = getIntegrationConfig();
  if (!integrationConfig.biteshipApiKey) {
    throw new Error("Biteship API key is not configured");
  }

  const shipping = order.pricing?.shipping || {};
  const destination = normalizeDestination(order.fulfillment?.location || {});
  const items = buildShipmentItemsFromOrder(order);
  if (!items.length) {
    throw new Error("Biteship order was not created because the cart has no shippable items");
  }
  if (destination.lat == null || destination.lng == null) {
    throw new Error("Biteship order was not created because the delivery coordinates are missing");
  }
  if (!order.customer?.address && !order.fulfillment?.address) {
    throw new Error("Biteship order was not created because the delivery address is missing");
  }

  const store = getStoreConfig();
  const customerPhone = localIndonesianPhone(order.customer?.phone);
  const storePhone = localIndonesianPhone(store.orderWhatsapp || store.perkTitle);
  const courierCompany = shipping.courierCode || preferredInstantCourier(integrationConfig.biteshipCouriers);
  const courierType = shipping.courierServiceCode || shipping.serviceType || shipping.courierServiceName || "instant";
  const payload = {
    shipper_contact_name: store.name || "Bakeaholic Bali",
    shipper_contact_phone: storePhone,
    origin_contact_name: store.name || "Bakeaholic Bali",
    origin_contact_phone: storePhone,
    origin_address: store.kitchenAddress,
    origin_coordinate: {
      latitude: store.kitchenLat,
      longitude: store.kitchenLng
    },
    destination_contact_name: order.customer?.name || "Bakeaholic customer",
    destination_contact_phone: customerPhone,
    destination_address: order.customer?.address || order.fulfillment?.address,
    destination_coordinate: {
      latitude: destination.lat,
      longitude: destination.lng
    },
    courier_company: courierCompany,
    courier_type: courierType,
    delivery_type: "now",
    order_note: order.fulfillment?.deliveryNotes || order.orderNotes || "",
    reference_id: order.id,
    metadata: {
      order_id: order.id,
      source: "bakeaholic-online-shop"
    },
    items
  };

  const response = await fetch("https://api.biteship.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: integrationConfig.biteshipApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  const parsed = parseJsonSafely(responseText, {});
  if (!response.ok) {
    throw new Error(parsed?.error || parsed?.message || `Biteship order failed with status ${response.status}`);
  }

  return {
    provider: "biteship",
    orderId: parsed.id || parsed.order_id || "",
    status: parsed.status || "",
    waybillId: parsed.waybill_id || "",
    labelUrl: parsed.label_url || parsed.shipping_label_url || parsed.courier?.label_url || "",
    invoiceUrl: parsed.invoice_url || parsed.delivery_invoice_url || "",
    waybillUrl: parsed.waybill_url || parsed.courier?.waybill_url || "",
    courier: parsed.courier || null,
    trackingLink: parsed.courier?.link || parsed.tracking_link || parsed.tracking_url || "",
    createdAt: new Date().toISOString(),
    raw: parsed
  };
}

async function maybeCreateBiteshipShipment(order) {
  if (
    order.mode !== "live" ||
    order.status !== "preparing" ||
    order.fulfillment?.type !== "delivery" ||
    !order.fulfillment?.approval?.approvedAt ||
    order.fulfillment?.shipment?.orderId
  ) {
    return;
  }

  try {
    const shipment = await createBiteshipShipment(order);
    if (!shipment) {
      return;
    }
    order.fulfillment.shipment = shipment;
    delete order.fulfillment.shipmentError;
  } catch (error) {
    order.fulfillment.shipmentError = error.message;
  }
}

async function approveOrderForDelivery(mode, orderId, session) {
  const order = findOrder(mode, orderId);
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.status !== "paid" && order.status !== "preparing") {
    throw new Error("Only paid orders can be approved for delivery");
  }
  if (order.fulfillment?.type !== "delivery") {
    throw new Error("Only delivery orders can be approved for Biteship");
  }

  const previousStatus = order.status;
  order.status = "preparing";
  order.fulfillment = {
    ...order.fulfillment,
    approval: {
      status: "approved",
      approvedAt: order.fulfillment?.approval?.approvedAt || new Date().toISOString(),
      approvedBy: session?.role || "admin"
    }
  };
  order.whatsappUrl = buildWhatsappUrl(order);

  await maybeCreateBiteshipShipment(order);
  await maybeSendWhatsappOrderStatus(order, previousStatus);
  const shippingKey = `order:${order.id}:shipping:${order.fulfillment?.shipment?.orderId || "requested"}`;
  await maybeSendWhatsappShippingUpdate(order, shippingKey);
  await maybeSendWhatsappShippingUpdate(order, `${shippingKey}:admin`, { admin: true });
  await maybeSendWhatsappAdminAlert(order, `order:${order.id}:delivery-approved`, "Delivery approved - courier requested");

  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  return enrichOrder(order);
}

function normalizeBiteshipWebhookPayload(body = {}) {
  return body.data || body.order || body;
}

function biteshipWebhookIdentifiers(body = {}) {
  const payload = normalizeBiteshipWebhookPayload(body);
  return [
    body.id,
    body.order_id,
    body.orderId,
    body.reference_id,
    body.referenceId,
    body.external_id,
    body.externalId,
    body.metadata?.order_id,
    body.metadata?.orderId,
    payload.id,
    payload.order_id,
    payload.orderId,
    payload.reference_id,
    payload.referenceId,
    payload.external_id,
    payload.externalId,
    payload.metadata?.order_id,
    payload.metadata?.orderId
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function findOrderByBiteshipWebhook(body = {}) {
  const identifiers = new Set(biteshipWebhookIdentifiers(body));
  if (!identifiers.size) {
    return null;
  }
  return stores.live.orders.find((entry) => (
    identifiers.has(entry.id) ||
    identifiers.has(entry.fulfillment?.shipment?.orderId)
  )) || null;
}

function shipmentStatusToOrderStatus(status = "") {
  const normalized = String(status || "").toLowerCase();
  if (["confirmed", "allocated", "picking_up", "picking up", "picked", "picked_up", "picked up", "successfully_pickup", "successfully pickup", "successfully_picked_up", "successfully picked up"].includes(normalized)) {
    return "on_delivery";
  }
  if (["dropping_off", "courier_delivering", "in_transit", "on_delivery"].includes(normalized)) {
    return "on_delivery";
  }
  if (["delivered", "finish", "completed"].includes(normalized)) {
    return "delivered";
  }
  if (["cancelled", "canceled", "rejected"].includes(normalized)) {
    return "cancelled";
  }
  return "";
}

function computeDiscount(subtotal, deliveryFee, voucherCode, fulfillmentType) {
  if (!voucherCode) {
    return { code: "", label: "", amount: 0 };
  }

  const voucher = findVoucher(voucherCode);
  if (!voucher) {
    return { code: voucherCode, label: "Voucher not recognized", amount: 0 };
  }

  if (voucher.type === "delivery") {
    return {
      code: voucherCode,
      label: voucher.label,
      amount: deliveryFee
    };
  }

  if (voucher.type === "fixed") {
    return {
      code: voucherCode,
      label: voucher.label,
      amount: Math.min(voucher.value, subtotal + deliveryFee)
    };
  }

  const baseAmount = Math.round((subtotal * voucher.value) / 100);
  return {
    code: voucherCode,
    label: voucher.label,
    amount: Math.min(baseAmount, voucher.maxDiscount || baseAmount)
  };
}

function buildCartSummary(storeState, options = {}) {
  clampCartToStock(storeState);

  const lineItems = cartItems(storeState)
    .map(({ itemId, quantity }) => ({
      itemId,
      quantity,
      item: findMenuItem(itemId)
    }))
    .filter((entry) => entry.item);

  const subtotal = lineItems.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  const fulfillmentType = "delivery";
  const store = getStoreConfig();
  let shipping = {
    distanceKm: 0,
    bikeFare: 0,
    serviceFee: 0,
    total: 0
  };

  if (lineItems.length && fulfillmentType === "delivery") {
    const destination = normalizeDestination(options.destination);
    if (hasCompleteDestination(destination)) {
      const kitchen = {
        lat: store.kitchenLat,
        lng: store.kitchenLng
      };
      const routeDistanceKm = estimateRoadDistanceKm(
        kitchen,
        destination,
        destination.routeDistanceKm
      );
      if (routeDistanceKm <= MAX_DELIVERY_DISTANCE_KM) {
        shipping = calculateGoSendStyleFee(routeDistanceKm);
      } else {
        shipping = {
          distanceKm: 0,
          bikeFare: 0,
          serviceFee: store.deliveryFee,
          total: store.deliveryFee
        };
      }
    }
  }

  const deliveryFee = shipping.total;
  const discount = computeDiscount(
    subtotal,
    deliveryFee,
    String(options.voucherCode || "").trim().toUpperCase(),
    fulfillmentType
  );
  const taxableAmount = Math.max(0, subtotal + deliveryFee - discount.amount);
  const tax = roundCurrency(taxableAmount * store.taxRate);
  const total = Math.max(0, subtotal + deliveryFee + tax - discount.amount);

  return {
    items: lineItems.map(({ itemId, quantity }) => ({ itemId, quantity })),
    lineItems: lineItems.map(({ item, quantity }) => ({
      itemId: item.id,
      quantity,
      lineTotal: item.price * quantity,
      item
    })),
    subtotal,
    deliveryFee,
    shipping,
    discount,
    tax,
    total,
    itemCount: lineItems.reduce((sum, entry) => sum + entry.quantity, 0),
    fulfillmentType,
    perkUnlocked: subtotal >= 120000
  };
}

function makeNumericSeed(value) {
  return String(value)
    .split("")
    .reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 3), 17);
}

function generateQrSvgData(orderId) {
  const seed = makeNumericSeed(orderId);
  const cells = [];
  for (let row = 0; row < 21; row += 1) {
    for (let col = 0; col < 21; col += 1) {
      const edgeFinder = row < 5 && col < 5
        || row < 5 && col > 15
        || row > 15 && col < 5;
      const active = edgeFinder || ((row * 11 + col * 7 + seed) % 5 < 2);
      if (!active) continue;
      cells.push(
        `<rect x="${col * 10}" y="${row * 10}" width="10" height="10" rx="1" fill="#111111" />`
      );
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210" width="210" height="210">
      <rect width="210" height="210" rx="14" fill="#ffffff" />
      ${cells.join("")}
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function xenditAuthHeader() {
  const { xenditSecretKey } = getIntegrationConfig();
  return `Basic ${Buffer.from(`${xenditSecretKey}:`).toString("base64")}`;
}

function isXenditReady() {
  return Boolean(getIntegrationConfig().xenditSecretKey);
}

function getPublicOrderUrl(order) {
  const baseUrl = String(process.env.PUBLIC_SITE_URL || "https://bakeaholicbali.com").replace(/\/+$/, "");
  const modeParam = order.mode === "test" ? "&mode=test" : "";
  return `${baseUrl}/pay.html?order=${encodeURIComponent(order.id)}${modeParam}`;
}

function buildXenditInvoicePayload(order) {
  const returnUrl = getPublicOrderUrl(order);
  const payload = {
    external_id: order.id,
    amount: order.pricing.total,
    currency: "IDR",
    description: `Bakeaholic Bali order ${order.id}`,
    payer_email: order.customer.email || undefined,
    success_redirect_url: returnUrl,
    failure_redirect_url: returnUrl,
    invoice_duration: 15 * 60
  };

  if (Array.isArray(order.payment?.xenditPaymentMethods) && order.payment.xenditPaymentMethods.length) {
    payload.payment_methods = order.payment.xenditPaymentMethods;
  }

  return payload;
}

async function createXenditInvoice(order) {
  if (order.pricing.total <= 0) {
    return null;
  }
  if (!isXenditReady()) {
    throw new Error("Xendit secret key is required before accepting paid orders.");
  }

  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: xenditAuthHeader()
    },
    body: JSON.stringify(buildXenditInvoicePayload(enrichOrder(order)))
  });

  const payload = await response.json().catch(async () => ({ raw: await response.text() }));
  if (!response.ok) {
    throw new Error(payload.message || payload.error_code || "Xendit invoice creation failed");
  }

  return payload;
}

function applyXenditInvoiceToPayment(payment, invoice) {
  if (!invoice) {
    return payment;
  }

  return {
    ...payment,
    provider: "xendit",
    status: String(invoice.status || "PENDING").toLowerCase(),
    transactionId: invoice.id || "",
    paymentId: invoice.payment_id || invoice.charge_id || invoice.payment_request_id || payment.paymentId || "",
    externalId: invoice.external_id || "",
    invoiceUrl: invoice.invoice_url || "",
    paymentUrl: invoice.invoice_url || "",
    qrCodeData: "",
    deeplinkUrl: "",
    accountNumber: "",
    rawStatus: invoice.status || "",
    instructions: "Open the secure Xendit payment page to complete your payment."
  };
}

async function attemptXenditRefund(order, reason = "Requested by admin") {
  const paymentId = order.payment?.paymentId || order.payment?.chargeId || "";
  if (!isXenditReady() || !paymentId) {
    order.refund = {
      status: "manual_required",
      reason,
      message: "No Xendit payment id was available. Refund from Xendit dashboard.",
      requestedAt: new Date().toISOString()
    };
    return order.refund;
  }

  const response = await fetch("https://api.xendit.co/refunds", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: xenditAuthHeader()
    },
    body: JSON.stringify({
      payment_id: paymentId,
      amount: order.pricing?.total || 0,
      reason,
      reference_id: `${order.id}-refund`
    })
  });
  const payload = await response.json().catch(async () => ({ raw: await response.text() }));
  order.refund = {
    status: response.ok ? "requested" : "manual_required",
    reason,
    requestedAt: new Date().toISOString(),
    response: payload,
    message: response.ok ? "Refund requested in Xendit." : (payload.message || payload.error_code || "Refund request failed. Refund manually from Xendit dashboard.")
  };
  return order.refund;
}

async function fetchXenditInvoiceStatus(order) {
  if (!isXenditReady() || order.payment.provider !== "xendit" || !order.payment.transactionId) {
    return null;
  }

  const response = await fetch(`https://api.xendit.co/v2/invoices/${encodeURIComponent(order.payment.transactionId)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: xenditAuthHeader()
    }
  });

  const payload = await response.json().catch(async () => ({ raw: await response.text() }));
  if (!response.ok) {
    throw new Error(payload.message || payload.error_code || "Unable to check Xendit invoice status");
  }

  return payload;
}

function applyXenditInvoiceStatusToOrder(order, invoice) {
  order.payment = applyXenditInvoiceToPayment(order.payment, invoice);
  const status = String(invoice.status || "").toUpperCase();

  if (status === "PAID" || status === "SETTLED") {
    order.status = "paid";
    order.payment.status = "paid";
    order.paidAt = order.paidAt || new Date().toISOString();
  } else if (status === "EXPIRED") {
    order.status = "expired";
    order.payment.status = "expired";
  } else {
    order.status = "awaiting_payment";
    order.payment.status = status.toLowerCase() || "pending";
  }

  order.whatsappUrl = buildWhatsappUrl(order);
  return order;
}

function buildPaymentDetails(orderId, methodId, total) {
  if (total <= 0) {
    return {
      id: "voucher",
      label: "Voucher checkout",
      kind: "voucher",
      logoText: "FREE",
      status: "paid",
      instructions: "This order was fully covered by a discount voucher."
    };
  }

  const method = PAYMENT_METHODS.find((entry) => entry.id === methodId) || PAYMENT_METHODS[0];
  return {
    ...method,
    status: "pending",
    instructions: `${method.description} Payment is processed securely by Xendit.`
  };
}

function enrichOrder(order) {
  if (!order) return null;
  return {
    ...order,
    documentUrl: getPublicDocumentUrl(order),
    lineItems: order.items
      .map(({ itemId, quantity }) => {
        const item = findMenuItem(itemId);
        if (!item) return null;
        return {
          itemId,
          quantity,
          lineTotal: item.price * quantity,
          item
        };
      })
      .filter(Boolean)
  };
}

function buildOrderDocument(order) {
  const enriched = enrichOrder(order);
  if (!enriched) return null;
  return {
    store: getStoreConfig(),
    order: enriched,
    generatedAt: new Date().toISOString()
  };
}

function buildWhatsappUrl(order) {
  const phone = normalizePhoneNumber(catalog.store.orderWhatsapp || catalog.store.perkTitle);
  if (!phone) return null;

  const lines = [
    `${catalog.store.name} order ${order.id}`,
    `Mode: ${order.mode}`,
    `Fulfillment: ${order.fulfillment.type}`,
    `Payment: ${order.payment.label}`,
    "",
    "Customer:",
    `Name: ${order.customer.name || "-"}`,
    `Phone: ${order.customer.phone || "-"}`,
    `Email: ${order.customer.email || "-"}`,
    `Address: ${order.customer.address || "-"}`,
    `Customer notes: ${order.customer.notes || "-"}`,
    `Delivery notes: ${order.fulfillment.deliveryNotes || "-"}`,
    `Order notes: ${order.orderNotes || "-"}`,
    "",
    "Items:"
  ];

  order.items.forEach(({ itemId, quantity }) => {
    const item = findMenuItem(itemId);
    if (!item) return;
    lines.push(`- ${item.name} x${quantity} = Rp ${item.price * quantity}`);
  });

  lines.push("");
  lines.push(`Subtotal: Rp ${order.pricing.subtotal}`);
  lines.push(`Delivery fee: Rp ${order.pricing.deliveryFee}`);
  lines.push(`Government tax: Rp ${order.pricing.tax}`);
  if (order.pricing.discount.amount > 0) {
    lines.push(`Discount (${order.pricing.discount.code}): -Rp ${order.pricing.discount.amount}`);
  }
  lines.push(`Total: Rp ${order.pricing.total}`);
  lines.push(`Status: ${order.status}`);

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function customerOwnsOrder(session, order) {
  if (!session || !order) {
    return false;
  }
  return formatIndonesianPhone(session.phone) === formatIndonesianPhone(order.customer?.phone);
}

function validateCheckoutDraft(draft, summary) {
  if (!summary.itemCount) {
    throw new Error("Your basket is empty");
  }

  if (!draft.customer.name) {
    throw new Error("Customer name is required");
  }

  if (!draft.customer.phone) {
    throw new Error("Customer phone is required");
  }

  if (!draft.customer.phoneVerifiedAt) {
    throw new Error("Please verify your WhatsApp number first");
  }

  if (!draft.customer.email) {
    throw new Error("Customer email is required");
  }

  if (!draft.customer.address) {
    throw new Error("Delivery address is required");
  }

  if (draft.destination.lat == null || draft.destination.lng == null) {
    throw new Error("Please choose a delivery location from the map");
  }
}

function createOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function startRegistration(mode, storeState, input = {}) {
  const phone = formatIndonesianPhone(input.phone);
  if (!phone || phone.length < 10) {
    throw new Error("Please enter a valid WhatsApp number");
  }

  const now = Date.now();
  const existing = storeState.registrations.get(phone);
  if (existing?.nextResendAt && existing.nextResendAt > now) {
    const waitSeconds = Math.ceil((existing.nextResendAt - now) / 1000);
    throw new Error(`Please wait ${waitSeconds} seconds before requesting a new code`);
  }

  const code = createOtpCode();
  const registration = {
    phone,
    code,
    attempts: 0,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
    nextResendAt: now + 30 * 1000,
    verifiedAt: ""
  };

  storeState.registrations.set(phone, registration);

  let message = mode === "test"
    ? `Sandbox code: ${code}`
    : "Verification code generated. Connect a WhatsApp provider to send it automatically.";

  if (mode !== "test" && isWhatsappCloudReady()) {
    await sendWhatsappOtpCode(phone, code);
    message = "Verification code sent to WhatsApp.";
  }

  return {
    phone,
    expiresInSeconds: 10 * 60,
    resendInSeconds: 30,
    // Test mode exposes the code so the whole flow can be tested without a WhatsApp provider.
    testCode: mode === "test" ? code : "",
    message
  };
}

function verifyRegistration(storeState, input = {}) {
  const phone = formatIndonesianPhone(input.phone);
  const code = String(input.code || "").replace(/[^\d]/g, "");
  const registration = storeState.registrations.get(phone);
  if (!registration) {
    throw new Error("Please request a verification code first");
  }

  if (new Date(registration.expiresAt).getTime() < Date.now()) {
    storeState.registrations.delete(phone);
    throw new Error("This verification code expired. Please request a new code");
  }

  registration.attempts += 1;
  if (registration.attempts > 5) {
    storeState.registrations.delete(phone);
    throw new Error("Too many attempts. Please request a new code");
  }

  if (registration.code !== code) {
    throw new Error("Incorrect verification code");
  }

  registration.verifiedAt = new Date().toISOString();
  const profile = getCustomerProfile(phone);
  if (customers[phone]) {
    customers[phone].lastLoginAt = registration.verifiedAt;
    saveCustomers(customers);
  }
  return {
    phone,
    verifiedAt: registration.verifiedAt,
    profile
  };
}

async function createOrder(mode, payload, cartOverride = null) {
  const draft = normalizeCheckoutDraft(payload);
  const storeState = getStoreState(mode);
  const cartState = cartOverride
    ? {
      ...storeState,
      cart: cartOverride
    }
    : storeState;
  const summary = await getCartSummaryPayload(cartState, {
    fulfillmentType: draft.fulfillmentType,
    voucherCode: draft.voucherCode,
    destination: draft.destination
  });

  validateCheckoutDraft(draft, summary);

  const prefix = mode === "test" ? "TEST" : "BAK";
  const sequence = String(storeState.orders.length + 1).padStart(4, "0");
  const orderId = `${prefix}-${sequence}`;
  const now = new Date();
  const payment = buildPaymentDetails(orderId, draft.paymentMethodId, summary.total);
  const isZeroTotalOrder = summary.total <= 0;
  const storeConfig = getStoreConfig();
  const isWithinWorkingHours = isStoreOpenNow(storeConfig.businessHours, now);

  const order = {
    id: orderId,
    mode,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    status: isZeroTotalOrder ? "paid" : "awaiting_payment",
    paidAt: isZeroTotalOrder ? now.toISOString() : "",
    receiptToken: crypto.randomBytes(18).toString("hex"),
    itemCount: summary.itemCount,
    items: summary.items,
    customer: draft.customer,
    fulfillment: {
      type: draft.fulfillmentType,
      address: draft.customer.address,
      deliveryNotes: draft.deliveryNotes,
      location: draft.destination
    },
    orderNotes: draft.orderNotes,
    operations: {
      workingHours: storeConfig.businessHours,
      queuedForWorkingHours: !isWithinWorkingHours,
      note: isWithinWorkingHours
        ? "Order received during working hours."
        : `Order received after hours. Staff approval and delivery dispatch happen from ${storeConfig.businessHours.open} to ${storeConfig.businessHours.close} Bali time.`
    },
    pricing: {
      subtotal: summary.subtotal,
      deliveryFee: summary.deliveryFee,
      shipping: summary.shipping,
      tax: summary.tax,
      discount: summary.discount,
      total: summary.total
    },
    payment
  };

  if (!isZeroTotalOrder) {
    const xenditInvoice = await createXenditInvoice(enrichOrder(order));
    order.payment = applyXenditInvoiceToPayment(order.payment, xenditInvoice);
  }
  order.whatsappUrl = buildWhatsappUrl(order);
  order.whatsappNotifications = {
    lastStatusSent: "",
    lastSentAt: ""
  };

  if (!isZeroTotalOrder) {
    schedulePaymentReminderFlow(mode, order);
  }
  if (isZeroTotalOrder) {
    await maybeSendWhatsappPaymentReceipt(order, `order:${order.id}:receipt`);
  }
  await maybeSendWhatsappAdminAlert(order, `order:${order.id}:created`, "Order created");

  storeState.orders.unshift(order);
  saveOrders(ordersPathForMode(mode), storeState.orders);
  cartState.cart.clear();
  return enrichOrder(order);
}

async function createOrderForSession(mode, payload, session, cartOverride = null) {
  if (!session?.phone) {
    throw new Error("Please log in again to continue");
  }
  const body = {
    ...payload,
    customer: {
      ...(payload.customer || {}),
      phone: `+${formatIndonesianPhone(session.phone)}`,
      phoneVerifiedAt: session.verifiedAt || new Date().toISOString()
    }
  };
  return createOrder(mode, body, cartOverride);
}

function findOrder(mode, orderId) {
  return getStoreState(mode).orders.find((order) => order.id === orderId) || null;
}

async function updateOrderPaymentStatus(mode, orderId) {
  const order = findOrder(mode, orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "cancelled") {
    return enrichOrder(order);
  }

  const previousStatus = order.status;

  const xenditStatus = await fetchXenditInvoiceStatus(order);
  if (xenditStatus) {
    applyXenditInvoiceStatusToOrder(order, xenditStatus);
  } else {
    order.status = "paid";
    order.payment.status = "paid";
    order.paidAt = new Date().toISOString();
    order.whatsappUrl = buildWhatsappUrl(order);
  }

  if (order.status !== "awaiting_payment") {
    clearPaymentReminderTimers(mode, order.id);
  }
  await maybeSendWhatsappOrderStatus(order, previousStatus);
  if (previousStatus !== order.status) {
    if (order.status === "paid") {
      await maybeSendWhatsappPaymentReceipt(order, `order:${order.id}:receipt`);
    }
    await maybeSendWhatsappAdminAlert(order, `order:${order.id}:status:${order.status}`, humanizeOrderStatus(order));
  }

  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  return enrichOrder(order);
}

async function updateOrderPaymentStatusForSession(mode, orderId, session) {
  const order = findOrder(mode, orderId);
  if (!order || !customerOwnsOrder(session, order)) {
    throw new Error("Order not found");
  }
  return updateOrderPaymentStatus(mode, orderId);
}

async function cancelOrder(mode, orderId) {
  const order = findOrder(mode, orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  clearPaymentReminderTimers(mode, order.id);
  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  order.payment.status = "cancelled";
  order.whatsappUrl = buildWhatsappUrl(order);

  await maybeSendWhatsappOrderStatus(order, "");

  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  return enrichOrder(order);
}

async function cancelOrderForSession(mode, orderId, session) {
  const order = findOrder(mode, orderId);
  if (!order || !customerOwnsOrder(session, order)) {
    throw new Error("Order not found");
  }
  return cancelOrder(mode, orderId);
}

function resetStore(mode) {
  const storeState = getStoreState(mode);
  storeState.cart.clear();
  storeState.carts.clear();
  storeState.orders.length = 0;
  storeState.registrations.clear();
  saveOrders(ordersPathForMode(mode), storeState.orders);
}

function handleCartUpsert(storeState, response, body, strategy) {
  const item = findMenuItem(body.itemId);
  if (!item) {
    sendJson(response, 404, { error: "Unknown menu item" });
    return;
  }

  const quantity = Number(body.quantity);
  if (!Number.isFinite(quantity)) {
    sendJson(response, 400, { error: "Quantity must be a number" });
    return;
  }

  const nextQuantity = strategy(item, quantity);
  if (nextQuantity <= 0) {
    storeState.cart.delete(item.id);
    sendJson(response, 200, buildCartSummary(storeState));
    return;
  }

  if (item.stock <= 0) {
    sendJson(response, 409, { error: `${item.name} is out of stock` });
    return;
  }

  if (nextQuantity > item.stock) {
    sendJson(response, 409, { error: `Only ${item.stock} left for ${item.name}` });
    return;
  }

  storeState.cart.set(item.id, nextQuantity);
  sendJson(response, 200, buildCartSummary(storeState));
}

function handleApi(requestUrl, request, response) {
  const pathname = requestUrl.pathname;
  const mode = getAppMode(requestUrl, request);
  const storeState = getStoreState(mode);
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const isBiteshipWebhookPath = [
    "/api/webhooks/biteship",
    "/api/biteship/webhook",
    "/webhooks/biteship",
    "/biteship-webhook"
  ].includes(normalizedPathname);
  const mutatingRequest = new Set(["POST", "PUT", "PATCH", "DELETE"]).has(request.method);

  const externalWebhookPaths = new Set([
    "/api/xendit/invoice-callback",
    "/api/webhooks/whatsapp",
    "/api/whatsapp/webhook",
    "/api/webhooks/biteship",
    "/api/biteship/webhook"
  ]);

  if (mutatingRequest && !isBiteshipWebhookPath && !externalWebhookPaths.has(normalizedPathname) && !enforceSameOrigin(request, response)) {
    return true;
  }

  if (request.method === "GET" && (pathname === "/api/webhooks/whatsapp" || pathname === "/api/whatsapp/webhook")) {
    const modeValue = requestUrl.searchParams.get("hub.mode");
    const verifyToken = requestUrl.searchParams.get("hub.verify_token");
    const challenge = requestUrl.searchParams.get("hub.challenge");
    if (modeValue === "subscribe" && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
      response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(challenge || "");
      return true;
    }
    sendJson(response, 403, { error: "Invalid WhatsApp verify token" });
    return true;
  }

  if (request.method === "POST" && (pathname === "/api/webhooks/whatsapp" || pathname === "/api/whatsapp/webhook")) {
    parseRawBody(request)
      .then(async (rawBody) => {
        if (!verifyMetaWebhookSignature(request, rawBody)) {
          sendJson(response, 403, { error: "Invalid WhatsApp webhook signature" });
          return;
        }
        const payload = parseJsonSafely(rawBody, {});
        await processWhatsappWebhook(payload);
        sendJson(response, 200, { ok: true });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (isBiteshipWebhookPath && request.method !== "POST") {
    sendPlainOk(response);
    return true;
  }

  if (request.method === "POST" && isBiteshipWebhookPath) {
    sendPlainOk(response);
    parseRawBody(request)
      .then(async (body) => {
        if (!String(body || "").trim()) {
          return;
        }
        body = parseJsonSafely(body, {});
        const payload = normalizeBiteshipWebhookPayload(body);
        const order = findOrderByBiteshipWebhook(body);
        if (!order) {
          recordBiteshipWebhookLog({
            matched: false,
            event: payload.event || body.event || "",
            identifiers: biteshipWebhookIdentifiers(body),
            status: payload.status || body.status || "",
            body
          });
          return;
        }

        const previousStatus = order.status;
        const previousShipmentStatus = order.fulfillment?.shipment?.status || "";
        const shipmentStatus = payload.status || body.status || order.fulfillment.shipment.status || "";
        const nextOrderStatus = shipmentStatusToOrderStatus(shipmentStatus);
        order.fulfillment.shipment = {
          ...order.fulfillment.shipment,
          status: shipmentStatus,
          waybillId:
            payload.waybill_id ||
            payload.courier_waybill_id ||
            body.waybill_id ||
            body.courier_waybill_id ||
            order.fulfillment.shipment.waybillId ||
            "",
          labelUrl:
            payload.label_url ||
            payload.shipping_label_url ||
            body.label_url ||
            body.shipping_label_url ||
            order.fulfillment.shipment.labelUrl ||
            "",
          invoiceUrl:
            payload.invoice_url ||
            payload.delivery_invoice_url ||
            body.invoice_url ||
            body.delivery_invoice_url ||
            order.fulfillment.shipment.invoiceUrl ||
            "",
          waybillUrl:
            payload.waybill_url ||
            body.waybill_url ||
            order.fulfillment.shipment.waybillUrl ||
            "",
          trackingLink:
            payload.courier?.link ||
            payload.courier_link ||
            payload.tracking_link ||
            payload.tracking_url ||
            body.courier?.link ||
            body.courier_link ||
            body.tracking_link ||
            body.tracking_url ||
            order.fulfillment.shipment.trackingLink ||
            "",
          updatedAt: new Date().toISOString(),
          lastWebhook: body
        };
        if (nextOrderStatus) {
          order.status = nextOrderStatus;
        }
        const shipmentNotificationKey = [
          "biteship",
          order.fulfillment?.shipment?.orderId || payload.order_id || body.order_id || order.id,
          String(shipmentStatus || "").toLowerCase()
        ].filter(Boolean).join(":");
        const whatsappResult = await maybeSendWhatsappOrderStatus(order, previousStatus, {
          notificationKey: previousShipmentStatus === shipmentStatus ? "" : shipmentNotificationKey
        });
        const shippingWhatsappResult = await maybeSendWhatsappShippingUpdate(order, shipmentNotificationKey);
        const adminShippingWhatsappResult = await maybeSendWhatsappShippingUpdate(order, `${shipmentNotificationKey}:admin`, { admin: true });
        const adminWhatsappResult = await maybeSendWhatsappAdminAlert(
          order,
          previousShipmentStatus === shipmentStatus ? "" : shipmentNotificationKey,
          `Biteship ${shipmentStatus || "delivery update"}`
        );
        recordBiteshipWebhookLog({
          matched: true,
          event: payload.event || body.event || "",
          identifiers: biteshipWebhookIdentifiers(body),
          orderId: order.id,
          biteshipOrderId: order.fulfillment?.shipment?.orderId || "",
          previousOrderStatus: previousStatus,
          nextOrderStatus: order.status,
          previousShipmentStatus,
          shipmentStatus,
          whatsappResult,
          shippingWhatsappResult,
          adminShippingWhatsappResult,
          adminWhatsappResult,
          body
        });
        saveOrders(ordersLivePath, stores.live.orders);
      })
      .catch((error) => {
        recordBiteshipWebhookLog({
          matched: false,
          error: error.message
        });
        console.warn("Unable to process Biteship webhook:", error.message);
      });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/public-config") {
    sendJson(response, 200, {
      googleMapsApiKey: getIntegrationConfig().googleMapsApiKey
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/session") {
    const session = currentCustomerSession(request);
    if (!session) {
      sendJson(response, 401, { error: "Not logged in" });
      return true;
    }
    sendJson(response, 200, {
      session: {
        phone: session.phone,
        verifiedAt: session.verifiedAt
      },
      profile: getCustomerProfileFromSession(session)
    });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/session/logout") {
    clearSessionCookie(response, request, CUSTOMER_SESSION_COOKIE);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/admin/session") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    sendJson(response, 200, { authenticated: true, session });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/admin/login") {
    const ipAddress = requestIpAddress(request);
    if (!checkRateLimit(`admin-login:${ipAddress}`, 10, 15 * 60 * 1000)) {
      sendJson(response, 429, { error: "Too many admin login attempts. Please try again later." });
      return true;
    }

    parseBody(request)
      .then((body) => {
        const password = String(body.password || "");
        if (!ADMIN_PASSWORD || !timingSafeEqualString(password, ADMIN_PASSWORD)) {
          sendJson(response, 401, { error: "Incorrect admin password" });
          return;
        }
        setSignedSessionCookie(response, request, ADMIN_SESSION_COOKIE, {
          role: "admin",
          createdAt: new Date().toISOString()
        }, ADMIN_SESSION_TTL_SECONDS);
        sendJson(response, 200, { ok: true });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/admin/logout") {
    clearSessionCookie(response, request, ADMIN_SESSION_COOKIE);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/menu") {
    sendJson(response, 200, {
      mode,
      store: getStoreConfig(),
      promo: catalog.promo,
      brandStory: withDefaultBrandStory(catalog.brandStory),
      categories: catalog.categories,
      items: catalog.items,
      paymentMethods: PAYMENT_METHODS,
      vouchers: DEMO_VOUCHERS
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/cart") {
    const { cartState } = getSessionCartState(mode, request, response);
    const destination = {
      lat: requestUrl.searchParams.get("lat"),
      lng: requestUrl.searchParams.get("lng"),
      routeDistanceKm: requestUrl.searchParams.get("route_km"),
      formattedAddress: requestUrl.searchParams.get("address"),
      locationNotes: requestUrl.searchParams.get("location_notes")
    };
    getCartSummaryPayload(cartState, {
      fulfillmentType: requestUrl.searchParams.get("fulfillment"),
      voucherCode: requestUrl.searchParams.get("voucher"),
      destination
    })
      .then((payload) => sendJson(response, 200, payload))
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "GET" && pathname === "/api/order") {
    const orderId = String(requestUrl.searchParams.get("id") || "").trim();
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    const order = enrichOrder(findOrder(mode, orderId));
    if (!order || !customerOwnsOrder(session, order)) {
      sendJson(response, 404, { error: "Order not found" });
      return true;
    }
    sendJson(response, 200, { order });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/order/document") {
    const orderId = String(requestUrl.searchParams.get("id") || "").trim();
    const token = String(requestUrl.searchParams.get("token") || "").trim();
    const order = findOrder(mode, orderId);
    const adminSession = currentAdminSession(request);
    const customerSession = currentCustomerSession(request);
    const tokenMatches = token && order?.receiptToken && timingSafeEqualString(token, order.receiptToken);
    const customerOwnsDocument = customerSession && order && customerOwnsOrder(customerSession, order);
    if (!order || (!tokenMatches && !adminSession && !customerOwnsDocument)) {
      sendJson(response, 404, { error: "Order document not found" });
      return true;
    }
    sendJson(response, 200, buildOrderDocument(order));
    return true;
  }

  if (request.method === "GET" && pathname === "/api/orders") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    sendJson(response, 200, {
      mode,
      orders: storeState.orders.map((order) => enrichOrder(order))
    });
    return true;
  }

  if (request.method === "POST" && pathname.startsWith("/api/admin/orders/") && pathname.endsWith("/approve-delivery")) {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    const orderId = decodeURIComponent(pathname.replace("/api/admin/orders/", "").replace("/approve-delivery", ""));
    approveOrderForDelivery(mode, orderId, session)
      .then((order) => sendJson(response, 200, { ok: true, order }))
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "GET" && pathname === "/api/customer/orders") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    const phone = formatIndonesianPhone(session.phone);
    const orders = storeState.orders
      .filter((order) => normalizePhoneNumber(order.customer.phone) === phone)
      .map((order) => enrichOrder(order));
    sendJson(response, 200, { orders });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/admin/catalog") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    sendJson(response, 200, {
      ...catalog,
      brandStory: withDefaultBrandStory(catalog.brandStory)
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/admin/integrations") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    sendJson(response, 200, readIntegrationSettings());
    return true;
  }

  if (request.method === "GET" && pathname === "/api/admin/biteship-webhook-log") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    sendJson(response, 200, {
      events: loadJsonArray(biteshipWebhookLogPath)
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/admin/whatsapp-health") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    checkWhatsappCloudConfig()
      .then((payload) => sendJson(response, payload.ok ? 200 : 400, payload))
      .catch((error) => sendJson(response, 400, { ok: false, error: error.message }));
    return true;
  }

  if (request.method === "GET" && pathname === "/api/admin/xendit-health") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    const settings = readIntegrationSettings();
    const secretKey = String(settings.xenditSecretKey || "").trim();
    sendJson(response, 200, {
      ok: Boolean(secretKey),
      present: Boolean(secretKey),
      length: secretKey.length,
      prefix: secretKey ? `${secretKey.slice(0, 14)}...` : "",
      looksLikeXenditKey: secretKey.startsWith("xnd_"),
      environment: settings.xenditEnvironment || "test",
      callbackTokenPresent: Boolean(settings.xenditCallbackToken),
      callbackToken: tokenDebug(settings.xenditCallbackToken)
    });
    return true;
  }

  if (request.method === "PUT" && pathname === "/api/admin/catalog") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    parseBody(request)
      .then((body) => {
        const saved = saveCatalog(body);
        Object.values(stores).forEach((entry) => clampAllCartsToStock(entry));
        sendJson(response, 200, { ok: true, catalog: saved });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "PUT" && pathname === "/api/admin/integrations") {
    const session = requireAdminSession(request, response);
    if (!session) {
      return true;
    }
    parseBody(request)
      .then((body) => {
        const saved = saveIntegrationSettings(body);
        sendJson(response, 200, { ok: true, integrations: saved });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/cart") {
    const { cartState } = getSessionCartState(mode, request, response);
    parseBody(request)
      .then((body) =>
        handleCartUpsert(cartState, response, body, (item, quantity) =>
          (cartState.cart.get(item.id) || 0) + quantity
        )
      )
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "PATCH" && pathname === "/api/cart") {
    const { cartState } = getSessionCartState(mode, request, response);
    parseBody(request)
      .then((body) =>
        handleCartUpsert(cartState, response, body, (_item, quantity) => quantity)
      )
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/register/start") {
    const ipAddress = requestIpAddress(request);
    parseBody(request)
      .then(async (body) => {
        const phone = formatIndonesianPhone(body.phone);
        if (!checkRateLimit(`otp-start-ip:${ipAddress}`, 8, 15 * 60 * 1000)
          || !checkRateLimit(`otp-start-phone:${phone}`, 5, 15 * 60 * 1000)) {
          sendJson(response, 429, { error: "Too many verification requests. Please try again later." });
          return;
        }
        const registration = await startRegistration(mode, storeState, body);
        sendJson(response, 200, { registration });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/register/verify") {
    const ipAddress = requestIpAddress(request);
    parseBody(request)
      .then((body) => {
        const phone = formatIndonesianPhone(body.phone);
        if (!checkRateLimit(`otp-verify-ip:${ipAddress}`, 20, 15 * 60 * 1000)
          || !checkRateLimit(`otp-verify-phone:${phone}`, 10, 15 * 60 * 1000)) {
          sendJson(response, 429, { error: "Too many verification attempts. Please try again later." });
          return;
        }
        const registration = verifyRegistration(storeState, body);
        setSignedSessionCookie(response, request, CUSTOMER_SESSION_COOKIE, {
          role: "customer",
          phone: registration.phone,
          verifiedAt: registration.verifiedAt
        }, SESSION_TTL_SECONDS);
        sendJson(response, 200, { registration });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "GET" && pathname === "/api/customer/profile") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    const profile = getCustomerProfileFromSession(session);
    if (!profile) {
      sendJson(response, 404, { error: "Customer profile not found" });
      return true;
    }
    sendJson(response, 200, { profile });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/customer/profile") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    parseBody(request)
      .then((body) => {
        const profile = saveCustomerProfile(body, session.phone);
        sendJson(response, 200, { profile });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "GET" && pathname === "/api/customer/addresses") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    sendJson(response, 200, getCustomerAddressesFromSession(session));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/customer/addresses") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    parseBody(request)
      .then((body) => {
        const result = saveCustomerAddress(body, session.phone);
        sendJson(response, 200, result);
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/customer/addresses/default") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    parseBody(request)
      .then((body) => {
        const result = setDefaultCustomerAddress(body, session.phone);
        sendJson(response, 200, result);
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/checkout") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    const { cartState } = getSessionCartState(mode, request, response);
    parseBody(request)
      .then(async (body) => {
        const order = await createOrderForSession(mode, body, session, cartState.cart);
        sendJson(response, 201, { order });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/order/payment-status") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    parseBody(request)
      .then(async (body) => {
        const order = await updateOrderPaymentStatusForSession(mode, String(body.id || "").trim(), session);
        sendJson(response, 200, { order });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/order/cancel") {
    const session = requireCustomerSession(request, response);
    if (!session) {
      return true;
    }
    parseBody(request)
      .then(async (body) => {
        const order = await cancelOrderForSession(mode, String(body.id || "").trim(), session);
        sendJson(response, 200, { order });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/xendit/invoice-callback") {
    parseBody(request)
      .then(async (body) => {
        const { xenditCallbackToken } = getIntegrationConfig();
        const expectedToken = String(xenditCallbackToken || "").trim();
        const callbackToken = String(request.headers["x-callback-token"] || "").trim();
        if (expectedToken && callbackToken !== expectedToken) {
          sendJson(response, 403, {
            error: "Invalid Xendit callback token",
            received: tokenDebug(callbackToken),
            expected: tokenDebug(expectedToken)
          });
          return;
        }

        const orderId = String(body.external_id || "").trim();
        const order = findOrder("live", orderId) || findOrder("test", orderId);
        if (!order) {
          sendJson(response, 200, {
            ok: true,
            ignored: true,
            reason: "No matching Bakeaholic order for this Xendit test callback."
          });
          return;
        }

        const previousStatus = order.status;
        applyXenditInvoiceStatusToOrder(order, body);
        if (order.status !== "awaiting_payment") {
          clearPaymentReminderTimers(order.mode || "live", order.id);
        }
        if (previousStatus !== order.status) {
          if (order.status === "paid") {
            await maybeSendWhatsappOrderStatus(order, previousStatus);
            await maybeSendWhatsappPaymentReceipt(order, `order:${order.id}:receipt`);
          } else if (order.status === "expired") {
            order.expiredAt = order.expiredAt || new Date().toISOString();
            order.paymentReminderFlow = {
              ...paymentReminderFlowTimes(order.createdAt),
              ...(order.paymentReminderFlow || {}),
              expiredAt: order.expiredAt
            };
            if (order.mode !== "test" && isWhatsappCloudReady() && process.env.WHATSAPP_PAYMENT_EXPIRED_TEMPLATE_NAME) {
              try {
                const expiredResponse = await sendWhatsappPaymentExpired(order);
                order.paymentReminderFlow.expiredMessageSentAt = new Date().toISOString();
                order.paymentReminderFlow.expiredMessageId = expiredResponse?.messages?.[0]?.id || "";
                delete order.paymentReminderFlow.expiredError;
              } catch (error) {
                order.paymentReminderFlow.expiredError = error.message;
              }
            }
          } else {
            await maybeSendWhatsappOrderStatus(order, previousStatus);
          }
          await maybeSendWhatsappAdminAlert(order, `order:${order.id}:xendit:${order.status}`, humanizeOrderStatus(order));
        }
        saveOrders(ordersPathForMode(order.mode || "live"), getStoreState(order.mode || "live").orders);
        sendJson(response, 200, { ok: true });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/reset") {
    if (mode !== "test") {
      sendJson(response, 403, { error: "Reset is only available in test mode" });
      return true;
    }

    resetStore(mode);
    sendJson(response, 200, { ok: true });
    return true;
  }

  return false;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const normalizedPathname = requestUrl.pathname.replace(/\/+$/, "") || "/";
  const isPublicWebhookPath = normalizedPathname === "/webhooks/biteship" || normalizedPathname === "/biteship-webhook";
  const isBareBiteshipPingPath = normalizedPathname === "/biteship-ok";

  if (isBareBiteshipPingPath) {
    sendBareOk(response);
    return;
  }
  if (normalizedPathname === "/biteship-OK") {
    sendBareUpperOk(response);
    return;
  }
  if (normalizedPathname === "/biteship-json-ok") {
    sendBareJsonOk(response);
    return;
  }
  if (normalizedPathname === "/biteship-204") {
    sendBareNoContent(response);
    return;
  }

  if (requestUrl.pathname.startsWith("/api/") || isPublicWebhookPath) {
    const handled = handleApi(requestUrl, request, response);
    if (!handled) {
      sendJson(response, 404, { error: "Not found" });
    }
    return;
  }

  const relativePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const targetPath = path.normalize(path.join(rootDir, relativePath));
  const fileName = path.basename(targetPath);
  if (!targetPath.startsWith(rootDir)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }
  if (
    fileName.startsWith(".")
    || targetPath === envPath
    || targetPath.startsWith(path.join(rootDir, "data"))
  ) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  sendFile(response, targetPath);
});

server.listen(port, host, () => {
  scheduleExistingPendingAdminActions();
  scheduleExistingPaymentReminderFlows();
  console.log(`Bakeaholic order app running at http://${host}:${port}`);
});
