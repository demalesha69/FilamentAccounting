const API_URL = '/api';
let allConsumptions = [];
let currentConsumptionSort = 'default';
let currentSortOrder = 'desc';
let parsedFileData = null;

let selectedStatuses = [];
let currentSearchQuery = '';

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
    }, 5000);
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

// ===== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ СТАТУСА =====
function getStatusDisplay(status) {
    const statusMap = {
        'success': { icon: 'fa-solid fa-check-circle', color: '#4ade80', label: 'Успешно' },
        'waste': { icon: 'fa-solid fa-circle-xmark', color: '#ef4444', label: 'Брак' },
        'interrupted': { icon: 'fa-solid fa-triangle-exclamation', color: '#f59e0b', label: 'Прервано' }
    };
    return statusMap[status] || statusMap['success'];
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

// ===== ПОСТРОЕНИЕ URL ДЛЯ РАСХОДОВ =====

function buildConsumptionsUrl() {
    const params = new URLSearchParams();
    
    if (currentSearchQuery) {
        params.append('title', currentSearchQuery);
    }
    
    selectedStatuses.forEach(s => {
        params.append('status', s);
    });
    
    params.append('sort_order', currentSortOrder);
    
    const queryString = params.toString();
    return `${API_URL}/consumptions/${queryString ? '?' + queryString : ''}`;
}

// ===== ЗАГРУЗКА ВСЕХ РАСХОДОВ =====

async function loadAllConsumptions() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const url = buildConsumptionsUrl();
        console.log('Запрос расходов:', url);
        
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
        allConsumptions = data.data || [];
        renderConsumptions(allConsumptions);
    } catch (error) {
        console.error('Ошибка загрузки расходов:', error);
        document.getElementById('historyList').innerHTML = `
            <div style="text-align:center;padding:40px;color:#ff5f5f;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:48px;display:block;margin-bottom:12px;"></i>
                Ошибка загрузки истории
            </div>
        `;
        showNotification('Ошибка загрузки истории', 'error');
    }
}

function renderConsumptions(consumptions) {
    const list = document.getElementById('historyList');
    if (!consumptions || consumptions.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:40px;color:#9ca3af;">
                <i class="fa-solid fa-inbox" style="font-size:48px;display:block;margin-bottom:12px;opacity:0.5;"></i>
                <p>История расходов пуста</p>
            </div>
        `;
        return;
    }
    list.innerHTML = consumptions.map(item => {
        const localTime = item.timestamp ? formatLocalDate(item.timestamp) : '';
        const remainLength = formatLength(item.remain_length || 0);
        const usedLength = formatLength(item.used_length || 0);
        const status = item.status || 'success';
        const statusDisplay = getStatusDisplay(status);
        
        let icon = statusDisplay.icon;
        let iconColor = statusDisplay.color;
        let statusBadge = `<span style="background:${statusDisplay.color}; color:${status === 'success' ? '#1a1d26' : 'white'}; font-size:10px; padding:2px 8px; border-radius:4px; margin-left:8px;">${statusDisplay.label}</span>`;
        let statusText = `• ${statusDisplay.label}`;
        
        return `
        <div class="history-item" data-title="${(item.title || '').toLowerCase()}" data-material="${item.material_id || ''}">
            <div class="history-icon" style="color:${iconColor};">
                <i class="${icon}"></i>
            </div>
            <div class="history-details">
                <div class="history-title">
                    ${item.title || 'Без названия'}
                    ${statusBadge}
                </div>
                <div class="history-meta">
                    ${localTime}
                    • Катушка ID: ${item.material_id}
                    • Остаток: ${remainLength}
                    ${statusText}
                </div>
            </div>
            <div class="history-amount-remove">-${usedLength}</div>
        </div>
    `}).join('');
}

// ===== ПОИСК =====

function searchConsumptions() {
    currentSearchQuery = document.getElementById('searchInput').value.trim();
    loadAllConsumptions();
}

// ===== СОРТИРОВКА =====

function toggleSort() {
    if (currentSortOrder === 'desc') {
        currentSortOrder = 'asc';
    } else {
        currentSortOrder = 'desc';
    }

    updateSortButtonIcon();
    
    loadAllConsumptions();
}

function updateSortButtonIcon() {
    const button = document.querySelector('.filter-button');
    if (!button) return;
    
    if (currentSortOrder === 'desc') {
        button.innerHTML = '<i class="fa-solid fa-arrow-up-wide-short"></i>';
        button.title = 'Сортировка: по убыванию (сначала новые)';
    } else {
        button.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short"></i>';
        button.title = 'Сортировка: по возрастанию (сначала старые)';
    }
}

// ===== ФИЛЬТР ПО СТАТУСУ =====

function toggleStatusFilter(status) {
    const index = selectedStatuses.indexOf(status);
    if (index === -1) {
        selectedStatuses.push(status);
    } else {
        selectedStatuses.splice(index, 1);
    }
    updateStatusFilterUI();
    loadAllConsumptions();
}

function updateStatusFilterUI() {
    const container = document.getElementById('statusFilterContainer');
    if (!container) return;
    
    const statuses = ['success', 'waste', 'interrupted'];
    const statusNames = {
        'success': 'Успешные',
        'waste': 'Брак',
        'interrupted': 'Прерванные'
    };
    
    container.innerHTML = statuses.map(s => {
        const isSelected = selectedStatuses.includes(s);
        return `
            <button class="filter-option ${isSelected ? 'active' : ''}" onclick="toggleStatusFilter('${s}')" style="padding:6px 12px; font-size:13px;">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span>${statusNames[s] || s}</span>
            </button>
        `;
    }).join('');
    
    const label = document.getElementById('filterStatusLabel');
    const count = document.getElementById('filterStatusCount');
    if (label) {
        if (selectedStatuses.length === 0) {
            label.textContent = 'Все статусы';
            if (count) count.style.display = 'none';
        } else if (selectedStatuses.length === 1) {
            label.textContent = statusNames[selectedStatuses[0]] || selectedStatuses[0];
            if (count) count.style.display = 'none';
        } else {
            label.textContent = `Статусы (${selectedStatuses.length})`;
            if (count) {
                count.textContent = `+${selectedStatuses.length}`;
                count.style.display = 'inline';
            }
        }
    }
}

// ===== РАСКРЫТИЕ ФИЛЬТРА СТАТУСОВ =====

let statusFilterExpanded = false;

function toggleStatusFilterContainer() {
    statusFilterExpanded = !statusFilterExpanded;
    const container = document.getElementById('statusFilterContainer');
    const toggle = document.getElementById('filterStatusToggle');
    const chevron = toggle?.querySelector('.fa-chevron-down');
    
    if (statusFilterExpanded) {
        container.style.display = 'flex';
        if (chevron) chevron.className = 'fa-solid fa-chevron-up';
        updateStatusFilterUI();
    } else {
        container.style.display = 'none';
        if (chevron) chevron.className = 'fa-solid fa-chevron-down';
    }
}

// ===== ПРОВЕРКА ПОЛЕЙ =====

function checkConsumptionFields() {
    const materialId = document.getElementById('consumptionMaterialSelect').value;
    const title = document.getElementById('consumptionTitle').value.trim();
    const length = document.getElementById('consumptionLength').value.trim();
    const button = document.getElementById('addConsumptionBtn');
    
    const lengthNum = parseFloat(length) || 0;
    
    if (materialId && title && length && lengthNum > 0) {
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
    ['consumptionMaterialSelect', 'consumptionTitle', 'consumptionLength'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', checkConsumptionFields);
            el.addEventListener('change', checkConsumptionFields);
        }
    });
});

let filamentsData = [];

async function loadFilamentsForSelect() {
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
        filamentsData = data.data || [];
        const select = document.getElementById('consumptionMaterialSelect');
        select.innerHTML = '<option value="">Выберите катушку</option>';
        filamentsData.forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            const currentLength = formatLength(f.current_length || 0);
            const initialLength = formatLength(f.initial_length || 0);
            const materialType = f.material_type || 'без типа';
            option.textContent = `${f.name} (${materialType}) — ${currentLength} / ${initialLength}`;
            option.dataset.density = f.density || 1.24;
            option.dataset.diameter = f.diameter || 1.75;
            select.appendChild(option);
        });
        if (select.dataset.selectedValue) {
            select.value = select.dataset.selectedValue;
        }
        checkConsumptionFields();
    } catch (error) {
        console.error('Ошибка загрузки катушек:', error);
        showNotification('Ошибка загрузки катушек', 'error');
    }
}

// ========== ПАРСИНГ ФАЙЛОВ СЛАЙСЕРА ==========

function parseGCodeFile(content) {
    const lines = content.split('\n');
    const result = {
        total: 0,
        unit: 'mm',
        tools: {},
        tool_count: 0,
        filament_used: {}
    };
    
    let totalFilament = 0;
    let unit = 'mm';
    let found = false;
    
    for (const line of lines) {
        const gMatch = line.match(/; filament used \[g\]\s*=\s*([\d.]+)/i);
        if (gMatch) {
            totalFilament = parseFloat(gMatch[1]);
            unit = 'g';
            found = true;
            break;
        }
        
        const mmMatch = line.match(/; filament used \[mm\]\s*=\s*([\d.]+)/i);
        if (mmMatch) {
            totalFilament = parseFloat(mmMatch[1]);
            unit = 'mm';
            found = true;
            break;
        }
        
        const altMatch = line.match(/; filament used\s*=\s*([\d.]+)\s*g/i);
        if (altMatch) {
            totalFilament = parseFloat(altMatch[1]);
            unit = 'g';
            found = true;
            break;
        }
        
        const altMmMatch = line.match(/; filament used\s*=\s*([\d.]+)\s*mm/i);
        if (altMmMatch) {
            totalFilament = parseFloat(altMmMatch[1]);
            unit = 'mm';
            found = true;
            break;
        }
        
        const totalMatch = line.match(/; total filament used \[g\]\s*=\s*([\d.]+)/i);
        if (totalMatch) {
            totalFilament = parseFloat(totalMatch[1]);
            unit = 'g';
            found = true;
            break;
        }
        
        const extruderMatch = line.match(/; extruder_(\d+)_filament_used\s*=\s*([\d.]+)/i);
        if (extruderMatch) {
            const tool = parseInt(extruderMatch[1]);
            const value = parseFloat(extruderMatch[2]);
            result.tools[tool] = { used: value, unit: 'g' };
            result.tool_count = Math.max(result.tool_count, tool);
            found = true;
        }
        
        const toolMatch = line.match(/; tool_(\d+)_filament_used\s*=\s*([\d.]+)/i);
        if (toolMatch) {
            const tool = parseInt(toolMatch[1]);
            const value = parseFloat(toolMatch[2]);
            result.tools[tool] = { used: value, unit: 'g' };
            result.tool_count = Math.max(result.tool_count, tool);
            found = true;
        }
    }
    
    if (Object.keys(result.tools).length > 0) {
        result.total = Object.values(result.tools).reduce((sum, t) => sum + t.used, 0);
        result.unit = 'g';
        for (const line of lines) {
            const mmMatch = line.match(/; tool_(\d+)_filament_used\s*=\s*([\d.]+)\s*mm/i);
            if (mmMatch) {
                const tool = parseInt(mmMatch[1]);
                result.tools[tool] = { used: parseFloat(mmMatch[2]), unit: 'mm' };
                result.unit = 'mm';
            }
        }
        return { ...result, found: true };
    }
    
    if (found || totalFilament > 0) {
        result.total = totalFilament;
        result.unit = unit;
        result.tools = { 1: { used: totalFilament, unit: unit } };
        result.tool_count = 1;
        return { ...result, found: true };
    }
    
    for (const line of lines) {
        const simpleMatch = line.match(/; filament_used\s*[:=]\s*([\d.]+)/i);
        if (simpleMatch) {
            result.total = parseFloat(simpleMatch[1]);
            result.unit = 'g';
            result.tools = { 1: { used: result.total, unit: 'g' } };
            result.tool_count = 1;
            return { ...result, found: true };
        }
    }
    
    return { ...result, found: false };
}

function parseBgCodeFile(content) {
    const text = content.toString('utf-8', 0, Math.min(content.length, 5000));
    const result = {
        total: 0,
        unit: 'mm',
        tools: {},
        tool_count: 0,
        found: false
    };
    
    const lines = text.split('\n');
    for (const line of lines) {
        const gMatch = line.match(/filament used \[g\]\s*[:=]\s*([\d.]+)/i);
        if (gMatch) {
            result.total = parseFloat(gMatch[1]);
            result.unit = 'g';
            result.tools = { 1: { used: result.total, unit: 'g' } };
            result.tool_count = 1;
            result.found = true;
            break;
        }
        const mmMatch = line.match(/filament used \[mm\]\s*[:=]\s*([\d.]+)/i);
        if (mmMatch) {
            result.total = parseFloat(mmMatch[1]);
            result.unit = 'mm';
            result.tools = { 1: { used: result.total, unit: 'mm' } };
            result.tool_count = 1;
            result.found = true;
            break;
        }
    }
    return result;
}

function parse3mfFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const result = {
                    total: 0,
                    unit: 'mm',
                    tools: {},
                    tool_count: 0,
                    found: false
                };
                
                const gMatch = text.match(/filament\s*used\s*[:=]\s*([\d.]+)\s*g/i);
                if (gMatch) {
                    result.total = parseFloat(gMatch[1]);
                    result.unit = 'g';
                    result.tools = { 1: { used: result.total, unit: 'g' } };
                    result.tool_count = 1;
                    result.found = true;
                }
                const mmMatch = text.match(/filament\s*used\s*[:=]\s*([\d.]+)\s*mm/i);
                if (mmMatch && !result.found) {
                    result.total = parseFloat(mmMatch[1]);
                    result.unit = 'mm';
                    result.tools = { 1: { used: result.total, unit: 'mm' } };
                    result.tool_count = 1;
                    result.found = true;
                }
                resolve(result);
            } catch (error) {
                resolve({ total: 0, unit: 'mm', tools: {}, tool_count: 0, found: false });
            }
        };
        reader.readAsText(file);
    });
}

async function handleFileUpload(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    let result = null;
    
    try {
        if (extension === 'gcode') {
            const content = await file.text();
            result = parseGCodeFile(content);
        } else if (extension === 'bgcode') {
            const buffer = await file.arrayBuffer();
            result = parseBgCodeFile(buffer);
        } else if (extension === '3mf') {
            result = await parse3mfFile(file);
        } else {
            showNotification('Неподдерживаемый формат файла. Используйте .gcode, .bgcode или .3mf', 'error');
            return null;
        }
        
        if (!result.found || result.total <= 0) {
            showNotification('Не удалось найти информацию о расходе филамента в файле', 'error');
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('Ошибка парсинга файла:', error);
        showNotification('Ошибка при чтении файла: ' + error.message, 'error');
        return null;
    }
}

function convertGToMm(g, density, diameter) {
    const radius = diameter / 2;
    const volume_cm3 = g / density;
    const volume_mm3 = volume_cm3 * 1000;
    const length_mm = volume_mm3 / (Math.PI * radius * radius);
    return length_mm;
}

// ========== МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ РАСХОДА ==========

function openAddConsumption() {
    const modal = document.getElementById('addConsumptionModal');
    modal.style.display = 'flex';
    
    document.getElementById('consumptionTitle').value = '';
    document.getElementById('consumptionLength').value = '1000';
    document.getElementById('consumptionLength').disabled = false;
    document.getElementById('consumptionLength').style.opacity = '1';
    document.getElementById('consumptionLength').placeholder = '1000';
    document.getElementById('consumptionLength').step = '1';
    document.getElementById('printStatus').value = 'success';
    document.getElementById('fileUploadArea').style.display = 'none';
    document.getElementById('manualInputArea').style.display = 'block';
    document.getElementById('fileUploadBtn').textContent = 'Загрузить файл слайсера';
    document.getElementById('fileUploadBtn').style.background = '#232734';
    document.getElementById('fileUploadBtn').style.color = '#9ca3af';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('fileParsedInfo').innerHTML = '';
    document.getElementById('fileParsedInfo').style.display = 'none';
    document.getElementById('toolSelector').style.display = 'none';
    document.getElementById('toolSelector').innerHTML = '';
    parsedFileData = null;
    
    const select = document.getElementById('consumptionMaterialSelect');
    select.dataset.selectedValue = select.value;
    loadFilamentsForSelect();
    
    const addBtn = document.getElementById('addConsumptionBtn');
    addBtn.textContent = 'Сохранить расход';
    addBtn.onclick = createConsumption;
    addBtn.style.background = '#8b5cf6';
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
    
    ['consumptionMaterialSelect', 'consumptionTitle', 'consumptionLength'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.borderColor = '';
    });
}

function closeAddConsumption() {
    document.getElementById('addConsumptionModal').style.display = 'none';
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

document.getElementById('addConsumptionModal').addEventListener('click', function(e) {
    if (e.target === this) closeAddConsumption();
});

// ========== ПЕРЕКЛЮЧЕНИЕ МЕЖДУ РУЧНЫМ ВВОДОМ И ФАЙЛОМ ==========

function toggleFileUpload() {
    const fileArea = document.getElementById('fileUploadArea');
    const manualArea = document.getElementById('manualInputArea');
    const fileBtn = document.getElementById('fileUploadBtn');
    const lengthInput = document.getElementById('consumptionLength');
    const addBtn = document.getElementById('addConsumptionBtn');
    
    if (fileArea.style.display === 'none' || fileArea.style.display === '') {
        fileArea.style.display = 'block';
        manualArea.style.display = 'none';
        fileBtn.textContent = 'Ввести вручную';
        fileBtn.style.background = '#8b5cf6';
        fileBtn.style.color = '#ffffff';
        lengthInput.disabled = true;
        lengthInput.style.opacity = '0.5';
        
        addBtn.textContent = 'Отправить расходы из файла';
        addBtn.onclick = submitFileConsumptions;
        addBtn.style.background = '#3b82f6';
        addBtn.disabled = true;
        addBtn.style.opacity = '0.5';
        
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('fileParsedInfo').style.display = 'none';
        document.getElementById('toolSelector').style.display = 'none';
        parsedFileData = null;
    } else {
        fileArea.style.display = 'none';
        manualArea.style.display = 'block';
        fileBtn.textContent = 'Загрузить файл слайсера';
        fileBtn.style.background = '#232734';
        fileBtn.style.color = '#9ca3af';
        lengthInput.disabled = false;
        lengthInput.style.opacity = '1';
        
        addBtn.textContent = 'Сохранить расход';
        addBtn.onclick = createConsumption;
        addBtn.style.background = '#8b5cf6';
        checkConsumptionFields();
    }
}

// ========== ОБРАБОТКА ЗАГРУЗКИ ФАЙЛА ==========

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const validExtensions = ['gcode', 'bgcode', '3mf'];
    const extension = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(extension)) {
        showNotification('Неподдерживаемый формат. Используйте .gcode, .bgcode или .3mf', 'error');
        event.target.value = '';
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
        showNotification('Файл слишком большой (макс 50 МБ)', 'error');
        event.target.value = '';
        return;
    }
    
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.style.display = 'flex';
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(1) + ' КБ';
    
    const result = await handleFileUpload(file);
    if (!result) {
        event.target.value = '';
        return;
    }
    
    parsedFileData = result;
    
    const parsedInfo = document.getElementById('fileParsedInfo');
    parsedInfo.style.display = 'block';
    
    let infoHtml = `<div style="background:#1a1d26; border-radius:10px; padding:12px; margin-top:8px;">`;
    infoHtml += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">`;
    infoHtml += `<span style="color:#9ca3af; font-size:13px;">Общий расход:</span>`;
    infoHtml += `<span style="color:#4ade80; font-size:16px; font-weight:700;">${result.total.toFixed(2)} ${result.unit}</span>`;
    infoHtml += `</div>`;
    
    const toolKeys = Object.keys(result.tools);
    if (toolKeys.length > 1) {
        infoHtml += `<div style="color:#9ca3af; font-size:12px; margin-top:4px;">Найдено инструментов: ${toolKeys.length}</div>`;
        infoHtml += `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">`;
        toolKeys.forEach(key => {
            const t = result.tools[key];
            infoHtml += `<span style="background:#232734; padding:2px 10px; border-radius:6px; font-size:12px; color:#ffffff;">T${key}: ${t.used.toFixed(2)} ${t.unit}</span>`;
        });
        infoHtml += `</div>`;
    }
    
    if (result.unit === 'g') {
        infoHtml += `<div style="color:#f59e0b; font-size:11px; margin-top:6px; background:rgba(245,158,11,0.1); padding:6px 10px; border-radius:6px; border:1px solid rgba(245,158,11,0.2);">
            <i class="fa-solid fa-info-circle"></i> Расход указан в граммах. Будет переведен в миллиметры с учетом плотности и диаметра выбранной катушки.
        </div>`;
    }
    
    infoHtml += `</div>`;
    parsedInfo.innerHTML = infoHtml;
    
    if (toolKeys.length > 1) {
        showToolSelector(toolKeys);
    } else {
        document.getElementById('toolSelector').style.display = 'none';
    }
    
    const addBtn = document.getElementById('addConsumptionBtn');
    addBtn.disabled = false;
    addBtn.style.opacity = '1';
    addBtn.style.cursor = 'pointer';
}

function showToolSelector(toolKeys) {
    const container = document.getElementById('toolSelector');
    container.style.display = 'block';
    container.innerHTML = `
        <div style="margin-top:12px;">
            <label style="color:#9ca3af; font-size:13px; display:block; margin-bottom:8px;">
                <i class="fa-solid fa-cog"></i> Назначьте катушки для каждого инструмента:
            </label>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${toolKeys.map(key => `
                    <div style="display:flex; align-items:center; gap:10px; background:#232734; padding:8px 12px; border-radius:8px;">
                        <span style="color:#ffffff; font-weight:600; font-size:14px; min-width:40px;">T${key}</span>
                        <span style="color:#9ca3af; font-size:12px;">${parsedFileData.tools[key].used.toFixed(2)} ${parsedFileData.tools[key].unit}</span>
                        <select id="toolSelect_${key}" style="flex:1; background:#1a1d26; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px; color:#ffffff; font-size:13px;">
                            <option value="">Выберите катушку</option>
                            ${filamentsData.map(f => `
                                <option value="${f.id}" data-density="${f.density || 1.24}" data-diameter="${f.diameter || 1.75}">
                                    ${f.name} (${f.material_type || 'без типа'}) — ${formatLength(f.current_length || 0)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:8px; font-size:12px; color:#6b7280;">
                <i class="fa-solid fa-triangle-exclamation"></i> Для каждого инструмента выберите катушку, с которой будет списан расход
            </div>
        </div>
    `;
}

// ========== ОТПРАВКА РАСХОДОВ ИЗ ФАЙЛА ==========

async function submitFileConsumptions() {
    if (!parsedFileData) {
        showNotification('Сначала загрузите файл', 'error');
        return;
    }
    
    const toolKeys = Object.keys(parsedFileData.tools);
    let consumptions = [];
    
    if (toolKeys.length > 1) {
        let hasError = false;
        for (const key of toolKeys) {
            const select = document.getElementById(`toolSelect_${key}`);
            if (!select || !select.value) {
                showNotification(`Выберите катушку для инструмента T${key}`, 'error');
                hasError = true;
                break;
            }
            const filament = filamentsData.find(f => f.id === parseInt(select.value));
            if (!filament) {
                showNotification(`Катушка для T${key} не найдена`, 'error');
                hasError = true;
                break;
            }
            const toolData = parsedFileData.tools[key];
            let length = toolData.used;
            if (toolData.unit === 'g') {
                const density = parseFloat(select.options[select.selectedIndex].dataset.density) || 1.24;
                const diameter = parseFloat(select.options[select.selectedIndex].dataset.diameter) || 1.75;
                length = convertGToMm(length, density, diameter);
            }
            
            if (length > (filament.current_length || 0)) {
                showNotification(
                    `Недостаточно материала на катушке "${filament.name}" для T${key}! Доступно: ${formatLength(filament.current_length || 0)}, требуется: ${formatLength(length)}`,
                    'error'
                );
                hasError = true;
                break;
            }
            
            consumptions.push({
                material_id: filament.id,
                title: `Печать (T${key}) из файла ${document.getElementById('fileName').textContent || ''}`,
                used_length: Math.round(length * 100) / 100,
                status: 'success'
            });
        }
        if (hasError) return;
    } else {
        const select = document.getElementById('consumptionMaterialSelect');
        if (!select.value) {
            showNotification('Выберите катушку', 'error');
            return;
        }
        const filament = filamentsData.find(f => f.id === parseInt(select.value));
        if (!filament) {
            showNotification('Катушка не найдена', 'error');
            return;
        }
        
        let length = parsedFileData.total;
        if (parsedFileData.unit === 'g') {
            const density = filament.density || 1.24;
            const diameter = filament.diameter || 1.75;
            length = convertGToMm(length, density, diameter);
        }
        
        if (length > (filament.current_length || 0)) {
            showNotification(
                `Недостаточно материала на катушке "${filament.name}"! Доступно: ${formatLength(filament.current_length || 0)}, требуется: ${formatLength(length)}`,
                'error'
            );
            return;
        }
        
        const title = document.getElementById('consumptionTitle').value.trim() || 
                     `Печать из файла ${document.getElementById('fileName').textContent || ''}`;
        
        consumptions.push({
            material_id: filament.id,
            title: title,
            used_length: Math.round(length * 100) / 100,
            status: 'success'
        });
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        let successCount = 0;
        for (const consumption of consumptions) {
            const response = await fetch(`${API_URL}/consumptions/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(consumption)
            });
            
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                redirectToLogin();
                return;
            }
            
            const data = await response.json();
            if (data.status === 201) {
                successCount++;
            } else {
                console.error('Ошибка создания расхода:', data);
                showNotification(`Ошибка при создании расхода: ${data.message || 'Неизвестная ошибка'}`, 'error');
            }
        }
        
        if (successCount > 0) {
            showNotification(`Успешно добавлено ${successCount} расходов!`, 'success');
            closeAddConsumption();
            await loadAllConsumptions();
        } else {
            showNotification('Не удалось добавить расходы', 'error');
        }
    } catch (error) {
        console.error('Ошибка отправки расходов:', error);
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// ========== РУЧНОЕ СОЗДАНИЕ РАСХОДА ==========

async function createConsumption() {
    const materialId = document.getElementById('consumptionMaterialSelect').value;
    const title = document.getElementById('consumptionTitle').value.trim();
    const usedLength = parseFloat(document.getElementById('consumptionLength').value);
    const status = document.getElementById('printStatus').value;
    
    if (!materialId || !title || !usedLength || usedLength <= 0) {
        showNotification('Заполните все поля корректно', 'error');
        return;
    }
    
    const filament = filamentsData.find(f => f.id === parseInt(materialId));
    if (filament) {
        const currentLength = filament.current_length || 0;
        if (usedLength > currentLength) {
            const availableLength = formatLength(currentLength);
            const requestedLength = formatLength(usedLength);
            showNotification(
                `Ошибка: недостаточно материала! Доступно: ${availableLength}, запрошено: ${requestedLength}`,
                'error'
            );
            return;
        }
        if (usedLength >= currentLength * 0.9 && usedLength <= currentLength) {
            showNotification(
                `Внимание: вы расходуете почти весь материал! Остаток: ${formatLength(currentLength - usedLength)}`,
                'info'
            );
        }
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        const payload = {
            material_id: parseInt(materialId),
            title: title,
            used_length: usedLength,
            status: status
        };
        
        const response = await fetch(`${API_URL}/consumptions/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        
        const data = await response.json();
        if (data.status !== 201) {
            throw new Error(data.message || data.error || 'Ошибка создания расхода');
        }
        
        const statusNames = {
            'success': 'Успешная печать',
            'waste': 'Брак',
            'interrupted': 'Прерванная печать'
        };
        
        showNotification(`Расход (${statusNames[status] || status}) успешно добавлен`, 'success');
        closeAddConsumption();
        await loadAllConsumptions();
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

window.onload = async function() {
    const isAuth = await checkAuth();
    if (isAuth) {
        await loadAllConsumptions();
        await loadFilamentsForSelect();
        updateStatusFilterUI();
        updateSortButtonIcon();
    }
};