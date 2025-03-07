fetch("navbar.html")
	.then((response) => response.text())
	.then((data) => {
		document.getElementById("navbar-container").innerHTML = data;
	})
	.catch((error) => console.error("Error loading navbar:", error));

let globalFileInput;
let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
	const token = localStorage.getItem("token");
	if (!token) {
		window.location.href = "index.html?redirect=match_analysis.html";
		return;
	}

	loadUserCredits();

	const dropArea = document.getElementById("dropArea");
	const analyzeBtn = document.getElementById("analyzeBtn");

	createFileInput();

	dropArea.addEventListener("dragover", (e) => {
		e.preventDefault();
		dropArea.style.borderColor = "#1abc9c";
	});

	dropArea.addEventListener("dragleave", () => {
		dropArea.style.borderColor = "#ffffff55";
	});

	dropArea.addEventListener("drop", (e) => {
		e.preventDefault();
		dropArea.style.borderColor = "#ffffff55";
		const file = e.dataTransfer.files[0];
		if (isValidTextFile(file)) {
			handleFile(file);
		} else {
			alert("Please upload a text (.txt) file only.");
		}
	});

	analyzeBtn.addEventListener("click", () => {
		if (selectedFile) {
			analyzeDocument(selectedFile);
		}
	});
});

function createFileInput() {
	let fileInput = document.getElementById("fileInput");
	if (fileInput) fileInput.remove();

	fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.id = "fileInput";
	fileInput.accept = ".txt";
	fileInput.hidden = true;
	fileInput.addEventListener("change", (e) => {
		const file = e.target.files[0];
		if (isValidTextFile(file)) {
			handleFile(file);
		} else {
			alert("Please upload a text (.txt) file only.");
		}
	});

	globalFileInput = fileInput;
	document.getElementById("dropArea").appendChild(fileInput);
}

function isValidTextFile(file) {
	if (!file) return false;

	const validExtensions = [".txt"];
	const fileName = file.name.toLowerCase();
	const hasValidExtension = validExtensions.some((ext) =>
		fileName.endsWith(ext),
	);

	return hasValidExtension;
}

function handleFile(file) {
	if (!file) return;

	selectedFile = file;
	displayFile(file);

	document.getElementById("analyzeBtn").disabled = false;
}

function displayFile(file) {
	const dropArea = document.getElementById("dropArea");

	dropArea.innerHTML = `
        <div class="file-preview">
            <p><strong>File Name:</strong> ${file.name}</p>
            <p><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
            <p><strong>Type:</strong> ${file.type || "text/plain"}</p>
            <button class="remove-btn" onclick="removeFile()">Remove</button>
        </div>
    `;

	dropArea.style.border = "2px solid #1abc9c";
}

window.removeFile = function () {
	const dropArea = document.getElementById("dropArea");
	dropArea.innerHTML = `<p>Drag & Drop a text file (.txt) here or <label for="fileInput" class="browse-btn">Browse</label></p>`;

	createFileInput();
	selectedFile = null;
	document.getElementById("analyzeBtn").disabled = true;
	document.getElementById("resultsContainer").style.display = "none";
	dropArea.style.border = "2px dashed #ffffff55";
};

async function loadUserCredits() {
	const token = localStorage.getItem("token");

	try {
		const response = await fetch(
			"http://localhost:3000/api/v1/auth/profile",
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);

		if (response.ok) {
			const data = await response.json();
			document.getElementById("userCredits").textContent =
				data.user.credits || 0;
		}
	} catch (error) {
		console.error("Error loading user credits:", error);
	}
}

async function analyzeDocument(file) {
	const token = localStorage.getItem("token");

	if (!token) {
		alert("You must be logged in to analyze documents.");
		window.location.href = "login.html";
		return;
	}

	document.getElementById("loading").style.display = "block";
	document.getElementById("analyzeBtn").disabled = true;
	document.getElementById("resultsContainer").style.display = "none";

	const formData = new FormData();
	formData.append("file", file);

	try {
		const response = await fetch(
			"http://localhost:3000/api/v1/match/analyze",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			},
		);

		document.getElementById("loading").style.display = "none";

		if (response.status === 401) {
			alert("Your session has expired. Please log in again.");
			localStorage.removeItem("token");
			window.location.href = "login.html";
			return;
		}

		if (!response.ok) {
			const errorData = await response.json();
			alert(`Analysis failed: ${errorData.message}`);
			document.getElementById("analyzeBtn").disabled = false;
			return;
		}

		const data = await response.json();

		loadUserCredits();

		displayResults(data);
	} catch (error) {
		console.error("Analysis error:", error);
		alert("Error analyzing document. Please try again.");
		document.getElementById("loading").style.display = "none";
		document.getElementById("analyzeBtn").disabled = false;
	}
}

function displayResults(data) {
	const resultsContainer = document.getElementById("resultsContainer");
	const matchResults = document.getElementById("matchResults");

	matchResults.innerHTML = "";

	if (!data.matches || data.matches.length === 0) {
		matchResults.innerHTML = `<p>No matching documents found in the database.</p>`;
	} else {
		data.matches.forEach((match) => {
			const scoreClass =
				match.similarityScore >= 80
					? "high-match"
					: match.similarityScore >= 50
					? "medium-match"
					: "low-match";

			const matchCard = document.createElement("div");
			matchCard.className = "match-card";
			matchCard.innerHTML = `
                <div class="match-details">
                    <h3>${match.adminFilename}</h3>
                    <p>Direct Text Match: ${match.directMatchScore}%</p>
                </div>
                <div class="match-score ${scoreClass}">${match.similarityScore}%</div>
            `;

			matchResults.appendChild(matchCard);
		});
	}

	resultsContainer.style.display = "block";

	document.getElementById("analyzeBtn").disabled = false;
}
