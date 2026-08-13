import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "../src/routes/authRoutes";
import schoolRoutes from "../src/routes/schoolRoutes";
import academicRoutes from "../src/routes/academicRoutes";
import peopleRoutes from "../src/routes/peopleRoutes";
import academicOpsRoutes from "../src/routes/academicOpsRoutes";
import extraRoutes from "../src/routes/extraRoutes";
import miscRoutes from "../src/routes/miscRoutes";
import aiRoutes from "../src/routes/aiRoutes";
import uploadRoutes from "../src/routes/uploadRoutes";
import auditRoutes from "../src/routes/auditRoutes";
import communicationRoutes from "../src/routes/communicationRoutes";
import storeRoutes from "../src/routes/storeRoutes";
import crmRoutes from "../src/routes/crmRoutes";
import systemRoutes from "../src/routes/systemRoutes";
import searchRoutes from "../src/routes/searchRoutes";
import permissionRoutes from "../src/routes/permissionRoutes";
import dashboardRoutes from "../src/routes/dashboardRoutes";
import bulkRoutes from "../src/routes/bulkRoutes";
import reportsRoutes from "../src/routes/reportsRoutes";
import financeRoutes from "../src/routes/financeRoutes";
import hrRoutes from "../src/routes/hrRoutes";
import hostelRoutes from "../src/routes/hostelRoutes";
import assetsRoutes from "../src/routes/assetsRoutes";
import healthRoutes from "../src/routes/healthRoutes";

dotenv.config();

const app = express();

const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : "*";
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Bros Code School API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/academics", academicRoutes);
app.use("/api/people", peopleRoutes);
app.use("/api/ops", academicOpsRoutes);
app.use("/api/extra", extraRoutes);
app.use("/api/misc", miscRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/comm", communicationRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bulk", bulkRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/health", healthRoutes);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI as string);
  isConnected = true;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

export default app;
