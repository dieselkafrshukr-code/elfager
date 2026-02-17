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

// 1. Force Clear Session on every Page Load
signOut(auth).then(() => console.log("Session cleared."));

const loginView = document.getElementById('login-view');
const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Flag to track fresh manual login
let authenticated = false;

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user && authenticated) {
        loginView.style.display = 'none';
        adminContent.style.display = 'block';
        loadProducts();
        loadOrders();
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
        authenticated = true; // Set flag only after manual login success
    } catch (error) {
        alert("خطأ في تسجيل الدخول: " + error.message);
    }
});

// Logout Handler
logoutBtn.onclick = () => { authenticated = false; signOut(auth); };

// Add Product with Detailed Error Logging
const form = document.getElementById('add-product-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('p-image-file');
    const file = fileInput.files[0];
    if (!file) return alert("الرجاء اختيار صورة أولاً");

    const progressDiv = document.getElementById('upload-progress');
    const progressPct = document.getElementById('progress-pct');
    progressDiv.style.display = 'block';
    progressPct.innerText = '0%';

    try {
        console.log("Starting upload:", file.name);
        const storageRef = ref(storage, 'products/' + Date.now() + '_' + file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressPct.innerText = Math.round(progress) + '%';
            },
            (error) => {
                console.error("Storage Error:", error);
                alert("فشل في رفع الصورة: " + error.message + "\nتأكد من تفعيل Storage في Firebase Console.");
                progressDiv.style.display = 'none';
            },
            async () => {
                try {
                    console.log("Upload done, getting URL...");
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    console.log("Saving to Firestore...");
                    const productData = {
                        name: document.getElementById('p-name').value,
                        image: downloadURL,
                        sizes: document.getElementById('p-sizes').value,
                        priceNow: parseFloat(document.getElementById('p-price-now').value),
                        priceBefore: document.getElementById('p-price-before').value ? parseFloat(document.getElementById('p-price-before').value) : null,
                        createdAt: new Date()
                    };

                    await addDoc(collection(db, "products"), productData);
                    console.log("Success!");
                    alert("✅ تم إضافة المنتج بنجاح!");
                    progressDiv.style.display = 'none';
                    form.reset();
                } catch (dbError) {
                    console.error("Database Error:", dbError);
                    alert("خطأ في حفظ البيانات: " + dbError.message);
                    progressDiv.style.display = 'none';
                }
            }
        );
    } catch (error) {
        console.error("General Error:", error);
        alert("حدث خطأ غير متوقع: " + error.message);
        progressDiv.style.display = 'none';
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

