import { NO_IMAGE_PLACEHOLDER } from "../constants/images";

/**
 * Utility to map slow loremflickr.com redirecting URLs to high-performance
 * direct CDN links (such as Unsplash imgix CDN) to speed up image loading.
 */
export const getOptimizedImageUrl = (src, alt) => {
  if (!src || typeof src !== "string") return NO_IMAGE_PLACEHOLDER;
  if (src.includes("via.placeholder.com")) return NO_IMAGE_PLACEHOLDER;

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
    music: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1525201548942-d8c8b09d55f0?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579685306716-1f9e21132644?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552422535-c45813c61732?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=80"
    ],
    art: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565192647048-f997ded87958?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598257006463-7c64a3a6379a?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&auto=format&fit=crop&q=80"
    ],
    stationery: [
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80"
    ],
    baby: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1559440648-23c241516f49?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522836924445-4478bdeb860c?w=500&auto=format&fit=crop&q=80"
    ],
    pet: [
      "https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&auto=format&fit=crop&q=80"
    ],
    automotive: [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80"
    ],
    tools: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1530124560072-aec937bd8db7?w=500&auto=format&fit=crop&q=80"
    ],
    bags: [
      "https://images.unsplash.com/photo-1627124118304-4c40139e8f6d?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500&auto=format&fit=crop&q=80"
    ],
    jewelry: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=80"
    ],
    eyewear: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=80"
    ],
    health: [
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80"
    ],
    books: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=500&auto=format&fit=crop&q=80"
    ],
    toys: [
      "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=500&auto=format&fit=crop&q=80"
    ],
    garden: [
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&auto=format&fit=crop&q=80"
    ],
    aquariums: [
      "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop&q=80"
    ],
    watches: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80"
    ],
    safety: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80"
    ],
    general: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=80"
    ]
  };

  const isLoremFlickr = src.includes('loremflickr.com');
  const isGradient = src.includes('photo-1579546929518-9e396f3cc809') || src.includes('photo-1557683316-973673baf926');
  const isPlaceholder = src.includes('via.placeholder.com') || isGradient;

  if (isLoremFlickr || isPlaceholder) {
    // Parse the category from the URL
    // e.g. https://loremflickr.com/640/480/technology -> technology
    let category = 'general';
    if (isLoremFlickr) {
      const parts = src.split('/');
      category = parts[parts.length - 1]?.toLowerCase() || 'general';
      category = category.split('?')[0].split(',')[0];
    }

    const matches = (keywords) => {
      const catLower = category.toLowerCase();
      const altLower = (alt || '').toLowerCase();
      return keywords.some(k => catLower.includes(k) || altLower.includes(k));
    };

    // Determine target pool
    let pool = pools.general;
    
    if (matches(['guitar', 'violin', 'drum', 'flute', 'keyboard', 'microphone', 'music', 'drums', 'violins', 'guitars', 'keyboards', 'microphones', 'flutes'])) {
      pool = pools.music;
    } else if (matches(['art', 'paint', 'craft', 'knitting', 'origami', 'scrapbooking', 'modeling', 'clay', 'crochet'])) {
      pool = pools.art;
    } else if (matches(['stapler', 'notebook', 'planner', 'sticky', 'paper', 'staplers', 'notebooks', 'planners'])) {
      pool = pools.stationery;
    } else if (matches(['diaper', 'feeding', 'stroller', 'diapers', 'strollers'])) {
      pool = pools.baby;
    } else if (matches(['leash', 'collar', 'pet', 'leashes', 'collars'])) {
      pool = pools.pet;
    } else if (matches(['motorcycle', 'engine', 'oil', 'auto'])) {
      pool = pools.automotive;
    } else if (matches(['drill', 'hand tool', 'measuring tool', 'tool', 'power tool', 'tools'])) {
      pool = pools.tools;
    } else if (matches(['wallet', 'trolley', 'bag', 'wallets'])) {
      pool = pools.bags;
    } else if (matches(['jewel', 'bracelet', 'necklace', 'jewellery', 'bracelets', 'necklaces'])) {
      pool = pools.jewelry;
    } else if (matches(['sunglass', 'wayfarer', 'aviator', 'polarized', 'round frame', 'glasses', 'sunglasses', 'wayfarers', 'aviators'])) {
      pool = pools.eyewear;
    } else if (matches(['blood pressure', 'nebulizer', 'first aid', 'pulse oximeter', 'thermometer', 'medical', 'health', 'nebulizers', 'thermometers'])) {
      pool = pools.health;
    } else if (matches(['children', 'book', 'selfhelp', 'self-help', 'academic', 'books'])) {
      pool = pools.books;
    } else if (matches(['doll', 'toy', 'dolls', 'toys'])) {
      pool = pools.toys;
    } else if (matches(['garden', 'soil', 'pot', 'planter', 'pots', 'planters'])) {
      pool = pools.garden;
    } else if (matches(['aquarium', 'fish', 'aquariums'])) {
      pool = pools.aquariums;
    } else if (matches(['digital', 'analog', 'watch', 'clock', 'watches'])) {
      pool = pools.watches;
    } else if (matches(['safety'])) {
      pool = pools.safety;
    } else if (matches(['tech', 'computer', 'electronic', 'gadget', 'phone', 'iphones', 'gaming', 'ipads', 'fitness', 'smart'])) {
      pool = pools.tech;
    } else if (matches(['fashion', 'cloth', 'dress', 'shoes', 'wear', 'apparel', 'boot', 'boots', 'frock', 'frocks', 'sneaker', 'sneakers', 'sandal', 'sandals', 'wedges'])) {
      pool = pools.fashion;
    } else if (matches(['home', 'furnit', 'kitchen', 'appliance', 'living', 'theatre'])) {
      pool = pools.home;
    } else if (matches(['beauty', 'makeup', 'skincare', 'cosmetic'])) {
      pool = pools.beauty;
    } else if (matches(['sport', 'fit', 'gym', 'workout'])) {
      pool = pools.sports;
    }

    // Use a simple hash of the URL or alt string to consistently assign the same image
    const keyString = alt || src;
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      hash = keyString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pool.length;
    return pool[index];
  }

  // Clean up general image pools if it's one of the gradient ones
  if (isGradient) {
    let hash = 0;
    for (let i = 0; i < src.length; i++) {
      hash = src.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pools.general.length;
    return pools.general[index];
  }

  return src;
};
