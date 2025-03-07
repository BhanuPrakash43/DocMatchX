import express from "express";
import {
	register,
	login,
	authenticateUser,
	logout,
	authorizeAdmin, 
} from "../controllers/auth.controller.js";

const authRoutes = express.Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", authenticateUser, logout); 

authRoutes.get(
	"/admin-dashboard",
	authenticateUser,
	authorizeAdmin,
	(req, res) => {
		res.json({ message: "Welcome to the Admin Dashboard!" });
	},
);

export default authRoutes;
