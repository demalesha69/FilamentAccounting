const API_URL = '/api';
let currentPeriod = 'all';
let currentStartTimestamp = null;
let currentEndTimestamp = null;

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

// ===== СТАТИСТИКА =====

async function loadStats(startTimestamp = null, endTimestamp = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        clearStats();
        return;
    }
    
    try {
        let url = `${API_URL}/statistics/`;
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
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Ответ не JSON:', text.substring(0, 200));
            showNotification('Сервер вернул ошибку. Проверьте подключение к интернету.', 'error');
            clearStats();
            return;
        }
        
        const data = await response.json();
        console.log('Данные статистики:', data);
        
        if (data.status !== 200) {
            throw new Error(data.message || 'Ошибка загрузки статистики');
        }
        
        const statsData = data.data;
        updateStats(statsData);
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        showNotification('Ошибка загрузки статистики: ' + error.message, 'error');
        clearStats();
    }
}

function clearStats() {
    document.getElementById('totalUsed').textContent = '—';
    document.getElementById('successUsed').textContent = '—';
    document.getElementById('wasteUsed').textContent = '—';
    document.getElementById('efficiency').textContent = '—';
    document.getElementById('avgPerPrint').textContent = '—';
    document.getElementById('avgPerDay').textContent = '—';
    document.getElementById('totalMaterials').textContent = '—';
    document.getElementById('totalOperations').textContent = '—';
}

function updateStats(data) {
    // Основные показатели
    const totalUsed = data.total_used_length || 0;
    const successUsed = data.success_used_length || 0;
    const wasteUsed = data.waste_used_length || 0;
    const efficiency = data.efficiency || 0;
    const avgPerPrint = data.avg_per_print || 0;
    const avgPerDay = data.avg_per_day || 0;
    const materialsCount = data.materials_count || 0;
    const consumptionsCount = data.consumptions_count || 0;
    
    // Форматируем значения
    document.getElementById('totalUsed').textContent = formatLength(totalUsed);
    document.getElementById('successUsed').textContent = formatLength(successUsed);
    document.getElementById('wasteUsed').textContent = formatLength(wasteUsed);
    
    // Эффективность в процентах
    const efficiencyPercent = Math.round(efficiency * 100);
    document.getElementById('efficiency').textContent = efficiencyPercent + '%';
    
    // Меняем цвет эффективности
    const efficiencyEl = document.getElementById('efficiency');
    if (efficiencyPercent >= 80) {
        efficiencyEl.style.color = '#4ade80';
    } else if (efficiencyPercent >= 50) {
        efficiencyEl.style.color = '#f59e0b';
    } else {
        efficiencyEl.style.color = '#ef4444';
    }
    
    document.getElementById('avgPerPrint').textContent = formatLength(Math.round(avgPerPrint));
    document.getElementById('avgPerDay').textContent = formatLength(Math.round(avgPerDay));
    document.getElementById('totalMaterials').textContent = materialsCount;
    document.getElementById('totalOperations').textContent = consumptionsCount;
    
    // Обновляем период для среднего в день
    const periodLabel = document.getElementById('periodLabel');
    if (periodLabel) {
        const periodNames = {
            'all': 'за все время',
            'day': 'за день',
            'week': 'за неделю',
            'month': 'за месяц',
            'year': 'за год',
            'custom': 'за выбранный период'
        };
        periodLabel.textContent = periodNames[currentPeriod] || '';
    }
}

function setPeriod(period) {
    currentPeriod = period;
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.period-btn[data-period="${period}"]`);
    if (btn) btn.classList.add('active');
    
    const range = getDateRange(period);
    currentStartTimestamp = range.start;
    currentEndTimestamp = range.end;
    
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

// Инициализация
window.onload = async function() {
    console.log('=== СТАТИСТИКА: ЗАГРУЗКА ===');
    const isAuth = await checkAuth();
    console.log('Авторизация:', isAuth);
    if (isAuth) {
        setPeriod('all');
    } else {
        clearStats();
    }
};