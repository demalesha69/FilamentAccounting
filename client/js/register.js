const API_URL = 'http://186.246.28.163/api';

function togglePassword() {
    const password = document.getElementById('password');
    const icon = document.getElementById('passwordIcon');
    
    if (password.type === 'password') {
        password.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        password.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const button = document.getElementById('registerButton');
    
    errorDiv.style.display = 'none';
    
    if (username.length < 3) {
        showError('Логин должен содержать минимум 3 символа');
        return;
    }
    if (username.length > 50) {
        showError('Логин должен содержать максимум 50 символов');
        return;
    }
    if (password.length < 4) {
        showError('Пароль должен содержать минимум 4 символа');
        return;
    }
    if (password.length > 100) {
        showError('Пароль должен содержать максимум 100 символов');
        return;
    }
    
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Загрузка...';
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.status === 409) {
            showError(data.message || 'Пользователь уже зарегистрирован');
            return;
        }
        if (data.status !== 201) {
            showError(data.message || data.error || 'Ошибка регистрации');
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
        console.error('Ошибка:', error);
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-user-plus"></i> Зарегистрироваться';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}