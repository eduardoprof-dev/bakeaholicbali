const params = new URLSearchParams(window.location.search);
const isAdminPreview = params.has("admin-preview");
const ref = params.get("ref") || "";
let appMode = params.get("mode") === "test" ? "test" : "live";
let orderId = params.get("order") || "";
let token = params.get("token") || "";
const invoiceApp = document.getElementById("invoiceApp");
let pageStore = {};

if (ref && !orderId) {
  const [refOrderId, refToken, refMode] = ref.split(".");
  orderId = refOrderId || "";
  token = refToken || "";
  appMode = refMode === "test" ? "test" : appMode;
}

const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
  return new Date(value || Date.now()).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function humanizeStatus(value = "") {
  const status = String(value || "").trim();
  if (!status) return "-";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function paymentLabel(order) {
  const payment = order.payment || {};
  if (payment.kind === "qris") {
    return "QRIS";
  }
  if (payment.kind === "va") {
    return payment.selectedBankLabel
      ? `${payment.selectedBankLabel} Virtual Account`
      : payment.label || "Bank Transfer";
  }
  return payment.label || "-";
}

async function requestDocument() {
  const search = new URLSearchParams({ id: orderId });
  if (token) search.set("token", token);
  const response = await fetch(`/api/order/document?${search.toString()}`, {
    headers: {
      "X-App-Mode": appMode
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function lineItemRows(order) {
  return (order.lineItems || []).map((entry) => `
    <tr>
      <td>${escapeHtml(entry.item?.name || entry.itemId)}</td>
      <td>${entry.quantity}</td>
      <td>${formatRupiah.format(entry.item?.price || 0)}</td>
      <td>${formatRupiah.format(entry.lineTotal || 0)}</td>
    </tr>
  `).join("");
}

function shipmentDetails(order) {
  const shipment = order.fulfillment?.shipment || {};
  const courierName = shipment.courier?.company || shipment.courier?.name || shipment.raw?.courier?.company || shipment.raw?.courier?.name || "";
  const trackingLink = shipment.trackingLink || shipment.raw?.courier?.link || (shipment.orderId ? "https://track.biteship.com" : "");
  const documentLink = shipment.labelUrl || shipment.invoiceUrl || shipment.waybillUrl || shipment.raw?.label_url || shipment.raw?.invoice_url || shipment.raw?.waybill_url || "";
  if (!shipment.orderId && !shipment.status && !courierName && !trackingLink && !documentLink) {
    return "";
  }

  return `
    <section class="invoice-delivery">
      <div>
        <p class="eyebrow">Delivery tracking</p>
        <h2>${escapeHtml(courierName || "Delivery partner")}</h2>
        <p>Status: ${escapeHtml(shipment.status || order.status || "-")}</p>
        <p>Waybill: ${escapeHtml(shipment.waybillId || "-")}</p>
      </div>
      <div class="invoice-delivery-actions">
        ${trackingLink ? `<a class="admin-button" href="${escapeHtml(trackingLink)}" target="_blank" rel="noreferrer">Track driver</a>` : ""}
        ${documentLink ? `<a class="admin-button secondary" href="${escapeHtml(documentLink)}" target="_blank" rel="noreferrer">Open shipping document</a>` : ""}
      </div>
    </section>
  `;
}

function invoiceStatusClass(status = "") {
  const normalized = String(status || "").toLowerCase();
  if (["paid", "preparing", "on_delivery", "delivered", "complete"].includes(normalized)) return "invoice-status-paid";
  if (["expired", "cancelled", "payment_failed", "delivery_issue", "returned", "delivery_failed"].includes(normalized)) return "invoice-status-negative";
  return "invoice-status-pending";
}

function renderDocument(payload) {
  const { store, order } = payload;
  document.title = `Invoice ${order.id} | Bakeaholic Bali`;
  invoiceApp.innerHTML = `
    <section class="invoice-sheet">
      <header class="invoice-header">
        <div class="invoice-brand">
          <img src="/assets/bakeaholic-logo.jpg" alt="Bakeaholic Bali" />
          <div>
            <strong>${escapeHtml(store.name || "Bakeaholic Bali")}</strong>
            <span>${escapeHtml(store.perkTitle || "")}</span>
          </div>
        </div>
        <div class="invoice-header-actions print-hide">
          <button class="admin-button" type="button" id="printInvoiceButton">Print</button>
          <a class="admin-button secondary" id="openInvoiceBrowserButton" href="${escapeHtml(window.location.href)}" target="_blank" rel="noreferrer" hidden>Open in browser</a>
        </div>
      </header>

      <div class="invoice-title-row">
        <div>
          <p class="eyebrow">${escapeHtml(pageStore.invoicePageLabel || "Invoice / Receipt")}</p>
          <h1>${escapeHtml(order.id)}</h1>
        </div>
        <div class="invoice-status ${invoiceStatusClass(order.status)}">
          <span>${escapeHtml(humanizeStatus(order.status))}</span>
          <strong>${formatRupiah.format(order.pricing?.total || 0)}</strong>
        </div>
      </div>

      <section class="invoice-grid">
        <div>
          <h2>${escapeHtml(pageStore.invoiceCustomerHeading || "Customer")}</h2>
          <p><strong>${escapeHtml(order.customer?.name || "Customer")}</strong></p>
          <p>${escapeHtml(order.customer?.phone || "")}</p>
          <p>${escapeHtml(order.customer?.email || "")}</p>
        </div>
        <div>
          <h2>${escapeHtml(pageStore.invoiceAddressHeading || "Your address")}</h2>
          <p>${escapeHtml(order.fulfillment?.address || order.customer?.address || "-")}</p>
          <p>${escapeHtml(order.fulfillment?.deliveryNotes || "")}</p>
        </div>
        <div>
          <h2>${escapeHtml(pageStore.invoicePaymentHeading || "Payment")}</h2>
          <p>${escapeHtml(paymentLabel(order))}</p>
          <p>Paid at: ${order.paidAt ? escapeHtml(formatDate(order.paidAt)) : "-"}</p>
        </div>
        <div>
          <h2>${escapeHtml(pageStore.invoiceOrderHeading || "Order")}</h2>
          <p>Created: ${escapeHtml(formatDate(order.createdAt))}</p>
          <p>Items: ${order.itemCount || 0}</p>
        </div>
      </section>

      ${shipmentDetails(order)}

      <table class="invoice-table">
        <thead>
          <tr>
            <th>${escapeHtml(pageStore.invoiceItemHeading || "Item")}</th>
            <th>${escapeHtml(pageStore.invoiceQuantityHeading || "Qty")}</th>
            <th>${escapeHtml(pageStore.invoicePriceHeading || "Price")}</th>
            <th>${escapeHtml(pageStore.invoiceTotalHeading || "Total")}</th>
          </tr>
        </thead>
        <tbody>${lineItemRows(order)}</tbody>
      </table>

      <section class="invoice-totals">
        <div><span>Subtotal</span><strong>${formatRupiah.format(order.pricing?.subtotal || 0)}</strong></div>
        <div><span>Delivery fee</span><strong>${formatRupiah.format(order.pricing?.deliveryFee || 0)}</strong></div>
        <div><span>Tax</span><strong>${formatRupiah.format(order.pricing?.tax || 0)}</strong></div>
        <div class="invoice-grand-total"><span>${escapeHtml(pageStore.invoiceTotalPaidLabel || "Total paid")}</span><strong>${formatRupiah.format(order.pricing?.total || 0)}</strong></div>
      </section>

      <footer class="invoice-footer">
        <p class="invoice-note">${escapeHtml(pageStore.invoiceFooterNote || "Use this invoice for delivery handoff and customer payment receipt.")}</p>
      </footer>
    </section>
  `;
  const printButton = document.getElementById("printInvoiceButton");
  const openInBrowserButton = document.getElementById("openInvoiceBrowserButton");
  const isInAppBrowser = /WhatsApp|FBAN|FBAV|Instagram/i.test(navigator.userAgent || "");
  if (isInAppBrowser && printButton && openInBrowserButton) {
    printButton.hidden = true;
    openInBrowserButton.hidden = false;
  }
  printButton?.addEventListener("click", () => window.print());
}

const previewDocument = {
  store: { name: "Bakeaholic Bali", perkTitle: "WhatsApp +62 815-5700-627" },
  order: {
    id: "BAK-PREVIEW",
    status: "paid",
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    itemCount: 1,
    customer: { name: "Customer name", phone: "+62 812 3456 7890", email: "customer@example.com" },
    fulfillment: { address: "Customer delivery address, Bali", deliveryNotes: "" },
    payment: { method: "QRIS" },
    lineItems: [{ itemId: "preview-product", quantity: 1, item: { name: "Bakeaholic product", price: 75000 }, lineTotal: 75000 }],
    pricing: { subtotal: 75000, deliveryFee: 11000, tax: 8600, total: 94600 }
  }
};

Promise.all([
  isAdminPreview ? Promise.resolve(previewDocument) : requestDocument(),
  fetch("/api/menu", { headers: { "X-App-Mode": appMode } }).then((response) => response.json()).catch(() => ({}))
])
  .then(([documentPayload, menuPayload]) => {
    pageStore = menuPayload.store || {};
    renderDocument(documentPayload);
  })
  .catch((error) => {
    invoiceApp.innerHTML = `
      <section class="payment-page-card">
        <h1>Invoice unavailable</h1>
        <p class="payment-alert">${escapeHtml(error.message)}</p>
      </section>
    `;
  });

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin || event.data?.type !== "bakeaholic:catalog-preview") return;
  pageStore = event.data.catalog?.store || pageStore;
  if (isAdminPreview) renderDocument(previewDocument);
});
