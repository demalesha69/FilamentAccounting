const API_URL = 'http://186.246.28.163:8000';
let allConsumptions = [];
let currentConsumptionSort = 'default';

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
                    • Остаток: ${item.remain_mass}g
                </div>
            </div>
            <div class="history-amount-remove">-${item.used_mass}g</div>
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
        const data = await response.json();
        if (data.status !== 200) {
            throw new Error(data.message || data.error || 'Ошибка загрузки');
        }
        const select = document.getElementById('consumptionMaterialSelect');
        select.innerHTML = '<option value="">Выберите катушку</option>';
        (data.data || []).forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            const currentMass = f.current_mass || 0;
            const initialMass = f.initial_mass || 0;
            option.textContent = `${f.name} (${f.color || 'без цвета'}) — ${currentMass}g / ${initialMass}g`;
            select.appendChild(option);
        });
        checkConsumptionFields();
    } catch (error) {
        console.error('Ошибка загрузки катушек:', error);
        showNotification('Ошибка загрузки катушек', 'error');
    }
}

function openAddConsumption() {
    document.getElementById('addConsumptionModal').style.display = 'flex';
    document.getElementById('consumptionTitle').value = '';
    document.getElementById('consumptionMass').value = '10';
    loadFilamentsForSelect();
    ['consumptionMaterialSelect', 'consumptionTitle', 'consumptionMass'].forEach(id => {
        document.getElementById(id).style.borderColor = '';
    });
}

function closeAddConsumption() {
    document.getElementById('addConsumptionModal').style.display = 'none';
}

document.getElementById('addConsumptionModal').addEventListener('click', function(e) {
    if (e.target === this) closeAddConsumption();
});

async function createConsumption() {
    const materialId = document.getElementById('consumptionMaterialSelect').value;
    const title = document.getElementById('consumptionTitle').value.trim();
    const usedMass = parseFloat(document.getElementById('consumptionMass').value);
    
    if (!materialId || !title || !usedMass || usedMass <= 0) {
        showNotification('Заполните все поля корректно', 'error');
        return;
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

window.onload = async function() {
    await checkAuth();
    await loadAllConsumptions();
};