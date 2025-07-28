class UniversalNav {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupNavigation());
        } else {
            this.setupNavigation();
        }
    }

    setupNavigation() {
        // Setup hamburger menu
        this.setupHamburgerMenu();
        
        // Load categories for menu
        this.loadCategoriesMenu();
        
        // Setup category toggle
        this.setupCategoryToggle();
    }

    setupHamburgerMenu() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const closeMenu = document.getElementById('closeMenu');
        const body = document.body;

        if (!hamburgerBtn || !hamburgerMenu) return;

        hamburgerBtn.addEventListener('click', () => {
            hamburgerMenu.classList.add('active');
            body.style.overflow = 'hidden';
        });

        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                this.closeHamburgerMenu();
            });
        }

        hamburgerMenu.addEventListener('click', (e) => {
            if (e.target === hamburgerMenu) {
                this.closeHamburgerMenu();
            }
        });
    }

    closeHamburgerMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const body = document.body;
        
        if (hamburgerMenu) {
            hamburgerMenu.classList.remove('active');
            body.style.overflow = '';
        }
    }

    loadCategoriesMenu() {
        const categorySubmenu = document.getElementById('categorySubmenu');

        fetch('/api/categories')
            .then(response => response.json())
            .then(categories => {
                if (categorySubmenu) {
                    categorySubmenu.innerHTML = `
                        <a href="#" class="category-link" onclick="universalNav.handleCategoryClick(event, 'all')">
                            <i class="fas fa-list"></i> All Articles
                        </a>
                        ${categories.map(category => `
                            <a href="#" class="category-link" onclick="universalNav.handleCategoryClick(event, '${category.name}')">
                                <i class="fas fa-tag"></i> ${category.name}
                            </a>
                        `).join('')}
                    `;
                }
            })
            .catch(err => console.error('Error loading categories:', err));
    }

    setupCategoryToggle() {
        // Make toggleCategoryMenu globally available
        window.toggleCategoryMenu = () => {
            const submenu = document.getElementById('categorySubmenu');
            const chevron = document.querySelector('.category-toggle .chevron');
            
            if (submenu && chevron) {
                submenu.classList.toggle('active');
                chevron.classList.toggle('rotate');
            }
        };
    }

    handleCategoryClick(event, category) {
        event.preventDefault();
        
        // Close hamburger menu
        this.closeHamburgerMenu();
        
        // Redirect to homepage with category filter
        if (category === 'all') {
            window.location.href = '/';
        } else {
            window.location.href = `/?category=${encodeURIComponent(category)}`;
        }
    }
}

// Initialize universal navigation
const universalNav = new UniversalNav();