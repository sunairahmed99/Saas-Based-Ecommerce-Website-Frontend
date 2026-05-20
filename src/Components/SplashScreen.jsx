import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { selectUser } from '../Features/Backend/UserSlice';
import { motion, AnimatePresence } from 'framer-motion';
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
    const user = useSelector(selectUser);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing...');
    const [isVisible, setIsVisible] = useState(true);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const startTime = Date.now();

        const loadStore = async () => {
            const userId = user?.data?._id || user?._id || null;

            // List of critical tasks that must succeed or complete before entering the app
            const criticalTasks = [
                {
                    name: 'Categories',
                    fn: () => dispatch(fetchcategories()).unwrap()
                },
                {
                    name: 'Subcategories',
                    fn: () => dispatch(fetchsubcategories()).unwrap()
                },
                {
                    name: 'Banners',
                    fn: () => dispatch(fetchBanners()).unwrap()
                },
                {
                    name: 'Flash Deals',
                    fn: () => dispatch(fetchHomeFlashDeals()).unwrap()
                },
                {
                    name: 'Trending Products',
                    fn: () => queryClient.prefetchQuery({
                        queryKey: ['trendingProducts'],
                        queryFn: async () => {
                            const res = await axios.get(`${API_BASE_URL}/product/trending`);
                            return filterDummyProducts(res.data?.data || []);
                        },
                        staleTime: 5 * 60 * 1000
                    })
                },
                {
                    name: 'Latest Products',
                    fn: () => queryClient.prefetchQuery({
                        queryKey: ['latestProducts'],
                        queryFn: async () => {
                            const res = await axios.get(`${API_BASE_URL}/product/latest`);
                            return filterDummyProducts(res.data?.data || []);
                        },
                        staleTime: 5 * 60 * 1000
                    })
                }
            ];

            // If user is authenticated, prefetch recommendations
            if (userId) {
                criticalTasks.push({
                    name: 'Recommended Products',
                    fn: () => queryClient.prefetchQuery({
                        queryKey: ['forYouProducts', userId],
                        queryFn: async () => {
                            const res = await axios.get(`${API_BASE_URL}/product/foryou/${userId}`);
                            return filterDummyProducts(res.data?.data || []);
                        },
                        staleTime: 5 * 60 * 1000
                    })
                });
            }

            const total = criticalTasks.length;
            let completed = 0;

            const executeTask = async (task) => {
                try {
                    if (isMountedRef.current) {
                        setStatusText(`Loading ${task.name}...`);
                    }
                    await task.fn();
                    console.log(`Splash Prefetch Success: ${task.name}`);
                } catch (err) {
                    console.warn(`Splash Prefetch Failure: ${task.name}`, err);
                } finally {
                    completed++;
                    if (isMountedRef.current) {
                        setProgress(Math.round((completed / total) * 100));
                    }
                }
            };

            // Fire non-critical fetches in background (does not block splash screen transition)
            const fetchBackgroundResources = () => {
                dispatch(fetchTrendingCategories(10)).unwrap().catch(e => console.warn(e));
                dispatch(fetchproducts()).unwrap().catch(e => console.warn(e));
                dispatch(fetchTopPerformingSellers()).unwrap().catch(e => console.warn(e));
                dispatch(fetchActiveBoosts()).unwrap().catch(e => console.warn(e));
                dispatch(fetchApprovedReviews()).unwrap().catch(e => console.warn(e));
            };
            fetchBackgroundResources();

            // Await all critical resources in parallel
            await Promise.all(criticalTasks.map(executeTask));

            if (!isMountedRef.current) return;

            // Enforce minimum animation time of 1.5s to prevent jarring fast flash
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 1500 - elapsed);

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
    }, [dispatch, queryClient, onComplete, user]);

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
