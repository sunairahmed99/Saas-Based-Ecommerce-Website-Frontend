import { configureStore } from "@reduxjs/toolkit";
import UserReducer from "../Features/Backend/UserSlice";
import SellerReducer from "../Features/Backend/SellerSlice";
import CategoryReducer from "../Features/Backend/CategorySlice";
import SubCategoryReducer from "../Features/Backend/SubCategorySlice";
import ProductReducer from "../Features/Backend/ProductSlice";
import FlashDealReducer from "../Features/Backend/FlashDealSlice";
import BoostPackageReducer from "../Features/Backend/BoostPackageSlice";
import ProductBoostReducer from "../Features/Backend/ProductBoostSlice";
import OfferReducer from "../Features/Backend/OfferSlice";
import BannerReducer from "../Features/Backend/BannerSlice";
import FavoriteReducer from "../Features/Backend/FavoriteSlice";
import CartReducer from "../Features/Backend/CartSlice";
import ContactReducer from "../Features/Backend/ContactSlice";
import ReviewReducer from "../Features/Backend/ReviewSlice";
import WalletReducer from "../Features/Backend/WalletSlice";
import CouponReducer from "../Features/Backend/CouponSlice";
import AnalyticsReducer from "../Features/Backend/AnalyticsSlice";
import PaymentReducer from "../Features/Backend/PaymentSlice";









export const store = configureStore({
  reducer: {
    users:UserReducer,
    sellers:SellerReducer,
    categories:CategoryReducer,
    subcategories:SubCategoryReducer,
    products:ProductReducer,
    flashdeal: FlashDealReducer,
    boostPackage: BoostPackageReducer,
    productBoost: ProductBoostReducer,
    offers: OfferReducer,
    banners: BannerReducer,
    favorites: FavoriteReducer,
    cart: CartReducer,
    contact: ContactReducer,
    reviews: ReviewReducer,
    wallet: WalletReducer,
    coupons: CouponReducer,
    analytics: AnalyticsReducer,
    payment: PaymentReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 100, // Increase threshold to 100ms
      },
    }),
});