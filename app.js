const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const params = new URLSearchParams(window.location.search);
const appMode = params.get("mode") === "test" ? "test" : "live";
const modeQuery = appMode === "test" ? "?mode=test" : "";
const assetVersion = "20260422-bliss-lifestyle-photos";
const shopperStateVersion = "20260604-session-cart";
const cartStateVersion = "20260623-cart-24h";
const draftKey = `bakeaholic-checkout-draft-${shopperStateVersion}-${appMode}`;
const latestOrderKey = `bakeaholic-latest-order-${cartStateVersion}-${appMode}`;
const cartSessionKey = `bakeaholic-cart-session-${cartStateVersion}-${appMode}`;
const cartSessionMaxAgeMs = 24 * 60 * 60 * 1000;

const state = {
  appMode,
  store: null,
  promo: null,
  brandStory: null,
  categories: [],
  items: [],
  cart: null,
  draft: loadDraft()
};

const storeEyebrow = document.getElementById("storeEyebrow");
const modeBanner = document.getElementById("modeBanner");
const modeBannerBody = document.getElementById("modeBannerBody");
const resetTestButton = document.getElementById("resetTestButton");
const addressButton = document.getElementById("addressButton");
const addressTitle = document.getElementById("addressTitle");
const addressText = document.getElementById("addressText");
const deliveryFeeLine = document.getElementById("deliveryFeeLine");
const searchBar = document.querySelector(".search-bar");
const searchInput = document.getElementById("searchInput");
const storefrontLogo = document.getElementById("storefrontLogo");
const footerLogo = document.querySelector(".footer-logo");
const footerTagline = document.querySelector(".footer-tagline");
const momentGuideKicker = document.getElementById("momentGuideKicker");
const momentGuideTitle = document.getElementById("momentGuideTitle");
const categoryChips = document.getElementById("categoryChips");
const catalog = document.getElementById("catalog");
const promoKicker = document.getElementById("promoKicker");
const promoAddButton = document.getElementById("promoAddButton");
const promoHeroImage = document.getElementById("promoHeroImage");
const promoHeroTitle = document.getElementById("promoHeroTitle");
const promoHeroPrice = document.getElementById("promoHeroPrice");
const brandStoryKicker = document.getElementById("brandStoryKicker");
const brandStoryTitle = document.getElementById("brandStoryTitle");
const brandStoryBody = document.getElementById("brandStoryBody");
const brandStorySecondaryBody = document.getElementById("brandStorySecondaryBody");
const brandStoryPoints = document.getElementById("brandStoryPoints");
const brandStoryImage = document.getElementById("brandStoryImage");
const brandStoryTrack = document.getElementById("brandStoryTrack");
const brandStoryPrev = document.getElementById("brandStoryPrev");
const brandStoryNext = document.getElementById("brandStoryNext");
const brandStoryCounter = document.getElementById("brandStoryCounter");
const cartLink = document.getElementById("cartLink");
const cartCountBadge = document.getElementById("cartCountBadge");
const storefrontCartBar = document.getElementById("storefrontCartBar");
const storefrontCartCount = document.getElementById("storefrontCartCount");
const cartDrawer = document.getElementById("cartDrawer");
const closeCartDrawer = document.getElementById("closeCartDrawer");
const cartDrawerItems = document.getElementById("cartDrawerItems");
const cartDrawerSubtotal = document.getElementById("cartDrawerSubtotal");
const cartDrawerCheckoutButton = document.getElementById("cartDrawerCheckoutButton");
const cartDrawerAddressButton = document.getElementById("cartDrawerAddressButton");
const cartDrawerAddressText = document.getElementById("cartDrawerAddressText");
const loginButton = document.getElementById("loginButton");
const accountMenu = document.getElementById("accountMenu");
const accountMenuName = document.getElementById("accountMenuName");
const accountMenuPhone = document.getElementById("accountMenuPhone");
const accountMenuEmail = document.getElementById("accountMenuEmail");
const accountSummaryButton = document.getElementById("accountSummaryButton");
const accountOrderHistoryButton = document.getElementById("accountOrderHistoryButton");
const accountAddressesButton = document.getElementById("accountAddressesButton");
const accountLogoutButton = document.getElementById("accountLogoutButton");
const orderBanner = document.getElementById("orderBanner");
const orderBannerTitle = document.getElementById("orderBannerTitle");
const orderBannerBody = document.getElementById("orderBannerBody");
const orderBannerLink = document.getElementById("orderBannerLink");
const footerWhatsappLink = document.getElementById("footerWhatsappLink");
const footerInstagramLink = document.getElementById("footerInstagramLink");
const footerTermsLink = document.getElementById("footerTermsLink");
const footerPrivacyLink = document.getElementById("footerPrivacyLink");
const modalScrim = document.getElementById("modalScrim");
const whatsappModal = document.getElementById("whatsappModal");
const otpModal = document.getElementById("otpModal");
const profileModal = document.getElementById("profileModal");
const detailsModal = document.getElementById("detailsModal");
const locationModal = document.getElementById("locationModal");
const productModal = document.getElementById("productModal");
const closeWhatsappModal = document.getElementById("closeWhatsappModal");
const closeOtpModal = document.getElementById("closeOtpModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const closeDetailsModal = document.getElementById("closeDetailsModal");
const closeProductModal = document.getElementById("closeProductModal");
const saveWhatsappButton = document.getElementById("saveWhatsappButton");
const verifyOtpButton = document.getElementById("verifyOtpButton");
const saveProfileButton = document.getElementById("saveProfileButton");
const resendOtpButton = document.getElementById("resendOtpButton");
const changePhoneButton = document.getElementById("changePhoneButton");
const copyOtpButton = document.getElementById("copyOtpButton");
const saveDetailsButton = document.getElementById("saveDetailsButton");
const whatsappPrompt = document.getElementById("whatsappPrompt");
const whatsappMessage = document.getElementById("whatsappMessage");
const whatsappInput = document.getElementById("whatsappInput");
const otpPrompt = document.getElementById("otpPrompt");
const otpInput = document.getElementById("otpInput");
const otpMessage = document.getElementById("otpMessage");
const otpTimerText = document.getElementById("otpTimerText");
const testOtpCard = document.getElementById("testOtpCard");
const testOtpCode = document.getElementById("testOtpCode");
const profileFirstNameInput = document.getElementById("profileFirstNameInput");
const profileLastNameInput = document.getElementById("profileLastNameInput");
const profileEmailInput = document.getElementById("profileEmailInput");
const profileModalTitle = document.getElementById("profileModalTitle");
const profileModalCopy = document.getElementById("profileModalCopy");
const profileMessage = document.getElementById("profileMessage");
const customerNameInput = document.getElementById("customerNameInput");
const customerPhoneInput = document.getElementById("customerPhoneInput");
const customerAddressInput = document.getElementById("customerAddressInput");
const addressFieldLabel = document.getElementById("addressFieldLabel");
const productModalImage = document.getElementById("productModalImage");
const productModalCategory = document.getElementById("productModalCategory");
const productModalTitle = document.getElementById("productModalTitle");
const productModalBadge = document.getElementById("productModalBadge");
const productModalDescription = document.getElementById("productModalDescription");
const productModalFacts = document.getElementById("productModalFacts");
const productModalPrice = document.getElementById("productModalPrice");
const productModalAddButton = document.getElementById("productModalAddButton");

let locationPicker;
let activeCategoryId = "";
let scrollSpyFrame = 0;
let addressChromeFrame = 0;
let addressIsHidden = false;
let brandStorySlideIndex = 0;
let brandStoryTimer = 0;
let brandStoryPaused = false;
let selectedProductId = "";
let pendingOtpPhone = "";
let otpResendAvailableAt = 0;
let otpTimerId = 0;
let volatileCartSessionId = "";
const pendingCartAdds = new Set();
const cartQuantitySyncs = new Map();
const isAdminPreview = params.has("admin-preview");

const whatsappIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.1 4.4a7.4 7.4 0 0 0-6.3 11.3l-.8 3.1 3.2-.8a7.4 7.4 0 1 0 3.9-13.6Z" />
    <path d="M8.8 8.5c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .6l-.4.5c-.1.1-.2.3-.1.5.4.8 1.1 1.5 2 1.9.2.1.4.1.5-.1l.7-.8c.1-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .5-.3 1.1-.7 1.4-.5.4-1.2.5-2.2.2-1.7-.5-3.1-1.5-4.3-3-1.2-1.4-1.7-2.6-1.6-3.3 0-.5.2-.9.4-1.2Z" />
  </svg>
`;

const instagramIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="5" width="14" height="14" rx="4" />
    <circle cx="12" cy="12" r="3.1" />
    <circle cx="16.3" cy="7.8" r=".8" />
  </svg>
`;

function loadDraft() {
  const fallback = {
    fulfillmentType: "delivery",
    paymentMethodId: "xendit-card",
    voucherCode: "",
    deliveryNotes: "",
    orderNotes: "",
    destination: {
      lat: null,
      lng: null,
      label: "",
      formattedAddress: "",
      locationNotes: "",
      routeDistanceKm: null,
      deliveryFee: 0
    },
    customer: {
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      phoneVerifiedAt: ""
    }
  };

  try {
    const stored = JSON.parse(localStorage.getItem(draftKey) || "null");
    return {
      ...fallback,
      ...stored,
      destination: {
        ...fallback.destination,
        ...(stored?.destination || {})
      },
      customer: {
        ...fallback.customer,
        ...(stored?.customer || {})
      }
    };
  } catch (_error) {
    return fallback;
  }
}

function persistDraft() {
  state.draft.fulfillmentType = "delivery";
  localStorage.setItem(draftKey, JSON.stringify(state.draft));
}

function setMessage(element, text, tone = "error") {
  if (!element) return;
  element.textContent = text || "";
  element.dataset.tone = tone;
  element.hidden = !text;
}

function normalizeWhatsAppPhone(input) {
  const raw = String(input || "").trim();
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    return "";
  }
  if (raw.startsWith("+") || raw.startsWith("00")) {
    return raw.startsWith("00") ? digits.replace(/^00/, "") : digits;
  }
  return digits.startsWith("62") ? digits : `62${digits.replace(/^0+/, "")}`;
}

function editableWhatsAppPhone(input) {
  const phone = normalizeWhatsAppPhone(input);
  if (!phone) return "";
  return phone.startsWith("62") ? phone.slice(2) : `+${phone}`;
}

function formatWhatsAppPhone(input) {
  const phone = normalizeWhatsAppPhone(input);
  return phone ? `+${phone}` : "";
}

function withVerificationPrompt(prompt) {
  const basePrompt = String(prompt || "Enter your WhatsApp number to continue ordering.").trim();
  const verificationCopy = "We will send you a verification code via WhatsApp.";
  return basePrompt.toLowerCase().includes(verificationCopy.toLowerCase())
    ? basePrompt
    : `${basePrompt} ${verificationCopy}`;
}

function customerFullName(customer = state.draft.customer) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() || customer.name || "";
}

function hasRegistrationProfile() {
  return Boolean(
    state.draft.customer.firstName?.trim()
      && state.draft.customer.lastName?.trim()
      && state.draft.customer.email?.trim()
  );
}

function applyCustomerProfile(profile) {
  if (!profile) return;
  state.draft.customer.firstName = profile.firstName || "";
  state.draft.customer.lastName = profile.lastName || "";
  state.draft.customer.email = profile.email || "";
  state.draft.customer.name = profile.name || customerFullName();
  const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];
  const defaultAddress = addresses.find((address) => address.id === profile.defaultAddressId) || addresses[0];
  if (defaultAddress?.formattedAddress) {
    state.draft.destination = { ...defaultAddress, locationConfirmed: true };
    state.draft.customer.address = defaultAddress.formattedAddress;
  }
}

function createCartSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID().replaceAll("-", "");
  }
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function saveCartSessionId(sessionId) {
  const normalized = String(sessionId || "").toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(normalized)) {
    return "";
  }
  volatileCartSessionId = normalized;
  try {
    localStorage.setItem(cartSessionKey, JSON.stringify({ id: normalized, updatedAt: Date.now() }));
  } catch (_error) {
    // The in-memory session still prevents an old cookie cart from being reused this visit.
  }
  return normalized;
}

function storedCartSessionId() {
  try {
    const stored = JSON.parse(localStorage.getItem(cartSessionKey) || "null");
    const sessionId = String(stored?.id || "").toLowerCase();
    const updatedAt = Number(stored?.updatedAt || 0);
    if (/^[a-f0-9]{32}$/.test(sessionId) && updatedAt > 0 && Date.now() - updatedAt <= cartSessionMaxAgeMs) {
      return sessionId;
    }
    localStorage.removeItem(cartSessionKey);
  } catch (_error) {
    // Legacy plain-text cart sessions are intentionally treated as expired.
    try {
      localStorage.removeItem(cartSessionKey);
    } catch (_storageError) {
      // Ignore unavailable browser storage.
    }
  }
  return "";
}

function getCartSessionId() {
  const urlSessionId = String(params.get("cart_session") || "");
  if (/^[a-f0-9]{32}$/i.test(urlSessionId)) {
    return saveCartSessionId(urlSessionId);
  }
  return storedCartSessionId() || volatileCartSessionId || saveCartSessionId(createCartSessionId());
}

function rememberCartSession(payload) {
  const sessionId = String(payload?.cartSessionId || "");
  if (!/^[a-f0-9]{32}$/i.test(sessionId)) {
    return;
  }
  saveCartSessionId(sessionId);
}

function cartPageUrl() {
  const search = new URLSearchParams();
  if (appMode === "test") {
    search.set("mode", "test");
  }
  const sessionId = String(state.cart?.cartSessionId || getCartSessionId() || "");
  if (/^[a-f0-9]{32}$/i.test(sessionId)) {
    search.set("cart_session", sessionId.toLowerCase());
  }
  const query = search.toString();
  return `/cart.html${query ? `?${query}` : ""}`;
}

function request(path, options = {}) {
  const cartSessionId = getCartSessionId();
  const requestUrl = new URL(path, window.location.origin);
  if (cartSessionId) {
    requestUrl.searchParams.set("cart_session", cartSessionId);
  }
  return fetch(`${requestUrl.pathname}${requestUrl.search}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-App-Mode": appMode,
      ...(cartSessionId ? { "X-Cart-Session": cartSessionId } : {}),
      ...(options.headers || {})
    }
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    rememberCartSession(payload);
    return payload;
  });
}

async function syncSessionProfile() {
  try {
    const payload = await request("/api/session");
    if (!payload?.authenticated) {
      return false;
    }

    state.draft.customer.phone = payload.customer?.phone || state.draft.customer.phone;
    state.draft.customer.phoneVerifiedAt = payload.customer?.verifiedAt || state.draft.customer.phoneVerifiedAt;
    applyCustomerProfile(payload.profile);
    persistDraft();
    return true;
  } catch (error) {
    if (error?.status === 401) {
      state.draft.customer.phone = "";
      state.draft.customer.phoneVerifiedAt = "";
      state.draft.customer.firstName = "";
      state.draft.customer.lastName = "";
      state.draft.customer.email = "";
      state.draft.customer.name = "";
      persistDraft();
    }
    return false;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function versionedAsset(path) {
  if (!path || !path.startsWith("/assets/")) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}v=${assetVersion}`;
}

function hasDeliveryDestination(destination = state.draft.destination) {
  return Number.isFinite(Number(destination.lat))
    && Number.isFinite(Number(destination.lng))
    && Boolean(String(destination.formattedAddress || "").trim());
}

function syncFulfillmentUi() {
  state.draft.fulfillmentType = "delivery";

  if (!state.store) return;

  addressFieldLabel.textContent = "Address";
  addressTitle.textContent = hasDeliveryDestination()
    ? "Your delivery address"
    : state.store.addressLabel;
  addressText.textContent = state.draft.destination.formattedAddress || "";

  if (!hasDeliveryDestination()) {
    deliveryFeeLine.textContent = "Add your address to estimate delivery fee.";
    return;
  }

  const feeAmount = state.cart?.deliveryFee || state.draft.destination.deliveryFee || 0;
  if (state.cart?.quoteSource === "biteship") {
    const courierLabel = state.cart.shipping?.courierName || "courier";
    deliveryFeeLine.textContent = `Live ${courierLabel} quote: ${formatRupiah.format(feeAmount)}`;
    return;
  }

  deliveryFeeLine.textContent = `Estimated delivery fee: ${formatRupiah.format(feeAmount)}`;
}

function renderOrderBanner() {
  const latestOrderId = localStorage.getItem(latestOrderKey);
  if (!latestOrderId) {
    orderBanner.hidden = true;
    return;
  }

  orderBanner.hidden = false;
  orderBannerTitle.textContent = `Continue order ${latestOrderId}`;
  orderBannerBody.textContent =
    "Finish, check, or cancel this order.";
  orderBannerLink.hidden = false;
  orderBannerLink.textContent = "Check out";
  orderBannerLink.href = `/pay.html${modeQuery ? `${modeQuery}&order=${latestOrderId}` : `?order=${latestOrderId}`}`;
}

function syncFooterLinks() {
  const whatsappNumber = String(state.store?.orderWhatsapp || "").replace(/[^\d]/g, "");
  if (footerWhatsappLink) {
    footerWhatsappLink.href = whatsappNumber
      ? `https://wa.me/${whatsappNumber}`
      : "#";
    const whatsappLabel = whatsappNumber
      ? `+${whatsappNumber.replace(/^62/, "62 ")}`
      : "WhatsApp";
    footerWhatsappLink.innerHTML = `
      <span class="footer-icon">${whatsappIcon}</span>
      <span class="footer-link-label">${escapeHtml(whatsappLabel)}</span>
    `;
  }

  if (footerInstagramLink) {
    footerInstagramLink.href = state.store?.instagramUrl || "https://www.instagram.com/";
    footerInstagramLink.innerHTML = `
      <span class="footer-icon">${instagramIcon}</span>
    `;
    footerInstagramLink.setAttribute("aria-label", "Bakeaholic Bali Instagram");
    footerInstagramLink.title = "Bakeaholic Bali Instagram";
  }

  if (footerTermsLink) {
    footerTermsLink.href = state.store?.termsUrl || "#terms";
    footerTermsLink.textContent = state.store?.termsLabel || "Terms and Conditions";
  }

  if (footerPrivacyLink) {
    footerPrivacyLink.href = state.store?.privacyUrl || "#privacy";
    footerPrivacyLink.textContent = state.store?.privacyLabel || "Privacy Policy";
  }
}

function filteredItemsForCategory(categoryId) {
  const query = searchInput.value.trim().toLowerCase();
  return state.items.filter((item) => {
    if (item.category !== categoryId) return false;
    if (!query) return true;
    return `${item.name} ${item.description}`.toLowerCase().includes(query);
  });
}

function getCategoryLabel(categoryId) {
  return state.categories.find((category) => category.id === categoryId)?.label || "Bakeaholic Bali";
}

function renderChips() {
  categoryChips.innerHTML = state.categories
    .map(
      (category) =>
        `<button class="chip" type="button" data-category-id="${escapeHtml(category.id)}">${escapeHtml(category.label)}</button>`
    )
    .join("");

  categoryChips.querySelectorAll("[data-category-id]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const target = document.getElementById(chip.dataset.categoryId);
      if (target) {
        const headerHeight = document.querySelector(".app-header")?.offsetHeight || 0;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      }
      setActiveCategory(chip.dataset.categoryId, true);
    });
  });

  setActiveCategory(activeCategoryId || state.categories[0]?.id || "", false);
}

function setActiveCategory(categoryId, shouldCenter = true) {
  if (!categoryId) {
    return;
  }

  const changed = activeCategoryId !== categoryId;
  activeCategoryId = categoryId;
  categoryChips.querySelectorAll("[data-category-id]").forEach((chip) => {
    const isActive = chip.dataset.categoryId === categoryId;
    chip.classList.toggle("active", isActive);
    if (isActive && shouldCenter && changed) {
      const centerLeft = chip.offsetLeft - (categoryChips.clientWidth - chip.clientWidth) / 2;
      categoryChips.scrollTo({
        left: Math.max(0, centerLeft),
        behavior: "smooth"
      });
    }
  });
}

function updateActiveCategoryFromScroll() {
  scrollSpyFrame = 0;
  const sections = [...document.querySelectorAll(".catalog-section")];
  if (!sections.length) return;

  const headerBottom = document.querySelector(".app-header")?.getBoundingClientRect().bottom || 0;
  const activationLine = Math.max(160, Math.min(window.innerHeight * 0.45, headerBottom + 220));
  let currentSection = sections[0];
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= activationLine) {
      currentSection = section;
    }
  });

  setActiveCategory(currentSection.id);
}

function scheduleScrollSpy() {
  if (scrollSpyFrame) return;
  scrollSpyFrame = requestAnimationFrame(updateActiveCategoryFromScroll);
}

function updateAddressChrome() {
  addressChromeFrame = 0;
  const header = document.querySelector(".app-header");
  if (!header) return;

  const scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
  const shouldHideAddress = addressIsHidden ? scrollY > 0 : scrollY > 12;
  if (addressIsHidden === shouldHideAddress) return;

  addressIsHidden = shouldHideAddress;
  header.classList.toggle("address-hidden", addressIsHidden);
}

function scheduleAddressChrome() {
  if (addressChromeFrame) return;
  addressChromeFrame = requestAnimationFrame(updateAddressChrome);
}

function imageFit(item) {
  return item.imageFit === "cover" ? "cover" : "contain";
}

function imagePosition(item) {
  switch (item.imagePosition) {
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

function mediaTransform(item) {
  const x = Math.min(100, Math.max(-100, Number(item?.imageOffsetX ?? 0) || 0));
  const y = Math.min(100, Math.max(-100, Number(item?.imageOffsetY ?? 0) || 0));
  const scale = Math.min(180, Math.max(50, Number(item?.imageScale ?? 100) || 100));
  return `translate(${x}%, ${y}%) scale(${scale / 100})`;
}

function mediaFrameStyle(item) {
  const x = Math.min(30, Math.max(-30, Number(item?.frameOffsetX ?? 0) || 0));
  const y = Math.min(30, Math.max(-30, Number(item?.frameOffsetY ?? 0) || 0));
  return `style="transform:translate(${x}%, ${y}%);transform-origin:center;"`;
}

function productImageStyle(item) {
  return `style="object-fit:${imageFit(item)};object-position:center;transform:${mediaTransform(item)};transform-origin:center;"`;
}

function renderCatalog() {

  catalog.innerHTML = state.categories
    .map((category) => {
      const items = filteredItemsForCategory(category.id);
      if (!items.length) return "";

      return `
        <section class="catalog-section" id="${escapeHtml(category.id)}">
          <div class="section-title-wrap">
            <h2>${escapeHtml(category.label)}</h2>
            <p>${escapeHtml(category.description)}</p>
          </div>
          <div class="product-stack">
            ${items
              .map(
                (item) => {
                  const quantity = cartQuantityForItem(item.id);
                  return `
                  <article class="product-card" role="button" tabindex="0" data-product-id="${escapeHtml(item.id)}" aria-label="View ${escapeHtml(item.name)} details">
                    <div class="product-thumb-wrap" ${mediaFrameStyle(item)}>
                      <img class="product-thumb" src="${escapeHtml(versionedAsset(item.imagePath))}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" ${productImageStyle(item)} />
                    </div>
                    <div class="product-copy">
                      <div class="product-topline">
                        <h3>${escapeHtml(item.name)}</h3>
                        ${item.badge ? `<span class="product-badge">${escapeHtml(item.badge)}</span>` : ""}
                      </div>
                      <p>${escapeHtml(item.description)}</p>
                      <div class="product-meta">
                        <span>★ ${item.rating}</span>
                        <span>${item.reviews} reviews</span>
                        <span>${escapeHtml(item.shelfLife)}</span>
                      </div>
                      <div class="product-bottom">
                        <strong>${formatRupiah.format(item.price)}</strong>
                        <button class="mini-add-button" type="button" data-item-id="${escapeHtml(item.id)}" aria-label="Add ${escapeHtml(item.name)} to cart" ${item.stock <= 0 ? "disabled" : ""}>
                          ${item.stock <= 0 ? "Sold out" : "+"}
                          ${quantity > 0 ? `<span class="add-quantity-badge">${quantity > 99 ? "99+" : quantity}</span>` : ""}
                        </button>
                      </div>
                    </div>
                  </article>
                `;
                }
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");

  if (!catalog.innerHTML.trim()) {
    catalog.innerHTML = `
      <section class="empty-card">
        <strong>No matching products found.</strong>
        <p>Try a broader keyword or switch categories.</p>
      </section>
    `;
  }

  catalog.querySelectorAll("[data-item-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      addToCart(button.dataset.itemId, button);
    });
  });

  catalog.querySelectorAll("[data-product-id]").forEach((card) => {
    card.addEventListener("click", () => openProductModal(card.dataset.productId));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProductModal(card.dataset.productId);
      }
    });
  });
}

function cartQuantityForItem(itemId) {
  return state.cart?.items?.find((entry) => entry.itemId === itemId)?.quantity || 0;
}

function currentPromoItem() {
  return state.items.find((item) => item.id === state.promo?.itemId) || null;
}

function openProductModal(itemId) {
  const item = state.items.find((candidate) => candidate.id === itemId);
  if (!item) return;

  window.BakeaholicAnalytics?.track("ViewContent", {
    content_ids: [item.id],
    content_type: "product",
    currency: "IDR",
    value: Number(item.price || 0)
  });

  selectedProductId = item.id;
  productModalImage.src = versionedAsset(item.imagePath);
  productModalImage.alt = item.name;
  productModalImage.className = "product-modal-image";
  productModalImage.style.objectFit = imageFit(item);
  productModalImage.style.objectPosition = "center";
  productModalImage.style.transform = mediaTransform(item);
  productModalImage.style.transformOrigin = "center";
  productModalCategory.textContent = getCategoryLabel(item.category);
  productModalTitle.textContent = item.name;
  productModalBadge.textContent = item.badge || "";
  productModalBadge.hidden = !item.badge;
  productModalDescription.textContent = item.description;
  productModalPrice.textContent = formatRupiah.format(item.price);
  productModalAddButton.disabled = item.stock <= 0;
  productModalAddButton.textContent = item.stock <= 0 ? "Sold out" : `Add to Cart ${formatRupiah.format(item.price)}`;
  productModalFacts.innerHTML = [
    `★ ${item.rating}`,
    `${item.reviews} reviews`,
    item.shelfLife,
    item.minOrder ? `Min. ${item.minOrder}` : ""
  ]
    .filter(Boolean)
    .map((fact) => `<span>${escapeHtml(fact)}</span>`)
    .join("");

  openModal(productModal);
}

function renderCartSummary() {
  const itemCount = state.cart?.itemCount || 0;
  cartLink.href = cartPageUrl();
  document.body.classList.toggle("has-cart-items", itemCount > 0);
  cartCountBadge.hidden = itemCount <= 0;
  cartCountBadge.textContent = itemCount > 99 ? "99+" : String(itemCount);
  if (storefrontCartBar) {
    storefrontCartBar.hidden = itemCount <= 0;
  }
  if (storefrontCartCount) {
    storefrontCartCount.textContent = `${itemCount} Item${itemCount === 1 ? "" : "s"}`;
  }
  renderCartDrawer();
}

function renderCartDrawer() {
  if (!cartDrawerItems || !state.cart) return;

  const lineItems = Array.isArray(state.cart.lineItems) ? state.cart.lineItems : [];
  cartDrawerAddressText.textContent = state.draft.destination.formattedAddress || "Delivery address...";
  cartDrawerSubtotal.textContent = formatRupiah.format(state.cart.subtotal || 0);
  cartDrawerItems.innerHTML = lineItems.map(({ item, itemId, quantity }) => `
    <article class="cart-drawer-line">
      <img src="${escapeHtml(versionedAsset(item.imagePath))}" alt="${escapeHtml(item.name)}" ${productImageStyle(item)} />
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="cart-drawer-qty" aria-label="${escapeHtml(item.name)} quantity">
          <button type="button" data-drawer-action="decrease" data-item-id="${escapeHtml(itemId)}">−</button>
          <span>${quantity}</span>
          <button type="button" data-drawer-action="increase" data-item-id="${escapeHtml(itemId)}">+</button>
        </div>
      </div>
      <strong>${formatRupiah.format(item.price * quantity)}</strong>
    </article>
  `).join("");

  cartDrawerItems.querySelectorAll("[data-drawer-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = state.cart.items.find((candidate) => candidate.itemId === button.dataset.itemId);
      const currentQuantity = entry?.quantity || 0;
      const nextQuantity = button.dataset.drawerAction === "increase"
        ? currentQuantity + 1
        : currentQuantity - 1;
      updateCartQuantity(button.dataset.itemId, nextQuantity);
    });
  });
}

function openModal(modal) {
  modal.hidden = false;
  modalScrim.hidden = false;
}

function closeModal(modal) {
  modal.hidden = true;
  if (
    whatsappModal.hidden
      && otpModal.hidden
      && profileModal.hidden
      && detailsModal.hidden
      && locationModal.hidden
      && productModal.hidden
      && cartDrawer.hidden
  ) {
    modalScrim.hidden = true;
  }
}

function updateOtpTimer() {
  const remainingSeconds = Math.max(0, Math.ceil((otpResendAvailableAt - Date.now()) / 1000));
  resendOtpButton.disabled = remainingSeconds > 0;
  otpTimerText.textContent = remainingSeconds > 0
    ? `Please wait ${remainingSeconds} seconds before requesting a new code.`
    : "Didn't receive the code? You can request a new one.";
  if (remainingSeconds <= 0 && otpTimerId) {
    window.clearInterval(otpTimerId);
    otpTimerId = 0;
  }
}

function startOtpTimer(seconds) {
  otpResendAvailableAt = Date.now() + Number(seconds || 0) * 1000;
  updateOtpTimer();
  if (otpTimerId) {
    window.clearInterval(otpTimerId);
  }
  otpTimerId = window.setInterval(updateOtpTimer, 1000);
}

function showOtpModal(registration) {
  pendingOtpPhone = registration.phone;
  otpInput.value = "";
  otpPrompt.textContent = `We have sent a verification code to +${registration.phone}`;
  testOtpCard.hidden = appMode !== "test" || !registration.testCode;
  testOtpCode.textContent = registration.testCode || "";
  setMessage(otpMessage, registration.message || "", "info");
  startOtpTimer(registration.resendInSeconds || 30);
  closeModal(whatsappModal);
  openModal(otpModal);
  otpInput.focus();
}

async function requestOtp() {
  const phone = normalizeWhatsAppPhone(whatsappInput.value);
  if (!phone || phone.length < 8 || phone.length > 15) {
    setMessage(whatsappMessage, "Enter a valid WhatsApp number with country code");
    return;
  }

  saveWhatsappButton.disabled = true;
  saveWhatsappButton.textContent = "Sending code...";
  setMessage(whatsappMessage, "");
  try {
    const payload = await request("/api/register/start", {
      method: "POST",
      body: JSON.stringify({ phone })
    });
    showOtpModal(payload.registration);
  } catch (error) {
    setMessage(whatsappMessage, error.message);
  } finally {
    saveWhatsappButton.disabled = false;
    saveWhatsappButton.textContent = "Continue";
  }
}

async function verifyOtp() {
  const code = otpInput.value.trim();
  if (!/^\d{6}$/.test(code)) {
    setMessage(otpMessage, "Please enter the 6 digit verification code");
    return;
  }

  verifyOtpButton.disabled = true;
  verifyOtpButton.textContent = "Verifying...";
  setMessage(otpMessage, "");
  try {
    const payload = await request("/api/register/verify", {
      method: "POST",
      body: JSON.stringify({ phone: pendingOtpPhone, code })
    });
    state.draft.customer.phone = `+${payload.registration.phone}`;
    state.draft.customer.phoneVerifiedAt = payload.registration.verifiedAt;
    applyCustomerProfile(payload.registration.profile);
    persistDraft();
    hydrateDetailsForm();
    setMessage(otpMessage, "WhatsApp number verified.", "success");
    closeModal(otpModal);
    if (!hasRegistrationProfile()) {
      openProfileModal();
    }
  } catch (error) {
    setMessage(otpMessage, error.message);
  } finally {
    verifyOtpButton.disabled = false;
    verifyOtpButton.textContent = "Verify";
  }
}

function hydrateDetailsForm() {
  state.draft.customer.name = customerFullName();
  customerNameInput.value = state.draft.customer.name;
  customerPhoneInput.value = state.draft.customer.phone;
  customerAddressInput.value = state.draft.destination.formattedAddress || state.draft.customer.address;
  customerAddressInput.placeholder = "Street, district, landmark";
}

function hydrateProfileForm() {
  profileFirstNameInput.value = state.draft.customer.firstName || "";
  profileLastNameInput.value = state.draft.customer.lastName || "";
  profileEmailInput.value = state.draft.customer.email || "";
}

function openProfileModal(mode = "registration") {
  const isAccountView = mode === "account";
  profileModalTitle.textContent = isAccountView ? "Your details" : "Complete your registration";
  profileModalCopy.textContent = isAccountView
    ? "These details are saved to your verified WhatsApp number for faster checkout."
    : "We'll remember these details in this browser for faster checkout next time.";
  saveProfileButton.textContent = isAccountView ? "Save details" : "Save and continue";
  hydrateProfileForm();
  setMessage(profileMessage, "");
  openModal(profileModal);
  profileFirstNameInput.focus();
}

function renderAccountMenu() {
  accountMenuName.textContent = customerFullName() || "Your account";
  accountMenuPhone.textContent = state.draft.customer.phone || "";
  accountMenuEmail.textContent = state.draft.customer.email || "";
}

function closeAccountMenu() {
  accountMenu.hidden = true;
}

function openAccountMenu() {
  renderAccountMenu();
  accountMenu.hidden = false;
}

function openAccount() {
  if (!state.draft.customer.phoneVerifiedAt) {
    whatsappInput.value = editableWhatsAppPhone(state.draft.customer.phone);
    setMessage(whatsappMessage, "");
    openModal(whatsappModal);
    return;
  }

  accountMenu.hidden ? openAccountMenu() : closeAccountMenu();
}

function logoutAccount() {
  request("/api/session/logout", { method: "POST" })
    .catch(() => null)
    .finally(() => {
      localStorage.removeItem(draftKey);
      state.draft = loadDraft();
      closeAccountMenu();
      hydrateDetailsForm();
      syncFulfillmentUi();
      whatsappInput.value = "";
      openModal(whatsappModal);
    });
}

async function saveProfile() {
  const firstName = profileFirstNameInput.value.trim();
  const lastName = profileLastNameInput.value.trim();
  const email = profileEmailInput.value.trim();
  const idleButtonText = profileModalTitle.textContent === "Your details"
    ? "Save details"
    : "Save and continue";

  if (!firstName || !lastName) {
    setMessage(profileMessage, "Please enter your first and last name");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setMessage(profileMessage, "Please enter a valid email address");
    return;
  }

  saveProfileButton.disabled = true;
  saveProfileButton.textContent = "Saving...";
  setMessage(profileMessage, "");
  try {
    const payload = await request("/api/customer/profile", {
      method: "POST",
      body: JSON.stringify({
        firstName,
        lastName,
        email
      })
    });
    applyCustomerProfile(payload.profile);
    persistDraft();
    hydrateDetailsForm();
    closeModal(profileModal);
  } catch (error) {
    setMessage(profileMessage, error.message);
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = idleButtonText;
  }
}

function buildCartQuery() {
  const search = new URLSearchParams();
  search.set("fulfillment", state.draft.fulfillmentType);
  search.set("voucher", state.draft.voucherCode || "");
  if (hasDeliveryDestination()) {
    search.set("lat", state.draft.destination.lat);
    search.set("lng", state.draft.destination.lng);
    search.set("route_km", state.draft.destination.routeDistanceKm || "");
    search.set("address", state.draft.destination.formattedAddress || "");
    search.set("location_notes", state.draft.destination.locationNotes || "");
  }
  return search.toString();
}

async function refreshCart(options = {}) {
  const { renderProducts = true } = options;
  state.cart = await request(`/api/cart?${buildCartQuery()}`);
  if (state.cart?.shipping?.distanceKm) {
    state.draft.destination.routeDistanceKm = state.cart.shipping.distanceKm;
    state.draft.destination.deliveryFee = state.cart.deliveryFee;
  }
  state.draft.destination.quoteSource = state.cart?.quoteSource || "";
  state.draft.destination.courierName = state.cart?.shipping?.courierName || "";
  state.draft.destination.courierServiceName = state.cart?.shipping?.courierServiceName || "";
  persistDraft();
  renderCartSummary();
  if (renderProducts) {
    renderCatalog();
  }
  syncFulfillmentUi();
}

function setAddButtonBadge(button, quantity) {
  if (!button) return;
  let badge = button.querySelector(".add-quantity-badge");
  if (quantity <= 0) {
    badge?.remove();
    return;
  }
  badge = badge || document.createElement("span");
  badge.className = "add-quantity-badge";
  badge.textContent = quantity > 99 ? "99+" : String(quantity);
  if (!badge.isConnected) {
    button.appendChild(badge);
  }
}

function adjustVisibleAddBadges(itemId, delta) {
  document.querySelectorAll("[data-item-id]").forEach((button) => {
    if (button.dataset.itemId !== itemId) return;
    const badge = button.querySelector(".add-quantity-badge");
    const currentQuantity = Number(badge?.textContent || "0") || 0;
    setAddButtonBadge(button, Math.max(0, currentQuantity + delta));
    button.setAttribute("aria-live", "polite");
  });
}

async function addToCart(itemId, triggerButton = null) {
  if (pendingCartAdds.has(itemId)) {
    return;
  }
  pendingCartAdds.add(itemId);
  adjustVisibleAddBadges(itemId, 1);
  const matchingButtons = [...document.querySelectorAll("[data-item-id]")]
    .filter((button) => button.dataset.itemId === itemId);
  matchingButtons.forEach((button) => {
    button.disabled = true;
    button.classList.add("is-updating");
    button.setAttribute("aria-live", "polite");
  });
  try {
    const cartPayload = await request("/api/cart", {
      method: "POST",
      body: JSON.stringify({ itemId, quantity: 1 })
    });
    state.cart = cartPayload;
    renderCartSummary();
    window.BakeaholicAnalytics?.track("AddToCart", {
      content_ids: [itemId],
      content_type: "product",
      currency: "IDR"
    });
  } catch (error) {
    adjustVisibleAddBadges(itemId, -1);
    throw error;
  } finally {
    pendingCartAdds.delete(itemId);
    matchingButtons.forEach((button) => {
      button.disabled = false;
      button.classList.remove("is-updating");
    });
  }
}

function applyOptimisticCartQuantity(itemId, quantity) {
  if (!state.cart) return;

  const normalizedQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
  const items = (state.cart.items || [])
    .map((entry) => entry.itemId === itemId ? { ...entry, quantity: normalizedQuantity } : entry)
    .filter((entry) => entry.quantity > 0);
  const lineItems = (state.cart.lineItems || [])
    .map((entry) => entry.itemId === itemId
      ? { ...entry, quantity: normalizedQuantity, lineTotal: entry.item.price * normalizedQuantity }
      : entry)
    .filter((entry) => entry.quantity > 0);

  state.cart = {
    ...state.cart,
    items,
    lineItems,
    itemCount: lineItems.reduce((total, entry) => total + entry.quantity, 0),
    subtotal: lineItems.reduce((total, entry) => total + entry.item.price * entry.quantity, 0)
  };
  renderCartSummary();
  if (state.cart.itemCount <= 0) {
    closeModal(cartDrawer);
  }
}

function scheduleCartQuantitySync(itemId) {
  const sync = cartQuantitySyncs.get(itemId);
  if (!sync || sync.inFlight) return;
  if (sync.timer) window.clearTimeout(sync.timer);
  sync.timer = window.setTimeout(() => flushCartQuantitySync(itemId), 120);
}

async function flushCartQuantitySync(itemId) {
  const sync = cartQuantitySyncs.get(itemId);
  if (!sync || sync.inFlight) return;

  sync.timer = 0;
  sync.inFlight = true;
  const sentRevision = sync.revision;
  const sentQuantity = sync.quantity;
  try {
    const cartPayload = await request("/api/cart", {
      method: "PATCH",
      body: JSON.stringify({ itemId, quantity: sentQuantity })
    });
    if (sync.revision === sentRevision) {
      state.cart = cartPayload;
      renderCartSummary();
      cartQuantitySyncs.delete(itemId);
    }
  } catch (error) {
    if (sync.revision === sentRevision) {
      cartQuantitySyncs.delete(itemId);
      await refreshCart();
      window.alert(error.message || "We could not update the cart. Please try again.");
    }
  } finally {
    sync.inFlight = false;
    if (cartQuantitySyncs.get(itemId) === sync && sync.revision !== sentRevision) {
      scheduleCartQuantitySync(itemId);
    }
  }
}

function updateCartQuantity(itemId, quantity) {
  const normalizedQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
  const sync = cartQuantitySyncs.get(itemId) || {
    quantity: normalizedQuantity,
    revision: 0,
    timer: 0,
    inFlight: false
  };
  sync.quantity = normalizedQuantity;
  sync.revision += 1;
  cartQuantitySyncs.set(itemId, sync);
  applyOptimisticCartQuantity(itemId, normalizedQuantity);
  scheduleCartQuantitySync(itemId);
}

function openCartDrawer() {
  if ((state.cart?.itemCount || 0) <= 0) {
    window.location.href = cartPageUrl();
    return;
  }
  openModal(cartDrawer);
}

function renderBrandStory() {
  if (!state.brandStory) return;
  const slides = normalizeBrandStorySlides(state.brandStory);
  if (brandStoryTrack) {
    brandStoryTrack.innerHTML = slides.map((slide, index) => storySlideMarkup(slide, index)).join("");
  }
  updateBrandStorySlide();
  restartBrandStoryAutoplay();
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
  const fallbackSlides = [
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
  ];
  const storySlides = Array.isArray(story.slides) && story.slides.length
    ? story.slides
    : [{ ...fallbackSlides[0], ...story }, ...fallbackSlides.slice(1)];

  return storySlides.map((slide, index) => {
    const fallback = fallbackSlides[index] || fallbackSlides[0];
    return {
      ...fallback,
      ...slide,
      points: [0, 1, 2].map((pointIndex) => normalizeStoryPoint(
        slide.points?.[pointIndex],
        fallback.points[pointIndex]?.icon || "leaf"
      )).filter((point) => point.label)
    };
  });
}

function storySlideMarkup(slide, index) {
  const titleId = `brandStoryTitle${index + 1}`;
  const points = Array.isArray(slide.points) ? slide.points : [];
  return `
    <article class="brand-story-slide" aria-labelledby="${titleId}">
      <div class="brand-story-copy">
        <p class="feature-kicker">${escapeHtml(slide.kicker)}</p>
        <h1 id="${titleId}">${escapeHtml(slide.title)}</h1>
        <p>${escapeHtml(slide.body)}</p>
        <p>${escapeHtml(slide.secondaryBody)}</p>
        <div class="brand-story-points" aria-label="Bakeaholic story highlights">
          ${points.map((point) => `<span data-story-icon="${escapeHtml(point.icon)}">${escapeHtml(point.label)}</span>`).join("")}
        </div>
      </div>
      <div class="brand-story-media-frame" ${mediaFrameStyle(slide)}>
        <img class="brand-story-image" src="${escapeHtml(versionedAsset(slide.imagePath))}" alt="${escapeHtml(slide.imageAlt || "Bakeaholic packaged snacks")}" style="object-fit:${slide.imageFit === "contain" ? "contain" : "cover"};object-position:center;transform:${mediaTransform(slide)};transform-origin:center" ${index === 0 ? "fetchpriority=\"high\"" : "loading=\"lazy\""} decoding="async" />
      </div>
    </article>
  `;
}

function updateBrandStorySlide() {
  if (!brandStoryTrack) return;
  const slides = [...brandStoryTrack.querySelectorAll(".brand-story-slide")];
  if (!slides.length) return;

  brandStorySlideIndex = ((brandStorySlideIndex % slides.length) + slides.length) % slides.length;
  brandStoryTrack.style.transform = `translateX(-${brandStorySlideIndex * 100}%)`;
  slides.forEach((slide, index) => {
    slide.setAttribute("aria-hidden", String(index !== brandStorySlideIndex));
  });
  if (brandStoryCounter) {
    brandStoryCounter.textContent = `${brandStorySlideIndex + 1} / ${slides.length}`;
  }
  if (brandStoryPrev) {
    brandStoryPrev.disabled = slides.length <= 1;
  }
  if (brandStoryNext) {
    brandStoryNext.disabled = slides.length <= 1;
  }
}

function changeBrandStorySlide(direction, options = {}) {
  if (!brandStoryTrack) return;
  const slides = brandStoryTrack.querySelectorAll(".brand-story-slide");
  if (!slides.length) return;
  brandStorySlideIndex = (brandStorySlideIndex + direction + slides.length) % slides.length;
  updateBrandStorySlide();
  if (!options.auto) {
    restartBrandStoryAutoplay();
  }
  document.activeElement?.blur?.();
  if (!options.auto && window.matchMedia("(max-width: 620px)").matches) {
    const card = brandStoryTrack.closest(".brand-story-card");
    const headerHeight = document.querySelector(".app-header")?.offsetHeight || 0;
    const targetTop = (card?.getBoundingClientRect().top || 0) + window.scrollY - headerHeight - 10;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  }
}

function startBrandStoryAutoplay() {
  if (!brandStoryTrack || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const slides = brandStoryTrack.querySelectorAll(".brand-story-slide");
  if (slides.length <= 1 || brandStoryTimer) return;
  brandStoryTimer = window.setInterval(() => {
    if (brandStoryPaused) return;
    changeBrandStorySlide(1, { auto: true });
  }, 5200);
}

function stopBrandStoryAutoplay() {
  if (!brandStoryTimer) return;
  window.clearInterval(brandStoryTimer);
  brandStoryTimer = 0;
}

function restartBrandStoryAutoplay() {
  stopBrandStoryAutoplay();
  startBrandStoryAutoplay();
}

function enableBrandStoryAutoplayPause() {
  const card = brandStoryTrack?.closest(".brand-story-card");
  if (!card) return;
  card.addEventListener("mouseenter", () => {
    brandStoryPaused = true;
  });
  card.addEventListener("mouseleave", () => {
    brandStoryPaused = false;
  });
  card.addEventListener("focusin", () => {
    brandStoryPaused = true;
  });
  card.addEventListener("focusout", () => {
    brandStoryPaused = false;
  });
}

function enableBrandStorySwipe() {
  if (!brandStoryTrack) return;
  let startX = 0;
  let startY = 0;
  let pointerStarted = false;

  const startSwipe = (clientX, clientY) => {
    if (!window.matchMedia("(max-width: 1024px)").matches) return;
    startX = clientX;
    startY = clientY;
    pointerStarted = true;
  };

  const finishSwipe = (clientX, clientY) => {
    if (!pointerStarted) return;
    pointerStarted = false;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    changeBrandStorySlide(deltaX < 0 ? 1 : -1);
  };

  brandStoryTrack.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    startSwipe(event.clientX, event.clientY);
  });

  brandStoryTrack.addEventListener("pointerup", (event) => {
    finishSwipe(event.clientX, event.clientY);
  });

  brandStoryTrack.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    startSwipe(touch.clientX, touch.clientY);
  }, { passive: true });

  brandStoryTrack.addEventListener("touchend", (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    finishSwipe(touch.clientX, touch.clientY);
  }, { passive: true });

  brandStoryTrack.addEventListener("pointercancel", () => {
    pointerStarted = false;
  });

  brandStoryTrack.addEventListener("touchcancel", () => {
    pointerStarted = false;
  }, { passive: true });
}

async function resetTestData() {
  await request("/api/reset", { method: "POST" });
  localStorage.removeItem(latestOrderKey);
  renderOrderBanner();
  await refreshCart();
}

function configurableHeaderIcon(type, variant = "") {
  const aliases = {
    search: { "search-plus": "circle-search", "search-lines": "scan-search", "search-location": "minimal-search", "search-heart": "circle-search", "search-star": "bold-search" },
    cart: { "cart-plus": "cart", tote: "bag", "receipt-order": "box", "gift-order": "basket", "store-order": "trolley" },
    login: { "secure-account": "account-badge", avatar: "person-circle", members: "profile-card", "spark-account": "account-badge", "home-account": "minimal-person" }
  };
  variant = aliases[type]?.[variant] || variant;
  const icons = {
    search: {
      magnifier: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>',
      "circle-search": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="10.5" cy="10.5" r="3.5"/><path d="m13 13 3 3"/></svg>',
      "scan-search": '<svg viewBox="0 0 24 24"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><circle cx="11" cy="11" r="4"/><path d="m14 14 3 3"/></svg>',
      "bold-search": '<svg viewBox="0 0 24 24" class="is-bold"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>',
      "minimal-search": '<svg viewBox="0 0 24 24"><circle cx="9.5" cy="9.5" r="5"/><path d="m13.5 13.5 6 6"/></svg>'
    },
    cart: {
      cart: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5h14l-1.6 8.2H8L6.5 6.5Z"/><path d="M3.5 4h2.1l.9 2.5"/><circle cx="9" cy="19" r="1.4"/><circle cx="18" cy="19" r="1.4"/></svg>',
      bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
      basket: '<svg viewBox="0 0 24 24"><path d="m4 10 2 10h12l2-10H4Z"/><path d="m8 10 4-6 4 6M9 13v4M15 13v4"/></svg>',
      box: '<svg viewBox="0 0 24 24"><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z"/><path d="m4 7 8 4 8-4M12 11v10"/></svg>',
      trolley: '<svg viewBox="0 0 24 24"><path d="M4 5h2l2 10h10l2-7H7"/><path d="M9 11h9"/><circle cx="10" cy="19" r="1.3"/><circle cx="18" cy="19" r="1.3"/></svg>'
    },
    login: {
      person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.3"/><path d="M5.5 20c1.2-4 3.4-6 6.5-6s5.3 2 6.5 6"/></svg>',
      "person-circle": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M6.5 19c1.2-3.2 3-4.8 5.5-4.8s4.3 1.6 5.5 4.8"/></svg>',
      "profile-card": '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.3"/><path d="M5.5 17c.7-2.1 1.9-3.2 3.5-3.2s2.8 1.1 3.5 3.2M14 9h4M14 13h4"/></svg>',
      "account-badge": '<svg viewBox="0 0 24 24"><circle cx="10" cy="9" r="3"/><path d="M4 19c1-3.7 3-5.5 6-5.5s5 1.8 6 5.5"/><circle cx="18" cy="7" r="3"/></svg>',
      "minimal-person": '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M7 19c.7-3.2 2.4-4.8 5-4.8s4.3 1.6 5 4.8"/></svg>'
    }
  };
  const choices = icons[type];
  return choices?.[variant] || choices?.[Object.keys(choices)[0]] || "";
}

function applyHeaderIcons() {
  const searchIcon = document.querySelector(".search-icon");
  if (searchIcon) searchIcon.innerHTML = configurableHeaderIcon("search", state.store.searchIconStyle);
  const cartLink = document.getElementById("cartLink");
  const cartSvg = cartLink?.querySelector("svg");
  if (cartSvg) cartSvg.outerHTML = configurableHeaderIcon("cart", state.store.cartIconStyle);
  const loginButton = document.getElementById("loginButton");
  const loginSvg = loginButton?.querySelector("svg");
  if (loginSvg) loginSvg.outerHTML = configurableHeaderIcon("login", state.store.loginIconStyle);
}

function applyCatalogPayload(payload) {
  state.store = payload.store;
  state.promo = payload.promo;
  state.brandStory = payload.brandStory;
  state.categories = payload.categories;
  state.items = payload.items;

  if (storefrontLogo) {
    storefrontLogo.src = versionedAsset(state.store.logoPath || "/assets/bakeaholic-logo.jpg");
    storefrontLogo.alt = state.store.name || "Bakeaholic Bali";
    storefrontLogo.style.transform = `translate(${Math.min(100, Math.max(-100, Number(state.store.logoOffsetX ?? 0) || 0))}%, ${Math.min(100, Math.max(-100, Number(state.store.logoOffsetY ?? 0) || 0))}%) scale(${Math.min(180, Math.max(50, Number(state.store.logoScale ?? 100) || 100)) / 100})`;
    storefrontLogo.style.transformOrigin = "center";
    storefrontLogo.style.objectPosition = "center";
  }
  if (footerLogo) {
    footerLogo.src = versionedAsset(state.store.footerLogoPath || state.store.logoPath || "/assets/bakeaholic-logo.jpg");
    footerLogo.alt = state.store.name || "Bakeaholic Bali";
    footerLogo.style.transform = `translate(${Math.min(100, Math.max(-100, Number(state.store.footerLogoOffsetX ?? 0) || 0))}%, ${Math.min(100, Math.max(-100, Number(state.store.footerLogoOffsetY ?? 0) || 0))}%) scale(${Math.min(180, Math.max(50, Number(state.store.footerLogoScale ?? 100) || 100)) / 100})`;
    footerLogo.style.transformOrigin = "center";
    footerLogo.style.objectPosition = "center";
  }
  if (footerTagline) footerTagline.textContent = state.store.footerTagline || "Bali's original packaged treats and wholesome snacks.";
  if (searchInput) searchInput.placeholder = state.store.searchPlaceholder || "Search products...";
  applyHeaderIcons();
  const cartLink = document.getElementById("cartLink");
  const loginButton = document.getElementById("loginButton");
  if (cartLink) {
    cartLink.setAttribute("aria-label", state.store.cartButtonLabel || "Open cart");
    cartLink.title = state.store.cartButtonLabel || "Open cart";
  }
  if (loginButton) {
    loginButton.setAttribute("aria-label", state.store.loginButtonLabel || "Login or open account");
    loginButton.title = state.store.loginButtonLabel || "Login or open account";
  }
  const footerContactHeading = document.querySelector(".footer-contact > strong");
  if (footerContactHeading) footerContactHeading.textContent = state.store.footerContactLabel || "CONTACT US";
  if (momentGuideKicker) momentGuideKicker.textContent = state.store.momentGuideKicker || "Shop by Category";
  if (momentGuideTitle) momentGuideTitle.textContent = state.store.momentGuideTitle || "Pick the snack for what you need today.";
  ["Sweet craving", "Coffee break", "Morning pantry", "Kids favorite"].forEach((fallback, index) => {
    const label = document.getElementById(`momentCard${index}Label`);
    if (label) label.textContent = state.store[`momentCard${index}Label`] || fallback;
  });

  if (storeEyebrow) {
    storeEyebrow.textContent = state.store.eyebrow;
  }
  promoKicker.textContent = state.promo.kicker;
  promoAddButton.textContent = state.promo.buttonLabel;
  const promoItem = currentPromoItem();
  if (promoHeroImage && promoItem?.imagePath) {
    promoHeroImage.src = versionedAsset(promoItem.imagePath);
    promoHeroImage.alt = promoItem.name;
    promoHeroImage.style.objectFit = imageFit(promoItem);
    promoHeroImage.style.objectPosition = "center";
    promoHeroImage.style.transform = mediaTransform(promoItem);
    promoHeroImage.style.transformOrigin = "center";
  }
  if (promoHeroTitle) {
    promoHeroTitle.textContent = promoItem?.name || "Best seller ready to ship";
  }
  if (promoHeroPrice) {
    promoHeroPrice.textContent = promoItem?.price ? formatRupiah.format(promoItem.price) : "Rp 0";
  }
  renderBrandStory();
  whatsappPrompt.textContent = withVerificationPrompt(state.store.whatsappPrompt);
  modeBanner.hidden = appMode !== "test";
  const modeBannerTitle = modeBanner?.querySelector("strong");
  if (modeBannerTitle) modeBannerTitle.textContent = state.store.testModeTitle || "Sandbox test mode";
  modeBannerBody.textContent = state.store.testModeDescription;
  syncFooterLinks();
  renderChips();
  renderCatalog();
  updateActiveCategoryFromScroll();
  updateAddressChrome();
}

async function bootstrap() {
  const payload = await request("/api/menu");
  applyCatalogPayload(payload);

  document.title = "Bakeaholic Online Shop";
  locationPicker = window.BakeaholicLocationPicker?.createLocationPicker({
    rootId: "locationModal",
    kitchen: {
      lat: state.store.kitchenLat,
      lng: state.store.kitchenLng
    },
    googleMapsApiKey: state.store.integrations?.googleMapsApiKey,
    initialValue: state.draft.destination,
    onSave: async (destination) => {
      state.draft.destination = destination;
      state.draft.customer.address = destination.formattedAddress;
      persistDraft();
      hydrateDetailsForm();
      closeModal(locationModal);
      await refreshCart();
    }
  });
  syncFulfillmentUi();
  hydrateDetailsForm();
  renderOrderBanner();
  await refreshCart();

  await syncSessionProfile();
  renderAccountMenu();
  hydrateDetailsForm();

  if (isAdminPreview) {
    window.parent.postMessage({ type: "bakeaholic:preview-ready" }, window.location.origin);
  }

}

window.addEventListener("message", (event) => {
  if (!isAdminPreview || event.origin !== window.location.origin) return;
  if (event.data?.type !== "bakeaholic:catalog-preview" || !event.data.catalog) return;
  applyCatalogPayload(event.data.catalog);
});

window.addEventListener("message", (event) => {
  if (!isAdminPreview || event.origin !== window.location.origin || event.data?.type !== "bakeaholic:media-preview") return;
  const { itemType, itemIndex = 0, itemId = "", media = {} } = event.data;
  let frame = null;
  let image = null;
  if (itemType === "story") {
    const slide = document.querySelector(`.brand-story-slide:nth-child(${Number(itemIndex) + 1})`);
    frame = slide?.querySelector(".brand-story-media-frame");
    image = slide?.querySelector(".brand-story-image");
  } else if (itemType === "product") {
    const cards = [...document.querySelectorAll(".product-card")];
    const product = cards.find((card) => card.dataset.productId === itemId) || cards[Number(itemIndex)];
    frame = product?.querySelector(".product-thumb-wrap");
    image = product?.querySelector(".product-thumb");
  }
  if (!frame || !image) return;
  frame.style.transform = `translate(${Number(media.frameOffsetX) || 0}%, ${Number(media.frameOffsetY) || 0}%)`;
  frame.style.transformOrigin = "center";
  image.style.objectFit = media.imageFit === "cover" ? "cover" : "contain";
  image.style.objectPosition = "center";
  image.style.transform = `translate(${Number(media.imageOffsetX) || 0}%, ${Number(media.imageOffsetY) || 0}%) scale(${(Number(media.imageScale) || 100) / 100})`;
  image.style.transformOrigin = "center";
});

window.addEventListener("message", (event) => {
  if (!isAdminPreview || event.origin !== window.location.origin || event.data?.type !== "bakeaholic:preview-focus") return;
  document.querySelectorAll(".admin-preview-highlight").forEach((element) => element.classList.remove("admin-preview-highlight"));
  const { section, field = "" } = event.data;
  if (event.data.section === "story") {
    stopBrandStoryAutoplay();
    brandStorySlideIndex = Number(event.data.itemIndex || 0);
    updateBrandStorySlide();
  }
  const activeStory = `.brand-story-slide:nth-child(${Number(event.data.itemIndex || 0) + 1})`;
  const pointIndex = Number(String(field).split("-").at(-1) || 0) + 1;
  const fieldSelectors = {
    storeName: ".brand-logo",
    storeLogoPathInput: ".brand-logo",
    storeLogoScaleInput: ".brand-logo",
    storeLogoPositionXInput: ".brand-logo",
    storeLogoPositionYInput: ".brand-logo",
    footerLogoPathInput: ".footer-logo",
    footerLogoScaleInput: ".footer-logo",
    footerLogoPositionXInput: ".footer-logo",
    footerLogoPositionYInput: ".footer-logo",
    footerTaglineInput: ".footer-tagline",
    footerContactLabelInput: ".footer-contact > strong",
    termsLabelInput: "#footerTermsLink",
    privacyLabelInput: "#footerPrivacyLink",
    cartButtonLabelInput: "#cartLink",
    loginButtonLabelInput: "#loginButton",
    searchPlaceholderInput: "#searchInput",
    searchIconStyleInput: ".search-icon",
    cartIconStyleInput: "#cartLink",
    loginIconStyleInput: "#loginButton",
    momentGuideKickerInput: "#momentGuideKicker",
    momentGuideTitleInput: "#momentGuideTitle",
    momentCard0LabelInput: "#momentCard0Label",
    momentCard1LabelInput: "#momentCard1Label",
    momentCard2LabelInput: "#momentCard2Label",
    momentCard3LabelInput: "#momentCard3Label",
    orderWhatsapp: "#footerWhatsappLink",
    storeEyebrowInput: "#storeEyebrow",
    instagramUrlInput: "#footerInstagramLink",
    termsUrlInput: "#footerTermsLink",
    privacyUrlInput: "#footerPrivacyLink",
    addressLabelInput: "#addressTitle",
    defaultAddressInput: "#addressText",
    kitchenAddressInput: "#addressText",
    promoKickerInput: "#promoKicker",
    promoButtonLabel: "#promoAddButton",
    promoItemId: "#promoCard",
    kicker: `${activeStory} .feature-kicker`,
    title: `${activeStory} h1`,
    body: `${activeStory} .brand-story-copy > p:nth-of-type(2)`,
    secondaryBody: `${activeStory} .brand-story-copy > p:nth-of-type(3)`,
    imagePath: `${activeStory} .brand-story-image`,
    imageFit: `${activeStory} .brand-story-image`,
    imagePosition: `${activeStory} .brand-story-image`,
    imageScale: `${activeStory} .brand-story-image`,
    imageOffsetX: `${activeStory} .brand-story-image`,
    imageOffsetY: `${activeStory} .brand-story-image`,
    frameOffsetX: `${activeStory} .brand-story-media-frame`,
    frameOffsetY: `${activeStory} .brand-story-media-frame`
  };
  if (field.startsWith("point-label-") || field.startsWith("point-icon-")) {
    fieldSelectors[field] = `${activeStory} .brand-story-points span:nth-child(${pointIndex})`;
  }
  const sectionSelectors = { store: ".app-header", promo: "#promoCard", story: activeStory, categories: ".moment-guide", catalog: "#catalog", discounts: ".app-header" };
  const fieldSelector = fieldSelectors[field];
  let target = fieldSelector ? document.querySelector(fieldSelector) : null;
  if (section === "catalog" && event.data.itemId) {
    const product = [...document.querySelectorAll(".product-card")].find((card) => card.dataset.productId === event.data.itemId);
    const productFieldSelectors = {
      name: "h3",
      description: ".product-copy > p",
      imagePath: ".product-thumb",
      imageFit: ".product-thumb",
      imagePosition: ".product-thumb",
      imageScale: ".product-thumb",
      imageOffsetX: ".product-thumb",
      imageOffsetY: ".product-thumb",
      frameOffsetX: ".product-thumb-wrap",
      frameOffsetY: ".product-thumb-wrap",
      badge: ".product-badge",
      price: ".product-bottom strong",
      rating: ".product-meta span:nth-child(1)",
      reviews: ".product-meta span:nth-child(2)",
      shelfLife: ".product-meta span:nth-child(3)"
    };
    const productFieldSelector = productFieldSelectors[field];
    target = (product && productFieldSelector ? product.querySelector(productFieldSelector) : null) || product || target;
  }
  if (!target && section === "catalog") target = document.querySelectorAll(".product-card")[Number(event.data.itemIndex || 0)];
  if (!target && section === "categories") target = document.querySelectorAll(".moment-card")[Number(event.data.itemIndex || 0)];
  if (!target) target = document.querySelector(sectionSelectors[section] || ".brand-story-card");
  target?.classList.add("admin-preview-highlight");
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
});

addressButton.addEventListener("click", () => {
  openModal(locationModal);
  locationPicker?.open();
});
searchInput.addEventListener("input", () => {
  renderCatalog();
  updateActiveCategoryFromScroll();
});
searchBar?.addEventListener("click", () => {
  searchBar.classList.add("search-expanded");
  searchInput.focus();
});
searchInput.addEventListener("blur", () => {
  if (!searchInput.value.trim()) {
    searchBar?.classList.remove("search-expanded");
  }
});
window.addEventListener("scroll", scheduleScrollSpy, { passive: true });
window.addEventListener("scroll", scheduleAddressChrome, { passive: true });
window.addEventListener("resize", scheduleScrollSpy);
document.addEventListener("click", (event) => {
  if (accountMenu.hidden) return;
  if (accountMenu.contains(event.target) || loginButton?.contains(event.target)) return;
  closeAccountMenu();
});
promoAddButton.addEventListener("click", () => addToCart(state.promo.itemId));
cartLink?.addEventListener("click", (event) => {
  if ((state.cart?.itemCount || 0) <= 0) return;
  event.preventDefault();
  openCartDrawer();
});
storefrontCartBar?.addEventListener("click", openCartDrawer);
cartDrawerCheckoutButton?.addEventListener("click", () => {
  window.location.href = cartPageUrl();
});
cartDrawerAddressButton?.addEventListener("click", () => {
  closeModal(cartDrawer);
  openModal(locationModal);
});
brandStoryPrev?.addEventListener("click", () => changeBrandStorySlide(-1));
brandStoryNext?.addEventListener("click", () => changeBrandStorySlide(1));
enableBrandStorySwipe();
enableBrandStoryAutoplayPause();
loginButton?.addEventListener("click", () => {
  openAccount();
});
accountSummaryButton?.addEventListener("click", () => {
  closeAccountMenu();
  openProfileModal("account");
});
accountOrderHistoryButton?.addEventListener("click", () => {
  closeAccountMenu();
  window.location.href = `/orders.html${modeQuery}`;
});
accountAddressesButton?.addEventListener("click", () => {
  closeAccountMenu();
  window.location.href = `/addresses.html${modeQuery}`;
});
accountLogoutButton?.addEventListener("click", logoutAccount);
resetTestButton.addEventListener("click", resetTestData);
closeWhatsappModal.addEventListener("click", () => closeModal(whatsappModal));
closeOtpModal.addEventListener("click", () => closeModal(otpModal));
closeProfileModal.addEventListener("click", () => closeModal(profileModal));
closeDetailsModal.addEventListener("click", () => closeModal(detailsModal));
closeProductModal.addEventListener("click", () => closeModal(productModal));
closeCartDrawer?.addEventListener("click", () => closeModal(cartDrawer));
document.getElementById("closeLocationModal")?.addEventListener("click", () => closeModal(locationModal));
modalScrim.addEventListener("click", () => {
  closeAccountMenu();
  closeModal(whatsappModal);
  closeModal(otpModal);
  closeModal(profileModal);
  closeModal(detailsModal);
  closeModal(locationModal);
  closeModal(productModal);
  closeModal(cartDrawer);
});
saveWhatsappButton.addEventListener("click", requestOtp);
whatsappInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    requestOtp();
  }
});
verifyOtpButton.addEventListener("click", verifyOtp);
otpInput.addEventListener("input", () => {
  otpInput.value = otpInput.value.replace(/[^\d]/g, "").slice(0, 6);
});
otpInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    verifyOtp();
  }
});
resendOtpButton.addEventListener("click", async () => {
  whatsappInput.value = editableWhatsAppPhone(pendingOtpPhone);
  await requestOtp();
});
changePhoneButton.addEventListener("click", () => {
  closeModal(otpModal);
  whatsappInput.value = editableWhatsAppPhone(pendingOtpPhone);
  openModal(whatsappModal);
});
copyOtpButton.addEventListener("click", async () => {
  if (!testOtpCode.textContent) return;
  try {
    await navigator.clipboard.writeText(testOtpCode.textContent);
    copyOtpButton.textContent = "Copied";
    window.setTimeout(() => {
      copyOtpButton.textContent = "Copy code";
    }, 1400);
  } catch (_error) {
    otpInput.value = testOtpCode.textContent;
  }
});
saveDetailsButton.addEventListener("click", () => {
  state.draft.customer.name = customerNameInput.value.trim();
  state.draft.customer.phone = customerPhoneInput.value.trim();
  state.draft.customer.address = customerAddressInput.value.trim();
  persistDraft();
  syncFulfillmentUi();
  closeModal(detailsModal);
});
saveProfileButton.addEventListener("click", saveProfile);
profileEmailInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveProfile();
  }
});
productModalAddButton.addEventListener("click", async () => {
  if (!selectedProductId) return;
  await addToCart(selectedProductId, productModalAddButton);
  closeModal(productModal);
});

bootstrap().catch((error) => {
  catalog.innerHTML = `
    <section class="empty-card">
      <strong>Unable to load the storefront.</strong>
      <p>${escapeHtml(error.message)}</p>
    </section>
  `;
});
