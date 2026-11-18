
/* ==========================================================================
   GIFTGENIE — RECOMMENDATION ENGINE
   Matches gifts with user preferences and applies budget limits
   ========================================================================== */

const Recommendation = (() => {
  'use strict';

  // Points assigned to each matching preference
  const WEIGHTS = {
    occasion: 5,
    relationship: 5,
    budget: 5,
    interests: 4,
    age: 2,
    personality: 2,
    gender: 1,
    occupation: 1
  };

  const MAX_RESULTS = 5;

  // Convert the selected budget into a numeric limit
  function parseBudgetLimit(budgetStr) {
    if (!budgetStr || budgetStr === 'No Budget') {
      return Infinity;
    }

    const match = budgetStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : Infinity;
  }

  // Check whether a gift is below the selected budget
  function isWithinBudget(giftPrice, budgetLimit) {
    if (budgetLimit === Infinity) return true;
    return giftPrice < budgetLimit;
  }

  // Check whether the gift is suitable for the recipient's age
  function isAgeSuitable(gift, age) {
    if (!age || age <= 0) return true;

    const minAge = gift.minAge ?? 0;
    const maxAge = gift.maxAge ?? 150;

    return age >= minAge && age <= maxAge;
  }

  // Remove gifts that do not meet the basic requirements
  function filterEligible(gifts, preferences) {
    const budgetLimit = parseBudgetLimit(preferences.budget);

    return gifts.filter(gift => {
      if (!isWithinBudget(gift.price, budgetLimit)) {
        return false;
      }

      return Boolean(gift.id && gift.name && gift.price && gift.price > 0);
    });
  }

  // Calculate how well a gift matches the selected preferences
  function calculateScore(gift, preferences) {
    let score = 0;
    const reasons = [];

    // Budget match
    const budgetLimit = parseBudgetLimit(preferences.budget);
    if (isWithinBudget(gift.price, budgetLimit)) {
      score += WEIGHTS.budget;
    }

    // Occasion match
    if (preferences.occasion && gift.occasions?.includes(preferences.occasion)) {
      score += WEIGHTS.occasion;
      reasons.push(`Suitable for ${preferences.occasion}`);
    }

    // Relationship match
    if (preferences.relationship && gift.relationships?.includes(preferences.relationship)) {
      score += WEIGHTS.relationship;
      reasons.push(`Great for ${preferences.relationship}`);
    }

    // Add points for each matching interest
    if (preferences.interests?.length > 0 && gift.interests) {
      const matched = preferences.interests.filter(i => gift.interests.includes(i));

      if (matched.length > 0) {
        score += WEIGHTS.interests * matched.length;
        reasons.push(
          matched.length === 1
            ? `Matches their interest in ${matched[0]}`
            : `Matches interests: ${matched.join(', ')}`
        );
      }
    }

    // Age match
    if (preferences.age > 0 && gift.minAge !== undefined && gift.maxAge !== undefined) {
      const age = parseInt(preferences.age, 10);

      if (age >= gift.minAge && age <= gift.maxAge) {
        score += WEIGHTS.age;
        reasons.push(`Suitable for age ${age}`);
      }
    }

    // Add points for matching personality traits
    if (preferences.personality?.length > 0 && gift.personalities) {
      const matched = preferences.personality.filter(p => gift.personalities.includes(p));

      if (matched.length > 0) {
        score += WEIGHTS.personality * matched.length;
        reasons.push(`Fits ${matched.join(', ')} personality`);
      }
    }

    // Gender is used as a preference, not a restriction
    if (preferences.gender && preferences.gender !== 'Prefer not to say' && gift.gender) {
      if (gift.gender.includes(preferences.gender) || gift.gender.includes('Other')) {
        score += WEIGHTS.gender;
      }
    }

    // Occupation match
    if (preferences.occupation && gift.occupations?.includes(preferences.occupation)) {
      score += WEIGHTS.occupation;
      reasons.push(`Relevant for ${preferences.occupation}`);
    }

    // Compare additional notes with gift tags and descriptions
    if (preferences.additionalText?.trim()) {
      const text = preferences.additionalText.toLowerCase();

      if (gift.tags) {
        const matchingTags = gift.tags.filter(tag => text.includes(tag.toLowerCase()));

        if (matchingTags.length > 0) {
          score += matchingTags.length;
          reasons.push('Matches additional preferences');
        }
      }

      const words = text.split(/\s+/).filter(w => w.length > 3);
      const nameDesc = `${gift.name} ${gift.description}`.toLowerCase();
      const matchedWords = words.filter(w => nameDesc.includes(w));

      if (matchedWords.length > 0) {
        score += matchedWords.length;
      }
    }

    // Give an extra point to gifts using 50–99% of the budget
    if (budgetLimit !== Infinity && gift.price > 0) {
      const ratio = gift.price / budgetLimit;

      if (ratio >= 0.5 && ratio < 1) {
        score += 1;
      }
    }

    return { score, reasons };
  }

  // Sort gifts by score, matching reasons, price and name
  function rankGifts(scoredGifts) {
    return scoredGifts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.reasons.length !== a.reasons.length) return b.reasons.length - a.reasons.length;
      if (a.gift.price !== b.gift.price) return a.gift.price - b.gift.price;

      return a.gift.name.localeCompare(b.gift.name);
    });
  }

  // Find additional gifts when fewer than five recommendations are available
  function fallbackMatch(gifts, preferences, currentResults) {
    if (currentResults.length >= MAX_RESULTS) {
      return currentResults;
    }

    const existingIds = new Set(currentResults.map(r => r.gift.id));
    const budgetLimit = parseBudgetLimit(preferences.budget);

    const remaining = gifts.filter(g =>
      !existingIds.has(g.id) && isWithinBudget(g.price, budgetLimit) && g.id && g.name && g.price > 0
    );

    const relaxedResults = remaining.map(gift => {
      let score = WEIGHTS.budget;
      const reasons = ['Fits your selected budget'];

      if (preferences.occasion && gift.occasions?.includes(preferences.occasion)) {
        score += WEIGHTS.occasion;
        reasons.push(`Suitable for ${preferences.occasion}`);
      }

      if (preferences.relationship && gift.relationships?.includes(preferences.relationship)) {
        score += WEIGHTS.relationship;
        reasons.push(`Great for ${preferences.relationship}`);
      }

      if (preferences.interests?.length > 0 && gift.interests) {
        const matched = preferences.interests.filter(i => gift.interests.includes(i));

        if (matched.length > 0) {
          score += WEIGHTS.interests;
          reasons.push(`Matches interest in ${matched[0]}`);
        }
      }

      if (preferences.age > 0 && isAgeSuitable(gift, parseInt(preferences.age, 10))) {
        score += WEIGHTS.age;
      }

      return { gift, score, reasons };
    });

    const ranked = rankGifts(relaxedResults);
    const needed = MAX_RESULTS - currentResults.length;
    const additional = ranked.slice(0, needed).filter(r => r.score > WEIGHTS.budget);

    return [...currentResults, ...additional];
  }

  // Remove repeated gifts from the recommendation list
  function removeDuplicates(results) {
    const seen = new Set();

    return results.filter(r => {
      if (seen.has(r.gift.id)) return false;

      seen.add(r.gift.id);
      return true;
    });
  }

  // Generate the final list of recommended gifts
  function getRecommendations(allGifts, preferences) {
    const eligible = filterEligible(allGifts, preferences);
    if (eligible.length === 0) return [];

    const scored = eligible.map(gift => {
      const { score, reasons } = calculateScore(gift, preferences);
      return { gift, score, reasons };
    });

    let results = rankGifts(scored);
    results = removeDuplicates(results).slice(0, MAX_RESULTS);

    // Use fallback matching if the list has fewer than five gifts
    if (results.length < MAX_RESULTS) {
      results = fallbackMatch(allGifts, preferences, results);
      results = removeDuplicates(results).slice(0, MAX_RESULTS);
    }

    // Make sure every recommendation has at least one explanation
    results.forEach(r => {
      if (r.reasons.length === 0) {
        r.reasons.push('Fits your selected budget');
      }
    });

    return results;
  }

  return {
    getRecommendations,
    parseBudgetLimit,
    isWithinBudget,
    isAgeSuitable,
    calculateScore,
    WEIGHTS,
    MAX_RESULTS
  };
})();

// Export the recommendation engine for Node.js tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Recommendation;
}
