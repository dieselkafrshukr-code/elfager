import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from './config.js';

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginView = document.getElementById('login-view');
const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const productForm = document.getElementById('add-product-form');

let editId = null;

// --- 1. Fresh state on load ---
// Instead of signOut at the top, we rely on onAuthStateChanged to set the initial view.

// --- 2. Auth State Listener ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginView.style.display = 'none';
        adminContent.style.display = 'block';
        loadProducts();
        loadOrders();
    } else {
        loginView.style.display = 'block';
        adminContent.style.display = 'none';
    }
});

// --- 3. Login Handler (Friendly Errors) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const btn = document.getElementById('login-submit-btn');

    btn.innerText = "جاري التحقق...";
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        console.error("Firebase Auth Error:", err.code, err.message);
        let msg = "حدث خطأ: " + err.message;

        if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
            msg = "بيانات الدخول غير صحيحة! تأكد من الإيميل والباسورد المضافين في Firebase.";
        } else if (err.code === "auth/operation-not-allowed") {
            msg = "يجب تفعيل Email/Password في خيار Sign-in Method في Firebase!";
        } else if (err.code === "auth/too-many-requests") {
            msg = "محاولات كثيرة خاطئة! الحساب محظور مؤقتاً.";
        }

        alert(msg);
    } finally {
        btn.innerText = "دخول";
        btn.disabled = false;
    }
});

// --- 4. Tabs System ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    };
});

// Logout
logoutBtn.onclick = () => signOut(auth).then(() => location.reload());

// --- 5. Base64 Image Conversion ---
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- 6. Form Submission (Add/Edit) ---
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('product-submit-btn');
    const status = document.getElementById('upload-status');

    btn.disabled = true;
    status.style.display = 'block';

    try {
        const file = document.getElementById('p-image-file').files[0];
        let data = {
            name: document.getElementById('p-name').value,
            sizes: document.getElementById('p-sizes').value,
            priceNow: parseFloat(document.getElementById('p-price-now').value),
            priceBefore: document.getElementById('p-price-before').value ? parseFloat(document.getElementById('p-price-before').value) : null,
            updatedAt: serverTimestamp()
        };

        if (file) data.image = await toBase64(file);

        if (editId) {
            await updateDoc(doc(db, "products", editId), data);
            alert("تم التحديث!");
        } else {
            if (!file) throw new Error("يجب اختيار صورة للمنتج الجديد");
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, "products"), data);
            alert("تمت الإضافة!");
        }

        productForm.reset();
        editId = null;
        document.getElementById('form-title').innerText = "إضافة منتج جديد";
        btn.innerText = "حفظ المنتج";
    } catch (error) {
        alert("حدث خطأ: " + error.message);
    } finally {
        btn.disabled = false;
        status.style.display = 'none';
    }
});

function loadProducts() {
    const container = document.getElementById('products-container');
    onSnapshot(collection(db, "products"), (snap) => {
        container.innerHTML = "";
        snap.forEach(dSnapshot => {
            const p = dSnapshot.data();
            const div = document.createElement('div');
            div.className = "product-item";
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.gap = "15px";
            div.innerHTML = `
        <img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
        <div style="flex:1"><strong>${p.name}</strong><br><small>${p.priceNow} EGP</small></div>
        <button class="edit-btn" style="background:#444; color:white; border:none; padding:5px 10px; cursor:pointer;" data-id="${dSnapshot.id}">تعديل</button>
        <button class="del-btn" style="background:#ff3e3e; color:white; border:none; padding:5px 10px; cursor:pointer;" data-id="${dSnapshot.id}">حذف</button>
      `;
            container.appendChild(div);
        });

        document.querySelectorAll('.edit-btn').forEach(eb => {
            eb.onclick = () => {
                editId = eb.dataset.id;
                const p = snap.docs.find(d => d.id === editId).data();
                document.getElementById('p-name').value = p.name;
                document.getElementById('p-sizes').value = p.sizes;
                document.getElementById('p-price-now').value = p.priceNow;
                document.getElementById('p-price-before').value = p.priceBefore || "";
                document.getElementById('form-title').innerText = "تعديل منتج: " + p.name;
                document.getElementById('product-submit-btn').innerText = "تحديث البيانات";
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        });

        document.querySelectorAll('.del-btn').forEach(db => {
            db.onclick = async () => { if (confirm("حذف؟")) await deleteDoc(doc(db, "products", db.dataset.id)); };
        });
    });
}

function loadOrders() {
    const container = document.getElementById('orders-container');
    onSnapshot(collection(db, "orders"), (snap) => {
        container.innerHTML = "";
        if (snap.empty) { container.innerHTML = '<p style="text-align:center; opacity:0.3;">لا يوجد طلبات حالياً.</p>'; return; }
        snap.forEach(dSnapshot => {
            const o = dSnapshot.data();
            const div = document.createElement('div');
            div.className = "order-card";
            div.innerHTML = `
        <div class="order-header"><strong>${o.customerName}</strong><small>${o.customerPhone}</small></div>
        <div style="font-size:0.9rem; opacity:0.8;">
          <p>📍 ${o.customerAddress}</p>
          <p>📦 ${o.items.map(i => `${i.name}(${i.qty})`).join(', ')}</p>
          <p style="text-align:left; font-weight:800; color:#fff;">Total: ${o.total} EGP</p>
        </div>
        <button class="del-btn" style="background:#ff3e3e; color:white; border:none; padding:5px 10px; cursor:pointer; width:100%; border-radius:4px; margin-top:10px;" data-id="${dSnapshot.id}">مسح الطلب من السجل</button>
      `;
            container.appendChild(div);
        });
        document.querySelectorAll('#orders-tab .del-btn').forEach(db => {
            db.onclick = async () => { if (confirm("مسح؟")) await deleteDoc(doc(db, "orders", db.dataset.id)); };
        });
    });
}
