    // ── Navigation ───────────────────────────────────────────────
    const navItems = document.querySelectorAll('.nav-item');
    const panels   = document.querySelectorAll('.panel');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.panel;

        navItems.forEach(n => n.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        item.classList.add('active');
        document.getElementById(target).classList.add('active');

        // Close mobile sidebar after selection
        document.getElementById('sidebar').classList.remove('open');

        // Scroll main to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // ── Mobile toggle ────────────────────────────────────────────
    document.getElementById('mobileNavToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', e => {
      const sidebar = document.getElementById('sidebar');
      const toggle  = document.getElementById('mobileNavToggle');
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });