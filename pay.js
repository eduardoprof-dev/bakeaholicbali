const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const params = new URLSearchParams(window.location.search);
const appMode = params.get("mode") === "test" ? "test" : "live";
const orderId = params.get("order") || "";
const latestOrderKey = `bakeaholic-latest-order-${appMode}`;

const paymentApp = document.getElementById("paymentApp");
const modalScrim = document.getElementById("modalScrim");
const cancelModal = document.getElementById("cancelModal");
const keepOrderButton = document.getElementById("keepOrderButton");
const confirmCancelButton = document.getElementById("confirmCancelButton");

let state = {
  order: null
};

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
        <div class="purchase-row">
          <span>${entry.quantity}x ${escapeHtml(entry.item.name)}</span>
          <strong>${formatRupiah.format(entry.lineTotal)}</strong>
        </div>
      `
    )
    .join("");
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
  const trackingUrl = shipment.trackingLink || `/orders.html${appMode === "test" ? "?mode=test" : ""}`;
  const shipmentMessage = state.order.fulfillment?.shipment?.orderId
    ? `<p class="success-note">Delivery order sent to Biteship. ID: ${escapeHtml(shipment.orderId)}</p>`
    : state.order.fulfillment?.shipmentError
      ? `<p class="payment-alert">${escapeHtml(state.order.fulfillment.shipmentError)}</p>`
      : "";
  const whatsappMessage = state.order.whatsappNotificationError
    ? `<p class="payment-alert">${escapeHtml(state.order.whatsappNotificationError)}</p>`
    : state.order.whatsappNotifications?.lastStatusSent
      ? `<p class="success-note">WhatsApp order update sent.</p>`
      : "";
  paymentApp.innerHTML = `
    <section class="status-hero">
      <div class="status-steps">
        <span class="status-step active">Preparing Order</span>
        <span class="status-step">On Deliver</span>
        <span class="status-step">Order Complete</span>
      </div>
      <h1>Payment received</h1>
      <p>Your order is confirmed and ready for the next fulfillment step.</p>
    </section>

    <section class="payment-page-card">
      <div class="section-title-wrap">
        <h2>Order overview</h2>
      </div>
      <div class="overview-list">
        <div class="overview-row">
          <span>Payment method</span>
          <strong>${escapeHtml(state.order.payment.label)}</strong>
        </div>
        <div class="overview-row">
          <span>Total payment</span>
          <strong>${formatRupiah.format(state.order.pricing.total)}</strong>
        </div>
        <div class="overview-row">
          <span>Fulfillment</span>
          <strong>${escapeHtml(state.order.fulfillment.type)}</strong>
        </div>
      </div>
      <div class="purchase-summary">
        ${lineItemsMarkup()}
      </div>
      ${shipmentMessage}
      ${whatsappMessage}
      <a class="secondary-link" href="${escapeHtml(trackingUrl)}" ${shipment.trackingLink ? 'target="_blank" rel="noreferrer"' : ""}>Track your order</a>
    </section>
  `;
}

function renderPaymentIssue() {
  const statusLabel = state.order.status === "expired"
    ? "Payment expired"
    : "Payment could not be completed";
  paymentApp.innerHTML = `
    <section class="payment-page-card">
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
  const qrisBlock = payment.kind === "qris"
    ? `
      <div class="qr-block">
        <p class="qr-label">Scan this QR code</p>
        <img class="qr-image" src="${escapeHtml(payment.qrCodeData)}" alt="QRIS code" />
        ${payment.deeplinkUrl ? `<a class="primary-button button-link full-width" href="${escapeHtml(payment.deeplinkUrl)}">Open payment app</a>` : ""}
      </div>
    `
    : "";

  const detailBlock = payment.kind === "va"
    ? `
      <div class="payment-detail-row">
        <span>Virtual account number</span>
        <div class="copy-block">
          <strong>${escapeHtml(payment.accountNumber)}</strong>
          <button class="copy-button" type="button" data-copy="${escapeHtml(payment.accountNumber)}">Copy</button>
        </div>
      </div>
    `
    : payment.kind === "card"
      ? `
        <div class="payment-detail-row">
          <span>Saved card</span>
          <div class="copy-block">
            <strong>${escapeHtml(payment.maskedCard)}</strong>
          </div>
        </div>
      `
      : "";

  document.title = `Pay and Order ${state.order.id} | Bakeaholic Online Shop`;
  paymentApp.innerHTML = `
    <section class="payment-page-card">
      <h1>Pay and Order</h1>
      <p class="payment-alert">${appMode === "test" ? formatRemainingTime(state.order.expiresAt) : "Please complete your payment so that we can process your order."}</p>

      <div class="divider"></div>

      <div class="section-title-wrap">
        <h2>Payment Overview</h2>
      </div>
      <div class="payment-method-header">
        <div>
          <p class="muted-label">Payment method</p>
          <strong>${escapeHtml(payment.label)}</strong>
        </div>
        <span class="payment-logo large">${escapeHtml(payment.logoText)}</span>
      </div>

      ${detailBlock}
      ${qrisBlock}

      <div class="payment-detail-row">
        <span>Payment total</span>
        <div class="copy-block">
          <strong>${formatRupiah.format(state.order.pricing.total)}</strong>
          <button class="copy-button" type="button" data-copy="${state.order.pricing.total}">Copy</button>
        </div>
      </div>

      <div class="instruction-box">
        ${escapeHtml(payment.instructions)}
        ${payment.provider === "midtrans" ? "<br />Payment is processed securely by Midtrans." : ""}
      </div>

      <button class="primary-button full-width" id="checkStatusButton" type="button">
        Check Payment Status
      </button>

      <button class="secondary-link link-button centered-link" id="cancelOrderButton" type="button">
        Cancel your order
      </button>
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

  document.getElementById("checkStatusButton")?.addEventListener("click", async () => {
    const response = await request("/api/order/payment-status", {
      method: "POST",
      body: JSON.stringify({ id: orderId })
    });
    state.order = response.order;
    localStorage.setItem(latestOrderKey, state.order.id);
    render();
  });

  document.getElementById("cancelOrderButton")?.addEventListener("click", () => {
    modalScrim.hidden = false;
    cancelModal.hidden = false;
  });
}

function render() {
  if (state.order.status === "cancelled") {
    renderCancelled();
    return;
  }

  if (state.order.status === "paid") {
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

  const response = await request(`/api/order?id=${encodeURIComponent(orderId)}`);
  state.order = response.order;
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
    body: JSON.stringify({ id: orderId })
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
