const express = require("express");
const quizController = require("../controllers/quizController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", quizController.list);
router.post("/", protect, requireRole("instructor"), quizController.create);
router.post("/:id/grade", protect, quizController.grade);
router.put("/:id", protect, requireRole("instructor"), quizController.update);
router.delete("/:id", protect, requireRole("instructor"), quizController.remove);
router.get("/:slug", quizController.getBySlug);

module.exports = router;
