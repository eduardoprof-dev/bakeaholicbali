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
const customersPath = path.join(dataDir, "customers.json");
const ordersLivePath = path.join(dataDir, "orders-live.json");
const ordersTestPath = path.join(dataDir, "orders-test.json");
const PAYMENT_METHODS = [
  { id: "qris", label: "QRIS", kind: "qris", logoText: "QRIS" },
  { id: "bca-va", label: "BCA Virtual Account", kind: "va", bankCode: "014", logoText: "BCA" }
];

const DEMO_VOUCHERS = [
  { code: "SWEET10", label: "10% off subtotal", type: "percent", value: 10, maxDiscount: 15000 },
  { code: "FREESHIP", label: "Free delivery", type: "delivery", value: 0 }
];

function loadCatalog() {
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
    "MIDTRANS_SERVER_KEY",
    "MIDTRANS_CLIENT_KEY",
    "MIDTRANS_ENVIRONMENT",
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "WHATSAPP_VERIFY_TOKEN",
    "WHATSAPP_APP_ID",
    "WHATSAPP_APP_SECRET",
    "WHATSAPP_OTP_TEMPLATE_NAME",
    "WHATSAPP_ORDER_TEMPLATE_NAME",
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

function getIntegrationConfig() {
  return {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    biteshipApiKey: process.env.BITESHIP_API_KEY || "",
    biteshipCouriers: process.env.BITESHIP_COURIERS || "gojek,grab",
    midtransServerKey: process.env.MIDTRANS_SERVER_KEY || "",
    midtransClientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    midtransEnvironment: process.env.MIDTRANS_ENVIRONMENT === "production" ? "production" : "sandbox",
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
    whatsappAppId: process.env.WHATSAPP_APP_ID || "",
    whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || "",
    whatsappOtpTemplateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME || "",
    whatsappOrderTemplateName: process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "",
    whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en"
  };
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

async function sendWhatsappTemplateMessage(to, templateName, parameters = []) {
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

  const payload = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en"
      }
    }
  };

  if (bodyParameters.length) {
    payload.template.components = [
      {
        type: "body",
        parameters: bodyParameters
      }
    ];
  }

  const response = await fetch(whatsappMessagesUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  const parsed = parseJsonSafely(responseText, {});
  if (!response.ok) {
    const message =
      parsed?.error?.message ||
      `WhatsApp message failed with status ${response.status}`;
    throw new Error(message);
  }

  return parsed;
}

async function sendWhatsappOtpCode(phone, code) {
  const templateName = String(process.env.WHATSAPP_OTP_TEMPLATE_NAME || "").trim();
  if (!templateName) {
    throw new Error("WHATSAPP_OTP_TEMPLATE_NAME is not configured");
  }

  return sendWhatsappTemplateMessage(phone, templateName, [code]);
}

function humanizeOrderStatus(order) {
  switch (order.status) {
    case "awaiting_payment":
      return "Awaiting payment";
    case "paid":
      return "Payment received";
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

async function sendWhatsappOrderUpdate(order) {
  const templateName = String(process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "").trim();
  if (!templateName) {
    throw new Error("WHATSAPP_ORDER_TEMPLATE_NAME is not configured");
  }

  return sendWhatsappTemplateMessage(order.customer.phone, templateName, [
    order.id,
    humanizeOrderStatus(order),
    `Rp ${order.pricing.total}`
  ]);
}

async function maybeSendWhatsappOrderStatus(order, previousStatus = "") {
  if (
    order.mode === "test" ||
    !isWhatsappCloudReady() ||
    !process.env.WHATSAPP_ORDER_TEMPLATE_NAME ||
    previousStatus === order.status ||
    order.whatsappNotifications?.lastStatusSent === order.status
  ) {
    return;
  }

  try {
    await sendWhatsappOrderUpdate(order);
    order.whatsappNotifications = {
      ...order.whatsappNotifications,
      lastStatusSent: order.status,
      lastSentAt: new Date().toISOString()
    };
    delete order.whatsappNotificationError;
  } catch (error) {
    order.whatsappNotificationError = error.message;
  }
}

function readIntegrationSettings() {
  const envMap = loadEnvMap(envPath);
  const config = getIntegrationConfig();
  return {
    googleMapsApiKey: envMap.GOOGLE_MAPS_API_KEY || config.googleMapsApiKey,
    biteshipApiKey: envMap.BITESHIP_API_KEY || config.biteshipApiKey,
    biteshipCouriers: envMap.BITESHIP_COURIERS || config.biteshipCouriers,
    midtransServerKey: envMap.MIDTRANS_SERVER_KEY || config.midtransServerKey,
    midtransClientKey: envMap.MIDTRANS_CLIENT_KEY || config.midtransClientKey,
    midtransEnvironment: envMap.MIDTRANS_ENVIRONMENT || config.midtransEnvironment,
    whatsappAccessToken: envMap.WHATSAPP_ACCESS_TOKEN || config.whatsappAccessToken,
    whatsappPhoneNumberId: envMap.WHATSAPP_PHONE_NUMBER_ID || config.whatsappPhoneNumberId,
    whatsappBusinessAccountId: envMap.WHATSAPP_BUSINESS_ACCOUNT_ID || config.whatsappBusinessAccountId,
    whatsappVerifyToken: envMap.WHATSAPP_VERIFY_TOKEN || config.whatsappVerifyToken,
    whatsappAppId: envMap.WHATSAPP_APP_ID || config.whatsappAppId,
    whatsappAppSecret: envMap.WHATSAPP_APP_SECRET || config.whatsappAppSecret,
    whatsappOtpTemplateName: envMap.WHATSAPP_OTP_TEMPLATE_NAME || config.whatsappOtpTemplateName,
    whatsappOrderTemplateName: envMap.WHATSAPP_ORDER_TEMPLATE_NAME || config.whatsappOrderTemplateName,
    whatsappTemplateLanguage: envMap.WHATSAPP_TEMPLATE_LANGUAGE || config.whatsappTemplateLanguage
  };
}

function saveIntegrationSettings(input = {}) {
  const existingEnvMap = loadEnvMap(envPath);
  const nextSettings = {
    googleMapsApiKey: String(input.googleMapsApiKey || "").trim(),
    biteshipApiKey: String(input.biteshipApiKey || "").trim(),
    biteshipCouriers: String(input.biteshipCouriers || "gojek,grab")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
      .join(",") || "gojek,grab",
    midtransServerKey: String(input.midtransServerKey || "").trim(),
    midtransClientKey: String(input.midtransClientKey || "").trim(),
    midtransEnvironment: String(input.midtransEnvironment || "sandbox") === "production"
      ? "production"
      : "sandbox",
    whatsappAccessToken: String(input.whatsappAccessToken || "").trim(),
    whatsappPhoneNumberId: String(input.whatsappPhoneNumberId || "").trim(),
    whatsappBusinessAccountId: String(input.whatsappBusinessAccountId || "").trim(),
    whatsappVerifyToken: String(input.whatsappVerifyToken || "").trim(),
    whatsappAppId: String(input.whatsappAppId || "").trim(),
    whatsappAppSecret: String(input.whatsappAppSecret || "").trim(),
    whatsappOtpTemplateName: String(input.whatsappOtpTemplateName || "").trim(),
    whatsappOrderTemplateName: String(input.whatsappOrderTemplateName || "").trim(),
    whatsappTemplateLanguage: String(input.whatsappTemplateLanguage || "en").trim() || "en"
  };

  writeEnvMap(envPath, {
    ...existingEnvMap,
    GOOGLE_MAPS_API_KEY: nextSettings.googleMapsApiKey,
    BITESHIP_API_KEY: nextSettings.biteshipApiKey,
    BITESHIP_COURIERS: nextSettings.biteshipCouriers,
    MIDTRANS_SERVER_KEY: nextSettings.midtransServerKey,
    MIDTRANS_CLIENT_KEY: nextSettings.midtransClientKey,
    MIDTRANS_ENVIRONMENT: nextSettings.midtransEnvironment,
    WHATSAPP_ACCESS_TOKEN: nextSettings.whatsappAccessToken,
    WHATSAPP_PHONE_NUMBER_ID: nextSettings.whatsappPhoneNumberId,
    WHATSAPP_BUSINESS_ACCOUNT_ID: nextSettings.whatsappBusinessAccountId,
    WHATSAPP_VERIFY_TOKEN: nextSettings.whatsappVerifyToken,
    WHATSAPP_APP_ID: nextSettings.whatsappAppId,
    WHATSAPP_APP_SECRET: nextSettings.whatsappAppSecret,
    WHATSAPP_OTP_TEMPLATE_NAME: nextSettings.whatsappOtpTemplateName,
    WHATSAPP_ORDER_TEMPLATE_NAME: nextSettings.whatsappOrderTemplateName,
    WHATSAPP_TEMPLATE_LANGUAGE: nextSettings.whatsappTemplateLanguage
  });

  process.env.GOOGLE_MAPS_API_KEY = nextSettings.googleMapsApiKey;
  process.env.BITESHIP_API_KEY = nextSettings.biteshipApiKey;
  process.env.BITESHIP_COURIERS = nextSettings.biteshipCouriers;
  process.env.MIDTRANS_SERVER_KEY = nextSettings.midtransServerKey;
  process.env.MIDTRANS_CLIENT_KEY = nextSettings.midtransClientKey;
  process.env.MIDTRANS_ENVIRONMENT = nextSettings.midtransEnvironment;
  process.env.WHATSAPP_ACCESS_TOKEN = nextSettings.whatsappAccessToken;
  process.env.WHATSAPP_PHONE_NUMBER_ID = nextSettings.whatsappPhoneNumberId;
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = nextSettings.whatsappBusinessAccountId;
  process.env.WHATSAPP_VERIFY_TOKEN = nextSettings.whatsappVerifyToken;
  process.env.WHATSAPP_APP_ID = nextSettings.whatsappAppId;
  process.env.WHATSAPP_APP_SECRET = nextSettings.whatsappAppSecret;
  process.env.WHATSAPP_OTP_TEMPLATE_NAME = nextSettings.whatsappOtpTemplateName;
  process.env.WHATSAPP_ORDER_TEMPLATE_NAME = nextSettings.whatsappOrderTemplateName;
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

function ordersPathForMode(mode) {
  return mode === "test" ? ordersTestPath : ordersLivePath;
}

const stores = {
  live: {
    cart: new Map(),
    orders: loadOrders(ordersLivePath),
    registrations: new Map()
  },
  test: {
    cart: new Map(),
    orders: loadOrders(ordersTestPath),
    registrations: new Map()
  }
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
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
      "Cache-Control": "no-store"
    });
    response.end(content);
  });
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (_error) {
        reject(new Error("Invalid JSON body"));
      }
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
    integrations: {
      googleMapsApiKey: integrationConfig.googleMapsApiKey,
      biteshipEnabled: Boolean(integrationConfig.biteshipApiKey),
      biteshipCouriers: integrationConfig.biteshipCouriers,
      liveQuoteProvider: integrationConfig.biteshipApiKey ? "Biteship Rates API" : "",
      midtransEnabled: Boolean(integrationConfig.midtransServerKey),
      midtransEnvironment: integrationConfig.midtransEnvironment
    }
  };
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

function saveCustomerProfile(input = {}) {
  const phone = formatIndonesianPhone(input.phone);
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

function saveCustomerAddress(input = {}) {
  const phone = formatIndonesianPhone(input.phone);
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

function setDefaultCustomerAddress(input = {}) {
  const phone = formatIndonesianPhone(input.phone);
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

function normalizeCheckoutDraft(input = {}) {
  const customer = normalizeCustomerDetails(input.customer);
  const fulfillmentType = "delivery";
  const paymentMethodId = String(input.paymentMethodId || "qris").trim() || "qris";

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

function sanitizeCatalog(nextCatalog) {
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
    if (destination.lat != null && destination.lng != null) {
      const kitchen = {
        lat: store.kitchenLat,
        lng: store.kitchenLng
      };
      const routeDistanceKm = estimateRoadDistanceKm(
        kitchen,
        destination,
        destination.routeDistanceKm
      );
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

function midtransBaseUrl() {
  const { midtransEnvironment } = getIntegrationConfig();
  return midtransEnvironment === "production"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

function midtransAuthHeader() {
  const { midtransServerKey } = getIntegrationConfig();
  return `Basic ${Buffer.from(`${midtransServerKey}:`).toString("base64")}`;
}

function isMidtransReady() {
  return Boolean(getIntegrationConfig().midtransServerKey);
}

function midtransPaymentType(methodId) {
  if (methodId === "bca-va") return "bank_transfer";
  if (methodId === "qris") return "qris";
  return "";
}

function buildMidtransItems(order) {
  const items = order.lineItems.map((entry) => ({
    id: entry.itemId,
    name: entry.item.name.slice(0, 50),
    price: entry.item.price,
    quantity: entry.quantity
  }));

  if (order.pricing.deliveryFee > 0) {
    items.push({
      id: "delivery",
      name: "Delivery fee",
      price: order.pricing.deliveryFee,
      quantity: 1
    });
  }

  if (order.pricing.tax > 0) {
    items.push({
      id: "pb1-tax",
      name: "PB1 Government Tax",
      price: order.pricing.tax,
      quantity: 1
    });
  }

  if (order.pricing.discount.amount > 0) {
    items.push({
      id: "discount",
      name: `Discount ${order.pricing.discount.code || ""}`.trim(),
      price: -order.pricing.discount.amount,
      quantity: 1
    });
  }

  return items;
}

async function createMidtransCharge(order) {
  if (!isMidtransReady()) {
    return null;
  }

  const paymentType = midtransPaymentType(order.payment.id);
  if (!paymentType) {
    return null;
  }

  const body = {
    payment_type: paymentType,
    transaction_details: {
      order_id: order.id,
      gross_amount: order.pricing.total
    },
    customer_details: {
      first_name: order.customer.firstName || order.customer.name || "Bakeaholic customer",
      last_name: order.customer.lastName || undefined,
      phone: order.customer.phone || undefined,
      email: order.customer.email || undefined,
      shipping_address: {
        first_name: order.customer.firstName || order.customer.name || "Bakeaholic customer",
        last_name: order.customer.lastName || undefined,
        phone: order.customer.phone || undefined,
        address: order.fulfillment.address || undefined
      }
    },
    item_details: buildMidtransItems(enrichOrder(order))
  };

  if (order.payment.id === "bca-va") {
    body.bank_transfer = {
      bank: "bca"
    };
  }

  if (order.payment.id === "qris") {
    body.qris = {
      acquirer: "gopay"
    };
  }

  const response = await fetch(`${midtransBaseUrl()}/v2/charge`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: midtransAuthHeader()
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(async () => ({ raw: await response.text() }));
  if (!response.ok) {
    throw new Error(payload.status_message || payload.error_messages?.join(", ") || "Midtrans charge failed");
  }

  return payload;
}

function applyMidtransChargeToPayment(payment, charge) {
  if (!charge) {
    return payment;
  }

  const actions = Array.isArray(charge.actions) ? charge.actions : [];
  const qrAction = actions.find((action) => action.name === "generate-qr-code")
    || actions.find((action) => String(action.name || "").includes("qr"));
  const deeplinkAction = actions.find((action) => action.name === "deeplink-redirect");
  const vaNumber = charge.va_numbers?.[0]?.va_number || charge.permata_va_number || "";

  return {
    ...payment,
    provider: "midtrans",
    status: charge.transaction_status || "pending",
    transactionId: charge.transaction_id || "",
    fraudStatus: charge.fraud_status || "",
    qrCodeData: qrAction?.url || payment.qrCodeData,
    deeplinkUrl: deeplinkAction?.url || "",
    accountNumber: vaNumber || payment.accountNumber,
    rawStatus: charge.status_code || "",
    instructions: payment.kind === "qris"
      ? "Scan this dynamic QRIS code with any QRIS-compatible banking or e-wallet app."
      : "Pay this BCA Virtual Account number from BCA mobile, KlikBCA, ATM, or supported transfer channels."
  };
}

async function fetchMidtransStatus(order) {
  if (!isMidtransReady() || order.payment.provider !== "midtrans") {
    return null;
  }

  const response = await fetch(`${midtransBaseUrl()}/v2/${encodeURIComponent(order.id)}/status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: midtransAuthHeader()
    }
  });

  const payload = await response.json().catch(async () => ({ raw: await response.text() }));
  if (!response.ok) {
    throw new Error(payload.status_message || payload.error_messages?.join(", ") || "Unable to check Midtrans status");
  }

  return payload;
}

function verifyMidtransSignature(payload) {
  const { midtransServerKey } = getIntegrationConfig();
  if (!midtransServerKey) {
    return false;
  }

  const signatureSource = [
    payload.order_id,
    payload.status_code,
    payload.gross_amount,
    midtransServerKey
  ].join("");
  const expectedSignature = crypto
    .createHash("sha512")
    .update(signatureSource)
    .digest("hex");
  return expectedSignature === payload.signature_key;
}

function applyMidtransStatusToOrder(order, payload) {
  order.payment = applyMidtransChargeToPayment(order.payment, payload);
  const successfulStatuses = new Set(["capture", "settlement"]);
  const failedStatuses = new Set(["deny", "cancel", "expire", "failure"]);

  if (successfulStatuses.has(payload.transaction_status)) {
    order.status = "paid";
    order.payment.status = "paid";
    order.paidAt = new Date().toISOString();
  } else if (failedStatuses.has(payload.transaction_status)) {
    order.status = payload.transaction_status === "expire" ? "expired" : "payment_failed";
    order.payment.status = order.status;
  } else {
    order.status = "awaiting_payment";
    order.payment.status = payload.transaction_status || "pending";
  }

  order.whatsappUrl = buildWhatsappUrl(order);
  return order;
}

function buildPaymentDetails(orderId, methodId, total) {
  const method = PAYMENT_METHODS.find((entry) => entry.id === methodId) || PAYMENT_METHODS[1];
  if (method.kind === "qris") {
    return {
      ...method,
      status: "pending",
      qrCodeData: generateQrSvgData(`${orderId}:${total}`),
      instructions:
        "Scan the QR code with your mobile banking app or e-wallet to complete payment."
    };
  }

  if (method.kind === "va") {
    const base = `${method.bankCode}${String(makeNumericSeed(orderId)).padStart(13, "0")}`;
    return {
      ...method,
      status: "pending",
      accountNumber: base.slice(0, 16),
      instructions: `Please only submit your virtual account payment directly from your account at ${method.logoText}.`
    };
  }

  return {
    ...method,
    status: "pending",
    maskedCard: `•••• ${String(makeNumericSeed(orderId)).slice(-4).padStart(4, "0")}`,
    instructions: "Use this placeholder card method in test mode to continue the ordering flow."
  };
}

function enrichOrder(order) {
  if (!order) return null;
  return {
    ...order,
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
  lines.push(`PB1 Tax: Rp ${order.pricing.tax}`);
  if (order.pricing.discount.amount > 0) {
    lines.push(`Discount (${order.pricing.discount.code}): -Rp ${order.pricing.discount.amount}`);
  }
  lines.push(`Total: Rp ${order.pricing.total}`);
  lines.push(`Status: ${order.status}`);

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
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

async function createOrder(mode, payload) {
  const draft = normalizeCheckoutDraft(payload);
  const storeState = getStoreState(mode);
  const summary = await getCartSummaryPayload(storeState, {
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

  const order = {
    id: orderId,
    mode,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    status: "awaiting_payment",
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

  const midtransCharge = await createMidtransCharge(enrichOrder(order));
  order.payment = applyMidtransChargeToPayment(order.payment, midtransCharge);
  order.whatsappUrl = buildWhatsappUrl(order);
  order.whatsappNotifications = {
    lastStatusSent: "",
    lastSentAt: ""
  };

  await maybeSendWhatsappOrderStatus(order, "");

  storeState.orders.unshift(order);
  saveOrders(ordersPathForMode(mode), storeState.orders);
  storeState.cart.clear();
  return enrichOrder(order);
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

  const midtransStatus = await fetchMidtransStatus(order);
  if (midtransStatus) {
    applyMidtransStatusToOrder(order, midtransStatus);
  } else {
    order.status = "paid";
    order.payment.status = "paid";
    order.paidAt = new Date().toISOString();
    order.whatsappUrl = buildWhatsappUrl(order);
  }

  await maybeSendWhatsappOrderStatus(order, previousStatus);

  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  return enrichOrder(order);
}

async function cancelOrder(mode, orderId) {
  const order = findOrder(mode, orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  order.payment.status = "cancelled";
  order.whatsappUrl = buildWhatsappUrl(order);

  await maybeSendWhatsappOrderStatus(order, "");

  saveOrders(ordersPathForMode(mode), getStoreState(mode).orders);
  return enrichOrder(order);
}

function resetStore(mode) {
  const storeState = getStoreState(mode);
  storeState.cart.clear();
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

  if (request.method === "GET" && pathname === "/api/menu") {
    sendJson(response, 200, {
      mode,
      store: getStoreConfig(),
      promo: catalog.promo,
      categories: catalog.categories,
      items: catalog.items,
      paymentMethods: PAYMENT_METHODS,
      vouchers: DEMO_VOUCHERS
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/cart") {
    const destination = {
      lat: requestUrl.searchParams.get("lat"),
      lng: requestUrl.searchParams.get("lng"),
      routeDistanceKm: requestUrl.searchParams.get("route_km"),
      formattedAddress: requestUrl.searchParams.get("address"),
      locationNotes: requestUrl.searchParams.get("location_notes")
    };
    getCartSummaryPayload(storeState, {
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
    const order = enrichOrder(findOrder(mode, orderId));
    if (!order) {
      sendJson(response, 404, { error: "Order not found" });
      return true;
    }
    sendJson(response, 200, { order });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/orders") {
    sendJson(response, 200, {
      mode,
      orders: storeState.orders.map((order) => enrichOrder(order))
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/customer/orders") {
    const phone = formatIndonesianPhone(requestUrl.searchParams.get("phone"));
    const orders = phone
      ? storeState.orders
          .filter((order) => normalizePhoneNumber(order.customer.phone) === phone)
          .map((order) => enrichOrder(order))
      : [];
    sendJson(response, 200, { orders });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/admin/catalog") {
    sendJson(response, 200, catalog);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/admin/integrations") {
    sendJson(response, 200, readIntegrationSettings());
    return true;
  }

  if (request.method === "PUT" && pathname === "/api/admin/catalog") {
    parseBody(request)
      .then((body) => {
        const saved = saveCatalog(body);
        Object.values(stores).forEach((entry) => clampCartToStock(entry));
        sendJson(response, 200, { ok: true, catalog: saved });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "PUT" && pathname === "/api/admin/integrations") {
    parseBody(request)
      .then((body) => {
        const saved = saveIntegrationSettings(body);
        sendJson(response, 200, { ok: true, integrations: saved });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/cart") {
    parseBody(request)
      .then((body) =>
        handleCartUpsert(storeState, response, body, (item, quantity) =>
          (storeState.cart.get(item.id) || 0) + quantity
        )
      )
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "PATCH" && pathname === "/api/cart") {
    parseBody(request)
      .then((body) =>
        handleCartUpsert(storeState, response, body, (_item, quantity) => quantity)
      )
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/register/start") {
    parseBody(request)
      .then(async (body) => {
        const registration = await startRegistration(mode, storeState, body);
        sendJson(response, 200, { registration });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/register/verify") {
    parseBody(request)
      .then((body) => {
        const registration = verifyRegistration(storeState, body);
        sendJson(response, 200, { registration });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "GET" && pathname === "/api/customer/profile") {
    const phone = requestUrl.searchParams.get("phone");
    const profile = getCustomerProfile(phone);
    if (!profile) {
      sendJson(response, 404, { error: "Customer profile not found" });
      return true;
    }
    sendJson(response, 200, { profile });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/customer/profile") {
    parseBody(request)
      .then((body) => {
        const profile = saveCustomerProfile(body);
        sendJson(response, 200, { profile });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "GET" && pathname === "/api/customer/addresses") {
    const phone = requestUrl.searchParams.get("phone");
    sendJson(response, 200, getCustomerAddresses(phone));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/customer/addresses") {
    parseBody(request)
      .then((body) => {
        const result = saveCustomerAddress(body);
        sendJson(response, 200, result);
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/customer/addresses/default") {
    parseBody(request)
      .then((body) => {
        const result = setDefaultCustomerAddress(body);
        sendJson(response, 200, result);
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/checkout") {
    parseBody(request)
      .then(async (body) => {
        const order = await createOrder(mode, body);
        sendJson(response, 201, { order });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/order/payment-status") {
    parseBody(request)
      .then(async (body) => {
        const order = await updateOrderPaymentStatus(mode, String(body.id || "").trim());
        sendJson(response, 200, { order });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/order/cancel") {
    parseBody(request)
      .then(async (body) => {
        const order = await cancelOrder(mode, String(body.id || "").trim());
        sendJson(response, 200, { order });
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
    return true;
  }

  if (request.method === "POST" && pathname === "/api/midtrans/notification") {
    parseBody(request)
      .then(async (body) => {
        if (!verifyMidtransSignature(body)) {
          sendJson(response, 403, { error: "Invalid Midtrans signature" });
          return;
        }

        const orderId = String(body.order_id || "").trim();
        const order = findOrder("live", orderId) || findOrder("test", orderId);
        if (!order) {
          sendJson(response, 404, { error: "Order not found" });
          return;
        }

        const previousStatus = order.status;
        applyMidtransStatusToOrder(order, body);
        await maybeSendWhatsappOrderStatus(order, previousStatus);
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

  if (requestUrl.pathname.startsWith("/api/")) {
    const handled = handleApi(requestUrl, request, response);
    if (!handled) {
      sendJson(response, 404, { error: "Not found" });
    }
    return;
  }

  const relativePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const targetPath = path.normalize(path.join(rootDir, relativePath));
  if (!targetPath.startsWith(rootDir)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  sendFile(response, targetPath);
});

server.listen(port, host, () => {
  console.log(`Bakeaholic order app running at http://${host}:${port}`);
});
