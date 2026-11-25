const mongoose = require("mongoose");
const toSlug = require("../utils/slug");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (options) => options.length >= 2,
        message: "A question needs at least two options",
      },
    },
    correctIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: true },
    questions: { type: [questionSchema], default: [] },
    published: { type: Boolean, default: false },
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true }
);

// Generate a searchable slug from the title (unique thanks to the id suffix).
quizSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = `${toSlug(this.title)}-${this._id.toString().slice(-6)}`;
  }
  next();
});

module.exports = mongoose.model("Quiz", quizSchema);
