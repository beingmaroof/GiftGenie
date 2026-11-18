
/* ==========================================================================
   GIFTGENIE — STORAGE MODULE
   Handles wishlist, recently viewed gifts and finder preferences
   ========================================================================== */

const Storage = (() => {
  'use strict';

  const KEYS = {
    WISHLIST: 'giftgenie_wishlist',
    RECENT_VIEWS: 'giftgenie_recent_views',
    FINDER_DATA: 'giftgenie_finder_data'
  };

  // Read stored data and return a default value if something goes wrong
  function safeGet(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (err) {
      console.warn(`Storage: Failed reading key "${key}"`, err);
      return defaultValue;
    }
  }

  // Save data in localStorage
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`Storage: Failed writing key "${key}"`, err);
      return false;
    }
  }

  // Wishlist operations

  function getWishlist() {
    return safeGet(KEYS.WISHLIST, []);
  }

  function addToWishlist(giftId) {
    const list = getWishlist();

    if (!list.includes(giftId)) {
      list.push(giftId);
      safeSet(KEYS.WISHLIST, list);
      return true;
    }

    return false;
  }

  function removeFromWishlist(giftId) {
    const list = getWishlist();
    const updated = list.filter(id => id !== giftId);

    if (updated.length !== list.length) {
      safeSet(KEYS.WISHLIST, updated);
      return true;
    }

    return false;
  }

  function isInWishlist(giftId) {
    return getWishlist().includes(giftId);
  }

  function clearWishlist() {
    safeSet(KEYS.WISHLIST, []);
  }

  // Keep track of recently viewed gifts

  function getRecentViews() {
    return safeGet(KEYS.RECENT_VIEWS, []);
  }

  function addRecentView(giftId) {
    const views = getRecentViews().filter(id => id !== giftId);

    views.unshift(giftId);

    if (views.length > 10) {
      views.length = 10;
    }

    safeSet(KEYS.RECENT_VIEWS, views);
  }

  // Save and retrieve Gift Finder preferences

  function setFinderData(data) {
    safeSet(KEYS.FINDER_DATA, data);
  }

  function getFinderData() {
    return safeGet(KEYS.FINDER_DATA, null);
  }

  function clearFinderData() {
    localStorage.removeItem(KEYS.FINDER_DATA);
  }

  return {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    getRecentViews,
    addRecentView,
    setFinderData,
    getFinderData,
    clearFinderData,
    KEYS
  };
})();

// Export the module for Node.js tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
