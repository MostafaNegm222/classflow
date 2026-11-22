const mongoose = require("mongoose");
const toSlug = require("../utils/slug");

const instructorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    headline: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    expertise: { type: [String], default: [] },
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true }
);

// Generate a searchable slug from the linked user's name.
instructorSchema.pre("save", async function (next) {
  if (this.slug) return next();
  await this.populate("user", "name");
  const base = this.user && this.user.name ? this.user.name : "instructor";
  this.slug = `${toSlug(base)}-${this._id.toString().slice(-6)}`;
  next();
});

module.exports = mongoose.model("Instructor", instructorSchema);
