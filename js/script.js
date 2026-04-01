/**
 * Soltan Seafood Restaurant - Main Script
 * Handles Mobile Menu, Cart System, Order Persistence, and UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------
    // 1. منطق القائمة للجوال (Mobile Menu Logic)
    // ---------------------------------------------
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu  = document.querySelector('.close-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => mobileMenu.classList.add('active'));
    }
    if (closeMenu && mobileMenu) {
        closeMenu.addEventListener('click', () => mobileMenu.classList.remove('active'));
    }
    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.remove('active'));
        });
    }


    // ---------------------------------------------
    // 2. دوال مساعدة مشتركة (Shared Helpers)
    // ---------------------------------------------

    const extractPrice = (str) => {
        if (!str) return 0;
        const clean = str.replace(/[^\d.]/g, '');
        return parseFloat(clean) || 0;
    };

    const saveOrder = (order) => {
        const orders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        orders.unshift(order);
        localStorage.setItem('myOrders', JSON.stringify(orders));
    };

    const showSuccessNotification = (message) => {
        const existing = document.querySelector('.success-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;

        Object.assign(notification.style, {
            position:        'fixed',
            top:             '20px',
            right:           '20px',
            backgroundColor: '#27ae60',
            color:           'white',
            padding:         '12px 20px',
            borderRadius:    '8px',
            boxShadow:       '0 4px 12px rgba(0,0,0,0.15)',
            zIndex:          '10000',
            fontFamily:      'Cairo, sans-serif',
            fontSize:        '14px',
            display:         'flex',
            alignItems:      'center',
            gap:             '10px',
            animation:       'slideInRight 0.3s ease-out',
            maxWidth:        '300px'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 3000);
    };


    // ---------------------------------------------
    // 3. السلة المشتركة (Shared Cart State)
    // ---------------------------------------------

    let cartState     = JSON.parse(localStorage.getItem('sharedCart') || '[]');
    let lastAddedItem = null;

    const cartItemsEl  = document.querySelector('.cart-items-list');
    const cartCountEl  = document.querySelector('.cart-count');
    const cartTotalEl  = document.querySelector('.cart-total');
    const finalTotalEl = document.querySelector('.final-total');

    const renderCart = () => {
        if (!cartItemsEl) return;

        const count = cartState.reduce((sum, item) => sum + (item.qty || 1), 0);
        const total = cartState.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

        if (cartCountEl)  cartCountEl.textContent  = `${count} عناصر`;
        if (cartTotalEl)  cartTotalEl.textContent  = `${total.toFixed(2)} ج.م`;
        if (finalTotalEl) finalTotalEl.textContent = `${total.toFixed(2)} ج.م`;

        localStorage.setItem('sharedCart', JSON.stringify(cartState));

        if (cartState.length === 0) {
            cartItemsEl.innerHTML = `<div class="empty-cart-msg"><p>أضف بعض الوجبات اللذيذة!</p></div>`;
            return;
        }

        cartItemsEl.innerHTML = '';

        cartState.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = `cart-item ${lastAddedItem === item.name ? 'newly-added' : ''}`;
            row.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">
                        ${item.qty} × ${item.price} = ${item.price * item.qty} ج.م
                    </div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button class="btn-minus" data-idx="${idx}">-</button>
                    <button class="btn-plus"  data-idx="${idx}">+</button>
                    <button class="btn-remove" data-idx="${idx}">×</button>
                </div>
            `;
            cartItemsEl.appendChild(row);
        });

        cartItemsEl.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                cartState.splice(parseInt(btn.dataset.idx), 1);
                renderCart();
            });
        });

        cartItemsEl.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                cartState[parseInt(btn.dataset.idx)].qty += 1;
                renderCart();
            });
        });

        cartItemsEl.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                if (cartState[idx].qty > 1) {
                    cartState[idx].qty -= 1;
                } else {
                    cartState.splice(idx, 1);
                }
                renderCart();
            });
        });
    };

    // دالة موحدة لإضافة أيتم للسلة (تمنع التكرار وتزيد الكمية)
    const addToCart = (name, price) => {
        const existing = cartState.find(item => item.name === name);
        if (existing) {
            existing.qty += 1;
        } else {
            cartState.push({ name, price, qty: 1 });
        }
        lastAddedItem = name;
        renderCart();
        showSuccessNotification(`${name} تم إضافته للسلة! 🛒`);

        const sidebar = document.querySelector('.order-sidebar');
        if (sidebar) {
            sidebar.style.animation = 'none';
            setTimeout(() => { sidebar.style.animation = 'cartPulse 0.6s ease-in-out'; }, 10);
        }
    };

    // تأثير الزر بعد الإضافة
    const animateBtn = (btn, originalText) => {
        btn.textContent           = '✅ تم الإضافة';
        btn.style.backgroundColor = '#27ae60';
        btn.style.transform       = 'scale(1.05)';
        setTimeout(() => {
            btn.textContent           = originalText;
            btn.style.backgroundColor = '';
            btn.style.transform       = '';
        }, 1500);
    };


    // ---------------------------------------------
    // 4. إدارة العروض في الصفحة الرئيسية (Home Offers)
    // ---------------------------------------------

    const initializeDefaultOffers = () => {
        if (!localStorage.getItem('homeOffers')) {
            const defaultOffers = [
                { name: 'وجبة عائلية (4 أفراد)', oldPrice: 600,  newPrice: 480, image: 'https://placehold.co/300x200?text=Family+Meal', badge: 'خصم 20%' },
                { name: 'كيلو جمبري جامبو',       oldPrice: null, newPrice: 350, image: 'https://placehold.co/300x200?text=Shrimp',      badge: null },
                { name: 'طاجن كابوريا',            oldPrice: null, newPrice: 220, image: 'https://placehold.co/300x200?text=Crab',        badge: null },
                { name: 'ميكس سي فود جريل',       oldPrice: null, newPrice: 400, image: 'https://placehold.co/300x200?text=Mix+Seafood', badge: null }
            ];
            localStorage.setItem('homeOffers', JSON.stringify(defaultOffers));
        }
    };

    const loadHomeOffers = () => {
        const offersContainer = document.querySelector('.offers-scroll-container');
        if (!offersContainer) return;

        const offers = JSON.parse(localStorage.getItem('homeOffers') || '[]');

        if (offers.length === 0) {
            offersContainer.innerHTML = '<p style="text-align:center; padding:40px; color:#666;">لا توجد عروض حالياً</p>';
            return;
        }

        offersContainer.innerHTML = offers.map(offer => `
            <div class="offer-card">
                <div class="card-image">
                    ${offer.badge ? `<span class="badge">${offer.badge}</span>` : ''}
                    <img src="${offer.image}" alt="${offer.name}">
                </div>
                <div class="card-details">
                    <h3>${offer.name}</h3>
                    <p class="price">
                        ${offer.oldPrice ? `<span class="old-price">${offer.oldPrice} ج.م</span>` : ''}
                        ${offer.newPrice} ج.م
                    </p>
                    <button class="btn-primary btn-block quick-order-btn"
                        data-name="${offer.name}"
                        data-price="${offer.newPrice}">
                        اطلب الان 🛒
                    </button>
                </div>
            </div>
        `).join('');

        // ربط الأزرار بعد إنشاء الـ HTML — نفس منطق صفحة العروض تماماً
        offersContainer.querySelectorAll('.quick-order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name  = btn.dataset.name;
                const price = parseFloat(btn.dataset.price);
                if (!name || !price) { alert('❌ خطأ في بيانات المنتج'); return; }
                addToCart(name, price);
                animateBtn(btn, 'اطلب الان 🛒');
            });
        });
    };


    // ---------------------------------------------
    // 5. أزرار "أضف للسلة" في صفحة العروض
    // ---------------------------------------------

    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const card  = btn.closest('.product-card');
            const name  = card.querySelector('h3').textContent;
            const price = extractPrice(card.querySelector('.price').textContent);
            addToCart(name, price);
            animateBtn(btn, btn.textContent);
        });
    });


    // ---------------------------------------------
    // 6. Checkout Modal
    // ---------------------------------------------

    const btnCheckout   = document.querySelector('.btn-checkout');
    const checkoutModal = document.querySelector('#checkout-modal');
    const checkoutForm  = document.querySelector('.checkout-form');

    if (btnCheckout && checkoutModal) {
        btnCheckout.addEventListener('click', () => {
            if (cartState.length === 0) { alert('⚠️ السلة فارغة!'); return; }
            checkoutModal.classList.add('active');
        });

        checkoutModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || e.target === checkoutModal) {
                checkoutModal.classList.remove('active');
            }
        });

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const aggregatedItems = cartState.map(item => ({
                    name: item.name, price: item.price, qty: item.qty || 1
                }));
                const total = cartState.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0);

                const newOrder = {
                    id:         Math.floor(Math.random() * 9000) + 1000,
                    date:       new Date().toLocaleDateString('ar-EG'),
                    status:     'active',
                    statusText: 'جاري التحضير 🍳',
                    items:      aggregatedItems,
                    total:      `${total} ج.م`
                };

                saveOrder(newOrder);
                alert('✅ تم إرسال الطلب بنجاح!');
                cartState.length = 0;
                renderCart();
                checkoutModal.classList.remove('active');
            });
        }
    }


    // ---------------------------------------------
    // 7. صفحة سجل الطلبات (Orders History)
    // ---------------------------------------------

    const historySection = document.querySelector('.orders-section.history-section');
    if (historySection) {
        const orders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        historySection.innerHTML = '<h3 class="section-subtitle">سجل الطلبات</h3>';

        if (orders.length === 0) {
            historySection.innerHTML += `
                <div class="empty-state" style="text-align:center; padding:40px;">
                    <i class="fa-solid fa-receipt" style="font-size:3rem; color:#ddd; margin-bottom:20px; display:block;"></i>
                    <p style="color:#666;">لا توجد طلبات سابقة حتى الآن.</p>
                    <a href="offers.html" class="btn-primary" style="display:inline-block; margin-top:15px; text-decoration:none;">تصفح العروض 😋</a>
                </div>`;
        } else {
            orders.forEach(order => {
                const card        = document.createElement('div');
                card.className    = `order-card ${order.status === 'active' ? 'active-order' : 'history-order'}`;
                const itemsList   = (order.items || []).map(item => `<li>${item.qty || 1}x ${item.name}</li>`).join('');
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
                        <ul class="order-items-summary">${itemsList}</ul>
                        <div class="order-total"><span>الإجمالي:</span><strong>${order.total}</strong></div>
                        <p class="order-date">📅 ${order.date}</p>
                        ${commentHtml}
                    </div>
                `;
                historySection.appendChild(card);
            });
        }
    }


    // ---------------------------------------------
    // 8. فورم الطلبات في الصفحة الرئيسية
    // ---------------------------------------------

    const homeOrderForm = document.querySelector('.order-form');
    if (homeOrderForm) {
        homeOrderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedItems = [];
            let total = 0;

            const checkboxes = homeOrderForm.querySelectorAll('input[name="offer"]:checked');
            if (checkboxes.length === 0) { alert('⚠️ من فضلك اختر وجبة واحدة على الأقل.'); return; }

            checkboxes.forEach(chk => {
                const row       = chk.closest('.offer-item');
                const labelText = chk.parentElement.textContent.trim();
                let qty = 1;
                if (row) { const qtyInput = row.querySelector('.offer-qty'); if (qtyInput) qty = parseInt(qtyInput.value) || 1; }
                const match = labelText.match(/(.+?)\s*-\s*(\d+)/);
                let name = labelText, price = 0;
                if (match) { name = match[1].trim(); price = parseFloat(match[2]); }
                else { price = extractPrice(labelText); }
                selectedItems.push({ name, qty, price });
                total += price * qty;
            });

            const newOrder = {
                id:         Math.floor(Math.random() * 9000) + 1000,
                date:       new Date().toLocaleDateString('ar-EG'),
                status:     'active',
                statusText: 'جاري التحضير 🍳',
                items:      selectedItems,
                total:      `${total} ج.م`
            };

            saveOrder(newOrder);
            alert(`🎉 تم استلام طلبك بنجاح!\nرقم الطلب: #${newOrder.id}\nيمكنك متابعة حالة الطلب في صفحة "طلباتي".`);
            homeOrderForm.reset();
        });
    }


    // ---------------------------------------------
    // 9. قائمة الأسعار (Menu Data)
    // ---------------------------------------------

    const menuData = [
        { title: '🐟 الأسماك الطازجة', items: [
            { name: 'بلطي',                  price: '68 / 80 / 750' },
            { name: 'بلطي أسواني دباشي',      price: '100' },
            { name: 'شبار أسواني',             price: '80' },
            { name: 'بوري',                   price: '140 / 190 / 210' },
            { name: 'قاروص دنيس',             price: '450' },
            { name: 'لوت',                    price: '195' },
            { name: 'قشر بياض',               price: '180' },
            { name: 'مرجان أبو شرارة',         price: '160' },
            { name: 'شعور',                   price: '350' },
            { name: 'بهار',                   price: '175' },
            { name: 'بياض نيلي',              price: '170' }
        ]},
        { title: '🦐 الجمبري والمأكولات البحرية', items: [
            { name: 'جمبري بلدي سويسي',       price: '200 / 220' },
            { name: 'جمبري بلدي',             price: '200' },
            { name: 'جمبري بلدي',             price: '220' },
            { name: 'جمبري بلدي خشابي',       price: '320' },
            { name: 'جمبري بلدي سويسي',       price: '550' },
            { name: 'جمبري بلدي جامبو',       price: '700' },
            { name: 'كالماري بلدي',           price: '180 / 200 / 300' }
        ]},
        { title: '🦀 كابوريا ومكرونة البحر', items: [
            { name: 'كيلو وربع مكرونة مغازل كبيرة', price: '100' },
            { name: 'كيلو وربع كابوريا نتي',        price: '100' },
            { name: 'كيلو ونص كابوريا دكر',         price: '100' },
            { name: 'كيلو وربع مكرونة خليجي',       price: '100' },
            { name: 'كيلو ونص مرجان خليجي',         price: '100' },
            { name: 'كابوريا نتي',                  price: '250' },
            { name: 'كابوريا دكر',                  price: '150' },
            { name: 'مكرونة سويسي',                 price: '150' },
            { name: 'مكرونة دمياطي',                price: '125' },
            { name: 'مكرونة عيون مجمدة',            price: '85'  }
        ]},
        { title: '🐠 أصناف متنوعة', items: [
            { name: 'تونة بلدي عسل نحل',     price: '120' },
            { name: 'تونة شك',               price: '120' },
            { name: 'بساريا',                price: '25'  },
            { name: 'سردين سويسي',           price: '160' },
            { name: 'سردين عماني',           price: '55'  },
            { name: 'لاشتا',                 price: '100' },
            { name: 'ماكريل',               price: '225' },
            { name: 'سهلية سويسي بالشوي',    price: '150' },
            { name: 'مرجان سويسي',           price: '120 / 150' }
        ]},
        { title: '⭐ عروض المستوى', items: [
            { name: 'كيلو مكرونة مقلي',           price: '140' },
            { name: 'كيلو بلطي مشوي (3-4 سمكات)', price: '85'  },
            { name: 'كيلو بلطي مقلي',             price: '85'  },
            { name: 'كيلو سهلية مشوي',            price: '150' },
            { name: '8 سندوتش جمبري',             price: '300', highlight: true }
        ]}
    ];

    let menuDataCurrent = JSON.parse(localStorage.getItem('menuData') || 'null');
    if (!menuDataCurrent) {
        menuDataCurrent = menuData;
        localStorage.setItem('menuData', JSON.stringify(menuDataCurrent));
    }

    const saveMenuData = () => localStorage.setItem('menuData', JSON.stringify(menuDataCurrent));

    const renderMenu = () => {
        const container = document.querySelector('#menuCardsContainer');
        if (!container) return;
        const isOffersPage  = window.location.pathname.includes('offers.html');
        const categoryClass = isOffersPage ? 'menu-category' : 'menu-category-card';
        container.innerHTML = menuDataCurrent.map(category => {
            const rows = category.items.map(item => {
                const hl = item.highlight ? ' class="highlight-row"' : '';
                return `<tr${hl}><td>${item.name}</td><td>${item.price}</td></tr>`;
            }).join('');
            return `
                <div class="${categoryClass}${category.title.includes('⭐') ? ' special-offers' : ''}">
                    <h4>${category.title}</h4>
                    <table class="menu-table">
                        <thead><tr><th>الصنف</th><th>السعر (جنيه)</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
        }).join('');
    };

    const renderMenuAdmin = () => {
        const menuList = document.getElementById('menuList');
        if (!menuList) return;
        menuList.innerHTML = menuDataCurrent.map((category, ci) => `
            <div class="offer-item">
                <div class="offer-header">
                    <div class="offer-title">${category.title}</div>
                    <div class="offer-actions">
                        <button class="btn btn-edit"   onclick="editMenuCategory(${ci})"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="btn btn-delete" onclick="deleteMenuCategory(${ci})"><i class="fas fa-trash"></i> حذف</button>
                    </div>
                </div>
                <div class="offer-details">
                    ${category.items.map((item, ii) => `
                        <div class="detail-item">
                            <div class="detail-label">${item.name}</div>
                            <div class="detail-value">${item.price} ج.م ${item.highlight ? '<span style="color:#e74c3c;font-size:.85rem;"> (مميز)</span>' : ''}</div>
                            <div style="margin-top:8px; display:flex; gap:8px;">
                                <button class="btn btn-edit"   onclick="editMenuItem(${ci},${ii})">تعديل صنف</button>
                                <button class="btn btn-delete" onclick="deleteMenuItem(${ci},${ii})">حذف صنف</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-add" style="margin-top:10px;" onclick="addMenuItem(${ci})">إضافة صنف جديد</button>
            </div>
        `).join('');
    };

    window.addPriceCategory = () => {
        const title = prompt('أدخل اسم القسم الجديد');
        if (!title) return;
        menuDataCurrent.push({ title, items: [] });
        saveMenuData(); renderMenu(); renderMenuAdmin();
    };

    window.editMenuCategory = (ci) => {
        const title = prompt('تعديل اسم القسم', menuDataCurrent[ci].title);
        if (!title) return;
        menuDataCurrent[ci].title = title;
        saveMenuData(); renderMenu(); renderMenuAdmin();
    };

    window.deleteMenuCategory = (ci) => {
        if (!confirm('هل تريد حذف القسم بالكامل؟')) return;
        menuDataCurrent.splice(ci, 1);
        saveMenuData(); renderMenu(); renderMenuAdmin();
    };

    window.addMenuItem = (ci) => {
        const name      = prompt('اسم الصنف');       if (!name)  return;
        const price     = prompt('سعر الصنف (ج.م)'); if (!price) return;
        const highlight = confirm('هل هذا الصنف مميز؟');
        menuDataCurrent[ci].items.push({ name, price, highlight });
        saveMenuData(); renderMenu(); renderMenuAdmin();
    };

    window.editMenuItem = (ci, ii) => {
        const item  = menuDataCurrent[ci].items[ii];
        const name  = prompt('تعديل اسم الصنف', item.name);  if (!name)  return;
        const price = prompt('تعديل السعر', item.price);       if (!price) return;
        const highlight = confirm('اجعل هذا الصنف مميز؟');
        item.name = name; item.price = price; item.highlight = highlight;
        saveMenuData(); renderMenu(); renderMenuAdmin();
    };

    window.deleteMenuItem = (ci, ii) => {
        if (!confirm('هل تريد حذف هذا الصنف؟')) return;
        menuDataCurrent[ci].items.splice(ii, 1);
        saveMenuData(); renderMenu(); renderMenuAdmin();
    };


    // ---------------------------------------------
    // تشغيل أولي عند تحميل الصفحة
    // ---------------------------------------------
    initializeDefaultOffers();
    loadHomeOffers();
    renderMenu();
    renderMenuAdmin();
    renderCart();

});