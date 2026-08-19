import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const email = "thedaniinfo@gmail.com";
  const password = "21.22.23";
  const schoolId = "6a7a34b8f4bf247132b2fe3e";

  const deleted = await User.findOneAndDelete({ email });
  if (deleted) {
    console.log("Purana admin delete ho gaya:", deleted.email);
  } else {
    console.log("Is email se pehle koi admin nahi tha.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: "Admin",
    email,
    password: hashedPassword,
    role: "SCHOOL_ADMIN",
    schoolId,
  });

  console.log("Naya admin ban gaya:", user.email);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});