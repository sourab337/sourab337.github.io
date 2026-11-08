document.addEventListener('DOMContentLoaded', () => {
    // === Hamburger Menu ===
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    const closeMobileMenu = () => {
        if (hamburger) {
            hamburger.classList.remove('active');
        }
        if (navLinks) {
            navLinks.classList.remove('active');
        }
    };

    const setActiveNavLink = () => {
        const currentPath = window.location.pathname.split('/').pop()?.toLowerCase() || 'index.html';

        document.querySelectorAll('.nav-links a').forEach((link) => {
            const href = link.getAttribute('href') || '';
            const linkPath = href.split('/').pop()?.toLowerCase() || 'index.html';
            const isActive = linkPath === currentPath || (currentPath === '' && linkPath === 'index.html');

            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', (event) => {
            event.stopPropagation();
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach((link) => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        document.addEventListener('click', (event) => {
            if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
                closeMobileMenu();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMobileMenu();
            }
        });
    }

    setActiveNavLink();

    // === Dark/Light Theme Switcher ===
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeIcon(currentTheme);

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme');
            const newTheme = theme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('portfolio-theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
                icon.title = 'Switch to Light Mode';
            } else {
                icon.className = 'fas fa-moon';
                icon.title = 'Switch to Dark Mode';
            }
        }
    }
});
