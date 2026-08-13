import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import schoolRoutes from "./routes/schoolRoutes";
import academicRoutes from "./routes/academicRoutes";
import peopleRoutes from "./routes/peopleRoutes";
import academicOpsRoutes from "./routes/academicOpsRoutes";
import extraRoutes from "./routes/extraRoutes";
import miscRoutes from "./routes/miscRoutes";
import aiRoutes from "./routes/aiRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import auditRoutes from "./routes/auditRoutes";
import communicationRoutes from "./routes/communicationRoutes";
import storeRoutes from "./routes/storeRoutes";
import crmRoutes from "./routes/crmRoutes";
import systemRoutes from "./routes/systemRoutes";
import searchRoutes from "./routes/searchRoutes";
import permissionRoutes from "./routes/permissionRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import bulkRoutes from "./routes/bulkRoutes";
import reportsRoutes from "./routes/reportsRoutes";
import financeRoutes from "./routes/financeRoutes";
import hrRoutes from "./routes/hrRoutes";
import hostelRoutes from "./routes/hostelRoutes";
import assetsRoutes from "./routes/assetsRoutes";
import healthRoutes from "./routes/healthRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
