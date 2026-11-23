const toSlug = require("../src/utils/slug");

describe("toSlug", () => {
  test("lowercases and hyphenates a display name", () => {
    expect(toSlug("Mona Ali")).toBe("mona-ali");
  });

  test("trims surrounding whitespace", () => {
    expect(toSlug("  Intro To Node  ")).toBe("intro-to-node");
  });

  test("removes characters that are not letters, digits, spaces or dashes", () => {
    expect(toSlug("C++ & Friends!")).toBe("c-friends");
  });

  test("collapses repeated spaces and dashes into one dash", () => {
    expect(toSlug("a -- b   c")).toBe("a-b-c");
  });

  test("accepts non-string input by converting it", () => {
    expect(toSlug(123)).toBe("123");
  });
});
