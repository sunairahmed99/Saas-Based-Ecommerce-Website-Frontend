/**
 * Utility to map slow loremflickr.com redirecting URLs to high-performance
 * direct CDN links (such as Unsplash imgix CDN) to speed up image loading.
 */
export const getOptimizedImageUrl = (src) => {
  if (!src || typeof src !== 'string') return src;

  // Check if it's a loremflickr URL
  if (src.includes('loremflickr.com')) {
    // Parse the category from the URL
    // e.g. https://loremflickr.com/640/480/technology -> technology
    const parts = src.split('/');
    let category = parts[parts.length - 1]?.toLowerCase() || 'general';
    
    // Remove query parameters or trailing dimensions if present
    category = category.split('?')[0].split(',')[0];

    // High-quality, direct Unsplash CDN URLs (no redirect hops)
    const pools = {
      tech: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1527690718307-b07200788ab6?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80"
      ],
      fashion: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80"
      ],
      home: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80"
      ],
      beauty: [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=500&auto=format&fit=crop&q=80"
      ],
      sports: [
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80"
      ],
      general: [
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80"
      ]
    };

    // Determine target pool
    let pool = pools.general;
    if (category.includes('tech') || category.includes('computer') || category.includes('electronic') || category.includes('gadget') || category.includes('phone')) {
      pool = pools.tech;
    } else if (category.includes('fashion') || category.includes('cloth') || category.includes('dress') || category.includes('shoes') || category.includes('wear') || category.includes('apparel')) {
      pool = pools.fashion;
    } else if (category.includes('home') || category.includes('furnit') || category.includes('kitchen') || category.includes('appliance') || category.includes('living')) {
      pool = pools.home;
    } else if (category.includes('beauty') || category.includes('makeup') || category.includes('skincare') || category.includes('cosmetic')) {
      pool = pools.beauty;
    } else if (category.includes('sport') || category.includes('fit') || category.includes('gym') || category.includes('workout')) {
      pool = pools.sports;
    }

    // Use a simple hash of the URL string to consistently assign the same image from the pool to the same product/category
    let hash = 0;
    for (let i = 0; i < src.length; i++) {
      hash = src.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pool.length;
    return pool[index];
  }

  return src;
};
