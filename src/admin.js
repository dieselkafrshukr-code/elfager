import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, inMemoryPersistence } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 1. FORCE NO PERSISTENCE (Safe & Strict) ---
setPersistence(auth, inMemoryPersistence)
    .then(() => signOut(auth)) // Logout immediately on load/refresh
    .catch((err) => console.error("Persistence Error:", err));

const loginView = document.getElementById('login-view');
const adminContent = document.getElementById('admin-content');
const productForm = document.getElementById('add-product-form');
let editId = null;

// --- 2. Login Check ---
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
