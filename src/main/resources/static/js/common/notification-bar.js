(function () {

    // ── Fetch role-based notifications from backend ────────────────────────
    function loadNotifications() {
        fetch('/notification/allfor')
            .then(r => r.json())
            .then(list => renderNotifications(list))
            .catch(err => console.warn('Notifications unavailable', err));
    }

    function renderNotifications(list) {
        const container = document.getElementById('notifList');
        const badge     = document.getElementById('notifBadge');
        const empty     = document.getElementById('notifEmpty');

        // Remove old notification items (keep header and empty placeholder)
        container.querySelectorAll('.notif-item').forEach(el => el.remove());

        if (list.length > 0) {
            badge.textContent   = list.length > 9 ? '9+' : list.length;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }

        if (list.length === 0) {
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        list.forEach(n => {
            const li     = document.createElement('li');
            li.className = 'notif-item border-bottom';
            li.innerHTML = `
                <div class="d-flex gap-2 px-3 py-2 align-items-start">
                    <span class="mt-1 flex-shrink-0"
                          style="width:8px;height:8px;border-radius:50%;
                                 background:${dotColor(n.type)};display:inline-block;margin-top:6px;">
                    </span>
                    <div class="flex-grow-1">
                        <div class="small fw-semibold">${escHtml(n.type)}</div>
                        <div class="small text-muted">${escHtml(n.message)}</div>
                        <div style="font-size:10px;" class="text-muted mt-1">${timeAgo(n.createddatetime)}</div>
                    </div>
                </div>`;
            container.appendChild(li);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    function dotColor(type) {
        const map = {
            'DELIVERY_ASSIGNED': '#198754',
            'LOW_STOCK':         '#dc3545',
            'NEW_ORDER':         '#ffc107',
            'GENERAL':           '#6c757d'
        };
        return map[type] || '#6c757d';
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)    return 'Just now';
        if (diff < 3600)  return Math.floor(diff / 60)    + ' min ago';
        if (diff < 86400) return Math.floor(diff / 3600)  + ' hr ago';
        return                   Math.floor(diff / 86400) + ' days ago';
    }

    function escHtml(str) {
        const d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    // ── Expose init function for layout-topbar.js to call after DOM is ready ────
    window.loadNotifications = loadNotifications;

    // No auto-init here.
    // layout-topbar.js calls loadNotifications()
    // only after the topbar HTML has been injected into the DOM.

})();