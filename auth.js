document.addEventListener('DOMContentLoaded', () => {
    // Verifique se o usuário já está "logado" na sessão
    if (sessionStorage.getItem('loggedIn') === 'true') {
        // Se a página atual for o index.html, redireciona para o dashboard
        if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // Se não está logado e tenta acessar páginas internas, volta pro login
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
    }

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const errorP = document.getElementById('login-error');

            // CREDENCIAIS SIMULADAS - Altere aqui
            if (user === 'admin' && pass === 'admin') {
                sessionStorage.setItem('loggedIn', 'true');
                window.location.href = 'dashboard.html';
            } else {
                errorP.textContent = 'Usuário ou senha inválidos.';
            }
        });
    }

    // A função de logout será chamada pelo botão no dashboard.js
});

function handleLogout() {
    sessionStorage.removeItem('loggedIn');
    window.location.href = 'index.html';
}