document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    startNavClock();
    setupModals();
    setupProductCards();
    setupImageZoom();
    setupFooterDates();
    setupUniversalMusic();
    setupSearchBar();
    setupAccessibility();
    
    // SETUP AUTH
    setupAuthLogic(); 
    checkAuthUI(); 
});

/* =========================================
   1. AUTH SYSTEM (PERSONALIZED)
========================================= */

function checkAuthUI() {
    const accountBtn = document.getElementById('login-trigger');
    const isLoggedIn = localStorage.getItem('hype_is_logged_in');
    const username = localStorage.getItem('hype_username') || "MEMBER"; 

    if (accountBtn) {
        if (isLoggedIn === 'true') {
            accountBtn.innerHTML = `HI, ${username} 👤 <span style='font-size:0.6rem; color:#c5a059;'>(LOGOUT)</span>`;
            
            accountBtn.onclick = (e) => {
                e.stopPropagation(); 
                if(confirm(`GOODBYE ${username}. LOGOUT NOW?`)) {
                    localStorage.removeItem('hype_is_logged_in');
                    localStorage.removeItem('hype_username'); 
                    alert("LOGGED OUT SUCCESSFULLY.");
                    window.location.reload(); 
                }
            };
        } else {
            accountBtn.innerHTML = "ACCOUNT 👤";
            accountBtn.onclick = () => document.getElementById('auth-modal').style.display = 'block';
        }
    }
}

function setupAuthLogic() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault(); 
            const emailInput = loginForm.querySelector('input[type="email"]');
        
            let shortName = "MEMBER";
            if(emailInput && emailInput.value) {
                shortName = emailInput.value.split('@')[0].toUpperCase();
            }

            performLogin("WELCOME BACK!", shortName);
            if(emailInput) emailInput.value = '';
        };
    }

    if (signupForm) {
        signupForm.onsubmit = (e) => {
            e.preventDefault();
            const nameInput = signupForm.querySelector('input[type="text"]'); 
            
            let fullName = "MEMBER";
            if(nameInput && nameInput.value) {
                fullName = nameInput.value.split(' ')[0].toUpperCase();
            }

            performLogin("ACCOUNT CREATED! WELCOME TO THE CLUB.", fullName);
        };
    }
}

function performLogin(message, username) {
    localStorage.setItem('hype_is_logged_in', 'true');
    localStorage.setItem('hype_username', username);
    
    alert(`✅ ${message}\nLogged in as: ${username}`);
    
    document.getElementById('auth-modal').style.display = 'none';
    checkAuthUI(); 
}

/* =========================================
   2. CHECKOUT SYSTEM (GATEKEEPER)
========================================= */
function processCheckout() {
    const cart = JSON.parse(localStorage.getItem('hype_cart')) || [];
    if (cart.length === 0) {
        alert("YOUR BAG IS EMPTY.");
        return;
    }

    const isLoggedIn = localStorage.getItem('hype_is_logged_in');
    
    if (isLoggedIn !== 'true') {
        alert("🔒 MEMBER ACCESS ONLY.\n\nPLEASE LOGIN OR SIGN UP TO PROCEED.");
        
        const cartModal = document.getElementById('cart-modal');
        if(cartModal) cartModal.style.display = 'none';

        const authModal = document.getElementById('auth-modal');
        if(authModal) authModal.style.display = 'block';
        
        return; 
    }

    // 3. PROCEED CHECKOUT
    let total = 0;
    cart.forEach(item => { total += (parseFloat(item.price) || 0) * item.quantity; });

    const totalDisplay = document.getElementById('checkout-final-total');
    if(totalDisplay) totalDisplay.innerText = "RM " + total.toFixed(2);
    
    const qrDisplay = document.getElementById('qr-amount-display');
    if(qrDisplay) qrDisplay.innerText = "RM " + total.toFixed(2);

    const savedName = localStorage.getItem('hype_username');
    const nameField = document.getElementById('cust-name');
    if(savedName && nameField && !nameField.value) {
        nameField.value = savedName; 
    }

    document.getElementById('checkout-phase-1').style.display = 'block';
    document.getElementById('checkout-phase-qr').style.display = 'none';
    document.getElementById('checkout-modal').style.display = 'block';
    document.getElementById('cart-modal').style.display = 'none';
}

function closeCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function handlePaymentSelection() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;

    if(!name || !phone || !address) {
        alert("Please fill in all shipping details.");
        return;
    }
    
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = selectedPayment ? selectedPayment.value : 'fpx'; 

    if (paymentMethod === 'qr') {
        document.getElementById('checkout-phase-1').style.display = 'none';
        document.getElementById('checkout-phase-qr').style.display = 'block';
    } else {
        startPaymentSimulation(paymentMethod);
    }
}

function submitQrReceipt() {
    const fileInput = document.getElementById('payment-proof');
    if (fileInput.files.length === 0) {
        alert("⚠️ PLEASE UPLOAD PAYMENT RECEIPT.");
        return;
    }
    startPaymentSimulation('QR Pay');
}

function backToPhase1() {
    document.getElementById('checkout-phase-qr').style.display = 'none';
    document.getElementById('checkout-phase-1').style.display = 'block';
}

function startPaymentSimulation(methodName) {
    const cart = JSON.parse(localStorage.getItem('hype_cart')) || [];
    const name = document.getElementById('cust-name').value;
    const totalPaid = document.getElementById('checkout-final-total').innerText;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    closeCheckout(); 
    const loader = document.getElementById('payment-loader');
    if(loader) loader.style.display = 'flex';

    setTimeout(() => {
        if(loader) loader.style.display = 'none';
        
        document.getElementById('r-name').innerText = name.toUpperCase();
        document.getElementById('r-date').innerText = dateStr.toUpperCase();
        document.getElementById('r-total').innerText = totalPaid;
        document.getElementById('r-method').innerText = methodName.toUpperCase();
        document.getElementById('r-order-id').innerText = "#HC-" + Math.floor(100000 + Math.random() * 900000);

        const listContainer = document.getElementById('r-items-list');
        listContainer.innerHTML = cart.map(item => `
            <tr>
                <td>${item.name}<br><small>SIZE: ${item.size}</small></td>
                <td style="text-align:center">x${item.quantity}</td>
                <td style="text-align:right">RM ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        localStorage.removeItem('hype_cart');
        updateCartBadge(); 


        document.getElementById('receipt-modal').style.display = 'block';
    }, 3000); 
}

/* =========================================
   3. SETUP MODALS
========================================= */
function setupModals() {
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const authModal = document.getElementById('auth-modal');
    const loginTrigger = document.getElementById('login-trigger'); 
    const closeBtns = document.querySelectorAll('.close-modal');

    if (cartBtn && cartModal) {
        cartBtn.onclick = () => {
            renderCartPreview(); 
            cartModal.style.display = 'block';
        };
    }

    if (loginTrigger && authModal) {
        loginTrigger.onclick = () => authModal.style.display = 'block';
    }

    closeBtns.forEach(btn => {
        btn.onclick = () => {
            if (cartModal) cartModal.style.display = 'none';
            if (authModal) authModal.style.display = 'none';
            const checkoutModal = document.getElementById('checkout-modal');
            if (checkoutModal) checkoutModal.style.display = 'none';
        };
    });

    window.onclick = (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
        if (e.target === authModal) authModal.style.display = 'none';
        const checkoutModal = document.getElementById('checkout-modal');
        if (e.target === checkoutModal) checkoutModal.style.display = 'none';
    };
}

/* =========================================
   4. CART LOGIC
========================================= */
function addToBag(product) {
    let cart = JSON.parse(localStorage.getItem('hype_cart')) || [];
    product.price = parseFloat(product.price);

    const index = cart.findIndex(item => item.id === product.id && item.size === product.size);

    if (index > -1) {
        cart[index].quantity += product.quantity; 
    } else {
        cart.push(product); 
    }

    localStorage.setItem('hype_cart', JSON.stringify(cart));
    
    updateCartBadge();   
    renderCartPreview(); 
}

function removeFromBag(id, size) {
    let cart = JSON.parse(localStorage.getItem('hype_cart')) || [];
    cart = cart.filter(item => !(item.id === id && item.size === size));
    localStorage.setItem('hype_cart', JSON.stringify(cart));
    
    updateCartBadge();
    renderCartPreview();
    if (typeof renderFullCart === 'function') renderFullCart();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    let cart = JSON.parse(localStorage.getItem('hype_cart')) || [];
    const total = cart.reduce((acc, item) => acc + item.quantity, 0);
    badge.innerText = total;
}

function renderCartPreview() {
    const container = document.getElementById('cart-items-preview');
    if (!container) return; 

    let cart = JSON.parse(localStorage.getItem('hype_cart')) || [];
    let grandTotal = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:50px 0;">
                <p style="color:#888; font-size:0.7rem; letter-spacing:2px;">YOUR BAG IS EMPTY</p>
            </div>`;
        return;
    }


    let itemsHtml = cart.map(item => {
        let priceNum = parseFloat(item.price) || 0;
        const subtotal = priceNum * item.quantity;
        grandTotal += subtotal; 
        const displaySize = item.size ? item.size : 'UNI';

        return `
            <div style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px; align-items:flex-start;">
                <img src="${item.img}" style="width:60px; height:75px; object-fit:cover;">
                <div style="flex:1;">
                    <h5 style="font-size:0.7rem; margin:0 0 5px 0; font-weight:700;">${item.name}</h5>
                    <p style="font-size:0.65rem; color:#888; margin:0 0 5px 0;">SIZE: ${displaySize}</p>
                    <p style="font-size:0.65rem; color:#c5a059; font-weight:700; margin:0;">RM ${priceNum.toFixed(2)} x ${item.quantity}</p>
                </div>
                <button onclick="removeFromBag('${item.id}', '${displaySize}')" style="border:none; background:none; font-size:1.2rem; cursor:pointer; color:#ccc;">&times;</button>
            </div>
        `;
    }).join('');
 
    container.innerHTML = itemsHtml + `
        <div style="margin-top:15px; padding-top:20px; border-top:2px solid #000; display:flex; justify-content:space-between; font-weight:800; font-size:0.9rem;">
            <span>TOTAL</span><span style="color:#c5a059;">RM ${grandTotal.toFixed(2)}</span>
        </div>
        <button onclick="location.href='cart.html'" style="width:100%; background:#000; color:#fff; border:none; padding:18px; margin-top:25px; font-size:0.7rem; letter-spacing:3px; font-weight:800; cursor:pointer;">VIEW FULL BAG</button>
    `;
}

/* =========================================
   5. PRODUCT CARDS & UI (CLOCK, MUSIC, SEARCH, ETC)
========================================= */
function setupProductCards() {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const plus = card.querySelector('.plus');
        const minus = card.querySelector('.minus');
        const qtyDisplay = card.querySelector('.qty-number'); 
        const addBtn = card.querySelector('.add-to-cart');
        const sizeSelect = card.querySelector('.size-select'); 

        if (!addBtn) return;
        
        if(qtyDisplay) qtyDisplay.innerText = "0";

        if(plus && qtyDisplay) {
            plus.onclick = (e) => { e.stopPropagation(); qtyDisplay.innerText = parseInt(qtyDisplay.innerText) + 1; };
        }

        if(minus && qtyDisplay) {
            minus.onclick = (e) => { e.stopPropagation(); let v=parseInt(qtyDisplay.innerText); if(v>0) qtyDisplay.innerText=v-1; };
        }

        addBtn.onclick = (e) => {
            e.stopPropagation();
            const qty = qtyDisplay ? parseInt(qtyDisplay.innerText) : 1;
            let selectedSize = "UNI"; 
            if (sizeSelect) {
                if (sizeSelect.value === "" || sizeSelect.value === "SIZE") {
                    alert("⚠️ PLEASE SELECT A SIZE.");
                    return;
                }
                selectedSize = sizeSelect.value;
            }

            if (qty <= 0) { alert("⚠️ PLEASE SELECT QUANTITY."); return; }

            const priceEl = card.querySelector('.price');
            const rawPrice = priceEl ? priceEl.innerText : "0";
            const cleanPrice = parseFloat(rawPrice.replace(/[^\d.]/g, '')); 
            const imgSrc = card.querySelector('img')?.src;
            const prodName = card.querySelector('h4')?.innerText;

            addToBag({
                id: card.dataset.id || Math.random().toString(36).substr(2, 9),
                name: prodName,
                price: cleanPrice,
                img: imgSrc,
                quantity: qty,
                size: selectedSize
            });

            if(qtyDisplay) qtyDisplay.innerText = "0";
            if(sizeSelect) sizeSelect.value = ""; 

            const oriText = addBtn.innerText;
            addBtn.innerText = "ADDED!";
            addBtn.style.background = "#c5a059"; 
            addBtn.style.color = "#000";
            setTimeout(() => {
                addBtn.innerText = oriText;
                addBtn.style.background = ""; 
                addBtn.style.color = "";
            }, 1000);
        };
    });
}

function setupImageZoom() {
    const modal = document.getElementById("image-zoom-modal");
    const modalImg = document.getElementById("img-to-zoom");
    const closeBtn = document.querySelector(".close-zoom");
    const images = document.querySelectorAll('.product-card .image-container img');

    if (!modal) return;
    images.forEach(img => {
        img.onclick = function(e) {
            e.stopPropagation();
            modal.style.display = "flex"; 
            modalImg.src = this.src;
        };
    });
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
}

function setupUniversalMusic() {
    let audio = document.getElementById('bg-music');
    let btn = document.getElementById('music-toggle');
    let isAboutPage = false;

    if (!audio) {
        audio = document.getElementById('hype-audio');
        btn = document.getElementById('audio-toggle');
        isAboutPage = true;
    }
    if (!audio || !btn) return;

    audio.volume = 0.3;
    const updateState = (playing) => {
        if (isAboutPage) {
            const playIcon = document.getElementById('play-icon');
            const playerContainer = document.getElementById('player-container');
            if(playing) {
                if(playIcon) { playIcon.classList.remove('fa-play'); playIcon.classList.add('fa-pause'); }
                if(playerContainer) playerContainer.classList.add('playing');
            } else {
                if(playIcon) { playIcon.classList.remove('fa-pause'); playIcon.classList.add('fa-play'); }
                if(playerContainer) playerContainer.classList.remove('playing');
            }
        } else {
            const icon = btn.querySelector('i');
            if(playing) {
                btn.classList.add('music-playing');
                if(icon) { icon.classList.remove('fa-volume-xmark'); icon.classList.add('fa-volume-high'); }
            } else {
                btn.classList.remove('music-playing');
                if(icon) { icon.classList.remove('fa-volume-high'); icon.classList.add('fa-volume-xmark'); }
            }
        }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => updateState(true)).catch(() => {
            updateState(false);
            document.body.addEventListener('click', () => {
                audio.play();
                updateState(true);
            }, { once: true });
        });
    }

    btn.onclick = (e) => {
        e.stopPropagation(); 
        if (audio.paused) { audio.play(); updateState(true); } 
        else { audio.pause(); updateState(false); }
    };
}

function startNavClock() {
    const el = document.getElementById('nav-timestamp');
    if(!el) return;

    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    };

    setInterval(() => {
        const now = new Date();
        const day = now.getDate();
        const suffix = getOrdinal(day); 
        const month = now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
        const year = now.getFullYear();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        el.innerHTML = `${day}<sup>${suffix}</sup> ${month} ${year} | ${timeStr}`;
    }, 1000);
}

function setupFooterDates() {
    const copyEl = document.getElementById('copyright-date');
    const updateEl = document.getElementById('last-update');
    const now = new Date();
    if (copyEl) copyEl.innerText = now.getFullYear();
    if (updateEl) updateEl.innerText = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
}

function switchAuth(type) {
    const l = document.getElementById('login-form');
    const s = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.tab-btn');
    if(!l || !s) return;
    tabs.forEach(t => t.classList.remove('active'));
    if(type === 'login') {
        l.style.display='block'; s.style.display='none';
        if(tabs[0]) tabs[0].classList.add('active');
    } else {
        l.style.display='none'; s.style.display='block';
        if(tabs[1]) tabs[1].classList.add('active');
    }
}

function setupSearchBar() {
    const btn = document.getElementById('search-btn');
    const cont = document.querySelector('.search-container');
    const input = document.getElementById('search-input');
    if (btn && cont && input) {
        btn.onclick = (e) => {
            e.stopPropagation();
            cont.classList.toggle('search-active');
            if (cont.classList.contains('search-active')) input.focus();
        };
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = input.value.trim().toUpperCase();
                if(q) { alert("SEARCHING: " + q); window.location.href='collection.html'; }
                input.value = '';
                cont.classList.remove('search-active');
            }
        });
        window.addEventListener('click', (e) => {
            if (!cont.contains(e.target)) cont.classList.remove('search-active');
        });
    }
}

function setupAccessibility() {
    const btn = document.getElementById('access-toggle');
    if(btn) {
        if(localStorage.getItem('accessibilityMode') === 'on') document.body.classList.add('high-contrast');
        btn.onclick = () => {
            document.body.classList.toggle('high-contrast');
            localStorage.setItem('accessibilityMode', document.body.classList.contains('high-contrast') ? 'on' : 'off');
        };
    }
}

