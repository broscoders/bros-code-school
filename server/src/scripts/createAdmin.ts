import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);

  const email = "thedaniinfo@gmail.com";
  const password = "1234";
  const schoolId = "6a7a34b8f4bf247132b2fe3e";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("User already exists with this email.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: "Admin",
    email,
    password: hashedPassword,
    role: "SCHOOL_ADMIN",
    schoolId,
  });

  console.log("Admin created:", user.email);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
