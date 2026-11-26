const express = require("express");
const assignmentController = require("../controllers/assignmentController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", assignmentController.list);
// "/my/submissions" is registered before "/:slug" so "my" is never read as a slug.
router.get("/my/submissions", protect, assignmentController.mySubmissions);
router.post("/", protect, requireRole("instructor"), assignmentController.create);
router.post("/:id/submit", protect, assignmentController.submit);
router.get("/:id/submissions", protect, requireRole("instructor"), assignmentController.assignmentSubmissions);
router.put("/:id", protect, requireRole("instructor"), assignmentController.update);
router.delete("/:id", protect, requireRole("instructor"), assignmentController.remove);
router.get("/:slug", assignmentController.getBySlug);

module.exports = router;
