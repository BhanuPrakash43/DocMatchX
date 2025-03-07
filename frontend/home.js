fetch("navbar.html")
	.then((response) => response.text())
	.then((data) => {
		document.getElementById("navbar-container").innerHTML = data;
	})
	.catch((error) => console.error("Error loading navbar:", error));

let globalFileInput;

window.uploadFile = async function () {
	const token = localStorage.getItem("token");
	if (!token) {
		alert("You must be logged in to upload files!");
		window.location.href = "index.html";
		return;
	}

	if (!globalFileInput || globalFileInput.files.length === 0) {
		alert("Please select a file first.");
		return;
	}

	const file = globalFileInput.files[0];
	const formData = new FormData();
	formData.append("file", file);

	try {
		const response = await fetch(
			"http://localhost:3000/api/v1/files/upload",
			{
				method: "POST",
				body: formData,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);

		if (response.status === 401) {
			alert("Your session has expired. Please log in again.");
			localStorage.removeItem("token");
			window.location.href = "login.html";
			return;
		}

		const data = await response.json();
		alert(data.message);
	} catch (error) {
		console.error("Upload Error:", error);
		alert("Error uploading file.");
	}
};

document.addEventListener("DOMContentLoaded", () => {
	const token = localStorage.getItem("token");
	if (!token) {
		const container = document.querySelector(".container");
		if (container) {
			const notice = document.createElement("div");
			notice.className = "login-notice";
			notice.innerHTML =
				'<p>Please <a href="login.html">login</a> to upload files</p>';
			container.prepend(notice);
		}
	}

	const dropArea = document.getElementById("dropArea");

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
		handleFile(file);
	});

	function createFileInput() {
		let fileInput = document.getElementById("fileInput");
		if (fileInput) fileInput.remove();

		fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.id = "fileInput";
		fileInput.hidden = true;
		fileInput.addEventListener("change", (e) => {
			handleFile(e.target.files[0]);
		});

		globalFileInput = fileInput;

		dropArea.appendChild(fileInput);
	}

	function handleFile(file) {
		if (!file) return;

		displayFile(file);

		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		globalFileInput.files = dataTransfer.files;
	}

	function displayFile(file) {
		dropArea.innerHTML = `
            <div class="file-preview">
                <p><strong>File Name:</strong> ${file.name}</p>
                <p><strong>Size:</strong> ${(file.size / 1024).toFixed(
					2,
				)} KB</p>
                <p><strong>Type:</strong> ${file.type || "Unknown"}</p>
                <button class="remove-btn" onclick="removeFile()">Remove</button>
            </div>
        `;
		dropArea.style.border = "2px solid #1abc9c";
	}

	window.removeFile = function () {
		dropArea.innerHTML = `<p>Drag & Drop files here or <label for="fileInput" class="browse-btn">Browse</label></p>`;
		createFileInput();
		dropArea.style.border = "2px dashed #ffffff55";
	};
});

async function logout() {
	const token = localStorage.getItem("token");

	if (!token) {
		alert("You are already logged out!");
		return;
	}

	try {
		const response = await fetch(
			"http://localhost:3000/api/v1/auth/logout",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			},
		);

		const data = await response.json();
		alert(data.message);
		localStorage.removeItem("token");
		window.location.href = "index.html";
	} catch (error) {
		console.error("Logout Error:", error);
		alert("Error logging out. Please try again.");
	}
}

function toggleMenu() {
	const navLinks = document.querySelector(".nav-links");
	navLinks.classList.toggle("show");
}
