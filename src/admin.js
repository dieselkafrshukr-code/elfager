import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyDKHMmR-Jl9JbqEZtS58XgM42pFftepNb4",
    authDomain: "m989-5f329.firebaseapp.com",
    projectId: "m989-5f329",
    storageBucket: "m989-5f329.firebasestorage.app",
    messagingSenderId: "617175385217",
    appId: "1:617175385217:web:2ace1f8e6db4287376f980",
    measurementId: "G-D8PYFFX4RN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const loginBtn = document.getElementById('admin-login-btn');
const logoutBtn = document.getElementById('admin-logout');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const view = item.innerText.trim().toLowerCase();
        renderView(view);
    });
});

function renderView(view) {
    if (view === 'overview') {
        window.location.reload();
    } else if (view === 'shipping') {
        renderShippingView();
    } else if (view === 'products') {
        renderProductsView();
    } else if (view === 'management') {
        renderManagementView();
    } else {
        mainContent.innerHTML = `<h1>${view}</h1><p>Coming soon...</p>`;
    }
}

async function renderManagementView() {
    mainContent.innerHTML = `
        <div class="header">
            <h1>Staff Management</h1>
            <button id="add-admin-btn" class="btn" style="width: auto;">+ ADD STAFF</button>
        </div>
        <div id="admin-form-container" style="display: none; background: var(--card-bg); padding: 2rem; border-radius: 20px; margin-bottom: 2rem;">
            <h3>Create New Staff Account</h3>
            <input type="email" id="a-email" placeholder="Email">
            <input type="password" id="a-pass" placeholder="Password">
            <select id="a-role" style="width: 100%; padding: 1rem; background: var(--bg-color); color: #fff; border: 1px solid var(--border-color); border-radius: 10px; margin: 10px 0;">
                <option value="admin">Full Admin</option>
                <option value="employee">Employee (No Staff Mgmt)</option>
            </select>
            <button id="save-admin-btn" class="btn">CREATE ACCOUNT</button>
            <p style="font-size: 0.8rem; opacity: 0.5; margin-top: 10px;">Note: Firebase security rules will enforce role-based access.</p>
        </div>
        <div id="admins-list" style="display: grid; gap: 10px;">
            Loading staff...
        </div>
    `;

    document.getElementById('add-admin-btn').addEventListener('click', () => {
        document.getElementById('admin-form-container').style.display = 'block';
    });

    onSnapshot(collection(db, "admins"), (snap) => {
        const list = document.getElementById('admins-list');
        list.innerHTML = snap.docs.map(doc => `
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 10px; display: flex; justify-content: space-between;">
                <div>
                    <strong>${doc.data().email}</strong>
                    <span style="opacity: 0.5; margin-left: 10px;">[ ${doc.data().role} ]</span>
                </div>
            </div>
        `).join('') || '<p style="opacity:0.5">No staff found.</p>';
    });

    document.getElementById('save-admin-btn').addEventListener('click', async () => {
        const email = document.getElementById('a-email').value;
        const pass = document.getElementById('a-pass').value;
        const role = document.getElementById('a-role').value;
        if (!email || !pass) return alert("Fill all fields");

        // Ideally, this uses a Cloud Function or Admin SDK to create the user in Auth.
        // For this demo, we save it to Firestore, but you must manually create the user in Firebase Auth.
        await setDoc(doc(db, "admins", email), { email, role, created_at: new Date() });
        alert("Staff record created in database. Please also create this user in Firebase Auth Console.");
        document.getElementById('admin-form-container').style.display = 'none';
    });
}

async function renderProductsView() {
    mainContent.innerHTML = `
        <div class="header">
            <h1>Products</h1>
            <button id="add-product-btn" class="btn" style="width: auto;">+ NEW PRODUCT</button>
        </div>
        <div id="product-form-container" style="display: none; background: var(--card-bg); padding: 2rem; border-radius: 20px; margin-bottom: 2rem;">
            <h3>Add New Product</h3>
            <input type="text" id="p-name" placeholder="Product Name">
            <input type="number" id="p-price" placeholder="Price (EGP)">
            <select id="p-category" style="width: 100%; padding: 1rem; background: var(--bg-color); color: #fff; border: 1px solid var(--border-color); border-radius: 10px; margin: 10px 0;">
                <option value="essential">Essential</option>
                <option value="winter">Winter</option>
                <option value="summer">Summer</option>
            </select>
            <div id="color-size-container">
                <p style="margin: 1rem 0 0.5rem; opacity: 0.5;">Colors & Sizes</p>
                <!-- Dynamic rows -->
            </div>
            <button id="add-color-row" class="btn" style="width: auto; background: var(--bg-color); color: #fff; margin-bottom: 1rem;">+ Add Color</button>
            <input type="file" id="p-images" multiple style="margin-top: 1rem;">
            <button id="save-product-btn" class="btn">UPLOAD PRODUCT</button>
        </div>
        <div id="products-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
            Loading products...
        </div>
    `;

    const formBtn = document.getElementById('add-product-btn');
    const formContainer = document.getElementById('product-form-container');
    const colorContainer = document.getElementById('color-size-container');
    const addColorBtn = document.getElementById('add-color-row');

    formBtn.addEventListener('click', () => formContainer.style.display = 'block');

    addColorBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="text" placeholder="Color" class="c-val" style="flex: 1;">
            <input type="text" placeholder="Sizes (S,M,L)" class="s-val" style="flex: 2;">
        `;
        colorContainer.appendChild(div);
    });

    // List rendering
    onSnapshot(collection(db, "products"), (snap) => {
        const list = document.getElementById('products-list');
        list.innerHTML = snap.docs.map(doc => `
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 15px; border: 1px solid var(--border-color);">
                <div style="height: 150px; background: #000; border-radius: 10px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center;">IMG</div>
                <h4 style="margin:0">${doc.data().name}</h4>
                <p style="opacity: 0.5;">${doc.data().price} EGP</p>
            </div>
        `).join('') || '<p style="opacity:0.5">No products found.</p>';
    });

    document.getElementById('save-product-btn').addEventListener('click', async () => {
        const name = document.getElementById('p-name').value;
        const price = document.getElementById('p-price').value;
        const category = document.getElementById('p-category').value;
        const colorRows = document.querySelectorAll('#color-size-container div');
        const variants = Array.from(colorRows).map(row => ({
            color: row.querySelector('.c-val').value,
            sizes: row.querySelector('.s-val').value.split(',').map(s => s.trim())
        }));

        if (!name || !price) return alert("Fill all fields");

        await addDoc(collection(db, "products"), {
            name, price, category, variants, created_at: new Date()
        });
        alert("Product added!");
        formContainer.style.display = 'none';
    });
}

async function renderShippingView() {
    mainContent.innerHTML = `
        <div class="header">
            <h1>Shipping Rates</h1>
            <button id="save-shipping" class="btn" style="width: auto;">SAVE CHANGES</button>
        </div>
        <div id="shipping-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            Loading...
        </div>
    `;

    const provinces = ["Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", "Sharqia", "Gharbia", "Monufia", "Beheira", "Kafr El Sheikh", "Damietta", "Port Said", "Ismailia", "Suez", "North Sinai", "South Sinai", "Beni Suef", "Fayoum", "Minya", "Assiut", "Sohag", "Qena", "Luxor", "Aswan", "Red Sea", "New Valley", "Matrouh"];

    const shippingRef = doc(db, "settings", "shipping_rates");
    const snap = await getDoc(shippingRef);
    const rates = snap.exists() ? snap.data() : {};

    const listHtml = provinces.map(p => `
        <div style="background: var(--card-bg); padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <label>${p}</label>
            <input type="number" class="shipping-input" data-province="${p}" value="${rates[p] || 0}" style="width: 100px; margin: 0;">
        </div>
    `).join('');

    document.getElementById('shipping-list').innerHTML = listHtml;

    document.getElementById('save-shipping').addEventListener('click', async () => {
        const newRates = {};
        document.querySelectorAll('.shipping-input').forEach(input => {
            newRates[input.dataset.province] = input.value;
        });
        await setDoc(shippingRef, newRates);
        alert("Rates saved!");
    });
}

// Login Logic
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Invalid credentials or access denied.");
        console.error(error);
    }
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.reload());
});

// Auth State Monitor
onAuthStateChanged(auth, async (user) => {
    console.log("Auth State Changed. User:", user ? user.email : "No User");

    if (user) {
        try {
            // Let's first try to see if we can just get the doc
            const adminRef = doc(db, "admins", user.email);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {
                console.log("Admin verified:", adminSnap.data());
                loginOverlay.style.display = 'none';
                sidebar.style.display = 'flex';
                mainContent.style.display = 'block';
                document.getElementById('current-user-tag').innerText = `${adminSnap.data().role || 'staff'}: ${user.email}`;
                loadStatistics();
            } else {
                console.error("User exists in Auth but not in Firestore 'admins' collection");
                alert("تم تسجيل الدخول بنجاح، ولكن هذا الإيميل غير موجود في قائمة المحررين (Firestore Admins). رقم الإيميل: " + user.email);
                await signOut(auth);
            }
        } catch (error) {
            console.error("Firestore read error:", error);
            alert("خطأ في قراءة البيانات: " + error.message + "\nتأكد من إعداد القواعد (Rules) في Firebase بشكل صحيح.");
            await signOut(auth);
        }
    } else {
        loginOverlay.style.display = 'flex';
        sidebar.style.display = 'none';
        mainContent.style.display = 'none';
    }
});

// Load real-time stats (placeholder queries for now)
function loadStatistics() {
    // 1. Products Count
    onSnapshot(collection(db, "products"), (snap) => {
        document.getElementById('stat-products').innerText = snap.size;
    });

    // 2. Orders Count
    onSnapshot(collection(db, "orders"), (snap) => {
        document.getElementById('stat-orders').innerText = snap.size;
    });

    // 3. Visitor Tracking (Simplified for now)
    onSnapshot(collection(db, "stats"), (snap) => {
        snap.forEach(doc => {
            const data = doc.data();
            if (doc.id === 'counters') {
                document.getElementById('stat-visitors').innerText = data.total_visitors || 0;
                document.getElementById('stat-google').innerText = data.google_users || 0;
                document.getElementById('stat-fb').innerText = data.fb_users || 0;
                document.getElementById('stat-guests').innerText = data.guests || 0;
            }
        });
    });
}
