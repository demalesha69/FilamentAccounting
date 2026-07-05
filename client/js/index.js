const API_URL = '/api';
let allFilaments = [];
let currentSort = 'default';
let currentSortBy = 'id';
let currentSortOrder = 'asc';

// Выбранные фильтры (множественный выбор)
let selectedTypes = [];
let selectedColors = [];
let selectedManufacturers = [];

let currentSearchQuery = '';
let currentFilamentId = null;
let compositionData = [];

// Состояния аккордеонов
let typeFilterExpanded = false;
let colorFilterExpanded = false;
let manufacturerFilterExpanded = false;

// Кеш для уникальных значений
let uniqueTypes = [];
let uniqueColors = [];
let uniqueManufacturers = [];

const MAX_FILAMENT_LENGTH = 100000000; // 100 км в миллиметрах

const MATERIAL_DEFAULTS = {
    'PLA': { density: 1.24, diameter: 1.75 },
    'PETG': { density: 1.27, diameter: 1.75 },
    'ABS': { density: 1.04, diameter: 1.75 },
    'HIPS': { density: 1.04, diameter: 1.75 },
    'SBS': { density: 1.02, diameter: 1.75 },
    'TPU': { density: 1.20, diameter: 1.75 },
    'NYLON': { density: 1.14, diameter: 1.75 },
    'ASA': { density: 1.07, diameter: 1.75 },
    'PP': { density: 0.90, diameter: 1.75 },
    'PC': { density: 1.20, diameter: 1.75 },
    'POM': { density: 1.41, diameter: 1.75 },
    'PMMA': { density: 1.18, diameter: 1.75 },
    'PEEK': { density: 1.32, diameter: 1.75 },
    'Ceramo': { density: 1.20, diameter: 1.75 },
    'PVA': { density: 1.19, diameter: 1.75 },
    'WAX': { density: 0.95, diameter: 1.75 },
    'Clearing': { density: 1.00, diameter: 1.75 }
};

const COLOR_MAP = {
    'Green': '#22c55e',
    'Yellow': '#eab308',
    'Red': '#ef4444',
    'Blue': '#3b82f6',
    'Orange': '#f97316',
    'Purple': '#a855f7',
    'Black': '#1a1a1a',
    'White': '#f3f4f6',
    'Gray': '#6b7280',
    'Silver': '#c0c0c0',
    'Crimson': '#dc2626',
    'Pink': '#ec4899',
    'Gold': '#f59e0b',
    'Lime': '#84cc16',
    'Teal': '#14b8a6',
    'Cyan': '#06b6d4',
    'Navy': '#1e3a8a',
    'Violet': '#8b5cf6',
    'Magenta': '#d946ef',
    'Brown': '#92400e',
    'Beige': '#f5e6d3',
    'Transparent': 'rgba(255,255,255,0.1)',
    'Glow': '#22d3ee',
    'Multicolor': '#8b5cf6'
};

const COLOR_NAMES = {
    'Green': 'Зеленый',
    'Yellow': 'Желтый',
    'Red': 'Красный',
    'Blue': 'Синий',
    'Orange': 'Оранжевый',
    'Purple': 'Фиолетовый',
    'Black': 'Черный',
    'White': 'Белый',
    'Gray': 'Серый',
    'Silver': 'Серебристый',
    'Crimson': 'Малиновый',
    'Pink': 'Розовый',
    'Gold': 'Золотой',
    'Lime': 'Лайм',
    'Teal': 'Бирюзовый',
    'Cyan': 'Циан',
    'Navy': 'Темно-синий',
    'Violet': 'Лиловый',
    'Magenta': 'Пурпурный',
    'Brown': 'Коричневый',
    'Beige': 'Бежевый',
    'Transparent': 'Прозрачный',
    'Glow': 'Светящийся',
    'Multicolor': 'Мультицвет'
};

const RING_COLOR_MAP = {
    'Green': '#22c55e',
    'Yellow': '#eab308',
    'Red': '#ef4444',
    'Blue': '#3b82f6',
    'Orange': '#f97316',
    'Purple': '#a855f7',
    'Black': '#4a4a4a',
    'White': '#e5e7eb',
    'Gray': '#9ca3af',
    'Silver': '#d1d5db',
    'Crimson': '#dc2626',
    'Pink': '#ec4899',
    'Gold': '#f59e0b',
    'Lime': '#84cc16',
    'Teal': '#14b8a6',
    'Cyan': '#06b6d4',
    'Navy': '#3b82f6',
    'Violet': '#8b5cf6',
    'Magenta': '#d946ef',
    'Brown': '#b45309',
    'Beige': '#d4c5b0',
    'Transparent': '#9ca3af',
    'Glow': '#22d3ee',
    'Multicolor': '#8b5cf6'
};

function formatLength(mm) {
    if (mm >= 100000000) {
        return (mm / 1000000).toFixed(3) + ' км';
    } else if (mm >= 1000000) {
        return (mm / 1000000).toFixed(2) + ' км';
    } else if (mm >= 1000) {
        return (mm / 1000).toFixed(2) + ' м';
    }
    return mm + ' мм';
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

function toggleAdvancedSettings() {
    const settings = document.getElementById('advancedSettings');
    const icon = document.getElementById('advancedIcon');
    if (settings.style.display === 'none') {
        settings.style.display = 'block';
        icon.className = 'fa-solid fa-gear fa-spin';
    } else {
        settings.style.display = 'none';
        icon.className = 'fa-solid fa-gear';
    }
}

function updateAdvancedDefaults() {
    const type = document.getElementById('filamentType').value;
    const defaults = MATERIAL_DEFAULTS[type];
    if (defaults) {
        document.getElementById('filamentDensity').value = defaults.density;
        document.getElementById('filamentDiameter').value = defaults.diameter;
    }
}

// ===== УПРАВЛЕНИЕ РАСКРЫТИЕМ =====

function toggleElement(containerId, toggleId, expandedVar) {
    const container = document.getElementById(containerId);
    const toggle = document.getElementById(toggleId);
    const chevron = toggle?.querySelector('.fa-chevron-down');
    
    if (expandedVar) {
        container.style.display = 'none';
        if (chevron) chevron.className = 'fa-solid fa-chevron-down';
    } else {
        container.style.display = 'flex';
        if (chevron) chevron.className = 'fa-solid fa-chevron-up';
    }
    return !expandedVar;
}

function toggleTypeFilter() {
    typeFilterExpanded = toggleElement('typeFilterContainer', 'filterTypeToggle', typeFilterExpanded);
    if (typeFilterExpanded) updateTypeFilterList();
}

function toggleColorFilter() {
    colorFilterExpanded = toggleElement('colorFilterContainer', 'filterColorToggle', colorFilterExpanded);
    if (colorFilterExpanded) updateColorFilterList();
}

function toggleManufacturerFilter() {
    manufacturerFilterExpanded = toggleElement('manufacturerFilterContainer', 'filterManufacturerToggle', manufacturerFilterExpanded);
    if (manufacturerFilterExpanded) updateManufacturerFilterList();
}

// ===== ОБНОВЛЕНИЕ ЛЕЙБЛОВ =====

function updateTypeLabel() {
    const label = document.getElementById('filterTypeLabel');
    const count = document.getElementById('filterTypeCount');
    if (!label) return;
    
    if (selectedTypes.length === 0) {
        label.textContent = 'Все типы';
        if (count) count.style.display = 'none';
    } else if (selectedTypes.length === 1) {
        label.textContent = selectedTypes[0];
        if (count) count.style.display = 'none';
    } else {
        label.textContent = `Типы (${selectedTypes.length})`;
        if (count) {
            count.textContent = `+${selectedTypes.length}`;
            count.style.display = 'inline';
        }
    }
}

function updateColorLabel() {
    const label = document.getElementById('filterColorLabel');
    const count = document.getElementById('filterColorCount');
    if (!label) return;
    
    if (selectedColors.length === 0) {
        label.textContent = 'Все цвета';
        if (count) count.style.display = 'none';
    } else if (selectedColors.length === 1) {
        label.textContent = COLOR_NAMES[selectedColors[0]] || selectedColors[0];
        if (count) count.style.display = 'none';
    } else {
        label.textContent = `Цвета (${selectedColors.length})`;
        if (count) {
            count.textContent = `+${selectedColors.length}`;
            count.style.display = 'inline';
        }
    }
}

function updateManufacturerLabel() {
    const label = document.getElementById('filterManufacturerLabel');
    const count = document.getElementById('filterManufacturerCount');
    if (!label) return;
    
    if (selectedManufacturers.length === 0) {
        label.textContent = 'Все производители';
        if (count) count.style.display = 'none';
    } else if (selectedManufacturers.length === 1) {
        label.textContent = selectedManufacturers[0];
        if (count) count.style.display = 'none';
    } else {
        label.textContent = `Производители (${selectedManufacturers.length})`;
        if (count) {
            count.textContent = `+${selectedManufacturers.length}`;
            count.style.display = 'inline';
        }
    }
}

// ===== УПРАВЛЕНИЕ СОСТАВОМ =====

function openCompositionModal() {
    if (compositionData.length === 0) {
        compositionData = [{ material: 'PLA', percent: 100 }];
    }
    
    renderCompositionList();
    document.getElementById('compositionModal').style.display = 'flex';
    updateCompositionTotal();
}

function closeCompositionModal() {
    document.getElementById('compositionModal').style.display = 'none';
}

function renderCompositionList() {
    const list = document.getElementById('compositionList');
    if (!list) return;
    
    list.innerHTML = compositionData.map((item, index) => `
        <div class="composition-item" style="display:flex; align-items:center; gap:10px; background:#232734; border-radius:10px; padding:8px 12px;">
            <select class="composition-material" data-index="${index}" style="flex:1; background:#1a1d26; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 12px; color:#ffffff; font-size:14px;">
                ${getMaterialOptions(item.material)}
            </select>
            <input type="number" class="composition-percent" data-index="${index}" placeholder="%" value="${item.percent}" min="0" max="100" style="width:70px; background:#1a1d26; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px; color:#ffffff; font-size:14px; text-align:center;" oninput="updateCompositionTotal()" />
            <button class="remove-composition" onclick="removeCompositionItem(${index})" style="background:transparent; border:none; color:#ff5f5f; cursor:pointer; font-size:18px; padding:4px 8px;">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('');
    
    document.querySelectorAll('.composition-material').forEach(select => {
        select.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            compositionData[index].material = this.value;
            updateCompositionTotal();
        });
    });
    
    document.querySelectorAll('.composition-percent').forEach(input => {
        input.addEventListener('input', function() {
            const index = parseInt(this.dataset.index);
            compositionData[index].percent = parseFloat(this.value) || 0;
            updateCompositionTotal();
        });
    });
}

function getMaterialOptions(selected) {
    const materials = ['PLA', 'PETG', 'ABS', 'HIPS', 'SBS', 'TPU', 'NYLON', 'ASA', 'PP', 'PC', 'POM', 'PMMA', 'PEEK', 'Ceramo', 'PVA', 'WAX', 'Clearing', 'Углеволокно', 'Стекловолокно', 'Кевлар', 'Металлик', 'Дерево', 'Светящийся', 'Другое'];
    return materials.map(m => `<option value="${m}" ${m === selected ? 'selected' : ''}>${m}</option>`).join('');
}

function addCompositionItem() {
    compositionData.push({ material: 'Другое', percent: 0 });
    renderCompositionList();
    updateCompositionTotal();
}

function removeCompositionItem(index) {
    if (compositionData.length <= 1) {
        showNotification('Должен быть хотя бы один компонент', 'error');
        return;
    }
    compositionData.splice(index, 1);
    renderCompositionList();
    updateCompositionTotal();
}

function updateCompositionTotal() {
    const total = compositionData.reduce((sum, item) => sum + (item.percent || 0), 0);
    const totalEl = document.getElementById('compositionTotal');
    if (totalEl) {
        totalEl.textContent = Math.round(total);
        totalEl.style.color = Math.abs(total - 100) < 0.01 ? '#4ade80' : '#f59e0b';
    }
}

function saveComposition() {
    const total = compositionData.reduce((sum, item) => sum + (item.percent || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
        showNotification(`Сумма компонентов должна быть 100% (сейчас ${Math.round(total)}%)`, 'error');
        return;
    }
    
    const invalidItems = compositionData.filter(item => (item.percent || 0) <= 0);
    if (invalidItems.length > 0) {
        showNotification('Все компоненты должны иметь процент > 0', 'error');
        return;
    }
    
    showNotification('Состав сохранен!', 'success');
    closeCompositionModal();
}

// ===== АВТОРИЗАЦИЯ =====

async function checkAuth() {
    const token = localStorage.getItem('token');
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

// ===== ПОЛУЧЕНИЕ УНИКАЛЬНЫХ ЗНАЧЕНИЙ =====

async function fetchUniqueValues(field) {
    const token = localStorage.getItem('token');
    if (!token) return [];
    
    try {
        const response = await fetch(`${API_URL}/materials/actual/${field}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return [];
        }
        
        const data = await response.json();
        if (data.status !== 200) {
            console.error('Ошибка получения уникальных значений:', data.message);
            return [];
        }
        
        return data.data || [];
    } catch (error) {
        console.error(`Ошибка получения уникальных значений для ${field}:`, error);
        return [];
    }
}

async function loadUniqueValues() {
    const [types, colors, manufacturers] = await Promise.all([
        fetchUniqueValues('type'),
        fetchUniqueValues('color'),
        fetchUniqueValues('manufacturer')
    ]);
    
    uniqueTypes = types;
    uniqueColors = colors;
    uniqueManufacturers = manufacturers;
}

// ===== ФИЛЬТРЫ =====

function closeFilter() {
    document.getElementById('filterModal').style.display = 'none';
}

function openFilter() {
    document.getElementById('filterModal').style.display = 'flex';
    
    updateTypeLabel();
    updateColorLabel();
    updateManufacturerLabel();
    
    if (typeFilterExpanded) updateTypeFilterList();
    if (colorFilterExpanded) updateColorFilterList();
    if (manufacturerFilterExpanded) updateManufacturerFilterList();
}

document.getElementById('filterModal').addEventListener('click', function(e) {
    if (e.target === this) closeFilter();
});

// ===== ОБНОВЛЕНИЕ СПИСКОВ =====

function updateTypeFilterList() {
    const container = document.getElementById('typeFilterContainer');
    if (!container) return;
    
    if (uniqueTypes.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:8px;color:#6b7280;font-size:13px;">Нет типов</div>`;
        return;
    }
    
    container.innerHTML = uniqueTypes.map(t => {
        const isSelected = selectedTypes.includes(t);
        return `
            <button class="filter-option ${isSelected ? 'active' : ''}" onclick="toggleType('${t}')" style="padding:6px 12px; font-size:13px;">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span>${t}</span>
            </button>
        `;
    }).join('');
}

function updateColorFilterList() {
    const container = document.getElementById('colorFilterContainer');
    if (!container) return;
    
    if (uniqueColors.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:8px;color:#6b7280;font-size:13px;">Нет цветов</div>`;
        return;
    }
    
    container.innerHTML = uniqueColors.map(c => {
        const isSelected = selectedColors.includes(c);
        const colorHex = COLOR_MAP[c] || '#8b5cf6';
        const colorName = COLOR_NAMES[c] || c;
        return `
            <button class="filter-option ${isSelected ? 'active' : ''}" onclick="toggleColor('${c}')" style="padding:6px 12px; font-size:13px;">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${colorHex}; margin:0 8px;"></span>
                <span>${colorName}</span>
            </button>
        `;
    }).join('');
}

function updateManufacturerFilterList() {
    const container = document.getElementById('manufacturerFilterContainer');
    if (!container) return;
    
    if (uniqueManufacturers.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:8px;color:#6b7280;font-size:13px;">Нет производителей</div>`;
        return;
    }
    
    container.innerHTML = uniqueManufacturers.map(m => {
        const isSelected = selectedManufacturers.includes(m);
        return `
            <button class="filter-option ${isSelected ? 'active' : ''}" onclick="toggleManufacturer('${m.replace(/'/g, "\\'")}')" style="padding:6px 12px; font-size:13px;">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span>${m}</span>
            </button>
        `;
    }).join('');
}

// ===== ПЕРЕКЛЮЧЕНИЕ ФИЛЬТРОВ =====

function toggleType(type) {
    const index = selectedTypes.indexOf(type);
    if (index === -1) {
        selectedTypes.push(type);
    } else {
        selectedTypes.splice(index, 1);
    }
    updateTypeFilterList();
    updateTypeLabel();
}

function toggleColor(color) {
    const index = selectedColors.indexOf(color);
    if (index === -1) {
        selectedColors.push(color);
    } else {
        selectedColors.splice(index, 1);
    }
    updateColorFilterList();
    updateColorLabel();
}

function toggleManufacturer(manufacturer) {
    const index = selectedManufacturers.indexOf(manufacturer);
    if (index === -1) {
        selectedManufacturers.push(manufacturer);
    } else {
        selectedManufacturers.splice(index, 1);
    }
    updateManufacturerFilterList();
    updateManufacturerLabel();
}

// ===== СОРТИРОВКА =====

function setSort(type) {
    currentSort = type;
    
    switch(type) {
        case 'default':
            currentSortBy = 'id';
            currentSortOrder = 'asc';
            break;
        case 'name':
            currentSortBy = 'name';
            currentSortOrder = 'asc';
            break;
        case 'nameDesc':
            currentSortBy = 'name';
            currentSortOrder = 'desc';
            break;
        case 'progress':
            currentSortBy = 'current_length';
            currentSortOrder = 'asc';
            break;
        case 'progressDesc':
            currentSortBy = 'current_length';
            currentSortOrder = 'desc';
            break;
        default:
            currentSortBy = 'id';
            currentSortOrder = 'asc';
    }
    
    document.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
    const activeBtn = { 
        'default': 'filterDefault', 
        'name': 'filterName', 
        'nameDesc': 'filterNameDesc', 
        'progress': 'filterProgress', 
        'progressDesc': 'filterProgressDesc'
    }[type];
    if (activeBtn) document.getElementById(activeBtn).classList.add('active');
}

// ===== ПОИСК =====

function searchFilaments() {
    currentSearchQuery = document.getElementById('searchInput')?.value.trim() || '';
    loadFilaments();
}

// ===== ПРИМЕНЕНИЕ ФИЛЬТРОВ =====

function applyFilters() {
    loadFilaments();
    closeFilter();
}

// ===== СБРОС ФИЛЬТРОВ =====

function resetFilters() {
    currentSort = 'default';
    currentSortBy = 'id';
    currentSortOrder = 'asc';
    selectedTypes = [];
    selectedColors = [];
    selectedManufacturers = [];
    currentSearchQuery = '';
    document.getElementById('searchInput').value = '';
    
    document.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterDefault').classList.add('active');
    
    updateTypeLabel();
    updateColorLabel();
    updateManufacturerLabel();
    
    if (typeFilterExpanded) updateTypeFilterList();
    if (colorFilterExpanded) updateColorFilterList();
    if (manufacturerFilterExpanded) updateManufacturerFilterList();
    
    loadFilaments();
}

// ===== ПОСТРОЕНИЕ URL =====

function buildMaterialsUrl() {
    const params = new URLSearchParams();
    
    if (currentSearchQuery) {
        params.append('name', currentSearchQuery);
    }
    
    selectedTypes.forEach(t => {
        params.append('material', t);
    });
    
    selectedColors.forEach(c => {
        params.append('color', c);
    });
    
    selectedManufacturers.forEach(m => {
        params.append('manufacturer', m);
    });
    
    if (currentSortBy) {
        params.append('sort_by', currentSortBy);
        params.append('sort_order', currentSortOrder);
    }
    
    return `${API_URL}/materials/?${params.toString()}`;
}

// ===== ЗАГРУЗКА КАТУШЕК =====

async function loadFilaments() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const url = buildMaterialsUrl();
        const response = await fetch(url, {
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
        renderFilaments(allFilaments);
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
        const colorKey = f.color || '';
        const colorHex = COLOR_MAP[colorKey] || '#8b5cf6';
        const ringColor = RING_COLOR_MAP[colorKey] || '#8b5cf6';
        const colorName = COLOR_NAMES[colorKey] || f.color || 'Без цвета';
        const progress = Math.round(((f.current_length || 0) / (f.initial_length || 1)) * 100);
        const isEmpty = (f.current_length || 0) <= 0;
        const materialType = f.material_type || 'Неизвестный тип';
        const manufacturer = f.manufacturer || '';
        const density = f.density || 1.24;
        const diameter = f.diameter || 1.75;
        
        const emptyStyles = isEmpty ? `
            opacity: 0.5;
            filter: grayscale(0.8);
            border-color: rgba(255,255,255,0.02);
        ` : '';
        
        const currentLength = formatLength(f.current_length || 0);
        const initialLength = formatLength(f.initial_length || 0);
        const lengthText = isEmpty ? '0 мм (пусто)' : `${currentLength} / ${initialLength}`;
        const lengthColor = isEmpty ? '#6b7280' : colorHex;
        
        let ringStyle;
        if (colorKey === 'Multicolor') {
            const multiColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
            const totalColors = multiColors.length;
            const segmentSize = 100 / totalColors;
            let gradientStops = [];
            
            for (let i = 0; i < totalColors; i++) {
                const start = i * segmentSize;
                const end = (i + 1) * segmentSize;
                if (start < progress) {
                    const actualEnd = Math.min(end, progress);
                    gradientStops.push(`${multiColors[i]} ${start}% ${actualEnd}%`);
                } else {
                    if (i === 0 && progress === 0) {
                        gradientStops = [`#2b2f3a 0% 100%`];
                        break;
                    }
                    if (i === 0 && progress > 0) {
                        continue;
                    }
                    const darkStart = Math.max(progress, start);
                    if (darkStart < 100) {
                        gradientStops.push(`#2b2f3a ${darkStart}% 100%`);
                    }
                    break;
                }
            }
            
            if (progress >= 100) {
                gradientStops = gradientStops.filter(stop => !stop.includes('#2b2f3a'));
                if (gradientStops.length > 0) {
                    const last = gradientStops[gradientStops.length - 1];
                    const parts = last.split(' ');
                    if (parts.length >= 3) {
                        parts[parts.length - 1] = '100%';
                        gradientStops[gradientStops.length - 1] = parts.join(' ');
                    }
                }
            }
            
            if (gradientStops.length === 0) {
                gradientStops = [`#2b2f3a 0% 100%`];
            }
            
            ringStyle = `background: conic-gradient(${gradientStops.join(', ')});`;
        } else {
            ringStyle = `background: conic-gradient(${ringColor} ${progress}%, #2b2f3a 0);`;
        }
        
        const dotStyle = colorKey === 'Multicolor' 
            ? 'background: linear-gradient(45deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7);' 
            : `background: ${colorHex};`;
        
        const emptyEmoji = isEmpty ? ' 📦' : '';
        
        const manufacturerHtml = manufacturer ? `
            <p style="font-size:11px; color:#6b7280; margin-top:1px;">
                <i class="fa-solid fa-building" style="font-size:10px; margin-right:3px;"></i>
                ${manufacturer}
            </p>
        ` : '';
        
        const specsHtml = `
            <p style="font-size:10px; color:#4a4a5a; margin-top:1px;">
                ρ=${density} г/см³ • Ø=${diameter} мм
            </p>
        `;
        
        return `<article class="filament-card" onclick="openDetailModal(${f.id})" style="cursor:pointer; ${emptyStyles}">
            <div class="card-top">
                <div class="progress-ring" style="--progress:${progress}; ${ringStyle}">
                    <span>${isEmpty ? '0%' : progress + '%'}</span>
                </div>
                <div class="filament-info">
                    <h2>${f.name || 'Без названия'}${emptyEmoji}</h2>
                    <p class="filament-color" style="color:${isEmpty ? '#6b7280' : colorHex};">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${isEmpty ? '#6b7280' : colorHex}; margin-right:6px; vertical-align:middle;"></span>
                        ${colorName}
                    </p>
                    <p style="font-size:12px; color:#6b7280; margin-top:2px;">
                        <i class="fa-solid fa-cube" style="font-size:11px; margin-right:4px;"></i>
                        ${materialType}
                    </p>
                    ${manufacturerHtml}
                    ${specsHtml}
                </div>
            </div>
            <div class="weight-info" style="color:${lengthColor};">
                <div class="weight-dot" style="${dotStyle}"></div>
                <span>${lengthText}</span>
            </div>
            ${isEmpty ? `<div style="margin-top:6px; font-size:11px; color:#6b7280; text-align:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Катушка пуста
            </div>` : ''}
        </article>`;
    }).join('');
}

// ===== ДЕТАЛИ КАТУШКИ =====

async function openDetailModal(id) {
    currentFilamentId = id;
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/materials/by_id/${id}`, {
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
        
        if (response.status === 404) {
            showNotification('Катушка не найдена', 'error');
            return;
        }
        
        const data = await response.json();
        if (data.status !== 200) {
            throw new Error(data.message || 'Ошибка загрузки катушки');
        }
        
        const filament = data.data;
        if (!filament) {
            showNotification('Катушка не найдена', 'error');
            return;
        }
        
        const modal = document.getElementById('detailModal');
        const body = document.getElementById('detailBody');
        
        const colorKey = filament.color || '';
        const colorHex = COLOR_MAP[colorKey] || '#8b5cf6';
        const ringColor = RING_COLOR_MAP[colorKey] || '#8b5cf6';
        const colorName = COLOR_NAMES[colorKey] || filament.color || 'Без цвета';
        const progress = Math.round(((filament.current_length || 0) / (filament.initial_length || 1)) * 100);
        const used = (filament.initial_length || 0) - (filament.current_length || 0);
        const isEmpty = (filament.current_length || 0) <= 0;
        
        const currentLength = formatLength(filament.current_length || 0);
        const initialLength = formatLength(filament.initial_length || 0);
        const usedLength = formatLength(used);
        const manufacturer = filament.manufacturer || '';
        const density = filament.density || 1.24;
        const diameter = filament.diameter || 1.75;
        
        let ringStyle;
        if (colorKey === 'Multicolor') {
            const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
            const totalColors = colors.length;
            const segmentSize = 100 / totalColors;
            let gradientStops = [];
            
            for (let i = 0; i < totalColors; i++) {
                const start = i * segmentSize;
                const end = (i + 1) * segmentSize;
                if (start < progress) {
                    const actualEnd = Math.min(end, progress);
                    gradientStops.push(`${colors[i]} ${start}% ${actualEnd}%`);
                }
            }
            
            if (progress < 100) {
                gradientStops.push(`#2b2f3a ${progress}% 100%`);
            }
            
            ringStyle = `background: conic-gradient(${gradientStops.join(', ')});`;
        } else {
            ringStyle = `--ring-color:${ringColor}; background: conic-gradient(var(--ring-color) ${progress}%, #2b2f3a 0);`;
        }
        
        const historyHtml = await loadConsumptionHistory(id);
        
        const emptyEmoji = isEmpty ? ' 📦' : '';
        
        const hasComposition = filament.composition && Array.isArray(filament.composition) && filament.composition.length > 0;
        
        body.innerHTML = `
            <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:flex-start; ${isEmpty ? 'opacity:0.6;' : ''}">
                <div style="flex:1; min-width:200px;">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
                        <div class="progress-ring" style="--size:80px; width:80px; height:80px; min-width:80px; --progress:${progress}; ${ringStyle}">
                            <span style="font-size:16px;">${isEmpty ? '0%' : progress + '%'}</span>
                        </div>
                        <div>
                            <h2 style="color:#ffffff; font-size:22px; margin-bottom:4px;">${filament.name}${emptyEmoji}</h2>
                            <p style="color:${isEmpty ? '#6b7280' : colorHex}; font-size:16px; font-weight:600;">${colorName} ${filament.material_type ? '• ' + filament.material_type : ''}</p>
                            ${manufacturer ? `<p style="color:#9ca3af; font-size:14px;"><i class="fa-solid fa-building"></i> ${manufacturer}</p>` : ''}
                            <p style="color:#9ca3af; font-size:13px;">Плотность: ${density} г/см³ • Диаметр: ${diameter} мм</p>
                            ${isEmpty ? `<p style="color:#ff5f5f; font-size:14px; margin-top:4px;"><i class="fa-solid fa-triangle-exclamation"></i> Катушка пуста</p>` : ''}
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px;">
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Начальная длина</div>
                            <div style="font-size:20px; font-weight:700; color:#ffffff;">${initialLength}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Текущая длина</div>
                            <div style="font-size:20px; font-weight:700; color:${isEmpty ? '#6b7280' : '#ffffff'};">${currentLength}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Использовано</div>
                            <div style="font-size:20px; font-weight:700; color:#ff5f5f;">${usedLength}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">ID</div>
                            <div style="font-size:16px; font-weight:700; color:#ffffff;">#${filament.id}</div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:160px; background:#232734; border-radius:16px; padding:16px;">
                    <div style="position:relative; display:inline-block;">
                        <div id="qrCodeContainer" style="width:140px; height:140px; border-radius:8px; background:#1a1d26; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.06);">
                            <div style="color:#6b7280; font-size:12px; text-align:center;">
                                <i class="fa-solid fa-spinner fa-spin" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                                Загрузка QR-кода...
                            </div>
                        </div>
                        <button onclick="downloadQRCode()" title="Скачать QR-код" style="position:absolute; bottom:4px; right:4px; width:32px; height:32px; border:none; border-radius:50%; background:#8b5cf6; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </div>
                    <div style="font-size:11px; color:#9ca3af; margin-top:8px; text-align:center; word-break:break-all; max-width:140px;">ID: #${filament.id}</div>
                    <div style="display:flex; gap:8px; margin-top:12px; width:100%;">
                        <button onclick="printQRCode()" style="flex:1; background:#f59e0b; color:white; border:none; border-radius:12px; padding:10px; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <i class="fa-solid fa-print"></i> QR
                        </button>
                        <button onclick="deleteFilament(${filament.id})" style="flex:1; background:#ff5f5f; color:white; border:none; border-radius:12px; padding:10px; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <i class="fa-solid fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="margin-top:16px; background:#232734; border-radius:10px; padding:12px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <i class="fa-solid fa-flask" style="color:#9ca3af; font-size:14px;"></i>
                    <span style="font-size:13px; font-weight:600; color:#9ca3af;">СОСТАВ</span>
                </div>
                ${hasComposition ? `
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${filament.composition.map(item => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; background:#1a1d26; border-radius:6px;">
                                <span style="color:#ffffff; font-size:13px;">${item.material || 'Неизвестный материал'}</span>
                                <span style="color:#8b5cf6; font-weight:600; font-size:13px;">${item.percent || 0}%</span>
                            </div>
                        `).join('')}
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px 2px 8px; border-top:2px solid rgba(139,92,246,0.3); margin-top:2px;">
                            <span style="color:#9ca3af; font-size:12px; font-weight:500;">Итого</span>
                            <span style="color:#4ade80; font-weight:700; font-size:13px;">${filament.composition.reduce((sum, item) => sum + (item.percent || 0), 0)}%</span>
                        </div>
                    </div>
                ` : `
                    <div style="text-align:center; padding:8px; color:#6b7280; font-size:13px;">
                        <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
                        Состав не указан
                    </div>
                `}
            </div>
            
            <div style="margin-top:12px; background:#232734; border-radius:10px; padding:12px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <i class="fa-solid fa-clock-rotate-left" style="color:#9ca3af; font-size:14px;"></i>
                    <span style="font-size:13px; font-weight:600; color:#9ca3af;">ИСТОРИЯ РАСХОДА</span>
                </div>
                ${historyHtml}
            </div>
        `;
        modal.style.display = 'flex';
        
        loadQRCode(filament.id);
        
    } catch (error) {
        console.error('Ошибка загрузки катушки:', error);
        showNotification('Ошибка загрузки катушки: ' + error.message, 'error');
    }
}

// ===== СОСТАВ КАТУШКИ =====

function openCompositionDetail(materialId) {
    const filament = allFilaments.find(f => f.id === materialId);
    if (!filament) {
        showNotification('Катушка не найдена', 'error');
        return;
    }
    
    const composition = filament.composition || [];
    const modal = document.getElementById('compositionDetailModal');
    const body = document.getElementById('compositionDetailBody');
    
    if (!composition || composition.length === 0) {
        body.innerHTML = `
            <div style="text-align:center; padding:20px; color:#9ca3af;">
                <i class="fa-solid fa-flask" style="font-size:32px; display:block; margin-bottom:12px; opacity:0.5;"></i>
                <p>Состав не указан</p>
            </div>
        `;
        modal.style.display = 'flex';
        return;
    }
    
    let html = `
        <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="background:#232734; border-radius:10px; padding:12px;">
                <div style="color:#9ca3af; font-size:12px; margin-bottom:8px;">Материал</div>
                <div style="color:#ffffff; font-size:16px; font-weight:600;">${filament.name}</div>
                ${filament.material_type ? `<div style="color:#9ca3af; font-size:13px; margin-top:4px;">Тип: ${filament.material_type}</div>` : ''}
            </div>
            <div style="background:#232734; border-radius:10px; padding:12px;">
                <div style="color:#9ca3af; font-size:12px; margin-bottom:8px;">Состав</div>
                ${composition.map(item => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                        <span style="color:#ffffff;">${item.material || 'Неизвестный материал'}</span>
                        <span style="color:#8b5cf6; font-weight:600;">${item.percent || 0}%</span>
                    </div>
                `).join('')}
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0 4px 0; border-top:2px solid rgba(139,92,246,0.3); margin-top:4px;">
                    <span style="color:#9ca3af; font-weight:500;">Итого</span>
                    <span style="color:#4ade80; font-weight:700;">${composition.reduce((sum, item) => sum + (item.percent || 0), 0)}%</span>
                </div>
            </div>
        </div>
    `;
    
    body.innerHTML = html;
    modal.style.display = 'flex';
}

function closeCompositionDetail() {
    document.getElementById('compositionDetailModal').style.display = 'none';
}

document.getElementById('compositionDetailModal').addEventListener('click', function(e) {
    if (e.target === this) closeCompositionDetail();
});

function printQRCode() {
    if (window.api?.printQR) {
        const filament = window.currentFilament;
        if (!filament?.uuid) {
            showNotification('UUID не найден', 'error');
            return;
        }
        window.api.printQR(filament.uuid);
        return;
    }

    const container = document.getElementById('qrCodeContainer');
    if (!container) {
        showNotification('QR-код не найден', 'error');
        return;
    }

    const img = container.querySelector('img');
    if (!img) {
        showNotification('QR-код еще не загружен', 'error');
        return;
    }

    const printContainer = document.createElement('div');
    printContainer.id = 'printQRContainer';
    printContainer.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        z-index: 9999;
        padding: 20px;
    `;
    printContainer.innerHTML = `
        <div style="
            display:flex;
            align-items:center;
            justify-content:center;
            width:100%;
            height:100%;
        ">
            <img
                src="${img.src}"
                alt="QR-код"
                style="
                    width:100%;
                    max-width:800px;
                    height:auto;
                    max-height:90vh;
                    display:block;
                    object-fit:contain;
                    background:white;
                "
            />
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @page {
            margin: 0;
            size: A4 portrait;
        }
        @media print {
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: white !important;
            }
            body * {
                visibility: hidden !important;
            }
            #printQRContainer,
            #printQRContainer * {
                visibility: visible !important;
            }
            #printQRContainer {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                z-index: 9999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            #printQRContainer img {
                width: 100% !important;
                max-width: 800px !important;
                height: auto !important;
                max-height: 90vh !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    `;
    printContainer.appendChild(style);
    document.body.appendChild(printContainer);

    setTimeout(() => {
        window.print();
        setTimeout(() => {
            document.getElementById('printQRContainer')?.remove();
        }, 1000);
    }, 300);
}

async function loadQRCode(materialId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    const container = document.getElementById('qrCodeContainer');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/materials/qr/${materialId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        
        if (response.status === 404) {
            container.innerHTML = `
                <div style="color:#6b7280; font-size:12px; text-align:center;">
                    <i class="fa-solid fa-circle-xmark" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                    QR-код не найден
                </div>
            `;
            return;
        }
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки QR-кода');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        container.innerHTML = `
            <img src="${url}" alt="QR-код" style="width:140px; height:140px; border-radius:8px; background:white; padding:8px;" />
        `;
        
        container.dataset.qrUrl = url;
        
    } catch (error) {
        console.error('Ошибка загрузки QR-кода:', error);
        container.innerHTML = `
            <div style="color:#ff5f5f; font-size:12px; text-align:center;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                Ошибка загрузки
            </div>
        `;
    }
}

function downloadQRCode() {
    const container = document.getElementById('qrCodeContainer');
    if (!container) {
        showNotification('QR-код не найден', 'error');
        return;
    }
    
    const img = container.querySelector('img');
    if (!img) {
        showNotification('QR-код еще не загружен', 'error');
        return;
    }
    
    const imgUrl = img.src;
    const token = localStorage.getItem('token');
    
    fetch(imgUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка загрузки QR-кода');
        }
        return response.blob();
    })
    .then(blob => {
        const link = document.createElement('a');
        link.download = `qr-code-${currentFilamentId || 'filament'}.svg`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 1000);
    })
    .catch(error => {
        console.error('Ошибка скачивания QR-кода:', error);
        showNotification('Ошибка скачивания QR-кода', 'error');
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
        const response = await fetch(`${API_URL}/consumptions/by_material/${materialId}`, {
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
        if (response.status === 404) {
            return `<div style="text-align:center;padding:8px 0;color:#9ca3af;font-size:13px;">
                <i class="fa-solid fa-inbox" style="display:block;font-size:18px;margin-bottom:4px;opacity:0.5;"></i>
                Пока что расходов по этой катушке не было
            </div>`;
        }
        const data = await response.json();
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
        
        // Статусы для отображения
        const statusMap = {
            'success': { color: '#4ade80', label: 'Успешно' },
            'waste': { color: '#ef4444', label: 'Брак' },
            'interrupted': { color: '#f59e0b', label: 'Прервано' }
        };
        
        return `<div style="display:flex;flex-direction:column;gap:6px;max-height:150px;overflow-y:auto;padding-right:4px;">
            ${history.map(item => {
                const localTime = item.timestamp ? formatLocalDate(item.timestamp) : '';
                const remainLength = formatLength(item.remain_length || 0);
                const usedLength = formatLength(item.used_length || 0);
                const status = item.status || 'success';
                const statusDisplay = statusMap[status] || statusMap['success'];
                const shortTitle = item.title && item.title.length > 20 ? item.title.substring(0, 20) + '...' : (item.title || 'Без названия');
                
                return `
                <div style="display:flex;flex-direction:column;padding:8px 12px;background:#1a1d26;border-radius:8px;border-left:3px solid ${statusDisplay.color};gap:4px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                        <span style="color:#ffffff;font-size:13px;font-weight:500;word-break:break-word;">${shortTitle}</span>
                        <span style="background:${statusDisplay.color}; color:${status === 'success' ? '#1a1d26' : 'white'}; font-size:9px; padding:1px 8px; border-radius:3px; white-space:nowrap; flex-shrink:0;">${statusDisplay.label}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                        <span style="color:#6b7280;font-size:10px;">
                            <i class="fa-regular fa-calendar"></i> ${localTime}
                        </span>
                        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                            <span style="font-size:11px;color:#9ca3af;">Остаток: ${remainLength}</span>
                            <span style="font-size:13px;font-weight:700;color:#ff5f5f;">-${usedLength}</span>
                        </div>
                    </div>
                </div>
            `}).join('')}
        </div>`;
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        return `<div style="text-align:center;padding:8px 0;color:#ff5f5f;font-size:13px;">Ошибка загрузки истории</div>`;
    }
}

async function deleteFilament(id) {
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
            showNotification('Катушка удалена', 'success');
            closeDetailModal();
            loadFilaments();
            return;
        }
        const data = await response.json();
        if (data.status !== 204 && data.status !== 200) {
            throw new Error(data.message || data.error || 'Ошибка удаления');
        }
        showNotification('Катушка удалена', 'success');
        closeDetailModal();
        loadFilaments();
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// ===== ДОБАВЛЕНИЕ КАТУШКИ =====

function checkFilamentFields() {
    const name = document.getElementById('filamentName').value.trim();
    const material_type = document.getElementById('filamentType').value.trim();
    const color = document.getElementById('filamentColor').value.trim();
    const length = parseFloat(document.getElementById('filamentLength').value);
    const button = document.getElementById('addFilamentBtn');
    if (name && material_type && color && length > 0 && length <= MAX_FILAMENT_LENGTH) {
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
    ['filamentName', 'filamentManufacturer', 'filamentType', 'filamentColor', 'filamentLength'].forEach(id => {
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
    document.getElementById('filamentManufacturer').value = '';
    document.getElementById('filamentType').value = '';
    document.getElementById('filamentColor').value = '';
    document.getElementById('filamentLength').value = '300000';
    document.getElementById('filamentDensity').value = '1.24';
    document.getElementById('filamentDiameter').value = '1.75';
    document.getElementById('advancedSettings').style.display = 'none';
    document.getElementById('advancedIcon').className = 'fa-solid fa-gear';
    compositionData = [{ material: 'PLA', percent: 100 }];
    ['filamentName', 'filamentManufacturer', 'filamentType', 'filamentColor', 'filamentLength'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.borderColor = '';
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
    const manufacturer = document.getElementById('filamentManufacturer').value.trim();
    const material_type = document.getElementById('filamentType').value.trim();
    const color = document.getElementById('filamentColor').value.trim();
    const initial_length = parseFloat(document.getElementById('filamentLength').value);
    
    let density = parseFloat(document.getElementById('filamentDensity').value) || 1.24;
    let diameter = parseFloat(document.getElementById('filamentDiameter').value) || 1.75;
    
    if (!name || !material_type || !color || !initial_length || initial_length < 1) {
        showNotification('Заполните все поля корректно', 'error');
        return;
    }
    if (initial_length > MAX_FILAMENT_LENGTH) {
        showNotification(`Максимальная длина катушки: 100 км (${MAX_FILAMENT_LENGTH} мм)`, 'error');
        return;
    }
    if (density < 0.1 || density > 10) {
        showNotification('Плотность должна быть от 0.1 до 10 г/см³', 'error');
        return;
    }
    if (diameter < 0.5 || diameter > 5) {
        showNotification('Диаметр должен быть от 0.5 до 5 мм', 'error');
        return;
    }
    
    const total = compositionData.reduce((sum, item) => sum + (item.percent || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
        showNotification('Сумма компонентов состава должна быть 100%', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    try {
        const requestBody = { 
            name: name, 
            material_type: material_type,
            color: color, 
            initial_length: initial_length,
            density: density,
            diameter: diameter,
            composition: compositionData
        };
        
        if (manufacturer) {
            requestBody.manufacturer = manufacturer;
        }
        
        const response = await fetch(`${API_URL}/materials/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
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
        await loadUniqueValues();
        await loadFilaments();
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// ===== QR-СКАНЕР =====

let html5QrCode = null;
let isScannerRunning = false;
let currentScanMethod = 'camera';

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
    clearQRScanner();
    switchScanMethod('camera');
}

function closeQRScanner() {
    stopQRScanner();
    document.getElementById('qrScannerModal').style.display = 'none';
    clearQRScanner();
}

function clearQRScanner() {
    const resultsDiv = document.getElementById('qr-reader-results');
    if (resultsDiv) {
        resultsDiv.textContent = 'Нажмите кнопку для запуска сканирования';
        resultsDiv.style.color = '#9ca3af';
        resultsDiv.innerHTML = '';
    }
    
    const fileResult = document.getElementById('qrFileResult');
    if (fileResult) {
        fileResult.textContent = 'Выберите изображение с QR-кодом';
        fileResult.style.color = '#9ca3af';
        fileResult.innerHTML = '';
    }
    
    const fileInput = document.getElementById('qrFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    const readerElement = document.getElementById('qr-reader');
    if (readerElement) {
        readerElement.innerHTML = '';
    }
    
    const toggleBtn = document.getElementById('qrScannerToggleBtn');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
        toggleBtn.style.background = '#8b5cf6';
    }
    
    isScannerRunning = false;
    
    if (html5QrCode) {
        try {
            html5QrCode.clear();
        } catch (e) {}
        html5QrCode = null;
    }
}

document.getElementById('qrScannerModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeQRScanner();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('qrScannerModal');
        if (modal && modal.style.display === 'flex') {
            closeQRScanner();
        }
    }
});

function toggleQRScanner() {
    if (currentScanMethod === 'camera') {
        if (isScannerRunning) {
            stopQRScanner();
        } else {
            startQRScanner();
        }
    } else {
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
    
    const readerElement = document.getElementById('qr-reader');
    readerElement.innerHTML = '';
    
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

async function scanQRFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const resultDiv = document.getElementById('qrFileResult');
    resultDiv.textContent = 'Обработка изображения...';
    resultDiv.style.color = '#9ca3af';
    resultDiv.innerHTML = '';
    
    try {
        if (file.size > 10 * 1024 * 1024) {
            resultDiv.innerHTML = '<span style="color:#ff5f5f;">Файл слишком большой (макс 10 МБ)</span>';
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            resultDiv.innerHTML = '<span style="color:#ff5f5f;">Пожалуйста, выберите изображение</span>';
            return;
        }
        
        const readerElement = document.getElementById('qr-reader');
        readerElement.innerHTML = '';
        
        const fileScanner = new Html5Qrcode("qr-reader");
        const result = await fileScanner.scanFile(file, true);
        
        if (result) {
            resultDiv.textContent = 'QR-код успешно распознан!';
            resultDiv.style.color = '#4ade80';
            try {
                fileScanner.clear();
            } catch (e) {}
            onScanSuccess(result);
        } else {
            resultDiv.innerHTML = '<span style="color:#f59e0b;">QR-код не найден на изображении</span>';
        }
        
    } catch (error) {
        console.error('Ошибка сканирования файла:', error);
        if (error.message && error.message.includes('No QR code found')) {
            resultDiv.innerHTML = '<span style="color:#f59e0b;">QR-код не найден на изображении. Попробуйте другое фото.</span>';
        } else {
            resultDiv.innerHTML = `<span style="color:#ff5f5f;">Ошибка: ${error.message || 'Неизвестная ошибка'}</span>`;
        }
    }
}

function onScanSuccess(decodedText, decodedResult) {
    if (isScannerRunning) {
        stopQRScanner();
    }
    
    const resultsDiv = document.getElementById('qr-reader-results');
    if (resultsDiv) {
        resultsDiv.textContent = 'QR-код успешно распознан!';
        resultsDiv.style.color = '#4ade80';
    }
    
    const fileResult = document.getElementById('qrFileResult');
    if (fileResult) {
        fileResult.textContent = 'QR-код успешно распознан!';
        fileResult.style.color = '#4ade80';
    }
    
    if (decodedText && decodedText.trim().length > 0) {
        findFilamentByQRCode(decodedText.trim());
    } else {
        showNotification('Не удалось распознать QR-код', 'error');
        setTimeout(() => {
            clearQRScanner();
        }, 2000);
    }
}

async function findFilamentByQRCode(qrCode) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/materials/by_qrcode/${encodeURIComponent(qrCode)}`, {
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
        
        if (response.status === 403) {
            showNotification('Доступ к этой катушке запрещен', 'error');
            setTimeout(() => {
                clearQRScanner();
            }, 2000);
            return;
        }
        
        if (response.status === 404) {
            showNotification('Катушка не найдена по QR-коду', 'error');
            setTimeout(() => {
                clearQRScanner();
            }, 2000);
            return;
        }
        
        const data = await response.json();
        if (data.status !== 200) {
            throw new Error(data.message || 'Ошибка поиска катушки');
        }
        
        const filament = data.data;
        if (filament) {
            showNotification(`Найдена катушка: ${filament.name}`, 'success');
            setTimeout(() => {
                closeQRScanner();
                openDetailModal(filament.id);
            }, 800);
        } else {
            showNotification('Катушка не найдена', 'error');
            setTimeout(() => {
                clearQRScanner();
            }, 2000);
        }
    } catch (error) {
        console.error('Ошибка поиска по QR-коду:', error);
        showNotification('Ошибка: ' + error.message, 'error');
        setTimeout(() => {
            clearQRScanner();
        }, 2000);
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
                const resultsDiv = document.getElementById('qr-reader-results');
                if (resultsDiv) {
                    resultsDiv.textContent = 'Сканирование остановлено';
                    resultsDiv.style.color = '#9ca3af';
                }
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
                    toggleBtn.style.background = '#8b5cf6';
                }
                const readerElement = document.getElementById('qr-reader');
                if (readerElement) {
                    readerElement.innerHTML = '';
                }
            }).catch(err => {
                console.error('Ошибка остановки сканера:', err);
                isScannerRunning = false;
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
                    toggleBtn.style.background = '#8b5cf6';
                }
            });
        } catch (e) {
            console.error('Ошибка при остановке сканера:', e);
            isScannerRunning = false;
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
                toggleBtn.style.background = '#8b5cf6';
            }
        }
    } else {
        const resultsDiv = document.getElementById('qr-reader-results');
        if (resultsDiv) {
            resultsDiv.textContent = 'Нажмите кнопку для запуска сканирования';
            resultsDiv.style.color = '#9ca3af';
        }
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
            toggleBtn.style.background = '#8b5cf6';
        }
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

window.onload = async function() {
    const isAuth = await checkAuth();
    if (isAuth) {
        await loadUniqueValues();
        await loadFilaments();
    }
};