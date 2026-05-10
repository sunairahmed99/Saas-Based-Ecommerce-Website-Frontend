import React, { useEffect } from 'react';

const SEOHead = React.memo(({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}) => {
  const siteName = 'Your E-commerce Store';
  const defaultDescription = 'Discover amazing products at great prices. Shop electronics, fashion, home goods and more with fast delivery and excellent customer service.';
  const baseUrl = window.location.origin;

  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | ${siteName}` : siteName;

    // Update meta tags
    const updateMetaTag = (name, content, property = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description || defaultDescription);
    updateMetaTag('keywords', keywords || 'ecommerce, shopping, online store, products');
    updateMetaTag('author', siteName);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('language', 'English');

    // Open Graph meta tags
    updateMetaTag('og:title', title || siteName, true);
    updateMetaTag('og:description', description || defaultDescription, true);
    updateMetaTag('og:image', image || `${baseUrl}/og-image.jpg`, true);
    updateMetaTag('og:url', url || window.location.href, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', siteName, true);

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title || siteName);
    updateMetaTag('twitter:description', description || defaultDescription);
    updateMetaTag('twitter:image', image || `${baseUrl}/og-image.jpg`);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url || window.location.href);

    // Structured Data
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredDataScript);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": type,
      "name": title || siteName,
      "description": description || defaultDescription,
      "url": url || window.location.href,
      "image": image || `${baseUrl}/og-image.jpg`
    };

    structuredDataScript.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, image, url, type]);

  return null; // This component doesn't render anything
});

SEOHead.displayName = 'SEOHead';

export default SEOHead;
