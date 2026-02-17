import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Set Persistence to Session (Login required per session)
// This ensures that when the page is reloaded, it stays logged in only for that session
// But to force login EVERY reload as requested, we can use none or just signOut on load
setPersistence(auth, browserSessionPersistence);

const loginView = document.getElementById('login-view');
const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Force Logout on initial load to ensure login is required every time
let isNewLogin = false;

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user && isNewLogin) {
        loginView.style.display = 'none';
        adminContent.style.display = 'block';
        loadProducts();
        loadOrders(); // Load orders on login
    } else {
        if (user) signOut(auth); // Log out if session restored but wasn't a fresh login
        loginView.style.display = 'block';
        adminContent.style.display = 'none';
    }
});

// Load Orders
function loadOrders() {
    const ordersContainer = document.getElementById('orders-container');
    onSnapshot(collection(db, "orders"), (snapshot) => {
        ordersContainer.innerHTML = "";
        if (snapshot.empty) {
            ordersContainer.innerHTML = '<p style="opacity:0.5; text-align:center;">لا توجد طلبات حالياً.</p>';
            return;
        }
        snapshot.forEach((docSnapshot) => {
            const o = docSnapshot.data();
            const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString('ar-EG') : 'غير معروف';
            const div = document.createElement('div');
            div.className = "order-card";
            div.innerHTML = `
        <div class="order-header">
          <strong>العميل: ${o.customerName}</strong>
          <span>${date}</span>
        </div>
        <div class="order-details">
          <p>📞 ${o.customerPhone}</p>
          <p>📍 ${o.customerAddress}</p>
          <p>📦 المنتجات: ${o.items.map(i => `${i.name} (${i.qty})`).join(', ')}</p>
          <p style="margin-top:10px; font-weight:800; color:var(--accent);">الإجمالي: ${o.total.toLocaleString()} EGP</p>
        </div>
        <button class="delete-btn" data-id="${docSnapshot.id}" style="margin-top:10px; font-size:0.7rem;">حذف الطلب</button>
      `;
            ordersContainer.appendChild(div);
        });

        document.querySelectorAll('#orders-container .delete-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm("هل تريد مسح هذا الطلب؟")) {
                    await deleteDoc(doc(db, "orders", btn.dataset.id));
                }
            };
        });
    });
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        isNewLogin = true;
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("خطأ في تسجيل الدخول: " + error.message);
    }
});

// Logout Handler
logoutBtn.onclick = () => { isNewLogin = false; signOut(auth); };

// Add Product with Image Upload
const form = document.getElementById('add-product-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = document.getElementById('p-image-file').files[0];
    if (!file) return alert("الرجاء اختيار صورة");

    const progressDiv = document.getElementById('upload-progress');
    const progressPct = document.getElementById('progress-pct');
    progressDiv.style.display = 'block';

    try {
        // 1. Upload Image to Firebase Storage
        const storageRef = ref(storage, 'products/' + Date.now() + '_' + file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressPct.innerText = Math.round(progress) + '%';
            },
            (error) => { alert("خطأ في رفع الصورة"); },
            async () => {
                // 2. Get Download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // 3. Save Product to Firestore
                const productData = {
                    name: document.getElementById('p-name').value,
                    image: downloadURL, // Link from Storage
                    sizes: document.getElementById('p-sizes').value,
                    priceNow: parseFloat(document.getElementById('p-price-now').value),
                    priceBefore: document.getElementById('p-price-before').value ? parseFloat(document.getElementById('p-price-before').value) : null,
                    createdAt: new Date()
                };

                await addDoc(collection(db, "products"), productData);
                alert("تم إضافة المنتج بنجاح!");
                progressDiv.style.display = 'none';
                form.reset();
            }
        );
    } catch (error) {
        console.error(error);
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
