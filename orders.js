const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const params = new URLSearchParams(window.location.search);
const appMode = params.get("mode") === "test" ? "test" : "live";
const modeQuery = appMode === "test" ? "?mode=test" : "";
const shopperStateVersion = "20260604-session-cart";
const draftKey = `bakeaholic-checkout-draft-${shopperStateVersion}-${appMode}`;
const accountCommon = window.BakeaholicAccountCommon;

const ordersApp = document.getElementById("ordersApp");
const cartLink = document.getElementById("cartLink");
const accountBadge = document.getElementById("accountBadge");
const homeLink = document.getElementById("homeLink");
const accountMenu = document.getElementById("accountMenu");
const accountMenuName = document.getElementById("accountMenuName");
const accountMenuPhone = document.getElementById("accountMenuPhone");
const accountMenuEmail = document.getElementById("accountMenuEmail");
const accountSummaryButton = document.getElementById("accountSummaryButton");
const accountOrderHistoryLink = document.getElementById("accountOrderHistoryLink");
const accountAddressesLink = document.getElementById("accountAddressesLink");
const accountLogoutButton = document.getElementById("accountLogoutButton");

function formatOrderDate(value) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function statusMarkup(status) {
  const normalized = String(status || "").toLowerCase();
  const statusLabels = {
    paid: "Paid - preparing soon",
    preparing: "Preparing",
    on_delivery: "On delivery",
    shipped: "On delivery",
    delivered: "Delivered",
    complete: "Complete",
    delivery_issue: "Delivery needs attention",
    returned: "Returned to sender",
    delivery_failed: "Delivery failed",
    awaiting_payment: "Awaiting payment",
    pending_payment: "Pending payment",
    cancelled: "Cancelled",
    expired: "Expired",
    payment_failed: "Payment failed"
  };
  const label = statusLabels[normalized] || normalized.replaceAll("_", " ");
  const modifier = normalized === "paid" || normalized === "preparing" || normalized === "on_delivery" || normalized === "delivered" || normalized === "complete"
    ? " status-paid"
    : normalized === "awaiting_payment" || normalized === "pending_payment"
      ? " status-pending"
      : " status-negative";
  return `<span class="status-pill${modifier}">${accountCommon.escapeHtml(label)}</span>`;
}

function renderEmpty(title, copy) {
  ordersApp.innerHTML = `
    <section class="account-page-hero">
      <div>
        <h1>${accountCommon.escapeHtml(title)}</h1>
        <p class="account-page-copy">${accountCommon.escapeHtml(copy)}</p>
      </div>
    </section>
    <section class="empty-state-card account-empty-state">
      <strong>No orders yet.</strong>
      <p>Your completed and cancelled orders will appear here.</p>
    </section>
  `;
}

function renderOrders(orders) {
  ordersApp.innerHTML = `
    <section class="account-page-hero">
      <div>
        <h1>Your Orders</h1>
        <p class="account-page-copy">Track your recent purchases and open full order details any time.</p>
      </div>
    </section>
    <section class="orders-table">
      <div class="orders-table-head">
        <span>Purchase ID</span>
        <span>Total price</span>
        <span>Status</span>
        <span></span>
      </div>
      ${orders.map((order) => `
        <article class="order-row-card">
          <div class="order-meta">
            <div class="order-meta-icon" aria-hidden="true">▣</div>
            <div class="order-meta-copy">
              <strong>Order ${accountCommon.escapeHtml(order.id)}</strong>
              <span>${accountCommon.escapeHtml(formatOrderDate(order.createdAt))}</span>
            </div>
          </div>
          <div class="order-price-copy">
            <strong>${formatRupiah.format(order.pricing?.total || 0)}</strong>
            <span>${accountCommon.escapeHtml(`${order.itemCount || 0} item${order.itemCount === 1 ? "" : "s"}`)}</span>
          </div>
          <div>${statusMarkup(order.status)}</div>
          <div class="order-row-actions">
            <a class="secondary-button button-link" href="/pay.html${modeQuery ? `${modeQuery}&order=${encodeURIComponent(order.id)}` : `?order=${encodeURIComponent(order.id)}`}">View Order</a>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

async function bootstrap() {
  const draft = accountCommon.loadDraft(draftKey, { customer: {} });
  const phone = draft?.customer?.phone;
  homeLink.href = `/index.html${modeQuery}`;
  cartLink.href = `/cart.html${modeQuery}`;
  accountCommon.bindAccountMenu({
    draft,
    draftKey,
    modeQuery,
    accountBadge,
    accountMenu,
    accountMenuName,
    accountMenuPhone,
    accountMenuEmail,
    accountSummaryButton,
    accountOrderHistoryLink,
    accountAddressesLink,
    accountLogoutButton,
    onSummary: () => {
      window.location.href = `/index.html${modeQuery}`;
    }
  });

  if (!draft?.customer?.phoneVerifiedAt || !phone) {
    renderEmpty("Your Orders", "Log in with your WhatsApp number to see your purchase history.");
    return;
  }

  const response = await accountCommon.request(appMode, "/api/customer/orders");
  const orders = Array.isArray(response.orders) ? response.orders : [];
  if (!orders.length) {
    renderEmpty("Your Orders", "Your future purchases will show up here once you place an order.");
    return;
  }

  renderOrders(orders);
}

bootstrap().catch((error) => {
  ordersApp.innerHTML = `
    <section class="empty-state-card">
      <strong>Unable to load your orders.</strong>
      <p>${accountCommon.escapeHtml(error.message)}</p>
    </section>
  `;
});
