// ── Allow Enter key to submit ─────────────────────────────────────────
document.getElementById('inputPassword').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
});
document.getElementById('inputUsername').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
});

// ── Login function ────────────────────────────────────────────────────
function doLogin() {
    const username = document.getElementById('inputUsername').value.trim();
    const password = document.getElementById('inputPassword').value.trim();
    const errorDiv = document.getElementById('loginError');
    const errorMsg = document.getElementById('loginErrorMsg');

    // Basic client-side check
    if (!username || !password) {
        errorMsg.textContent = 'Please enter username and password.';
        errorDiv.style.display = 'block';
        return;
    }

    errorDiv.style.display = 'none';

    const btn = document.getElementById('btnLogin');
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    // Spring Security's default login filter expects form-urlencoded
    // params at /login, not a JSON body — matches loginProcessingUrl("/login")
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/dashboard';
            } else {
                errorMsg.textContent = data.message || 'Invalid username or password.';
                errorDiv.style.display = 'block';
                btn.textContent = 'Login';
                btn.disabled = false;
            }
        })
        .catch(() => {
            errorMsg.textContent = 'Server error. Please try again.';
            errorDiv.style.display = 'block';
            btn.textContent = 'Login';
            btn.disabled = false;
        });
}