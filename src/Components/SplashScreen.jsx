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
        let isMounted = true;
        
        const loadData = async () => {
            const startTime = Date.now();
            const minStayTime = 15000; // 15 seconds
            
            // Safety timeout
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 20000));

            try {
                if (isMounted) setStatusText('Initializing secure connection...');
                
                // Simulation of progress
                const progressInterval = setInterval(() => {
                    if (!isMounted) {
                        clearInterval(progressInterval);
                        return;
                    }
                    setProgress(prev => (prev >= 98 ? prev : prev + 1));
                }, 140);

                // Essential fetches with unwrap() to ensure we wait for completion
                const safeFetch = async (thunk) => {
                    try {
                        await dispatch(thunk).unwrap();
                    } catch (e) {
                        console.warn('Pre-fetch non-critical failure:', e);
                        // We don't crash the whole splash for one failure
                    }
                };

                const apiPromises = [
                    safeFetch(fetchcategories()),
                    safeFetch(fetchTrendingCategories(10)),
                    safeFetch(fetchsubcategories()),
                    safeFetch(fetchBanners()),
                    safeFetch(fetchLatestProducts()),
                    safeFetch(fetchTrendingProducts()),
                    safeFetch(fetchFeaturedProducts()),
                    safeFetch(fetchHomeFlashDeals()),
                    safeFetch(fetchproducts())
                ];

                // Wait for APIs or timeout
                await Promise.race([
                    Promise.all(apiPromises),
                    timeoutPromise
                ]);
                
                clearInterval(progressInterval);
                if (isMounted) {
                    setProgress(100);
                    setStatusText('Almost there...');
                }

                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minStayTime - elapsedTime);

                setTimeout(() => {
                    if (isMounted) setIsVisible(false);
                    setTimeout(() => {
                        if (isMounted && onComplete) onComplete();
                    }, 800); 
                }, remainingTime);

            } catch (error) {
                console.error('Critical Splash Error:', error);
                setTimeout(() => {
                    if (isMounted && onComplete) onComplete();
                }, 3000);
            }
        };

        loadData();
        return () => { isMounted = false; };
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
                                MYSHOP
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
