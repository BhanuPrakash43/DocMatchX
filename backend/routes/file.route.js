import express from "express";
import multer from "multer";
import {
	uploadFile,
	getUserFiles,
} from "../controllers/fileManager.controller.js";
import {
	authenticateUser,
	authorizeAdmin,
} from "../controllers/auth.controller.js";

const fileRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

fileRoutes.post("/upload", authenticateUser, upload.single("file"), uploadFile);

fileRoutes.get("/all-files", authenticateUser, authorizeAdmin, getUserFiles);

export default fileRoutes;
