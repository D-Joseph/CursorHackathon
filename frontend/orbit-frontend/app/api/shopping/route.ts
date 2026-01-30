import { NextRequest, NextResponse } from "next/server";
import { ShoppingProduct } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personName, relationship, interests, dislikes, holidays } = body;

    console.log("=== Shopping API Called ===");
    console.log("Person:", personName);
    console.log("Interests:", interests);
    console.log("Backend URL:", BACKEND_URL);

    // Build search queries based on interests
    const searchQueries = buildSearchQueries(interests, relationship, holidays);
    console.log("Search queries:", searchQueries);

    // Try calling the backend search API
    let allProducts: ShoppingProduct[] = [];

    for (const query of searchQueries.slice(0, 3)) {
      try {
        // Use the new /api/search/shopping endpoint for real product data
        const searchResponse = await fetch(`${BACKEND_URL}/api/search/shopping`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 5,
            context: {
              personInterests: interests,
              occasion: holidays?.[0] || "gift",
            },
          }),
        });

        if (searchResponse.ok) {
          const data = await searchResponse.json();
          console.log(`Shopping search for "${query}":`, data.success ? `${data.data?.results?.length} results` : 'failed');

          if (data.success && data.data?.results) {
            const products = data.data.results.map((item: any, index: number) =>
              normalizeBackendProduct(item, index + allProducts.length)
            );
            allProducts = [...allProducts, ...products];
          }
        } else {
          console.error(`Backend returned ${searchResponse.status} for query "${query}"`);
        }
      } catch (err) {
        console.error(`Search query failed for "${query}":`, err);
      }
    }

    // If we got products from backend, return them
    if (allProducts.length > 0) {
      // Remove duplicates by title
      const uniqueProducts = removeDuplicates(allProducts);
      return NextResponse.json({ products: uniqueProducts.slice(0, 12) });
    }

    // Fallback to generated products if backend unavailable
    console.log("Backend unavailable, using fallback products");
    const fallbackProducts = generateFallbackProducts(interests || ["general"], personName || "them");
    return NextResponse.json({ products: fallbackProducts });

  } catch (error) {
    console.error("Shopping API error:", error);
    const fallbackProducts = generateFallbackProducts(["general"], "them");
    return NextResponse.json({ products: fallbackProducts });
  }
}

function buildSearchQueries(interests: string[], relationship?: string, holidays?: string[]): string[] {
  const queries: string[] = [];

  // Build queries based on interests
  if (interests && interests.length > 0) {
    for (const interest of interests.slice(0, 4)) {
      queries.push(`${interest} gift`);
      queries.push(`best ${interest} products`);
    }
  }

  // Add occasion-based queries
  if (holidays && holidays.length > 0) {
    queries.push(`${holidays[0]} gift ideas`);
  }

  // Add relationship-based query
  if (relationship) {
    queries.push(`gift for ${relationship}`);
  }

  // Default query if nothing else
  if (queries.length === 0) {
    queries.push("best gift ideas");
    queries.push("popular gifts");
  }

  return queries;
}

function normalizeBackendProduct(item: any, index: number): ShoppingProduct {
  return {
    id: item.id || `product-${index}-${Date.now()}`,
    title: item.title || item.name || "Unknown Product",
    url: item.link || item.url || item.purchaseUrl || `https://www.google.com/search?q=${encodeURIComponent(item.title || "")}`,
    snippet: item.description || item.snippet || "",
    price: item.price ? {
      value: typeof item.price === "number" ? item.price : (item.price.value || item.price.amount || 0),
      currency: item.price.currency || "USD",
      isOnSale: item.price.isOnSale || false,
      originalPrice: item.price.originalPrice || item.price.originalAmount,
    } : undefined,
    rating: item.rating ? {
      score: item.rating.score || item.rating || 0,
      reviewCount: item.rating.reviewCount || item.rating.reviews || 0,
    } : undefined,
    imageUrl: item.imageUrl || item.image || item.thumbnail || undefined,
    availability: normalizeAvailability(item.availability),
    source: item.source || item.merchant || "Online Store",
  };
}

function normalizeAvailability(availability: string | undefined): ShoppingProduct["availability"] {
  if (!availability) return "unknown";
  const lower = availability.toLowerCase();
  if (lower.includes("in_stock") || lower.includes("in stock") || lower === "available") {
    return "in_stock";
  }
  if (lower.includes("out") || lower === "unavailable") {
    return "out_of_stock";
  }
  if (lower.includes("limited") || lower.includes("low")) {
    return "limited";
  }
  return "unknown";
}

function removeDuplicates(products: ShoppingProduct[]): ShoppingProduct[] {
  const seen = new Set<string>();
  return products.filter(product => {
    const key = product.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateFallbackProducts(interests: string[], personName: string): ShoppingProduct[] {
  // High-quality product images from Unsplash
  const productImages: Record<string, string> = {
    "cast-iron-skillet": "https://images.unsplash.com/photo-1585837146751-a44118595680?w=400&h=400&fit=crop",
    "chef-knife-set": "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=400&fit=crop",
    "instant-pot": "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop",
    "hiking-backpack": "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=400&h=400&fit=crop",
    "hiking-boots": "https://images.unsplash.com/photo-1520219306100-ec4afeeefe58?w=400&h=400&fit=crop",
    "trekking-poles": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop",
    "camera-strap": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
    "sd-card": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop",
    "camera-tripod": "https://images.unsplash.com/photo-1617575521317-d2974f3b56d2?w=400&h=400&fit=crop",
    "gaming-headset": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    "gaming-mouse": "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop",
    "stream-deck": "https://images.unsplash.com/photo-1593152167544-085d3b9c4938?w=400&h=400&fit=crop",
    "kindle": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
    "leather-book": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop",
    "reading-lamp": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
    "fitness-tracker": "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=400&h=400&fit=crop",
    "yoga-mat": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
    "resistance-bands": "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=400&fit=crop",
    "headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    "guitar-picks": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",
    "bluetooth-speaker": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    "colored-pencils": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop",
    "sketchbook": "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&h=400&fit=crop",
    "stylus": "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=400&h=400&fit=crop",
    "gift-card": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop",
    "blanket": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    "food-basket": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=400&fit=crop",
    "spa": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
    "wireless-charger": "https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=400&h=400&fit=crop",
    "candles": "https://images.unsplash.com/photo-1602607434639-aef11c451290?w=400&h=400&fit=crop",
    "power-bank": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop",
    "photo-album": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=400&fit=crop",
    "coffee": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop",
    "water-bottle": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    "skincare": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    "sleep-mask": "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=400&fit=crop",
  };

  const getImageUrl = (key: string) => productImages[key] || productImages["gift-card"];

  const productTemplates: Record<string, Array<{ title: string; imageKey: string; price: { value: number; currency: string; isOnSale?: boolean; originalPrice?: number }; source: string; rating: { score: number; reviewCount: number }; buyUrl: string }>> = {
    cooking: [
      { title: "Lodge Cast Iron Skillet 12\"", imageKey: "cast-iron-skillet", price: { value: 49.99, currency: "USD", isOnSale: true, originalPrice: 79.99 }, source: "Amazon", rating: { score: 4.7, reviewCount: 23412 }, buyUrl: "https://www.amazon.com/s?k=lodge+cast+iron+skillet" },
      { title: "Henckels Chef Knife Set", imageKey: "chef-knife-set", price: { value: 89.99, currency: "USD" }, source: "Williams Sonoma", rating: { score: 4.5, reviewCount: 1892 }, buyUrl: "https://www.williams-sonoma.com/search/results.html?words=henckels+knife" },
      { title: "Instant Pot Duo Plus", imageKey: "instant-pot", price: { value: 129.99, currency: "USD", isOnSale: true, originalPrice: 149.99 }, source: "Target", rating: { score: 4.8, reviewCount: 45231 }, buyUrl: "https://www.target.com/s?searchTerm=instant+pot" },
    ],
    hiking: [
      { title: "Osprey Hiking Backpack 40L", imageKey: "hiking-backpack", price: { value: 169.99, currency: "USD" }, source: "REI", rating: { score: 4.9, reviewCount: 3421 }, buyUrl: "https://www.rei.com/search?q=osprey+backpack" },
      { title: "Merrell Moab 3 Hiking Shoes", imageKey: "hiking-boots", price: { value: 134.99, currency: "USD", isOnSale: true, originalPrice: 159.99 }, source: "REI", rating: { score: 4.6, reviewCount: 8921 }, buyUrl: "https://www.rei.com/search?q=merrell+moab" },
      { title: "Black Diamond Trekking Poles", imageKey: "trekking-poles", price: { value: 59.99, currency: "USD" }, source: "Amazon", rating: { score: 4.4, reviewCount: 2341 }, buyUrl: "https://www.amazon.com/s?k=black+diamond+trekking+poles" },
    ],
    photography: [
      { title: "Peak Design Camera Strap", imageKey: "camera-strap", price: { value: 69.95, currency: "USD" }, source: "B&H Photo", rating: { score: 4.8, reviewCount: 5621 }, buyUrl: "https://www.bhphotovideo.com/c/search?q=peak+design+strap" },
      { title: "SanDisk 128GB SD Card", imageKey: "sd-card", price: { value: 24.99, currency: "USD", isOnSale: true, originalPrice: 39.99 }, source: "Amazon", rating: { score: 4.7, reviewCount: 89234 }, buyUrl: "https://www.amazon.com/s?k=sandisk+128gb+sd+card" },
      { title: "Manfrotto Mini Tripod", imageKey: "camera-tripod", price: { value: 89.99, currency: "USD" }, source: "Adorama", rating: { score: 4.5, reviewCount: 3412 }, buyUrl: "https://www.adorama.com/l/?searchinfo=manfrotto+tripod" },
    ],
    gaming: [
      { title: "SteelSeries Gaming Headset", imageKey: "gaming-headset", price: { value: 99.99, currency: "USD", isOnSale: true, originalPrice: 149.99 }, source: "Best Buy", rating: { score: 4.6, reviewCount: 12453 }, buyUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=steelseries+headset" },
      { title: "Razer Gaming Mouse", imageKey: "gaming-mouse", price: { value: 79.99, currency: "USD" }, source: "Amazon", rating: { score: 4.7, reviewCount: 34521 }, buyUrl: "https://www.amazon.com/s?k=razer+gaming+mouse" },
      { title: "Elgato Stream Deck Mini", imageKey: "stream-deck", price: { value: 79.99, currency: "USD" }, source: "Best Buy", rating: { score: 4.8, reviewCount: 8932 }, buyUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=elgato+stream+deck" },
    ],
    reading: [
      { title: "Kindle Paperwhite", imageKey: "kindle", price: { value: 139.99, currency: "USD", isOnSale: true, originalPrice: 159.99 }, source: "Amazon", rating: { score: 4.8, reviewCount: 123421 }, buyUrl: "https://www.amazon.com/dp/B08KTZ8249" },
      { title: "Leather Book Cover Set", imageKey: "leather-book", price: { value: 34.99, currency: "USD" }, source: "Etsy", rating: { score: 4.6, reviewCount: 892 }, buyUrl: "https://www.etsy.com/search?q=leather+book+cover" },
      { title: "Adjustable Reading Light", imageKey: "reading-lamp", price: { value: 19.99, currency: "USD" }, source: "Amazon", rating: { score: 4.4, reviewCount: 5623 }, buyUrl: "https://www.amazon.com/s?k=reading+light" },
    ],
    fitness: [
      { title: "Fitbit Charge 6", imageKey: "fitness-tracker", price: { value: 159.95, currency: "USD" }, source: "Best Buy", rating: { score: 4.5, reviewCount: 23412 }, buyUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=fitbit+charge" },
      { title: "Yoga Mat Premium", imageKey: "yoga-mat", price: { value: 68.00, currency: "USD" }, source: "Lululemon", rating: { score: 4.7, reviewCount: 4521 }, buyUrl: "https://shop.lululemon.com/search?Ntt=yoga+mat" },
      { title: "Resistance Bands Set", imageKey: "resistance-bands", price: { value: 29.99, currency: "USD", isOnSale: true, originalPrice: 44.99 }, source: "Amazon", rating: { score: 4.6, reviewCount: 67234 }, buyUrl: "https://www.amazon.com/s?k=resistance+bands" },
    ],
    music: [
      { title: "Sony WH-1000XM5 Headphones", imageKey: "headphones", price: { value: 349.99, currency: "USD", isOnSale: true, originalPrice: 399.99 }, source: "Best Buy", rating: { score: 4.8, reviewCount: 34521 }, buyUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=sony+wh1000xm5" },
      { title: "Fender Guitar Picks Set", imageKey: "guitar-picks", price: { value: 12.99, currency: "USD" }, source: "Guitar Center", rating: { score: 4.5, reviewCount: 8923 }, buyUrl: "https://www.guitarcenter.com/search?Ntt=fender+picks" },
      { title: "Portable Bluetooth Speaker", imageKey: "bluetooth-speaker", price: { value: 129.99, currency: "USD" }, source: "Amazon", rating: { score: 4.7, reviewCount: 56234 }, buyUrl: "https://www.amazon.com/s?k=bluetooth+speaker" },
    ],
    art: [
      { title: "Prismacolor Premier Pencils", imageKey: "colored-pencils", price: { value: 49.99, currency: "USD", isOnSale: true, originalPrice: 69.99 }, source: "Amazon", rating: { score: 4.8, reviewCount: 23412 }, buyUrl: "https://www.amazon.com/s?k=prismacolor+pencils" },
      { title: "Moleskine Sketchbook Set", imageKey: "sketchbook", price: { value: 29.95, currency: "USD" }, source: "Blick Art", rating: { score: 4.6, reviewCount: 5621 }, buyUrl: "https://www.dickblick.com/search/?q=moleskine+sketchbook" },
      { title: "iPad Drawing Stylus", imageKey: "stylus", price: { value: 129.00, currency: "USD" }, source: "Apple", rating: { score: 4.9, reviewCount: 89234 }, buyUrl: "https://www.apple.com/shop/product/MU8F2AM/A/apple-pencil-2nd-generation" },
    ],
  };

  const defaultProducts = [
    { title: "Premium Gift Card Bundle", imageKey: "gift-card", price: { value: 50.00, currency: "USD" }, source: "Amazon", rating: { score: 4.5, reviewCount: 12345 }, buyUrl: "https://www.amazon.com/gift-cards" },
    { title: "Cozy Blanket & Mug Set", imageKey: "blanket", price: { value: 44.99, currency: "USD", isOnSale: true, originalPrice: 59.99 }, source: "Target", rating: { score: 4.6, reviewCount: 3421 }, buyUrl: "https://www.target.com/s?searchTerm=cozy+blanket" },
    { title: "Gourmet Food Basket", imageKey: "food-basket", price: { value: 79.99, currency: "USD" }, source: "Harry & David", rating: { score: 4.7, reviewCount: 8921 }, buyUrl: "https://www.harryanddavid.com/h/gift-baskets" },
    { title: "Spa Day Experience", imageKey: "spa", price: { value: 99.00, currency: "USD" }, source: "Groupon", rating: { score: 4.4, reviewCount: 2341 }, buyUrl: "https://www.groupon.com/local/spa" },
    { title: "Wireless Charging Pad", imageKey: "wireless-charger", price: { value: 29.99, currency: "USD", isOnSale: true, originalPrice: 39.99 }, source: "Best Buy", rating: { score: 4.5, reviewCount: 15234 }, buyUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=wireless+charger" },
    { title: "Scented Candle Collection", imageKey: "candles", price: { value: 38.00, currency: "USD" }, source: "Bath & Body Works", rating: { score: 4.7, reviewCount: 9823 }, buyUrl: "https://www.bathandbodyworks.com/c/home-fragrance/candles" },
    { title: "Portable Power Bank 20000mAh", imageKey: "power-bank", price: { value: 45.99, currency: "USD" }, source: "Amazon", rating: { score: 4.6, reviewCount: 34521 }, buyUrl: "https://www.amazon.com/s?k=power+bank+20000mah" },
    { title: "Personalized Photo Album", imageKey: "photo-album", price: { value: 34.99, currency: "USD" }, source: "Shutterfly", rating: { score: 4.8, reviewCount: 6723 }, buyUrl: "https://www.shutterfly.com/photo-books" },
    { title: "Premium Coffee Sampler", imageKey: "coffee", price: { value: 42.00, currency: "USD" }, source: "Trade Coffee", rating: { score: 4.7, reviewCount: 4521 }, buyUrl: "https://www.drinktrade.com/" },
    { title: "Smart Water Bottle", imageKey: "water-bottle", price: { value: 59.99, currency: "USD", isOnSale: true, originalPrice: 79.99 }, source: "Amazon", rating: { score: 4.4, reviewCount: 8923 }, buyUrl: "https://www.amazon.com/s?k=smart+water+bottle" },
    { title: "Luxury Skincare Set", imageKey: "skincare", price: { value: 68.00, currency: "USD" }, source: "Sephora", rating: { score: 4.6, reviewCount: 12341 }, buyUrl: "https://www.sephora.com/shop/skincare-sets-value" },
    { title: "Bluetooth Sleep Headphones", imageKey: "sleep-mask", price: { value: 39.99, currency: "USD" }, source: "Amazon", rating: { score: 4.3, reviewCount: 23456 }, buyUrl: "https://www.amazon.com/s?k=sleep+headphones" },
  ];

  const products: ShoppingProduct[] = [];
  const usedTitles = new Set<string>();

  // Add products based on interests
  for (const interest of interests) {
    const lowerInterest = interest.toLowerCase();
    for (const [key, templates] of Object.entries(productTemplates)) {
      if (lowerInterest.includes(key) || key.includes(lowerInterest)) {
        for (const template of templates) {
          if (!usedTitles.has(template.title)) {
            usedTitles.add(template.title);
            products.push({
              id: `fallback-${products.length}-${Date.now()}`,
              title: template.title,
              url: template.buyUrl,
              snippet: `Perfect gift for someone who loves ${interest}`,
              price: template.price,
              rating: template.rating,
              imageUrl: getImageUrl(template.imageKey),
              availability: "in_stock",
              source: template.source,
            });
          }
        }
      }
    }
  }

  // Add default products if we don't have enough
  if (products.length < 8) {
    for (const template of defaultProducts) {
      if (!usedTitles.has(template.title) && products.length < 12) {
        usedTitles.add(template.title);
        products.push({
          id: `fallback-${products.length}-${Date.now()}`,
          title: template.title,
          url: template.buyUrl,
          snippet: `A thoughtful gift for ${personName}`,
          price: template.price,
          rating: template.rating,
          imageUrl: getImageUrl(template.imageKey),
          availability: "in_stock",
          source: template.source,
        });
      }
    }
  }

  return products.slice(0, 12);
}
