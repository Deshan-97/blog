// Universal Pull-to-Refresh for all pages
// This script enables native mobile browser pull-to-refresh while preserving existing functionality

(function() {
  'use strict';

  // Check if this is the homepage (has TikTok-style interface)
  const isHomepage = document.getElementById('articlesContainer') !== null || 
                     document.body.classList.contains('homepage');
  
  // If it's homepage, the main script.js handles pull-to-refresh
  if (isHomepage) {
    // Add pull-to-refresh CSS for homepage too
    addHomepagePullRefreshCSS();
    return;
  }

  // For all other pages, enable standard pull-to-refresh
  class UniversalPullRefresh {
    constructor() {
      this.init();
    }

    init() {
      // Enable pull-to-refresh for non-homepage pages
      this.setupPullToRefresh();
      this.addPullToRefreshCSS();
    }

    setupPullToRefresh() {
      let touchStartY = 0;
      let touchCurrentY = 0;
      let isAtTop = true;

      // Monitor scroll position
      const updateScrollPosition = () => {
        isAtTop = window.scrollY <= 10; // Allow small margin for better UX
      };

      window.addEventListener('scroll', updateScrollPosition, { passive: true });
      updateScrollPosition(); // Initialize

      // Touch event handlers
      document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        updateScrollPosition(); // Update position on touch start
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        touchCurrentY = e.touches[0].clientY;
        const pullDistance = touchCurrentY - touchStartY;

        // Only allow pull-to-refresh when at top of page and pulling down
        if (isAtTop && pullDistance > 0) {
          // Don't prevent default - let browser handle native pull-to-refresh
          return;
        }
      }, { passive: true });

      document.addEventListener('touchend', () => {
        touchStartY = 0;
        touchCurrentY = 0;
      }, { passive: true });
    }

    addPullToRefreshCSS() {
      // Ensure CSS supports pull-to-refresh
      const style = document.createElement('style');
      style.textContent = `
        /* Enable pull-to-refresh for all pages */
        html, body {
          overscroll-behavior-x: none !important;
          overscroll-behavior-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }

        /* Ensure proper scrolling on non-homepage pages */
        body:not(.homepage) {
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh;
        }

        /* Special handling for admin and other pages */
        .admin-container,
        .article-reader-container,
        .bookmarks-container,
        .settings-container,
        .about-container {
          min-height: 100vh;
          overflow-y: auto;
        }

        /* Ensure all main content areas support scrolling */
        .main-content,
        .content-wrapper,
        .page-content {
          min-height: 100vh;
        }

        /* Fix for admin pages */
        .admin-panel,
        .admin-content {
          min-height: 100vh;
          overflow-y: auto;
        }

        /* Article reader specific */
        .article-content-wrapper {
          min-height: 100vh;
          overflow-y: auto;
        }

        /* Bookmarks page */
        .bookmarks-wrapper {
          min-height: 100vh;
          overflow-y: auto;
        }

        /* Responsive improvements for mobile */
        @media (max-width: 768px) {
          /* Ensure touch-friendly scrolling on mobile */
          body:not(.homepage) {
            -webkit-overflow-scrolling: touch;
            overflow-y: auto;
          }
          
          /* Better touch targets for mobile */
          .touchable,
          button,
          .btn,
          .nav-link {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Prevent scroll issues on iOS */
        @supports (-webkit-touch-callout: none) {
          body {
            -webkit-overflow-scrolling: touch;
          }
        }
      `;
      document.head.appendChild(style);

      // Add class to body for CSS targeting
      if (!document.body.classList.contains('homepage')) {
        document.body.classList.add('non-homepage');
      }
    }
  }

  function addHomepagePullRefreshCSS() {
    // Add CSS for homepage pull-to-refresh support
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced pull-to-refresh for homepage */
      body.homepage {
        overscroll-behavior-x: none !important;
        overscroll-behavior-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }

      /* Ensure homepage articles container can handle pull-to-refresh */
      body.homepage #articlesContainer {
        overscroll-behavior-y: auto;
      }

      /* Make sure TikTok-style scrolling works with pull-to-refresh */
      body.homepage .article-card {
        overscroll-behavior-y: auto;
      }

      /* Responsive improvements for mobile homepage */
      @media (max-width: 768px) {
        body.homepage {
          -webkit-overflow-scrolling: touch;
        }
        
        body.homepage #articlesContainer {
          -webkit-overflow-scrolling: touch;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new UniversalPullRefresh();
    });
  } else {
    new UniversalPullRefresh();
  }

})();
