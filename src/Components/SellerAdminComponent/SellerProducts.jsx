import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerProducts } from "../../Features/Backend/ProductSlice";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import Products from "../AdminComponent/Products";

// Wrapper to load only logged-in seller's products, then reuse admin Products UI.
const SellerProducts = ({ setIsSidebarOpen }) => {
  const dispatch = useDispatch();
  const seller = useSelector(selectSeller);
  const sellerData = seller?.data;

  useEffect(() => {
    if (sellerData?._id) {
      dispatch(fetchSellerProducts(sellerData._id));
    }
  }, [dispatch, sellerData?._id]);

  return <Products isSellerView={true} setIsSidebarOpen={setIsSidebarOpen} />;
};

export default SellerProducts;


