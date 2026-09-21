export type Locale = "en" | "bn";

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Small, flat dictionary — sufficient for a marketplace-style UI where most
 * "content" (product titles, specs) is already language-neutral (brand
 * names, model numbers). Category display names are bilingual at the data
 * layer already (Category.name / Category.nameBn); this dictionary covers
 * chrome/UI strings only.
 */
export const dictionary = {
  en: {
    "nav.search_placeholder": "Search laptops, GPUs, keyboards, mice...",
    "nav.compare": "Compare",
    "nav.retailers": "Retailers",
    "home.hero_title": "Find the Best Hardware Price in Bangladesh",
    "home.hero_subtitle": "Compare prices and availability across Bangladesh's computer retailers.",
    "home.popular_categories": "Popular Categories",
    "home.trending_products": "Trending Products",
    "home.recently_updated": "Recently Updated Prices",
    "product.where_to_buy": "Where to Buy",
    "product.view_at_retailer": "View at Retailer",
    "product.lowest_price": "Lowest price",
    "product.average_price": "Average",
    "product.highest_price": "Highest",
    "product.available_at": "Available at",
    "product.stores": "stores",
    "product.price_history": "Price History",
    "availability.in_stock": "In Stock",
    "availability.low_stock": "Low Stock",
    "availability.out_of_stock": "Out of Stock",
    "availability.pre_order": "Pre-order",
    "availability.coming_soon": "Coming Soon",
    "availability.unknown": "Unknown",
    "freshness.stale_warning": "Price may have changed",
  },
  bn: {
    "nav.search_placeholder": "ল্যাপটপ, জিপিইউ, কীবোর্ড, মাউস খুঁজুন...",
    "nav.compare": "তুলনা করুন",
    "nav.retailers": "রিটেইলার",
    "home.hero_title": "বাংলাদেশে সেরা হার্ডওয়্যার দাম খুঁজুন",
    "home.hero_subtitle": "বাংলাদেশের কম্পিউটার রিটেইলারদের মধ্যে দাম ও স্টক তুলনা করুন।",
    "home.popular_categories": "জনপ্রিয় ক্যাটাগরি",
    "home.trending_products": "ট্রেন্ডিং পণ্য",
    "home.recently_updated": "সম্প্রতি আপডেট হওয়া দাম",
    "product.where_to_buy": "কোথায় কিনবেন",
    "product.view_at_retailer": "রিটেইলারে দেখুন",
    "product.lowest_price": "সর্বনিম্ন দাম",
    "product.average_price": "গড় দাম",
    "product.highest_price": "সর্বোচ্চ দাম",
    "product.available_at": "পাওয়া যাচ্ছে",
    "product.stores": "টি দোকানে",
    "product.price_history": "দামের ইতিহাস",
    "availability.in_stock": "স্টকে আছে",
    "availability.low_stock": "কম স্টক",
    "availability.out_of_stock": "স্টক নেই",
    "availability.pre_order": "প্রি-অর্ডার",
    "availability.coming_soon": "শীঘ্রই আসছে",
    "availability.unknown": "অজানা",
    "freshness.stale_warning": "দাম পরিবর্তিত হতে পারে",
  },
} as const;

export type DictionaryKey = keyof (typeof dictionary)["en"];

export function t(locale: Locale, key: DictionaryKey): string {
  return dictionary[locale][key] ?? dictionary[DEFAULT_LOCALE][key] ?? key;
}
