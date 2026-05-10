import React, { useEffect, memo, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../Components/Navbar";
import HeroBanner from "../Components/Home/HeroBanner";
import SearchBar from "../Components/Home/SearchBar";
import TopCategories from "../Components/Home/TopCategories";
import FlashDeals from "../Components/Home/FlashDeals";
import FeaturedSellers from "../Components/Home/FeaturedSellers";
import ProductCarousel from "../Components/Home/ProductCarousel";
import SellerCTA from "../Components/Home/SellerCTA";
import Footer from "../Components/Home/Footer";
import Testimonials from "../Components/Home/Testimonials";
import BoostedProducts from "../Components/Home/BoostedProducts";
import {
  fetchTrendingProducts,
  fetchForYouProducts,
  fetchLatestProducts,
  selectTrendingProducts,
  selectForYouProducts,
  selectLatestProducts,
} from "../Features/Backend/ProductSlice";
import { fetchHomeFlashDeals, selectHomeFlashDeals } from "../Features/Backend/FlashDealSlice";
import { fetchApprovedReviews, selectApprovedReviews } from "../Features/Backend/ReviewSlice";
import { selectUser } from "../Features/Backend/UserSlice";
import SEOHead from "../Components/SEOHead";
import { getBehaviorBasedRecommendations, getRandomProducts, cleanupOldBehavior } from "../utils/userBehavior";

const Home = memo(() => {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const user = useSelector(selectUser);
  const trendingProducts = useSelector(selectTrendingProducts);
  const forYouProducts = useSelector(selectForYouProducts);
  const latestProducts = useSelector(selectLatestProducts);
  const dealsBySeller = useSelector(selectHomeFlashDeals);
  const approvedReviews = useSelector(selectApprovedReviews) || [];

  // Get user ID from user object
  const userId = user?.data?._id || user?._id || null;

  // Fetch data only if not already in store
  useEffect(() => {
    if (!trendingProducts || trendingProducts.length === 0) {
      dispatch(fetchTrendingProducts());
    }
    if (!latestProducts || latestProducts.length === 0) {
      dispatch(fetchLatestProducts());
    }
    if (!approvedReviews || approvedReviews.length === 0) {
      dispatch(fetchApprovedReviews());
    }
  }, [dispatch, trendingProducts?.length, latestProducts?.length, approvedReviews?.length]);

  // Fetch flash deals only if not already loaded
  useEffect(() => {
    if (!dealsBySeller || dealsBySeller.length === 0) {
      dispatch(fetchHomeFlashDeals());
    }
  }, [dispatch, dealsBySeller?.length]);

  // Fetch "For You" products if user is logged in
  useEffect(() => {
    if (userId) {
      dispatch(fetchForYouProducts(userId));
    }
  }, [dispatch, userId]);

  // Scroll function for navigation arrows (memoized)
  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  // Memoized filtered products to prevent redundant calculations
  const electronicsProducts = useMemo(() => 
    (latestProducts || []).filter(product => product.pstatus === "active"),
    [latestProducts]
  );
  
  const activeTrendingProducts = useMemo(() => 
    (trendingProducts || []).filter(product => product.pstatus === "active"),
    [trendingProducts]
  );
  
  const activeForYouProducts = useMemo(() => 
    (forYouProducts || []).filter(product => product.pstatus === "active"),
    [forYouProducts]
  );

  // Enhanced "For You" logic: always show recommendations
  const forYouRecommendations = useMemo(() => {
    // Clean up old behavior data periodically
    cleanupOldBehavior();

    // If we have personalized recommendations from backend, use them
    if (activeForYouProducts.length > 0) {
      return activeForYouProducts;
    }

    // Otherwise, use behavior-based recommendations
    const behaviorBased = getBehaviorBasedRecommendations(electronicsProducts, 12);

    if (behaviorBased.length > 0) {
      return behaviorBased;
    }

    // As last resort, show random products
    return getRandomProducts(electronicsProducts, 12);
  }, [activeForYouProducts, electronicsProducts]);

  return (
    <>
      <SEOHead
        title="Home - Best Online Shopping Experience"
        description="Discover amazing products at unbeatable prices. Shop electronics, fashion, home essentials and more with fast delivery and excellent customer service."
        keywords="online shopping, ecommerce, electronics, fashion, home goods, deals, best prices"
        type="website"
      />
      <Navbar />
      <main className="home-main">
        <HeroBanner />
        <SearchBar />
        <TopCategories />
        <BoostedProducts />
        <FlashDeals />
        <FeaturedSellers />
        <ProductCarousel
          title="Trending Now"
          subtitle="Top 10 selling today"
          products={activeTrendingProducts}
          bgColor="rgba(30, 32, 39, 0.35)"
        />
      <Testimonials />
        <ProductCarousel
          title="For You"
          subtitle={userId ? "Personalized recommendations" : "Recommended for you"}
          products={forYouRecommendations}
          bgColor="rgba(51, 68, 102, 0.25)"
        />
        <ProductCarousel 
          title="Latest Products" 
          products={electronicsProducts}
          bgColor="rgba(30, 32, 39, 0.4)"
        />
        <SellerCTA />
        <Footer />
      </main>

      <style>{`
        .home-main {
          background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
          color: #ffffff;
          min-height: 100vh;
          padding: 0;
          margin: 0;
          width: 100%;
          overflow-x: hidden;
          max-width: 100vw;
          box-sizing: border-box;
        }

        /* Full width for all screen sizes */
        @media (max-width: 768px) {
          .home-main {
            padding: 0;
            overflow-x: hidden;
            max-width: 100vw;
          }

          /* Global Heading Centering for Mobile */
          .section-header, .boosted-header, .flash-header {
            text-align: center !important;
            justify-content: center !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            padding-inline: 1rem !important;
            margin-bottom: 1.5rem !important;
          }

          .section-header h2, .boosted-header h2, .flash-header h2 {
            font-size: 1.5rem !important;
            margin-bottom: 0.3rem !important;
          }

          .section-sub, .boosted-sub {
            text-align: center !important;
            margin: 0 auto !important;
          }

          /* Ensure all sections respect container width */
          .home-main > * {
            max-width: 100vw;
            overflow-x: hidden;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .home-main {
            padding: 0;
          }
        }

        @media (min-width: 1025px) {
          .home-main {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
          }
        }

        /* Performance optimizations */
        .home-main * {
          box-sizing: border-box;
        }

        /* Loading states */
        .loading-skeleton {
          background: linear-gradient(90deg, #2a2d3a 25%, #3a3f4e 50%, #2a2d3a 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
});

Home.displayName = 'Home';

export default Home;
