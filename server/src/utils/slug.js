// Turn a display name into a URL-friendly slug: "Mona Ali" -> "mona-ali".
function toSlug(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");
}

module.exports = toSlug;
