/* Danchukes-store: товари, каталог, кошик і відправка замовлення.
   Кошик зберігається в браузері (localStorage), тому не зникає при переході між сторінками.

   ЩОБ ДОДАТИ АБО ЗМІНИТИ ТОВАР — правте лише список PRODUCTS нижче.
   Він сам з'явиться на головній (якщо додати id у HOME_PRODUCTS), у каталозі,
   на сторінці товару, у кошику і в листі із замовленням. */

/* Ключ Web3Forms: замовлення приходять листом на пошту, до якої прив'язаний ключ. */
const WEB3FORMS_KEY = 'cdfbf2b9-0872-41b8-b27c-988ae5eebca9';

const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

/* sizes — розміри в наявності. Яких немає в списку, на сторінці товару будуть закреслені.
   Наприклад: sizes: [38, 39, 40, 42] */
const PRODUCTS = [
    { id: 'puma-speedcat',  brand: 'Puma',        name: 'Puma Speedcat',                  price: 3500, img: 'img/1.jpg', sizes: ALL_SIZES },
    { id: 'nike-acg-khaki', brand: 'Nike',        name: 'Nike ACG (колір хакі / оливка)', price: 4200, img: 'img/2.jpg', sizes: ALL_SIZES },
    { id: 'nike-acg-black', brand: 'Nike',        name: 'Nike ACG (чорний колір)',        price: 4300, img: 'img/3.jpg', sizes: ALL_SIZES },
    { id: 'premiata',       brand: 'Premiata',    name: 'Premiata',                       price: 3400, img: 'img/4.jpg', sizes: ALL_SIZES },
    { id: 'chunky',         brand: 'Chunky',      name: 'Chunky',                         price: 3250, img: 'img/5.jpg', sizes: ALL_SIZES },
    { id: 'nb-1900',        brand: 'New Balance', name: 'New Balance R1900',              price: 3350, img: 'img/6.jpg', sizes: ALL_SIZES },
    { id: 'salomon-xt6',    brand: 'Salomon',     name: 'Salomon XT-6',                   price: 3500, img: 'img/7.jpg', sizes: ALL_SIZES },
    { id: 'nb-530',         brand: 'New Balance', name: 'New Balance 530',                price: 4200, img: 'img/8.jpg', sizes: ALL_SIZES },
    { id: 'loro-piana',     brand: 'Loro Piana',  name: 'Loro Piana',                     price: 2200, img: 'img/9.jpg', sizes: ALL_SIZES }
];

/* Які моделі показувати на головній */
const HOME_PRODUCTS = ['puma-speedcat', 'nike-acg-khaki', 'nike-acg-black', 'premiata', 'chunky', 'nb-1900'];

/* Таблиця розмірів: EU → довжина стопи, см (приблизно, у різних брендів трохи відрізняється) */
const SIZE_GUIDE = { 36: 23, 37: 23.5, 38: 24, 39: 25, 40: 25.5, 41: 26, 42: 26.5, 43: 27.5, 44: 28, 45: 29 };

const CART_KEY = 'danchukes-cart';
const FAV_KEY = 'danchukes-fav';        // обране (♥)
const RECENT_KEY = 'danchukes-recent';  // нещодавно переглянуті
const MAX_QTY = 10;

/* ===== Допоміжні функції ===== */
const getProduct = id => PRODUCTS.find(p => p.id === id);
const formatPrice = n => n.toLocaleString('uk-UA') + ' грн';
const productUrl = p => 'product.html?id=' + p.id;

// plural(5, 'пара', 'пари', 'пар') → 'пар'
function plural(n, one, few, many) {
    const last = n % 10, lastTwo = n % 100;
    if (last === 1 && lastTwo !== 11) return one;
    if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
    return many;
}

/* ===== Кошик: [{ id, size, qty }, ...] ===== */
function loadCart() {
    try {
        const data = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(data) ? data.filter(i => getProduct(i.id)) : [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* браузер заборонив сховище */ }
    updateCartCount();
}

const cartCount = cart => cart.reduce((sum, i) => sum + i.qty, 0);
const cartTotal = cart => cart.reduce((sum, i) => sum + getProduct(i.id).price * i.qty, 0);

function addToCart(id, size) {
    const cart = loadCart();
    const line = cart.find(i => i.id === id && i.size === size);
    if (line) line.qty = Math.min(line.qty + 1, MAX_QTY);
    else cart.push({ id, size, qty: 1 });
    saveCart(cart);
}

// Лічильник біля кнопки 🛒 у шапці
function updateCartCount() {
    const n = cartCount(loadCart());
    document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = n;
        el.hidden = n === 0;
    });
}

/* ===== Списки id у браузері: обране і нещодавно переглянуті ===== */
function loadIds(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data.filter(id => getProduct(id)) : [];
    } catch (e) {
        return [];
    }
}
function saveIds(key, ids) {
    try { localStorage.setItem(key, JSON.stringify(ids)); } catch (e) { /* сховище недоступне */ }
}

const isFav = id => loadIds(FAV_KEY).includes(id);

function toggleFav(id) {
    const favs = loadIds(FAV_KEY);
    const on = !favs.includes(id);
    saveIds(FAV_KEY, on ? [id, ...favs] : favs.filter(x => x !== id));
    return on;
}

// Кнопка ♥ на картці (data-fav-label — велика кнопка з текстом на сторінці товару)
function favButton(id, withLabel) {
    const on = isFav(id);
    const cls = withLabel ? 'btn fav-toggle' : 'fav-btn';
    return `<button type="button" class="${cls}${on ? ' on' : ''}" data-fav="${id}"${withLabel ? ' data-fav-label' : ''}
        aria-pressed="${on}" aria-label="${on ? 'Прибрати з обраного' : 'Додати в обране'}">${favText(on, withLabel)}</button>`;
}
function favText(on, withLabel) {
    if (withLabel) return on ? '♥ В обраному' : '♡ В обране';
    return on ? '♥' : '♡';
}
function setFavState(btn, on) {
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Прибрати з обраного' : 'Додати в обране');
    btn.textContent = favText(on, btn.hasAttribute('data-fav-label'));
}

// Один обробник ♥ на всі сторінки
document.addEventListener('click', e => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    const on = toggleFav(btn.dataset.fav);
    document.querySelectorAll(`[data-fav="${btn.dataset.fav}"]`).forEach(b => setFavState(b, on));
    document.dispatchEvent(new CustomEvent('favchange'));
});

function rememberViewed(id) {
    saveIds(RECENT_KEY, [id, ...loadIds(RECENT_KEY).filter(x => x !== id)].slice(0, 8));
}

// «Ви нещодавно переглядали» (без поточного товару)
function renderRecent(root, exceptId) {
    const ids = loadIds(RECENT_KEY).filter(id => id !== exceptId).slice(0, 4);
    root.hidden = ids.length === 0;
    if (!ids.length) return;
    root.innerHTML = '<h2 class="mb-3">Ви нещодавно переглядали</h2>' +
        '<div class="row row-cols-2 row-cols-md-4 g-3">' + ids.map(getProduct).map(productCard).join('') + '</div>';
}

/* ===== Картка товару ===== */
function productCard(p) {
    const url = productUrl(p);
    return `<div class="col"><div class="card h-100 border-0 text-center">
        <div class="card-img-wrap">
            <a href="${url}"><img src="${p.img}" class="card-img-top" alt="${p.name}" loading="lazy"></a>
            ${favButton(p.id)}
        </div>
        <div class="card-body d-flex flex-column">
            <h3 class="card-title"><a href="${url}">${p.name}</a></h3>
            <p class="card-price">${formatPrice(p.price)}</p>
            <a class="btn mt-auto" href="${url}">Обрати розмір</a>
        </div>
    </div></div>`;
}

/* ===== Головна: обрані моделі ===== */
function renderFeatured(root) {
    root.innerHTML = HOME_PRODUCTS.map(getProduct).filter(Boolean).map(productCard).join('');
}

/* ===== Каталог: пошук, фільтр за брендом, сортування ===== */
function renderCatalog() {
    const params = new URLSearchParams(location.search);
    const state = {
        q: params.get('q') || '',
        brand: params.get('brand') || '',
        favOnly: params.get('fav') === '1',
        sort: 'default'
    };

    const tools = document.getElementById('catalog-tools');
    const search = document.getElementById('catalog-search');
    const sortSel = document.getElementById('catalog-sort');
    const chips = document.getElementById('brand-chips');
    const grid = document.getElementById('catalog-grid');
    const empty = document.getElementById('catalog-empty');
    const countEl = document.getElementById('catalog-count');

    search.value = state.q;

    const brands = [...new Set(PRODUCTS.map(p => p.brand))].sort((a, b) => a.localeCompare(b));
    chips.innerHTML = ['', ...brands]
        .map(b => `<button type="button" class="chip" data-brand="${b}">${b || 'Усі бренди'}</button>`)
        .join('') +
        '<button type="button" class="chip chip-fav" data-fav-filter>♥ Обране</button>';

    function update() {
        const q = state.q.trim().toLowerCase();
        const favs = loadIds(FAV_KEY);
        const list = PRODUCTS.filter(p =>
            (!state.brand || p.brand === state.brand) &&
            (!state.favOnly || favs.includes(p.id)) &&
            (!q || (p.name + ' ' + p.brand).toLowerCase().includes(q))
        );
        if (state.sort === 'cheap') list.sort((a, b) => a.price - b.price);
        if (state.sort === 'expensive') list.sort((a, b) => b.price - a.price);
        if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

        grid.innerHTML = list.map(productCard).join('');
        empty.hidden = list.length > 0;
        emptyText.textContent = state.favOnly && !favs.length
            ? 'В обраному поки нічого немає. Натисніть ♡ на картці товару, щоб зберегти його.'
            : 'Спробуйте іншу назву або скиньте фільтри.';
        countEl.textContent = list.length + ' ' + plural(list.length, 'модель', 'моделі', 'моделей');
        chips.querySelectorAll('.chip[data-brand]').forEach(c => c.classList.toggle('active', c.dataset.brand === state.brand));
        chips.querySelector('[data-fav-filter]').classList.toggle('active', state.favOnly);

        // Пошук, бренд і «Обране» зберігаються в адресі — таким посиланням можна поділитися
        const url = new URL(location.href);
        state.q ? url.searchParams.set('q', state.q) : url.searchParams.delete('q');
        state.brand ? url.searchParams.set('brand', state.brand) : url.searchParams.delete('brand');
        state.favOnly ? url.searchParams.set('fav', '1') : url.searchParams.delete('fav');
        history.replaceState(null, '', url);
    }

    const emptyText = document.getElementById('catalog-empty-text');
    // Якщо прибрали ♥, коли відкрито «Обране», картка одразу зникає
    document.addEventListener('favchange', () => { if (state.favOnly) update(); });

    search.addEventListener('input', () => { state.q = search.value; update(); });
    sortSel.addEventListener('change', () => { state.sort = sortSel.value; update(); });
    tools.addEventListener('submit', e => e.preventDefault());
    chips.addEventListener('click', e => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        if (chip.hasAttribute('data-fav-filter')) state.favOnly = !state.favOnly;
        else state.brand = chip.dataset.brand;
        update();
    });
    document.getElementById('catalog-reset').addEventListener('click', () => {
        state.q = ''; state.brand = ''; state.favOnly = false; search.value = '';
        update();
    });

    update();
}

/* ===== Сторінка товару ===== */
function renderProduct(root) {
    const p = getProduct(new URLSearchParams(location.search).get('id'));

    if (!p) {
        root.innerHTML = `<div class="text-center py-5"><div class="big-emoji">🦆</div>
            <h2>Товар не знайдено</h2>
            <a class="btn btn-big mt-3" href="catalog.html">До каталогу</a></div>`;
        return;
    }

    document.title = p.name + ' - Danchukes-store';
    document.querySelectorAll('[data-product-name]').forEach(el => { el.textContent = p.name; });

    const sizeButtons = ALL_SIZES.map(s => {
        const available = p.sizes.includes(s);
        return `<button type="button" class="size-btn${available ? '' : ' unavailable'}" role="radio" aria-checked="false"
            data-size="${s}"${available ? '' : ' disabled title="Немає в наявності"'}>${s}</button>`;
    }).join('');

    const guideRows = ALL_SIZES.map(s => `<tr><td>${s}</td><td>${SIZE_GUIDE[s]} см</td></tr>`).join('');

    root.innerHTML = `
        <div class="row g-4">
            <div class="col-md-6"><img class="product-img" src="${p.img}" alt="${p.name}"></div>
            <div class="col-md-6">
                <p class="text-muted mb-1">${p.brand}</p>
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <h2>${p.name}</h2>
                    ${favButton(p.id, true)}
                </div>
                <p class="product-price">${formatPrice(p.price)}</p>
                <p class="mb-1"><b>Оберіть розмір (EU)</b></p>
                <div class="size-grid" role="radiogroup" aria-label="Розмір">${sizeButtons}</div>
                <p class="size-hint" hidden>Будь ласка, оберіть розмір</p>

                <details class="size-guide mb-3">
                    <summary class="link-summary">📏 Як обрати розмір?</summary>
                    <div class="size-guide-body">
                        <p class="small mb-2">Виміряйте довжину стопи від п'ятки до найдовшого пальця.
                        Якщо вийшло між розмірами, беріть більший.</p>
                        <table class="table table-sm mb-0">
                            <thead><tr><th>EU</th><th>Довжина стопи</th></tr></thead>
                            <tbody>${guideRows}</tbody>
                        </table>
                    </div>
                </details>

                <button type="button" class="btn btn-big btn-main w-100" data-add>Додати в кошик</button>
                <div class="added-msg" hidden>✅ Розмір <span data-added-size></span> додано в кошик · <a href="cart.html">Перейти до кошика</a></div>
                <ul class="perks list-unstyled mt-4">
                    <li>🚚 Доставка Новою Поштою за 1–3 дні</li>
                    <li>💳 Оплата при отриманні</li>
                    <li>↩️ Обмін і повернення протягом 14 днів</li>
                </ul>
            </div>
        </div>`;

    let selected = null;
    const grid = root.querySelector('.size-grid');
    const hint = root.querySelector('.size-hint');
    const added = root.querySelector('.added-msg');

    grid.addEventListener('click', e => {
        const btn = e.target.closest('.size-btn');
        if (!btn || btn.disabled) return;
        selected = Number(btn.dataset.size);
        grid.querySelectorAll('.size-btn').forEach(b => {
            b.classList.toggle('selected', b === btn);
            b.setAttribute('aria-checked', b === btn);
        });
        grid.classList.remove('error');
        hint.hidden = true;
        added.hidden = true;
    });

    root.querySelector('[data-add]').addEventListener('click', () => {
        if (!selected) {
            grid.classList.add('error');
            hint.hidden = false;
            added.hidden = true;
            return;
        }
        addToCart(p.id, selected);
        added.querySelector('[data-added-size]').textContent = selected;
        added.hidden = false;
    });

    // «Вам також сподобається»: 4 наступні моделі по колу
    const related = document.getElementById('related');
    if (related) {
        const start = PRODUCTS.indexOf(p);
        const others = [1, 2, 3, 4].map(k => PRODUCTS[(start + k) % PRODUCTS.length]);
        related.innerHTML = '<h2 class="mb-3">Вам також сподобається</h2>' +
            '<div class="row row-cols-2 row-cols-md-4 g-3">' + others.map(productCard).join('') + '</div>';
    }

    // Спершу показуємо попередні перегляди, потім запам'ятовуємо цей товар
    const recent = document.getElementById('recent');
    if (recent) renderRecent(recent, p.id);
    rememberViewed(p.id);
}

/* ===== Кошик ===== */
function renderCart(root) {
    const cart = loadCart();

    if (!cart.length) {
        root.innerHTML = `<section class="text-center py-5">
            <div class="big-emoji">🛒</div>
            <h2>Ваш кошик наразі порожній</h2>
            <p class="mb-4">Додайте кросівки до кошика, щоб оформити замовлення.</p>
            <a class="btn btn-big" href="catalog.html">Перейти до каталогу</a></section>`;
        return;
    }

    const n = cartCount(cart);
    const total = cartTotal(cart);

    const items = cart.map((item, i) => {
        const p = getProduct(item.id);
        const options = ALL_SIZES
            .filter(s => p.sizes.includes(s) || s === item.size)
            .map(s => `<option${s === item.size ? ' selected' : ''}>${s}</option>`).join('');
        return `<div class="cart-item">
            <a href="${productUrl(p)}"><img src="${p.img}" alt="${p.name}"></a>
            <div>
                <a class="cart-name" href="${productUrl(p)}">${p.name}</a>
                <div class="small text-muted">${formatPrice(p.price)} / пара</div>
                <div class="cart-controls">
                    <label class="d-flex align-items-center gap-2">Розмір
                        <select class="form-select form-select-sm" data-action="size" data-index="${i}">${options}</select>
                    </label>
                    <div class="qty" role="group" aria-label="Кількість">
                        <button type="button" data-action="dec" data-index="${i}" aria-label="Менше"${item.qty <= 1 ? ' disabled' : ''}>−</button>
                        <span>${item.qty}</span>
                        <button type="button" data-action="inc" data-index="${i}" aria-label="Більше"${item.qty >= MAX_QTY ? ' disabled' : ''}>+</button>
                    </div>
                </div>
                <button type="button" class="link-btn" data-action="remove" data-index="${i}">🗑 Видалити</button>
            </div>
            <div class="cart-price">${formatPrice(p.price * item.qty)}</div>
        </div>`;
    }).join('');

    root.innerHTML = `
        <h2 class="mb-3">Ваш кошик <span class="fs-5 text-muted">(${n} ${plural(n, 'пара', 'пари', 'пар')})</span></h2>
        <div class="row g-4">
            <div class="col-lg-8">${items}</div>
            <div class="col-lg-4"><div class="summary">
                <h3 class="h5 mb-3">Підсумок</h3>
                <div class="summary-row"><span>Товари (${n})</span><span>${formatPrice(total)}</span></div>
                <div class="summary-row"><span>Доставка</span><span>за тарифами НП</span></div>
                <div class="summary-row summary-total"><span>Разом</span><span>${formatPrice(total)}</span></div>
                <a class="btn btn-big btn-main w-100 mt-3" href="zamovlenya.html">Оформити замовлення</a>
                <a class="d-block text-center mt-2 small" href="catalog.html">Продовжити покупки</a>
            </div></div>
        </div>`;
}

function bindCart(root) {
    root.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn || btn.tagName === 'SELECT') return;
        const cart = loadCart();
        const i = Number(btn.dataset.index);
        const item = cart[i];
        if (!item) return;
        if (btn.dataset.action === 'inc') item.qty = Math.min(item.qty + 1, MAX_QTY);
        if (btn.dataset.action === 'dec') item.qty = Math.max(item.qty - 1, 1);
        if (btn.dataset.action === 'remove') cart.splice(i, 1);
        saveCart(cart);
        renderCart(root);
    });

    root.addEventListener('change', e => {
        if (e.target.dataset.action !== 'size') return;
        const cart = loadCart();
        const i = Number(e.target.dataset.index);
        const item = cart[i];
        if (!item) return;
        const newSize = Number(e.target.value);
        // Якщо така модель цього розміру вже є в кошику, об'єднуємо рядки
        const same = cart.findIndex((x, j) => j !== i && x.id === item.id && x.size === newSize);
        if (same !== -1) {
            cart[same].qty = Math.min(cart[same].qty + item.qty, MAX_QTY);
            cart.splice(i, 1);
        } else {
            item.size = newSize;
        }
        saveCart(cart);
        renderCart(root);
    });
}

/* ===== Оформлення замовлення ===== */
function renderOrder(root) {
    const cart = loadCart();
    const submit = root.closest('form').querySelector('[type="submit"]');

    if (!cart.length) {
        root.innerHTML = `<p class="mb-2">Кошик порожній: спочатку оберіть кросівки.</p>
            <a class="btn" href="catalog.html">Перейти до каталогу</a>`;
        submit.disabled = true;
        return;
    }

    root.innerHTML = cart.map(item => {
        const p = getProduct(item.id);
        return `<div class="order-item">
            <img src="${p.img}" alt="${p.name}">
            <div class="flex-grow-1"><b>${p.name}</b><br>
            <span class="small">Розмір ${item.size} · ${item.qty} шт.</span></div>
            <div class="text-nowrap">${formatPrice(p.price * item.qty)}</div>
        </div>`;
    }).join('') +
        `<div class="summary-row summary-total mt-2"><span>Разом</span><span>${formatPrice(cartTotal(cart))}</span></div>
        <a class="small" href="cart.html">Змінити в кошику</a>`;
}

// Український номер: +380 97 123 45 67, 380971234567 або 097 123 45 67
const isPhoneValid = v => /^(380\d{9}|0\d{9})$/.test(v.replace(/\D/g, ''));

function bindOrderForm(form) {
    const submit = form.querySelector('[type="submit"]');
    const status = form.querySelector('#order-status');
    const phone = form.querySelector('#phone');

    phone.addEventListener('input', () => {
        phone.setCustomValidity(isPhoneValid(phone.value) ? '' : 'Введіть номер у форматі +380 97 123 45 67');
    });

    function showError(text) {
        status.textContent = text;
        status.hidden = false;
        submit.disabled = false;
        submit.textContent = 'Замовити';
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const cart = loadCart();
        if (!cart.length) return;

        const value = id => form.querySelector('#' + id).value.trim();
        const total = cartTotal(cart);
        const orderNo = String(Date.now()).slice(-6);   // номер замовлення, напр. 482913

        const data = {
            access_key: WEB3FORMS_KEY,
            subject: `Замовлення №${orderNo}: ${formatPrice(total)} — Danchukes-store`,
            from_name: 'Danchukes-store',
            replyto: value('email'),
            botcheck: form.querySelector('#botcheck').checked,
            'Номер замовлення': '№' + orderNo,
            'Прізвище та ім\'я': value('fullname'),
            'Телефон': value('phone'),
            'Email': value('email'),
            'Населений пункт': value('city'),
            'Відділення / поштомат НП': value('department'),
            'Товари': cart.map(item => {
                const p = getProduct(item.id);
                return `${p.name} | розмір ${item.size} | ${item.qty} шт. | ${formatPrice(p.price * item.qty)}`;
            }).join('\n'),
            'Разом': formatPrice(total)
        };

        status.hidden = true;
        submit.disabled = true;
        submit.textContent = 'Надсилаємо...';

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(json => {
                if (json.success) location.href = 'dyakuyu.html?n=' + orderNo;
                else showError('Не вдалося надіслати замовлення: ' + (json.message || 'помилка сервісу') + '. Спробуйте ще раз або зателефонуйте нам.');
            })
            .catch(() => showError('Немає з\'єднання з інтернетом. Перевірте мережу й спробуйте ще раз.'));
    });
}

/* ===== Сторінка подяки: номер замовлення ===== */
function renderThanks(el) {
    const n = new URLSearchParams(location.search).get('n');
    if (n && /^\d{6}$/.test(n)) {
        el.textContent = 'Номер вашого замовлення: №' + n;
        el.hidden = false;
    }
}

/* ===== Запуск на кожній сторінці ===== */
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.hasAttribute('data-clear-cart')) saveCart([]);
    updateCartCount();

    const featured = document.getElementById('featured');
    if (featured) {
        renderFeatured(featured);
        const recent = document.getElementById('recent');
        if (recent) renderRecent(recent, null);
    }

    if (document.getElementById('catalog-grid')) renderCatalog();

    const product = document.getElementById('product-page');
    if (product) renderProduct(product);

    const cartRoot = document.getElementById('cart-page');
    if (cartRoot) { renderCart(cartRoot); bindCart(cartRoot); }

    const order = document.getElementById('order-summary');
    if (order) { renderOrder(order); bindOrderForm(order.closest('form')); }

    const thanks = document.querySelector('[data-order-number]');
    if (thanks) renderThanks(thanks);
});

// Оновлюємо лічильник, якщо кошик змінили в іншій вкладці або повернулися кнопкою «Назад»
window.addEventListener('storage', updateCartCount);
window.addEventListener('pageshow', updateCartCount);
