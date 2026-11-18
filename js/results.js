
/* ==========================================================================
   GIFTGENIE — RESULTS PAGE
   Displays recommendations, filters categories and searches the gift catalog
   ========================================================================== */

(function () {
  'use strict';

  let allGifts = [];
  let currentRecommendations = [];
  let displayedRecommendations = [];
  let userPreferences = null;

  // Page elements
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsSummary = document.getElementById('resultsSummary');
  const summaryTags = document.getElementById('summaryTags');
  const resultsControls = document.getElementById('resultsControls');
  const resultsCount = document.getElementById('resultsCount');
  const resultsActions = document.getElementById('resultsActions');
  const resultsIntro = document.getElementById('resultsIntro');
  const sortSelect = document.getElementById('sortSelect');
  const categoryFilter = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('searchInput');
  const categoryChips = document.getElementById('categoryChips');
  const searchResultsContainer = document.getElementById('searchResultsContainer');
  const searchResultsGrid = document.getElementById('searchResultsGrid');
  const searchResultsCount = document.getElementById('searchResultsCount');

  // Load the gift catalog and prepare the results page
  async function init() {
    allGifts = await App.loadGifts();

    if (!allGifts || allGifts.length === 0) {
      renderError('Could not load the gift catalog. Please run a local development server.');
      return;
    }

    userPreferences = Storage.getFinderData();

    if (!userPreferences) {
      renderNoPreferences();
    } else {
      renderPreferencesSummary(userPreferences);
      generateRecommendations();
    }

    setupCategoryFilter();
    setupEventListeners();
    setupSearchSection();
  }

  // Display the preferences selected in the Gift Finder
  function renderPreferencesSummary(prefs) {
    if (!resultsSummary || !summaryTags) return;

    summaryTags.innerHTML = '';
    resultsSummary.style.display = 'block';

    if (resultsIntro) {
      const recipient = prefs.relationship ? prefs.relationship.toLowerCase() : 'them';
      resultsIntro.textContent = `Here are the top personalized recommendations tailored for your ${recipient} on ${prefs.occasion || 'their special day'}.`;
    }

    const createTag = (label, value, isPrimary = false) => {
      if (!value) return;

      const tag = document.createElement('span');
      tag.className = `badge ${isPrimary ? 'badge--primary' : ''}`;
      tag.textContent = `${label}: ${value}`;
      summaryTags.appendChild(tag);
    };

    createTag('Occasion', prefs.occasion, true);
    createTag('For', prefs.relationship, true);
    createTag('Budget', prefs.budget, true);

    if (prefs.age) createTag('Age', `${prefs.age} yrs`);
    if (prefs.gender && prefs.gender !== 'Prefer not to say') createTag('Gender', prefs.gender);
    if (prefs.occupation) createTag('Occupation', prefs.occupation);

    // Show selected interests and personality traits
    (prefs.interests || []).forEach(interest => {
      const tag = document.createElement('span');
      tag.className = 'badge';
      tag.textContent = `#${interest}`;
      summaryTags.appendChild(tag);
    });

    (prefs.personality || []).forEach(trait => {
      const tag = document.createElement('span');
      tag.className = 'badge';
      tag.textContent = trait;
      summaryTags.appendChild(tag);
    });
  }

  // Generate recommendations based on the saved preferences
  function generateRecommendations() {
    currentRecommendations = Recommendation.getRecommendations(allGifts, userPreferences);
    displayedRecommendations = [...currentRecommendations];

    if (currentRecommendations.length === 0) {
      renderEmptyState();
      return;
    }

    if (resultsControls) resultsControls.style.display = 'flex';
    if (resultsActions) resultsActions.style.display = 'flex';

    applyFiltersAndSort();
  }

  // Apply the selected category and sorting option
  function applyFiltersAndSort() {
    let list = [...currentRecommendations];

    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    if (selectedCategory) {
      list = list.filter(item => item.gift.category === selectedCategory);
    }

    const sortVal = sortSelect ? sortSelect.value : 'best';

    if (sortVal === 'price-low') {
      list.sort((a, b) => a.gift.price - b.gift.price);
    } else if (sortVal === 'price-high') {
      list.sort((a, b) => b.gift.price - a.gift.price);
    } else if (sortVal === 'name-az') {
      list.sort((a, b) => a.gift.name.localeCompare(b.gift.name));
    } else {
      list.sort((a, b) => b.score - a.score || a.gift.price - b.gift.price);
    }

    displayedRecommendations = list;
    renderResultsGrid();
  }

  // Display the filtered recommendations as gift cards
  function renderResultsGrid() {
    if (!resultsContainer) return;

    if (resultsCount) {
      const total = displayedRecommendations.length;
      resultsCount.textContent = `Showing ${total} ${total === 1 ? 'gift recommendation' : 'gift recommendations'}`;
    }

    if (displayedRecommendations.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">No Gifts in this Category</h3>
          <p class="empty-state__text">None of the top recommendations matched "${categoryFilter.value}".</p>
          <button class="btn btn--secondary" id="resetCategoryBtn">Show All Recommendations</button>
        </div>
      `;

      document.getElementById('resetCategoryBtn')?.addEventListener('click', () => {
        if (categoryFilter) categoryFilter.value = '';
        applyFiltersAndSort();
      });

      return;
    }

    const grid = document.createElement('div');
    grid.className = 'results-grid';

    displayedRecommendations.forEach(item => {
      const card = App.createGiftCard(item.gift, {
        showMatch: true,
        matchReasons: item.reasons
      });

      grid.appendChild(card);
    });

    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(grid);
  }

  // Show a message when no gifts match the selected preferences
  function renderEmptyState() {
    if (resultsControls) resultsControls.style.display = 'none';
    if (resultsActions) resultsActions.style.display = 'flex';

    const budgetText = userPreferences.budget || 'your budget';

    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🎁</div>
        <h3 class="empty-state__title">No Matching Gifts Found</h3>
        <p class="empty-state__text">
          No items in our catalog strictly satisfied <strong>${budgetText}</strong>. 
          Remember that "Under ₹X" requires prices strictly below ₹X.
        </p>
        <div style="display: flex; gap: var(--space-4); justify-content: center; margin-top: var(--space-6);">
          <a href="finder.html" class="btn btn--primary">Adjust Preferences</a>
          <a href="index.html" class="btn btn--secondary">Back to Home</a>
        </div>
      </div>
    `;
  }

  // Ask the user to fill in their preferences first
  function renderNoPreferences() {
    if (resultsControls) resultsControls.style.display = 'none';
    if (resultsActions) resultsActions.style.display = 'none';

    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">✨</div>
        <h3 class="empty-state__title">No Preferences Specified</h3>
        <p class="empty-state__text">Please visit our Gift Finder form to select your recipient details and budget.</p>
        <a href="finder.html" class="btn btn--primary btn--large">Open Gift Finder</a>
      </div>
    `;
  }

  // Display an error if the gift catalog cannot be loaded
  function renderError(message) {
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h3 class="empty-state__title">Error Loading Catalog</h3>
        <p class="empty-state__text">${message}</p>
        <a href="index.html" class="btn btn--secondary">Back to Home</a>
      </div>
    `;
  }

  // Add available categories to the dropdown
  function setupCategoryFilter() {
    if (!categoryFilter || allGifts.length === 0) return;

    const categories = Array.from(new Set(allGifts.map(g => g.category))).sort();

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
  }

  // Listen for changes to the sorting and category options
  function setupEventListeners() {
    sortSelect?.addEventListener('change', applyFiltersAndSort);
    categoryFilter?.addEventListener('change', applyFiltersAndSort);
  }

  // Set up category filters and search for the full gift catalog
  function setupSearchSection() {
    if (!allGifts || allGifts.length === 0) return;

    if (categoryChips) {
      const categories = Array.from(new Set(allGifts.map(g => g.category))).sort();

      categoryChips.innerHTML = `<button class="filter-chip active" data-category="all">All Items (${allGifts.length})</button>`;

      categories.forEach(cat => {
        const count = allGifts.filter(g => g.category === cat).length;
        const chip = document.createElement('button');
        chip.className = 'filter-chip';
        chip.setAttribute('data-category', cat);
        chip.textContent = `${cat} (${count})`;
        categoryChips.appendChild(chip);
      });

      categoryChips.addEventListener('click', (e) => {
        const target = e.target.closest('.filter-chip');
        if (!target) return;

        categoryChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        target.classList.add('active');

        executeSearch(searchInput?.value.trim() || '', target.getAttribute('data-category'));
      });
    }

    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      const activeChip = categoryChips?.querySelector('.filter-chip.active');
      const activeCategory = activeChip?.getAttribute('data-category') || 'all';

      executeSearch(query, activeCategory);
    });
  }

  // Search gifts by name, description, category, tags or interests
  function executeSearch(query, category) {
    if (!searchResultsContainer || !searchResultsGrid) return;

    if (!query && (!category || category === 'all')) {
      searchResultsContainer.style.display = 'none';
      return;
    }

    searchResultsContainer.style.display = 'block';

    let matches = [...allGifts];

    if (category && category !== 'all') {
      matches = matches.filter(g => g.category === category);
    }

    if (query) {
      const q = query.toLowerCase();

      matches = matches.filter(g => {
        return g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          (g.tags && g.tags.some(t => t.toLowerCase().includes(q))) ||
          (g.interests && g.interests.some(i => i.toLowerCase().includes(q)));
      });
    }

    if (searchResultsCount) {
      searchResultsCount.textContent = `Found ${matches.length} ${matches.length === 1 ? 'gift' : 'gifts'} matching your search`;
    }

    searchResultsGrid.innerHTML = '';

    if (matches.length === 0) {
      searchResultsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: var(--space-8);">
          <p class="empty-state__text">No gifts matched your search query. Try different keywords.</p>
        </div>
      `;
      return;
    }

    matches.forEach(gift => {
      const card = App.createGiftCard(gift, { showMatch: false });
      searchResultsGrid.appendChild(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
