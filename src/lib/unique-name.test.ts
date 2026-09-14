import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getUniqueSectionName } from "./unique-name";

describe("getUniqueSectionName", () => {
  it("returns the desired name if no duplicate exists", () => {
    assert.equal(getUniqueSectionName("Hero Banner", []), "Hero Banner");
    assert.equal(getUniqueSectionName("About Us", ["Hero Banner", "Contact Us"]), "About Us");
  });

  it("appends '2' if an exact duplicate exists", () => {
    assert.equal(getUniqueSectionName("Hero Banner", ["Hero Banner"]), "Hero Banner 2");
    assert.equal(getUniqueSectionName("hero banner", ["Hero Banner"]), "hero banner 2");
  });

  it("increments to the next available number suffix", () => {
    assert.equal(
      getUniqueSectionName("Hero Banner", ["Hero Banner", "Hero Banner 2"]),
      "Hero Banner 3",
    );
    assert.equal(
      getUniqueSectionName("Hero Banner 2", ["Hero Banner", "Hero Banner 2", "Hero Banner 3"]),
      "Hero Banner 4",
    );
  });

  it("handles complex section names with brackets and category markers", () => {
    const existing = ["Hero Banner [hero] - Hero Banner Variant"];
    assert.equal(
      getUniqueSectionName("Hero Banner [hero] - Hero Banner Variant", existing),
      "Hero Banner [hero] - Hero Banner Variant 2",
    );

    const existingMultiple = [
      "Hero Banner [hero] - Hero Banner Variant",
      "Hero Banner [hero] - Hero Banner Variant 2",
    ];
    assert.equal(
      getUniqueSectionName("Hero Banner [hero] - Hero Banner Variant", existingMultiple),
      "Hero Banner [hero] - Hero Banner Variant 3",
    );
  });

  it("handles empty or whitespace inputs gracefully", () => {
    assert.equal(getUniqueSectionName("", []), "Section 1");
    assert.equal(getUniqueSectionName("   ", ["Section 1"]), "Section 2");
    assert.equal(getUniqueSectionName("   ", ["Section 1", "Section 2"]), "Section 3");
  });

  it("ignores null, undefined, or empty strings in existingNames list", () => {
    assert.equal(getUniqueSectionName("Test Section", [null, undefined, ""]), "Test Section");
    assert.equal(
      getUniqueSectionName("Test Section", [null, "Test Section", ""]),
      "Test Section 2",
    );
  });
});
