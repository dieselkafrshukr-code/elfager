import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, inMemoryPersistence } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 1. Force In-Memory Persistence (Session vanishes on refresh)
setPersistence(auth, inMemoryPersistence);

const loginView = document.getElementById('login-view');
const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const form = document.getElementById('add-product-form');

let authenticated = false;
let editId = null;

// Auth State
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

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        authenticated = true;
    } catch (error) {
        alert("بيانات الدخول خاطئة!");
    }
});

// Logout
logoutBtn.onclick = () => { authenticated = false; signOut(auth); location.reload(); };

// Convert File to Base64 (To avoid Firebase Storage)
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Add or Update Product
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('p-name').value;
    const file = document.getElementById('p-image-file').files[0];
    const sizes = document.getElementById('p-sizes').value;
    const priceNow = parseFloat(document.getElementById('p-price-now').value);
    const priceBefore = document.getElementById('p-price-before').value ? parseFloat(document.getElementById('p-price-before').value) : null;

    const progressDiv = document.getElementById('upload-progress');
    progressDiv.style.display = 'block';
    progressDiv.innerText = "جاري الحفظ في قاعدة البيانات...";

    try {
        let productData = {
            name,
            sizes,
            priceNow,
            priceBefore,
            updatedAt: serverTimestamp()
        };

        // If a new image is selected, convert it
        if (file) {
            productData.image = await toBase64(file);
        }

        if (editId) {
            await updateDoc(doc(db, "products", editId), productData);
            alert("تم تحديث المنتج!");
            editId = null;
            form.querySelector('button').innerText = "إضافة المنتج";
        } else {
            if (!file) throw new Error("الرجاء اختيار صورة للمنتج الجديد");
            productData.createdAt = serverTimestamp();
            await addDoc(collection(db, "products"), productData);
            alert("تم إضافة المنتج بنجاح!");
        }

        form.reset();
    } catch (error) {
        alert("خطأ: " + error.message);
    } finally {
        progressDiv.style.display = 'none';
    }
});

function loadProducts() {
    const productsContainer = document.getElementById('products-container');
    onSnapshot(collection(db, "products"), (snapshot) => {
        productsContainer.innerHTML = "";
        snapshot.forEach((docSnapshot) => {
            const p = docSnapshot.data();
            const div = document.createElement('div');
            div.className = "product-item";
            div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:10px; margin-bottom:10px; border-radius:5px;";
            div.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <img src="${p.image}" style="width:40px; height:40px; object-fit:cover; border-radius:3px;">
            <span>${p.name} - ${p.priceNow} EGP</span>
        </div>
        <div>
            <button class="edit-btn btn" style="background:#444; color:white; padding:5px 10px; font-size:12px;" data-id="${docSnapshot.id}">تعديل</button>
            <button class="delete-btn btn" style="background:#ff3e3e; color:white; padding:5px 10px; font-size:12px;" data-id="${docSnapshot.id}">حذف</button>
        </div>
      `;
            productsContainer.appendChild(div);
        });

        // Event Listeners for Edit/Delete
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const p = snapshot.docs.find(d => d.id === id).data();
                document.getElementById('p-name').value = p.name;
                document.getElementById('p-sizes').value = p.sizes;
                document.getElementById('p-price-now').value = p.priceNow;
                document.getElementById('p-price-before').value = p.priceBefore || "";
                document.getElementById('p-image-file').required = false; // Not required for edit
                editId = id;
                form.querySelector('button').innerText = "تحديث المنتج الحالي";
                window.scrollTo(0, 0);
            };
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm("هل أنت متأكد من الحذف؟")) await deleteDoc(doc(db, "products", btn.dataset.id));
            };
        });
    });
}

function loadOrders() {
    const ordersContainer = document.getElementById('orders-container');
    onSnapshot(collection(db, "orders"), (snapshot) => {
        ordersContainer.innerHTML = "";
        if (snapshot.empty) { ordersContainer.innerHTML = '<p style="opacity:0.5; text-align:center;">لا توجد طلبات حالياً.</p>'; return; }
        snapshot.forEach((docSnapshot) => {
            const o = docSnapshot.data();
            const div = document.createElement('div');
            div.className = "order-card";
            div.innerHTML = `
        <div class="order-header"><strong>العميل: ${o.customerName}</strong></div>
        <div class="order-details">
          <p>📞 ${o.customerPhone} | 📍 ${o.customerAddress}</p>
          <p>📦 ${o.items.map(i => `${i.name}(${i.qty})`).join(', ')}</p>
          <p style="color:var(--accent); font-weight:800;">الإجمالي: ${o.total} EGP</p>
        </div>
        <button class="delete-btn btn" data-id="${docSnapshot.id}" style="background:#ff3e3e; margin-top:10px; font-size:12px;">حذف الطلب</button>
      `;
            ordersContainer.appendChild(div);
        });
        document.querySelectorAll('#orders-container .delete-btn').forEach(btn => {
            btn.onclick = async () => { if (confirm("مسح الطلب؟")) await deleteDoc(doc(db, "orders", btn.dataset.id)); };
        });
    });
}
