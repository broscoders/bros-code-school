import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type AutomationTrigger =
  | "STUDENT_ABSENT"
  | "FEE_DUE_SOON"
  | "FEE_OVERDUE"
  | "EXAM_APPROACHING"
  | "ASSIGNMENT_DEADLINE_APPROACHING"
  | "RESULT_PUBLISHED"
  | "ADMISSION_APPROVED";

export interface IAutomationRule extends Document {
  schoolId: mongoose.Types.ObjectId;
  triggerEvent: AutomationTrigger;
  isActive: boolean;
  messageTemplate: string;
  lastRunAt?: Date;
}

const automationRuleSchema = new Schema<IAutomationRule>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    triggerEvent: {
      type: String,
      enum: ["STUDENT_ABSENT", "FEE_DUE_SOON", "FEE_OVERDUE", "EXAM_APPROACHING", "ASSIGNMENT_DEADLINE_APPROACHING", "RESULT_PUBLISHED", "ADMISSION_APPROVED"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    messageTemplate: { type: String, required: true },
    lastRunAt: { type: Date },
  },
  { timestamps: true }
);

automationRuleSchema.index({ schoolId: 1, triggerEvent: 1 }, { unique: true });

export default mongoose.model<IAutomationRule>("AutomationRule", automationRuleSchema);
