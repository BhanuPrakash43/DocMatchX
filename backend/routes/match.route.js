import express from "express";
import multer from "multer";
import {
	analyzeDocument,
	getMatchResults,
} from "../controllers/fileMatch.controller.js";
import { authenticateUser } from "../controllers/auth.controller.js";

const matchRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

matchRoutes.post(
	"/analyze",
	authenticateUser,
	upload.single("file"),
	analyzeDocument,
);

matchRoutes.get("/results/:id", authenticateUser, getMatchResults);

export default matchRoutes;
