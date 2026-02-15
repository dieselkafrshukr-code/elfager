import './style.css'
import { gsap } from 'gsap'
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// --- THEME LOGIC ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
body.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  // Animate transition
  gsap.fromTo('body', { opacity: 0.8 }, { opacity: 1, duration: 0.5 });
});

// --- SIDEBAR LOGIC ---
const cartBtn = document.getElementById('cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');

const loginBtn = document.getElementById('login-btn');
const profileSidebar = document.getElementById('profile-sidebar');
const closeProfile = document.getElementById('close-profile');

const toggleSidebar = (sidebar, active) => {
  if (active) {
    sidebar.classList.add('active');
  } else {
    sidebar.classList.remove('active');
  }
};

cartBtn.addEventListener('click', () => toggleSidebar(cartSidebar, true));
closeCart.addEventListener('click', () => toggleSidebar(cartSidebar, false));

loginBtn.addEventListener('click', () => toggleSidebar(profileSidebar, true));
closeProfile.addEventListener('click', () => toggleSidebar(profileSidebar, false));

// --- FIREBASE AUTH ---
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (Only if config is provided, otherwise show placeholder)
let auth;
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

const googleProvider = new GoogleAuthProvider();
const googleSignInBtn = document.getElementById('google-signin');
const authContent = document.getElementById('auth-content');
const userInfo = document.getElementById('user-info');
const userNameDisplay = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

googleSignInBtn.addEventListener('click', async () => {
  if (!auth) {
    alert("Please configure your Firebase project in src/main.js to enable Google Login.");
    return;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Logged in:", result.user);
  } catch (error) {
    console.error("Login failed:", error);
  }
});

logoutBtn.addEventListener('click', () => {
  if (auth) signOut(auth);
});

if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      authContent.style.display = 'none';
      userInfo.style.display = 'block';
      userNameDisplay.innerText = `Welcome, ${user.displayName}`;
      loginBtn.innerHTML = `<img src="${user.photoURL}" style="width: 30px; border-radius: 50%;">`;
    } else {
      authContent.style.display = 'block';
      userInfo.style.display = 'none';
      loginBtn.innerHTML = `<i data-lucide="user"></i>`;
      lucide.createIcons();
    }
  });
}

// --- CART LOGIC (MOCK) ---
let cart = [];
const cartCount = document.querySelector('.cart-count');

const updateCartUI = () => {
  cartCount.innerText = cart.length;
  // Further cart UI updates could go here
};

// Initial animations
gsap.from('.logo', { y: -20, opacity: 0, duration: 1, delay: 0.5 });
gsap.from('.nav-actions > *', { y: -20, opacity: 0, duration: 1, stagger: 0.1, delay: 0.7 });
