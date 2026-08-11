import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ISurveyResponse extends Document {
  surveyId: mongoose.Types.ObjectId;
  respondedBy: mongoose.Types.ObjectId;
  answers: string[];
}

const surveyResponseSchema = new Schema<ISurveyResponse>(
  {
    surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
    respondedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<ISurveyResponse>("SurveyResponse", surveyResponseSchema);
