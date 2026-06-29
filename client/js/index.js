const API_URL = '/api';
let allFilaments = [];
let currentSort = 'default';
let currentFilterType = 'all';
let currentFilamentId = null;

const MAX_FILAMENT_WEIGHT = 1000000;

const COLOR_MAP = {
    'green': '#22c55e',
    'yellow': '#eab308',
    'red': '#ef4444',
    'blue': '#3b82f6',
    'orange': '#f97316',
    'purple': '#a855f7',
    'black': '#1a1a1a',
    'white': '#f3f4f6',
    'gray': '#6b7280',
    'silver': '#c0c0c0',
    'crimson': '#dc2626',
    'pink': '#ec4899',
    'gold': '#f59e0b',
    'lime': '#84cc16',
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
    'navy': '#1e3a8a',
    'violet': '#8b5cf6',
    'magenta': '#d946ef',
    'brown': '#92400e',
    'beige': '#f5e6d3',
    'transparent': 'rgba(255,255,255,0.1)',
    'glow': '#22d3ee',
    'multicolor': '#8b5cf6'
};

const COLOR_NAMES = {
    'green': 'Зеленый',
    'yellow': 'Желтый',
    'red': 'Красный',
    'blue': 'Синий',
    'orange': 'Оранжевый',
    'purple': 'Фиолетовый',
    'black': 'Черный',
    'white': 'Белый',
    'gray': 'Серый',
    'silver': 'Серебристый',
    'crimson': 'Малиновый',
    'pink': 'Розовый',
    'gold': 'Золотой',
    'lime': 'Лайм',
    'teal': 'Бирюзовый',
    'cyan': 'Циан',
    'navy': 'Темно-синий',
    'violet': 'Лиловый',
    'magenta': 'Пурпурный',
    'brown': 'Коричневый',
    'beige': 'Бежевый',
    'transparent': 'Прозрачный',
    'glow': 'Светящийся',
    'multicolor': 'Мультицвет'
};

const RING_COLOR_MAP = {
    'green': '#22c55e',
    'yellow': '#eab308',
    'red': '#ef4444',
    'blue': '#3b82f6',
    'orange': '#f97316',
    'purple': '#a855f7',
    'black': '#4a4a4a',
    'white': '#e5e7eb',
    'gray': '#9ca3af',
    'silver': '#d1d5db',
    'crimson': '#dc2626',
    'pink': '#ec4899',
    'gold': '#f59e0b',
    'lime': '#84cc16',
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
    'navy': '#3b82f6',
    'violet': '#8b5cf6',
    'magenta': '#d946ef',
    'brown': '#b45309',
    'beige': '#d4c5b0',
    'transparent': '#9ca3af',
    'glow': '#22d3ee',
    'multicolor': '#8b5cf6'
};

const FILAMENT_TYPES = ['PLA', 'PETG', 'ABS', 'HIPS', 'SBS', 'TPU', 'NYLON', 'ASA', 'PP', 'PC', 'POM', 'PMMA', 'PEEK', 'Ceramo', 'PVA', 'WAX', 'Clearing'];

function formatWeight(grams) {
    if (grams >= 1000000) {
        return (grams / 1000000).toFixed(3) + ' т';
    } else if (grams >= 10000) {
        return (grams / 1000).toFixed(2) + ' кг';
    }
    return grams + ' г';
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    const messageEl = document.getElementById('notificationMessage');
    const iconEl = document.getElementById('notificationIcon');
    
    notification.className = 'notification';
    notification.classList.add(type);
    
    const icons = {
        success: 'fa-solid fa-check-circle',
        error: 'fa-solid fa-circle-exclamation',
        info: 'fa-solid fa-circle-info'
    };
    iconEl.className = icons[type] || icons.success;
    messageEl.textContent = message;
    notification.style.display = 'block';
    
    clearTimeout(notification._timeout);
    notification._timeout = setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

document.addEventListener('click', function(e) {
    const notification = document.getElementById('notification');
    if (notification && notification.contains(e.target)) {
        notification.style.display = 'none';
    }
});

function formatLocalDate(timestamp) {
    if (!timestamp) return '';
    try {
        let ts = timestamp;
        if (typeof ts === 'number' && ts < 10000000000) {
            ts = ts * 1000;
        }
        const date = new Date(ts);
        if (isNaN(date.getTime())) return String(timestamp);
        return date.toLocaleString();
    } catch (e) {
        return String(timestamp);
    }
}

// ===== АВТОРИЗАЦИЯ =====

async function checkAuth() {
    const token = localStorage.getItem('token');
    console.log('checkAuth: токен', token ? 'есть' : 'нет');
    if (!token) {
        redirectToLogin();
        return false;
    }
    try {
        const response = await fetch(`${API_URL}/materials/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('checkAuth: статус ответа', response.status);
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return false;
        }
        if (response.ok) {
            updateAuthUI(true);
            showUsername();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return false;
    }
}

function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login.html') && !currentPath.includes('register.html')) {
        window.location.href = 'login.html';
    }
}

function updateAuthUI(isLoggedIn) {
    const container = document.getElementById('authContainer');
    if (!container) return;
    console.log('updateAuthUI:', isLoggedIn);
    if (isLoggedIn) {
        container.innerHTML = `
            <span style="color:#9ca3af; font-size:14px;" id="usernameDisplay"></span>
            <button class="icon-button" onclick="logout()" title="Выйти">
                <i class="fa-solid fa-right-from-bracket"></i>
            </button>
        `;
    } else {
        container.innerHTML = `
            <a href="login.html" class="icon-button" title="Войти">
                <i class="fa-solid fa-right-to-bracket"></i>
            </a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function showUsername() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const display = document.getElementById('usernameDisplay');
        if (display) display.textContent = user.username || 'Пользователь';
    } catch (e) {}
}

// ===== НАСТРОЙКИ =====

function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

document.getElementById('settingsModal').addEventListener('click', function(e) {
    if (e.target === this) closeSettings();
});

function saveSettings() {
    const theme = document.getElementById('darkTheme').checked;
    const notifications = document.getElementById('notifications').checked;
    console.log('Сохранено:', { theme, notifications });
    showNotification('Настройки сохранены!', 'success');
    closeSettings();
}

// ===== ФИЛЬТРЫ =====

function closeFilter() {
    document.getElementById('filterModal').style.display = 'none';
}

function openFilter() {
    document.getElementById('filterModal').style.display = 'flex';
}

document.getElementById('filterModal').addEventListener('click', function(e) {
    if (e.target === this) closeFilter();
});

function sortFilaments(type) {
    currentSort = type;
    document.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
    const activeBtn = { 'default': 'filterDefault', 'name': 'filterName', 'nameDesc': 'filterNameDesc', 'progress': 'filterProgress', 'progressDesc': 'filterProgressDesc', 'color': 'filterColor' }[type];
    if (activeBtn) document.getElementById(activeBtn).classList.add('active');
    applyFiltersAndSort();
    closeFilter();
}

function filterByType(type) {
    currentFilterType = type;
    document.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
    const activeBtn = { 
        'all': 'filterTypeAll', 
        'pla': 'filterTypePLA', 
        'petg': 'filterTypePETG', 
        'abs': 'filterTypeABS',
        'hips': 'filterTypeHIPS',
        'sbs': 'filterTypeSBS',
        'tpu': 'filterTypeTPU',
        'nylon': 'filterTypeNYLON',
        'asa': 'filterTypeASA',
        'pp': 'filterTypePP',
        'pc': 'filterTypePC',
        'pom': 'filterTypePOM',
        'pmma': 'filterTypePMMA',
        'peek': 'filterTypePEEK',
        'ceramo': 'filterTypeCeramo',
        'pva': 'filterTypePVA',
        'wax': 'filterTypeWAX',
        'clearing': 'filterTypeClearing',
        'other': 'filterTypeOther' 
    }[type];
    if (activeBtn) document.getElementById(activeBtn).classList.add('active');
    applyFiltersAndSort();
    closeFilter();
}

function searchFilaments() {
    applyFiltersAndSort();
}

function applyFiltersAndSort() {
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    let filtered = [...allFilaments];
    if (searchQuery) {
        filtered = filtered.filter(f => 
            (f.name || '').toLowerCase().includes(searchQuery) ||
            (f.color || '').toLowerCase().includes(searchQuery) ||
            (f.material_type || '').toLowerCase().includes(searchQuery)
        );
    }
    if (currentFilterType !== 'all') {
        filtered = filtered.filter(f => {
            const type = (f.material_type || '').toLowerCase();
            if (currentFilterType === 'other') {
                return !FILAMENT_TYPES.map(t => t.toLowerCase()).includes(type);
            }
            return type === currentFilterType;
        });
    }
    filtered.sort((a, b) => {
        switch(currentSort) {
            case 'name': return (a.name || '').localeCompare(b.name || '');
            case 'nameDesc': return (b.name || '').localeCompare(a.name || '');
            case 'progress': return ((a.current_mass || 0) / (a.initial_mass || 1)) - ((b.current_mass || 0) / (b.initial_mass || 1));
            case 'progressDesc': return ((b.current_mass || 0) / (b.initial_mass || 1)) - ((a.current_mass || 0) / (a.initial_mass || 1));
            case 'color': return (a.color || '').localeCompare(b.color || '');
            default: return (a.id || 0) - (b.id || 0);
        }
    });
    renderFilaments(filtered);
}

function resetFilters() {
    currentFilterType = 'all';
    currentSort = 'default';
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterDefault').classList.add('active');
    document.getElementById('filterTypeAll').classList.add('active');
    applyFiltersAndSort();
    closeFilter();
}

// ===== ЗАГРУЗКА И ОТОБРАЖЕНИЕ КАТУШЕК =====

async function loadFilaments() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch(`${API_URL}/materials/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        const data = await response.json();
        if (data.status !== 200) {
            throw new Error(data.message || data.error || 'Ошибка загрузки');
        }
        allFilaments = data.data || [];
        applyFiltersAndSort();
    } catch (error) {
        console.error('Ошибка загрузки катушек:', error);
        showNotification('Ошибка загрузки катушек', 'error');
    }
}

function renderFilaments(filaments) {
    const grid = document.getElementById('filamentGrid');
    if (!grid) return;
    if (!filaments || filaments.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3af;">
            <i class="fa-solid fa-box-open" style="font-size:48px;margin-bottom:12px;display:block;"></i>
            <p>Нет катушек. Добавьте первую!</p>
        </div>`;
        return;
    }
    grid.innerHTML = filaments.map(f => {
        const colorKey = (f.color || '').toLowerCase();
        const colorHex = COLOR_MAP[colorKey] || '#8b5cf6';
        const ringColor = RING_COLOR_MAP[colorKey] || '#8b5cf6';
        const colorName = COLOR_NAMES[colorKey] || f.color || 'Без цвета';
        const progress = Math.round(((f.current_mass || 0) / (f.initial_mass || 1)) * 100);
        const isEmpty = (f.current_mass || 0) <= 0;
        
        const emptyStyles = isEmpty ? `
            opacity: 0.5;
            filter: grayscale(0.8);
            border-color: rgba(255,255,255,0.02);
        ` : '';
        
        const currentWeight = formatWeight(f.current_mass || 0);
        const initialWeight = formatWeight(f.initial_mass || 0);
        const weightText = isEmpty ? '0 г (пусто)' : `${currentWeight} / ${initialWeight}`;
        const weightColor = isEmpty ? '#6b7280' : colorHex;
        
        const ringStyle = colorKey === 'multicolor' 
            ? `background: conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444) calc(var(--progress) * 1%);`
            : `background: conic-gradient(${ringColor} calc(var(--progress) * 1%), #2b2f3a 0);`;
        
        const dotStyle = colorKey === 'multicolor' 
            ? 'background: linear-gradient(45deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7);' 
            : `background: ${colorHex};`;
        
        return `<article class="filament-card" onclick="openDetailModal(${f.id})" style="cursor:pointer; ${emptyStyles}">
            <div class="card-top">
                <div class="progress-ring" style="--progress:${progress}; ${ringStyle}">
                    <span>${isEmpty ? '0%' : progress + '%'}</span>
                </div>
                <div class="filament-info">
                    <h2>${f.name || 'Без названия'} ${isEmpty ? '📦' : ''}</h2>
                    <p class="filament-color" style="color:${isEmpty ? '#6b7280' : colorHex};">${colorName} ${f.material_type ? '• ' + f.material_type : ''}</p>
                </div>
            </div>
            <div class="weight-info" style="color:${weightColor};">
                <div class="weight-dot" style="${dotStyle}"></div>
                <span>${weightText}</span>
            </div>
            ${isEmpty ? `<div style="margin-top:6px; font-size:11px; color:#6b7280; text-align:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Катушка пуста
            </div>` : ''}
        </article>`;
    }).join('');
}

// ===== ДЕТАЛИ КАТУШКИ =====

function openDetailModal(id) {
    currentFilamentId = id;
    const filament = allFilaments.find(f => f.id === id);
    if (!filament) {
        showNotification('Катушка не найдена', 'error');
        return;
    }
    
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('detailBody');
    
    const colorKey = (filament.color || '').toLowerCase();
    const colorHex = COLOR_MAP[colorKey] || '#8b5cf6';
    const ringColor = RING_COLOR_MAP[colorKey] || '#8b5cf6';
    const colorName = COLOR_NAMES[colorKey] || filament.color || 'Без цвета';
    const progress = Math.round(((filament.current_mass || 0) / (filament.initial_mass || 1)) * 100);
    const used = (filament.initial_mass || 0) - (filament.current_mass || 0);
    const isEmpty = (filament.current_mass || 0) <= 0;
    
    const currentWeight = formatWeight(filament.current_mass || 0);
    const initialWeight = formatWeight(filament.initial_mass || 0);
    const usedWeight = formatWeight(used);
    
    const ringStyle = colorKey === 'multicolor' 
        ? `background: conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444) calc(var(--progress) * 1%);`
        : `--ring-color:${ringColor}; background: conic-gradient(var(--ring-color) calc(var(--progress) * 1%), #2b2f3a 0);`;
    
    const qrData = JSON.stringify({ id: filament.id, name: filament.name, material_type: filament.material_type, color: filament.color, initial_mass: filament.initial_mass, current_mass: filament.current_mass });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    
    loadConsumptionHistory(id).then(historyHtml => {
        body.innerHTML = `
            <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:flex-start; ${isEmpty ? 'opacity:0.6;' : ''}">
                <div style="flex:1; min-width:200px;">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
                        <div class="progress-ring" style="--size:80px; width:80px; height:80px; min-width:80px; --progress:${progress}; ${ringStyle}">
                            <span style="font-size:16px;">${isEmpty ? '0%' : progress + '%'}</span>
                        </div>
                        <div>
                            <h2 style="color:#ffffff; font-size:22px; margin-bottom:4px;">${filament.name} ${isEmpty ? '📦' : ''}</h2>
                            <p style="color:${isEmpty ? '#6b7280' : colorHex}; font-size:16px; font-weight:600;">${colorName} ${filament.material_type ? '• ' + filament.material_type : ''}</p>
                            ${isEmpty ? `<p style="color:#ff5f5f; font-size:14px; margin-top:4px;"><i class="fa-solid fa-triangle-exclamation"></i> Катушка пуста</p>` : ''}
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px;">
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Начальный вес</div>
                            <div style="font-size:20px; font-weight:700; color:#ffffff;">${initialWeight}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Текущий вес</div>
                            <div style="font-size:20px; font-weight:700; color:${isEmpty ? '#6b7280' : '#ffffff'};">${currentWeight}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Использовано</div>
                            <div style="font-size:20px; font-weight:700; color:#ff5f5f;">${usedWeight}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">ID</div>
                            <div style="font-size:16px; font-weight:700; color:#ffffff;">#${filament.id}</div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:160px; background:#232734; border-radius:16px; padding:16px;">
                    <div style="position:relative; display:inline-block;">
                        <img id="qrCodeImage" src="${qrUrl}" alt="QR-код" style="width:140px; height:140px; border-radius:8px; background:white; padding:8px; ${isEmpty ? 'opacity:0.5;' : ''}" />
                        <button onclick="downloadQRCode()" title="Скачать QR-код" style="position:absolute; bottom:4px; right:4px; width:32px; height:32px; border:none; border-radius:50%; background:#8b5cf6; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </div>
                    <div style="font-size:11px; color:#9ca3af; margin-top:8px; text-align:center; word-break:break-all; max-width:140px;">ID: #${filament.id}</div>
                    <button onclick="deleteFilament(${filament.id})" style="margin-top:12px; background:#ff5f5f; color:white; border:none; border-radius:12px; width:100%; padding:10px; font-size:14px; font-weight:600; cursor:pointer;">
                        <i class="fa-solid fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
            <div style="margin-top:16px; background:#232734; border-radius:10px; padding:12px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <i class="fa-solid fa-clock-rotate-left" style="color:#9ca3af; font-size:14px;"></i>
                    <span style="font-size:13px; font-weight:600; color:#9ca3af;">ИСТОРИЯ РАСХОДА</span>
                </div>
                ${historyHtml}
            </div>
        `;
        modal.style.display = 'flex';
    });
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
    currentFilamentId = null;
}

document.getElementById('detailModal').addEventListener('click', function(e) {
    if (e.target === this) closeDetailModal();
});

async function loadConsumptionHistory(materialId) {
    const token = localStorage.getItem('token');
    if (!token) return `<div style="text-align:center;padding:8px 0;color:#9ca3af;font-size:13px;">Авторизуйтесь для просмотра истории</div>`;
    try {
        const response = await fetch(`${API_URL}/consumptions/${materialId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return `<div style="text-align:center;padding:8px 0;color:#ff5f5f;font-size:13px;">Сессия истекла</div>`;
        }
        const data = await response.json();
        if (data.status === 404) {
            return `<div style="text-align:center;padding:8px 0;color:#9ca3af;font-size:13px;">
                <i class="fa-solid fa-inbox" style="display:block;font-size:18px;margin-bottom:4px;opacity:0.5;"></i>
                Пока что расходов по этой катушке не было
            </div>`;
        }
        if (data.status !== 200) {
            throw new Error(data.message || data.error || 'Ошибка загрузки истории');
        }
        const history = data.data || [];
        if (history.length === 0) {
            return `<div style="text-align:center;padding:8px 0;color:#9ca3af;font-size:13px;">
                <i class="fa-solid fa-inbox" style="display:block;font-size:18px;margin-bottom:4px;opacity:0.5;"></i>
                Пока что расходов по этой катушке не было
            </div>`;
        }
        return `<div style="display:flex;flex-direction:column;gap:6px;max-height:150px;overflow-y:auto;padding-right:4px;">
            ${history.map(item => {
                const localTime = item.timestamp ? formatLocalDate(item.timestamp) : '';
                const remainWeight = formatWeight(item.remain_mass || 0);
                const usedWeight = formatWeight(item.used_mass || 0);
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#1a1d26;border-radius:8px;border-left:3px solid #ff5f5f;">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <span style="color:#ffffff;font-size:13px;font-weight:500;">${item.title || 'Без названия'}</span>
                        <span style="color:#9ca3af;font-size:11px;">
                            <i class="fa-regular fa-calendar"></i> ${localTime}
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:13px;color:#9ca3af;">Остаток: ${remainWeight}</span>
                        <span style="font-size:15px;font-weight:700;color:#ff5f5f;white-space:nowrap;">-${usedWeight}</span>
                    </div>
                </div>
            `}).join('')}
        </div>`;
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        return `<div style="text-align:center;padding:8px 0;color:#ff5f5f;font-size:13px;">Ошибка загрузки истории</div>`;
    }
}

function downloadQRCode() {
    const img = document.getElementById('qrCodeImage');
    if (!img) {
        showNotification('QR-код не найден', 'error');
        return;
    }
    const link = document.createElement('a');
    link.download = `qr-code-${currentFilamentId || 'filament'}.png`;
    link.href = img.src;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function deleteFilament(id) {
    if (!confirm('Вы уверены, что хотите удалить эту катушку?')) return;
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/materials/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        if (response.status === 204) {
            showNotification('Катушка успешно удалена!', 'success');
            closeDetailModal();
            loadFilaments();
            return;
        }
        const data = await response.json();
        if (data.status !== 204 && data.status !== 200) {
            throw new Error(data.message || data.error || 'Ошибка удаления');
        }
        showNotification('Катушка успешно удалена!', 'success');
        closeDetailModal();
        loadFilaments();
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// ===== ДОБАВЛЕНИЕ КАТУШКИ =====

function checkFilamentFields() {
    const name = document.getElementById('filamentName').value.trim();
    const type = document.getElementById('filamentType').value.trim();
    const color = document.getElementById('filamentColor').value.trim();
    const weight = parseFloat(document.getElementById('filamentWeight').value);
    const button = document.getElementById('addFilamentBtn');
    if (name && type && color && weight > 0 && weight <= MAX_FILAMENT_WEIGHT) {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    } else {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    ['filamentName', 'filamentType', 'filamentColor', 'filamentWeight'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', checkFilamentFields);
            el.addEventListener('change', checkFilamentFields);
        }
    });
});

function openAddFilament() {
    document.getElementById('addFilamentModal').style.display = 'flex';
    document.getElementById('filamentName').value = '';
    document.getElementById('filamentType').value = '';
    document.getElementById('filamentColor').value = '';
    document.getElementById('filamentWeight').value = '1000';
    ['filamentName', 'filamentType', 'filamentColor', 'filamentWeight'].forEach(id => {
        document.getElementById(id).style.borderColor = '';
    });
    checkFilamentFields();
}

function closeAddFilament() {
    document.getElementById('addFilamentModal').style.display = 'none';
}

document.getElementById('addFilamentModal').addEventListener('click', function(e) {
    if (e.target === this) closeAddFilament();
});

function setColor(color) {
    const map = {
        'green': 'Green', 'yellow': 'Yellow', 'red': 'Red', 'blue': 'Blue',
        'orange': 'Orange', 'purple': 'Purple', 'black': 'Black', 'white': 'White',
        'gray': 'Gray', 'silver': 'Silver', 'crimson': 'Crimson', 'pink': 'Pink',
        'gold': 'Gold', 'lime': 'Lime', 'teal': 'Teal', 'cyan': 'Cyan',
        'navy': 'Navy', 'violet': 'Violet', 'magenta': 'Magenta', 'brown': 'Brown',
        'beige': 'Beige', 'transparent': 'Transparent', 'glow': 'Glow', 'multicolor': 'Multicolor'
    };
    document.getElementById('filamentColor').value = map[color] || color;
    checkFilamentFields();
}

async function addFilamentManual() {
    const name = document.getElementById('filamentName').value.trim();
    const material_type = document.getElementById('filamentType').value.trim();
    const color = document.getElementById('filamentColor').value.trim();
    const initial_mass = parseFloat(document.getElementById('filamentWeight').value);
    if (!name || !material_type || !color || !initial_mass || initial_mass < 1) {
        showNotification('Заполните все поля корректно', 'error');
        return;
    }
    if (initial_mass > MAX_FILAMENT_WEIGHT) {
        showNotification(`Максимальный вес катушки: 1 тонна (${MAX_FILAMENT_WEIGHT} г)`, 'error');
        return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/materials/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, material_type, color, initial_mass })
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        const data = await response.json();
        if (data.status !== 201) {
            throw new Error(data.message || data.error || 'Ошибка добавления');
        }
        showNotification('Катушка успешно добавлена!', 'success');
        closeAddFilament();
        loadFilaments();
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// ===== QR-СКАНЕР =====

let html5QrCode = null;
let isScannerRunning = false;
let currentScanMethod = 'camera'; // 'camera' или 'file'

function switchScanMethod(method) {
    currentScanMethod = method;
    const cameraBtn = document.getElementById('scanCameraBtn');
    const fileBtn = document.getElementById('scanFileBtn');
    const cameraArea = document.getElementById('qrCameraArea');
    const fileArea = document.getElementById('qrFileArea');
    
    if (method === 'camera') {
        cameraBtn.style.background = '#3b82f6';
        fileBtn.style.background = '#8b5cf6';
        cameraArea.style.display = 'block';
        fileArea.style.display = 'none';
        // Если сканер был остановлен, ничего не делаем
        if (!isScannerRunning) {
            const resultsDiv = document.getElementById('qr-reader-results');
            resultsDiv.textContent = 'Нажмите "Запустить камеру" для начала сканирования';
            resultsDiv.style.color = '#9ca3af';
        }
    } else {
        fileBtn.style.background = '#3b82f6';
        cameraBtn.style.background = '#8b5cf6';
        cameraArea.style.display = 'none';
        fileArea.style.display = 'flex';
        // Останавливаем камеру, если она запущена
        if (isScannerRunning) {
            stopQRScanner();
        }
        document.getElementById('qrFileResult').textContent = 'Выберите изображение с QR-кодом';
        document.getElementById('qrFileResult').style.color = '#9ca3af';
    }
}

function openQRScanner() {
    const modal = document.getElementById('qrScannerModal');
    modal.style.display = 'flex';
    
    // Сбрасываем состояние
    const resultsDiv = document.getElementById('qr-reader-results');
    resultsDiv.textContent = 'Нажмите кнопку для запуска сканирования';
    resultsDiv.style.color = '#9ca3af';
    const readerElement = document.getElementById('qr-reader');
    readerElement.innerHTML = '';
    const toggleBtn = document.getElementById('qrScannerToggleBtn');
    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
    toggleBtn.style.background = '#8b5cf6';
    isScannerRunning = false;
    
    // Сбрасываем файловую область
    document.getElementById('qrFileResult').textContent = 'Выберите изображение с QR-кодом';
    document.getElementById('qrFileResult').style.color = '#9ca3af';
    document.getElementById('qrFileInput').value = '';
    
    // По умолчанию показываем камеру
    switchScanMethod('camera');
}

function closeQRScanner() {
    stopQRScanner();
    document.getElementById('qrScannerModal').style.display = 'none';
}

document.getElementById('qrScannerModal').addEventListener('click', function(e) {
    if (e.target === this) closeQRScanner();
});

function toggleQRScanner() {
    if (currentScanMethod === 'camera') {
        if (isScannerRunning) {
            stopQRScanner();
        } else {
            startQRScanner();
        }
    } else {
        // Если в режиме файла, открываем диалог выбора
        document.getElementById('qrFileInput').click();
    }
}

async function startQRScanner() {
    const resultsDiv = document.getElementById('qr-reader-results');
    const toggleBtn = document.getElementById('qrScannerToggleBtn');
    
    if (isScannerRunning) {
        resultsDiv.textContent = 'Сканер уже запущен';
        return;
    }
    
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            resultsDiv.innerHTML = `
                <div style="color:#f59e0b; padding:8px;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Камера недоступна. Используйте загрузку файла.
                </div>
            `;
            return;
        }
        
        resultsDiv.textContent = 'Запрос доступа к камере...';
        resultsDiv.style.color = '#9ca3af';
        
        // Проверяем доступ к камере
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (permError) {
            if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
                resultsDiv.innerHTML = `
                    <div style="color:#f59e0b; padding:8px;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        Доступ к камере запрещен. Используйте загрузку файла.
                    </div>
                `;
                return;
            }
            throw permError;
        }
        
        html5QrCode = new Html5Qrcode("qr-reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        isScannerRunning = true;
        
        toggleBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Остановить сканирование';
        toggleBtn.style.background = '#ef4444';
        
        resultsDiv.textContent = 'Сканирование... Наведите на QR-код';
        resultsDiv.style.color = '#4ade80';
        
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        );
        
    } catch (error) {
        console.error('Ошибка запуска сканера:', error);
        resultsDiv.innerHTML = `
            <div style="color:#ff5f5f; padding:8px;">
                <i class="fa-solid fa-circle-exclamation"></i>
                Ошибка: ${error.message || 'Неизвестная ошибка'}
            </div>
        `;
        isScannerRunning = false;
        toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
        toggleBtn.style.background = '#8b5cf6';
    }
}

// ===== СКАНИРОВАНИЕ ИЗ ФАЙЛА =====

async function scanQRFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const resultDiv = document.getElementById('qrFileResult');
    resultDiv.textContent = 'Обработка изображения...';
    resultDiv.style.color = '#9ca3af';
    
    try {
        // Проверяем размер файла (макс 10 МБ)
        if (file.size > 10 * 1024 * 1024) {
            resultDiv.innerHTML = '<span style="color:#ff5f5f;">Файл слишком большой (макс 10 МБ)</span>';
            return;
        }
        
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            resultDiv.innerHTML = '<span style="color:#ff5f5f;">Пожалуйста, выберите изображение</span>';
            return;
        }
        
        // Создаем временный сканер для файла
        const fileScanner = new Html5Qrcode("qr-reader");
        
        const result = await fileScanner.scanFile(file, true);
        
        if (result) {
            resultDiv.textContent = 'QR-код успешно распознан!';
            resultDiv.style.color = '#4ade80';
            onScanSuccess(result);
        } else {
            resultDiv.innerHTML = '<span style="color:#f59e0b;">QR-код не найден на изображении</span>';
        }
        
    } catch (error) {
        console.error('Ошибка сканирования файла:', error);
        if (error.message.includes('No QR code found')) {
            resultDiv.innerHTML = '<span style="color:#f59e0b;">QR-код не найден на изображении. Попробуйте другое фото.</span>';
        } else {
            resultDiv.innerHTML = `<span style="color:#ff5f5f;">Ошибка: ${error.message}</span>`;
        }
    }
}

// ===== ОБЩАЯ ОБРАБОТКА РЕЗУЛЬТАТА =====

function onScanSuccess(decodedText, decodedResult) {
    // Если сканер камеры запущен — останавливаем
    if (isScannerRunning) {
        stopQRScanner();
    }
    
    const resultsDiv = document.getElementById('qr-reader-results');
    resultsDiv.textContent = 'QR-код успешно распознан!';
    resultsDiv.style.color = '#4ade80';
    
    // Также обновляем результат в файловой области
    const fileResult = document.getElementById('qrFileResult');
    if (fileResult) {
        fileResult.textContent = 'QR-код успешно распознан!';
        fileResult.style.color = '#4ade80';
    }
    
    try {
        const data = JSON.parse(decodedText);
        console.log('QR-код данные:', data);
        
        if (data.id && data.name) {
            const filament = allFilaments.find(f => f.id === data.id);
            if (filament) {
                showNotification(`Найдена катушка: ${filament.name}`, 'success');
                setTimeout(() => {
                    closeQRScanner();
                    openDetailModal(filament.id);
                }, 500);
            } else {
                showNotification('Катушка не найдена в базе. Заполните форму.', 'info');
                setTimeout(() => {
                    closeQRScanner();
                    document.getElementById('filamentName').value = data.name || '';
                    document.getElementById('filamentType').value = data.material_type || '';
                    document.getElementById('filamentColor').value = data.color || '';
                    document.getElementById('filamentWeight').value = data.initial_mass || 1000;
                    checkFilamentFields();
                    openAddFilament();
                }, 500);
            }
        } else {
            showNotification('Неверный формат QR-кода', 'error');
        }
    } catch (e) {
        console.error('Ошибка парсинга QR:', e);
        const filamentId = parseInt(decodedText);
        if (!isNaN(filamentId)) {
            const filament = allFilaments.find(f => f.id === filamentId);
            if (filament) {
                showNotification(`Найдена катушка: ${filament.name}`, 'success');
                setTimeout(() => {
                    closeQRScanner();
                    openDetailModal(filamentId);
                }, 500);
                return;
            }
        }
        showNotification('Не удалось распознать QR-код. Неверный формат данных.', 'error');
    }
}

function onScanError(error) {
    // Игнорируем ошибки сканирования
}

function stopQRScanner() {
    const toggleBtn = document.getElementById('qrScannerToggleBtn');
    
    if (html5QrCode && isScannerRunning) {
        try {
            html5QrCode.stop().then(() => {
                html5QrCode.clear();
                isScannerRunning = false;
                document.getElementById('qr-reader-results').textContent = '⏹ Сканирование остановлено';
                document.getElementById('qr-reader-results').style.color = '#9ca3af';
                toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
                toggleBtn.style.background = '#8b5cf6';
            }).catch(err => {
                console.error('Ошибка остановки сканера:', err);
                isScannerRunning = false;
                toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
                toggleBtn.style.background = '#8b5cf6';
            });
        } catch (e) {
            console.error('Ошибка при остановке сканера:', e);
            isScannerRunning = false;
            toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
            toggleBtn.style.background = '#8b5cf6';
        }
    } else {
        const resultsDiv = document.getElementById('qr-reader-results');
        resultsDiv.textContent = 'Нажмите кнопку для запуска сканирования';
        resultsDiv.style.color = '#9ca3af';
        toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
        toggleBtn.style.background = '#8b5cf6';
        isScannerRunning = false;
    }
}

window.addEventListener('beforeunload', function() {
    if (html5QrCode && isScannerRunning) {
        try {
            html5QrCode.stop();
        } catch (e) {}
    }
});

// ===== ИНИЦИАЛИЗАЦИЯ =====

window.onload = async function() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ INDEX ===');
    const isAuth = await checkAuth();
    console.log('Авторизация:', isAuth);
    if (isAuth) {
        await loadFilaments();
        console.log('Катушки загружены');
    } else {
        console.log('Пользователь не авторизован');
    }
};