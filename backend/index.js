import express from "express";
import cors from "cors";
import dbConnect from "./db/db.js";
import authRoutes from "./routes/auth.route.js";
import fileRoutes from "./routes/file.route.js";
import matchRoutes from "./routes/match.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/match", matchRoutes);

const PORT = 3000;

app.listen(PORT, () =>
	console.log(`Server running on http://localhost:${PORT}`),
);
