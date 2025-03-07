import dbConnect from "../db/db.js";

const uploadFile = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded." });
		}

		const { userId, role } = req.user;

		const fileBuffer = req.file.buffer;
		const filename = req.file.originalname;

		let query;
		let params;

		if (role === "admin") {
			query = `INSERT INTO admin_documents (admin_id, filename, file) VALUES (?, ?, ?)`;
			params = [userId, filename, fileBuffer];
		} else {
			query = `INSERT INTO user_documents (user_id, filename, file) VALUES (?, ?, ?)`;
			params = [userId, filename, fileBuffer];
		}

		dbConnect.run(query, params, function (err) {
			if (err) {
				console.error("Database Insert Error:", err.message);
				return res.status(500).json({
					message: "Error saving file to database.",
					error: err.message,
				});
			}

			if (role !== "admin") {
				dbConnect.run(
					`UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0`,
					[userId],
					function (creditErr) {
						if (creditErr) {
							console.error(
								"Credit Update Error:",
								creditErr.message,
							);
						}
					},
				);
			}

			return res.status(201).json({
				message: "File uploaded successfully!",
				fileId: this.lastID,
			});
		});
	} catch (error) {
		console.error("File Upload Error:", error);
		return res.status(500).json({
			message: "Internal server error during file upload.",
			error: error.message,
		});
	}
};

const getUserFiles = async (req, res) => {
	try {
		const { userId, role } = req.user;

		let query;

		if (role === "admin") {
			query = `
                SELECT 'admin' as source, id, filename, uploaded_at FROM admin_documents WHERE admin_id = ?
                UNION ALL
                SELECT 'user' as source, id, filename, uploaded_at FROM user_documents
                ORDER BY uploaded_at DESC
            `;
		} else {
			query = `
                SELECT id, filename, uploaded_at FROM user_documents 
                WHERE user_id = ? 
                ORDER BY uploaded_at DESC
            `;
		}

		dbConnect.all(query, [userId], (err, files) => {
			if (err) {
				return res.status(500).json({
					message: "Error retrieving files.",
					error: err.message,
				});
			}

			return res.status(200).json({
				message: "Files retrieved successfully!",
				files: files,
			});
		});
	} catch (error) {
		return res.status(500).json({
			message: "Internal server error.",
			error: error.message,
		});
	}
};

const downloadFile = async (req, res) => {
	try {
		const fileId = req.params.id;
		const { userId, role } = req.user;
		const source = req.query.source || "user";

		let query;
		let params;

		if (source === "admin" && role === "admin") {
			query = `SELECT filename, file FROM admin_documents WHERE id = ? AND admin_id = ?`;
			params = [fileId, userId];
		} else if (source === "admin" && role !== "admin") {
			return res.status(403).json({ message: "Access denied." });
		} else if (role === "admin") {
			query = `SELECT filename, file FROM user_documents WHERE id = ?`;
			params = [fileId];
		} else {
			query = `SELECT filename, file FROM user_documents WHERE id = ? AND user_id = ?`;
			params = [fileId, userId];
		}

		dbConnect.get(query, params, (err, file) => {
			if (err) {
				return res.status(500).json({
					message: "Error retrieving file.",
					error: err.message,
				});
			}

			if (!file) {
				return res.status(404).json({ message: "File not found." });
			}

			res.setHeader(
				"Content-Disposition",
				`attachment; filename="${file.filename}"`,
			);
			res.setHeader("Content-Type", "application/octet-stream");

			return res.send(Buffer.from(file.file));
		});
	} catch (error) {
		return res.status(500).json({
			message: "Internal server error.",
			error: error.message,
		});
	}
};

export { uploadFile, getUserFiles, downloadFile };
