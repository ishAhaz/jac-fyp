// /**
//  * layout-sidebar.js
//  * Janith Agro Center
//  * Loads sidebar.html into #sidebar. Every link is a normal full
//  * page navigation — no AJAX, no SPA behavior. Simple and reliable.
//  */
//
// const SIDEBAR_SCROLL_KEY = 'sidebar-scroll-pos';
//
// async function loadComponent(id, file) {
//     const response = await fetch(file);
//     const html     = await response.text();
//     document.getElementById(id).innerHTML = html;
// }
//
// function toggleSidebarDropdown(toggleId, subId) {
//     const toggle = document.getElementById(toggleId);
//     const sub    = document.getElementById(subId);
//     const isOpen = toggle.classList.contains('open');
//     document.querySelectorAll('.sidebar-dropdown-toggle.open').forEach(el => el.classList.remove('open'));
//     document.querySelectorAll('.sidebar-sub.open').forEach(el => el.classList.remove('open'));
//     if (!isOpen) { toggle.classList.add('open'); sub.classList.add('open'); }
// }
//
// function setActiveSidebarLink() {
//     const path = window.location.pathname;
//
//     document.querySelectorAll('.sidebar-item, .sidebar-subitem').forEach(link => {
//         const href = link.getAttribute('href');
//         if (!href) return;
//
//         if (path === href || (href !== '/' && path.startsWith(href))) {
//             link.classList.add('active');
//
//             const sub = link.closest('.sidebar-sub');
//             if (sub) {
//                 sub.classList.add('open');
//                 const section = sub.closest('.sidebar-section');
//                 if (section) {
//                     const toggle = section.querySelector('.sidebar-dropdown-toggle');
//                     if (toggle) toggle.classList.add('open');
//                 }
//             }
//         }
//     });
// }
//
// function initSidebarScrollPersistence() {
//     const sidebarEl = document.getElementById('sidebar');
//     if (!sidebarEl) return;
//
//     const savedPos = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
//     if (savedPos !== null) sidebarEl.scrollTop = parseInt(savedPos, 10);
//
//     window.addEventListener('beforeunload', () => {
//         sessionStorage.setItem(SIDEBAR_SCROLL_KEY, sidebarEl.scrollTop);
//     });
// }
//
// function initSidebarEvents() {
//     setActiveSidebarLink();
//     initSidebarScrollPersistence();
// }
//
// async function initLayout() {
//     await loadComponent('sidebar', '/components/sidebar.html');
//     initSidebarEvents();
// }
//
// initLayout();


/**
 * layout-sidebar.js
 * Janith Agro Center
 * Loads sidebar.html into #sidebar. Every link is a normal full
 * page navigation — no AJAX, no SPA behavior.
 *
 * Keeps the correct dropdown section expanded (based on current URL)
 * and restores scroll position across full page reloads, so a long
 * sidebar doesn't reset to the top on every click.
 */

const SIDEBAR_SCROLL_KEY = 'sidebar-scroll-pos';

async function loadComponent(id, file) {
    const response = await fetch(file);
    const html     = await response.text();
    document.getElementById(id).innerHTML = html;
}

function toggleSidebarDropdown(toggleId, subId) {
    const toggle = document.getElementById(toggleId);
    const sub    = document.getElementById(subId);
    const isOpen = toggle.classList.contains('open');
    document.querySelectorAll('.sidebar-dropdown-toggle.open').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.sidebar-sub.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) { toggle.classList.add('open'); sub.classList.add('open'); }
}

function setActiveSidebarLink() {
    const path = window.location.pathname;

    document.querySelectorAll('.sidebar-item, .sidebar-subitem').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        if (path === href || (href !== '/' && path.startsWith(href))) {
            link.classList.add('active');

            const sub = link.closest('.sidebar-sub');
            if (sub) {
                sub.classList.add('open');
                const section = sub.closest('.sidebar-section');
                if (section) {
                    const toggle = section.querySelector('.sidebar-dropdown-toggle');
                    if (toggle) toggle.classList.add('open');
                }
            }
        }
    });
}

function initSidebarScrollPersistence() {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    // Restore AFTER dropdown expansion so the saved pixel position
    // matches the sidebar's actual expanded height on this page
    const savedPos = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (savedPos !== null) {
        sidebarEl.scrollTop = parseInt(savedPos, 10);
    }

    let scrollSaveTimeout;
    sidebarEl.addEventListener('scroll', () => {
        clearTimeout(scrollSaveTimeout);
        scrollSaveTimeout = setTimeout(() => {
            sessionStorage.setItem(SIDEBAR_SCROLL_KEY, sidebarEl.scrollTop);
        }, 100);
    });

    sidebarEl.addEventListener('click', (e) => {
        if (e.target.closest('a[href]')) {
            sessionStorage.setItem(SIDEBAR_SCROLL_KEY, sidebarEl.scrollTop);
        }
    });
}

function initSidebarEvents() {
    setActiveSidebarLink();          // expand correct dropdown FIRST
    initSidebarScrollPersistence();  // then restore scroll position
}

async function initLayout() {
    await loadComponent('sidebar', '/components/sidebar.html');
    initSidebarEvents();
}

initLayout();