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
const draftKey = `bakeaholic-checkout-draft-${shopperStateVersion}-${appMode}`;
const latestOrderKey = `bakeaholic-latest-order-${shopperStateVersion}-${appMode}`;
const cartSessionKey = `bakeaholic-cart-session-${shopperStateVersion}-${appMode}`;

const state = {
  store: null,
  promo: null,
  items: [],
  paymentMethods: [],
  vouchers: [],
  cart: null,
  pendingPaymentUrl: "",
  currentOrder: null,
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
const inlinePaymentMethodList = document.getElementById("inlinePaymentMethodList");
const checkoutXenditPanel = document.getElementById("checkoutXenditPanel");
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
    paymentMethodId: "xendit-qris",
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

function getCartSessionId() {
  const urlSessionId = String(params.get("cart_session") || "");
  if (/^[a-f0-9]{32}$/i.test(urlSessionId)) {
    return urlSessionId.toLowerCase();
  }
  try {
    return localStorage.getItem(cartSessionKey) || "";
  } catch (_error) {
    return "";
  }
}

function rememberCartSession(payload) {
  const sessionId = String(payload?.cartSessionId || "");
  if (!/^[a-f0-9]{32}$/i.test(sessionId)) {
    return;
  }
  try {
    localStorage.setItem(cartSessionKey, sessionId.toLowerCase());
  } catch (_error) {
    // Cookies still cover the common case.
  }
}

function request(path, options = {}) {
  const cartSessionId = getCartSessionId();
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-App-Mode": appMode,
      ...(cartSessionId ? { "X-Cart-Session": cartSessionId } : {}),
      ...(options.headers || {})
    }
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed: ${response.status}`);
    }
    rememberCartSession(payload);
    return payload;
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
    || state.paymentMethods.find((method) => method.id === "xendit-qris")
    || state.paymentMethods[0];
}

function paymentUrlForOrder(order) {
  const localPaymentUrl = `/pay.html${modeQuery ? `${modeQuery}&order=${order.id}` : `?order=${order.id}`}`;
  return localPaymentUrl;
}

function xenditCheckoutUrlForOrder(order) {
  return order?.payment?.paymentUrl || "";
}

function actionValue(action) {
  const value = action?.value;
  if (value && typeof value === "object") {
    return value.qr_string
      || value.qr_code
      || value.qr_code_url
      || value.virtual_account_number
      || value.account_number
      || value.payment_code
      || value.url
      || JSON.stringify(value);
  }
  return String(value || "");
}

function qrImageSource(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) {
    return value;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(value)}`;
}

function formatRemainingTime(expiresAt) {
  const diffMs = Math.max(0, new Date(expiresAt || Date.now()).getTime() - Date.now());
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds} remaining`;
}

function paymentPresentAction(payment) {
  return (payment?.actions || []).find((action) =>
    String(action.type || "").toUpperCase() === "PRESENT_TO_CUSTOMER"
  );
}

function paymentPresentValue(payment) {
  return actionValue(paymentPresentAction(payment));
}

function paymentStatusButtonMarkup(order) {
  return `
    <button class="primary-button checkout-payment-status-button" type="button" data-payment-status="${escapeHtml(order.id)}">
      I've paid / check status
    </button>
  `;
}

function bankOptionsMarkup(order) {
  const banks = Array.isArray(order.payment?.bankOptions) && order.payment.bankOptions.length
    ? order.payment.bankOptions
    : [
      { code: "BCA", label: "BCA" },
      { code: "BNI", label: "BNI" },
      { code: "BRI", label: "BRI" },
      { code: "MANDIRI", label: "Mandiri" },
      { code: "PERMATA", label: "Permata" },
      { code: "CIMB", label: "CIMB Niaga" }
    ];

  return `
    <div class="checkout-native-payment checkout-native-bank">
      <div class="checkout-native-head">
        <div>
          <strong>Choose your bank</strong>
          <span>Select a bank to generate your virtual account number.</span>
        </div>
        <span class="payment-countdown">${formatRemainingTime(order.expiresAt)}</span>
      </div>
      <div class="checkout-bank-grid">
        ${banks.map((bank) => `
          <button class="checkout-bank-button" type="button" data-bank-code="${escapeHtml(bank.code)}">
            <span class="payment-logo">${escapeHtml(bank.code)}</span>
            <strong>${escapeHtml(bank.label)}</strong>
          </button>
        `).join("")}
      </div>
      <p class="checkout-native-note">Choose your bank and the virtual account will appear here.</p>
    </div>
  `;
}

function nativePaymentMarkup(order) {
  const payment = order.payment || {};
  const presentValue = paymentPresentValue(payment);
  const paymentUrl = xenditCheckoutUrlForOrder(order);

  if (payment.kind === "qris") {
    const qrSource = qrImageSource(presentValue || payment.qrCodeData || "");
    return `
      <div class="checkout-native-payment checkout-native-qris">
        <div class="checkout-native-head">
          <div>
            <strong>QRIS payment</strong>
            <span>Scan with your e-wallet or banking app.</span>
          </div>
          <span class="payment-countdown">${formatRemainingTime(order.expiresAt)}</span>
        </div>
        <div class="checkout-qris-box">
          ${qrSource
            ? `<img class="checkout-qris-image" src="${escapeHtml(qrSource)}" alt="QRIS payment code" />`
            : `<div class="checkout-payment-placeholder">Generating QR code...</div>`}
        </div>
        <div class="checkout-native-total">
          <span>Total payment</span>
          <strong>${formatRupiah.format(order.pricing.total)}</strong>
        </div>
        ${paymentStatusButtonMarkup(order)}
      </div>
    `;
  }

  if (payment.kind === "va") {
    if (!presentValue && !payment.accountNumber) {
      return bankOptionsMarkup(order);
    }
    const accountNumber = presentValue || payment.accountNumber;
    return `
      <div class="checkout-native-payment checkout-native-va">
        <div class="checkout-native-head">
          <div>
            <strong>${escapeHtml(payment.selectedBankLabel || payment.label || "Bank Transfer")}</strong>
            <span>Transfer exactly to this virtual account.</span>
          </div>
          <span class="payment-countdown">${formatRemainingTime(order.expiresAt)}</span>
        </div>
        <div class="checkout-va-number">
          <span>Virtual account number</span>
          <strong>${escapeHtml(accountNumber)}</strong>
          <button class="secondary-button compact-button" type="button" data-copy-payment="${escapeHtml(accountNumber)}">Copy</button>
        </div>
        <div class="checkout-native-total">
          <span>Total payment</span>
          <strong>${formatRupiah.format(order.pricing.total)}</strong>
        </div>
        ${paymentStatusButtonMarkup(order)}
      </div>
    `;
  }

  if (paymentUrl) {
    return `
      <div class="checkout-xendit-head">
        <div>
          <strong>Card payment</strong>
          <span>Enter your card details securely below.</span>
        </div>
        <a class="secondary-link" href="${escapeHtml(paymentUrl)}" target="_blank" rel="noreferrer">Open in new tab</a>
      </div>
      <iframe
        class="checkout-xendit-frame"
        src="${escapeHtml(paymentUrl)}"
        title="Xendit secure card checkout"
        loading="eager"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    `;
  }

  return `
    <div class="checkout-xendit-loading">
      <strong>Payment is being prepared...</strong>
      <span>Please wait a moment and try again.</span>
    </div>
  `;
}

function bindCheckoutPaymentPanel(order) {
  checkoutXenditPanel.querySelectorAll("[data-bank-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      const originalHtml = button.innerHTML;
      try {
        checkoutXenditPanel.querySelectorAll("[data-bank-code]").forEach((entry) => {
          entry.disabled = true;
        });
        button.innerHTML = "<strong>Generating...</strong>";
        await updateCurrentOrderPaymentMethod("xendit-va", button.dataset.bankCode);
      } catch (error) {
        button.innerHTML = originalHtml;
        checkoutXenditPanel.querySelectorAll("[data-bank-code]").forEach((entry) => {
          entry.disabled = false;
        });
        setCheckoutMessage(error.message || "Unable to generate virtual account.");
      }
    });
  });

  checkoutXenditPanel.querySelectorAll("[data-copy-payment]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyPayment);
        button.textContent = "Copied";
      } catch (_error) {
        button.textContent = "Copy failed";
      }
    });
  });

  checkoutXenditPanel.querySelectorAll("[data-payment-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Checking...";
      try {
        const response = await request("/api/order/payment-status", {
          method: "POST",
          body: JSON.stringify({ id: order.id })
        });
        state.currentOrder = response.order;
        renderEmbeddedPayment(response.order, false);
        if (response.order.status === "paid" || response.order.status === "preparing") {
          setCheckoutMessage("Payment received. Your order is confirmed.", "success");
        } else {
          setCheckoutMessage("Payment is still waiting. Please complete it below.", "success");
        }
      } catch (error) {
        setCheckoutMessage(error.message || "Unable to check payment status.");
        button.disabled = false;
        button.textContent = "I've paid / check status";
      }
    });
  });
}

function renderEmbeddedPayment(order) {
  if (!checkoutXenditPanel || !order?.payment) {
    return false;
  }

  checkoutXenditPanel.hidden = false;
  checkoutXenditPanel.innerHTML = nativePaymentMarkup(order);
  bindCheckoutPaymentPanel(order);
  checkoutXenditPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

async function updateCurrentOrderPaymentMethod(methodId, bankCode = "") {
  const orderId = state.currentOrder?.id || localStorage.getItem(latestOrderKey) || "";
  if (!orderId || !checkoutXenditPanel || checkoutXenditPanel.hidden) {
    return false;
  }

  hideSubmitButtonForOpenPayment();
  checkoutXenditPanel.innerHTML = `
    <div class="checkout-xendit-loading">
      <strong>Updating payment method...</strong>
      <span>Keeping the same order and refreshing the secure payment form.</span>
    </div>
  `;
  checkoutXenditPanel.hidden = false;

  const response = await request("/api/order/payment-method", {
    method: "POST",
    body: JSON.stringify({
      id: orderId,
      paymentMethodId: methodId,
      bankCode
    })
  });
  state.currentOrder = response.order;
  localStorage.setItem(latestOrderKey, response.order.id);
  state.pendingPaymentUrl = paymentUrlForOrder(response.order);
  renderEmbeddedPayment(response.order);
  setCheckoutMessage("");
  hideSubmitButtonForOpenPayment();
  return true;
}

function setCheckoutMessage(message = "", tone = "error") {
  checkoutMessageSection.hidden = !message;
  checkoutMessage.textContent = message;
  checkoutMessage.dataset.tone = tone;
}

function afterHoursMessage() {
  if (state.store?.businessHours?.enabled === false || state.store?.isOpenNow !== false) {
    return "";
  }
  const hours = state.store.businessHours || {};
  return `Online ordering is open 24 hours. Orders placed now will be prepared and sent during working hours, ${hours.open || "09:00"} to ${hours.close || "17:00"} Bali time.`;
}

function syncAfterHoursMessage() {
  const message = afterHoursMessage();
  if (message) {
    setCheckoutMessage(message, "success");
  } else if (checkoutMessage.textContent.includes("Online ordering is open 24 hours")) {
    setCheckoutMessage("");
  }
}

function submitButtonLabel() {
  if (state.pendingPaymentUrl) return "Open Payment Page";
  if ((state.cart?.total || 0) <= 0 && (state.cart?.itemCount || 0) > 0) return "Place Order";
  return "Submit Order";
}

function setSubmitButtonState(label, disabled) {
  submitOrderButton.hidden = false;
  submitOrderButton.textContent = label || submitButtonLabel();
  submitOrderButton.disabled = disabled;
}

function hideSubmitButtonForOpenPayment() {
  submitOrderButton.hidden = true;
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
    setSubmitButtonState(submitButtonLabel(), state.cart.itemCount === 0);
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

  if (paymentLogo) paymentLogo.textContent = payment.logoText;
  if (paymentMethodLabel) paymentMethodLabel.textContent = payment.label;
  if (paymentMethodHint) paymentMethodHint.textContent = payment.description
    || "Pay securely through Xendit.";

  if (footerPaymentLogo) footerPaymentLogo.textContent = payment.logoText;
  if (footerPaymentLabel) footerPaymentLabel.textContent = payment.label;

  document.querySelectorAll("[data-method-id]").forEach((button) => {
    const selected = button.dataset.methodId === payment.id;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
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
      <img class="upsell-thumb" src="${escapeHtml(versionedAsset(upsell.imagePath))}" alt="${escapeHtml(upsell.name)}" loading="lazy" decoding="async" />
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
            <img class="cart-line-thumb" src="${escapeHtml(versionedAsset(entry.item.imagePath))}" alt="${escapeHtml(entry.item.name)}" loading="lazy" decoding="async" />
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

function paymentMethodMarkup(method) {
  const selected = method.id === currentPaymentMethod()?.id;
  return `
    <button class="payment-method-option${selected ? " is-selected" : ""}" type="button" data-method-id="${escapeHtml(method.id)}" aria-pressed="${selected ? "true" : "false"}">
      <span class="payment-logo">${escapeHtml(method.logoText)}</span>
      <span>
        <strong>${escapeHtml(method.label)}</strong>
        ${method.description ? `<small>${escapeHtml(method.description)}</small>` : ""}
      </span>
      <span class="payment-check" aria-hidden="true">✓</span>
    </button>
  `;
}

function bindPaymentMethodButtons(container) {
  if (!container) return;
  container.querySelectorAll("[data-method-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.draft.paymentMethodId = button.dataset.methodId;
      persistDraft();
      renderPaymentChoice();
      setCheckoutMessage("");
      closeModal(paymentModal);
      try {
        const updatedExistingOrder = await updateCurrentOrderPaymentMethod(state.draft.paymentMethodId);
        if (!updatedExistingOrder) {
          state.pendingPaymentUrl = "";
          setSubmitButtonState(submitButtonLabel(), state.cart?.itemCount === 0);
        }
      } catch (error) {
        setCheckoutMessage(error.message || "Unable to update payment method.");
        setSubmitButtonState(submitButtonLabel(), false);
      }
    });
  });
}

function renderPaymentModal() {
  const methodHtml = state.paymentMethods
    .map(
      (method) => paymentMethodMarkup(method)
    )
    .join("");

  if (inlinePaymentMethodList) {
    inlinePaymentMethodList.innerHTML = methodHtml;
    bindPaymentMethodButtons(inlinePaymentMethodList);
  }

  if (paymentMethodList) {
    paymentMethodList.innerHTML = methodHtml;
    bindPaymentMethodButtons(paymentMethodList);
  }
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
    if (state.currentOrder && !checkoutXenditPanel.hidden) {
      await updateCurrentOrderPaymentMethod(state.draft.paymentMethodId);
      return;
    }

    syncDraftFromForm();
    setCheckoutMessage("");
    syncAfterHoursMessage();
    if (!state.draft.customer.phoneVerifiedAt) {
      submitAfterLogin = true;
      openWhatsappModal();
      setCheckoutMessage("Please verify your WhatsApp number to continue checkout.", "success");
      setSubmitButtonState(submitButtonLabel(), state.cart?.itemCount === 0);
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
    state.currentOrder = response.order;
    state.pendingPaymentUrl = paymentUrlForOrder(response.order);
    if (renderEmbeddedPayment(response.order)) {
      setCheckoutMessage("");
      hideSubmitButtonForOpenPayment();
      return;
    }

    setCheckoutMessage("Order created. Tap below to open the payment page.", "success");
    setSubmitButtonState("Open Payment Page", false);
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
      setSubmitButtonState(submitButtonLabel(), false);
      return;
    }
    setCheckoutMessage(error.message || "Unable to submit the order.");
    setSubmitButtonState(submitButtonLabel(), false);
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
  syncAfterHoursMessage();
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
  syncAfterHoursMessage();
  setSubmitButtonState(submitButtonLabel(), (state.cart?.itemCount || 0) === 0);
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

closePaymentModal?.addEventListener("click", () => closeModal(paymentModal));
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
