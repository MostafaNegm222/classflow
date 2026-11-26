const mongoose = require("mongoose");
const toSlug = require("../utils/slug");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    brief: { type: String, trim: true, default: "" },
    dueDate: { type: Date },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    published: { type: Boolean, default: false },
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true }
);

// Generate a searchable slug from the title (unique thanks to the id suffix).
assignmentSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = `${toSlug(this.title)}-${this._id.toString().slice(-6)}`;
  }
  next();
});

module.exports = mongoose.model("Assignment", assignmentSchema);
