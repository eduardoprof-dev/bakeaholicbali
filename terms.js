function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function policyPointsMarkup(value, fallback) {
  const lines = String(value || fallback || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => {
    const separator = line.indexOf(":");
    if (separator < 1) return `<li>${escapeHtml(line)}</li>`;
    const heading = line.slice(0, separator).trim();
    const detail = line.slice(separator + 1).trim();
    return `<li><strong>${escapeHtml(heading)}:</strong> ${escapeHtml(detail)}</li>`;
  }).join("");
}

async function loadLegalContent() {
  try {
    const response = await fetch("/api/menu");
    if (!response.ok) return;
    const payload = await response.json();
    const store = payload.store || {};
    const defaults = {
      termsPoints: "Order confirmation: Orders are confirmed after checkout and payment instructions are generated.\nDelivery: Delivery fees are estimated from your pinned map location and may change if the address is incorrect or incomplete.\nPayments: Orders must be paid through the approved payment methods shown at checkout.\nOrder issues: Missing, incorrect, or damaged items should be reported within 24 hours after delivery.\nCancellations: Orders may be cancelled before payment or before fulfilment begins. Paid orders may require manual review before refund or replacement.\nCustomer conduct: Customers are expected to provide accurate contact and delivery details.",
      privacyPoints: "Data collection: We collect contact, delivery, order, and payment-status information.\nData use: Your information is used to process orders, estimate delivery, confirm payment, and provide support.\nData sharing: Delivery and payment information may be shared with service providers such as payment gateways, courier partners, and WhatsApp messaging tools when needed to fulfil your order.\nData protection: We take reasonable steps to protect customer information from unauthorized access or misuse.\nCustomer support: For privacy or order questions, contact us through the WhatsApp link on the site."
    };
    const textValues = {
      termsPageTitle: store.termsPageTitle || "Terms and Conditions",
      termsEffectiveDate: `Effective date: ${store.termsEffectiveDate || "April 21, 2026"}`,
      termsIntro: store.termsIntro || "By placing an order with Bakeaholic Bali, you agree to these terms. Orders are subject to product availability, delivery availability, payment confirmation, and address accuracy.",
      privacyPageTitle: store.privacyPageTitle || "Privacy Policy",
      privacyEffectiveDate: `Effective date: ${store.privacyEffectiveDate || "April 21, 2026"}`,
      privacyIntro: store.privacyIntro || "We collect the information needed to process your order, including name, WhatsApp number, delivery address, map pin, order notes, and payment status. We use this information only for order processing, delivery coordination, customer support, and service improvement."
    };
    Object.entries(textValues).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    document.getElementById("termsPoints").innerHTML = policyPointsMarkup(store.termsPoints, defaults.termsPoints);
    document.getElementById("privacyPoints").innerHTML = policyPointsMarkup(store.privacyPoints, defaults.privacyPoints);
  } catch (_error) {
    // The static legal copy remains visible if the public catalog is unavailable.
  }
}

loadLegalContent();
