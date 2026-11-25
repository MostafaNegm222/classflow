const express = require("express");
const quizController = require("../controllers/quizController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", quizController.list);
// "/my/attempts" is registered before "/:slug" so "my" is never read as a slug.
router.get("/my/attempts", protect, quizController.myAttempts);
router.post("/", protect, requireRole("instructor"), quizController.create);
router.post("/:id/grade", protect, quizController.grade);
router.get("/:id/attempts", protect, requireRole("instructor"), quizController.quizAttempts);
router.put("/:id", protect, requireRole("instructor"), quizController.update);
router.delete("/:id", protect, requireRole("instructor"), quizController.remove);
router.get("/:slug", quizController.getBySlug);

module.exports = router;
