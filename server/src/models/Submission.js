const mongoose = require("mongoose");

// One trainee's submission for one assignment. The compound unique index
// enforces a single submission per trainee per assignment; resubmitting
// updates the existing document.
const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, trim: true, default: "" },
    link: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
