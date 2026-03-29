/**
 * Soltan Seafood Restaurant - Main Script
 * Handles Mobile Menu, Cart System, Order Persistence, and UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------
    // 1. منطق القائمة للجوال (Mobile Menu Logic)
    // هذا القسم مسؤول عن فتح/إغلاق القائمة المتنقلة عند الضغط على زر القائمة.
    // ---------------------------------------------
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.close-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => mobileMenu.classList.add('active'));
    }
    if (closeMenu && mobileMenu) {
        closeMenu.addEventListener('click', () => mobileMenu.classList.remove('active'));
    }
    // Close menu when clicking any link
    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.remove('active'));
        });
    }


    // ---------------------------------------------
    // 2. دوال مساعدة مشتركة (Shared Helpers)
    // ---------------------------------------------

    // Extract price number from string (e.g. "480 ج.م" -> 480)
    // الدالة تقوم بإزالة أي نص غير الأرقام والفاصلة العشرية ثم تحويل الناتج لرقم.
    const extractPrice = (str) => {
        if (!str) return 0;
        const clean = str.replace(/[^\d.]/g, '');
        return parseFloat(clean) || 0;
    };

    // Save order to LocalStorage
    // تخزن الطلب داخل مصفوفة في localStorage تحت المفتاح myOrders
    const saveOrder = (order) => {
        const orders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        orders.unshift(order); // إضافة الطلب في البداية (أحدث أولاً)
        localStorage.setItem('myOrders', JSON.stringify(orders));
    };


    // ---------------------------------------------
    // 3. منطق صفحة الطلبات (Orders Page Logic)
    // هذا القسم يبحث عن المكان في الصفحة المخصص لسجل الطلبات ويعرضها من LocalStorage.
    // ---------------------------------------------
    const historySection = document.querySelector('.orders-section.history-section');
    if (historySection) {
        const loadOrders = () => {
            const orders = JSON.parse(localStorage.getItem('myOrders') || '[]');

            // Keep the title/subtitle
            historySection.innerHTML = '<h3 class="section-subtitle">سجل الطلبات</h3>';

            if (orders.length === 0) {
                historySection.innerHTML += `
                    <div class="empty-state" style="text-align: center; padding: 40px;">
                        <i class="fa-solid fa-receipt" style="font-size: 3rem; color: #ddd; margin-bottom: 20px;"></i>
                        <p style="color: #666;">لا توجد طلبات سابقة حتى الآن.</p>
                        <a href="offers.html" class="btn-primary" style="display: inline-block; margin-top: 15px; text-decoration: none;">تصفح العروض 😋</a>
                    </div>`;
                return;
            }

            orders.forEach(order => {
                const card = document.createElement('div');
                card.className = `order-card ${order.status === 'active' ? 'active-order' : 'history-order'}`;

                const itemsList = (order.items || []).map(item => `<li>${item.qty || 1}x ${item.name}</li>`).join('');

                const commentHtml = order.comment ? `<p style="margin-top:8px; color:#555;">ملاحظة: ${order.comment}</p>` : '';
                card.innerHTML = `
                    <div class="order-header">
                        <div class="order-id">
                            <span class="label">رقم الطلب:</span>
                            <strong>#${order.id}</strong>
                        </div>
                        <div class="order-status ${order.status === 'active' ? 'status-preparing' : 'status-delivered'}">
                            <span>${order.statusText}</span>
                            ${order.status === 'active' ? '<div class="status-dot"></div>' : ''}
                        </div>
                    </div>
                    <div class="order-body">
                        <ul class="order-items-summary">
                            ${itemsList}
                        </ul>
                        <div class="order-total">
                            <span>الإجمالي:</span>
                            <strong>${order.total}</strong>
                        </div>
                        <p class="order-date">📅 ${order.date}</p>
                        ${commentHtml}
                    </div>
                `;
                historySection.appendChild(card);
            });
        };
        loadOrders();
    }


    // ---------------------------------------------
    // 4. منطق صفحة العروض/الرئيسية لارسال الطلبات عبر الفورم
    // يستخدم هذا القسم فورم الطلبات في الصفحة الرئيسية (offers/index) لتحويلها للطلبات المخزنة.
    // ---------------------------------------------
    const homeOrderForm = document.querySelector('.order-form');
    if (homeOrderForm) {
        homeOrderForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect selected offers
            const selectedItems = [];
            let total = 0;

            const checkboxes = homeOrderForm.querySelectorAll('input[name="offer"]:checked');
            if (checkboxes.length === 0) {
                alert('⚠️ من فضلك اختر وجبة واحدة على الأقل.');
                return;
            }

            checkboxes.forEach(chk => {
                const row = chk.closest('.offer-item'); // Assuming new structure
                // If structure is reverted to simple label:
                const labelText = chk.parentElement.textContent.trim();

                // Try to find quantity input
                let qty = 1;
                if (row) {
                    const qtyInput = row.querySelector('.offer-qty');
                    if (qtyInput) qty = parseInt(qtyInput.value) || 1;
                }

                // Parse Name and Price from Label (e.g. "وجبة عائلية - 480 ج.م")
                const match = labelText.match(/(.+?)\s*-\s*(\d+)/);
                let name = labelText;
                let price = 0;

                if (match) {
                    name = match[1].trim();
                    price = parseFloat(match[2]);
                } else {
                    // Fallback extract
                    price = extractPrice(labelText);
                }

                selectedItems.push({
                    name: name,
                    qty: qty,
                    price: price
                });
                total += price * qty;
            });

            // Create Order Object
            const newOrder = {
                id: Math.floor(Math.random() * 9000) + 1000,
                date: new Date().toLocaleDateString('ar-EG'),
                status: 'active',
                statusText: 'جاري التحضير 🍳',
                items: selectedItems,
                total: `${total} ج.م`
            };

            saveOrder(newOrder);
            alert(`🎉 تم استلام طلبك بنجاح!\nرقم الطلب: #${newOrder.id}\nيمكنك متابعة حالة الطلب في صفحة "طلباتي".`);
            homeOrderForm.reset();

            // Redirect option (commented out)
            // window.location.href = 'orders.html';
        });
    }

    // ---------------------------------------------
    // 4.1. منطق تعليق الخدمة وإضافة طلب جديد (معلق مؤقتًا)
    // عند تفعيل orderFeatureEnabled= true، يتم تفعيل هذا القسم
    // ---------------------------------------------
    const orderFeatureEnabled = false; // معلق مؤقتًا، افعل لاحقًا بتغييرها true
    if (orderFeatureEnabled) {
        const orderFeedbackForm = document.querySelector('#order-feedback-form');
        if (orderFeedbackForm) {
            orderFeedbackForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const feedback = document.querySelector('#order-feedback');
                const responseEl = document.querySelector('#feedback-response');
                if (!feedback.value.trim()) {
                    responseEl.style.display = 'block';
                    responseEl.style.color = '#e74c3c';
                    responseEl.textContent = 'من فضلك اكتب التعليق قبل الإرسال.';
                    return;
                }
                responseEl.style.display = 'block';
                responseEl.style.color = '#27ae60';
                responseEl.textContent = 'تم استلام تعليقك، شكرًا لك على مساعدتنا في تحسين الخدمة!';
                feedback.value = '';
            });
        }

        const newOrderForm = document.querySelector('#new-order-form');
        if (newOrderForm) {
            newOrderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const itemsValue = document.querySelector('#new-order-items').value.trim();
                const totalValue = document.querySelector('#new-order-total').value.trim();
                const commentValue = document.querySelector('#new-order-comment').value.trim();
                const responseEl = document.querySelector('#new-order-response');

                if (!itemsValue || !totalValue) {
                    responseEl.style.display = 'block';
                    responseEl.style.color = '#e74c3c';
                    responseEl.textContent = 'الرجاء إدخال عناصر الطلب والإجمالي.';
                    return;
                }

                const id = Math.floor(Math.random() * 9000) + 1000;
                const date = new Date().toLocaleDateString('ar-EG');
                const itemsList = itemsValue.split(',').map(i => i.trim()).filter(Boolean);
                const totalNumber = extractPrice(totalValue);
                const commentText = commentValue ? `<p style="margin-top:8px; color:#555;">ملاحظة: ${commentValue}</p>` : '';

                const customContainer = document.querySelector('#custom-orders-container');
                const card = document.createElement('div');
                card.className = 'order-card active-order';
                card.innerHTML = `
                <div class="order-header">
                    <div class="order-id">
                        <span class="label">رقم الطلب:</span>
                        <strong>#${id}</strong>
                    </div>
                    <div class="order-status status-preparing">
                        <span>جاري التحضير 🍳</span>
                        <div class="status-dot"></div>
                    </div>
                </div>
                <div class="order-body">
                    <ul class="order-items-summary">
                        ${itemsList.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                    <div class="order-total">
                        <span>الإجمالي:</span>
                        <strong>${totalValue}</strong>
                    </div>
                    <p class="order-date">📅 ${date}</p>
                    ${commentText}
                </div>
                <div class="order-actions">
                    <button class="btn-track">تتبع الطلب 📍</button>
                    <button class="btn-cancel">إلغاء ❌</button>
                </div>
            `;
                customContainer.insertAdjacentElement('afterbegin', card);

                // persist this order to LocalStorage (same model used خصيصًا)
                saveOrder({
                    id,
                    date,
                    status: 'active',
                    statusText: 'جاري التحضير 🍳',
                    items: itemsList.map(i => ({ name: i, qty: 1 })),
                    total: `${totalNumber} ج.م`,
                    comment: commentValue || ''
                });

                responseEl.style.display = 'block';
                responseEl.style.color = '#27ae60';
                responseEl.textContent = `تم إضافة الطلب بنجاح. رقم الطلب: #${id}`;
                newOrderForm.reset();
            });
        }
    }

    // --- 5. "Quick Order" Buttons (Home Page Offer Cards) ---
    // These buttons add a single item order immediately
    const quickOrderBtns = document.querySelectorAll('.offers-section .btn-primary');
    quickOrderBtns.forEach(btn => {
        // Skip if it's the main form submit button
        if (btn.type === 'submit') return;

        btn.addEventListener('click', (e) => {
            const card = btn.closest('.offer-card');
            if (!card) return;

            const name = card.querySelector('h3').textContent.trim();
            const priceText = card.querySelector('.price').textContent;
            const price = extractPrice(priceText);

            if (confirm(`هل تود تأكيد طلب "${name}" بسعر ${price} ج.م؟ 🛒`)) {
                const newOrder = {
                    id: Math.floor(Math.random() * 9000) + 1000,
                    date: new Date().toLocaleDateString('ar-EG'),
                    status: 'active',
                    statusText: 'جاري التحضير 🍳',
                    items: [{ name: name, qty: 1, price: price }],
                    total: `${price} ج.م`
                };

                saveOrder(newOrder);
                alert(`✅ تم الطلب بنجاح! (#${newOrder.id})`);
            }
        });
    });


    // --- 6. Cart System (Offers Page) ---
    // Simple in-memory cart for the offers page session
    const cartState = [];
    const addToCartBtns = document.querySelectorAll('.btn-add-cart');

    // UI Elements
    const cartItemsEl = document.querySelector('.cart-items-list');
    const cartCountEl = document.querySelector('.cart-count');
    const cartTotalEl = document.querySelector('.cart-total');
    const finalTotalEl = document.querySelector('.final-total');

    // Render Cart
    const renderCart = () => {
        if (!cartItemsEl) return;

        const count = cartState.length;
        const total = cartState.reduce((sum, item) => sum + item.price, 0);

        // Update Text
        if (cartCountEl) cartCountEl.textContent = `${count} عناصر`;
        if (cartTotalEl) cartTotalEl.textContent = `${total.toFixed(2)} ج.م`;
        if (finalTotalEl) finalTotalEl.textContent = `${total.toFixed(2)} ج.م`;

        // Render List
        if (count === 0) {
            cartItemsEl.innerHTML = `<div class="empty-cart-msg"><p>أضف بعض الوجبات اللذيذة!</p></div>`;
        } else {
            cartItemsEl.innerHTML = '';
            cartState.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 'cart-item';
                row.style.cssText = 'display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;';
                row.innerHTML = `
                    <div>
                        <strong>${item.name}</strong>
                        <div style="font-size:0.9rem; color:#777;">${item.price} ج.م</div>
                    </div>
                    <button class="btn-remove" data-idx="${idx}" style="color:red; background:none; border:none; cursor:pointer;">✖</button>
                `;
                cartItemsEl.appendChild(row);
            });

            // Add remove listeners
            cartItemsEl.querySelectorAll('.btn-remove').forEach(b => {
                b.addEventListener('click', () => {
                    const idx = parseInt(b.dataset.idx);
                    cartState.splice(idx, 1);
                    renderCart();
                });
            });
        }
    };

    // Add to Cart Event
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.product-card');
            const name = card.querySelector('h3').textContent;
            const price = extractPrice(card.querySelector('.price').textContent);

            cartState.push({ name, price });
            renderCart();

            // Feedback
            const oldText = btn.textContent;
            btn.textContent = '✔ تم';
            setTimeout(() => btn.textContent = oldText, 1000);
        });
    });

    // Checkout Modal (Offers Page)
    const btnCheckout = document.querySelector('.btn-checkout'); // Sidebar button
    const checkoutModal = document.querySelector('#checkout-modal');
    const checkoutForm = document.querySelector('.checkout-form');

    if (btnCheckout && checkoutModal) {
        btnCheckout.addEventListener('click', () => {
            if (cartState.length === 0) {
                alert('⚠️ السلة فارغة!');
                return;
            }
            checkoutModal.classList.add('active');
        });

        // Close modal
        checkoutModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || e.target === checkoutModal) {
                checkoutModal.classList.remove('active');
            }
        });

        // Submit Checkout
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // Aggregate items
                // (Here we just group them simply)
                const aggregatedItems = [];
                cartState.forEach(item => {
                    aggregatedItems.push({ name: item.name, price: item.price, qty: 1 });
                });

                const total = cartState.reduce((sum, i) => sum + i.price, 0);

                const newOrder = {
                    id: Math.floor(Math.random() * 9000) + 1000,
                    date: new Date().toLocaleDateString('ar-EG'),
                    status: 'active',
                    statusText: 'جاري التحضير 🍳',
                    items: aggregatedItems,
                    total: `${total} ج.م`
                };

                saveOrder(newOrder);
                alert('✅ تم إرسال الطلب بنجاح!');

                // Reset
                cartState.length = 0;
                renderCart();
                checkoutModal.classList.remove('active');
            });
        }
    }


    // --- 7. Additional Quick Order Buttons ---
    const extraQuickOrderBtns = document.querySelectorAll('.btn-quick-order');
    extraQuickOrderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.offer-card');
            if (!card) return;

            const name = card.querySelector('h3').textContent.trim();
            const price = extractPrice(card.querySelector('.price').textContent);

            if (confirm(`هل تود تأكيد طلب "${name}" بسعر ${price} ج.م؟ 🛒`)) {
                const newOrder = {
                    id: Math.floor(Math.random() * 9000) + 1000,
                    date: new Date().toLocaleDateString('ar-EG'),
                    status: 'active',
                    statusText: 'جاري التحضير 🍳',
                    items: [{ name, qty: 1, price }],
                    total: `${price} ج.م`
                };

                saveOrder(newOrder);
                alert(`✅ تم الطلب بنجاح! (#${newOrder.id})`);
            }
        });
    });

    // --- 8. Menu Data-driven Rendering ---
    const menuData = [
        {
            title: '🐟 الأسماك الطازجة',
            items: [
                { name: 'بلطي', price: '68 / 70 / 750' },
                { name: 'بلطي أسواني دباشي', price: '100' },
                { name: 'شبار أسواني', price: '80' },
                { name: 'بوري', price: '140 / 190 / 210' },
                { name: 'قاروص دنيس', price: '450' },
                { name: 'لوت', price: '195' },
                { name: 'قشر بياض', price: '180' },
                { name: 'مرجان أبو شرارة', price: '160' },
                { name: 'شعور', price: '350' },
                { name: 'بهار', price: '175' },
                { name: 'بياض نيلي', price: '170' }
            ]
        },
        {
            title: '🦐 الجمبري والمأكولات البحرية',
            items: [
                { name: 'جمبري بلدي سويسي', price: '200 / 220' },
                { name: 'جمبري بلدي', price: '200' },
                { name: 'جمبري بلدي', price: '220' },
                { name: 'جمبري بلدي خشابي', price: '320' },
                { name: 'جمبري بلدي سويسي', price: '550' },
                { name: 'جمبري بلدي جامبو', price: '700' },
                { name: 'كالماري بلدي', price: '180 / 200 / 300' }
            ]
        },
        {
            title: '🦀 كابوريا ومكرونة البحر',
            items: [
                { name: 'كيلو وربع مكرونة مغازل كبيرة', price: '100' },
                { name: 'كيلو وربع كابوريا نتي', price: '100' },
                { name: 'كيلو ونص كابوريا دكر', price: '100' },
                { name: 'كيلو وربع مكرونة خليجي', price: '100' },
                { name: 'كيلو ونص مرجان خليجي', price: '100' },
                { name: 'كابوريا نتي', price: '250' },
                { name: 'كابوريا دكر', price: '150' },
                { name: 'مكرونة سويسي', price: '150' },
                { name: 'مكرونة دمياطي', price: '125' },
                { name: 'مكرونة عيون مجمدة', price: '85' }
            ]
        },
        {
            title: '🐠 أصناف متنوعة',
            items: [
                { name: 'تونة بلدي عسل نحل', price: '120' },
                { name: 'تونة شك', price: '120' },
                { name: 'بساريا', price: '25' },
                { name: 'سردين سويسي', price: '160' },
                { name: 'سردين عماني', price: '55' },
                { name: 'لاشتا', price: '100' },
                { name: 'ماكريل', price: '225' },
                { name: 'سهلية سويسي بالشوي', price: '150' },
                { name: 'مرجان سويسي', price: '120 / 150' }
            ]
        },
        {
            title: '⭐ عروض المستوى',
            items: [
                { name: 'كيلو مكرونة مقلي', price: '140' },
                { name: 'كيلو بلطي مشوي (3-4 سمكات)', price: '85' },
                { name: 'كيلو بلطي مقلي', price: '85' },
                { name: 'كيلو سهلية مشوي', price: '150' },
                { name: '8 سندوتش جمبري', price: '200', highlight: true }
            ]
        }
    ];

    const renderMenu = () => {
        const container = document.querySelector('#menuCardsContainer');
        if (!container) return;

        const isOffersPage = window.location.pathname.includes('offers.html');
        const categoryClass = isOffersPage ? 'menu-category' : 'menu-category-card';

        container.innerHTML = menuData.map(category => {
            const rows = category.items.map(item => {
                const highlight = item.highlight ? ' class="highlight-row"' : '';
                return `<tr${highlight}><td>${item.name}</td><td>${item.price}</td></tr>`;
            }).join('');

            return `
                <div class="${categoryClass}${category.title.includes('⭐') ? ' special-offers' : ''}">
                    <h4>${category.title}</h4>
                    <table class="menu-table">
                        <thead>
                            <tr><th>الصنف</th><th>السعر (جنيه)</th></tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
        }).join('');
    };

    renderMenu();

});

