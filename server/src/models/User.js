const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const toSlug = require("../utils/slug");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Only required for local accounts; Google sign-in users have a googleId instead.
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: { type: String, select: false },
    role: { type: String, enum: ["instructor", "trainee"], default: "trainee" },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Generate a searchable slug from the name (unique thanks to the id suffix).
userSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = `${toSlug(this.name)}-${this._id.toString().slice(-6)}`;
  }
  next();
});

// Hash the password automatically before saving.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare a plain password with the stored hash (used at login).
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
