import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface IPermission extends Document {
  schoolId: mongoose.Types.ObjectId;
  roleName: string;
  isCustom: boolean;
  modules: Map<string, IModulePermission>;
}

const modulePermSchema = new Schema<IModulePermission>(
  {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const permissionSchema = new Schema<IPermission>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    roleName: { type: String, required: true },
    isCustom: { type: Boolean, default: false },
    modules: {
      type: Map,
      of: modulePermSchema,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPermission>("Permission", permissionSchema);
