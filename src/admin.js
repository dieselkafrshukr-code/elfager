import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginView = document.getElementById('login-view');
const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginView.style.display = 'none';
        adminContent.style.display = 'block';
        loadProducts();
    } else {
        loginView.style.display = 'block';
        adminContent.style.display = 'none';
    }
});

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("خطأ في تسجيل الدخول: " + error.message);
    }
});

// Logout Handler
logoutBtn.onclick = () => signOut(auth);

// Add Product
const form = document.getElementById('add-product-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productData = {
        name: document.getElementById('p-name').value,
        image: document.getElementById('p-image').value,
        sizes: document.getElementById('p-sizes').value,
        priceNow: parseFloat(document.getElementById('p-price-now').value),
        priceBefore: document.getElementById('p-price-before').value ? parseFloat(document.getElementById('p-price-before').value) : null,
        createdAt: new Date()
    };
    try {
        await addDoc(collection(db, "products"), productData);
        alert("تم إضافة المنتج بنجاح!");
        form.reset();
    } catch (error) {
        alert("حدث خطأ أثناء إضافة المنتج.");
    }
});

// Load Products
function loadProducts() {
    const productsContainer = document.getElementById('products-container');
    onSnapshot(collection(db, "products"), (snapshot) => {
        productsContainer.innerHTML = "";
        snapshot.forEach((docSnapshot) => {
            const p = docSnapshot.data();
            const div = document.createElement('div');
            div.className = "product-item";
            div.innerHTML = `
        <span>${p.name} - ${p.priceNow} EGP</span>
        <button class="delete-btn" data-id="${docSnapshot.id}">حذف</button>
      `;
            productsContainer.appendChild(div);
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
                    await deleteDoc(doc(db, "products", btn.dataset.id));
                }
            };
        });
    });
}
