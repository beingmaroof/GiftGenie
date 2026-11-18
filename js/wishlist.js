/* ==========================================================================
   GIFTGENIE — WISHLIST
   Manages saved gift items, valuation estimation, and persistence
   ========================================================================== */

(function () {
  'use strict';

  let allGifts = [];

  const wishlistContainer = document.getElementById('wishlistContainer');
  const wishlistHeader = document.getElementById('wishlistHeader');
  const wishlistCountTitle = document.getElementById('wishlistCountTitle');
  const wishlistSummary = document.getElementById('wishlistSummary');
  const clearWishlistBtn = document.getElementById('clearWishlistBtn');

  async function init() {
    allGifts = await App.loadGifts();
    renderWishlist();

    // Update the page whenever the wishlist changes.
    window.addEventListener('wishlistChanged', renderWishlist);

    // Clear all saved gifts after user confirmation.
    clearWishlistBtn?.addEventListener('click', async () => {
      const currentList = Storage.getWishlist();

      if (currentList.length === 0) return;

      const confirmed = await App.showConfirm(
        'Clear Wishlist',
        'Are you sure you want to remove all saved gifts from your wishlist?'
      );

      if (confirmed) {
        Storage.clearWishlist();
        App.showToast('Wishlist has been cleared', 'info');
        renderWishlist();
      }
    });
  }

  function renderWishlist() {
    if (!wishlistContainer) return;

    const savedIds = Storage.getWishlist();

    // Show a message when no gifts have been saved.
    if (!savedIds || savedIds.length === 0) {
      if (wishlistHeader) wishlistHeader.style.display = 'none';

      wishlistContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🤍</div>
          <h3 class="empty-state__title">Your Wishlist is Empty</h3>
          <p class="empty-state__text">
            You haven't saved any gifts yet. When you discover gifts you like, click the heart icon to save them here.
          </p>
          <a href="finder.html" class="btn btn--primary btn--large">Discover Gifts Now</a>
        </div>
      `;
      return;
    }

    // Find the saved gifts using their IDs.
    const savedGifts = savedIds
      .map(id => allGifts.find(gift => gift.id === id))
      .filter(Boolean);

    // Handle cases where saved IDs do not match any gifts.
    if (savedGifts.length === 0) {
      if (wishlistHeader) wishlistHeader.style.display = 'none';

      wishlistContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🤍</div>
          <h3 class="empty-state__title">Your Wishlist is Empty</h3>
          <p class="empty-state__text">No valid gifts found in your saved list.</p>
          <a href="finder.html" class="btn btn--primary btn--large">Discover Gifts Now</a>
        </div>
      `;
      return;
    }

    // Update the wishlist heading and total value.
    if (wishlistHeader) wishlistHeader.style.display = 'flex';

    if (wishlistCountTitle) {
      wishlistCountTitle.textContent = `${savedGifts.length} Saved ${savedGifts.length === 1 ? 'Gift' : 'Gifts'}`;
    }

    const totalEstimate = savedGifts.reduce(
      (sum, gift) => sum + (gift.price || 0),
      0
    );

    if (wishlistSummary) {
      wishlistSummary.textContent = `Total estimated value: ₹${totalEstimate.toLocaleString('en-IN')}`;
    }

    // Create a card for each saved gift.
    const grid = document.createElement('div');
    grid.className = 'wishlist-grid';

    savedGifts.forEach(gift => {
      const card = App.createGiftCard(gift, {
        showMatch: false,
        showActions: true
      });

      grid.appendChild(card);
    });

    wishlistContainer.innerHTML = '';
    wishlistContainer.appendChild(grid);
  }

  // Start the controller once the page is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
