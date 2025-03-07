import sqlite3 from "sqlite3";

const dbConnect = new sqlite3.Database(
	"./database.sqlite",
	sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
	(err) => {
		if (err) {
			console.error("Error connecting to SQLite:", err.message);
		} else {
			console.log("Connected to SQLite database.");

			dbConnect.run(
				`CREATE TABLE IF NOT EXISTS users (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					fullname TEXT UNIQUE NOT NULL,
					email TEXT UNIQUE NOT NULL,
					password TEXT NOT NULL,
					role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
					credits INTEGER DEFAULT 20
				)`,
				(err) => {
					if (err) {
						console.error(
							"Error creating users table:",
							err.message,
						);
					} else {
						console.log("Users table ready.");
					}
				},
			);

			dbConnect.run(
				`CREATE TABLE IF NOT EXISTS user_documents (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					user_id INTEGER NOT NULL,
					filename TEXT NOT NULL,
					file BLOB NOT NULL,
					uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
				)`,
				(err) => {
					if (err) {
						console.error(
							"Error creating user_documents table:",
							err.message,
						);
					} else {
						console.log("User Documents table ready.");
					}
				},
			);

			dbConnect.run(
				`CREATE TABLE IF NOT EXISTS admin_documents (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					admin_id INTEGER NOT NULL,
					filename TEXT NOT NULL,
					file BLOB NOT NULL,
					uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
				)`,
				(err) => {
					if (err) {
						console.error(
							"Error creating admin_documents table:",
							err.message,
						);
					} else {
						console.log("Admin Documents table ready.");
					}
				},
			);

			dbConnect.run(
				`
				CREATE TABLE IF NOT EXISTS match_results (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					user_file_id INTEGER NOT NULL,
					admin_file_id INTEGER NOT NULL,
					similarity_score INTEGER NOT NULL,
					analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (user_file_id) REFERENCES user_documents(id) ON DELETE CASCADE,
					FOREIGN KEY (admin_file_id) REFERENCES admin_documents(id) ON DELETE CASCADE
				)`,
				(err) => {
					if (err) {
						console.error(
							"Error creating match_result table:",
							err.message,
						);
					} else {
						console.log("Match results table ready.");
					}
				},
			);
		}
	},
);

export default dbConnect;
