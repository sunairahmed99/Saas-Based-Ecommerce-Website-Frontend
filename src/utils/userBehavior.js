// User behavior tracking utility
const BEHAVIOR_KEY = 'user_behavior';

// Initialize user behavior data
const getUserBehavior = () => {
  try {
    const behavior = localStorage.getItem(BEHAVIOR_KEY);
    return behavior ? JSON.parse(behavior) : {
      viewedProducts: [],
      searchedTerms: [],
      visitedCategories: [],
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('Error reading user behavior:', error);
    return {
      viewedProducts: [],
      searchedTerms: [],
      visitedCategories: [],
      lastUpdated: Date.now()
    };
  }
};

// Save user behavior data
const saveUserBehavior = (behavior) => {
  try {
    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behavior));
  } catch (error) {
    console.error('Error saving user behavior:', error);
  }
};

// Track viewed product
export const trackViewedProduct = (productId, category) => {
  const behavior = getUserBehavior();

  // Add to viewed products (keep only last 20)
  if (!behavior.viewedProducts.includes(productId)) {
    behavior.viewedProducts.unshift(productId);
    behavior.viewedProducts = behavior.viewedProducts.slice(0, 20);
  }

  // Track category
  if (category && !behavior.visitedCategories.includes(category)) {
    behavior.visitedCategories.unshift(category);
    behavior.visitedCategories = behavior.visitedCategories.slice(0, 10);
  }

  behavior.lastUpdated = Date.now();
  saveUserBehavior(behavior);
};

// Track search term
export const trackSearchTerm = (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length < 2) return;

  const behavior = getUserBehavior();

  // Add to searched terms (keep only last 15)
  const term = searchTerm.trim().toLowerCase();
  if (!behavior.searchedTerms.includes(term)) {
    behavior.searchedTerms.unshift(term);
    behavior.searchedTerms = behavior.searchedTerms.slice(0, 15);
  }

  behavior.lastUpdated = Date.now();
  saveUserBehavior(behavior);
};

// Track category visit
export const trackCategoryVisit = (category) => {
  if (!category) return;

  const behavior = getUserBehavior();

  if (!behavior.visitedCategories.includes(category)) {
    behavior.visitedCategories.unshift(category);
    behavior.visitedCategories = behavior.visitedCategories.slice(0, 10);
  }

  behavior.lastUpdated = Date.now();
  saveUserBehavior(behavior);
};

// Get recommended products based on user behavior
export const getBehaviorBasedRecommendations = (allProducts, maxProducts = 12) => {
  const behavior = getUserBehavior();
  const recommendations = new Map();

  // Score products based on user behavior
  allProducts.forEach(product => {
    let score = 0;

    // Higher score for products in frequently visited categories
    if (behavior.visitedCategories.includes(product.category)) {
      score += 3;
    }

    // Medium score for products matching search terms
    behavior.searchedTerms.forEach(term => {
      if (product.pname?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)) {
        score += 2;
      }
    });

    // Lower score for recently viewed products (to show variety)
    if (behavior.viewedProducts.includes(product._id)) {
      score += 1;
    }

    // Boost score for products with good ratings/reviews
    if (product.avgRating && product.avgRating >= 4) {
      score += 1;
    }

    if (score > 0) {
      recommendations.set(product._id, { product, score });
    }
  });

  // Sort by score and return top products
  return Array.from(recommendations.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxProducts)
    .map(item => item.product);
};

// Get random products as fallback
export const getRandomProducts = (allProducts, maxProducts = 12, excludeIds = []) => {
  const availableProducts = allProducts.filter(product =>
    !excludeIds.includes(product._id) && product.pstatus === 'active'
  );

  // Shuffle array and return random products
  const shuffled = [...availableProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, maxProducts);
};

// Clear old behavior data (older than 30 days)
export const cleanupOldBehavior = () => {
  const behavior = getUserBehavior();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  if (behavior.lastUpdated < thirtyDaysAgo) {
    // Reset behavior data
    const freshBehavior = {
      viewedProducts: [],
      searchedTerms: [],
      visitedCategories: [],
      lastUpdated: Date.now()
    };
    saveUserBehavior(freshBehavior);
  }
};
