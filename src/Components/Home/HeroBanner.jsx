import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanners, selectBanners, selectBannersLoading } from "../../Features/Backend/BannerSlice";
import "./HeroBanner.css";

const HeroBanner = () => {
  const dispatch = useDispatch();
  const dynamicBanners = useSelector(selectBanners);
  const bannersLoading = useSelector(selectBannersLoading);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Static fallback banners
  const staticSlides = [
    {
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200",
      title: "11.11 Mega Sale",
      subtitle: "Up to 80% OFF",
      description: "Shop now and save big on top brands",
      color: "#f97316",
      buttonText: "Shop Now",
      buttonLink: "/shop"
    },
    {
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
      title: "12.12 Festival Sale",
      subtitle: "Limited Time Offer",
      description: "Best deals on electronics and fashion",
      color: "#ec4899",
      buttonText: "Shop Now",
      buttonLink: "/shop"
    },
    {
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200",
      title: "New Arrivals",
      subtitle: "Latest Collection",
      description: "Discover trending products",
      color: "#22c55e",
      buttonText: "Shop Now",
      buttonLink: "/shop"
    },
  ];

  // Use dynamic banners if available, otherwise use static banners
  const slides = dynamicBanners && dynamicBanners.length > 0 ? dynamicBanners : staticSlides;

  // Fetch dynamic banners only if not already loaded (SplashScreen pre-fetches)
  useEffect(() => {
    if (!dynamicBanners || dynamicBanners.length === 0) {
      dispatch(fetchBanners());
    }
  }, [dispatch, dynamicBanners?.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000); // Slightly longer interval for better UX
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <>
      <section className="hero-banner">
        <div className="slider-container">
          <div className="slider-wrapper">
            {slides.map((slide, index) => (
              <div
                key={slide._id || index}
                className={`slide ${index === currentSlide ? "active" : ""}`}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="slide-overlay" />
                <div className="slide-content">
                  <h1>{slide.title}</h1>
                  <p>{slide.description}</p>
                  <button
                    className="shop-btn"
                    onClick={() => {
                      if (slide.buttonLink) {
                        window.location.href = slide.buttonLink;
                      }
                    }}
                  >
                    {slide.buttonText || "Shop Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroBanner;
