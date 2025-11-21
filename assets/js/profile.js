/* assets/js/profile.js
   Firebase-powered Profile Page (Google + Phone OTP)
   - Safe: ONLY touches #profileRoot
   - If #profileRoot is missing (e.g. on index.html), this file does nothing
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ----------------- Firebase config (your project) ----------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBok3WdamaRJaVCzznMwB-lwHVWoHAM2i4",
  authDomain: "greenwrite-704d9.firebaseapp.com",
  projectId: "greenwrite-704d9",
  storageBucket: "greenwrite-704d9.firebasestorage.app",
  messagingSenderId: "815467329176",
  appId: "1:815467329176:web:d7d767409867d2c2eb82ed",
  measurementId: "G-2192KW3Y9J",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

const provider = new GoogleAuthProvider();
let recaptchaVerifier = null;

/* ----------------- Helpers ----------------- */

function $(sel) {
  return document.querySelector(sel);
}

function createLayout(root) {
  root.innerHTML = `
    <section class="card fade-in" style="max-width:640px;margin:18px auto;">
      <h2 style="margin-top:0">Profile & Login</h2>
      <p class="small" style="margin-bottom:10px">
        Sign in to save your details for future orders. This is just for the school project demo.
      </p>

      <!-- Logged-out view -->
      <div id="authLoggedOut">
        <h3 style="margin:8px 0;">Sign in</h3>
        <button id="googleLogin" class="btn" type="button" style="width:100%;margin-bottom:10px;">
          Continue with Google
        </button>

        <div style="margin:10px 0;text-align:center;color:var(--muted);font-size:0.85rem;">
          — or sign in with phone —
        </div>

        <label class="small" for="phoneInput">Phone (with country code)</label>
        <input id="phoneInput" type="tel" placeholder="+91 98765 43210" style="width:100%;padding:8px;border-radius:8px;border:1px solid #dcdcdc;margin-bottom:6px;">

        <div id="recaptcha-container" style="margin:6px 0;"></div>

        <button id="phoneSendOtp" class="btn secondary" type="button" style="width:100%;margin-top:4px;">
          Send OTP
        </button>

        <div id="otpBox" style="display:none;margin-top:10px;">
          <label class="small" for="otpInput">Enter OTP</label>
          <input id="otpInput" type="text" placeholder="6 digit code" style="width:100%;padding:8px;border-radius:8px;border:1px solid #dcdcdc;margin-bottom:6px;">
          <button id="otpVerify" class="btn" type="button" style="width:100%;">Verify & Login</button>
        </div>

        <p id="authError" class="small" style="margin-top:8px;color:#b00020;display:none;"></p>
      </div>

      <!-- Logged-in view -->
      <div id="authLoggedIn" style="display:none;">
        <div style="display:flex;align-items:center;gap:12px;margin:10px 0;">
          <div id="userAvatar" style="width:56px;height:56px;border-radius:50%;background:#e4f4e5;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.2rem;">
            U
          </div>
          <div>
            <div id="userName" style="font-weight:700;">User</div>
            <div id="userEmail" class="small"></div>
            <div id="userPhone" class="small"></div>
          </div>
        </div>

        <p class="small" style="margin:8px 0;color:var(--muted);">
          You are signed in. We can pre-fill your name and phone in the order form on the main website.
        </p>

        <button id="signOutBtn" class="btn secondary" type="button" style="width:100%;margin-top:6px;">
          Sign out
        </button>
      </div>
    </section>
  `;
}

function showError(msg) {
  const el = $("#authError");
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}

function updateLoggedInUI(user) {
  const outBox = $("#authLoggedOut");
  const inBox = $("#authLoggedIn");
  if (!outBox || !inBox) return;

  if (!user) {
    // logged out
    outBox.style.display = "block";
    inBox.style.display = "none";
    showError("");
    return;
  }

  outBox.style.display = "none";
  inBox.style.display = "block";

  const nameEl = $("#userName");
  const emailEl = $("#userEmail");
  const phoneEl = $("#userPhone");
  const avatarEl = $("#userAvatar");

  const displayName = user.displayName || "GreenWrite user";
  const email = user.email || "";
  const phone = user.phoneNumber || "";

  if (nameEl) nameEl.textContent = displayName;
  if (emailEl) emailEl.textContent = email;
  if (phoneEl) phoneEl.textContent = phone ? `Phone: ${phone}` : "";

  if (avatarEl) {
    if (user.photoURL) {
      avatarEl.style.backgroundImage = `url(${user.photoURL})`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    } else {
      avatarEl.style.backgroundImage = "none";
      avatarEl.textContent = displayName.charAt(0).toUpperCase();
    }
  }
}

/* ----------------- Recaptcha + Phone Auth ----------------- */

function ensureRecaptcha() {
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "normal",
      callback: () => {
        // verified
      },
    }
  );
  return recaptchaVerifier;
}

async function handlePhoneSendOtp() {
  showError("");
  const phoneInput = $("#phoneInput");
  if (!phoneInput) return;
  const phone = phoneInput.value.trim();
  if (!phone) {
    showError("Please enter a phone number with country code.");
    return;
  }

  try {
    const verifier = ensureRecaptcha();
    const result = await signInWithPhoneNumber(auth, phone, verifier);
    window._gw_otp_confirmation = result;
    const otpBox = $("#otpBox");
    if (otpBox) otpBox.style.display = "block";
  } catch (err) {
    console.error(err);
    if (err.code === "auth/billing-not-enabled") {
      showError("Phone auth is not fully enabled in Firebase project (billing issue). Ask your teacher to enable it.");
    } else {
      showError(err.message || "Failed to send OTP.");
    }
  }
}

async function handleOtpVerify() {
  const otpInput = $("#otpInput");
  if (!otpInput) return;
  const code = otpInput.value.trim();
  if (!code) {
    showError("Enter the OTP code.");
    return;
  }
  const confirmation = window._gw_otp_confirmation;
  if (!confirmation) {
    showError("Please request an OTP first.");
    return;
  }
  try {
    const result = await confirmation.confirm(code);
    updateLoggedInUI(result.user);
    showError("");
  } catch (err) {
    console.error(err);
    showError("Invalid or expired OTP.");
  }
}

/* ----------------- Google Auth ----------------- */

async function handleGoogleLogin() {
  showError("");
  try {
    const result = await signInWithPopup(auth, provider);
    updateLoggedInUI(result.user);
  } catch (err) {
    console.error(err);
    if (err.code === "auth/popup-blocked") {
      showError("Popup blocked. Please allow popups and try again.");
    } else {
      showError(err.message || "Google login failed.");
    }
  }
}

/* ----------------- Sign out ----------------- */

async function handleSignOut() {
  try {
    await signOut(auth);
    updateLoggedInUI(null);
  } catch (err) {
    console.error(err);
    showError("Error signing out.");
  }
}

/* ----------------- Init on profile page only ----------------- */

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("profileRoot");
  // If there's no profileRoot, do nothing (so other pages are safe)
  if (!root) return;

  createLayout(root);

  const gBtn = $("#googleLogin");
  const phoneBtn = $("#phoneSendOtp");
  const otpBtn = $("#otpVerify");
  const signOutBtn = $("#signOutBtn");

  gBtn && gBtn.addEventListener("click", handleGoogleLogin);
  phoneBtn && phoneBtn.addEventListener("click", handlePhoneSendOtp);
  otpBtn && otpBtn.addEventListener("click", handleOtpVerify);
  signOutBtn && signOutBtn.addEventListener("click", handleSignOut);

  // Restore session if any
  onAuthStateChanged(auth, (user) => {
    updateLoggedInUI(user || null);
  });
});
