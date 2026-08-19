import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "../src/app";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
  isConnected = true;
  console.log("MongoDB connected (serverless)");
}

export default async function handler(req: any, res: any) {
  await connectDB();
  return (app as any)(req, res);
}
