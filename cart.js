const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const params = new URLSearchParams(window.location.search);
const appMode = params.get("mode") === "test" ? "test" : "live";
const modeQuery = appMode === "test" ? "?mode=test" : "";
const assetVersion = "20260422-bliss-lifestyle-photos";
const draftKey = `bakeaholic-checkout-draft-${appMode}`;
const latestOrderKey = `bakeaholic-latest-order-${appMode}`;

const state = {
  store: null,
  promo: null,
  items: [],
  paymentMethods: [],
  vouchers: [],
  cart: null,
  pendingPaymentUrl: "",
  draft: loadDraft()
};

const modeBanner = document.getElementById("modeBanner");
const backToStoreLink = document.getElementById("backToStoreLink");
const addItemsLink = document.getElementById("addItemsLink");
const addressButton = document.getElementById("addressButton");
const addressTitle = document.getElementById("addressTitle");
const addressText = document.getElementById("addressText");
const deliveryFeeLine = document.getElementById("deliveryFeeLine");
const deliveryDetailsSection = document.getElementById("deliveryDetailsSection");
const deliveryNotesSection = document.getElementById("deliveryNotesSection");
const deliveryInstructionsSummary = document.getElementById("deliveryInstructionsSummary");
const deliveryInstructionsButton = document.getElementById("deliveryInstructionsButton");
const deliveryNotesInput = document.getElementById("deliveryNotesInput");
const selectedItemsTitle = document.getElementById("selectedItemsTitle");
const cartItems = document.getElementById("cartItems");
const upsellSection = document.getElementById("upsellSection");
const upsellCard = document.getElementById("upsellCard");
const customerNameInput = document.getElementById("customerNameInput");
const customerEmailInput = document.getElementById("customerEmailInput");
const customerPhoneInput = document.getElementById("customerPhoneInput");
const customerAddressInput = document.getElementById("customerAddressInput");
const addressField = document.getElementById("addressField");
const orderNotesInput = document.getElementById("orderNotesInput");
const voucherInput = document.getElementById("voucherInput");
const applyVoucherButton = document.getElementById("applyVoucherButton");
const voucherMessage = document.getElementById("voucherMessage");
const choosePaymentButton = document.getElementById("choosePaymentButton");
const selectedPaymentButton = document.getElementById("selectedPaymentButton");
const paymentLogo = document.getElementById("paymentLogo");
const paymentMethodLabel = document.getElementById("paymentMethodLabel");
const paymentMethodHint = document.getElementById("paymentMethodHint");
const checkoutMessageSection = document.getElementById("checkoutMessageSection");
const checkoutMessage = document.getElementById("checkoutMessage");
const checkoutSummaryCard = document.querySelector(".checkout-summary-card");
const checkoutCustomerCard = document.querySelector(".checkout-customer-card");
const checkoutNotesCard = document.querySelector(".checkout-notes-card");
const checkoutVoucherCard = document.querySelector(".checkout-voucher-card");
const checkoutPaymentCard = document.querySelector(".checkout-payment-card");
const subtotalValue = document.getElementById("subtotalValue");
const deliveryValue = document.getElementById("deliveryValue");
const discountRow = document.getElementById("discountRow");
const discountLabel = document.getElementById("discountLabel");
const discountValue = document.getElementById("discountValue");
const taxValue = document.getElementById("taxValue");
const taxToggleButton = document.getElementById("taxToggleButton");
const taxBreakdownRow = document.getElementById("taxBreakdownRow");
const taxBreakdownValue = document.getElementById("taxBreakdownValue");
const totalValue = document.getElementById("totalValue");
const footerPaymentLogo = document.getElementById("footerPaymentLogo");
const footerPaymentLabel = document.getElementById("footerPaymentLabel");
const footerCartMeta = document.getElementById("footerCartMeta");
const footerTotalLabel = document.getElementById("footerTotalLabel");
const footerAddressButton = document.getElementById("footerAddressButton");
const footerAddressLabel = document.getElementById("footerAddressLabel");
const paymentFooter = document.querySelector(".payment-footer");
const footerWhatsappLink = document.getElementById("footerWhatsappLink");
const footerInstagramLink = document.getElementById("footerInstagramLink");
const footerTermsLink = document.getElementById("footerTermsLink");
const footerPrivacyLink = document.getElementById("footerPrivacyLink");
const submitOrderButton = document.getElementById("submitOrderButton");
const modalScrim = document.getElementById("modalScrim");
const paymentModal = document.getElementById("paymentModal");
const paymentMethodList = document.getElementById("paymentMethodList");
const closePaymentModal = document.getElementById("closePaymentModal");
const whatsappModal = document.getElementById("whatsappModal");
const closeWhatsappModal = document.getElementById("closeWhatsappModal");
const whatsappPrompt = document.getElementById("whatsappPrompt");
const whatsappMessage = document.getElementById("whatsappMessage");
const whatsappInput = document.getElementById("whatsappInput");
const saveWhatsappButton = document.getElementById("saveWhatsappButton");
const otpModal = document.getElementById("otpModal");
const closeOtpModal = document.getElementById("closeOtpModal");
const otpPrompt = document.getElementById("otpPrompt");
const otpInput = document.getElementById("otpInput");
const otpMessage = document.getElementById("otpMessage");
const verifyOtpButton = document.getElementById("verifyOtpButton");
const resendOtpButton = document.getElementById("resendOtpButton");
const changePhoneButton = document.getElementById("changePhoneButton");
const otpTimerText = document.getElementById("otpTimerText");
const testOtpCard = document.getElementById("testOtpCard");
const testOtpCode = document.getElementById("testOtpCode");
const copyOtpButton = document.getElementById("copyOtpButton");
const detailsModal = document.getElementById("detailsModal");
const closeDetailsModal = document.getElementById("closeDetailsModal");
const locationModal = document.getElementById("locationModal");
const detailsModalTitle = document.getElementById("detailsModalTitle");
const modalNameInput = document.getElementById("modalNameInput");
const modalPhoneInput = document.getElementById("modalPhoneInput");
const modalEmailInput = document.getElementById("modalEmailInput");
const modalAddressLabel = document.getElementById("modalAddressLabel");
const modalAddressInput = document.getElementById("modalAddressInput");
const saveDetailsButton = document.getElementById("saveDetailsButton");
const changeAddressInlineButton = document.getElementById("changeAddressInlineButton");

let locationPicker;
let pendingOtpPhone = "";
let otpResendAvailableAt = 0;
let otpTimerId = 0;
let submitAfterLogin = false;

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
    paymentMethodId: "qris",
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

function hasDeliveryDestination(destination = state.draft.destination) {
  const formattedAddress = String(destination.formattedAddress || "").trim();
  const label = String(destination.label || "").trim();
  const isPlaceholderAddress =
    !formattedAddress
    || /^Pinned/i.test(formattedAddress)
    || /^Pinned/i.test(label);

  return Number.isFinite(Number(destination.lat))
    && Number.isFinite(Number(destination.lng))
    && destination.locationConfirmed !== false
    && !isPlaceholderAddress;
}

function request(path, options = {}) {
  return fetch(path, {
    headers: {
      "Content-Type": "application/json",
      "X-App-Mode": appMode
    },
    ...options
  }).then(async (response) => {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed: ${response.status}`);
    }
    return response.json();
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setMessage(element, text, tone = "error") {
  if (!element) return;
  element.textContent = text || "";
  element.dataset.tone = tone;
  element.hidden = !text;
}

function normalizeWhatsAppPhone(input) {
  const digits = String(input || "").replace(/[^\d]/g, "");
  if (!digits) {
    return "";
  }
  return digits.startsWith("62") ? digits : `62${digits.replace(/^0+/, "")}`;
}

function withVerificationPrompt(prompt) {
  const basePrompt = String(prompt || "Enter your WhatsApp number to continue ordering.").trim();
  const verificationCopy = "We will send you a verification code via WhatsApp.";
  return basePrompt.toLowerCase().includes(verificationCopy.toLowerCase())
    ? basePrompt
    : `${basePrompt} ${verificationCopy}`;
}

function versionedAsset(path) {
  if (!path || !path.startsWith("/assets/")) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}v=${assetVersion}`;
}

function currentPaymentMethod() {
  return state.paymentMethods.find((method) => method.id === state.draft.paymentMethodId)
    || state.paymentMethods.find((method) => method.id === "qris")
    || state.paymentMethods[0];
}

function setCheckoutMessage(message = "", tone = "error") {
  checkoutMessageSection.hidden = !message;
  checkoutMessage.textContent = message;
  checkoutMessage.dataset.tone = tone;
}

function setSubmitButtonState(label, disabled) {
  submitOrderButton.textContent = label;
  submitOrderButton.disabled = disabled;
}

function applyCartPayload(cartPayload) {
  state.cart = cartPayload;
  if (state.cart?.shipping?.distanceKm) {
    state.draft.destination.routeDistanceKm = state.cart.shipping.distanceKm;
    state.draft.destination.deliveryFee = state.cart.deliveryFee;
  }
  state.draft.destination.quoteSource = state.cart?.quoteSource || "";
  state.draft.destination.courierName = state.cart?.shipping?.courierName || "";
  state.draft.destination.courierServiceName = state.cart?.shipping?.courierServiceName || "";
  persistDraft();
  renderCartItems();
  renderUpsell();
  renderSummary();
  renderPaymentChoice();
  if (!state.pendingPaymentUrl) {
    setSubmitButtonState("Submit Order", state.cart.itemCount === 0);
  }
  syncFulfillmentUi();
  syncCheckoutVisibility();
}

function syncTopLinks() {
  backToStoreLink.href = `/index.html${modeQuery}`;
  addItemsLink.href = `/index.html${modeQuery}`;
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
  }

  if (footerPrivacyLink) {
    footerPrivacyLink.href = state.store?.privacyUrl || "#privacy";
  }
}

function syncFulfillmentUi() {
  state.draft.fulfillmentType = "delivery";
  deliveryNotesSection.hidden = false;
  addressField.hidden = false;
  detailsModalTitle.textContent = "Delivery details";
  modalAddressLabel.textContent = "Address";
  addressTitle.textContent = hasDeliveryDestination()
    ? "Your delivery address"
    : state.store.addressLabel;
  addressText.textContent =
    state.draft.destination.formattedAddress || "Add your address before placing the order.";
  if (footerAddressLabel) {
    footerAddressLabel.textContent = state.draft.destination.formattedAddress || "Set delivery address";
  }
  syncDeliveryInstructionsUi();

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

function syncCheckoutVisibility() {
  const hasItems = (state.cart?.itemCount || 0) > 0;
  document.body.classList.toggle("cart-is-empty", !hasItems);

  [
    deliveryNotesSection,
    deliveryDetailsSection,
    checkoutCustomerCard,
    checkoutNotesCard,
    checkoutVoucherCard,
    checkoutPaymentCard,
    checkoutSummaryCard
  ].forEach((section) => {
    if (section) {
      section.hidden = !hasItems;
    }
  });

  if (paymentFooter) {
    paymentFooter.hidden = !hasItems;
  }

  if (upsellSection && !hasItems) {
    upsellSection.hidden = true;
  }

  if (!hasItems) {
    checkoutMessageSection.hidden = true;
  }
}

function hydrateForm() {
  customerNameInput.value = state.draft.customer.name;
  customerEmailInput.value = state.draft.customer.email || "";
  customerPhoneInput.value = state.draft.customer.phone;
  customerAddressInput.value = state.draft.destination.formattedAddress || state.draft.customer.address;
  modalNameInput.value = state.draft.customer.name;
  modalEmailInput.value = state.draft.customer.email || "";
  modalPhoneInput.value = state.draft.customer.phone;
  modalAddressInput.value = state.draft.destination.formattedAddress || state.draft.customer.address;
  deliveryNotesInput.value = state.draft.deliveryNotes;
  syncDeliveryInstructionsUi();
  if (orderNotesInput) {
    orderNotesInput.value = state.draft.orderNotes;
  }
  voucherInput.value = state.draft.voucherCode;
}

function syncDraftFromForm() {
  state.draft.customer.name = customerNameInput.value.trim();
  state.draft.customer.email = customerEmailInput.value.trim();
  state.draft.customer.phone = customerPhoneInput.value.trim();
  state.draft.customer.address = customerAddressInput.value.trim();
  state.draft.deliveryNotes = deliveryNotesInput.value.trim();
  syncDeliveryInstructionsUi();
  state.draft.orderNotes = orderNotesInput?.value.trim() || "";
  persistDraft();
}

function syncDeliveryInstructionsUi() {
  const note = state.draft.deliveryNotes || deliveryNotesInput.value.trim();
  if (deliveryInstructionsSummary) {
    deliveryInstructionsSummary.textContent = note || "";
  }
  deliveryInstructionsButton.innerHTML = `
    <span>${note ? "Edit delivery instructions" : "Add delivery instructions"}</span>
    <span>⌄</span>
  `;
}

function openModal(modal) {
  modal.hidden = false;
  modalScrim.hidden = false;
}

function closeModal(modal) {
  modal.hidden = true;
  if (paymentModal.hidden && whatsappModal.hidden && otpModal.hidden && detailsModal.hidden && locationModal.hidden) {
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

function openWhatsappModal() {
  syncDraftFromForm();
  const phone = normalizeWhatsAppPhone(state.draft.customer.phone);
  whatsappInput.value = phone ? phone.replace(/^62/, "") : "";
  setMessage(whatsappMessage, "");
  openModal(whatsappModal);
  whatsappInput.focus();
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
  if (!phone) {
    setMessage(whatsappMessage, "Please enter your WhatsApp number");
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
    if (payload.registration.profile?.email && !state.draft.customer.email) {
      state.draft.customer.email = payload.registration.profile.email;
    }
    if (payload.registration.profile?.name && !state.draft.customer.name) {
      state.draft.customer.name = payload.registration.profile.name;
    }
    persistDraft();
    hydrateForm();
    setMessage(otpMessage, "WhatsApp number verified.", "success");
    closeModal(otpModal);
    if (submitAfterLogin) {
      submitAfterLogin = false;
      await submitOrder();
    }
  } catch (error) {
    setMessage(otpMessage, error.message);
  } finally {
    verifyOtpButton.disabled = false;
    verifyOtpButton.textContent = "Verify";
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

function renderPaymentChoice() {
  const payment = currentPaymentMethod();
  if (!payment) return;

  state.draft.paymentMethodId = payment.id;
  persistDraft();

  paymentLogo.textContent = payment.logoText;
  paymentMethodLabel.textContent = payment.label;
  paymentMethodHint.textContent = payment.kind === "qris"
    ? "Scan a QR code on the next screen to finish payment."
    : payment.kind === "va"
      ? "We will generate a virtual account number after submit."
      : "Use a placeholder card method for the prototype flow.";

  if (footerPaymentLogo) footerPaymentLogo.textContent = payment.logoText;
  if (footerPaymentLabel) footerPaymentLabel.textContent = payment.label;
}

function findUpsellItem() {
  const cartIds = new Set(state.cart?.items.map((entry) => entry.itemId) || []);
  return state.items.find((item) => item.id === state.promo.itemId && !cartIds.has(item.id))
    || state.items.find((item) => !cartIds.has(item.id));
}

function renderUpsell() {
  const upsell = findUpsellItem();
  if (!upsell) {
    upsellSection.hidden = true;
    return;
  }

  upsellSection.hidden = false;
  upsellCard.innerHTML = `
    <article class="upsell-card checkout-upsell-card">
      <img class="upsell-thumb" src="${escapeHtml(versionedAsset(upsell.imagePath))}" alt="${escapeHtml(upsell.name)}" />
      <div class="upsell-copy">
        <span class="upsell-label">Optional add-on</span>
        <strong>${escapeHtml(upsell.name)}</strong>
        <p>${escapeHtml(upsell.description)}</p>
        <strong>${formatRupiah.format(upsell.price)}</strong>
      </div>
      <button class="mini-add-button upsell-add-button" id="upsellAddButton" type="button">+ Add</button>
    </article>
  `;

  document.getElementById("upsellAddButton").addEventListener("click", async () => {
    await request("/api/cart", {
      method: "POST",
      body: JSON.stringify({ itemId: upsell.id, quantity: 1 })
    });
    await refreshCart();
  });
}

function renderCartItems() {
  const count = state.cart?.itemCount || 0;
  selectedItemsTitle.textContent = `Selected items (${count})`;

  if (!count) {
    cartItems.innerHTML = `
      <section class="empty-card">
        <strong>Your cart is empty.</strong>
        <p>Add a few products from the store first, then checkout will appear here.</p>
        <a class="primary-button empty-cart-button" href="/index.html${modeQuery}">Browse products</a>
      </section>
    `;
    upsellSection.hidden = true;
    return;
  }

  cartItems.innerHTML = state.cart.lineItems
    .map(
      (entry) => `
        <article class="cart-line-card">
          <div class="cart-thumb-wrap">
            <img class="cart-line-thumb" src="${escapeHtml(versionedAsset(entry.item.imagePath))}" alt="${escapeHtml(entry.item.name)}" />
          </div>
          <div class="cart-line-copy">
            <strong>${escapeHtml(entry.item.name)}</strong>
            <span>${formatRupiah.format(entry.item.price)}</span>
            <div class="quantity-row">
              <button class="qty-box" type="button" data-item-id="${escapeHtml(entry.itemId)}" data-action="decrease">−</button>
              <strong>${entry.quantity}</strong>
              <button class="qty-box" type="button" data-item-id="${escapeHtml(entry.itemId)}" data-action="increase" ${entry.quantity >= entry.item.stock ? "disabled" : ""}>+</button>
            </div>
          </div>
          <button class="text-action align-self-end" type="button">Edit</button>
        </article>
      `
    )
    .join("");

  cartItems.querySelectorAll("[data-item-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemId = button.dataset.itemId;
      const current = state.cart.items.find((entry) => entry.itemId === itemId)?.quantity || 0;
      const nextQuantity = button.dataset.action === "increase" ? current + 1 : current - 1;
      await request("/api/cart", {
        method: "PATCH",
        body: JSON.stringify({ itemId, quantity: nextQuantity })
      });
      await refreshCart();
    });
  });
}

function renderSummary() {
  subtotalValue.textContent = formatRupiah.format(state.cart.subtotal);
  deliveryValue.textContent = hasDeliveryDestination()
    ? formatRupiah.format(state.cart.deliveryFee)
    : "Set address";
  taxValue.textContent = formatRupiah.format(state.cart.tax);
  taxBreakdownValue.textContent = formatRupiah.format(state.cart.tax);
  totalValue.textContent = formatRupiah.format(state.cart.total);
  if (footerCartMeta) footerCartMeta.textContent = `${state.cart.itemCount} item${state.cart.itemCount === 1 ? "" : "s"}`;
  if (footerTotalLabel) footerTotalLabel.textContent = formatRupiah.format(state.cart.total);

  const discountAmount = state.cart.discount?.amount || 0;
  discountRow.hidden = discountAmount <= 0;
  if (discountAmount > 0) {
    discountLabel.textContent = `Discount (${state.cart.discount.code})`;
    discountValue.textContent = `-${formatRupiah.format(discountAmount)}`;
    voucherMessage.textContent = state.cart.discount.label;
    voucherMessage.hidden = false;
  } else {
    voucherMessage.textContent = state.cart.discount?.code
      ? state.cart.discount.label || "Voucher saved. If it is valid, it will apply in the total."
      : "";
    voucherMessage.hidden = !voucherMessage.textContent;
  }
}

function renderPaymentModal() {
  paymentMethodList.innerHTML = state.paymentMethods
    .map(
      (method) => `
        <button class="payment-method-option" type="button" data-method-id="${escapeHtml(method.id)}">
          <span class="payment-logo">${escapeHtml(method.logoText)}</span>
          <span>${escapeHtml(method.label)}</span>
          <span class="address-arrow">›</span>
        </button>
      `
    )
    .join("");

  paymentMethodList.querySelectorAll("[data-method-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.draft.paymentMethodId = button.dataset.methodId;
      state.pendingPaymentUrl = "";
      persistDraft();
      renderPaymentChoice();
      setCheckoutMessage("");
      setSubmitButtonState("Submit Order", state.cart?.itemCount === 0);
      closeModal(paymentModal);
    });
  });
}

async function refreshCart() {
  syncDraftFromForm();
  const cartPayload = await request(`/api/cart?${buildCartQuery()}`);
  applyCartPayload(cartPayload);
}

async function syncSessionProfile() {
  try {
    const payload = await request("/api/session");
    if (!payload?.authenticated) {
      return false;
    }

    state.draft.customer.phone = payload.customer?.phone || state.draft.customer.phone;
    state.draft.customer.phoneVerifiedAt = payload.customer?.verifiedAt || state.draft.customer.phoneVerifiedAt;
    if (payload.profile?.email && !state.draft.customer.email) {
      state.draft.customer.email = payload.profile.email;
    }
    if (payload.profile?.name && !state.draft.customer.name) {
      state.draft.customer.name = payload.profile.name;
    }
    persistDraft();
    return true;
  } catch (_error) {
    return false;
  }
}

async function submitOrder() {
  try {
    if (state.pendingPaymentUrl) {
      window.location.assign(state.pendingPaymentUrl);
      return;
    }

    syncDraftFromForm();
    setCheckoutMessage("");
    if (!state.draft.customer.phoneVerifiedAt) {
      submitAfterLogin = true;
      openWhatsappModal();
      setCheckoutMessage("Please verify your WhatsApp number to continue checkout.", "success");
      setSubmitButtonState("Submit Order", state.cart?.itemCount === 0);
      return;
    }

    setSubmitButtonState("Submitting...", true);

    const payload = {
      customer: state.draft.customer,
      destination: state.draft.destination,
      fulfillmentType: state.draft.fulfillmentType,
      deliveryNotes: state.draft.deliveryNotes,
      orderNotes: "",
      voucherCode: state.draft.voucherCode,
      paymentMethodId: state.draft.paymentMethodId
    };

    const response = await request("/api/checkout", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    localStorage.setItem(latestOrderKey, response.order.id);
    state.pendingPaymentUrl = `/pay.html${modeQuery ? `${modeQuery}&order=${response.order.id}` : `?order=${response.order.id}`}`;
    applyCartPayload({
      items: [],
      lineItems: [],
      subtotal: 0,
      deliveryFee: 0,
      shipping: {
        distanceKm: 0,
        bikeFare: 0,
        serviceFee: 0,
        total: 0
      },
      discount: {
        code: "",
        label: "",
        amount: 0
      },
      tax: 0,
      total: 0,
      itemCount: 0,
      fulfillmentType: state.draft.fulfillmentType,
      perkUnlocked: false
    });
    setSubmitButtonState("Opening payment...", true);
    window.location.assign(state.pendingPaymentUrl);

    window.setTimeout(() => {
      if (!state.pendingPaymentUrl) {
        return;
      }
      setCheckoutMessage("Order created. Tap the button again to open the payment page if it did not open automatically.", "success");
      setSubmitButtonState("Open Payment Page", false);
    }, 1200);
  } catch (error) {
    state.pendingPaymentUrl = "";
    if (String(error.message || "").toLowerCase().includes("basket is empty")) {
      const latestOrderId = localStorage.getItem(latestOrderKey);
      if (latestOrderId) {
        state.pendingPaymentUrl = `/pay.html${modeQuery ? `${modeQuery}&order=${latestOrderId}` : `?order=${latestOrderId}`}`;
        setCheckoutMessage("This order was already created. Tap below to open its payment page.", "success");
        setSubmitButtonState("Open Payment Page", false);
        return;
      }
    }
    if (String(error.message || "").toLowerCase().includes("verify your whatsapp")) {
      submitAfterLogin = true;
      openWhatsappModal();
      setCheckoutMessage("Please verify your WhatsApp number to continue checkout.", "success");
      setSubmitButtonState("Submit Order", false);
      return;
    }
    setCheckoutMessage(error.message || "Unable to submit the order.");
    setSubmitButtonState("Submit Order", false);
  }
}

async function bootstrap() {
  const payload = await request("/api/menu");
  state.store = payload.store;
  state.promo = payload.promo;
  state.items = payload.items;
  state.paymentMethods = payload.paymentMethods;
  state.vouchers = payload.vouchers;

  modeBanner.hidden = appMode !== "test";
  document.title = "Checkout | Bakeaholic Online Shop";
  syncTopLinks();
  syncFooterLinks();
  whatsappPrompt.textContent = withVerificationPrompt(state.store.whatsappPrompt);
  await syncSessionProfile();
  hydrateForm();
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
      hydrateForm();
      closeModal(locationModal);
      await refreshCart();
    }
  });
  syncFulfillmentUi();
  renderPaymentModal();
  renderPaymentChoice();
  await refreshCart();
  setSubmitButtonState("Submit Order", (state.cart?.itemCount || 0) === 0);
}

[
  customerNameInput,
  customerEmailInput,
  customerPhoneInput,
  customerAddressInput,
  deliveryNotesInput,
  orderNotesInput
].filter(Boolean).forEach((field) => {
  field.addEventListener("input", () => {
    state.pendingPaymentUrl = "";
    if (field === customerPhoneInput) {
      state.draft.customer.phoneVerifiedAt = "";
    }
    syncDraftFromForm();
    setCheckoutMessage("");
  });
});

deliveryInstructionsButton.addEventListener("click", () => {
  deliveryNotesInput.hidden = !deliveryNotesInput.hidden;
  if (!deliveryNotesInput.hidden) {
    deliveryNotesInput.focus();
  }
});

taxToggleButton?.addEventListener("click", () => {
  const expanded = taxToggleButton.getAttribute("aria-expanded") === "true";
  taxToggleButton.setAttribute("aria-expanded", String(!expanded));
  taxBreakdownRow.hidden = expanded;
});

applyVoucherButton.addEventListener("click", async () => {
  state.pendingPaymentUrl = "";
  state.draft.voucherCode = voucherInput.value.trim().toUpperCase();
  persistDraft();
  setCheckoutMessage("");
  await refreshCart();
});

choosePaymentButton.addEventListener("click", () => openModal(paymentModal));
selectedPaymentButton.addEventListener("click", () => openModal(paymentModal));
closePaymentModal.addEventListener("click", () => closeModal(paymentModal));
saveWhatsappButton.addEventListener("click", requestOtp);
closeWhatsappModal.addEventListener("click", () => closeModal(whatsappModal));
whatsappInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    requestOtp();
  }
});
verifyOtpButton.addEventListener("click", verifyOtp);
closeOtpModal.addEventListener("click", () => closeModal(otpModal));
otpInput.addEventListener("input", () => {
  otpInput.value = otpInput.value.replace(/[^\d]/g, "").slice(0, 6);
});
otpInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    verifyOtp();
  }
});
resendOtpButton.addEventListener("click", async () => {
  whatsappInput.value = pendingOtpPhone.replace(/^62/, "");
  await requestOtp();
});
changePhoneButton.addEventListener("click", () => {
  closeModal(otpModal);
  whatsappInput.value = pendingOtpPhone.replace(/^62/, "");
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
addressButton.addEventListener("click", () => {
  openModal(locationModal);
  locationPicker?.open();
});
footerAddressButton?.addEventListener("click", () => {
  openModal(locationModal);
  locationPicker?.open();
});
changeAddressInlineButton.addEventListener("click", () => {
  openModal(locationModal);
  locationPicker?.open();
});
closeDetailsModal.addEventListener("click", () => closeModal(detailsModal));
document.getElementById("closeLocationModal")?.addEventListener("click", () => closeModal(locationModal));
saveDetailsButton.addEventListener("click", async () => {
  state.pendingPaymentUrl = "";
  state.draft.customer.name = modalNameInput.value.trim();
  state.draft.customer.email = modalEmailInput.value.trim();
  state.draft.customer.phone = modalPhoneInput.value.trim();
  state.draft.customer.address = modalAddressInput.value.trim();
  persistDraft();
  hydrateForm();
  syncFulfillmentUi();
  closeModal(detailsModal);
  await refreshCart();
});
modalScrim.addEventListener("click", () => {
  closeModal(paymentModal);
  closeModal(whatsappModal);
  closeModal(otpModal);
  closeModal(detailsModal);
  closeModal(locationModal);
});
submitOrderButton.addEventListener("click", submitOrder);

bootstrap().catch((error) => {
  document.body.innerHTML = `
    <div class="mobile-shell">
      <section class="empty-card">
        <strong>Unable to load the cart.</strong>
        <p>${escapeHtml(error.message)}</p>
      </section>
    </div>
  `;
});
