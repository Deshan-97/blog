// Detect which page is loaded - only handle homepage, not admin pages
if (document.getElementById('articlesContainer')) {
  // Homepage logic for TikTok-style interface
  let allArticles = []; // Store all articles for filtering
  let currentFilter = null; // Store current category filter
  
  async function loadArticles(categoryFilter = null) {      
    const articlesContainer = document.getElementById('articlesContainer');
    const loadingSpinner = document.querySelector('.loading-spinner');
    
    // Show loading
    loadingSpinner.classList.remove('hidden');
    
    try {
      // Use the API endpoint that includes category information
      const res = await fetch('/api/articles-with-categories');
      const articles = await res.json();
      
      // Store all articles for filtering
      allArticles = articles;   
      
      // Filter articles if category filter is applied
      let filteredArticles = articles;
      if (categoryFilter) {
        filteredArticles = articles.filter(article => 
          article.category_name && article.category_name.toLowerCase() === categoryFilter.toLowerCase()
        );
      }
      
      // Hide loading
      loadingSpinner.classList.add('hidden');
      
      if (Array.isArray(filteredArticles) && filteredArticles.length > 0) {
        // Clear existing static articles and load real ones
        articlesContainer.innerHTML = filteredArticles.map((article, index) => `
          <article class="article-card ${index === 0 ? 'active' : ''}" data-article-id="article-${article.id}" data-bg="${article.image || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'}">
            <div class="article-background"></div>
            <div class="article-overlay"></div>
            <div class="article-content">
              <div class="article-header">
                <span class="category ${article.category_name ? 'category-clickable' : ''}" data-category="${article.category_name || ''}">${article.category_name || 'Uncategorized'}</span>
                <span class="read-time">${article.read_time || Math.ceil(article.content.length / 200) + ' min read'}</span>
              </div>
              <h1 class="article-title">${article.title}</h1>
              <p class="article-excerpt">${article.excerpt || (article.content.length > 150 ? article.content.substring(0, 150) + '...' : article.content)}</p>
              <div class="article-meta">
                <small>Posted: ${new Date(article.created_at).toLocaleDateString()}</small>
              </div>
            </div>
          </article>
        `).join('');
        
        // Initialize the TikTok-style functionality
        initializeTikTokInterface();
        
        // Setup bookmark functionality for existing side button
        setupSideBookmarkButton();
        
        // Setup category click functionality
        setupCategoryClickHandlers();
        
        // Setup article click functionality for navigation to reader
        setupArticleClickHandlers();
        
        // Update bookmark icons based on saved bookmarks
        setTimeout(() => updateBookmarkIcons(), 100);
      } else if (categoryFilter) {
        // Show message when no articles found for category
        articlesContainer.innerHTML = `
          <article class="article-card active">
            <div class="article-background"></div>
            <div class="article-overlay"></div>
            <div class="article-content">
              <div class="article-header">
                <span class="category">No Results</span>
              </div>
              <h1 class="article-title">No articles found in "${categoryFilter}" category</h1>
              <p class="article-excerpt">Try browsing all articles or select a different category.</p>
              <div class="filter-actions">
                <button class="clear-filter-btn" onclick="clearCategoryFilter()">Show All Articles</button>
              </div>
            </div>
          </article>
        `;
      } else {
        articlesContainer.innerHTML = `
          <article class="article-card active">
            <div class="article-background"></div>
            <div class="article-overlay"></div>
            <div class="article-content">
              <div class="article-header">
                <span class="category">Info</span>
                <span class="read-time">1 min read</span>
              </div>
              <h1 class="article-title">No Articles Yet</h1>
              <p class="article-excerpt">Visit the admin panel to add your first article!</p>
            </div>
          </article>
        `;
      }
    } catch (err) {
      loadingSpinner.classList.add('hidden');
      articlesContainer.innerHTML = `
        <article class="article-card active">
          <div class="article-background"></div>
          <div class="article-overlay"></div>
          <div class="article-content">
            <div class="article-header">
              <span class="category">Error</span>
              <span class="read-time">1 min read</span>
            </div>
            <h1 class="article-title">Failed to Load Articles</h1>
            <p class="article-excerpt">Please check your connection and try again.</p>
          </div>
        </article>
      `;
    }
  }

  // Category filtering functions
  function setupCategoryClickHandlers() {
    document.querySelectorAll('.category-clickable').forEach(categoryElement => {
      categoryElement.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent article navigation
        const categoryName = this.dataset.category;
        if (categoryName && categoryName !== 'Uncategorized') {
          filterByCategory(categoryName);
        }
      });
      
      // Add visual feedback for clickable categories
      categoryElement.style.cursor = 'pointer';
      categoryElement.title = `Click to filter by ${categoryElement.dataset.category}`;
    });
  }

  // Setup article click handlers for navigation to reader page
  function setupArticleClickHandlers() {
    document.querySelectorAll('.article-card').forEach(articleCard => {
      articleCard.addEventListener('click', function(e) {
        // Don't navigate if clicking on category or other interactive elements
        if (e.target.classList.contains('category-clickable') || 
            e.target.closest('.category-clickable')) {
          return;
        }
        
        // Extract article ID from data attribute
        const articleIdStr = this.dataset.articleId; // e.g., "article-123"
        if (articleIdStr) {
          const articleId = articleIdStr.replace('article-', '');
          navigateToArticleReader(articleId);
        }
      });
      
      // Add visual feedback for clickable articles
      articleCard.style.cursor = 'pointer';
    });
  }

  // Navigate to article reader page
  function navigateToArticleReader(articleId) {
    window.location.href = `article-reader.html?id=${articleId}`;
  }

  function filterByCategory(categoryName) {
    currentFilter = categoryName;
    
    // Show loading state
    const articlesContainer = document.getElementById('articlesContainer');
    articlesContainer.innerHTML = `
      <article class="article-card active">
        <div class="article-background"></div>
        <div class="article-overlay"></div>
        <div class="article-content">
          <div class="article-header">
            <span class="category">Loading...</span>
          </div>
          <h1 class="article-title">Filtering by ${categoryName}</h1>
          <p class="article-excerpt">Loading articles in this category...</p>
        </div>
      </article>
    `;
    
    // Add filter indicator
    addFilterIndicator(categoryName);
    
    // Reload articles with filter
    setTimeout(() => loadArticles(categoryName), 500);
  }

  function clearCategoryFilter() {
    currentFilter = null;
    removeFilterIndicator();
    loadArticles();
  }

  function addFilterIndicator(categoryName) {
    // Remove existing filter indicator
    removeFilterIndicator();
    
    // Add filter indicator to navigation
    const navContent = document.querySelector('.nav-content');
    const filterIndicator = document.createElement('div');
    filterIndicator.className = 'filter-indicator';
    filterIndicator.innerHTML = `
      <span class="filter-text">Filtered by: ${categoryName}</span>
      <button class="filter-clear" onclick="clearCategoryFilter()">
        <i class="fas fa-times"></i>
      </button>
    `;
    navContent.appendChild(filterIndicator);
  }

  function removeFilterIndicator() {
    const existingIndicator = document.querySelector('.filter-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }

  // Make functions globally available
  window.clearCategoryFilter = clearCategoryFilter;
  window.filterByCategory = filterByCategory;

  // Initialize TikTok-style interface functionality
  function initializeTikTokInterface() {
    // Set background images for articles
    document.querySelectorAll('.article-card').forEach(card => {
      const bgUrl = card.dataset.bg;
      if (bgUrl) {
        card.querySelector('.article-background').style.backgroundImage = `url(${bgUrl})`;
      }
    });

    // Initialize TikTok-style navigation
    setupTikTokNavigation();
  }

  // Setup TikTok-style article navigation
  function setupTikTokNavigation() {
    const articlesContainer = document.getElementById('articlesContainer');
    const articles = document.querySelectorAll('.article-card');
    let currentIndex = 0;
    let startY = 0;
    let isScrolling = false;

    if (articles.length === 0) return;

    // Show first article
    showArticle(currentIndex);

    // Touch/Mouse events for swiping
    articlesContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    articlesContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    articlesContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Mouse events for desktop
    articlesContainer.addEventListener('mousedown', handleMouseStart);
    articlesContainer.addEventListener('mousemove', handleMouseMove);
    articlesContainer.addEventListener('mouseup', handleMouseEnd);
    articlesContainer.addEventListener('mouseleave', handleMouseEnd);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);

    // Wheel event for desktop scrolling
    articlesContainer.addEventListener('wheel', handleWheel, { passive: false });

    function handleTouchStart(e) {
      if (isScrolling) return;
      startY = e.touches[0].clientY;
    }

    function handleTouchMove(e) {
      if (isScrolling) return;
      e.preventDefault();
      
      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      
      if (Math.abs(deltaY) > 10) {
        if (deltaY > 50) {
          // Swipe up - next article
          navigateToArticle(currentIndex + 1);
        } else if (deltaY < -50) {
          // Swipe down - previous article
          navigateToArticle(currentIndex - 1);
        }
      }
    }

    function handleTouchEnd(e) {
      // Reset
    }

    function handleMouseStart(e) {
      if (isScrolling) return;
      startY = e.clientY;
    }

    function handleMouseMove(e) {
      if (isScrolling || !startY) return;
      
      const currentY = e.clientY;
      const deltaY = startY - currentY;
      
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
          navigateToArticle(currentIndex + 1);
        } else {
          navigateToArticle(currentIndex - 1);
        }
        startY = 0;
      }
    }

    function handleMouseEnd(e) {
      startY = 0;
    }

    function handleKeyDown(e) {
      if (isScrolling) return;
      
      switch(e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          navigateToArticle(currentIndex - 1);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          navigateToArticle(currentIndex + 1);
          break;
      }
    }

    function handleWheel(e) {
      if (isScrolling) return;
      e.preventDefault();
      
      if (e.deltaY > 0) {
        navigateToArticle(currentIndex + 1);
      } else {
        navigateToArticle(currentIndex - 1);
      }
    }

    function navigateToArticle(newIndex) {
      if (isScrolling) return;
      
      // Bounds check
      if (newIndex < 0 || newIndex >= articles.length) return;
      
      isScrolling = true;
      
      // Hide current article
      articles[currentIndex].classList.remove('active');
      
      // Show new article
      currentIndex = newIndex;
      showArticle(currentIndex);
      
      // Reset scrolling flag after animation
      setTimeout(() => {
        isScrolling = false;
      }, 800);
    }

    // Navigate to specific article by index (for search results)
    function navigateToArticleIndex(targetIndex) {
      if (targetIndex >= 0 && targetIndex < articles.length) {
        navigateToArticle(targetIndex);
      }
    }

    // Make navigation function globally accessible
    window.navigateToArticleIndex = navigateToArticleIndex;

    function showArticle(index) {
      articles.forEach((article, i) => {
        article.classList.remove('active', 'prev', 'next');
        
        if (i === index) {
          article.classList.add('active');
        } else if (i < index) {
          article.classList.add('prev');
        } else {
          article.classList.add('next');
        }
      });
      
      // Update article background
      const activeArticle = articles[index];
      const bgUrl = activeArticle.dataset.bg;
      if (bgUrl) {
        activeArticle.querySelector('.article-background').style.backgroundImage = `url(${bgUrl})`;
      }
      
      // Update bookmark button state for the new active article
      updateBookmarkIcons();
    }
  }

  // Load articles when page loads
  loadArticles();
  
  // Load categories for both mobile and desktop menus
  loadCategoriesMenu();
  
  // Load categories for the hamburger menu and desktop dropdown
  async function loadCategoriesMenu() {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      
      const categories = await response.json();
      const categorySubmenu = document.getElementById('categorySubmenu');
      const desktopCategoryDropdown = document.getElementById('desktopCategoryDropdown');
      
      if (categories.length > 0) {
        // Mobile hamburger menu categories
        if (categorySubmenu) {
          const mobileCategoriesHTML = categories.map(category => `
            <li class="category-item">
              <a href="#" class="category-link" onclick="filterByCategory('${category.name}'); closeHamburgerMenu();">
                <i class="fas fa-tag"></i>
                <span>${category.name}</span>
              </a>
            </li>
          `).join('');
          
          categorySubmenu.innerHTML = `
            <li class="category-item">
              <a href="#" class="category-link" onclick="clearCategoryFilter(); closeHamburgerMenu();">
                <i class="fas fa-list"></i>
                <span>All Articles</span>
              </a>
            </li>
            ${mobileCategoriesHTML}
          `;
        }
        
        // Desktop dropdown categories
        if (desktopCategoryDropdown) {
          const desktopCategoriesHTML = categories.map(category => `
            <a href="#" class="desktop-category-link" onclick="filterByCategory('${category.name}');">
              <i class="fas fa-tag"></i>
              <span>${category.name}</span>
            </a>
          `).join('');
          
          desktopCategoryDropdown.innerHTML = `
            <a href="#" class="desktop-category-link" onclick="clearCategoryFilter();">
              <i class="fas fa-list"></i>
              <span>All Articles</span>
            </a>
            ${desktopCategoriesHTML}
          `;
        }
      }
    } catch (error) {
      console.error('Error loading categories for menu:', error);
    }
  }

  // Setup category menu toggle
  function setupCategoryMenuToggle() {
    const categoriesToggle = document.getElementById('categoriesToggle');
    const categorySubmenu = document.getElementById('categorySubmenu');
    
    if (categoriesToggle && categorySubmenu) {
      categoriesToggle.addEventListener('click', function(e) {
        e.preventDefault();
        categorySubmenu.classList.toggle('open');
        const chevron = this.querySelector('.category-chevron');
        if (chevron) {
          chevron.style.transform = categorySubmenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      });
    }
  }

  // Call setup functions
  setupCategoryMenuToggle();
}

// Bookmark functionality
function toggleBookmark(articleId, title, excerpt, image, readTime) {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
  const existingIndex = bookmarks.findIndex(b => b.id === articleId);
  
  if (existingIndex > -1) {
    // Remove bookmark
    bookmarks.splice(existingIndex, 1);
    showToast('Bookmark removed!');
  } else {
    // Add bookmark
    const bookmark = {
      id: articleId,
      title: title,
      excerpt: excerpt,
      image: image,
      category: 'Article',
      readTime: readTime || '2 min read',
      url: `index.html#article-${articleId}`,
      bookmarkedAt: new Date().toISOString()
    };
    bookmarks.unshift(bookmark);
    showToast('Article bookmarked!');
  }
  
  localStorage.setItem('bookmarkedArticles', JSON.stringify(bookmarks));
  updateBookmarkIcons();
}

// Setup side bookmark button functionality
function setupSideBookmarkButton() {
  const sideBookmarkBtn = document.querySelector('.side-actions .bookmark-btn');
  
  if (sideBookmarkBtn) {
    sideBookmarkBtn.addEventListener('click', () => {
      // Get current active article
      const activeArticle = document.querySelector('.article-card.active');
      if (activeArticle) {
        const articleId = activeArticle.dataset.articleId.replace('article-', '');
        const title = activeArticle.querySelector('.article-title').textContent;
        const excerpt = activeArticle.querySelector('.article-excerpt').textContent;
        const image = activeArticle.dataset.bg;
        const readTime = activeArticle.querySelector('.read-time').textContent;
        
        toggleBookmark(articleId, title, excerpt, image, readTime);
      }
    });
  }
}

// Update bookmark icons based on saved bookmarks
function updateBookmarkIcons() {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
  const sideBookmarkBtn = document.querySelector('.side-actions .bookmark-btn i');
  
  // Update side bookmark button
  if (sideBookmarkBtn) {
    const activeArticle = document.querySelector('.article-card.active');
    if (activeArticle) {
      const articleId = activeArticle.dataset.articleId.replace('article-', '');
      const isBookmarked = bookmarks.some(b => b.id === articleId);
      
      if (isBookmarked) {
        sideBookmarkBtn.className = 'fas fa-bookmark';
        sideBookmarkBtn.parentElement.classList.add('bookmarked');
      } else {
        sideBookmarkBtn.className = 'far fa-bookmark';
        sideBookmarkBtn.parentElement.classList.remove('bookmarked');
      }
    }
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 14px;
    z-index: 10000;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: toastSlideUp 0.3s ease-out;
    font-weight: 500;
    max-width: calc(100vw - 40px);
    text-align: center;
    word-wrap: break-word;
    box-sizing: border-box;
  `;
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideDown 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Initialize page visibility and TikTok interface
document.addEventListener('DOMContentLoaded', function() {
  // Make body visible
  document.body.classList.add('loaded');
  
  setupSearchModal();
  setupHamburgerMenu(); // Set up hamburger menu on all pages
  
  // Initialize TikTok-style interface if we're on homepage
  if (document.getElementById('articlesContainer')) {
    // Set up search and menu functionality
    
    // Handle window resize to properly show/hide hamburger menu
    window.addEventListener('resize', () => {
      const hamburgerMenu = document.getElementById('hamburgerMenu');
      if (window.innerWidth >= 1024 && hamburgerMenu) {
        // Close hamburger menu if open when switching to desktop
        hamburgerMenu.classList.remove('active');
        hamburgerMenu.classList.add('hidden');
      }
    });
    
    // Add navigation hints
    addNavigationHints();
    
    // Check if there's a specific article to navigate to (from bookmarks)
    setTimeout(() => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#article-')) {
        const articleId = hash.substring(1); // Remove the #
        const articles = document.querySelectorAll('.article-card');
        const targetIndex = Array.from(articles).findIndex(article => 
          article.dataset.articleId === articleId
        );
        
        if (targetIndex !== -1 && window.navigateToArticleIndex) {
          window.navigateToArticleIndex(targetIndex);
        }
      }
    }, 500);
  }
});

// Setup search modal functionality
function setupSearchModal() {
  const searchBtns = document.querySelectorAll('.search-btn');
  const searchModal = document.getElementById('searchModal');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  let allArticles = []; // Store all articles for searching

  if (searchBtns.length > 0 && searchModal) {
    // Add click event to all search buttons
    searchBtns.forEach(searchBtn => {
      searchBtn.addEventListener('click', () => {
        searchModal.classList.remove('hidden');
        searchModal.classList.add('active');
        loadSearchArticles();
        
        // Add a small delay to ensure the modal is visible before focusing
        setTimeout(() => {
          searchInput.focus();
        }, 100);
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
      });
    });
    
    if (searchCloseBtn) {
      searchCloseBtn.addEventListener('click', () => {
        searchModal.classList.remove('active');
        setTimeout(() => searchModal.classList.add('hidden'), 300);
        clearSearch();
        
        // Restore body scroll when modal is closed
        document.body.style.overflow = '';
      });
    }

    // Close on overlay click
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        searchModal.classList.remove('active');
        setTimeout(() => searchModal.classList.add('hidden'), 300);
        clearSearch();
        
        // Restore body scroll when modal is closed
        document.body.style.overflow = '';
      }
    });

    // Search input functionality with debouncing
    if (searchInput) {
      let searchTimeout;
      
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        if (query.length > 0) {
          // Add visual feedback for typing
          searchInput.classList.add('searching');
          
          // Debounce search to avoid too many requests
          searchTimeout = setTimeout(() => {
            searchInput.classList.remove('searching');
            performSearch(query);
          }, 300);
        } else {
          searchInput.classList.remove('searching');
          showSearchSuggestions();
        }
      });

      // Handle enter key for immediate search
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(searchTimeout);
          searchInput.classList.remove('searching');
          
          const query = e.target.value.trim();
          if (query.length > 0) {
            performSearch(query);
          }
        }
      });
    }

    // Suggestion tags
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-tag')) {
        const query = e.target.textContent;
        searchInput.value = query;
        performSearch(query);
      }
    });
  }

  // Load articles for searching and setup categories
  async function loadSearchArticles() {
    if (allArticles.length > 0) {
      showSearchSuggestions();
      return;
    }

    try {
      showSearchLoading();
      
      // Load both articles and categories
      const [articlesResponse] = await Promise.all([
        fetch('/api/articles-with-categories')
      ]);
      
      const articles = await articlesResponse.json();
      
      if (Array.isArray(articles)) {
        allArticles = articles;
        showSearchSuggestions();
      } else {
        showNoResults('Failed to load articles');
      }
    } catch (error) {
      console.error('Error loading articles for search:', error);
      showNoResults('Error loading articles');
    }
  }

  // Perform search using server-side endpoint
  async function performSearch(query) {
    if (!query || query.trim().length === 0) {
      showSearchSuggestions();
      return;
    }

    // Save search query
    saveRecentSearch(query);
    
    try {
      showSearchLoading();
      
      // Build search URL with parameters
      const searchParams = new URLSearchParams({
        q: query.trim(),
        limit: 20
      });
      
      const response = await fetch(`/api/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const searchData = await response.json();
      
      displaySearchResults(searchData.results, query, {
        total: searchData.total,
        category: searchData.category,
        serverSearch: true
      });
      
    } catch (error) {
      console.error('Error performing search:', error);
      showNoResults('Search failed. Please try again.');
    }
  }

  // Display search results with enhanced metadata
  function displaySearchResults(results, query, metadata = {}) {
    if (results.length === 0) {
      showNoResults(query ? `No results found for "${query}"` : 'No articles found');
      return;
    }

    const { total, category, serverSearch } = metadata;
    const resultCount = total || results.length;
    const categoryText = category && category !== 'all' ? ` in "${category}"` : '';
    
    const resultsHTML = `
      <div class="search-results-header">
        <h3>${resultCount} result${resultCount !== 1 ? 's' : ''} ${query ? `for "${query}"` : ''}${categoryText}</h3>
        ${serverSearch ? '<div class="search-powered">Powered by server search</div>' : ''}
      </div>
      ${results.map(article => `
        <div class="search-result-item" onclick="openArticle('${article.id}')">
          ${article.image ? `<img src="${article.image}" class="search-result-image" alt="${article.title}">` : ''}
          <div class="search-result-content">
            <div class="search-result-category">${article.category_name || 'Uncategorized'}</div>
            <h4 class="search-result-title">${serverSearch && article.highlighted_title ? article.highlighted_title : highlightText(article.title, query)}</h4>
            <p class="search-result-excerpt">${serverSearch && article.highlighted_excerpt ? article.highlighted_excerpt : highlightText(article.excerpt || getExcerpt(article.content), query)}</p>
            <div class="search-result-meta">
              <span><i class="fas fa-clock"></i> ${article.read_time || Math.ceil((article.content || '').length / 200) + ' min read'}</span>
              <span><i class="fas fa-calendar"></i> ${new Date(article.created_at).toLocaleDateString()}</span>
              ${serverSearch && article.relevance_score ? `<span class="relevance-score" title="Relevance score: ${article.relevance_score}"><i class="fas fa-star"></i> ${article.relevance_score}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    `;

    searchResults.innerHTML = resultsHTML;
  }

  // Show search suggestions
  function showSearchSuggestions() {
    const recentSearches = getRecentSearches();
    
    // Extract popular keywords from article titles
    const keywords = allArticles.flatMap(article => 
      article.title.toLowerCase().split(' ').filter(word => 
        word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that', 'your'].includes(word)
      )
    );
    const uniqueKeywords = [...new Set(keywords)].slice(0, 8);
    
    searchResults.innerHTML = `
      <div class="search-suggestions">
        <h3>Popular Topics</h3>
        <div class="suggestion-tags">
          ${uniqueKeywords.length > 0 ? 
            uniqueKeywords.map(keyword => `<button class="suggestion-tag">${keyword}</button>`).join('') :
            `<button class="suggestion-tag">latest articles</button>
             <button class="suggestion-tag">technology</button>
             <button class="suggestion-tag">design</button>
             <button class="suggestion-tag">business</button>
             <button class="suggestion-tag">tutorials</button>`
          }
        </div>
        
        ${recentSearches.length > 0 ? `
          <h3 style="margin-top: 30px;">Recent Searches</h3>
          <div class="suggestion-tags">
            ${recentSearches.map(search => `<button class="suggestion-tag">${search}</button>`).join('')}
          </div>
        ` : ''}

        ${allArticles.length > 0 ? `
          <h3 style="margin-top: 30px;">Latest Articles</h3>
          <div class="latest-articles-grid">
            ${allArticles.slice(0, 6).map(article => 
              `<div class="latest-article-card" onclick="openArticle('${article.id}')">
                ${article.image ? `
                  <div class="latest-article-image">
                    <img src="${article.image}" alt="${article.title}" loading="lazy">
                  </div>
                ` : `
                  <div class="latest-article-image no-image">
                    <i class="fas fa-file-text"></i>
                  </div>
                `}
                <div class="latest-article-content">
                  <div class="latest-article-category">${article.category_name || 'General'}</div>
                  <h4 class="latest-article-title">${article.title}</h4>
                  <p class="latest-article-excerpt">${article.excerpt || article.content.substring(0, 100) + '...'}</p>
                  <div class="latest-article-meta">
                    <span class="meta-item">
                      <i class="fas fa-clock"></i> 
                      ${article.read_time || Math.ceil(article.content.length / 200) + ' min read'}
                    </span>
                    <span class="meta-item">
                      <i class="fas fa-calendar"></i> 
                      ${new Date(article.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Show loading state
  function showSearchLoading() {
    searchResults.innerHTML = `
      <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(255, 255, 255, 0.1); 
                    border-top: 3px solid #ff6b6b; border-radius: 50%; 
                    animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p>Loading articles...</p>
      </div>
    `;
  }

  // Show no results
  function showNoResults(message) {
    searchResults.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No Results Found</h3>
        <p>${message}</p>
      </div>
    `;
  }

  // Clear search
  function clearSearch() {
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  }

  // Helper functions
  function getCategoryName(article) {
    // Categorize articles based on content or title keywords
    const title = article.title.toLowerCase();
    const content = article.content.toLowerCase();
    
    if (title.includes('tech') || content.includes('technology') || content.includes('programming') || content.includes('software')) {
      return 'Technology';
    } else if (title.includes('design') || content.includes('design') || content.includes('ui') || content.includes('ux')) {
      return 'Design';
    } else if (title.includes('business') || content.includes('business') || content.includes('marketing') || content.includes('startup')) {
      return 'Business';
    } else if (title.includes('tutorial') || content.includes('tutorial') || content.includes('guide') || content.includes('how to')) {
      return 'Tutorial';
    } else if (title.includes('news') || content.includes('announcement') || content.includes('update')) {
      return 'News';
    } else {
      return 'General';
    }
  }

  function getExcerpt(content, maxLength = 120) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(255, 107, 107, 0.3); color: #fff;">$1</mark>');
  }

  function saveRecentSearch(query) {
    let recent = getRecentSearches();
    recent = recent.filter(item => item !== query); // Remove if exists
    recent.unshift(query); // Add to beginning
    recent = recent.slice(0, 5); // Keep only 5 recent searches
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  }

  function getRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  }

  // Open article function (will be called when search result is clicked)
  window.openArticle = function(articleId) {
    // Save search query for recent searches
    const query = searchInput.value.trim();
    if (query) {
      saveRecentSearch(query);
    }
    
    // Close search modal
    searchModal.classList.remove('active');
    setTimeout(() => searchModal.classList.add('hidden'), 300);
    
    // Navigate directly to article reader page
    navigateToArticleReader(articleId);
  };
}

// Global function to navigate to article reader page
function navigateToArticleReader(articleId) {
  window.location.href = `article-reader.html?id=${articleId}`;
}

// Setup hamburger menu functionality
function setupHamburgerMenu() {
  const menuBtn = document.querySelector('.menu-btn');
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const menuCloseBtn = document.getElementById('menuCloseBtn');

  if (menuBtn && hamburgerMenu) {
    // Remove any existing event listeners by cloning and replacing elements
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    
    newMenuBtn.addEventListener('click', () => {
      hamburgerMenu.classList.remove('hidden');
      hamburgerMenu.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });

    if (menuCloseBtn) {
      const newMenuCloseBtn = menuCloseBtn.cloneNode(true);
      menuCloseBtn.parentNode.replaceChild(newMenuCloseBtn, menuCloseBtn);
      
      newMenuCloseBtn.addEventListener('click', () => {
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        setTimeout(() => hamburgerMenu.classList.add('hidden'), 400);
      });
    }

    // Close on overlay click
    const menuOverlay = hamburgerMenu.querySelector('.menu-overlay');
    if (menuOverlay) {
      menuOverlay.addEventListener('click', () => {
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        setTimeout(() => hamburgerMenu.classList.add('hidden'), 400);
      });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburgerMenu.classList.contains('active')) {
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        setTimeout(() => hamburgerMenu.classList.add('hidden'), 400);
      }
    });
  }
}

// Function to close hamburger menu (called from category links)
function closeHamburgerMenu() {
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  if (hamburgerMenu) {
    hamburgerMenu.classList.remove('active');
    setTimeout(() => hamburgerMenu.classList.add('hidden'), 400);
  }
}

// Make closeHamburgerMenu globally available
window.closeHamburgerMenu = closeHamburgerMenu;

// Add navigation hints for users
function addNavigationHints() {
  // Add swipe indicators
  const articlesContainer = document.getElementById('articlesContainer');
  if (articlesContainer) {
    // Create navigation hint
    const navHint = document.createElement('div');
    navHint.innerHTML = `
      <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); 
                  background: rgba(0,0,0,0.8); color: white; padding: 8px 16px; 
                  border-radius: 20px; font-size: 12px; z-index: 1000;
                  backdrop-filter: blur(10px); animation: fadeInUp 1s ease 2s both;">
        <i class="fas fa-hand-point-up" style="margin-right: 8px;"></i>
        Swipe up/down or use arrow keys to navigate
      </div>
    `;
    document.body.appendChild(navHint);
    
    // Auto-hide hint after 5 seconds
    setTimeout(() => {
      const hint = navHint.querySelector('div');
      if (hint) {
        hint.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => navHint.remove(), 500);
      }
    }, 5000);
  }
}