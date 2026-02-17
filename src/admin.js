import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('add-product-form');
const productsContainer = document.getElementById('products-container');

// Add Product
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
        console.error("Error adding product: ", error);
        alert("حدث خطأ أثناء إضافة المنتج.");
    }
});

// Load and display products for Deletion
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
