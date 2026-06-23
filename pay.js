const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const params = new URLSearchParams(window.location.search);
const orderRef = params.get("ref") || "";
let appMode = params.get("mode") === "test" ? "test" : "live";
let orderId = params.get("order") || "";
let orderToken = params.get("token") || "";

if (orderRef && !orderId) {
  const [refOrderId, refToken, refMode] = orderRef.split(".");
  orderId = refOrderId || "";
  orderToken = refToken || "";
  appMode = refMode === "test" ? "test" : appMode;
}

const shopperStateVersion = "20260604-session-cart";
const cartStateVersion = "20260623-cart-24h";
const latestOrderKey = `bakeaholic-latest-order-${appMode}`;
const checkoutLatestOrderKey = `bakeaholic-latest-order-${cartStateVersion}-${appMode}`;
const xenditComponentsSdkUrl = "https://cdn.jsdelivr.net/npm/xendit-components-web@0.0.24/sdk/dist/index.umd.js";

const paymentApp = document.getElementById("paymentApp");
const modalScrim = document.getElementById("modalScrim");
const cancelModal = document.getElementById("cancelModal");
const keepOrderButton = document.getElementById("keepOrderButton");
const confirmCancelButton = document.getElementById("confirmCancelButton");

let state = {
  order: null
};
let xenditComponentsSdkPromise = null;
let paymentCheckMessage = "";

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

function formatRemainingTime(expiresAt) {
  const diffMs = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds} remaining`;
}

function lineItemsMarkup() {
  return state.order.lineItems
    .map(
      (entry) => `
        <div class="purchase-row purchase-row-product">
          <img class="purchase-row-image" src="${escapeHtml(entry.item.imagePath || "/assets/bakeaholic-logo.jpg")}" alt="${escapeHtml(entry.item.name || "Bakeaholic product")}" />
          <div class="purchase-row-copy">
            <span>${entry.quantity}x ${escapeHtml(entry.item.name)}</span>
            <small>${escapeHtml(entry.item.tagline || entry.item.category || "")}</small>
          </div>
          <strong>${formatRupiah.format(entry.lineTotal)}</strong>
        </div>
      `
    )
    .join("");
}

function deliveryMapMarkup() {
  const location = state.order.fulfillment?.location || {};
  const address = state.order.fulfillment?.address || state.order.customer?.address || "";
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapQuery = hasCoords
    ? `${lat},${lng}`
    : address;
  const mapSrc = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : "";
  return `
    <section class="payment-page-card paid-delivery-card">
      ${mapSrc
        ? `<iframe class="paid-delivery-map" src="${escapeHtml(mapSrc)}" title="Delivery location" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
        : `<div class="paid-delivery-map paid-delivery-map-empty">Delivery map</div>`}
      <div class="paid-delivery-copy">
        <h2>Delivery</h2>
        <span>Your address</span>
        <p>${escapeHtml(address || "Delivery address not available")}</p>
        ${state.order.fulfillment?.deliveryNotes ? `<p>${escapeHtml(state.order.fulfillment.deliveryNotes)}</p>` : ""}
      </div>
    </section>
  `;
}

function paymentSummaryMarkup() {
  const paymentLabel = state.order.payment?.label || "Payment";
  return `
    <section class="payment-page-card paid-payment-card">
      <div class="section-title-wrap">
        <h2>Payment</h2>
        <span class="paid-method-label">${escapeHtml(paymentLabel)}</span>
      </div>
      <div class="summary-list">
        <div class="summary-row">
          <span>Subtotal</span>
          <strong>${formatRupiah.format(state.order.pricing.subtotal)}</strong>
        </div>
        <div class="summary-row">
          <span>Delivery fee</span>
          <strong>${formatRupiah.format(state.order.pricing.deliveryFee || 0)}</strong>
        </div>
        <div class="summary-row">
          <span>Tax</span>
          <strong>${formatRupiah.format(state.order.pricing.tax || 0)}</strong>
        </div>
        <div class="summary-row total-row">
          <span>Total</span>
          <strong>${formatRupiah.format(state.order.pricing.total)}</strong>
        </div>
      </div>
    </section>
  `;
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
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(value)}`;
}

function bankOptionsMarkup(payment) {
  const banks = Array.isArray(payment.bankOptions) && payment.bankOptions.length
    ? payment.bankOptions
    : [
      { code: "BNI", label: "BNI" },
      { code: "BRI", label: "BRI" },
      { code: "MANDIRI", label: "Mandiri" },
      { code: "PERMATA", label: "Permata" },
      { code: "CIMB", label: "CIMB Niaga" }
    ];

  return `
    <div class="bank-choice-panel">
      <div class="xendit-present-head">
        <div>
          <h3>Choose your bank</h3>
          <p>Select a bank to generate your virtual account number.</p>
        </div>
        <span class="payment-countdown">${formatRemainingTime(state.order.expiresAt)}</span>
      </div>
      <div class="bank-choice-grid">
        ${banks.map((bank) => `
          <button class="bank-choice-button" type="button" data-bank-code="${escapeHtml(bank.code)}">
            <span class="payment-logo">${escapeHtml(bank.code)}</span>
            <strong>${escapeHtml(bank.label)}</strong>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function xenditEmbeddedCheckoutMarkup(paymentUrl) {
  return `
    <div class="xendit-embed-card">
      <iframe
        class="xendit-checkout-frame"
        src="${escapeHtml(paymentUrl)}"
        title="Xendit secure checkout"
        loading="eager"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
      <a class="secondary-link centered-link" href="${escapeHtml(paymentUrl)}" target="_blank" rel="noreferrer">
        Open payment in a new tab
      </a>
    </div>
  `;
}

function xenditCardMarkup(payment) {
  return `
    <div class="checkout-native-payment checkout-native-card pay-card-component">
      <div class="checkout-native-head">
        <div class="checkout-card-title">
          <span class="card-method-icon" aria-hidden="true">▭</span>
          <strong>Credit / Debit Card</strong>
        </div>
        <span class="payment-countdown">${formatRemainingTime(state.order.expiresAt)}</span>
      </div>
      <div class="checkout-xendit-card-component" data-xendit-card-component>
        Loading secure card fields...
      </div>
      <div class="checkout-xendit-action-component" data-xendit-card-action hidden></div>
      <button class="primary-button full-width checkout-payment-status-button checkout-card-pay-button" type="button" data-xendit-card-submit disabled>
        Pay ${formatRupiah.format(state.order.pricing.total)}
      </button>
      <p class="secure-note">Secured by Xendit. Card details never touch our server.</p>
    </div>
  `;
}

function paymentActionMarkup(payment) {
  const actions = Array.isArray(payment.actions) ? payment.actions : [];
  const presentAction = actions.find((action) => action.type === "PRESENT_TO_CUSTOMER");
  const redirectAction = actions.find((action) => action.type === "REDIRECT_CUSTOMER") || (payment.paymentUrl
    ? { value: payment.paymentUrl }
    : null);
  const presentValue = actionValue(presentAction);
  const redirectValue = actionValue(redirectAction);

  if (payment.provider === "xendit" && payment.paymentUrl) {
    return xenditEmbeddedCheckoutMarkup(payment.paymentUrl);
  }

  if (payment.kind === "card" && payment.provider === "xendit_components" && payment.componentsSdkKey) {
    return xenditCardMarkup(payment);
  }

  if (payment.kind === "va" && !presentAction) {
    return bankOptionsMarkup(payment);
  }

  if (presentAction && payment.kind === "qris") {
    const imageSource = qrImageSource(presentValue);
    return `
      <div class="xendit-present-box">
        <div class="xendit-present-head">
          <div>
            <h3>QRIS</h3>
            <p>Scan from any QRIS-enabled app.</p>
          </div>
          <span class="payment-countdown">${formatRemainingTime(state.order.expiresAt)}</span>
        </div>
        <div class="qris-display">
          <img class="qris-image" src="${escapeHtml(imageSource)}" alt="QRIS payment code" />
          ${/^https?:\/\//i.test(presentValue) || /^data:image\//i.test(presentValue)
            ? ""
            : `<button class="secondary-button" type="button" data-copy="${escapeHtml(presentValue)}">Copy QR data</button>`}
        </div>
      </div>
    `;
  }

  if (presentAction) {
    return `
      <div class="xendit-present-box">
        <div class="xendit-present-head">
          <div>
            <h3>${escapeHtml(payment.label)}</h3>
            <p>${payment.kind === "va" ? "Transfer to this virtual account number." : "Use the payment details below."}</p>
          </div>
          <span class="payment-countdown">${formatRemainingTime(state.order.expiresAt)}</span>
        </div>
        <div class="virtual-account-box">
          <span>${payment.kind === "va" ? `${payment.selectedBankLabel || payment.logoText || "Bank"} Virtual Account Number` : "Payment Code"}</span>
          <strong>${escapeHtml(presentValue)}</strong>
          <button class="secondary-button" type="button" data-copy="${escapeHtml(presentValue)}">Copy</button>
        </div>
      </div>
    `;
  }

  if (redirectValue && payment.kind === "card") {
    return `
      <a class="primary-button button-link full-width" href="${escapeHtml(redirectValue)}">
        Add credit card details
      </a>
    `;
  }

  if (redirectValue) {
    return `
      <a class="primary-button button-link full-width" href="${escapeHtml(redirectValue)}">
        Open secure payment
      </a>
    `;
  }

  return `
    <div class="instruction-box">
      Secure payment is still being prepared. Check the status again in a moment.
    </div>
  `;
}

function renderCancelled() {
  document.title = `Order ${state.order.id} Cancelled`;
  paymentApp.innerHTML = `
    <section class="status-hero cancelled-hero">
      <div class="status-steps">
        <span class="status-step">Preparing Order</span>
        <span class="status-step">On Deliver</span>
        <span class="status-step active">Order Complete</span>
      </div>
      <h1>YOUR ORDER HAS BEEN CANCELLED</h1>
      <p>This order was cancelled and will not be fulfilled.</p>
    </section>

    <section class="status-panel">
      <div class="status-time">
        <strong>Order cancelled at</strong>
        <span>${new Date(state.order.cancelledAt || state.order.createdAt).toLocaleString()}</span>
      </div>
      <div class="purchase-summary">
        <div class="section-head-inline">
          <h2>Your purchase</h2>
          <span>${state.order.itemCount} items</span>
        </div>
        ${lineItemsMarkup()}
      </div>
      <div class="status-footer">
        <div class="purchase-row">
          <span>Order ID</span>
          <strong>${escapeHtml(state.order.id)}</strong>
        </div>
        <a class="primary-button button-link full-width" href="${escapeHtml(state.order.whatsappUrl || "#")}" target="_blank" rel="noreferrer">
          Get Help via WhatsApp
        </a>
      </div>
    </section>
  `;
}

function renderPaid() {
  document.title = `Order ${state.order.id} Paid`;
  const shipment = state.order.fulfillment?.shipment || {};
  const trackingUrl = shipment.trackingLink || "";
  const orderStatus = state.order.status;
  const deliveryProblem = ["delivery_issue", "returned", "delivery_failed"].includes(orderStatus);
  const statusHeading = deliveryProblem
    ? (orderStatus === "returned" ? "Delivery returned" : "Delivery needs attention")
    : orderStatus === "delivered"
      ? "Order delivered"
      : orderStatus === "on_delivery"
        ? "Order is on delivery"
        : orderStatus === "preparing"
          ? "Order is being prepared"
          : "Payment received";
  const statusCopy = deliveryProblem
    ? "Our team has been notified. Please contact us if you need help with this delivery."
    : orderStatus === "delivered"
      ? "Your order has been delivered. Thank you for ordering from Bakeaholic."
      : orderStatus === "on_delivery"
        ? "Your order is with the courier. Use tracking below for the latest update."
        : orderStatus === "preparing"
          ? "Your order is being prepared and delivery has been requested."
          : "Your order is paid. We will prepare it and update the delivery status here.";
  const documentUrl = state.order.documentUrl || `/invoice.html?order=${encodeURIComponent(state.order.id)}${orderToken ? `&token=${encodeURIComponent(orderToken)}` : ""}${appMode === "test" ? "&mode=test" : ""}`;
  const shipmentMessage = state.order.fulfillment?.shipment?.orderId
    ? `<p class="success-note">Delivery order sent to Biteship. ID: ${escapeHtml(shipment.orderId)}</p>`
    : state.order.fulfillment?.shipmentError
      ? `<p class="payment-alert">${escapeHtml(state.order.fulfillment.shipmentError)}</p>`
      : "";
  try {
    localStorage.removeItem(latestOrderKey);
    localStorage.removeItem(checkoutLatestOrderKey);
  } catch (_error) {
    // Receipt and tracking remain available when browser storage is blocked.
  }
  paymentApp.innerHTML = `
    <section class="payment-order-heading">
      <a class="secondary-link" href="/orders.html${appMode === "test" ? "?mode=test" : ""}">← Orders</a>
      <div>
        <strong>Order ${escapeHtml(state.order.id)}</strong>
        <span>${new Date(state.order.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
    </section>

    <section class="paid-status-banner${deliveryProblem ? " delivery-problem" : ""}">
      <span class="paid-status-icon" aria-hidden="true">${deliveryProblem ? "!" : "✓"}</span>
      <div>
        <h1>${statusHeading}</h1>
        <p>${statusCopy}</p>
      </div>
    </section>

    <section class="paid-order-layout">
      <div>
        ${deliveryMapMarkup()}
        <section class="payment-page-card paid-items-card">
          <div class="section-title-wrap">
            <h2>Your order</h2>
            <span>${state.order.itemCount} item${state.order.itemCount === 1 ? "" : "s"}</span>
          </div>
          <div class="purchase-summary">
            ${lineItemsMarkup()}
          </div>
        </section>
      </div>
      <div>
        ${paymentSummaryMarkup()}
        ${trackingUrl
          ? `<a class="primary-button button-link full-width" href="${escapeHtml(trackingUrl)}" target="_blank" rel="noreferrer">Track order</a>`
          : `<span class="primary-button full-width disabled-tracking-button" aria-disabled="true">Tracking will be available after dispatch</span>`}
        <div class="payment-page-actions">
          <a class="secondary-link" href="${escapeHtml(documentUrl)}">View receipt</a>
          <a class="secondary-link" href="/orders.html${appMode === "test" ? "?mode=test" : ""}">All orders</a>
        </div>
        ${shipmentMessage}
      </div>
    </section>
  `;
}

function renderPaymentIssue() {
  const statusLabel = state.order.status === "expired"
    ? "Payment expired"
    : "Payment could not be completed";
  paymentApp.innerHTML = `
    <section class="payment-page-card payment-issue-card">
      <h1>${escapeHtml(statusLabel)}</h1>
      <p class="payment-alert">This order is no longer awaiting payment. Please place a new order or contact us for help.</p>
      <div class="purchase-summary">
        ${lineItemsMarkup()}
      </div>
      <a class="primary-button button-link full-width" href="/index.html${appMode === "test" ? "?mode=test" : ""}">
        Start a new order
      </a>
      <a class="secondary-link centered-link" href="${escapeHtml(state.order.whatsappUrl || "#")}" target="_blank" rel="noreferrer">
        Get Help via WhatsApp
      </a>
    </section>
  `;
}

function renderPending() {
  const payment = state.order.payment;
  const orderDate = new Date(state.order.createdAt || Date.now()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const paymentLinkBlock = paymentActionMarkup(payment);
  const documentUrl = state.order.documentUrl || `/invoice.html?order=${encodeURIComponent(state.order.id)}${orderToken ? `&token=${encodeURIComponent(orderToken)}` : ""}${appMode === "test" ? "&mode=test" : ""}`;

  document.title = `Pay and Order ${state.order.id} | Bakeaholic Online Shop`;
  paymentApp.innerHTML = `
    <section class="payment-order-heading">
      <a class="secondary-link" href="/index.html${appMode === "test" ? "?mode=test" : ""}">← Menu</a>
      <div>
        <strong>Order ${escapeHtml(state.order.id)}</strong>
        <span>${escapeHtml(orderDate)}</span>
      </div>
    </section>

    <section class="waiting-payment-card">
      <span class="waiting-icon" aria-hidden="true">!</span>
      <div>
        <h1>Waiting for payment</h1>
        <p>Finish paying and we'll send your order to the kitchen.</p>
        <button class="primary-button" id="checkStatusButton" type="button">Check Payment Status</button>
      </div>
    </section>

    <section class="payment-detail-layout">
      <div class="payment-page-card">
        <div class="section-title-wrap">
          <h2>Payment</h2>
          <p class="payment-alert">${appMode === "test" ? formatRemainingTime(state.order.expiresAt) : "Please complete your payment so that we can process your order."}</p>
        </div>
        <div class="payment-method-header">
          <div>
            <p class="muted-label">Payment method</p>
            <strong>${escapeHtml(payment.label)}</strong>
          </div>
          <span class="payment-logo large">${escapeHtml(payment.logoText)}</span>
        </div>
        ${paymentLinkBlock}
        ${payment.kind === "card" && payment.provider === "xendit_components"
          ? ""
          : `<div class="instruction-box${payment.provider === "xendit" && payment.paymentUrl ? " xendit-embed-note" : ""}">
              ${escapeHtml(payment.instructions)}
              ${payment.provider === "xendit" ? "<br />Payment is processed securely by Xendit." : ""}
            </div>`}
        ${paymentCheckMessage ? `<p class="payment-check-feedback" role="status">${escapeHtml(paymentCheckMessage)}</p>` : ""}
        <div class="payment-customer-actions">
          <button class="secondary-link link-button centered-link" id="cancelOrderButton" type="button">Cancel your order</button>
          <div class="payment-page-actions">
            <a class="secondary-link" href="${escapeHtml(documentUrl)}">View receipt</a>
            <a class="secondary-link" href="/orders.html${appMode === "test" ? "?mode=test" : ""}">All orders</a>
          </div>
        </div>
      </div>

      <section class="payment-page-card order-total-card">
        <div class="section-title-wrap">
          <h2>Order summary</h2>
        </div>
        <div class="summary-list">
          <div class="summary-row">
            <span>Subtotal</span>
            <strong>${formatRupiah.format(state.order.pricing.subtotal)}</strong>
          </div>
          <div class="summary-row">
            <span>Delivery fee</span>
            <strong>${formatRupiah.format(state.order.pricing.deliveryFee || 0)}</strong>
          </div>
          <div class="summary-row">
            <span>Tax</span>
            <strong>${formatRupiah.format(state.order.pricing.tax || 0)}</strong>
          </div>
          <div class="summary-row total-row">
            <span>Total</span>
            <strong>${formatRupiah.format(state.order.pricing.total)}</strong>
          </div>
        </div>
        <div class="purchase-summary">
          ${lineItemsMarkup()}
        </div>
      </section>
    </section>
  `;

  paymentApp.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Copied";
      } catch (_error) {
        button.textContent = "Copy failed";
      }
    });
  });

  paymentApp.querySelectorAll("[data-bank-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      const originalText = button.textContent;
      try {
        paymentApp.querySelectorAll("[data-bank-code]").forEach((entry) => {
          entry.disabled = true;
        });
        button.textContent = "Generating...";
        const response = await request("/api/order/select-bank", {
          method: "POST",
          body: JSON.stringify({
            id: orderId,
            token: orderToken,
            bankCode: button.dataset.bankCode
          })
        });
        state.order = response.order;
        localStorage.setItem(latestOrderKey, state.order.id);
        if (state.order.payment?.provider === "xendit" && state.order.payment?.paymentUrl) {
          window.location.assign(state.order.payment.paymentUrl);
          return;
        }
        render();
      } catch (error) {
        button.textContent = originalText;
        paymentApp.querySelectorAll("[data-bank-code]").forEach((entry) => {
          entry.disabled = false;
        });
        const panel = paymentApp.querySelector(".bank-choice-panel");
        if (panel && !panel.querySelector(".payment-alert")) {
          panel.insertAdjacentHTML(
            "beforeend",
            `<p class="payment-alert">${escapeHtml(error.message || "Unable to generate virtual account.")}</p>`
          );
        }
      }
    });
  });

  document.getElementById("checkStatusButton")?.addEventListener("click", async () => {
    const button = document.getElementById("checkStatusButton");
    button.disabled = true;
    button.textContent = "Checking...";
    try {
      const response = await request("/api/order/payment-status", {
        method: "POST",
        body: JSON.stringify({
          id: orderId,
          token: orderToken,
          simulateTestPayment: appMode === "test"
        })
      });
      state.order = response.order;
      localStorage.setItem(latestOrderKey, state.order.id);
      paymentCheckMessage = state.order.status === "awaiting_payment"
        ? "Payment is still waiting. Complete the payment details above, then check again."
        : "";
      render();
    } catch (error) {
      paymentCheckMessage = error.message || "Unable to check the payment status.";
      button.disabled = false;
      button.textContent = "Check Payment Status";
      const detailCard = paymentApp.querySelector(".payment-page-card");
      detailCard?.insertAdjacentHTML("beforeend", `<p class="payment-check-feedback" role="alert">${escapeHtml(paymentCheckMessage)}</p>`);
    }
  });

  document.getElementById("cancelOrderButton")?.addEventListener("click", () => {
    modalScrim.hidden = false;
    cancelModal.hidden = false;
  });

  mountXenditCardComponents();
}

function getXenditComponentsConstructor() {
  const exported = window.Xendit || window.XenditComponents || window.XenditComponentsWeb;
  if (typeof exported === "function") return exported;
  return exported?.XenditComponents || exported?.default || null;
}

function loadXenditComponentsSdk() {
  if (getXenditComponentsConstructor()) return Promise.resolve();
  if (!xenditComponentsSdkPromise) {
    xenditComponentsSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = xenditComponentsSdkUrl;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Unable to load secure card payment."));
      document.head.appendChild(script);
    });
  }
  return xenditComponentsSdkPromise;
}

function mountXenditCardComponents() {
  const payment = state.order?.payment || {};
  const mount = paymentApp.querySelector("[data-xendit-card-component]");
  const actionMount = paymentApp.querySelector("[data-xendit-card-action]");
  const submitButton = paymentApp.querySelector("[data-xendit-card-submit]");
  if (!mount || !submitButton || !payment.componentsSdkKey) return;

  loadXenditComponentsSdk()
    .then(() => {
      const XenditComponents = getXenditComponentsConstructor();
      if (!XenditComponents) throw new Error("Secure card payment did not initialize.");
      const components = new XenditComponents({
        componentsSdkKey: payment.componentsSdkKey,
        iframeFieldAppearance: {
          inputStyles: { fontSize: window.matchMedia("(max-width: 620px)").matches ? "14px" : "16px" },
          placeholderStyles: { fontSize: window.matchMedia("(max-width: 620px)").matches ? "14px" : "16px" }
        }
      });
      const suppressFieldScrollbars = () => {
        mount.querySelectorAll("iframe").forEach((frame) => {
          frame.setAttribute("scrolling", "no");
          frame.style.overflow = "hidden";
        });
      };
      new MutationObserver(suppressFieldScrollbars).observe(mount, { childList: true, subtree: true });
      const confirmPayment = async () => {
        submitButton.disabled = true;
        submitButton.textContent = "Confirming payment...";
        const response = await request("/api/order/payment-status", {
          method: "POST",
          body: JSON.stringify({ id: orderId, token: orderToken })
        });
        state.order = response.order;
        paymentCheckMessage = state.order.status === "awaiting_payment"
          ? "Payment is still processing. Check again in a moment."
          : "";
        render();
      };
      components.addEventListener("submission-ready", () => { submitButton.disabled = false; });
      components.addEventListener("submission-not-ready", () => { submitButton.disabled = true; });
      components.addEventListener("submission-begin", () => {
        submitButton.disabled = true;
        submitButton.textContent = "Processing...";
      });
      components.addEventListener("submission-end", () => {
        submitButton.textContent = `Pay ${formatRupiah.format(state.order.pricing.total)}`;
      });
      components.addEventListener("session-complete", () => {
        confirmPayment().catch((error) => {
          paymentCheckMessage = error.message || "Unable to confirm card payment.";
          render();
        });
      });
      components.addEventListener("session-expired-or-canceled", () => {
        paymentCheckMessage = "Card payment expired or was cancelled. Please place a new order.";
        render();
      });
      components.addEventListener("action-begin", () => {
        if (!actionMount || typeof components.createActionContainerComponent !== "function") return;
        actionMount.hidden = false;
        actionMount.replaceChildren(components.createActionContainerComponent());
      });
      components.addEventListener("action-end", () => {
        if (!actionMount) return;
        actionMount.hidden = true;
        actionMount.replaceChildren();
      });
      components.addEventListener("init", () => {
        const cardChannels = typeof components.getActiveChannels === "function"
          ? components.getActiveChannels({ filter: "CARDS" })
          : [];
        const allChannels = Array.isArray(cardChannels) && cardChannels.length
          ? cardChannels
          : (typeof components.getActiveChannels === "function" ? components.getActiveChannels() : []);
        const cardChannel = (allChannels || []).find((channel) => (
          String(channel.channelCode || channel.code || channel.id || "").toUpperCase() === "CARDS"
        )) || allChannels?.[0];
        const component = cardChannel && typeof components.createChannelComponent === "function"
          ? components.createChannelComponent(cardChannel)
          : components.createChannelPickerComponent();
        mount.replaceChildren(component);
        suppressFieldScrollbars();
      });
      submitButton.addEventListener("click", () => {
        try {
          components.submit();
        } catch (error) {
          paymentCheckMessage = error.message || "Please complete the card details.";
          render();
        }
      });
    })
    .catch((error) => {
      mount.textContent = error.message || "Unable to load secure card payment.";
      submitButton.hidden = true;
    });
}

function render() {
  if (state.order.status === "cancelled") {
    renderCancelled();
    return;
  }

  if (["paid", "preparing", "on_delivery", "delivered", "complete", "delivery_issue", "returned", "delivery_failed"].includes(state.order.status)) {
    renderPaid();
    return;
  }

  if (state.order.status === "expired" || state.order.status === "payment_failed") {
    renderPaymentIssue();
    return;
  }

  renderPending();
}

async function bootstrap() {
  if (!orderId) {
    throw new Error("Missing order id");
  }

  const tokenQuery = orderToken ? `&token=${encodeURIComponent(orderToken)}` : "";
  const response = await request(`/api/order?id=${encodeURIComponent(orderId)}${tokenQuery}`);
  state.order = response.order;
  if (state.order?.status === "awaiting_payment" && state.order.payment?.provider === "xendit_pending_bank") {
    const hostedResponse = await request("/api/order/hosted-payment", {
      method: "POST",
      body: JSON.stringify({ id: orderId, token: orderToken })
    });
    state.order = hostedResponse.order;
  }
  localStorage.setItem(latestOrderKey, state.order.id);
  render();
}

keepOrderButton.addEventListener("click", () => {
  cancelModal.hidden = true;
  modalScrim.hidden = true;
});

confirmCancelButton.addEventListener("click", async () => {
  const response = await request("/api/order/cancel", {
    method: "POST",
    body: JSON.stringify({ id: orderId, token: orderToken })
  });
  state.order = response.order;
  cancelModal.hidden = true;
  modalScrim.hidden = true;
  render();
});

modalScrim.addEventListener("click", () => {
  cancelModal.hidden = true;
  modalScrim.hidden = true;
});

bootstrap().catch((error) => {
  paymentApp.innerHTML = `
    <section class="empty-card">
      <strong>Unable to load the payment page.</strong>
      <p>${escapeHtml(error.message)}</p>
    </section>
  `;
});
