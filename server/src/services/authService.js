const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("./emailService");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// The shape we are willing to send back to clients (never the password hash).
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, slug: user.slug };
}

function fail(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function signup({ name, email, password, role }) {
  const exists = await User.findOne({ email });
  if (exists) throw fail(409, "Email already registered");
  const user = await User.create({ name, email, password, role });
  return { token: signToken(user), user: publicUser(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.password || !(await user.comparePassword(password))) {
    throw fail(401, "Wrong email or password");
  }
  return { token: signToken(user), user: publicUser(user) };
}

// Verify the Google ID token from the client, then find or create the user.
async function googleLogin(idToken) {
  if (!idToken) throw fail(400, "Missing Google idToken");
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { sub: googleId, email, name } = ticket.getPayload();
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, googleId });
  } else if (!user.googleId) {
    user.googleId = googleId;
    await user.save();
  }
  return { token: signToken(user), user: publicUser(user) };
}

// Always succeed from the caller's view: never reveal whether the email exists.
async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) return;
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
}

async function resetPassword(token, newPassword) {
  const hashed = crypto.createHash("sha256").update(String(token || "")).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw fail(400, "Reset link is invalid or expired");
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  return { token: signToken(user), user: publicUser(user) };
}

async function getMe(userId) {
  const user = await User.findById(userId);
  return { user: publicUser(user) };
}

module.exports = { signup, login, googleLogin, forgotPassword, resetPassword, getMe };
