-- pg_trgm provides similarity(), used by product search (lib/search/search.ts)
-- and by the scraper's product matching (lib/products/match.ts).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
