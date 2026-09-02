const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

for (const filename of ["app.js", "cart.js"]) {
  test(`${filename} enforces a hard 24-hour cart lifetime`, () => {
    const source = fs.readFileSync(path.join(__dirname, filename), "utf8");

    assert.match(source, /cartSessionMaxAgeMs = 24 \* 60 \* 60 \* 1000/);
    assert.match(source, /JSON\.stringify\(\{ id: normalized, createdAt: sessionCreatedAt \}\)/);
    assert.doesNotMatch(source, /updatedAt: Date\.now\(\)/);
    assert.match(source, /Date\.now\(\) - volatileCartSessionCreatedAt <= cartSessionMaxAgeMs/);
    assert.match(source, /storedSessionId === urlSessionId\.toLowerCase\(\)/);
  });
}
