document.addEventListener('DOMContentLoaded', () => {
    const safeLocalStorage = {
        getItem(key) { try { return localStorage.getItem(key); } catch (e) { console.warn('localStorage недоступен:', e); return null; } },
        setItem(key, value) { try { localStorage.setItem(key, value); } catch (e) { console.warn('Не удалось сохранить в localStorage:', e); } },
        removeItem(key) { try { localStorage.removeItem(key); } catch (e) { console.warn('Не удалось удалить из localStorage:', e); } }
    };

    const API_BASE = 'https://localhost:7015/api';

    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[m]));
    }

    function getAuthToken() {
        return safeLocalStorage.getItem('authToken');
    }

    async function apiFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (getAuthToken()) {
            headers['Authorization'] = `Bearer ${getAuthToken()}`;
        }
        const config = { ...options, headers };
        const res = await fetch(`${API_BASE}${url}`, config);
        if (!res.ok) {
            const errorText = await res.text().catch(() => 'Unknown error');
            throw new Error(`API error ${res.status}: ${errorText}`);
        }
        return res;
    }

    function openModal(modal) {
        if (modal) modal.classList.add('active');
    }
    function closeModal(modal) {
        if (modal) modal.classList.remove('active');
    }

    //Корзина
    let cart = [];
    try {
        const stored = safeLocalStorage.getItem('cart');
        cart = stored ? JSON.parse(stored) : [];
    } catch (e) { cart = []; }

    function updateCartUI() {
        const basketItemsContainer = document.querySelector('.basket-items');
        const totalValueEl = document.querySelector('.total-value');
        const basketEmptyEl = document.getElementById('basket-empty');
        const basketCounter = document.getElementById('basket-counter');

        if (!basketItemsContainer || !totalValueEl) return;

        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        if (basketCounter) {
            basketCounter.textContent = totalItems;
            basketCounter.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        if (cart.length === 0) {
            if (basketEmptyEl) basketEmptyEl.style.display = 'block';
            basketItemsContainer.innerHTML = '';
            totalValueEl.textContent = '0 ₽';
            return;
        }
        if (basketEmptyEl) basketEmptyEl.style.display = 'none';

        let basketHTML = '';
        let total = 0;
        cart.forEach((item, index) => {
            const qty = item.quantity || 1;
            total += (item.price || 0) * qty;
            basketHTML += `
                <div class="basket-item" data-index="${index}">
                    <div class="item-image">
                        <img src="${escapeHtml(item.img || 'image/image 13.png')}" alt="${escapeHtml(item.name)}" loading="lazy">
                    </div>
                    <div class="item-info">
                        <h3 class="item-title">${escapeHtml(item.name)}</h3>
                        <p class="item-desc">${escapeHtml(item.desc)}</p>
                        <div class="item-controls">
                            <button class="quantity-btn dec">−</button>
                            <span class="quantity-value">${qty}</span>
                            <button class="quantity-btn inc">+</button>
                            <button class="remove-btn">×</button>
                        </div>
                    </div>
                    <div class="item-price">${(item.price || 0) * qty} ₽</div>
                </div>
            `;
        });
        basketItemsContainer.innerHTML = basketHTML;
        totalValueEl.textContent = `${total} ₽`;
    }

    function addToCart(product) {
        const existingIndex = cart.findIndex(item => 
            (item.id && product.id && item.id === product.id) ||
            (item.name === product.name && !product.id)
        );
        if (existingIndex >= 0) {
            cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        safeLocalStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
    }

    //Авторизация
    const authBtn = document.getElementById('auth-btn');
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    const ordersBtn = document.getElementById('orders-btn');
    const authModal = document.getElementById('auth-modal');
    const profileModal = document.getElementById('profile-modal');

    async function login(email, password) {
        const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        safeLocalStorage.setItem('authToken', data.token);
        safeLocalStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
    }

    async function register(name, email, password) {
        await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        const user = { name, email, role: 'user' };
        safeLocalStorage.setItem('user', JSON.stringify(user));
        return user;
    }

    function logout() {
        safeLocalStorage.removeItem('authToken');
        safeLocalStorage.removeItem('user');
        safeLocalStorage.removeItem('cart');
        cart = [];
        closeModal(profileModal);
    }

    function updateAuthButton() {
        const userStr = safeLocalStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (authBtn) {
            authBtn.textContent = user ? 'Личный кабинет' : 'Войти';
        }
        if (adminPanelBtn) {
            adminPanelBtn.style.display = (user && user.role === 'manager') ? 'inline-block' : 'none';
        }
        if (ordersBtn) {
            ordersBtn.style.display = (user && ['manager', 'pastry_chef'].includes(user.role)) ? 'inline-block' : 'none';
        }
        loadNotifications();
    }

    //Загрузка данных
    async function loadReviews() {
        try {
            const res = await fetch(`${API_BASE}/reviews`);
            const reviews = await res.json();
            safeLocalStorage.setItem('reviews', JSON.stringify(reviews));
            renderReviews();
        } catch (e) {
            console.error('Failed to load reviews:', e);
        }
    }

    async function loadCatalog() {
        try {
            const categories = ['cheesecakes', 'cakes', 'other'];
            const catalogData = {};
            for (const cat of categories) {
                const res = await fetch(`${API_BASE}/products?category=${cat}`);
                catalogData[cat] = await res.json();
            }
            safeLocalStorage.setItem('catalogData', JSON.stringify(catalogData));
            renderCatalog(document.getElementById('category-select')?.value || 'cheesecakes');
        } catch (e) {
            console.error('Failed to load catalog:', e);
        }
    }

    async function loadComponents() {
        try {
            const [fillingsRes, cakeBasesRes] = await Promise.all([
                fetch(`${API_BASE}/components/fillings`),
                fetch(`${API_BASE}/components/cakeBases`)
            ]);
            const fillings = await fillingsRes.json();
            const cakeBases = await cakeBasesRes.json();
            safeLocalStorage.setItem('fillings', JSON.stringify(fillings.map(f => f.name)));
            safeLocalStorage.setItem('cakeBases', JSON.stringify(cakeBases.map(b => b.name)));
            updateAllConstructorSelects();
            renderComponentList('fillings-list', fillings, 'filling');
            renderComponentList('cake-bases-list', cakeBases, 'cake_base');
        } catch (e) {
            console.error('Failed to load components:', e);
        }
    }

    async function loadNotifications() {
        try {
            const token = getAuthToken();
            if (!token) {
                renderNotifications();
                return;
            }
            const res = await apiFetch('/notifications');
            const notifications = await res.json();
            safeLocalStorage.setItem('notifications', JSON.stringify(notifications));
            renderNotifications();
            updateNotificationsBadge();
        } catch (e) {
            console.error('Failed to load notifications:', e);
        }
    }

    async function loadOrdersForAdmin() {
        try {
            const res = await apiFetch('/orders');
            const orders = await res.json();
            safeLocalStorage.setItem('orders', JSON.stringify(orders));
            renderOrders();
        } catch (e) {
            alert('Ошибка загрузки заказов: ' + e.message);
        }
    }

    //Рендеринг
    function renderReviews() {
        const reviewsList = document.getElementById('reviews-list');
        if (!reviewsList) return;
        try {
            const stored = safeLocalStorage.getItem('reviews');
            const reviews = stored ? JSON.parse(stored) : [];
            reviewsList.innerHTML = '';
            const userStr = safeLocalStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const isManager = user && user.role === 'manager';
            reviews.forEach(review => {
                const card = document.createElement('div');
                card.className = 'review-card';
                card.dataset.id = review.id;
                const deleteBtn = isManager ? `<button class="delete-review-btn" data-id="${review.id}">×</button>` : '';
                card.innerHTML = `${deleteBtn}<h4>${escapeHtml(review.authorName || 'Аноним')}</h4><p>${escapeHtml(review.text)}</p>`;
                reviewsList.appendChild(card);
            });
        } catch (e) {
            reviewsList.innerHTML = '<p>Ошибка загрузки отзывов</p>';
        }
    }

    function renderCatalog(category) {
        const catalogGrid = document.getElementById('catalog-grid');
        if (!catalogGrid) return;
        try {
            const stored = safeLocalStorage.getItem('catalogData');
            const catalogData = stored ? JSON.parse(stored) : {};
            const items = catalogData[category] || [];
            catalogGrid.innerHTML = '';
            const userStr = safeLocalStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const isManager = user && user.role === 'manager';
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'cheesecake-card';
                card.dataset.id = item.id;
                card.dataset.name = item.name;
                card.dataset.desc = item.description;
                card.dataset.price = item.price;
                card.dataset.img = item.imageUrl;
                card.dataset.weight = item.weight;
                card.dataset.category = category;
                const adminButtons = isManager ?
                    `<button class="delete-product-btn" data-id="${item.id}" data-category="${category}">×</button>
                     <button class="edit-product-btn" data-id="${item.id}" data-category="${category}">✎</button>` : '';
                card.innerHTML = `
                    <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" loading="lazy">
                    ${adminButtons}
                    <h3>${escapeHtml(item.name)}</h3>
                    <p>${escapeHtml(item.description)}</p>
                    <div class="price-tag">
                        <span class="weight-badge">${escapeHtml(item.weight)}</span>
                        <span class="price">${item.price} ₽</span>
                    </div>
                    <div class="card-actions">
                        <button type="button" class="btn add-to-cart">В корзину</button>
                    </div>
                `;
                catalogGrid.appendChild(card);
            });

            document.querySelectorAll('.add-to-cart').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.target.closest('.cheesecake-card');
                    if (!card) return;
                    const product = {
                        id: parseInt(card.dataset.id),
                        name: card.dataset.name,
                        desc: card.dataset.desc,
                        price: parseInt(card.dataset.price),
                        img: card.dataset.img,
                        weight: card.dataset.weight
                    };
                    addToCart(product);
                });
            });

            document.querySelectorAll('.delete-product-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    if (confirm('Удалить товар?')) {
                        try {
                            await apiFetch(`/products/${id}`, { method: 'DELETE' });
                            loadCatalog();
                            alert('Товар удалён!');
                        } catch (e) {
                            alert('Ошибка удаления: ' + e.message);
                        }
                    }
                });
            });

            document.querySelectorAll('.edit-product-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    const category = btn.dataset.category;
                    editProduct(id, category);
                });
            });
        } catch (e) {
            catalogGrid.innerHTML = '<p>Ошибка загрузки каталога</p>';
        }
    }

    function renderOrders() {
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) return;
        try {
            const stored = safeLocalStorage.getItem('orders');
            const orders = stored ? JSON.parse(stored) : [];
            ordersList.innerHTML = '';

            if (orders.length === 0) {
                ordersList.innerHTML = '<p style="text-align: center; padding: 20px;">Нет заказов</p>';
                return;
            }

            orders.forEach(order => {
                const deliveryDate = new Date(order.desiredDeliveryDate).toLocaleDateString('ru-RU');
                let itemsHtml = '';
                if (order.orderItems && order.orderItems.length > 0) {
                    order.orderItems.forEach(item => {
                        const name = item.productId 
                            ? `Готовый товар: ${item.product?.name || '—'}`
                            : `Кастомный торт: ${item.customCake?.name || 'Индивидуальный торт'}`;
                        itemsHtml += `<div>• ${name} × ${item.quantity}</div>`;
                    });
                } else {
                    itemsHtml = '<em>Нет позиций</em>';
                }

                const row = document.createElement('div');
                row.className = 'order-row';
                row.style.border = '1px solid #eee';
                row.style.padding = '16px';
                row.style.marginBottom = '12px';
                row.style.borderRadius = '8px';
                row.innerHTML = `
    <h3>Заказ #${order.id} — ${order.totalAmount} ₽</h3>
    <p><strong>Статус:</strong> 
        <select class="status-select" data-id="${order.id}">
            <option value="Новый" ${order.status === 'Новый' ? 'selected' : ''}>Новый</option>
            <option value="В работе" ${order.status === 'В работе' ? 'selected' : ''}>В работе</option>
            <option value="Готов" ${order.status === 'Готов' ? 'selected' : ''}>Готов</option>
            <option value="Выдан" ${order.status === 'Выдан' ? 'selected' : ''}>Выдан</option>
        </select>
    </p>
    <p><strong>Дата выполнения:</strong> ${deliveryDate}</p>
    <p><<strong>Состав заказа:</strong></p>
    <div style="margin-left: 20px; margin-top: 8px;">
        ${itemsHtml}
    </div>
`;
                ordersList.appendChild(row);
            });

            // Смена статуса
            document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const id = parseInt(select.dataset.id);
                    const status = select.value;
                    try {
                        await apiFetch(`/orders/${id}/status`, {
                            method: 'PUT',
                            body: JSON.stringify({ status })
                        });
                        alert('Статус обновлён!');
                    } catch (e) {
                        alert('Ошибка: ' + e.message);
                        loadOrdersForAdmin();
                    }
                });
            });

        } catch (e) {
            console.error('Ошибка рендеринга заказов:', e);
            ordersList.innerHTML = '<p>Ошибка загрузки заказов</p>';
        }
    }

    function renderNotifications() {
        const notificationsListEl = document.getElementById('notifications-list');
        if (!notificationsListEl) return;
        try {
            const stored = safeLocalStorage.getItem('notifications');
            const notifications = stored ? JSON.parse(stored) : [];
            const userStr = safeLocalStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (!user) {
                notificationsListEl.innerHTML = '<p style="text-align: center; color: #888;">Войдите, чтобы видеть уведомления.</p>';
                const notificationForm = document.getElementById('notification-form');
                if (notificationForm) notificationForm.style.display = 'none';
                return;
            }

            if (notifications.length === 0) {
                notificationsListEl.innerHTML = '<p style="text-align: center; color: #888;">Нет уведомлений.</p>';
            } else {
                let html = '';
                notifications.forEach(n => {
                    html += `
                        <div class="notification-item" style="padding: 12px; border-bottom: 1px solid #eee;">
                            <strong>${escapeHtml(n.title)}</strong><br>
                            <small>${new Date(n.sentAt).toLocaleString()}</small>
                            <p>${escapeHtml(n.text)}</p>
                        </div>
                    `;
                });
                notificationsListEl.innerHTML = html;
            }

            const notificationForm = document.getElementById('notification-form');
            if (notificationForm) {
                notificationForm.style.display = (user.role === 'manager') ? 'block' : 'none';
            }
        } catch (e) {
            notificationsListEl.innerHTML = '<p>Ошибка загрузки уведомлений</p>';
        }
    }

    function updateNotificationsBadge() {
        const badge = document.getElementById('notifications-badge');
        if (!badge) return;
        const userStr = safeLocalStorage.getItem('user');
        if (!userStr) {
            badge.style.display = 'none';
            return;
        }
        try {
            const stored = safeLocalStorage.getItem('notifications');
            const notifications = stored ? JSON.parse(stored) : [];
            const unreadCount = notifications.filter(n => !n.isRead).length;
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        } catch (e) {
            badge.style.display = 'none';
        }
    }

    //рендеринг списка компонентов в админке
    function renderComponentList(containerId, items, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '6px 0';
            div.style.borderBottom = '1px solid #eee';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.style.width = '20px';
            deleteBtn.style.height = '20px';
            deleteBtn.style.borderRadius = '50%';
            deleteBtn.style.background = '#ff4d4d';
            deleteBtn.style.color = 'white';
            deleteBtn.style.border = 'none';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Удалить "${item.name}"?`)) {
                    try {
                        await apiFetch(`/components/${item.id}`, { method: 'DELETE' });
                        loadComponents();
                        alert('Компонент удалён!');
                    } catch (e) {
                        alert('Ошибка удаления: ' + e.message);
                    }
                }
            });

            div.appendChild(nameSpan);
            div.appendChild(deleteBtn);
            container.appendChild(div);
        });
    }

    //Инициализация
    updateAuthButton();
    loadReviews();
    loadCatalog();
    loadComponents();
    updateCartUI();
    updateNotificationsBadge();

    //Обработчики
    if (authBtn) {
        authBtn.addEventListener('click', () => {
            const userStr = safeLocalStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                document.getElementById('profile-name').textContent = escapeHtml(user.fullName || user.name);
                document.getElementById('profile-email').textContent = escapeHtml(user.email);
                document.getElementById('profile-role').textContent = 
                    user.role === 'manager' ? 'Менеджер' :
                    user.role === 'pastry_chef' ? 'Кондитер' : 'Пользователь';
                openModal(profileModal);
            } else {
                openModal(authModal);
            }
        });
    }

    const loginSubmit = document.getElementById('login-submit');
    if (loginSubmit) {
        loginSubmit.addEventListener('click', async () => {
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value;
            if (!email || !password) {
                alert('Заполните все поля');
                return;
            }
            try {
                await login(email, password);
                alert('Вход выполнен!');
                closeModal(authModal);
                updateAuthButton();
                loadCatalog();
                loadReviews();
            } catch (e) {
                alert('Ошибка входа: ' + e.message);
            }
        });
    }

    const registerSubmit = document.getElementById('register-submit');
    if (registerSubmit) {
        registerSubmit.addEventListener('click', async () => {
            const name = document.getElementById('register-name')?.value.trim();
            const email = document.getElementById('register-email')?.value.trim();
            const password = document.getElementById('register-password')?.value;
            if (!name || !email || !password) {
                alert('Заполните все поля');
                return;
            }
            try {
                await register(name, email, password);
                alert('Регистрация успешна!');
                closeModal(authModal);
                updateAuthButton();
                loadCatalog();
                loadReviews();
            } catch (e) {
                alert('Ошибка регистрации: ' + e.message);
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            updateAuthButton();
            updateCartUI();
            loadReviews();
            alert('Вы вышли из аккаунта');
        });
    }

    // Открытие корзины
    setTimeout(() => {
        const openBasketBtn = document.getElementById('open-basket');
        const basketModal = document.getElementById('basket-modal');
        if (openBasketBtn && basketModal) {
            openBasketBtn.addEventListener('click', () => {
                updateCartUI();
                openModal(basketModal);
            });
        }
    });

    document.addEventListener('click', (e) => {
        const basketItem = e.target.closest('.basket-item');
        if (!basketItem) return;
        const index = parseInt(basketItem.dataset.index);
        if (e.target.classList.contains('dec')) {
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
            } else {
                cart.splice(index, 1);
            }
            safeLocalStorage.setItem('cart', JSON.stringify(cart));
            updateCartUI();
        }
        if (e.target.classList.contains('inc')) {
            cart[index].quantity = (cart[index].quantity || 1) + 1;
            safeLocalStorage.setItem('cart', JSON.stringify(cart));
            updateCartUI();
        }
        if (e.target.classList.contains('remove-btn')) {
            if (confirm('Удалить товар из корзины?')) {
                cart.splice(index, 1);
                safeLocalStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
            }
        }
    });

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            const userStr = safeLocalStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user) {
                alert('Пожалуйста, войдите в аккаунт, чтобы оформить заказ.');
                closeModal(basketModal);
                openModal(authModal);
                return;
            }
            if (user.role !== 'user') {
                alert('Только клиенты могут оформлять заказы.');
                return;
            }
            if (cart.length === 0) {
                alert('Корзина пуста!');
                return;
            }
            const deliveryDateInput = document.getElementById('delivery-date');
            const deliveryDate = deliveryDateInput?.value;
            if (!deliveryDate) {
                alert('Укажите дату получения');
                return;
            }
            const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
            try {
                const orderData = {
                    total,
                    deliveryAddress: "ул. Сыромолотова, 12",
                    comments: "",
                    deliveryDate,
                    items: cart.map(item => ({
                        productId: item.id && item.id <= 9 ? item.id : null,
                        name: item.name,
                        description: item.desc,
                        weight: parseFloat(item.weight) || 1.0,
                        price: item.price,
                        quantity: item.quantity || 1
                    }))
                };
                const res = await apiFetch('/orders', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });
                const order = await res.json();
                cart = [];
                safeLocalStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
                closeModal(basketModal);
                alert('Заказ оформлен!');
                loadNotifications();
            } catch (e) {
                alert('Ошибка оформления заказа: ' + e.message);
            }
        });
    }

    // Отзывы
    const submitReviewBtn = document.getElementById('submit-review');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', async () => {
            const nameInput = document.getElementById('review-name');
            const textInput = document.getElementById('review-text');
            const name = nameInput?.value.trim();
            const text = textInput?.value.trim();
            if (!name || !text) {
                alert('Пожалуйста, заполните все поля.');
                return;
            }
            try {
                await apiFetch('/reviews', {
                    method: 'POST',
                    body: JSON.stringify({ authorName: name, text })
                });
                nameInput.value = '';
                textInput.value = '';
                loadReviews();
                alert('Отзыв добавлен!');
            } catch (e) {
                alert('Ошибка добавления отзыва: ' + e.message);
            }
        });
    }

    // Удаление отзыва
    document.addEventListener('click', (e) => {
        const deleteReviewBtn = e.target.closest('.delete-review-btn');
        if (deleteReviewBtn) {
            e.stopPropagation();
            const id = parseInt(deleteReviewBtn.dataset.id, 10);
            if (confirm('Удалить этот отзыв?')) {
                apiFetch(`/reviews/${id}`, { method: 'DELETE' })
                    .then(() => {
                        loadReviews();
                        alert('Отзыв успешно удалён!');
                    })
                    .catch(e => {
                        alert('Ошибка удаления: ' + e.message);
                    });
            }
            return;
        }
    });

    // Уведомления
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsModal = document.getElementById('notifications-modal');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            loadNotifications();
            if (notificationsModal) openModal(notificationsModal);
        });
    }

    const clearNotificationsBtn = document.getElementById('clear-notifications-btn');
    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', async () => {
            if (!getAuthToken()) {
                alert('Вы не авторизованы');
                return;
            }
            if (confirm('Очистить все уведомления? Это действие нельзя отменить.')) {
                try {
                    await apiFetch('/notifications/clear', { method: 'DELETE' });
                    loadNotifications();
                    alert('Уведомления очищены!');
                } catch (e) {
                    alert('Ошибка очистки: ' + e.message);
                }
            }
        });
    }

    // Отправка уведомления по email
    const sendNotificationBtn = document.getElementById('send-notification');
    if (sendNotificationBtn) {
        sendNotificationBtn.addEventListener('click', async () => {
            const email = document.getElementById('notify-email')?.value.trim();
            const title = document.getElementById('notify-title')?.value.trim();
            const text = document.getElementById('notify-text')?.value.trim();
            if (!email || !title || !text) {
                alert('Заполните все поля');
                return;
            }
            try {
                await apiFetch('/notifications/send-by-email', {
                    method: 'POST',
                    body: JSON.stringify({ email, title, text })
                });
                alert('Уведомление отправлено!');
                document.getElementById('notify-email').value = '';
                document.getElementById('notify-title').value = '';
                document.getElementById('notify-text').value = '';
                loadNotifications();
            } catch (e) {
                alert('Ошибка отправки: ' + e.message);
            }
        });
    }

    //Админка
    function editProduct(id, category) {
        const stored = safeLocalStorage.getItem('catalogData');
        const catalogData = stored ? JSON.parse(stored) : {};
        const items = catalogData[category] || [];
        const product = items.find(p => p.id === id);

        if (!product) {
            alert('Товар не найден');
            return;
        }

        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('admin-product-name').value = product.name;
        document.getElementById('admin-product-desc').value = product.description;
        document.getElementById('admin-product-price').value = product.price;
        document.getElementById('admin-product-weight').value = product.weight;
        document.getElementById('admin-product-category').value = category;
        document.getElementById('admin-product-img').value = product.imageUrl || '';

        document.getElementById('add-product-btn').textContent = 'Сохранить изменения';
        openModal(document.getElementById('admin-modal'));
    }

    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', async () => {
            const editId = document.getElementById('edit-product-id')?.value;
            const name = document.getElementById('admin-product-name')?.value.trim();
            const desc = document.getElementById('admin-product-desc')?.value.trim();
            const price = parseFloat(document.getElementById('admin-product-price')?.value) || 0;
            const weight = document.getElementById('admin-product-weight')?.value.trim();
            const category = document.getElementById('admin-product-category')?.value;
            const img = document.getElementById('admin-product-img')?.value.trim();

            if (!name || !desc || !price || !weight || !category) {
                alert('Заполните все обязательные поля');
                return;
            }

            try {
                if (editId) {
                    await apiFetch(`/products/${editId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            name, description: desc, price, weight, imageurl: img || null, category
                        })
                    });
                    alert('Товар обновлён!');
                } else {
                    await apiFetch('/products', {
                        method: 'POST',
                        body: JSON.stringify({
                            name, description: desc, price, weight, imageurl: img || null, category
                        })
                    });
                    alert('Товар добавлен!');
                }
                loadCatalog();
                clearAdminForm();
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        });
    }

    function clearAdminForm() {
        document.getElementById('edit-product-id').value = '';
        document.getElementById('admin-product-name').value = '';
        document.getElementById('admin-product-desc').value = '';
        document.getElementById('admin-product-price').value = '';
        document.getElementById('admin-product-weight').value = '';
        document.getElementById('admin-product-img').value = '';
        document.getElementById('admin-product-category').value = 'cheesecakes';
        document.getElementById('add-product-btn').textContent = 'Добавить товар';
    }

    document.getElementById('admin-add-filling-btn')?.addEventListener('click', async () => {
        const input = document.getElementById('new-filling-name');
        const name = input?.value.trim();
        if (!name) {
            alert('Введите название начинки');
            return;
        }
        try {
            await apiFetch('/components/fillings', {
                method: 'POST',
                body: JSON.stringify({ name, type: 'filling' })
            });
            alert('Начинка добавлена!');
            input.value = '';
            loadComponents();
        } catch (e) {
            alert('Ошибка: ' + e.message);
        }
    });

    document.getElementById('admin-add-cake-base-btn')?.addEventListener('click', async () => {
        const input = document.getElementById('new-cake-base-name');
        const name = input?.value.trim();
        if (!name) {
            alert('Введите название бисквита');
            return;
        }
        try {
            await apiFetch('/components/cakeBases', {
                method: 'POST',
                body: JSON.stringify({ name, type: 'cake_base' })
            });
            alert('Бисквит добавлен!');
            input.value = '';
            loadComponents();
        } catch (e) {
            alert('Ошибка: ' + e.message);
        }
    });

    //Конструктор
    const fillingContainer = document.getElementById('filling-container');
    const cakeBaseContainer = document.getElementById('cake-base-container');

    function addField(container, type) {
        const newIndex = container.querySelectorAll('select').length;
        const wrapper = document.createElement('div');
        wrapper.className = 'component-field-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.gap = '8px';
        wrapper.style.alignItems = 'center';
        wrapper.style.marginTop = '8px';

        const select = document.createElement('select');
        select.id = `${type}-${newIndex}`;
        select.className = 'component-select';
        select.innerHTML = `<option value="" disabled selected>Выберите ${type === 'filling' ? 'начинку' : 'бисквит'}...</option>`;
        
        const options = safeLocalStorage.getItem(type === 'filling' ? 'fillings' : 'cakeBases');
        const list = options ? JSON.parse(options) : [];
        list.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
            select.appendChild(option);
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.style.width = '24px';
        removeBtn.style.height = '24px';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.background = '#ff4d4d';
        removeBtn.style.color = 'white';
        removeBtn.style.border = 'none';
        removeBtn.style.cursor = 'pointer';
        removeBtn.addEventListener('click', () => {
            wrapper.remove();
            updateConstructorPrice();
        });

        wrapper.appendChild(select);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
        updateConstructorPrice();
    }

    document.getElementById('add-filling-btn')?.addEventListener('click', () => {
        addField(fillingContainer, 'filling');
    });

    document.getElementById('add-cake-base-btn')?.addEventListener('click', () => {
        addField(cakeBaseContainer, 'cake_base');
    });

    //Конструктор
    const weightInput = document.getElementById('weight');
    const totalPriceEl = document.getElementById('total-price');
    const designNotesTextarea = document.getElementById('design-notes');
    const BASE_PRICE_PER_KG = 950;
    const EXTRA_FILLING_PRICE = 300;
    const EXTRA_CAKE_BASE_PRICE = 200;

    function updateConstructorPrice() {
        if (!weightInput) return;
        
        const weight = parseFloat(weightInput.value) || 1;
        const hasMainFilling = !!document.getElementById('filling-0')?.value;
        const hasMainCakeBase = !!document.getElementById('cake-base-0')?.value;
        
        const extraFillings = fillingContainer ? fillingContainer.querySelectorAll('select').length : 0;
        const extraCakeBases = cakeBaseContainer ? cakeBaseContainer.querySelectorAll('select').length : 0;

        let total = weight * BASE_PRICE_PER_KG;
        if (hasMainFilling || hasMainCakeBase) {
            total += extraFillings * EXTRA_FILLING_PRICE;
            total += extraCakeBases * EXTRA_CAKE_BASE_PRICE;
        }
        totalPriceEl.textContent = `${Math.round(total)} ₽`;
    }

    if (weightInput) {
        weightInput.addEventListener('input', updateConstructorPrice);
    }

    const constructorAddBtn = document.getElementById('add-constructor-to-cart');
    if (constructorAddBtn) {
        constructorAddBtn.addEventListener('click', () => {
            const rawWeight = weightInput.value.trim();
            let weight = 1;
            if (rawWeight !== '') {
                weight = Math.max(0.5, parseFloat(rawWeight) || 1);
            }
            const deliveryDate = document.getElementById('delivery-date')?.value;
            if (!deliveryDate) {
                alert('Укажите дату получения');
                return;
            }
            const designNotes = designNotesTextarea.value.trim();
            const mainFillingSelect = document.getElementById('filling-0');
            const mainFilling = mainFillingSelect?.value ? mainFillingSelect.options[mainFillingSelect.selectedIndex].text : null;
            const extraFillings = Array.from(fillingContainer.querySelectorAll('select')).map(sel => sel.value ? sel.options[sel.selectedIndex].text : null).filter(Boolean);
            const mainCakeBaseSelect = document.getElementById('cake-base-0');
            const mainCakeBase = mainCakeBaseSelect?.value ? mainCakeBaseSelect.options[mainCakeBaseSelect.selectedIndex].text : null;
            const extraCakeBases = Array.from(cakeBaseContainer.querySelectorAll('select')).map(sel => sel.value ? sel.options[sel.selectedIndex].text : null).filter(Boolean);

            let descParts = [];
            if (mainCakeBase) descParts.push(`Бисквит: ${mainCakeBase}`);
            if (extraCakeBases.length) descParts.push(`Доп. бисквиты: ${extraCakeBases.join(', ')}`);
            if (mainFilling) descParts.push(`Начинка: ${mainFilling}`);
            if (extraFillings.length) descParts.push(`Доп. начинки: ${extraFillings.join(', ')}`);
            if (designNotes) descParts.push(`Пожелания: ${designNotes}`);
            const description = descParts.join('. ') || 'Индивидуальный торт без указания деталей';
            const price = parseInt(totalPriceEl.textContent) || 950;

            const customCake = {
                name: `Индивидуальный торт (${weight} кг)`,
                desc: description,
                price: price,
                img: 'image/image 13.png',
                weight: `${weight} кг`
            };
            addToCart(customCake);
            openModal(basketModal);
            weightInput.value = 1;
            if (mainFillingSelect) mainFillingSelect.selectedIndex = 0;
            if (mainCakeBaseSelect) mainCakeBaseSelect.selectedIndex = 0;
            designNotesTextarea.value = '';
            fillingContainer.innerHTML = '';
            cakeBaseContainer.innerHTML = '';
            updateConstructorPrice();
        });
    }

    // Открытие админки и заказов
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', () => {
            loadCatalog();
            openModal(document.getElementById('admin-modal'));
        });
    }

    if (ordersBtn) {
        ordersBtn.addEventListener('click', () => {
            loadOrdersForAdmin();
            openModal(document.getElementById('orders-modal'));
        });
    }

    // Смена категории каталога
    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => renderCatalog(e.target.value));
    }

    // Закрытие модалок
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeModal(e.target);
        if (e.target.classList.contains('modal-close')) closeModal(e.target.closest('.modal-overlay'));
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => closeModal(modal));
        }
    });

    // Инициализация даты
    const deliveryDateInput = document.getElementById('delivery-date');
    if (deliveryDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        deliveryDateInput.min = `${yyyy}-${mm}-${dd}`;
        deliveryDateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // Обновление селектов конструктора
    function updateAllConstructorSelects() {
        const fillingsStr = safeLocalStorage.getItem('fillings');
        const cakeBasesStr = safeLocalStorage.getItem('cakeBases');
        const fillings = fillingsStr ? JSON.parse(fillingsStr) : [];
        const cakeBases = cakeBasesStr ? JSON.parse(cakeBasesStr) : [];

        function populateSelect(selectId, options) {
            const select = document.getElementById(selectId);
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Выберите...</option>';
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
                select.appendChild(option);
            });
        }

        populateSelect('filling-0', fillings);
        populateSelect('cake-base-0', cakeBases);
    }

    updateAllConstructorSelects();
});