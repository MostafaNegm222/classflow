const authService = require("../services/authService");

// Controllers only translate HTTP <-> service calls; the logic lives in the service.
async function signup(req, res, next) {
  try {
    res.status(201).json(await authService.signup(req.body));
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    res.json(await authService.login(req.body));
  } catch (err) {
    next(err);
  }
}

async function googleLogin(req, res, next) {
  try {
    res.json(await authService.googleLogin(req.body.idToken));
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ message: "If this email exists, a reset link is on its way" });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    res.json(await authService.resetPassword(req.body.token, req.body.password));
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    res.json(await authService.getMe(req.user.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, googleLogin, forgotPassword, resetPassword, me };
