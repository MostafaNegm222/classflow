const express = require("express");
const instructorController = require("../controllers/instructorController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", instructorController.list);
// "/me" must be registered before "/:slug" so the slug param does not swallow it.
router.get("/me", protect, requireRole("instructor"), instructorController.getMe);
router.put("/me", protect, requireRole("instructor"), instructorController.upsertMe);
router.get("/:slug", instructorController.getBySlug);

module.exports = router;
