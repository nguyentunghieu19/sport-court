import assert from "node:assert/strict";
import test from "node:test";
import { roleHome, safeReturnTo } from "../src/auth/authNavigation.ts";

const origin = "http://localhost:5173";

test("each account role lands in its own workspace", () => {
  assert.equal(roleHome("USER"), "/");
  assert.equal(roleHome("OWNER"), "/manage");
  assert.equal(roleHome("STAFF"), "/manage");
  assert.equal(roleHome("ADMIN"), "/admin");
});

test("guest booking selections survive login without losing query or fragment", () => {
  const target = "/fields/7/book?date=2026-11-14&startTime=16%3A00&endTime=17%3A00#summary";
  assert.equal(safeReturnTo(target, origin), target);
  assert.equal(safeReturnTo("/my-bookings/4?payment=23", origin), "/my-bookings/4?payment=23");
});

test("login return paths cannot send the browser outside the site", () => {
  for (const target of [null, "", "https://evil.test", "//evil.test/path", "/\\evil.test/path", "javascript:alert(1)", "/\t/evil.test"]) {
    assert.equal(safeReturnTo(target, origin), null, String(target));
  }
});

test("authentication screens cannot recursively redirect to themselves", () => {
  for (const target of ["/login", "/LOGIN", "/%6cogin", "/login?returnTo=%2Flogin", "/register", "/register-owner", "/register/", "/a/../login", "/invalid%escape"]) {
    assert.equal(safeReturnTo(target, origin), null, target);
  }
});
