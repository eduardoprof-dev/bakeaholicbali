const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildFulfillmentGroups,
  normalizeMarketplaceCatalog,
  productMarketplaceFields
} = require("./marketplace");

test("existing products remain owned and fulfilled by Bakeaholic", () => {
  const marketplace = normalizeMarketplaceCatalog({});
  assert.deepEqual(productMarketplaceFields({ id: "legacy-product" }, marketplace), {
    brandId: "bakeaholic",
    fulfillmentLocationId: "bakeaholic-denpasar",
    internationalShipping: false
  });
});

test("Knots configuration preserves its owned domain and international fulfillment", () => {
  const marketplace = normalizeMarketplaceCatalog({});
  const knots = marketplace.brands.find((brand) => brand.id === "knots");
  assert.equal(knots.websiteUrl, "https://knotsbali.com");
  assert.equal(knots.commissionPercent, 15);
  assert.equal(knots.settlementSchedule, "twice_monthly");
  assert.deepEqual(productMarketplaceFields({ id: "throw", brandId: "knots" }, marketplace), {
    brandId: "knots",
    fulfillmentLocationId: "knots-bali-office",
    internationalShipping: true
  });
});

test("one checkout creates separate immutable commercial fulfillment groups", () => {
  const groups = buildFulfillmentGroups([
    { item: { id: "bliss", price: 75000 }, quantity: 2 },
    { item: { id: "throw", price: 850000, brandId: "knots" }, quantity: 1 }
  ]);
  assert.equal(groups.length, 2);
  const bakeaholic = groups.find((group) => group.brandId === "bakeaholic");
  const knots = groups.find((group) => group.brandId === "knots");
  assert.equal(bakeaholic.productSubtotal, 150000);
  assert.equal(bakeaholic.commissionAmount, 0);
  assert.equal(knots.productSubtotal, 850000);
  assert.equal(knots.commissionAmount, 127500);
  assert.equal(knots.sellerNetAmount, 722500);
  assert.equal(knots.fulfillmentLocationId, "knots-bali-office");
});
