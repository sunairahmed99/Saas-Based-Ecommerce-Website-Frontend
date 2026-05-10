import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchcategories, fetchTrendingCategories } from '../Features/Backend/CategorySlice';
import { fetchLatestProducts, fetchTrendingProducts, fetchFeaturedProducts } from '../Features/Backend/ProductSlice';
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
            const startTime = Date.now();
            
            // Safety timeout to ensure user is never stuck for more than 3 seconds
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));

            try {
                setStatusText('Loading experience...');
                
                // Essential fetches
                const apiPromises = [
                    dispatch(fetchcategories()),
                    dispatch(fetchTrendingCategories(10)),
                    dispatch(fetchsubcategories()),
                    dispatch(fetchBanners()),
                    dispatch(fetchLatestProducts()),
                    dispatch(fetchTrendingProducts()),
                    dispatch(fetchFeaturedProducts()),
                    dispatch(fetchHomeFlashDeals())
                ];

                // Race the APIs against a 3s timeout
                await Promise.race([
                    Promise.all(apiPromises),
                    timeoutPromise
                ]);
                
                setProgress(100);
                setStatusText('Welcome!');

                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, 500 - elapsedTime); // Min stay 500ms

                setTimeout(() => {
                    setIsVisible(false);
                    setTimeout(() => {
                        if (onComplete) onComplete();
                    }, 400); 
                }, remainingTime);

            } catch (error) {
                console.error('Splash screen loading error:', error);
                onComplete();
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
                    transition={{ duration: 0.6, ease: "easeInOut" }}
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
