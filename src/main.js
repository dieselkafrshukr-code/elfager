// Main JavaScript for Zero Clothing Store

// Check if lucide exists, if not wait for window load
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
} else {
  window.addEventListener('load', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

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
    if (savedTheme === 'dark') {
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
    } else {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
    }
  }

  themeBtn.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    if (moonIcon && sunIcon) {
      moonIcon.style.display = isDark ? 'none' : 'block';
      sunIcon.style.display = isDark ? 'block' : 'none';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Animate transition
    gsap.fromTo('body', { opacity: 0.8 }, { opacity: 1, duration: 0.5 });
  });
}

// --- SIDEBAR LOGIC ---
const openSidebar = (id) => {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
};
const closeSidebar = (id) => {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
};

const cartBtn = document.getElementById('btn-cart');
if (cartBtn) cartBtn.onclick = () => openSidebar('cart-sidebar');

const closeCart = document.getElementById('close-cart');
if (closeCart) closeCart.onclick = () => closeSidebar('cart-sidebar');


// --- STATIC PRODUCTS DATA ---
const products = [];

// --- PRODUCTS DISPLAY ---
const prodList = document.getElementById('products-list');
if (prodList) {
  // Render static products
  prodList.innerHTML = "";
  if (products.length === 0) {
    prodList.innerHTML = `<p style="grid-column: 1/-1; text-align:center; opacity:0.5">Coming soon...</p>`;
  } else {
    products.forEach(p => {
      const card = document.createElement('div');
      card.className = "product-card";
      card.innerHTML = `
                  <img src="${p.main_image}" class="product-img">
                  <div class="product-info">
                      <h3>${p.name}</h3>
                      <p class="p-price">${p.price_now} EGP</p>
                      <button class="btn btn-primary add-btn" style="width:100%; margin-top:1rem; padding:0.8rem; font-size:0.8rem;" 
                          data-id="${p.id}" data-name="${p.name}" data-price="${p.price_now}" data-img="${p.main_image}">
                          Add to Bag
                      </button>
                  </div>
              `;
      prodList.appendChild(card);
    });

    document.querySelectorAll('.add-btn').forEach(b => {
      b.onclick = () => {
        addToBag({ ...b.dataset });
        openSidebar('cart-sidebar');
      };
    });
  }
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
      <div style="flex:1"><h4>${item.name}</h4><p>${item.price} EGP × ${item.qty}</p></div>
      <button class="remove-item-btn" data-index="${idx}" style="background:none; border:none; color:var(--text-color); cursor:pointer;">
        <i data-lucide="x"></i>
      </button>
    `;
    bagItems.appendChild(itemDiv);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const index = parseInt(this.getAttribute('data-index'));
      bag.splice(index, 1);
      localStorage.setItem('bag', JSON.stringify(bag));
      renderBag();
    });
  });

  if (document.getElementById('bag-total')) {
    document.getElementById('bag-total').innerText = bag.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString() + " EGP";
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
};

const addToBag = (p) => {
  const ex = bag.find(i => i.id === p.id);
  if (ex) ex.qty++; else bag.push({ ...p, qty: 1 });
  localStorage.setItem('bag', JSON.stringify(bag));
  renderBag();
};

// --- WHATSAPP CHECKOUT ---
const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.onclick = (e) => {
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const addr = document.getElementById('c-addr').value;
    if (!name || !phone || !addr) return alert("Please fill in all details");

    // Create WhatsApp message
    const total = bag.reduce((s, i) => s + (i.price * i.qty), 0);
    let message = `*طلب جديد من Trico style*\n\n`;
    message += `*الاسم:* ${name}\n`;
    message += `*الهاتف:* ${phone}\n`;
    message += `*العنوان:* ${addr}\n\n`;
    message += `*المنتجات:*\n`;

    bag.forEach((item, index) => {
      message += `${index + 1}. ${item.name} - ${item.price} EGP × ${item.qty}\n`;
    });

    message += `\n*الإجمالي:* ${total.toLocaleString()} EGP`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '201027495401'; // Without + or 00
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Clear cart after sending
    setTimeout(() => {
      bag = [];
      localStorage.setItem('bag', "[]");
      renderBag();
      closeSidebar('cart-sidebar');
      alert('تم فتح واتساب! أرسل الرسالة لإتمام الطلب');
    }, 500);
  };
}

// Initial Render of Bag
renderBag();

// GSAP Animations
gsap.from("#hero-title", { y: 50, opacity: 0, duration: 1.5, ease: "power3.out" });
gsap.from(".logo", { y: -20, opacity: 0, duration: 1, delay: 0.2 });
gsap.from("nav .icon-btn", { y: -20, opacity: 0, duration: 1, stagger: 0.1, delay: 0.4 });

// Final icon refresh
if (typeof lucide !== 'undefined') lucide.createIcons();
