/* assets/js/profile.js
   Profile page auth (profile.html only)
   - REAL Firebase Auth (Google + Email/Password)
   - NO phone / OTP
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ---------- Firebase config ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBok3WdamaRJaVCzznMwB-lwHVWoHAM2i4",
  authDomain: "greenwrite-704d9.firebaseapp.com",
  projectId: "greenwrite-704d9",
  storageBucket: "greenwrite-704d9.firebasestorage.app",
  messagingSenderId: "815467329176",
  appId: "1:815467329176:web:d7d767409867d2c2eb82ed",
  measurementId: "G-2192KW3Y9J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

const root = document.getElementById("profileRoot");
const $ = (sel) => document.querySelector(sel);

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

/* ---------- UI: Logged OUT ---------- */
function renderLoggedOut() {
  if (!root) return;
  root.innerHTML = `
    <h3 style="margin-top:0">Login or Sign up</h3>
    <p class="small" style="color:var(--muted)">
      Use Google or email & password to create a simple profile.
      This is only for demo and order auto-fill.
    </p>

    <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
      <button id="btnGoogle" class="btn" type="button">Continue with Google</button>

      <div class="card" style="margin-top:6px;padding:10px;border-radius:10px">
        <label class="small" for="emailInput">Email</label>
        <input id="emailInput" type="email" placeholder="you@example.com"
               style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

        <label class="small" for="passwordInput" style="margin-top:6px">Password</label>
        <input id="passwordInput" type="password" placeholder="Minimum 6 characters"
               style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

        <label class="small" for="nameInput" style="margin-top:6px">Name (for signup)</label>
        <input id="nameInput" type="text" placeholder="Your name"
               style="width:100%;padding:8px;margin-top:4px;border-radius:8px;border:1px solid #dcdcdc" />

        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <button id="btnLoginEmail" class="btn secondary" type="button">Log In</button>
          <button id="btnSignupEmail" class="btn" type="button">Sign Up</button>
        </div>

        <div id="emailMsg" class="small" style="margin-top:6px;color:var(--muted)"></div>
      </div>
    </div>
  `;

  attachLoggedOutHandlers();
}

/* ---------- UI: Logged IN ---------- */
function renderLoggedIn(user) {
  if (!root) return;
  const name  = user.displayName || "GreenWrite user";
  const phone = user.phoneNumber || "Not set";
  const email = user.email || "Not set";

  root.innerHTML = `
    <h3 style="margin-top:0">Welcome, ${escapeHtml(name)}</h3>
    <p class="small" style="color:var(--muted)">
      You are logged in. We’ll use this info to auto-fill the order form
      on the website (in this browser only).
    </p>

    <div class="card" style="margin-top:10px;padding:10px;border-radius:10px">
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    </div>

    <p class="small" style="margin-top:8px">
      Tip: Go to the home page order form. Your name, email and phone can be auto-filled using this profile.
    </p>

    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
      <button id="btnFillOrder" class="btn secondary" type="button">Open Order Form</button>
      <button id="btnLogout" class="btn" type="button">Log out</button>
    </div>
  `;

  // store minimal profile in localStorage for index.html to read
  try {
    const mini = {
      name,
      email: user.email || "",
      phone: user.phoneNumber || ""
    };
    localStorage.setItem("greenwrite_profile", JSON.stringify(mini));
  } catch (e) {
    console.warn("Could not save profile locally", e);
  }

  const btnLogout   = $("#btnLogout");
  const btnFillForm = $("#btnFillOrder");

  btnLogout &&
    btnLogout.addEventListener("click", () => {
      signOut(auth).catch(console.error);
    });

  btnFillForm &&
    btnFillForm.addEventListener("click", () => {
      window.location.href = "index.html#order";
    });
}

/* ---------- Logged-out handlers (Google + Email/Password) ---------- */
function attachLoggedOutHandlers() {
  const btnGoogle      = $("#btnGoogle");
  const btnLoginEmail  = $("#btnLoginEmail");
  const btnSignupEmail = $("#btnSignupEmail");
  const emailInput     = $("#emailInput");
  const passInput      = $("#passwordInput");
  const nameInput      = $("#nameInput");
  const emailMsg       = $("#emailMsg");

  if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
      emailMsg.textContent = "";
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error(err);
        emailMsg.textContent = "Google login failed. Check console for details.";
      }
    });
  }

  // Email LOGIN
  if (btnLoginEmail && emailInput && passInput) {
    btnLoginEmail.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const pass  = passInput.value.trim();
      emailMsg.textContent = "";

      if (!email || !pass) {
        emailMsg.textContent = "Enter both email and password.";
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        emailMsg.textContent = "Logged in successfully!";
      } catch (err) {
        console.error(err);
        // Show friendly errors
        if (err.code === "auth/user-not-found") {
          emailMsg.textContent = "No account with this email. Try Sign Up instead.";
        } else if (err.code === "auth/wrong-password") {
          emailMsg.textContent = "Wrong password. Please try again.";
        } else {
          emailMsg.textContent = err.message || "Login failed.";
        }
      }
    });
  }

  // Email SIGNUP
  if (btnSignupEmail && emailInput && passInput) {
    btnSignupEmail.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const pass  = passInput.value.trim();
      const name  = (nameInput && nameInput.value.trim()) || "";

      emailMsg.textContent = "";

      if (!email || !pass) {
        emailMsg.textContent = "Enter email and a password (min 6 characters).";
        return;
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
        emailMsg.textContent = "Account created & logged in!";
      } catch (err) {
        console.error(err);
        if (err.code === "auth/email-already-in-use") {
          emailMsg.textContent = "Email already in use. Try Log In instead.";
        } else if (err.code === "auth/weak-password") {
          emailMsg.textContent = "Password too weak. Use at least 6 characters.";
        } else {
          emailMsg.textContent = err.message || "Sign up failed.";
        }
      }
    });
  }
}

/* ---------- Auth state listener ---------- */
if (root) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      renderLoggedIn(user);
    } else {
      renderLoggedOut();
    }
  });
} else {
  console.log("profileRoot not found — profile.js loaded on a different page.");
}
