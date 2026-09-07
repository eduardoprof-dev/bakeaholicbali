const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

for (const filename of ["app.js", "cart.js"]) {
  test(`${filename} enforces cart expiry from the last mutation, not passive reads`, () => {
    const source = fs.readFileSync(path.join(__dirname, filename), "utf8");

    assert.match(source, /cartSessionMaxAgeMs = 24 \* 60 \* 60 \* 1000/);
    assert.match(source, /lastMutatedAt: sessionLastMutatedAt/);
    assert.match(source, /isCurrentCartSessionTimestamp\(lastMutatedAt\)/);
    assert.match(source, /X-Cart-Session-Last-Mutated-At/);
    assert.match(source, /rememberCartSession\(payload, \{ mutated: isCartMutation \}\)/);
    assert.match(source, /window\.addEventListener\("storage", syncCartSessionFromStorage\)/);
    assert.doesNotMatch(source, /lastMutatedAt: Date\.now\(\)\s*\}\);/);
    assert.match(source, /storedSessionId === urlSessionId\.toLowerCase\(\)/);
  });
}
