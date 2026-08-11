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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : "*";

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
