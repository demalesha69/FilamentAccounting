const API_URL = '/api';
let allConsumptions = [];
let currentConsumptionSort = 'default';
let parsedFileData = null;

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

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        return false;
    }
    try {
        const response = await fetch(`${API_URL}/consumptions/`, {
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

async function loadAllConsumptions() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch(`${API_URL}/consumptions/`, {
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
        const remainWeight = formatWeight(item.remain_mass || 0);
        const usedWeight = formatWeight(item.used_mass || 0);
        return `
        <div class="history-item" data-title="${(item.title || '').toLowerCase()}" data-material="${item.material_id || ''}">
            <div class="history-icon" style="color:#8b5cf6;">
                <i class="fa-solid fa-print"></i>
            </div>
            <div class="history-details">
                <div class="history-title">${item.title || 'Без названия'}</div>
                <div class="history-meta">
                    ${localTime}
                    • Катушка ID: ${item.material_id}
                    • Остаток: ${remainWeight}
                </div>
            </div>
            <div class="history-amount-remove">-${usedWeight}</div>
        </div>
    `}).join('');
}

function filterHistory() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    document.querySelectorAll('.history-item').forEach(item => {
        const title = item.dataset.title || '';
        const material = item.dataset.material || '';
        item.style.display = (title.includes(query) || material.includes(query)) ? 'flex' : 'none';
    });
}

function toggleSort() {
    const types = ['default', 'dateDesc', 'dateAsc', 'title', 'amount'];
    const currentIndex = types.indexOf(currentConsumptionSort);
    const nextIndex = (currentIndex + 1) % types.length;
    currentConsumptionSort = types[nextIndex];
    let sorted = [...allConsumptions];
    switch(currentConsumptionSort) {
        case 'dateDesc':
            sorted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            break;
        case 'dateAsc':
            sorted.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            break;
        case 'title':
            sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'amount':
            sorted.sort((a, b) => (a.used_mass || 0) - (b.used_mass || 0));
            break;
        default:
            break;
    }
    renderConsumptions(sorted);
    filterHistory();
}

function checkConsumptionFields() {
    const materialId = document.getElementById('consumptionMaterialSelect').value;
    const title = document.getElementById('consumptionTitle').value.trim();
    const mass = document.getElementById('consumptionMass').value.trim();
    const button = document.getElementById('addConsumptionBtn');
    if (materialId && title && mass && parseFloat(mass) > 0) {
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
    ['consumptionMaterialSelect', 'consumptionTitle', 'consumptionMass'].forEach(id => {
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
            const currentWeight = formatWeight(f.current_mass || 0);
            const initialWeight = formatWeight(f.initial_mass || 0);
            const materialType = f.material_type || 'без типа';
            option.textContent = `${f.name} (${materialType}) — ${currentWeight} / ${initialWeight}`;
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
        unit: 'g',
        tools: {},
        tool_count: 0,
        filament_used: {}
    };
    
    // Ищем использование филамента в граммах или миллиметрах
    let totalFilament = 0;
    let unit = 'g';
    let found = false;
    
    for (const line of lines) {
        // Поиск: ; filament used [g] = 123.45
        const gMatch = line.match(/; filament used \[g\]\s*=\s*([\d.]+)/i);
        if (gMatch) {
            totalFilament = parseFloat(gMatch[1]);
            unit = 'g';
            found = true;
            break;
        }
        
        // Поиск: ; filament used [mm] = 1234.56
        const mmMatch = line.match(/; filament used \[mm\]\s*=\s*([\d.]+)/i);
        if (mmMatch) {
            totalFilament = parseFloat(mmMatch[1]);
            unit = 'mm';
            found = true;
            break;
        }
        
        // Поиск: ; filament used = 123.45g
        const altMatch = line.match(/; filament used\s*=\s*([\d.]+)\s*g/i);
        if (altMatch) {
            totalFilament = parseFloat(altMatch[1]);
            unit = 'g';
            found = true;
            break;
        }
        
        // Поиск: ; filament used = 1234.56mm
        const altMmMatch = line.match(/; filament used\s*=\s*([\d.]+)\s*mm/i);
        if (altMmMatch) {
            totalFilament = parseFloat(altMmMatch[1]);
            unit = 'mm';
            found = true;
            break;
        }
        
        // Поиск: ; total filament used [g] = 123.45
        const totalMatch = line.match(/; total filament used \[g\]\s*=\s*([\d.]+)/i);
        if (totalMatch) {
            totalFilament = parseFloat(totalMatch[1]);
            unit = 'g';
            found = true;
            break;
        }
        
        // Поиск: ; extruder_1_filament_used = 123.45
        const extruderMatch = line.match(/; extruder_(\d+)_filament_used\s*=\s*([\d.]+)/i);
        if (extruderMatch) {
            const tool = parseInt(extruderMatch[1]);
            const value = parseFloat(extruderMatch[2]);
            result.tools[tool] = { used: value, unit: 'g' };
            result.tool_count = Math.max(result.tool_count, tool);
            found = true;
        }
        
        // Поиск: ; tool_1_filament_used = 123.45
        const toolMatch = line.match(/; tool_(\d+)_filament_used\s*=\s*([\d.]+)/i);
        if (toolMatch) {
            const tool = parseInt(toolMatch[1]);
            const value = parseFloat(toolMatch[2]);
            result.tools[tool] = { used: value, unit: 'g' };
            result.tool_count = Math.max(result.tool_count, tool);
            found = true;
        }
    }
    
    // Если нашли extruder или tool, используем их
    if (Object.keys(result.tools).length > 0) {
        result.total = Object.values(result.tools).reduce((sum, t) => sum + t.used, 0);
        result.unit = 'g';
        // Проверяем, есть ли mm в комментариях
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
    
    // Если не нашли стандартные метки, ищем в других форматах
    for (const line of lines) {
        // Поиск: ; filament_used: 123.45
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
    // .bgcode - бинарный формат, пробуем читать как текст
    // Ищем маркеры использования филамента
    const text = content.toString('utf-8', 0, Math.min(content.length, 5000));
    const result = {
        total: 0,
        unit: 'g',
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
    // .3mf - zip архив, внутри есть файлы с метаданными
    // Для простоты используем эмуляцию парсинга через чтение как текст
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Пытаемся найти метаданные в тексте
                const text = e.target.result;
                const result = {
                    total: 0,
                    unit: 'g',
                    tools: {},
                    tool_count: 0,
                    found: false
                };
                
                // Ищем использование филамента
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
                resolve({ total: 0, unit: 'g', tools: {}, tool_count: 0, found: false });
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

function convertMmToG(mm, density, diameter) {
    // V = π * (d/2)^2 * L
    // m = V * ρ
    const radius = diameter / 2; // мм
    const volume_mm3 = Math.PI * radius * radius * mm; // мм³
    const volume_cm3 = volume_mm3 / 1000; // см³ (1 см³ = 1000 мм³)
    const mass = volume_cm3 * density; // г
    return mass;
}

// ========== МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ РАСХОДА ==========

function openAddConsumption() {
    const modal = document.getElementById('addConsumptionModal');
    modal.style.display = 'flex';
    
    // Сбрасываем состояние
    document.getElementById('consumptionTitle').value = '';
    document.getElementById('consumptionMass').value = '10';
    document.getElementById('consumptionMass').disabled = false;
    document.getElementById('consumptionMass').style.opacity = '1';
    document.getElementById('consumptionMass').placeholder = '50';
    document.getElementById('consumptionMass').step = '1';
    document.getElementById('fileUploadArea').style.display = 'none';
    document.getElementById('manualInputArea').style.display = 'block';
    document.getElementById('fileUploadBtn').textContent = '📁 Загрузить файл слайсера';
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
    
    // Восстанавливаем кнопку добавления
    document.getElementById('addConsumptionBtn').textContent = 'Сохранить расход';
    document.getElementById('addConsumptionBtn').onclick = createConsumption;
    document.getElementById('addConsumptionBtn').style.background = '#8b5cf6';
    
    ['consumptionMaterialSelect', 'consumptionTitle', 'consumptionMass'].forEach(id => {
        document.getElementById(id).style.borderColor = '';
    });
}

function closeAddConsumption() {
    document.getElementById('addConsumptionModal').style.display = 'none';
    // Очищаем input file
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
    const massInput = document.getElementById('consumptionMass');
    const addBtn = document.getElementById('addConsumptionBtn');
    
    if (fileArea.style.display === 'none' || fileArea.style.display === '') {
        // Переключаем на загрузку файла
        fileArea.style.display = 'block';
        manualArea.style.display = 'none';
        fileBtn.textContent = '✏️ Ввести вручную';
        fileBtn.style.background = '#8b5cf6';
        fileBtn.style.color = '#ffffff';
        massInput.disabled = true;
        massInput.style.opacity = '0.5';
        addBtn.textContent = '📤 Отправить расходы из файла';
        addBtn.onclick = submitFileConsumptions;
        addBtn.style.background = '#3b82f6';
        
        // Сбрасываем выбранный файл
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('fileParsedInfo').style.display = 'none';
        document.getElementById('toolSelector').style.display = 'none';
        parsedFileData = null;
        
        // Отключаем кнопку добавления пока нет файла
        addBtn.disabled = true;
        addBtn.style.opacity = '0.5';
        addBtn.style.cursor = 'not-allowed';
    } else {
        // Возвращаем к ручному вводу
        fileArea.style.display = 'none';
        manualArea.style.display = 'block';
        fileBtn.textContent = '📁 Загрузить файл слайсера';
        fileBtn.style.background = '#232734';
        fileBtn.style.color = '#9ca3af';
        massInput.disabled = false;
        massInput.style.opacity = '1';
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
    
    // Проверяем размер файла (макс 50 МБ)
    if (file.size > 50 * 1024 * 1024) {
        showNotification('Файл слишком большой (макс 50 МБ)', 'error');
        event.target.value = '';
        return;
    }
    
    // Показываем информацию о файле
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.style.display = 'flex';
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(1) + ' КБ';
    
    // Парсим файл
    const result = await handleFileUpload(file);
    if (!result) {
        event.target.value = '';
        return;
    }
    
    parsedFileData = result;
    
    // Показываем информацию о расходе
    const parsedInfo = document.getElementById('fileParsedInfo');
    parsedInfo.style.display = 'block';
    
    let infoHtml = `<div style="background:#1a1d26; border-radius:10px; padding:12px; margin-top:8px;">`;
    infoHtml += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">`;
    infoHtml += `<span style="color:#9ca3af; font-size:13px;">📊 Общий расход:</span>`;
    infoHtml += `<span style="color:#4ade80; font-size:16px; font-weight:700;">${result.total.toFixed(2)} ${result.unit}</span>`;
    infoHtml += `</div>`;
    
    // Информация по инструментам
    const toolKeys = Object.keys(result.tools);
    if (toolKeys.length > 1) {
        infoHtml += `<div style="color:#9ca3af; font-size:12px; margin-top:4px;">🔧 Найдено инструментов: ${toolKeys.length}</div>`;
        infoHtml += `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">`;
        toolKeys.forEach(key => {
            const t = result.tools[key];
            infoHtml += `<span style="background:#232734; padding:2px 10px; border-radius:6px; font-size:12px; color:#ffffff;">T${key}: ${t.used.toFixed(2)} ${t.unit}</span>`;
        });
        infoHtml += `</div>`;
    }
    
    // Если расход в мм, показываем подсказку
    if (result.unit === 'mm') {
        infoHtml += `<div style="color:#f59e0b; font-size:11px; margin-top:6px; background:rgba(245,158,11,0.1); padding:6px 10px; border-radius:6px; border:1px solid rgba(245,158,11,0.2);">
            <i class="fa-solid fa-info-circle"></i> Расход указан в миллиметрах. Будет переведен в граммы с учетом плотности и диаметра выбранной катушки.
        </div>`;
    }
    
    infoHtml += `</div>`;
    parsedInfo.innerHTML = infoHtml;
    
    // Если несколько инструментов, показываем выбор катушек
    if (toolKeys.length > 1) {
        showToolSelector(toolKeys);
    } else {
        // Если один инструмент, скрываем селектор
        document.getElementById('toolSelector').style.display = 'none';
    }
    
    // Активируем кнопку добавления
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
                                    ${f.name} (${f.material_type || 'без типа'}) — ${formatWeight(f.current_mass || 0)}
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
        // Несколько инструментов - собираем данные из селекторов
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
            let mass = toolData.used;
            if (toolData.unit === 'mm') {
                const density = parseFloat(select.options[select.selectedIndex].dataset.density) || 1.24;
                const diameter = parseFloat(select.options[select.selectedIndex].dataset.diameter) || 1.75;
                mass = convertMmToG(mass, density, diameter);
            }
            
            if (mass > (filament.current_mass || 0)) {
                showNotification(
                    `Недостаточно материала на катушке "${filament.name}" для T${key}! Доступно: ${formatWeight(filament.current_mass || 0)}, требуется: ${formatWeight(mass)}`,
                    'error'
                );
                hasError = true;
                break;
            }
            
            consumptions.push({
                material_id: filament.id,
                title: `Печать (T${key}) из файла ${document.getElementById('fileName').textContent || ''}`,
                used_mass: Math.round(mass * 100) / 100
            });
        }
        if (hasError) return;
    } else {
        // Один инструмент - используем выбранную катушку
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
        
        let mass = parsedFileData.total;
        if (parsedFileData.unit === 'mm') {
            const density = filament.density || 1.24;
            const diameter = filament.diameter || 1.75;
            mass = convertMmToG(mass, density, diameter);
        }
        
        if (mass > (filament.current_mass || 0)) {
            showNotification(
                `Недостаточно материала на катушке "${filament.name}"! Доступно: ${formatWeight(filament.current_mass || 0)}, требуется: ${formatWeight(mass)}`,
                'error'
            );
            return;
        }
        
        const title = document.getElementById('consumptionTitle').value.trim() || 
                     `Печать из файла ${document.getElementById('fileName').textContent || ''}`;
        
        consumptions.push({
            material_id: filament.id,
            title: title,
            used_mass: Math.round(mass * 100) / 100
        });
    }
    
    // Отправляем все расходы
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        // Если несколько расходов - отправляем по очереди
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
    const usedMass = parseFloat(document.getElementById('consumptionMass').value);
    
    if (!materialId || !title || !usedMass || usedMass <= 0) {
        showNotification('Заполните все поля корректно', 'error');
        return;
    }
    
    const filament = filamentsData.find(f => f.id === parseInt(materialId));
    if (filament) {
        const currentMass = filament.current_mass || 0;
        if (usedMass > currentMass) {
            const availableWeight = formatWeight(currentMass);
            const requestedWeight = formatWeight(usedMass);
            showNotification(
                `Ошибка: недостаточно материала! Доступно: ${availableWeight}, запрошено: ${requestedWeight}`,
                'error'
            );
            return;
        }
        if (usedMass >= currentMass * 0.9 && usedMass <= currentMass) {
            showNotification(
                `Внимание: вы расходуете почти весь материал! Остаток: ${formatWeight(currentMass - usedMass)}`,
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
        const response = await fetch(`${API_URL}/consumptions/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                material_id: parseInt(materialId),
                title: title,
                used_mass: usedMass
            })
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
        
        showNotification('Расход успешно добавлен!', 'success');
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
    }
};