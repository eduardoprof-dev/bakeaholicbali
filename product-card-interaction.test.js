const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appSource = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");

test("product image details trigger is explicit, keyboard-native, and separate from cart add", () => {
  assert.match(appSource, /function bundleComponentText\(item\)/);
  assert.match(appSource, /<article class="product-card" data-product-id="\$\{escapeHtml\(item\.id\)\}">/);
  assert.match(appSource, /<button class="product-details-trigger product-thumb-wrap" type="button" data-product-details="\$\{escapeHtml\(item\.id\)\}" aria-label="View \$\{escapeHtml\(item\.name\)\} details"/);
  assert.match(appSource, /catalog\.querySelectorAll\("\[data-product-details\]"\)\.forEach\(\(button\) => \{\s+button\.addEventListener\("click", \(\) => openProductModal\(button\.dataset\.productDetails\)\);/);
  assert.match(appSource, /button\.addEventListener\("click", \(event\) => \{\s+event\.stopPropagation\(\);\s+addToCart\(button\.dataset\.itemId, button\);/);
  assert.doesNotMatch(appSource, /<article class="product-card" role="button" tabindex="0"/);
  assert.match(stylesSource, /\.product-details-trigger:focus-visible/);
});
