import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPhone, telHref } from "./format";

describe("formatPhone", () => {
  it("formats AU mobiles with 0428 grouping", () => {
    assert.equal(formatPhone("0428316868"), "0428 316 868");
    assert.equal(formatPhone("+61428316868"), "0428 316 868");
  });
});

describe("telHref", () => {
  it("uses E.164 click-to-call for AU mobiles", () => {
    assert.equal(telHref("0428 316 868"), "tel:+61428316868");
    assert.equal(telHref("0428316868"), "tel:+61428316868");
    assert.equal(telHref("+61 428 316 868"), "tel:+61428316868");
  });
});
