import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchProducts, selectSearchResults, selectSearchLoading } from "../../Features/Backend/ProductSlice";
import { useNavigate } from "react-router-dom";
import { trackSearchTerm } from "../../utils/userBehavior";
import "./SearchBar.css";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchResults = useSelector(selectSearchResults);
  const searchLoading = useSelector(selectSearchLoading);
  const searchTimeoutRef = useRef(null);

  // Debounced search function
  const performSearch = (searchQuery) => {
    if (searchQuery.trim().length > 0) {
      dispatch(searchProducts(searchQuery));
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim().length > 0) {
        performSearch(value);
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }, 150); // 150ms delay
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (query.trim().length > 0) {
      const searchTerm = query.trim();
      trackSearchTerm(searchTerm);
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    performSearch(suggestion);
    setShowResults(true);
  };

  // Handle product click from results
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setShowResults(false);
    setQuery("");
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-bar-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <section className="search-section">
        <div className="search-bar-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for products, categories or sellers..."
              value={query}
              onChange={handleInputChange}
              onFocus={() => query && setShowResults(true)}
            />
            <button onClick={handleSearchClick} disabled={searchLoading}>
              {searchLoading ? "..." : "Search"}
            </button>
          </div>

          {/* Search Suggestions */}
          <div className="search-suggestions">
            {["Electronics", "Fashion", "Shoes", "Bags", "Deals"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="search-results">
              {searchLoading ? (
                <div className="search-loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.slice(0, 5).map((product) => (
                    <div
                      key={product._id}
                      className="search-result-item"
                      onClick={() => handleProductClick(product._id)}
                    >
                      <img
                        src={product.pimage1}
                        alt={product.pname}
                        className="search-result-image"
                      />
                      <div className="search-result-info">
                        <div className="search-result-name">{product.pname}</div>
                        <div className="search-result-price">
                          Rs. {product.prodisprice || product.pprice}
                        </div>
                      </div>
                    </div>
                  ))}
                  {searchResults.length > 5 && (
                    <div className="search-see-more">
                      +{searchResults.length - 5} more results...
                    </div>
                  )}
                </div>
              ) : query && (
                <div className="search-no-results">No products found</div>
              )}
            </div>
          )}
        </div>

      </section>
    </>
  );
};

export default SearchBar;

