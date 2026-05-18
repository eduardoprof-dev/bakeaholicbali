const state = {
  catalog: null
};

const saveCatalogButton = document.getElementById("saveCatalogButton");
const saveIntegrationsButton = document.getElementById("saveIntegrationsButton");
const addProductButton = document.getElementById("addProductButton");
const adminLogoutButton = document.getElementById("adminLogoutButton");
const adminStatus = document.getElementById("adminStatus");
const categoryList = document.getElementById("categoryList");
const productList = document.getElementById("productList");

const storeFields = {
  name: document.getElementById("storeName"),
  orderWhatsapp: document.getElementById("orderWhatsapp"),
  eyebrow: document.getElementById("storeEyebrowInput"),
  perkLabel: document.getElementById("perkLabelInput"),
  perkTitle: document.getElementById("perkTitleInput"),
  perkDescription: document.getElementById("perkDescriptionInput")
};

const promoFields = {
  itemId: document.getElementById("promoItemId"),
  buttonLabel: document.getElementById("promoButtonLabel"),
  kicker: document.getElementById("promoKickerInput")
};

const brandStoryFields = {
  kicker: document.getElementById("brandStoryKickerInput"),
  title: document.getElementById("brandStoryTitleInput"),
  body: document.getElementById("brandStoryBodyInput"),
  secondaryBody: document.getElementById("brandStorySecondaryBodyInput"),
  imagePath: document.getElementById("brandStoryImagePathInput")
};

const brandStoryPointFields = [
  document.getElementById("brandStoryPointOneInput"),
  document.getElementById("brandStoryPointTwoInput"),
  document.getElementById("brandStoryPointThreeInput")
];

const brandStoryImagePreview = document.getElementById("brandStoryImagePreview");

const integrationFields = {
  googleMapsApiKey: document.getElementById("googleMapsApiKeyInput"),
  biteshipApiKey: document.getElementById("biteshipApiKeyInput"),
  biteshipCouriers: document.getElementById("biteshipCouriersInput"),
  midtransEnvironment: document.getElementById("midtransEnvironmentInput"),
  midtransServerKey: document.getElementById("midtransServerKeyInput"),
  midtransClientKey: document.getElementById("midtransClientKeyInput"),
  whatsappAccessToken: document.getElementById("whatsappAccessTokenInput"),
  whatsappPhoneNumberId: document.getElementById("whatsappPhoneNumberIdInput"),
  whatsappBusinessAccountId: document.getElementById("whatsappBusinessAccountIdInput"),
  whatsappVerifyToken: document.getElementById("whatsappVerifyTokenInput"),
  whatsappAppId: document.getElementById("whatsappAppIdInput"),
  whatsappAppSecret: document.getElementById("whatsappAppSecretInput"),
  whatsappOtpTemplateName: document.getElementById("whatsappOtpTemplateNameInput"),
  whatsappOrderTemplateName: document.getElementById("whatsappOrderTemplateNameInput"),
  whatsappTemplateLanguage: document.getElementById("whatsappTemplateLanguageInput")
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
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
    return;
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }
  }

  const password = window.prompt("Enter the admin password");
  if (!password) {
    throw new Error("Admin login was cancelled.");
  }

  await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });

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

function renderIntegrations(integrations) {
  Object.entries(integrationFields).forEach(([key, field]) => {
    field.value = integrations?.[key] || "";
  });
}

function renderStore() {
  Object.entries(storeFields).forEach(([key, field]) => {
    field.value = state.catalog.store[key] || "";
  });
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

function defaultBrandStory() {
  return {
    kicker: "Bakeaholic Bali",
    title: "Bali-born treats for everyday good moments.",
    body: "Bakeaholic started from a small Bali kitchen with a simple idea: make packaged treats that feel homemade, travel well, and are easy to share.",
    secondaryBody: "Every snack is built for real life, with retail-ready packs, familiar flavors, and shelf lives that make gifting, stocking, and daily snacking simple.",
    imagePath: "/assets/products/bliss-salted-caramel-lifestyle-20260422.png",
    points: ["Bali kitchen roots", "Ready to share", "Feel-good treats"]
  };
}

function syncBrandStoryPreview() {
  if (!brandStoryImagePreview) return;
  const imagePath = brandStoryFields.imagePath.value.trim();
  brandStoryImagePreview.src = imagePath || defaultBrandStory().imagePath;
}

function renderBrandStory() {
  const story = {
    ...defaultBrandStory(),
    ...(state.catalog.brandStory || {})
  };
  Object.entries(brandStoryFields).forEach(([key, field]) => {
    field.value = story[key] || "";
  });
  brandStoryPointFields.forEach((field, index) => {
    field.value = story.points?.[index] || "";
  });
  syncBrandStoryPreview();
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

function renderAll() {
  renderStore();
  renderPromo();
  renderBrandStory();
  renderCategories();
  renderProducts();
}

function collectStore() {
  const store = {};
  Object.entries(storeFields).forEach(([key, field]) => {
    store[key] = field.value.trim();
  });
  return {
    ...state.catalog.store,
    ...store,
    testModeTitle: state.catalog.store.testModeTitle,
    testModeDescription: state.catalog.store.testModeDescription
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
  const story = {};
  Object.entries(brandStoryFields).forEach(([key, field]) => {
    story[key] = field.value.trim();
  });
  story.points = brandStoryPointFields.map((field) => field.value.trim()).filter(Boolean);
  return story;
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
      midtransEnvironment: integrationFields.midtransEnvironment.value,
      midtransServerKey: integrationFields.midtransServerKey.value.trim(),
      midtransClientKey: integrationFields.midtransClientKey.value.trim(),
      whatsappAccessToken: integrationFields.whatsappAccessToken.value.trim(),
      whatsappPhoneNumberId: integrationFields.whatsappPhoneNumberId.value.trim(),
      whatsappBusinessAccountId: integrationFields.whatsappBusinessAccountId.value.trim(),
      whatsappVerifyToken: integrationFields.whatsappVerifyToken.value.trim(),
      whatsappAppId: integrationFields.whatsappAppId.value.trim(),
      whatsappAppSecret: integrationFields.whatsappAppSecret.value.trim(),
      whatsappOtpTemplateName: integrationFields.whatsappOtpTemplateName.value.trim(),
      whatsappOrderTemplateName: integrationFields.whatsappOrderTemplateName.value.trim(),
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
  const [catalog, integrations] = await Promise.all([
    request("/api/admin/catalog"),
    request("/api/admin/integrations")
  ]);
  state.catalog = catalog;
  renderAll();
  renderIntegrations(integrations);
  setStatus("Catalog loaded. Save after making changes.");
}

saveCatalogButton.addEventListener("click", saveCatalog);
saveIntegrationsButton.addEventListener("click", saveIntegrations);
addProductButton.addEventListener("click", addProduct);
adminLogoutButton.addEventListener("click", logoutAdmin);
brandStoryFields.imagePath.addEventListener("input", syncBrandStoryPreview);

bootstrap().catch((error) => {
  setStatus(error.message);
});
