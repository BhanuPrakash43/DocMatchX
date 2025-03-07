import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dbConnect from "../db/db.js";

const JWT_SECRET = process.env.JWT_SECRET;

const tokenBlacklist = new Set();

const register = async (req, res) => {
	const { fullname, email, password, role } = req.body;

	const userRole = role === "admin" ? "user" : "user";

	if (!fullname || !email || !password) {
		return res.status(400).json({ message: "All fields are required." });
	}

	try {
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const query = `INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)`;

		dbConnect.run(
			query,
			[fullname, email.toLowerCase(), hashedPassword, userRole],
			function (err) {
				if (err) {
					if (err.message.includes("UNIQUE constraint failed")) {
						return res
							.status(400)
							.json({ message: "User already exists." });
					}
					return res
						.status(500)
						.json({ message: "Internal Server Error" });
				}

				const token = jwt.sign(
					{
						userId: this.lastID,
						email: email.toLowerCase(),
						role: userRole,
					},
					JWT_SECRET,
					{ expiresIn: "1h" },
				);

				return res.status(201).json({
					message: "User registered successfully!",
					userId: this.lastID,
					role: userRole,
					token,
				});
			},
		);
	} catch (error) {
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

const login = async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: "All fields are required." });
	}

	const query = `SELECT * FROM users WHERE email = ?`;

	dbConnect.get(query, [email.toLowerCase()], async (err, user) => {
		if (err) {
			return res.status(500).json({ message: "Internal Server Error" });
		}
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({ message: "Invalid credentials." });
		}

		const token = jwt.sign(
			{ userId: user.id, email: user.email, role: user.role },
			JWT_SECRET,
			{ expiresIn: "1h" },
		);

		return res.status(200).json({
			message: "Login successful!",
			userId: user.id,
			role: user.role,
			token,
		});
	});
};

const logout = (req, res) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(400).json({ message: "No token provided." });
	}

	tokenBlacklist.add(token);
	res.json({ message: "Logged out successfully!" });
};

const authenticateUser = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token || tokenBlacklist.has(token)) {
		return res
			.status(401)
			.json({ message: "Unauthorized. Please log in." });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(403).json({ message: "Invalid or expired token." });
	}
};

const authorizeAdmin = (req, res, next) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ message: "Access denied. Admins only." });
	}
	next();
};

export { register, login, authenticateUser, logout, authorizeAdmin };
