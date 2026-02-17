// Main JavaScript for Trico style Store
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- THEME LOGIC ---
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  // Initialize theme based on localStorage or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);

  // Update icons visibility on load
  const moonIcon = document.getElementById('moon-icon');
  const sunIcon = document.getElementById('sun-icon');
  if (moonIcon && sunIcon) {
    moonIcon.style.display = savedTheme === 'dark' ? 'inline-block' : 'none';
    sunIcon.style.display = savedTheme === 'dark' ? 'none' : 'inline-block';
  }

  themeBtn.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    if (moonIcon && sunIcon) {
      moonIcon.style.display = isDark ? 'none' : 'inline-block';
      sunIcon.style.display = isDark ? 'inline-block' : 'none';
    }

    // Animate transition
    gsap.fromTo('body', { opacity: 0.8 }, { opacity: 1, duration: 0.5 });
  });
}

// --- SIDEBAR LOGIC ---
const openSidebar = (id) => { document.getElementById(id)?.classList.add('active'); };
const closeSidebar = (id) => { document.getElementById(id)?.classList.remove('active'); };

const cartBtn = document.getElementById('btn-cart');
if (cartBtn) cartBtn.onclick = () => openSidebar('cart-sidebar');

const closeCart = document.getElementById('close-cart');
if (closeCart) closeCart.onclick = () => closeSidebar('cart-sidebar');


// --- PRODUCTS DISPLAY ---
const prodList = document.getElementById('products-list');
if (prodList) {
  onSnapshot(collection(db, "products"), (snapshot) => {
    prodList.innerHTML = "";
    if (snapshot.empty) {
      prodList.innerHTML = `<p style="grid-column: 1/-1; text-align:center; opacity:0.5">Coming soon...</p>`;
      return;
    }
    snapshot.forEach((doc) => {
      const p = doc.data();
      const sizesArray = p.sizes ? p.sizes.split(',').map(s => s.trim()).filter(s => s !== "") : [];
      const sizesHtml = sizesArray.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join('');

      const card = document.createElement('div');
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" class="product-img">
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>
            ${p.priceBefore ? `<span class="p-price-old">${p.priceBefore} EGP</span>` : ''}
            <span class="p-price">${p.priceNow} EGP</span>
          </p>
          ${sizesArray.length > 0 ? `<div class="p-sizes">${sizesHtml}</div>` : ''}
          <button class="btn btn-primary add-btn" style="width:100%; margin-top:1rem; padding:0.8rem; font-size:0.8rem;" 
              data-id="${doc.id}" data-name="${p.name}" data-price="${p.priceNow}" data-img="${p.image}" data-has-sizes="${sizesArray.length > 0}">
              Add to Bag
          </button>
        </div>
      `;
      prodList.appendChild(card);

      // Handle Size Selection
      const sizeBtns = card.querySelectorAll('.size-btn');
      sizeBtns.forEach(sb => {
        sb.onclick = (e) => {
          e.stopPropagation();
          sizeBtns.forEach(b => b.classList.remove('active'));
          sb.classList.add('active');
        };
      });

      // Handle Add to Bag
      const addBtn = card.querySelector('.add-btn');
      addBtn.onclick = () => {
        let selectedSize = null;
        if (addBtn.dataset.hasSizes === "true") {
          const activeBtn = card.querySelector('.size-btn.active');
          if (!activeBtn) return alert("الرجاء اختيار المقاس أولاً");
          selectedSize = activeBtn.dataset.size;
        }
        addToBag({ ...addBtn.dataset, size: selectedSize });
        openSidebar('cart-sidebar');
      };
    });
  });
}

// --- BAG LOGIC ---
let bag = JSON.parse(localStorage.getItem('bag')) || [];
const renderBag = () => {
  const bagItems = document.getElementById('cart-items');
  const totalBox = document.getElementById('checkout-box');
  if (!bagItems) return;

  if (bag.length === 0) {
    bagItems.innerHTML = `<p style="opacity:0.5; text-align:center; margin-top:20px;">Your bag is empty.</p>`;
    if (totalBox) totalBox.style.display = 'none';
    return;
  }
  if (totalBox) totalBox.style.display = 'block';

  bagItems.innerHTML = '';
  bag.forEach((item, idx) => {
    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = 'display:flex; gap:15px; margin-bottom:1.5rem; align-items:center;';
    itemDiv.innerHTML = `
      <img src="${item.img}" style="width:50px; height:70px; object-fit:cover; border-radius:5px;">
      <div style="flex:1">
        <h4 style="font-size:0.9rem;">${item.name}</h4>
        <p style="font-size:0.8rem; opacity:0.7;">${item.size ? `المقاس: ${item.size}` : ''}</p>
        <p style="font-size:0.8rem; font-weight:600;">${item.price} EGP × ${item.qty}</p>
      </div>
      <button class="remove-item-btn" data-index="${idx}" style="background:none; border:none; color:var(--text-color); cursor:pointer; padding:4px; display:flex; align-items:center; justify-content:center;">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    bagItems.appendChild(itemDiv);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.onclick = () => {
      bag.splice(btn.dataset.index, 1);
      localStorage.setItem('bag', JSON.stringify(bag));
      renderBag();
    };
  });

  const total = bag.reduce((s, i) => s + (i.price * i.qty), 0);
  if (document.getElementById('bag-total')) document.getElementById('bag-total').innerText = total.toLocaleString() + " EGP";
};

const addToBag = (p) => {
  // Find item by ID AND Size
  const ex = bag.find(i => i.id === p.id && i.size === p.size);
  if (ex) ex.qty++; else bag.push({ ...p, qty: 1 });
  localStorage.setItem('bag', JSON.stringify(bag));
  renderBag();
};

// --- WHATSAPP CHECKOUT ---
const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.onclick = async () => {
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const addr = document.getElementById('c-addr').value;
    if (!name || !phone || !addr) return alert("Please fill in all details");

    const total = bag.reduce((s, i) => s + (i.price * i.qty), 0);

    let message = `*طلب جديد من Trico style*\n\n*الاسم:* ${name}\n*الهاتف:* ${phone}\n*العنوان:* ${addr}\n\n*المنتجات:*\n`;
    bag.forEach((item, index) => {
      message += `${index + 1}. ${item.name} ${item.size ? `(مقاس: ${item.size})` : ''} - ${item.price} EGP × ${item.qty}\n`;
    });
    message += `\n*الإجمالي:* ${total.toLocaleString()} EGP`;

    window.open(`https://wa.me/201027495401?text=${encodeURIComponent(message)}`, '_blank');

    setTimeout(() => {
      bag = [];
      localStorage.setItem('bag', "[]");
      renderBag();
      closeSidebar('cart-sidebar');
      alert('تم إرسال الطلب! أرسل رسالة الواتساب الآن لإتمام العملية.');
    }, 500);
  };
}

// Initial Render of Bag
renderBag();

// GSAP Animations
gsap.from("#hero-title", { y: 50, opacity: 0, duration: 1.5, ease: "power3.out" });
gsap.from(".logo", { y: -20, opacity: 0, duration: 1, delay: 0.2 });
