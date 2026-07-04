const API_URL = 'http://186.246.28.163/api';

function toggleLoginPassword() {
    const password = document.getElementById('loginPassword');
    const icon = document.getElementById('loginPasswordIcon');
    
    if (password.type === 'password') {
        password.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        password.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('errorMessage');
    const button = document.getElementById('loginButton');
    
    errorDiv.style.display = 'none';
    
    if (!username || !password) {
        showError('Заполните все поля');
        return;
    }
    
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Загрузка...';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.status === 401) {
            showError(data.message || 'Неверный логин или пароль');
            return;
        }
        if (data.status === 404) {
            showError(data.message || 'Пользователь не найден');
            return;
        }
        if (data.status !== 200) {
            showError(data.message || 'Ошибка входа');
            return;
        }
        
        if (data.data?.token) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify({
                user_id: data.data.user_id,
                username: data.data.username
            }));
            
            window.location.href = 'index.html';
        } else {
            showError('Токен не получен от сервера');
        }
        
    } catch (error) {
        showError(error.message);
        console.error('ОШИБКА:', error);
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-sign-in-alt"></i> Войти';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}