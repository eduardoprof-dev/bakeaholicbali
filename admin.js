const params = new URLSearchParams(window.location.search);
const appMode = params.get("mode") === "test" ? "test" : "live";

const state = {
  catalog: null,
  orders: [],
  vouchers: []
};

const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const saveCatalogButton = document.getElementById("saveCatalogButton");
const saveIntegrationsButton = document.getElementById("saveIntegrationsButton");
const addProductButton = document.getElementById("addProductButton");
const adminLogoutButton = document.getElementById("adminLogoutButton");
const adminStatus = document.getElementById("adminStatus");
const adminLoginPanel = document.getElementById("adminLoginPanel");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminLoginButton = document.getElementById("adminLoginButton");
const categoryList = document.getElementById("categoryList");
const productList = document.getElementById("productList");
const adminOrderList = document.getElementById("adminOrderList");
const refreshOrdersButton = document.getElementById("refreshOrdersButton");
const voucherList = document.getElementById("voucherList");
const addVoucherButton = document.getElementById("addVoucherButton");
const saveVouchersButton = document.getElementById("saveVouchersButton");
const adminSectionSelect = document.getElementById("adminSectionSelect");
const adminNavButtons = document.querySelectorAll("[data-admin-target]");
const adminSections = document.querySelectorAll("[data-admin-section]");
const catalogActionSections = new Set(["store", "promo", "story", "categories", "catalog"]);

const storeFields = {
  name: document.getElementById("storeName"),
  orderWhatsapp: document.getElementById("orderWhatsapp"),
  eyebrow: document.getElementById("storeEyebrowInput"),
  perkLabel: document.getElementById("perkLabelInput"),
  perkTitle: document.getElementById("perkTitleInput"),
  perkDescription: document.getElementById("perkDescriptionInput"),
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
  businessHoursTimezone: document.getElementById("businessHoursTimezoneInput")
};
const numericStoreFields = new Set(["deliveryFee", "taxRate", "kitchenLat", "kitchenLng"]);
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
  adminSections.forEach((section) => {
    section.hidden = section.dataset.adminSection !== sectionName;
  });
  adminNavButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminTarget === sectionName);
  });
  saveCatalogButton.hidden = !catalogActionSections.has(sectionName);
  addProductButton.hidden = sectionName !== "catalog";
  if (adminSectionSelect) {
    adminSectionSelect.value = sectionName;
  }
  if (sectionName === "orders") {
    loadOrders();
  }
  if (sectionName === "store" && kitchenMapState.mapsApi && kitchenMapState.map) {
    window.setTimeout(() => {
      kitchenMapState.mapsApi.event.trigger(kitchenMapState.map, "resize");
      syncKitchenMapFromFields();
    }, 0);
  }
}

function renderIntegrations(integrations) {
  Object.entries(integrationFields).forEach(([key, field]) => {
    if (secretIntegrationKeys.has(key)) {
      field.value = "";
      field.placeholder = integrations?.[key] ? "Saved. Leave blank to keep current value." : "";
      return;
    }
    field.value = integrations?.[key] || "";
  });
}

function renderStore() {
  Object.entries(storeFields).forEach(([key, field]) => {
    field.value = state.catalog.store[key] || "";
  });
  syncKitchenMapFromFields();
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
    const canApprove = order.status === "paid"
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
      ? `<button class="admin-button" type="button" data-approve-delivery="${escapeHtml(order.id)}">Approve delivery</button>`
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
      order.adminWhatsappNotificationError ? `Admin alert WhatsApp: ${order.adminWhatsappNotificationError}` : ""
    ].filter(Boolean);
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
          <a class="admin-button secondary" href="${escapeHtml(order.documentUrl || "#")}" target="_blank" rel="noreferrer">Print invoice</a>
          <a class="admin-button secondary" href="${escapeHtml(order.whatsappUrl || "#")}" target="_blank" rel="noreferrer">WhatsApp handoff</a>
          ${deliveryActions}
        </div>
        ${notificationErrors.length ? `<p class="admin-delivery-note status-negative">${notificationErrors.map(escapeHtml).join("<br>")}</p>` : ""}
        ${isDeliveryIssue ? `<p class="admin-delivery-note">The courier booking was cancelled. Payment is still paid. Rebook after correcting the pickup location, or process a refund through the verified refund workflow.</p>` : ""}
      </article>
    `;
  }).join("");
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

  return defaults.map((fallback, index) => {
    const slide = slides[index] || fallback;
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

function storyIconOptionsMarkup(selectedIcon) {
  return storyIconOptions
    .map((option) => `
      <option value="${option.value}" ${option.value === selectedIcon ? "selected" : ""}>${option.label}</option>
    `)
    .join("");
}

function storySlideMarkup(slide, index) {
  const points = [0, 1, 2].map((pointIndex) => normalizeStoryPoint(slide.points?.[pointIndex]));
  return `
    <article class="story-slide-editor-card" data-story-slide-index="${index}">
      <h3>Slide ${index + 1}</h3>
      <div class="admin-grid">
        <div class="admin-field">
          <label>Small label</label>
          <input data-story-field="kicker" type="text" value="${escapeHtml(slide.kicker || "")}" />
        </div>
        <div class="admin-field">
          <label>Image path</label>
          <input class="admin-code-input" data-story-field="imagePath" type="text" value="${escapeHtml(slide.imagePath || "")}" />
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
          <select data-story-point-icon="0">${storyIconOptionsMarkup(points[0].icon)}</select>
        </div>
        <div class="admin-field">
          <label>Note 2</label>
          <input data-story-point-label="1" type="text" value="${escapeHtml(points[1].label)}" />
        </div>
        <div class="admin-field">
          <label>Icon 2</label>
          <select data-story-point-icon="1">${storyIconOptionsMarkup(points[1].icon)}</select>
        </div>
        <div class="admin-field">
          <label>Note 3</label>
          <input data-story-point-label="2" type="text" value="${escapeHtml(points[2].label)}" />
        </div>
        <div class="admin-field">
          <label>Icon 3</label>
          <select data-story-point-icon="2">${storyIconOptionsMarkup(points[2].icon)}</select>
        </div>
        <div class="admin-field admin-image-preview-field">
          <label>Slide image preview</label>
          <div class="admin-image-preview-frame wide">
            <img class="admin-image-preview" data-story-preview src="${escapeHtml(slide.imagePath || defaultBrandStory().imagePath)}" alt="Homepage carousel preview" />
          </div>
        </div>
      </div>
    </article>
  `;
}

function syncBrandStoryPreview(card) {
  const preview = card?.querySelector("[data-story-preview]");
  const imageInput = card?.querySelector('[data-story-field="imagePath"]');
  if (!preview || !imageInput) return;
  preview.src = imageInput.value.trim() || defaultBrandStory().imagePath;
}

function renderBrandStory() {
  const story = {
    ...defaultBrandStory(),
    ...(state.catalog.brandStory || {})
  };
  const slides = normalizeBrandStorySlides(story);
  brandStorySlideList.innerHTML = slides.map((slide, index) => storySlideMarkup(slide, index)).join("");
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
  return `object-fit: ${normalizeImageFit(product.imageFit)}; object-position: ${normalizeImagePosition(product.imagePosition)};`;
}

function categoryMarkup(category, index) {
  return `
    <article class="product-editor-card" data-category-index="${index}">
      <div class="admin-grid three">
        <div class="admin-field">
          <label>Category id</label>
          <input data-category-field="id" type="text" value="${category.id || ""}" />
        </div>
        <div class="admin-field">
          <label>Label</label>
          <input data-category-field="label" type="text" value="${category.label || ""}" />
        </div>
        <div class="admin-field">
          <label>Description</label>
          <input data-category-field="description" type="text" value="${category.description || ""}" />
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
    <article class="product-editor-card" data-product-index="${index}">
      <div class="product-editor-head">
        <h3>${product.name || "New product"}</h3>
        <button class="admin-button secondary" type="button" data-remove-product="${index}">Remove</button>
      </div>
      <div class="admin-grid three">
        <div class="admin-field">
          <label>Product id</label>
          <input data-product-field="id" type="text" value="${product.id || ""}" />
        </div>
        <div class="admin-field">
          <label>Name</label>
          <input data-product-field="name" type="text" value="${product.name || ""}" />
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
          <input data-product-field="badge" type="text" value="${product.badge || ""}" />
        </div>
        <div class="admin-field">
          <label>SKU</label>
          <input data-product-field="sku" type="text" value="${product.sku || ""}" />
        </div>
        <div class="admin-field">
          <label>Barcode</label>
          <input data-product-field="barcode" type="text" value="${product.barcode || ""}" />
        </div>
        <div class="admin-field">
          <label>Image path</label>
          <input class="admin-code-input" data-product-field="imagePath" type="text" value="${product.imagePath || ""}" />
        </div>
        <div class="admin-field">
          <label>Image fit</label>
          <select data-product-field="imageFit">
            <option value="contain" ${normalizeImageFit(product.imageFit) === "contain" ? "selected" : ""}>Contain</option>
            <option value="cover" ${normalizeImageFit(product.imageFit) === "cover" ? "selected" : ""}>Cover</option>
          </select>
        </div>
        <div class="admin-field">
          <label>Image position</label>
          <select data-product-field="imagePosition">
            <option value="center" ${(!product.imagePosition || product.imagePosition === "center") ? "selected" : ""}>Center</option>
            <option value="top" ${product.imagePosition === "top" ? "selected" : ""}>Top</option>
            <option value="bottom" ${product.imagePosition === "bottom" ? "selected" : ""}>Bottom</option>
            <option value="left" ${product.imagePosition === "left" ? "selected" : ""}>Left</option>
            <option value="right" ${product.imagePosition === "right" ? "selected" : ""}>Right</option>
          </select>
        </div>
        <div class="admin-field">
          <label>Min order</label>
          <input data-product-field="minOrder" type="text" value="${product.minOrder || ""}" />
        </div>
        <div class="admin-field">
          <label>Shelf life</label>
          <input data-product-field="shelfLife" type="text" value="${product.shelfLife || ""}" />
        </div>
        <div class="admin-field admin-image-preview-field">
          <label>Image preview</label>
          <div class="admin-image-preview-frame">
            ${product.imagePath ? `<img class="admin-image-preview" data-product-preview src="${escapeHtml(product.imagePath)}" alt="${escapeHtml(product.name || "Product preview")}" style="${productPreviewStyle(product)}" />` : `<div class="admin-image-preview-empty" data-product-preview-empty>No image yet</div>`}
          </div>
        </div>
        <div class="admin-field" style="grid-column: 1 / -1;">
          <label>Description</label>
          <textarea data-product-field="description">${product.description || ""}</textarea>
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
      state.catalog.items.splice(index, 1);
      renderPromoOptions();
      renderProducts();
    });
  });

  productList.querySelectorAll("[data-product-index]").forEach((card) => {
    const syncPreview = () => {
      const pathField = card.querySelector('[data-product-field="imagePath"]');
      const fitField = card.querySelector('[data-product-field="imageFit"]');
      const positionField = card.querySelector('[data-product-field="imagePosition"]');
      const preview = card.querySelector("[data-product-preview]");
      const emptyState = card.querySelector("[data-product-preview-empty]");
      const imagePath = pathField?.value.trim() || "";
      const previewStyle = `object-fit: ${normalizeImageFit(fitField?.value)}; object-position: ${normalizeImagePosition(positionField?.value)};`;

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
    };

    card.querySelectorAll('[data-product-field="imagePath"], [data-product-field="imageFit"], [data-product-field="imagePosition"]').forEach((field) => {
      field.addEventListener("input", syncPreview);
      field.addEventListener("change", syncPreview);
    });
  });
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
  return [...productList.querySelectorAll("[data-product-index]")].map((card) => {
    const product = {};
    card.querySelectorAll("[data-product-field]").forEach((field) => {
      const key = field.dataset.productField;
      if (["price", "wholesalePrice", "stock", "rating", "reviews"].includes(key)) {
        product[key] = Number(field.value || 0);
      } else {
        product[key] = field.value.trim();
      }
    });
    return product;
  });
}

async function saveCatalog() {
  try {
    setStatus("Saving catalog...");
    const payload = {
      store: collectStore(),
      promo: collectPromo(),
      brandStory: collectBrandStory(),
      categories: collectCategories(),
      items: collectProducts()
    };
    const response = await request("/api/admin/catalog", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    state.catalog = response.catalog;
    renderAll();
    setStatus("Catalog saved to disk.");
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
      whatsappAdminNumber: integrationFields.whatsappAdminNumber.value.trim(),
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
}

async function bootstrap() {
  await ensureAdminSession();
  const [catalog, integrations, voucherResponse, publicConfig] = await Promise.all([
    request("/api/admin/catalog"),
    request("/api/admin/integrations"),
    request("/api/admin/vouchers"),
    request("/api/public-config")
  ]);
  state.catalog = catalog;
  state.vouchers = voucherResponse.vouchers || [];
  renderAll();
  renderIntegrations(integrations);
  await initializeKitchenMap(publicConfig.googleMapsApiKey);
  showAdminSection(adminSectionSelect?.value || "store");
  if (window.mermaid) {
    await window.mermaid.run({ querySelector: ".mermaid" });
  }
  setStatus("Catalog loaded. Save after making changes.");
}

saveCatalogButton.addEventListener("click", saveCatalog);
saveIntegrationsButton.addEventListener("click", saveIntegrations);
addProductButton.addEventListener("click", addProduct);
saveVouchersButton?.addEventListener("click", saveVouchers);
addVoucherButton?.addEventListener("click", addVoucher);
adminLogoutButton.addEventListener("click", logoutAdmin);
refreshOrdersButton?.addEventListener("click", loadOrders);
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
brandStorySlideList.addEventListener("input", (event) => {
  if (event.target.matches('[data-story-field="imagePath"]')) {
    syncBrandStoryPreview(event.target.closest("[data-story-slide-index]"));
  }
});

bootstrap().catch((error) => {
  setStatus(error.message);
});
