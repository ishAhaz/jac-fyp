async function loadComponent(id, file) {
    const response = await fetch(file, { cache: "no-store" });
    const html = await response.text();
    document.getElementById(id).innerHTML = html;
}

async function initLayout() {

    // Hits the controller so Thymeleaf renders th:text (username/role/userId)
    await loadComponent("topbar", "/components/topbar");

    if (typeof initNavbarEvents === 'function') {
        initNavbarEvents();
    }

    // NOTE: username/role are already rendered server-side by Thymeleaf
    // in /components/topbar — no client-side fetch needed here.

    loadNavUserAvatar();

    if (typeof loadNotifications === 'function') {
        loadNotifications();
        setInterval(loadNotifications, 30000);
    }
}

initLayout();


// ============================================================
// NAV AVATAR — swap the fallback icon for the logged-in user's photo
// ============================================================
function loadNavUserAvatar() {
    fetch('/user/account/me', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(user => {
            if (user && user.imageBase64) {
                const img = document.getElementById('navUserAvatarImg');
                const icon = document.getElementById('navUserIconFallback');
                if (img && icon) {
                    img.src = user.imageBase64;
                    img.style.display = 'block';
                    icon.style.display = 'none';
                }
            }
        })
        .catch(err => console.warn('Nav avatar load failed:', err));
}


// ============================================================
// LOGOUT — Notiflix confirmation instead of a plain link
// ============================================================

function confirmLogout(event) {
    event.preventDefault(); // stop the anchor's default navigation

    Notiflix.Confirm.show(
        "Logout",
        "Are you sure you want to logout?",
        "Yes, Logout",
        "Cancel",
        () => {
            window.location.href = "/logout";
        },
        () => {
            // cancelled — do nothing
        }
    );
}