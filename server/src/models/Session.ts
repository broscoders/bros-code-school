import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

// Blueprint 10 (Session Management): JWTs are otherwise stateless, which
// means there was no way to see "where am I logged in" or force-logout a
// device (lost phone, shared computer, account handed back after a role
// change). Each login/verify/google-auth creates one of these, keyed by
// the `jti` embedded in that token; protect() checks it hasn't been
// revoked on every request so a revoke takes effect immediately instead
// of waiting for the 7-day token to expire on its own.
export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  jti: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  lastSeenAt: Date;
  revoked: boolean;
  revokedAt?: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    jti: { type: String, required: true, unique: true },
    userAgent: { type: String },
    ip: { type: String },
    lastSeenAt: { type: Date, default: Date.now },
    revoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

sessionSchema.index({ userId: 1, revoked: 1 });

export default mongoose.model<ISession>("Session", sessionSchema);
