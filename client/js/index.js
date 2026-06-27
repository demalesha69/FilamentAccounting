const API_URL = 'http://186.246.28.163:8000';
let allFilaments = [];
let currentSort = 'default';
let currentFilterType = 'all';
let currentFilamentId = null;

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

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        updateAuthUI(false);
        return false;
    }
    updateAuthUI(true);
    showUsername();
    return true;
}

function updateAuthUI(isLoggedIn) {
    const container = document.getElementById('authContainer');
    if (!container) return;
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
    const activeBtn = { 'all': 'filterTypeAll', 'pla': 'filterTypePLA', 'petg': 'filterTypePETG', 'abs': 'filterTypeABS', 'tpu': 'filterTypeTPU', 'other': 'filterTypeOther' }[type];
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
            if (currentFilterType === 'other') return !['pla', 'petg', 'abs', 'tpu'].includes(type);
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
        const colorMap = { 'green': '#56d364', 'yellow': '#f5c542', 'red': '#ff5f5f', 'blue': '#58a6ff', 'orange': '#ff8c00', 'purple': '#a855f7', 'black': '#222222', 'white': '#ffffff' };
        const colorHex = colorMap[(f.color || '').toLowerCase()] || '#8b5cf6';
        const progress = Math.round(((f.current_mass || 0) / (f.initial_mass || 1)) * 100);
        return `<article class="filament-card" onclick="openDetailModal(${f.id})" style="cursor:pointer;">
            <div class="card-top">
                <div class="progress-ring" style="--progress:${progress};--ring-color:${colorHex};">
                    <span>${progress}%</span>
                </div>
                <div class="filament-info">
                    <h2>${f.name || 'Без названия'}</h2>
                    <p class="filament-color" style="color:${colorHex};">${f.color || ''} ${f.material_type ? '• ' + f.material_type : ''}</p>
                </div>
            </div>
            <div class="weight-info" style="color:${colorHex};">
                <div class="weight-dot"></div>
                <span>${f.current_mass || 0}g / ${f.initial_mass || 0}g</span>
            </div>
        </article>`;
    }).join('');
}

function openDetailModal(id) {
    currentFilamentId = id;
    const filament = allFilaments.find(f => f.id === id);
    if (!filament) {
        showNotification('Катушка не найдена', 'error');
        return;
    }
    
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('detailBody');
    
    const colorMap = { 'green': '#56d364', 'yellow': '#f5c542', 'red': '#ff5f5f', 'blue': '#58a6ff', 'orange': '#ff8c00', 'purple': '#a855f7', 'black': '#222222', 'white': '#ffffff' };
    const colorHex = colorMap[(filament.color || '').toLowerCase()] || '#8b5cf6';
    const progress = Math.round(((filament.current_mass || 0) / (filament.initial_mass || 1)) * 100);
    const used = (filament.initial_mass || 0) - (filament.current_mass || 0);
    
    const qrData = JSON.stringify({ id: filament.id, name: filament.name, material_type: filament.material_type, color: filament.color, initial_mass: filament.initial_mass, current_mass: filament.current_mass });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    
    loadConsumptionHistory(id).then(historyHtml => {
        body.innerHTML = `
            <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:flex-start;">
                <div style="flex:1; min-width:200px;">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
                        <div class="progress-ring" style="--size:80px; width:80px; height:80px; min-width:80px; --progress:${progress}; --ring-color:${colorHex};">
                            <span style="font-size:16px;">${progress}%</span>
                        </div>
                        <div>
                            <h2 style="color:#ffffff; font-size:22px; margin-bottom:4px;">${filament.name}</h2>
                            <p style="color:${colorHex}; font-size:16px; font-weight:600;">${filament.color || 'Без цвета'} ${filament.material_type ? '• ' + filament.material_type : ''}</p>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px;">
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Начальный вес</div>
                            <div style="font-size:20px; font-weight:700; color:#ffffff;">${filament.initial_mass}g</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Текущий вес</div>
                            <div style="font-size:20px; font-weight:700; color:#ffffff;">${filament.current_mass || 0}g</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Использовано</div>
                            <div style="font-size:20px; font-weight:700; color:#ff5f5f;">${used}g</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">ID</div>
                            <div style="font-size:16px; font-weight:700; color:#ffffff;">#${filament.id}</div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:160px; background:#232734; border-radius:16px; padding:16px;">
                    <div style="position:relative; display:inline-block;">
                        <img id="qrCodeImage" src="${qrUrl}" alt="QR-код" style="width:140px; height:140px; border-radius:8px; background:white; padding:8px;" />
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
        
        const data = await response.json();
        
        // Проверяем статус по документации
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
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#1a1d26;border-radius:8px;border-left:3px solid #ff5f5f;">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <span style="color:#ffffff;font-size:13px;font-weight:500;">${item.title || 'Без названия'}</span>
                        <span style="color:#9ca3af;font-size:11px;">
                            <i class="fa-regular fa-calendar"></i> ${localTime}
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:13px;color:#9ca3af;">Остаток: ${item.remain_mass}g</span>
                        <span style="font-size:15px;font-weight:700;color:#ff5f5f;white-space:nowrap;">-${item.used_mass}g</span>
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
        
        // По документации DELETE возвращает 204 с пустым телом
        if (response.status === 204) {
            showNotification('Катушка успешно удалена!', 'success');
            closeDetailModal();
            loadFilaments();
            return;
        }
        
        // Если не 204, пробуем прочитать JSON
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

function checkFilamentFields() {
    const name = document.getElementById('filamentName').value.trim();
    const type = document.getElementById('filamentType').value.trim();
    const color = document.getElementById('filamentColor').value.trim();
    const weight = document.getElementById('filamentWeight').value.trim();
    const button = document.getElementById('addFilamentBtn');
    
    if (name && type && color && weight && parseFloat(weight) > 0) {
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
    const map = { 'green': 'Green', 'yellow': 'Yellow', 'red': 'Red', 'blue': 'Blue', 'orange': 'Orange', 'purple': 'Purple' };
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

window.onload = async function() {
    await checkAuth();
    await loadFilaments();
};