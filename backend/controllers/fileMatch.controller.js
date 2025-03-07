import dbConnect from "../db/db.js";
import pkg from "natural";
import { stringSimilarity } from "string-similarity-js";

const { TfIdf } = pkg;

const analyzeDocument = async (req, res) => {
	try {
		if (!req.file) {
			return res
				.status(400)
				.json({ message: "No file uploaded for analysis." });
		}

		const { userId } = req.user;
		const fileBuffer = req.file.buffer;
		const filename = req.file.originalname;

		if (!filename.toLowerCase().endsWith(".txt")) {
			return res.status(400).json({
				message: "Only text (.txt) files are supported for analysis.",
			});
		}

		const uploadedText = fileBuffer.toString("utf-8");

		dbConnect.run(
			`INSERT INTO user_documents (user_id, filename, file) VALUES (?, ?, ?)`,
			[userId, filename, fileBuffer],
			function (err) {
				if (err) {
					console.error("Database Insert Error:", err.message);
					return res.status(500).json({
						message: "Error saving file to database.",
						error: err.message,
					});
				}

				const userFileId = this.lastID;

				dbConnect.all(
					`SELECT id, filename, file FROM admin_documents`,
					[],
					async (err, adminFiles) => {
						if (err) {
							return res.status(500).json({
								message:
									"Error retrieving admin documents for comparison.",
								error: err.message,
							});
						}

						if (adminFiles.length === 0) {
							return res.status(200).json({
								message:
									"Analysis complete, but no admin documents available for comparison.",
								matches: [],
							});
						}

						const matches = [];

						const tfidf = new TfIdf();

						tfidf.addDocument(uploadedText);

						for (const adminFile of adminFiles) {
							try {
								const adminText =
									adminFile.file.toString("utf-8");

								// Add to TF-IDF for analysis
								tfidf.addDocument(adminText);

								// Calculating direct string similarity (0-1 scale)
								const directSimilarity = stringSimilarity(
									uploadedText,
									adminText,
								);

								// Calculating TF-IDF similarity
								const tfidfSimilarity =
									calculateTfIdfSimilarity(
										tfidf,
										0,
										tfidf.documents.length - 1,
									);

								// Calculating overall similarity score (weighted average)
								const overallScore =
									directSimilarity * 0.6 +
									tfidfSimilarity * 0.4;

								// Storing match information
								matches.push({
									adminDocId: adminFile.id,
									adminFilename: adminFile.filename,
									similarityScore: Math.round(
										overallScore * 100,
									),
									directMatchScore: Math.round(
										directSimilarity * 100,
									),
								});
							} catch (error) {
								console.error(
									`Error processing admin file ${adminFile.id}:`,
									error,
								);
							}
						}

						matches.sort(
							(a, b) => b.similarityScore - a.similarityScore,
						);

						saveMatchResults(userFileId, matches);

						dbConnect.run(
							`UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0`,
							[userId],
						);

						return res.status(200).json({
							message: "Document analysis complete!",
							fileId: userFileId,
							matches: matches.slice(0, 5),
						});
					},
				);
			},
		);
	} catch (error) {
		console.error("Document Analysis Error:", error);
		return res.status(500).json({
			message: "Internal server error during document analysis.",
			error: error.message,
		});
	}
};

function calculateTfIdfSimilarity(tfidf, doc1Index, doc2Index) {
	const doc1Terms = Object.keys(tfidf.documents[doc1Index]);
	const doc2Terms = Object.keys(tfidf.documents[doc2Index]);
	const allTerms = new Set([...doc1Terms, ...doc2Terms]);

	const vector1 = [];
	const vector2 = [];

	allTerms.forEach((term) => {
		if (term !== "__key") {
			const tfidf1 = tfidf.tfidf(term, doc1Index);
			const tfidf2 = tfidf.tfidf(term, doc2Index);

			vector1.push(tfidf1);
			vector2.push(tfidf2);
		}
	});

	return cosineSimilarity(vector1, vector2);
}

function cosineSimilarity(vec1, vec2) {
	let dotProduct = 0;
	let mag1 = 0;
	let mag2 = 0;

	for (let i = 0; i < vec1.length; i++) {
		dotProduct += vec1[i] * vec2[i];
		mag1 += vec1[i] * vec1[i];
		mag2 += vec2[i] * vec2[i];
	}

	mag1 = Math.sqrt(mag1);
	mag2 = Math.sqrt(mag2);

	if (mag1 === 0 || mag2 === 0) return 0;

	return dotProduct / (mag1 * mag2);
}

function saveMatchResults(userFileId, matches) {
	const insertStmt = dbConnect.prepare(`
        INSERT INTO match_results (user_file_id, admin_file_id, similarity_score)
        VALUES (?, ?, ?)
    `);

	matches.forEach((match) => {
		insertStmt.run(userFileId, match.adminDocId, match.similarityScore);
	});

	insertStmt.finalize();
}

const getMatchResults = async (req, res) => {
	try {
		const fileId = req.params.id;
		const { userId, role } = req.user;

		if (role !== "admin") {
			dbConnect.get(
				`SELECT id FROM user_documents WHERE id = ? AND user_id = ?`,
				[fileId, userId],
				(err, file) => {
					if (err || !file) {
						return res.status(403).json({
							message: "Access denied or file not found.",
						});
					}

					fetchMatchResults(fileId, res);
				},
			);
		} else {
			fetchMatchResults(fileId, res);
		}
	} catch (error) {
		console.error("Error retrieving match results:", error);
		return res.status(500).json({
			message: "Internal server error.",
			error: error.message,
		});
	}
};

function fetchMatchResults(fileId, res) {
	dbConnect.all(
		`
        SELECT mr.id, mr.admin_file_id, mr.similarity_score, mr.analyzed_at, ad.filename as admin_filename
        FROM match_results mr
        JOIN admin_documents ad ON mr.admin_file_id = ad.id
        WHERE mr.user_file_id = ?
        ORDER BY mr.similarity_score DESC
    `,
		[fileId],
		(err, results) => {
			if (err) {
				return res.status(500).json({
					message: "Error retrieving match results.",
					error: err.message,
				});
			}

			return res.status(200).json({
				message: "Match results retrieved successfully!",
				results: results,
			});
		},
	);
}

export { analyzeDocument, getMatchResults };
