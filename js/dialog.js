        // ══════════════════════════════════════════════════════════════
        // CUSTOM DIALOG SYSTEM
        // ══════════════════════════════════════════════════════════════
        function showDialog(opts) {
            return new Promise(function(resolve) {
                var overlay = document.getElementById('dialogOverlay');
                var icon = document.getElementById('dialogIcon');
                var title = document.getElementById('dialogTitle');
                var msg = document.getElementById('dialogMessage');
                var input = document.getElementById('dialogInput');
                var actions = document.getElementById('dialogActions');
                var type = opts.type || 'info';
                var icons = { info: 'ℹ️', success: '✓', warning: '⚠', danger: '🗑', input: '✏️' };
                var iconClass = { info: 'info', success: 'success', warning: 'warning', danger: 'danger', input: 'input' };
                icon.className = 'dialog-icon ' + (iconClass[type] || 'info');
                icon.textContent = opts.icon || icons[type] || 'ℹ️';
                title.textContent = opts.title || '';
                msg.innerHTML = opts.message || '';
                if (opts.inputField) {
                    input.style.display = '';
                    input.value = opts.inputDefault || '';
                    input.type = opts.inputType || 'text';
                    input.placeholder = opts.inputPlaceholder || '';
                    setTimeout(function() { input.focus(); input.select(); }, 100);
                } else {
                    input.style.display = 'none';
                }
                actions.innerHTML = '';
                if (opts.cancel !== false && type !== 'success' && type !== 'info') {
                    var cancelBtn = document.createElement('button');
                    cancelBtn.className = 'dialog-btn dialog-btn-secondary';
                    cancelBtn.textContent = opts.cancelText || 'Cancel';
                    cancelBtn.onclick = function() { closeDialog(); resolve(opts.inputField ? null : false); };
                    actions.appendChild(cancelBtn);
                }
                var okBtn = document.createElement('button');
                okBtn.className = 'dialog-btn ' + (type === 'danger' ? 'dialog-btn-danger' : 'dialog-btn-primary');
                okBtn.textContent = opts.okText || 'OK';
                okBtn.onclick = function() { closeDialog(); resolve(opts.inputField ? input.value : true); };
                actions.appendChild(okBtn);
                if (opts.inputField) {
                    input.onkeydown = function(e) {
                        if (e.key === 'Enter') okBtn.click();
                        if (e.key === 'Escape') { closeDialog(); resolve(null); }
                    };
                }
                overlay.style.display = 'flex';
                requestAnimationFrame(function() { overlay.classList.add('visible'); });
                if (typeof toggleModalScrollLock === 'function') toggleModalScrollLock(true);
            });
        }
        function closeDialog() {
            var overlay = document.getElementById('dialogOverlay');
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.style.display = 'none'; }, 200);
            if (typeof toggleModalScrollLock === 'function') toggleModalScrollLock(false);
        }
