// const container = document.getElementById("container");
// const signUpButton = document.getElementById("toggleSignUp");
// const signInButton = document.getElementById("toggleSignIn");

// // Toggle between Sign Up and Sign In forms
// signUpButton.addEventListener("click", () => {
// 	container.classList.add("active");
// });

// signInButton.addEventListener("click", () => {
// 	container.classList.remove("active");
// });

const container = document.getElementById("container");
const signUpButton = document.getElementById("toggleSignUp");
const signInButton = document.getElementById("toggleSignIn");
const mobileSwitchToSignUp = document.getElementById("switchToSignUp");
const mobileSwitchToSignIn = document.getElementById("switchToSignIn");

function checkScreenSize() {
	if (window.innerWidth <= 768) {
		container.classList.remove("active");
	}
}

signUpButton.addEventListener("click", () => {
	container.classList.add("active");
});

signInButton.addEventListener("click", () => {
	container.classList.remove("active");
});

mobileSwitchToSignUp.addEventListener("click", () => {
	container.classList.add("active");
});

mobileSwitchToSignIn.addEventListener("click", () => {
	container.classList.remove("active");
});

checkScreenSize();
window.addEventListener("resize", checkScreenSize);

document
	.getElementById("signUpForm")
	.addEventListener("submit", async (event) => {
		event.preventDefault();

		const fullname = document.getElementById("regFullname").value.trim();
		const email = document.getElementById("regEmail").value.trim();
		const password = document.getElementById("regPassword").value.trim();

		if (!fullname || !email || !password) {
			alert("Please fill all fields.");
			return;
		}

		try {
			const response = await fetch(
				"http://localhost:3000/api/v1/auth/register",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ fullname, email, password }),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Sign-up failed!");
			}

			alert(data.message);
			container.classList.remove("active");
		} catch (error) {
			console.error("Sign-up Error:", error);
			alert(error.message);
		}
	});

document
	.getElementById("signInForm")
	.addEventListener("submit", async (event) => {
		event.preventDefault();

		const email = document.getElementById("loginEmail").value.trim();
		const password = document.getElementById("loginPassword").value.trim();

		if (!email || !password) {
			alert("Please enter both email and password.");
			return;
		}

		try {
			const response = await fetch(
				"http://localhost:3000/api/v1/auth/login",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Login failed!");
			}

			alert(data.message);
			localStorage.setItem("token", data.token);
			window.location.href = "home.html";
		} catch (error) {
			console.error("Login Error:", error);
			alert(error.message);
		}
	});

window.onload = () => {
	const token = localStorage.getItem("token");
	const loginPage = "index.html";

	if (!token && !window.location.pathname.includes(loginPage)) {
		alert("Access denied. Please log in.");
		window.location.href = loginPage;
	}
};
