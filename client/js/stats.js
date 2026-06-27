const API_URL = 'http://186.246.28.163:8000';
let currentPeriod = 'all';
let currentStartTimestamp = null;
let currentEndTimestamp = null;

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

function formatLocalDateShort(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp * 1000);
        if (isNaN(date.getTime())) return String(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    } catch (e) {
        return String(timestamp);
    }
}

function getDateRange(period) {
    const now = Math.floor(Date.now() / 1000);
    let start = 0;
    
    switch(period) {
        case 'day':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            start = Math.floor(today.getTime() / 1000);
            break;
        case 'week':
            start = now - 7 * 24 * 60 * 60;
            break;
        case 'month':
            start = now - 30 * 24 * 60 * 60;
            break;
        case 'year':
            start = now - 365 * 24 * 60 * 60;
            break;
        case 'all':
        default:
            start = 0;
            break;
    }
    return { start, end: now };
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

async function loadStats(startTimestamp = null, endTimestamp = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        let url = `${API_URL}/statistics`;
        const params = [];
        
        if (startTimestamp !== null) {
            params.push(`start_timestamp=${startTimestamp}`);
        }
        if (endTimestamp !== null) {
            params.push(`end_timestamp=${endTimestamp}`);
        }
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        console.log('Запрос статистики:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('Полный ответ статистики:', data);
        
        // Проверяем статус по документации
        if (data.status !== 200) {
            throw new Error(data.message || 'Ошибка загрузки статистики');
        }
        
        const statsData = data.data;
        updateStats(statsData);
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        showNotification('Ошибка загрузки статистики: ' + error.message, 'error');
    }
}

function updateStats(data) {
    console.log('updateStats получил:', data);
    
    const totalUsed = data.total_used_mass || 0;
    const materialsCount = data.materials_count || 0;
    const consumptionsCount = data.consumptions_count || 0;
    
    let avgPerDay = 0;
    if (currentPeriod !== 'all' && currentPeriod !== 'custom') {
        const range = getDateRange(currentPeriod);
        const days = Math.max(1, Math.ceil((range.end - range.start) / (24 * 60 * 60)));
        avgPerDay = totalUsed / days;
    } else if (currentPeriod === 'all' && totalUsed > 0 && data.first_consumption_timestamp) {
        const firstTs = data.first_consumption_timestamp;
        const now = Math.floor(Date.now() / 1000);
        const days = Math.max(1, Math.ceil((now - firstTs) / (24 * 60 * 60)));
        avgPerDay = totalUsed / days;
    }
    
    document.getElementById('totalUsed').textContent = totalUsed.toFixed(1);
    document.getElementById('totalMaterials').textContent = materialsCount;
    document.getElementById('totalOperations').textContent = consumptionsCount;
    document.getElementById('avgPerDay').textContent = avgPerDay > 0 ? avgPerDay.toFixed(1) : '—';
}

function setPeriod(period) {
    currentPeriod = period;
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.period-btn[data-period="${period}"]`);
    if (btn) btn.classList.add('active');
    
    const range = getDateRange(period);
    currentStartTimestamp = range.start;
    currentEndTimestamp = range.end;
    
    console.log('Период:', period, 'с:', currentStartTimestamp, 'по:', currentEndTimestamp);
    loadStats(currentStartTimestamp, currentEndTimestamp);
}

function setCustomPeriod() {
    const from = document.getElementById('dateFrom').value;
    const to = document.getElementById('dateTo').value;
    if (!from || !to) {
        showNotification('Выберите обе даты', 'error');
        return;
    }
    
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    currentPeriod = 'custom';
    
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    
    currentStartTimestamp = Math.floor(startDate.getTime() / 1000);
    currentEndTimestamp = Math.floor(endDate.getTime() / 1000);
    
    loadStats(currentStartTimestamp, currentEndTimestamp);
}

window.onload = async function() {
    await checkAuth();
    setPeriod('all');
};