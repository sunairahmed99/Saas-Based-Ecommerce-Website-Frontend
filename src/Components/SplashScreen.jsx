import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchcategories, fetchTrendingCategories } from '../Features/Backend/CategorySlice';
import { fetchproducts, fetchTrendingProducts, fetchFeaturedProducts } from '../Features/Backend/ProductSlice';
import { fetchHomeFlashDeals } from '../Features/Backend/FlashDealSlice';
import { fetchsubcategories } from '../Features/Backend/SubCategorySlice';
import { fetchBanners } from '../Features/Backend/BannerSlice';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
    const dispatch = useDispatch();
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing...');
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Phase 1: Categories & Banners
                setStatusText('Setting up your shop...');
                await Promise.all([
                    dispatch(fetchcategories()),
                    dispatch(fetchTrendingCategories(10)),
                    dispatch(fetchsubcategories()),
                    dispatch(fetchBanners())
                ]);
                setProgress(35);

                // Phase 2: All Products
                setStatusText('Loading latest products...');
                await dispatch(fetchproducts());
                setProgress(65);

                // Phase 3: Featured & Flash Deals
                setStatusText('Fetching exclusive deals...');
                await Promise.all([
                    dispatch(fetchTrendingProducts()),
                    dispatch(fetchFeaturedProducts()),
                    dispatch(fetchHomeFlashDeals())
                ]);
                setProgress(90);

                // Phase 4: Finalizing
                setStatusText('Ready to Shop!');
                setProgress(100);

                // Minimum display time for "WOW" factor
                setTimeout(() => {
                    setIsVisible(false);
                    setTimeout(() => {
                        if (onComplete) onComplete();
                    }, 800); // Match CSS transition
                }, 2000);

            } catch (error) {
                console.error('Splash screen loading error:', error);
                // Fail gracefully
                setTimeout(() => onComplete(), 500);
            }
        };

        loadData();
    }, [dispatch, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    className="splash-container"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                >
                    {/* Dynamic Background */}
                    <div className="splash-bg-layer">
                        <div className="splash-circle circle-1"></div>
                        <div className="splash-circle circle-2"></div>
                    </div>
                    
                    {/* Glass Content Card */}
                    <motion.div 
                        className="splash-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="splash-logo-wrapper">
                            <motion.h1 
                                className="splash-logo"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                            >
                                E-SHOP
                            </motion.h1>
                            <motion.span 
                                className="splash-tagline"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Premium Store
                            </motion.span>
                        </div>

                        <div className="splash-loader-container">
                            <div className="splash-progress-track">
                                <div 
                                    className="splash-progress-bar" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <span className="splash-status-text">{statusText}</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
