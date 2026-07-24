const params = new URLSearchParams(window.location.search);
const appMode = params.get("mode") === "test" ? "test" : "live";
const modeQuery = appMode === "test" ? "?mode=test" : "";
const shopperStateVersion = "20260604-session-cart";
const draftKey = `bakeaholic-checkout-draft-${shopperStateVersion}-${appMode}`;
const accountCommon = window.BakeaholicAccountCommon;

const addressesApp = document.getElementById("addressesApp");
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
const locationModal = document.getElementById("locationModal");
const modalScrim = document.getElementById("modalScrim");

const kitchenLocation = {
  lat: -8.664322,
  lng: 115.196227,
  label: "Bakeaholic kitchen"
};

const state = {
  draft: null,
  addresses: [],
  defaultAddressId: "",
  locationPicker: null,
  publicConfig: null
};
let pageStore = {};

function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify(state.draft));
}

function closeModal() {
  modalScrim.hidden = true;
  locationModal.hidden = true;
}

function openModal() {
  modalScrim.hidden = false;
  locationModal.hidden = false;
  state.locationPicker?.open();
}

function currentDefaultAddress() {
  return state.addresses.find((entry) => entry.id === state.defaultAddressId) || state.addresses[0] || null;
}

function syncDraftWithAddress(address) {
  if (!address) return;
  state.draft.destination = {
    lat: address.lat,
    lng: address.lng,
    label: address.label,
    formattedAddress: address.formattedAddress,
    locationNotes: address.locationNotes || "",
    routeDistanceKm: address.routeDistanceKm || null
  };
  state.draft.customer.address = address.formattedAddress || "";
  saveDraft();
}

function render() {
  const hasAddresses = state.addresses.length > 0;
  addressesApp.innerHTML = `
    <section class="account-page-hero">
      <div>
        <h1>${accountCommon.escapeHtml(pageStore.addressesPageTitle || "Your Addresses")}</h1>
        <p class="account-page-copy">${accountCommon.escapeHtml(pageStore.addressesPageSubtitle || "Choose a default delivery address or save another one for future orders.")}</p>
      </div>
      <button class="account-page-action" id="addAddressButton" type="button">+ Add new</button>
    </section>
    ${hasAddresses ? `
      <section class="address-grid">
        ${state.addresses.map((address) => `
          <article class="address-card">
            <div class="address-card-head">
              <div class="address-card-title">
                <span class="address-card-icon" aria-hidden="true">⌖</span>
                <div>
                  <h2>${accountCommon.escapeHtml(address.label || "Saved address")}</h2>
                </div>
              </div>
              ${address.id === state.defaultAddressId ? '<span class="default-tag">Default</span>' : ""}
            </div>
            <div class="address-card-body">
              <p>${accountCommon.escapeHtml(address.formattedAddress)}</p>
              ${address.locationNotes ? `<div class="address-card-notes">${accountCommon.escapeHtml(address.locationNotes)}</div>` : ""}
              <div class="address-card-actions">
                ${address.id === state.defaultAddressId
                  ? '<button class="ghost-button" type="button" disabled>Default address</button>'
                  : `<button class="ghost-button" type="button" data-default-address="${accountCommon.escapeHtml(address.id)}">Set as default address</button>`}
              </div>
            </div>
          </article>
        `).join("")}
      </section>
    ` : `
      <section class="empty-state-card account-empty-state">
        <strong>No saved addresses yet.</strong>
        <p>Add your first delivery address and we’ll remember it for next time.</p>
      </section>
    `}
  `;

  document.getElementById("addAddressButton")?.addEventListener("click", () => {
    openModal();
  });

  addressesApp.querySelectorAll("[data-default-address]").forEach((button) => {
    button.addEventListener("click", async () => {
      const addressId = button.getAttribute("data-default-address");
      const response = await accountCommon.request(appMode, "/api/customer/addresses/default", {
        method: "POST",
        body: JSON.stringify({
          addressId
        })
      });
      state.addresses = response.addresses || [];
      state.defaultAddressId = response.defaultAddressId || "";
      syncDraftWithAddress(currentDefaultAddress());
      render();
    });
  });
}

async function loadAddresses() {
  const response = await accountCommon.request(appMode, "/api/customer/addresses");
  state.addresses = response.addresses || [];
  state.defaultAddressId = response.defaultAddressId || "";

  if (!state.addresses.length && state.draft?.destination?.formattedAddress) {
    const seeded = await accountCommon.request(appMode, "/api/customer/addresses", {
      method: "POST",
      body: JSON.stringify({
        label: state.draft.destination.label || "Saved address",
        formattedAddress: state.draft.destination.formattedAddress,
        locationNotes: state.draft.destination.locationNotes || "",
        lat: state.draft.destination.lat,
        lng: state.draft.destination.lng,
        routeDistanceKm: state.draft.destination.routeDistanceKm,
        setAsDefault: true
      })
    });
    state.addresses = seeded.addresses || [];
    state.defaultAddressId = seeded.defaultAddressId || "";
  }

  syncDraftWithAddress(currentDefaultAddress());
  render();
}

async function initializeLocationPicker() {
  state.publicConfig = await accountCommon.request(appMode, "/api/public-config");
  state.locationPicker = window.BakeaholicLocationPicker?.createLocationPicker({
    rootId: "locationModal",
    kitchen: kitchenLocation,
    initialValue: state.draft.destination,
    googleMapsApiKey: state.publicConfig.googleMapsApiKey,
    onSave: async (destination) => {
      const response = await accountCommon.request(appMode, "/api/customer/addresses", {
        method: "POST",
        body: JSON.stringify({
          label: destination.label,
          formattedAddress: destination.formattedAddress,
          locationNotes: destination.locationNotes,
          lat: destination.lat,
          lng: destination.lng,
          routeDistanceKm: destination.routeDistanceKm,
          setAsDefault: !state.addresses.length
        })
      });
      state.addresses = response.addresses || [];
      state.defaultAddressId = response.defaultAddressId || "";
      syncDraftWithAddress(currentDefaultAddress());
      closeModal();
      render();
    }
  });

  if (!state.locationPicker) {
    throw new Error("Address map could not be initialized.");
  }
}

async function bootstrap() {
  pageStore = (await accountCommon.request(appMode, "/api/menu")).store || {};
  state.draft = accountCommon.loadDraft(draftKey, { customer: {}, destination: null });
  homeLink.href = `/index.html${modeQuery}`;
  cartLink.href = `/cart.html${modeQuery}`;
  accountCommon.bindAccountMenu({
    draft: state.draft,
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

  if (!state.draft?.customer?.phoneVerifiedAt || !state.draft?.customer?.phone) {
    addressesApp.innerHTML = `
      <section class="empty-state-card account-empty-state">
        <strong>Log in first to manage addresses.</strong>
        <p>Your saved delivery locations are tied to your verified WhatsApp number.</p>
      </section>
    `;
    return;
  }

  await initializeLocationPicker();
  await loadAddresses();
}

document.getElementById("closeLocationModal")?.addEventListener("click", closeModal);
modalScrim?.addEventListener("click", closeModal);

bootstrap().catch((error) => {
  addressesApp.innerHTML = `
    <section class="empty-state-card">
      <strong>Unable to load your addresses.</strong>
      <p>${accountCommon.escapeHtml(error.message)}</p>
    </section>
  `;
});
