import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import PlatformAdmin from "../models/PlatformAdmin";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const name = "Platform Owner";
  const email = "superadmin@broscode.dev";
  const password = "changeme123";

  const existing = await PlatformAdmin.findOne({ email });
  if (existing) {
    console.log("A platform admin already exists with this email.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await PlatformAdmin.create({
    name,
    email,
    password: hashedPassword,
    role: "SUPER_ADMIN",
  });

  console.log("Super Admin created:", admin.email, "- password:", password, "- CHANGE THIS after first login.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

