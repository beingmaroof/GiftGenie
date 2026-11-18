
/* ==========================================================================
   GIFTGENIE — MAIN APPLICATION
   Handles gifts, navigation, notifications, modals and wishlist updates
   ========================================================================== */

const App = (() => {
  'use strict';

  let giftsDatabase = [];
  let giftsLoaded = false;

  // --- Gift Database ---

  async function loadGifts() {
    if (giftsLoaded && giftsDatabase.length > 0) {
      return giftsDatabase;
    }

    try {
      const response = await fetch('data/gifts.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      giftsDatabase = await response.json();
      giftsLoaded = true;
      return giftsDatabase;
    } catch (error) {
      console.error('Failed to load gifts database:', error);
      showToast('Could not load gift database. Please run a local web server.', 'error');
      return [];
    }
  }

  function getGifts() {
    return giftsDatabase;
  }

  function getGiftById(id) {
    return giftsDatabase.find(gift => gift.id === id) || null;
  }

  // --- Navigation ---

  function initNavigation() {
    const toggle = document.querySelector('.nav__mobile-toggle');
    const mobileMenu = document.querySelector('.nav__mobile-menu');

    if (toggle && mobileMenu) {
      const toggleMenu = (open) => {
        toggle.classList.toggle('active', open);
        mobileMenu.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      };

      toggle.addEventListener('click', () => {
        toggleMenu(!mobileMenu.classList.contains('open'));
      });

      // Close the menu after selecting a link
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
      });
    }

    // Mark the current page in the navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  // --- Toast Notifications ---

  function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');

    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };

    toast.innerHTML = `
      <span>${icons[type] || 'ℹ'}</span>
      <span>${message}</span>
      <button class="toast__close" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toast);

    const dismiss = () => {
      toast.style.animation = 'toastEnter 0.25s cubic-bezier(0.25, 0.1, 0.25, 1) reverse';
      setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast__close').addEventListener('click', dismiss);
    setTimeout(dismiss, 3500);
  }

  // --- Confirmation Dialog ---

  function showConfirm(title, message) {
    return new Promise((resolve) => {
      const existing = document.querySelector('.confirm-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay open';
      overlay.innerHTML = `
        <div class="confirm-dialog modal" style="max-width: 420px; padding: var(--space-8); text-align: center;">
          <h3 style="font-size: 19px; font-weight: 600; margin-bottom: 8px;">${title}</h3>
          <p style="font-size: 14px; color: var(--color-text-secondary); margin-bottom: 24px;">${message}</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn--secondary confirm-cancel">Cancel</button>
            <button class="btn btn--primary confirm-ok">Confirm</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const cleanup = (result) => {
        overlay.remove();
        resolve(result);
      };

      overlay.querySelector('.confirm-ok').addEventListener('click', () => cleanup(true));
      overlay.querySelector('.confirm-cancel').addEventListener('click', () => cleanup(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cleanup(false);
      });
    });
  }

  // --- Modal Handling ---

  function initModals() {
    // Close a modal when clicking outside it
    document.addEventListener('click', (e) => {
      if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // Close open modals with the Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        const confirmDialog = document.querySelector('.confirm-overlay');
        if (confirmDialog) confirmDialog.remove();
        document.body.style.overflow = '';
      }
    });
  }

  // --- Image Fallback ---

  function handleImageError(img) {
    const wrapper = img.closest('.gift-card__image-wrapper') || img.parentElement;
    img.style.display = 'none';

    if (!wrapper.querySelector('.img-fallback')) {
      const fallback = document.createElement('div');
      fallback.className = 'img-fallback';
      fallback.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7M12 22V7M2 7h20M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
        </svg>
      `;
      wrapper.appendChild(fallback);
    }
  }

  // --- Wishlist ---

  function syncWishlistUI(giftId) {
    const active = Storage.isInWishlist(giftId);

    document.querySelectorAll(`[data-gift-id="${giftId}"]`).forEach(el => {
      if (el.classList.contains('gift-card__wishlist-btn')) {
        el.classList.toggle('active', active);
        el.innerHTML = active ? '♥' : '♡';
        el.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
      }

      if (el.classList.contains('gift-card__wishlist-action')) {
        el.className = `btn ${active ? 'btn--primary' : 'btn--outline'} btn--small gift-card__wishlist-action`;
        el.textContent = active ? '♥ Saved' : '♡ Wishlist';
      }

      if (el.classList.contains('detail-wishlist-btn')) {
        el.className = `btn ${active ? 'btn--primary' : 'btn--outline'} detail-wishlist-btn`;
        el.textContent = active ? '♥ Saved to Wishlist' : '♡ Add to Wishlist';
      }
    });
  }

  function toggleWishlist(giftId) {
    const alreadySaved = Storage.isInWishlist(giftId);

    if (alreadySaved) {
      Storage.removeFromWishlist(giftId);
      showToast('Removed from wishlist', 'info');
    } else {
      Storage.addToWishlist(giftId);
      showToast('Added to wishlist!', 'success');
    }

    syncWishlistUI(giftId);
    window.dispatchEvent(new CustomEvent('wishlistChanged', { detail: { giftId } }));
  }

  // --- Gift Cards ---

  function createGiftCard(gift, options = {}) {
    const { showMatch = false, matchReasons = [], showActions = true } = options;
    const inWishlist = Storage.isInWishlist(gift.id);

    const card = document.createElement('div');
    card.className = 'card gift-card';
    card.setAttribute('data-gift-id', gift.id);

    const matchHTML = (showMatch && matchReasons.length > 0)
      ? `<div class="gift-card__match"><span>✓</span><span>${matchReasons[0]}</span></div>`
      : '';

    const actionsHTML = showActions
      ? `
        <div class="gift-card__actions">
          <button class="btn btn--secondary btn--small gift-card__detail-btn" data-gift-id="${gift.id}">
            View Details
          </button>
          <button class="btn ${inWishlist ? 'btn--primary' : 'btn--outline'} btn--small gift-card__wishlist-action" data-gift-id="${gift.id}">
            ${inWishlist ? '♥ Saved' : '♡ Wishlist'}
          </button>
        </div>`
      : '';

    card.innerHTML = `
      <div class="gift-card__image-wrapper">
        <img 
          src="${gift.image}" 
          alt="${gift.name}" 
          class="gift-card__image"
          loading="lazy"
          onerror="App.handleImageError(this)"
        >
        <span class="gift-card__category">${gift.category}</span>
        <button class="gift-card__wishlist-btn ${inWishlist ? 'active' : ''}" data-gift-id="${gift.id}" aria-label="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
          ${inWishlist ? '♥' : '♡'}
        </button>
      </div>
      <div class="gift-card__body">
        <h3 class="gift-card__name">${gift.name}</h3>
        <p class="gift-card__description">${gift.description}</p>
        ${matchHTML}
        <div class="gift-card__price">₹${gift.price.toLocaleString('en-IN')}</div>
      </div>
      ${actionsHTML}
    `;

    // Handle clicks on the card buttons
    card.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      e.stopPropagation();

      if (target.classList.contains('gift-card__wishlist-btn') || target.classList.contains('gift-card__wishlist-action')) {
        toggleWishlist(gift.id);
      } else if (target.classList.contains('gift-card__detail-btn')) {
        showGiftDetail(gift, matchReasons);
      }
    });

    return card;
  }

  // --- Gift Details ---

  function showGiftDetail(gift, matchReasons = []) {
    Storage.addRecentView(gift.id);
    const inWishlist = Storage.isInWishlist(gift.id);

    const existing = document.getElementById('giftDetailModal');
    if (existing) existing.remove();

    const reasonsHTML = matchReasons.length > 0
      ? `
        <div class="detail-modal__match-reasons">
          <h4>Why This Gift Matches</h4>
          <ul>
            ${matchReasons.map(r => `<li>✓ ${r}</li>`).join('')}
          </ul>
        </div>`
      : '';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.id = 'giftDetailModal';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 680px;">
        <div class="modal__header">
          <h2 class="modal__title">Gift Details</h2>
          <button class="modal__close" aria-label="Close modal">✕</button>
        </div>
        <div class="modal__body">
          <div class="detail-modal__content">
            <div class="detail-modal__image-wrapper">
              <img 
                src="${gift.image}" 
                alt="${gift.name}" 
                class="detail-modal__image"
                onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=img-fallback><svg width=48 height=48 viewBox=&quot;0 0 24 24&quot; fill=none stroke=currentColor stroke-width=1.5><rect x=3 y=8 width=18 height=13 rx=2/><path d=&quot;M12 8V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2&quot;/><path d=&quot;M12 8V6a2 2 0 012-2h1a2 2 0 012 2v2&quot;/><path d=&quot;M12 8v13&quot;/></svg></div>';"
              >
            </div>
            <div class="detail-modal__info">
              <span class="badge badge--primary detail-modal__category">${gift.category}</span>
              <h3 class="detail-modal__name">${gift.name}</h3>
              <div class="detail-modal__price">₹${gift.price.toLocaleString('en-IN')}</div>
              <p class="detail-modal__description">${gift.description}</p>

              ${reasonsHTML}

              <div class="detail-modal__meta">
                <div>
                  <span class="detail-modal__meta-label">Suitable Occasions</span>
                  <div class="detail-modal__meta-value">
                    ${gift.occasions.map(o => `<span class="badge">${o}</span>`).join('')}
                  </div>
                </div>
                <div style="margin-top: 8px;">
                  <span class="detail-modal__meta-label">Related Interests</span>
                  <div class="detail-modal__meta-value">
                    ${gift.interests.map(i => `<span class="badge">${i}</span>`).join('')}
                  </div>
                </div>
                <div style="margin-top: 8px;">
                  <span class="detail-modal__meta-label">Age Range</span>
                  <div class="detail-modal__meta-value">
                    <span class="badge">${gift.minAge} – ${gift.maxAge} years</span>
                  </div>
                </div>
              </div>

              <div class="detail-modal__actions" style="margin-top: 16px;">
                <button class="btn ${inWishlist ? 'btn--primary' : 'btn--outline'} detail-wishlist-btn" data-gift-id="${gift.id}">
                  ${inWishlist ? '♥ Saved to Wishlist' : '♡ Add to Wishlist'}
                </button>
                <button class="btn btn--secondary detail-share-btn">Share Gift</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.querySelector('.modal__close').addEventListener('click', () => {
      overlay.remove();
      document.body.style.overflow = '';
    });

    overlay.querySelector('.detail-wishlist-btn').addEventListener('click', () => {
      toggleWishlist(gift.id);
    });

    overlay.querySelector('.detail-share-btn').addEventListener('click', () => {
      shareGift(gift);
    });
  }

  // --- Share Gift ---

  function shareGift(gift) {
    const text = `Check out this gift: ${gift.name} (₹${gift.price.toLocaleString('en-IN')}) — ${gift.description}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('Gift details copied to clipboard!', 'success'))
        .catch(() => shareGiftFallback(text));
    } else {
      shareGiftFallback(text);
    }
  }

  function shareGiftFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      showToast('Gift details copied to clipboard!', 'success');
    } catch (e) {
      showToast('Could not copy automatically.', 'error');
    }

    textarea.remove();
  }

  // --- Start the App ---

  function init() {
    initNavigation();
    initModals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    loadGifts,
    getGifts,
    getGiftById,
    showToast,
    showConfirm,
    createGiftCard,
    toggleWishlist,
    syncWishlistUI,
    showGiftDetail,
    shareGift,
    handleImageError
  };
})();
