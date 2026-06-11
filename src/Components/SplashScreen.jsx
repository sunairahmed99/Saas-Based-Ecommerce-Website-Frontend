import React, { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { fetchcategories, fetchTrendingCategories } from '../Features/Backend/CategorySlice';
import { fetchsubcategories } from '../Features/Backend/SubCategorySlice';
import { fetchLatestProducts, fetchTrendingProducts, fetchFeaturedProducts, fetchproducts } from '../Features/Backend/ProductSlice';
import { fetchHomeFlashDeals } from '../Features/Backend/FlashDealSlice';
import { fetchBanners } from '../Features/Backend/BannerSlice';
import { fetchTopPerformingSellers } from '../Features/Backend/SellerSlice';
import { fetchActiveBoosts } from '../Features/Backend/ProductBoostSlice';
import { fetchApprovedReviews } from '../Features/Backend/ReviewSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { prefetchAllShopProducts } from '../utils/prefetchProduct';
import './SplashScreen.css';

// Helper to filter out dummy products matching the same criteria as Home/Shop pages
const filterDummyProducts = (products) => {
  if (!Array.isArray(products)) return [];
  return products.filter(p => {
    if (!p) return false;
    const isPulseDummy = p.pname && p.pname.includes('Pulse');
    return !isPulseDummy;
  });
};

const SplashScreen = ({ onComplete }) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing...');
    const [isVisible, setIsVisible] = useState(true);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const startTime = Date.now();

        const loadStore = async () => {
            // Only block on nav essentials; everything else loads in background
            const criticalTasks = [
                {
                    name: 'Categories',
                    fn: () => dispatch(fetchcategories()).unwrap()
                },
                {
                    name: 'Subcategories',
                    fn: () => dispatch(fetchsubcategories()).unwrap()
                },
            ];

            const total = criticalTasks.length;
            let completed = 0;

            const executeTask = async (task) => {
                try {
                    if (isMountedRef.current) {
                        setStatusText(`Loading ${task.name}...`);
                    }
                    await task.fn();
                } catch {
                    /* prefetch failure is non-fatal */
                } finally {
                    completed++;
                    if (isMountedRef.current) {
                        setProgress(Math.round((completed / total) * 100));
                    }
                }
            };

            const fetchBackgroundResources = () => {
                dispatch(fetchBanners()).unwrap().catch(() => {});
                dispatch(fetchHomeFlashDeals()).unwrap().catch(() => {});
                dispatch(fetchTrendingCategories(10)).unwrap().catch(() => {});
                dispatch(fetchFeaturedProducts()).unwrap().catch(() => {});
                dispatch(fetchActiveBoosts()).unwrap().catch(() => {});
                dispatch(fetchTopPerformingSellers()).unwrap().catch(() => {});
                dispatch(fetchApprovedReviews()).unwrap().catch(() => {});
                dispatch(fetchproducts()).unwrap().catch(() => {});
                queryClient.prefetchQuery({
                    queryKey: ['trendingProducts'],
                    queryFn: async () => {
                        const res = await axios.get(`${API_BASE_URL}/product/trending`);
                        return filterDummyProducts(res.data?.data || []);
                    },
                    staleTime: 5 * 60 * 1000,
                }).catch(() => {});
                queryClient.prefetchQuery({
                    queryKey: ['latestProducts'],
                    queryFn: async () => {
                        const res = await axios.get(`${API_BASE_URL}/product/latest`);
                        return filterDummyProducts(res.data?.data || []);
                    },
                    staleTime: 5 * 60 * 1000,
                }).catch(() => {});
                prefetchAllShopProducts(queryClient).catch(() => {});
            };
            fetchBackgroundResources();

            await Promise.all(criticalTasks.map(executeTask));

            if (!isMountedRef.current) return;

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 500 - elapsed);

            setTimeout(() => {
                if (!isMountedRef.current) return;
                setProgress(100);
                setStatusText('Ready!');

                setTimeout(() => {
                    if (!isMountedRef.current) return;
                    setIsVisible(false);
                    setTimeout(() => {
                        if (isMountedRef.current && onComplete) onComplete();
                    }, 600);
                }, 400);
            }, remaining);
        };

        loadStore();

        return () => {
            isMountedRef.current = false;
        };
    }, [dispatch, queryClient, onComplete]);

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
