const params = new URLSearchParams(window.location.search);
const appMode = params.get("mode") === "test" ? "test" : "live";
const orderId = params.get("order") || "";
const token = params.get("token") || "";
const invoiceApp = document.getElementById("invoiceApp");

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
        <button class="admin-button print-hide" type="button" id="printInvoiceButton">Print</button>
      </header>

      <div class="invoice-title-row">
        <div>
          <p class="eyebrow">Invoice / Receipt</p>
          <h1>${escapeHtml(order.id)}</h1>
        </div>
        <div class="invoice-status">
          <span>${escapeHtml(order.status || "")}</span>
          <strong>${formatRupiah.format(order.pricing?.total || 0)}</strong>
        </div>
      </div>

      <section class="invoice-grid">
        <div>
          <h2>Customer</h2>
          <p><strong>${escapeHtml(order.customer?.name || "Customer")}</strong></p>
          <p>${escapeHtml(order.customer?.phone || "")}</p>
          <p>${escapeHtml(order.customer?.email || "")}</p>
        </div>
        <div>
          <h2>Delivery</h2>
          <p>${escapeHtml(order.fulfillment?.address || order.customer?.address || "-")}</p>
          <p>${escapeHtml(order.fulfillment?.deliveryNotes || "")}</p>
        </div>
        <div>
          <h2>Payment</h2>
          <p>${escapeHtml(order.payment?.label || "")}</p>
          <p>Paid at: ${order.paidAt ? escapeHtml(formatDate(order.paidAt)) : "-"}</p>
        </div>
        <div>
          <h2>Order</h2>
          <p>Created: ${escapeHtml(formatDate(order.createdAt))}</p>
          <p>Items: ${order.itemCount || 0}</p>
        </div>
      </section>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${lineItemRows(order)}</tbody>
      </table>

      <section class="invoice-totals">
        <div><span>Subtotal</span><strong>${formatRupiah.format(order.pricing?.subtotal || 0)}</strong></div>
        <div><span>Delivery fee</span><strong>${formatRupiah.format(order.pricing?.deliveryFee || 0)}</strong></div>
        <div><span>Tax</span><strong>${formatRupiah.format(order.pricing?.tax || 0)}</strong></div>
        <div class="invoice-grand-total"><span>Total paid</span><strong>${formatRupiah.format(order.pricing?.total || 0)}</strong></div>
      </section>

      <footer class="invoice-footer">
        <p>Use this invoice for delivery handoff and customer payment receipt.</p>
      </footer>
    </section>
  `;
  document.getElementById("printInvoiceButton")?.addEventListener("click", () => window.print());
}

requestDocument()
  .then(renderDocument)
  .catch((error) => {
    invoiceApp.innerHTML = `
      <section class="payment-page-card">
        <h1>Invoice unavailable</h1>
        <p class="payment-alert">${escapeHtml(error.message)}</p>
      </section>
    `;
  });
