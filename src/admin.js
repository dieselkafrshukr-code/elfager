import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginView = document.getElementById('login-view');
const adminContent = document.getElementById('admin-content');
const productForm = document.getElementById('add-product-form');
let editId = null;

// --- Login Check ---
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

// --- Tab Switching Logic ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        const target = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(target).classList.add('active');
    };
});

// --- Image Optimization (Resize to avoid 1MB limit) ---
const processImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const scale = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compressed JPEG
        };
    };
});

// --- Form Handling ---
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('product-submit-btn');
    const status = document.getElementById('upload-status');

    btn.disabled = true;
    status.style.display = 'block';
    status.innerText = "جاري معالجة وحفظ البيانات...";

    try {
        const file = document.getElementById('p-image-file').files[0];
        let data = {
            name: document.getElementById('p-name').value,
            sizes: document.getElementById('p-sizes').value,
            priceNow: parseFloat(document.getElementById('p-price-now').value),
            priceBefore: document.getElementById('p-price-before').value ? parseFloat(document.getElementById('p-price-before').value) : null,
            updatedAt: serverTimestamp()
        };

        if (file) {
            data.image = await processImage(file);
        }

        if (editId) {
            await updateDoc(doc(db, "products", editId), data);
            alert("✅ تم تحديث المنتج بنجاح!");
            editId = null;
        } else {
            if (!file) throw new Error("يجب اختيار صورة للمنتج الجديد");
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, "products"), data);
            alert("✅ تم إضافة المنتج الجديد!");
        }

        productForm.reset();
        document.getElementById('form-title').innerText = "إضافة منتج جديد";
        btn.innerText = "حفظ المنتج";
    } catch (err) {
        console.error(err);
        alert("❌ حدث خطأ: " + err.message);
    } finally {
        btn.disabled = false;
        status.style.display = 'none';
    }
});

// --- Login/Logout ---
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        alert("❌ بيانات الدخول غير صحيحة!");
    }
};

document.getElementById('logout-btn').onclick = () => {
    signOut(auth).then(() => location.reload());
};

function loadProducts() {
    const container = document.getElementById('products-container');
    onSnapshot(collection(db, "products"), (snap) => {
        container.innerHTML = "<h3>المنتجات الحالية</h3>";
        snap.forEach(d => {
            const p = d.data();
            const item = document.createElement('div');
            item.className = "product-item";
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.gap = "10px";
            item.innerHTML = `
                <img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                <div style="flex:1"><strong>${p.name}</strong><br>${p.priceNow} EGP</div>
                <button class="edit-btn" data-id="${d.id}" style="background:#555; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">تعديل</button>
                <button class="del-btn" data-id="${d.id}" style="background:#ff3e3e; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">حذف</button>
            `;
            container.appendChild(item);
        });

        document.querySelectorAll('.edit-btn').forEach(b => {
            b.onclick = () => {
                editId = b.dataset.id;
                const p = snap.docs.find(doc => doc.id === editId).data();
                document.getElementById('p-name').value = p.name;
                document.getElementById('p-sizes').value = p.sizes;
                document.getElementById('p-price-now').value = p.priceNow;
                document.getElementById('p-price-before').value = p.priceBefore || "";
                document.getElementById('form-title').innerText = "تعديل منتج: " + p.name;
                document.getElementById('product-submit-btn').innerText = "تحديث البيانات الآن";
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        document.querySelectorAll('.del-btn').forEach(b => {
            b.onclick = async () => { if (confirm("حذف المنتج؟")) await deleteDoc(doc(db, "products", b.dataset.id)); };
        });
    });
}

function loadOrders() {
    const container = document.getElementById('orders-container');
    onSnapshot(collection(db, "orders"), (snap) => {
        container.innerHTML = "<h3>سجل الطلبات</h3>";
        if (snap.empty) { container.innerHTML += "<p style='opacity:0.5'>لا توجد طلبات.</p>"; return; }
        snap.forEach(d => {
            const o = d.data();
            const card = document.createElement('div');
            card.className = "order-card";
            card.innerHTML = `
                <div class="order-header"><strong>${o.customerName}</strong><span>${o.customerPhone}</span></div>
                <div style="font-size:0.9rem; margin-top:5px;">
                    <p>📍 العنوان: ${o.customerAddress}</p>
                    <p>📦 المنتجات: ${o.items.map(i => `${i.name}(${i.qty})`).join(', ')}</p>
                    <p style="text-align:left; font-weight:800; border-top:1px solid #333; padding-top:5px; margin-top:5px;">الإجمالي: ${o.total} EGP</p>
                </div>
                <button class="del-order-btn" data-id="${d.id}" style="background:#ff3e3e; color:white; border:none; padding:8px; width:100%; border-radius:5px; margin-top:10px; cursor:pointer;">مسح الطلب</button>
            `;
            container.appendChild(card);
        });
        document.querySelectorAll('.del-order-btn').forEach(b => {
            b.onclick = async () => { if (confirm("مسح الطلب؟")) await deleteDoc(doc(db, "orders", b.dataset.id)); };
        });
    });
}
