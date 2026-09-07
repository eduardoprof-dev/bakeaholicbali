const DEFAULT_COMMISSION_PERCENT = 15;

const DEFAULT_BRANDS = [
  {
    id: "bakeaholic",
    name: "Bakeaholic Bali",
    slug: "bakeaholic",
    active: true,
    featured: true,
    sellerType: "owned",
    websiteUrl: "https://bakeaholicbali.com",
    instagramUrl: "https://www.instagram.com/bakeaholicbali/",
    facebookUrl: "",
    commissionPercent: 0,
    settlementSchedule: "internal",
    defaultFulfillmentLocationId: "bakeaholic-denpasar"
  },
  {
    id: "knots",
    name: "Knots Bali",
    slug: "knots-bali",
    active: true,
    featured: true,
    sellerType: "owned",
    websiteUrl: "https://knotsbali.com",
    instagramUrl: "",
    facebookUrl: "",
    commissionPercent: DEFAULT_COMMISSION_PERCENT,
    settlementSchedule: "twice_monthly",
    defaultFulfillmentLocationId: "knots-bali-office"
  }
];

const DEFAULT_FULFILLMENT_LOCATIONS = [
  {
    id: "bakeaholic-denpasar",
    brandId: "bakeaholic",
    name: "Bakeaholic Bali Kitchen",
    active: true,
    countryCode: "ID",
    timezone: "Asia/Makassar",
    address: "Jl. Gunung Salak Utara No.47, Padangsambian Klod, Denpasar, Bali 80117, Indonesia",
    latitude: -8.66425,
    longitude: 115.176172,
    domesticShipping: true,
    internationalShipping: false
  },
  {
    id: "knots-bali-office",
    brandId: "knots",
    name: "Knots Bali Office",
    active: true,
    countryCode: "ID",
    timezone: "Asia/Makassar",
    address: "",
    latitude: null,
    longitude: null,
    domesticShipping: true,
    internationalShipping: true
  }
];

function finitePercent(value, fallback = DEFAULT_COMMISSION_PERCENT) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : fallback;
}

function normalizeBrand(brand = {}) {
  return {
    id: String(brand.id || "").trim(),
    name: String(brand.name || "").trim(),
    slug: String(brand.slug || brand.id || "").trim(),
    active: brand.active !== false,
    featured: brand.featured === true,
    sellerType: brand.sellerType === "independent" ? "independent" : "owned",
    websiteUrl: String(brand.websiteUrl || "").trim(),
    instagramUrl: String(brand.instagramUrl || "").trim(),
    facebookUrl: String(brand.facebookUrl || "").trim(),
    commissionPercent: finitePercent(brand.commissionPercent, 0),
    settlementSchedule: ["internal", "twice_monthly", "monthly"].includes(brand.settlementSchedule)
      ? brand.settlementSchedule
      : "twice_monthly",
    defaultFulfillmentLocationId: String(brand.defaultFulfillmentLocationId || "").trim()
  };
}

function normalizeFulfillmentLocation(location = {}) {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  return {
    id: String(location.id || "").trim(),
    brandId: String(location.brandId || "").trim(),
    name: String(location.name || "").trim(),
    active: location.active !== false,
    countryCode: String(location.countryCode || "ID").trim().toUpperCase(),
    timezone: String(location.timezone || "Asia/Makassar").trim(),
    address: String(location.address || "").trim(),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    domesticShipping: location.domesticShipping !== false,
    internationalShipping: location.internationalShipping === true
  };
}

function mergeDefaults(values, defaults, normalizer) {
  const provided = Array.isArray(values) ? values : [];
  const byId = new Map(provided.map((value) => [String(value?.id || "").trim(), value]));
  const merged = defaults.map((fallback) => normalizer({ ...fallback, ...(byId.get(fallback.id) || {}) }));
  const defaultIds = new Set(defaults.map((value) => value.id));
  for (const value of provided) {
    if (!defaultIds.has(String(value?.id || "").trim())) merged.push(normalizer(value));
  }
  return merged.filter((value) => value.id && value.name);
}

function normalizeMarketplaceCatalog(catalog = {}) {
  return {
    brands: mergeDefaults(catalog.brands, DEFAULT_BRANDS, normalizeBrand),
    fulfillmentLocations: mergeDefaults(
      catalog.fulfillmentLocations,
      DEFAULT_FULFILLMENT_LOCATIONS,
      normalizeFulfillmentLocation
    )
  };
}

function productMarketplaceFields(item = {}, marketplace = normalizeMarketplaceCatalog()) {
  const requestedBrandId = String(item.brandId || "bakeaholic").trim();
  const brand = marketplace.brands.find((entry) => entry.id === requestedBrandId && entry.active)
    || marketplace.brands.find((entry) => entry.id === "bakeaholic")
    || marketplace.brands[0];
  const requestedLocationId = String(item.fulfillmentLocationId || brand?.defaultFulfillmentLocationId || "").trim();
  const location = marketplace.fulfillmentLocations.find((entry) => (
    entry.id === requestedLocationId && entry.brandId === brand?.id && entry.active
  )) || marketplace.fulfillmentLocations.find((entry) => entry.id === brand?.defaultFulfillmentLocationId);
  return {
    brandId: brand?.id || "bakeaholic",
    fulfillmentLocationId: location?.id || "bakeaholic-denpasar",
    internationalShipping: item.internationalShipping === true || location?.internationalShipping === true
  };
}

function buildFulfillmentGroups(lineItems = [], catalog = {}) {
  const marketplace = normalizeMarketplaceCatalog(catalog);
  const groups = new Map();
  for (const line of lineItems) {
    const item = line.item || line;
    const quantity = Math.max(0, Number(line.quantity || 0));
    if (!item?.id || quantity <= 0) continue;
    const ownership = productMarketplaceFields(item, marketplace);
    const brand = marketplace.brands.find((entry) => entry.id === ownership.brandId);
    const location = marketplace.fulfillmentLocations.find((entry) => entry.id === ownership.fulfillmentLocationId);
    const key = `${ownership.brandId}:${ownership.fulfillmentLocationId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        brandId: ownership.brandId,
        brandName: brand?.name || ownership.brandId,
        fulfillmentLocationId: ownership.fulfillmentLocationId,
        fulfillmentLocationName: location?.name || ownership.fulfillmentLocationId,
        status: "pending",
        internationalShipping: Boolean(location?.internationalShipping),
        commissionPercent: finitePercent(brand?.commissionPercent, 0),
        productSubtotal: 0,
        commissionAmount: 0,
        sellerNetAmount: 0,
        items: []
      });
    }
    const group = groups.get(key);
    const unitPrice = Math.max(0, Number(item.price || line.unitPrice || 0));
    const lineTotal = Math.round(unitPrice * quantity);
    group.items.push({
      itemId: item.id,
      quantity,
      unitPrice,
      lineTotal,
      components: Array.isArray(line.components) ? line.components : []
    });
    group.productSubtotal += lineTotal;
  }
  return [...groups.values()].map((group) => {
    const commissionAmount = Math.round(group.productSubtotal * group.commissionPercent / 100);
    return {
      ...group,
      commissionAmount,
      sellerNetAmount: group.productSubtotal - commissionAmount
    };
  });
}

module.exports = {
  DEFAULT_BRANDS,
  DEFAULT_COMMISSION_PERCENT,
  DEFAULT_FULFILLMENT_LOCATIONS,
  buildFulfillmentGroups,
  normalizeMarketplaceCatalog,
  productMarketplaceFields
};
