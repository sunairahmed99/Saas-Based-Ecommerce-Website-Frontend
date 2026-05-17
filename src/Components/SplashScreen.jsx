import React, { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchcategories, fetchTrendingCategories } from '../Features/Backend/CategorySlice';
import { fetchLatestProducts, fetchTrendingProducts, fetchFeaturedProducts } from '../Features/Backend/ProductSlice';
import { fetchHomeFlashDeals } from '../Features/Backend/FlashDealSlice';
import { fetchBanners } from '../Features/Backend/BannerSlice';
import { fetchTopPerformingSellers } from '../Features/Backend/SellerSlice';
import { fetchActiveBoosts } from '../Features/Backend/ProductBoostSlice';
import { fetchApprovedReviews } from '../Features/Backend/ReviewSlice';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';

const NAVIGATE_TIME = 15000; // Always navigate at exactly 15 seconds
const PROGRESS_DURATION = 16000; // Progress bar fills over 16 seconds

const SplashScreen = ({ onComplete }) => {
    const dispatch = useDispatch();
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing...');
    const [isVisible, setIsVisible] = useState(true);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const startTime = Date.now();

        // ─── 1. PROGRESS BAR: smooth fill over 16 seconds (visual only) ───
        const progressInterval = setInterval(() => {
            if (!isMountedRef.current) {
                clearInterval(progressInterval);
                return;
            }
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(100, (elapsed / PROGRESS_DURATION) * 100);
            setProgress(newProgress);

            // Update status text based on progress
            if (newProgress < 15) setStatusText('Initializing secure connection...');
            else if (newProgress < 30) setStatusText('Fetching store categories...');
            else if (newProgress < 50) setStatusText('Loading trending products...');
            else if (newProgress < 70) setStatusText('Setting up your experience...');
            else if (newProgress < 90) setStatusText('Finalizing...');
            else setStatusText('Ready!');

            if (elapsed >= PROGRESS_DURATION) {
                clearInterval(progressInterval);
            }
        }, 50);

        // ─── 2. API CALLS: fire all simultaneously, fire-and-forget ───
        const safeFetch = (thunk) => {
            dispatch(thunk).unwrap().catch((e) => {
                console.warn('Pre-fetch non-critical failure:', e);
            });
        };

        safeFetch(fetchcategories());
        safeFetch(fetchTrendingCategories(10));
        safeFetch(fetchBanners());
        safeFetch(fetchLatestProducts());
        safeFetch(fetchTrendingProducts());
        safeFetch(fetchFeaturedProducts());
        safeFetch(fetchHomeFlashDeals());
        safeFetch(fetchTopPerformingSellers());
        safeFetch(fetchActiveBoosts());
        safeFetch(fetchApprovedReviews());

        // ─── 3. NAVIGATION: always at exactly 15 seconds (constant) ───
        const navigationTimer = setTimeout(() => {
            if (!isMountedRef.current) return;
            clearInterval(progressInterval);
            setProgress(100);
            setStatusText('Ready!');

            // Small visual buffer then exit
            setTimeout(() => {
                if (!isMountedRef.current) return;
                setIsVisible(false);
                setTimeout(() => {
                    if (isMountedRef.current && onComplete) onComplete();
                }, 600);
            }, 400);
        }, NAVIGATE_TIME);

        return () => {
            isMountedRef.current = false;
            clearInterval(progressInterval);
            clearTimeout(navigationTimer);
        };
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
