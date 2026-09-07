const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = __dirname;
const catalog = JSON.parse(fs.readFileSync(path.join(root, "data", "catalog.json"), "utf8"));

test("legacy fixed bundle records remain intact for existing orders", () => {
  const bliss = catalog.items.find((item) => item.id === "bundle-bliss-mixed-4");
  const cookies = catalog.items.find((item) => item.id === "bundle-cookie-mixed-12");
  assert.equal(bliss.price, 250000);
  assert.deepEqual(bliss.bundleComponents, [
    { itemId: "bliss-cranberry", quantity: 1 },
    { itemId: "bliss-peanutella", quantity: 1 },
    { itemId: "bliss-salted-caramel", quantity: 1 },
    { itemId: "bliss-triple-chocolate", quantity: 1 }
  ]);
  assert.equal(cookies.price, 200000);
  assert.deepEqual(cookies.bundleComponents, [
    { itemId: "cookie-choc-chip", quantity: 3 },
    { itemId: "cookie-raisin", quantity: 3 },
    { itemId: "cookie-lamington", quantity: 3 },
    { itemId: "cookie-smores", quantity: 3 }
  ]);
});

test("homepage places Limited Bundles immediately after the order banner", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /id="orderBanner"[\s\S]*?id="promoCard"[\s\S]*?class="brand-story-card"/);
  assert.doesNotMatch(html, /Best Seller/);
  assert.match(html, /Pick your flavours/);
  assert.match(html, /Choose your flavours/);
  assert.match(html, /id="limitedBundleCarouselControls"/);
  assert.match(html, /aria-label="Previous bundle"/);
  assert.match(html, /aria-label="Next bundle"/);
  assert.match(html, /href="\/styles\.css/);
  assert.match(html, /src="\/app\.js/);
});

test("homepage promotion routes shoppers to flavours instead of adding a fixed assortment", () => {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(app, /data-bundle-category/);
  assert.doesNotMatch(app, /data-bundle-add/);
  assert.doesNotMatch(app, /Fixed assortments/);
  assert.match(app, /scrollTo\(\{ left:/);
  assert.match(app, /limitedBundleCounter\.textContent/);
});

test("client and server do not block orders using catalog stock", () => {
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const cart = fs.readFileSync(path.join(root, "cart.js"), "utf8");
  assert.doesNotMatch(server, /is out of stock|Only \$\{item\.stock\} left/);
  assert.doesNotMatch(app, /item\.stock <= 0/);
  assert.doesNotMatch(cart, /nextQuantity > stock/);
});
