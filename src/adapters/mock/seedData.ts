/**
 * Canonical catalog used to generate both:
 *  - prisma/seed.ts (creates real Product/Category/Brand/Listing rows)
 *  - adapters/mock/catalogs.ts (per-retailer search catalogs for MockRetailerAdapter)
 *
 * basePrice is an approximate BD market price in BDT; each retailer applies
 * its own deterministic variance on top (see MockRetailerAdapter).
 */
export interface CanonicalMockProduct {
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  model: string;
  description: string;
  specifications: Record<string, string>;
  imageUrl: string;
  basePrice: number;
  /** Which mock retailer keys carry this product — lets stores differ (spec: not every store has everything). */
  retailers: string[];
}

const ALL_RETAILERS = ["mock-startech", "mock-ryans", "mock-techland", "mock-ucc", "mock-computer-source"];
const MOST_RETAILERS = ["mock-startech", "mock-ryans", "mock-techland", "mock-ucc"];
const FEW_RETAILERS = ["mock-startech", "mock-ryans", "mock-techland"];

export const CANONICAL_PRODUCTS: CanonicalMockProduct[] = [
  // ── Graphics Cards ─────────────────────────────────────────────────
  {
    slug: "asus-rtx-5070-12gb-oc",
    name: "ASUS RTX 5070 12GB OC",
    brand: "ASUS",
    categorySlug: "gpu",
    model: "ROG Strix RTX5070-O12G-GAMING",
    description: "ASUS ROG Strix GeForce RTX 5070 with factory overclock, triple-fan cooling, and 12GB GDDR7 memory for 1440p/4K gaming.",
    specifications: { VRAM: "12GB GDDR7", "Memory Bus": "192-bit", Architecture: "Blackwell", "Boost Clock": "2622 MHz", "Power Connector": "1x 16-pin" },
    imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600",
    basePrice: 95000,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "gigabyte-rtx-5070-ti-16gb-windforce",
    name: "Gigabyte RTX 5070 Ti 16GB Windforce OC",
    brand: "Gigabyte",
    categorySlug: "gpu",
    model: "GV-N507TWF3OC-16GD",
    description: "Gigabyte Windforce triple-fan RTX 5070 Ti with 16GB GDDR7, built for high-refresh 1440p and demanding 4K workloads.",
    specifications: { VRAM: "16GB GDDR7", "Memory Bus": "256-bit", Architecture: "Blackwell", "Boost Clock": "2542 MHz", "Power Connector": "1x 16-pin" },
    imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600",
    basePrice: 128000,
    retailers: MOST_RETAILERS,
  },
  {
    slug: "sapphire-rx-9070-xt-16gb-pulse",
    name: "Sapphire Pulse RX 9070 XT 16GB",
    brand: "Sapphire",
    categorySlug: "gpu",
    model: "11330-01-20G",
    description: "Sapphire Pulse RX 9070 XT with 16GB GDDR6 and dual BIOS, offering strong 1440p/4K performance for AMD RDNA 4.",
    specifications: { VRAM: "16GB GDDR6", "Memory Bus": "256-bit", Architecture: "RDNA 4", "Boost Clock": "2970 MHz", "Power Connector": "2x 8-pin" },
    imageUrl: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600",
    basePrice: 112000,
    retailers: FEW_RETAILERS,
  },

  // ── Processors ─────────────────────────────────────────────────────
  {
    slug: "intel-core-i7-14700k",
    name: "Intel Core i7-14700K",
    brand: "Intel",
    categorySlug: "cpu",
    model: "BX8071514700K",
    description: "20-core (8P+12E) 14th Gen desktop processor with a 5.6GHz max turbo, unlocked for overclocking.",
    specifications: { Cores: "20 (8P+12E)", Threads: "28", "Base Clock": "3.4 GHz", "Max Turbo": "5.6 GHz", Socket: "LGA1700", TDP: "125W" },
    imageUrl: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600",
    basePrice: 42500,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "intel-core-i5-14600k",
    name: "Intel Core i5-14600K",
    brand: "Intel",
    categorySlug: "cpu",
    model: "BX8071514600K",
    description: "14-core (6P+8E) mainstream gaming CPU with a 5.3GHz max turbo and unlocked multiplier.",
    specifications: { Cores: "14 (6P+8E)", Threads: "20", "Base Clock": "3.5 GHz", "Max Turbo": "5.3 GHz", Socket: "LGA1700", TDP: "125W" },
    imageUrl: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600",
    basePrice: 27500,
    retailers: MOST_RETAILERS,
  },
  {
    slug: "amd-ryzen-7-7800x3d",
    name: "AMD Ryzen 7 7800X3D",
    brand: "AMD",
    categorySlug: "cpu",
    model: "100-100000910WOF",
    description: "8-core Zen 4 gaming CPU with 3D V-Cache, widely regarded as a top gaming performer on AM5.",
    specifications: { Cores: "8", Threads: "16", "Base Clock": "4.2 GHz", "Max Turbo": "5.0 GHz", Socket: "AM5", TDP: "120W" },
    imageUrl: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600",
    basePrice: 38500,
    retailers: ALL_RETAILERS,
  },

  // ── RAM ────────────────────────────────────────────────────────────
  {
    slug: "kingston-fury-beast-32gb-ddr5-6000",
    name: "Kingston Fury Beast 32GB (2x16GB) DDR5 6000MHz",
    brand: "Kingston",
    categorySlug: "ram",
    model: "KF560C36BBEK2-32",
    description: "Dual-channel DDR5 kit with EXPO/XMP support for AMD and Intel platforms, low-profile heat spreader.",
    specifications: { Capacity: "32GB (2x16GB)", "Memory Type": "DDR5", Speed: "6000MHz", "CAS Latency": "CL36" },
    imageUrl: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=600",
    basePrice: 14500,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "corsair-vengeance-16gb-ddr5-5600",
    name: "Corsair Vengeance 16GB (2x8GB) DDR5 5600MHz",
    brand: "Corsair",
    categorySlug: "ram",
    model: "CMK16GX5M2B5600C36",
    description: "Entry-level DDR5 kit with aluminum heat spreader and Intel XMP 3.0 support.",
    specifications: { Capacity: "16GB (2x8GB)", "Memory Type": "DDR5", Speed: "5600MHz", "CAS Latency": "CL36" },
    imageUrl: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=600",
    basePrice: 6800,
    retailers: MOST_RETAILERS,
  },

  // ── Storage ────────────────────────────────────────────────────────
  {
    slug: "samsung-990-pro-1tb",
    name: "Samsung 990 Pro 1TB NVMe SSD",
    brand: "Samsung",
    categorySlug: "ssd",
    model: "MZ-V9P1T0BW",
    description: "PCIe 4.0 NVMe SSD with up to 7450MB/s read speeds, built for high-end gaming and content creation.",
    specifications: { Capacity: "1TB", Interface: "PCIe 4.0 x4 NVMe", "Read Speed": "7450 MB/s", "Write Speed": "6900 MB/s" },
    imageUrl: "https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=600",
    basePrice: 11500,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "wd-black-sn850x-2tb",
    name: "WD Black SN850X 2TB NVMe SSD",
    brand: "Western Digital",
    categorySlug: "ssd",
    model: "WDS200T2X0E",
    description: "Gaming-focused PCIe 4.0 NVMe SSD with up to 7300MB/s read speeds and optional heatsink variant.",
    specifications: { Capacity: "2TB", Interface: "PCIe 4.0 x4 NVMe", "Read Speed": "7300 MB/s", "Write Speed": "6600 MB/s" },
    imageUrl: "https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=600",
    basePrice: 18500,
    retailers: MOST_RETAILERS,
  },
  {
    slug: "seagate-barracuda-2tb",
    name: "Seagate Barracuda 2TB HDD",
    brand: "Seagate",
    categorySlug: "hdd",
    model: "ST2000DM008",
    description: "3.5-inch 7200RPM desktop hard drive for bulk storage.",
    specifications: { Capacity: "2TB", Interface: "SATA III", "Form Factor": "3.5-inch", RPM: "7200" },
    imageUrl: "https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=600",
    basePrice: 6200,
    retailers: FEW_RETAILERS,
  },

  // ── Motherboard / PSU / Case / Cooler ─────────────────────────────
  {
    slug: "asus-rog-strix-b760-f-gaming-wifi",
    name: "ASUS ROG Strix B760-F Gaming WiFi",
    brand: "ASUS",
    categorySlug: "motherboard",
    model: "ROG STRIX B760-F GAMING WIFI",
    description: "ATX LGA1700 motherboard with WiFi 6E, PCIe 5.0 support, and robust power delivery for 14th Gen CPUs.",
    specifications: { Socket: "LGA1700", "Form Factor": "ATX", Chipset: "B760", Memory: "DDR5, up to 7200MHz(OC)" },
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    basePrice: 24500,
    retailers: MOST_RETAILERS,
  },
  {
    slug: "corsair-rm850x-850w",
    name: "Corsair RM850x 850W 80+ Gold",
    brand: "Corsair",
    categorySlug: "power-supply",
    model: "CP-9020200-NA",
    description: "Fully modular 80+ Gold PSU with a fluid-dynamic bearing fan for near-silent operation.",
    specifications: { Wattage: "850W", Efficiency: "80+ Gold", Modular: "Fully Modular", "Fan Bearing": "FDB" },
    imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600",
    basePrice: 15500,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "nzxt-h510-flow",
    name: "NZXT H510 Flow",
    brand: "NZXT",
    categorySlug: "pc-case",
    model: "CC-H51FB-01",
    description: "Compact ATX mid-tower with a mesh front panel for improved airflow and clean cable management.",
    specifications: { "Form Factor": "ATX Mid Tower", "Motherboard Support": "ATX, mATX, Mini-ITX", "Front Panel": "Mesh" },
    imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600",
    basePrice: 9500,
    retailers: FEW_RETAILERS,
  },
  {
    slug: "deepcool-ak620",
    name: "Deepcool AK620",
    brand: "Deepcool",
    categorySlug: "cpu-cooler",
    model: "R-AK620-BKNNMT-G",
    description: "Dual-tower air cooler with twin 120mm fans, capable of handling high-TDP CPUs.",
    specifications: { Type: "Dual-Tower Air Cooler", "Fan Size": "2x 120mm", "TDP Rating": "260W" },
    imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600",
    basePrice: 5800,
    retailers: MOST_RETAILERS,
  },

  // ── Laptops ────────────────────────────────────────────────────────
  {
    slug: "asus-rog-strix-g16",
    name: "ASUS ROG Strix G16",
    brand: "ASUS",
    categorySlug: "laptop",
    model: "G614JV-N4127W",
    description: "16-inch gaming laptop with Core i7-13650HX, RTX 4060, and a 165Hz QHD display.",
    specifications: { CPU: "Intel Core i7-13650HX", GPU: "RTX 4060 8GB", RAM: "16GB DDR5", Storage: "512GB NVMe SSD", Display: "16-inch QHD 165Hz" },
    imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600",
    basePrice: 168000,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "lenovo-legion-5-pro",
    name: "Lenovo Legion 5 Pro",
    brand: "Lenovo",
    categorySlug: "laptop",
    model: "82RF00EFIN",
    description: "16-inch gaming laptop with Ryzen 7 7745HX, RTX 4060, and a 16:10 QHD 165Hz panel.",
    specifications: { CPU: "AMD Ryzen 7 7745HX", GPU: "RTX 4060 8GB", RAM: "16GB DDR5", Storage: "1TB NVMe SSD", Display: "16-inch QHD 165Hz" },
    imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600",
    basePrice: 175000,
    retailers: MOST_RETAILERS,
  },

  // ── Monitors ───────────────────────────────────────────────────────
  {
    slug: "samsung-odyssey-g5-27",
    name: "Samsung Odyssey G5 27-inch 165Hz",
    brand: "Samsung",
    categorySlug: "monitor",
    model: "LS27CG512EWXXL",
    description: "27-inch curved QHD gaming monitor with 165Hz refresh rate and 1ms response time.",
    specifications: { "Screen Size": "27-inch", Resolution: "2560x1440", "Refresh Rate": "165Hz", "Panel Type": "VA", "Response Time": "1ms" },
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
    basePrice: 28500,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "lg-ultragear-27gp850",
    name: "LG UltraGear 27GP850-B 27-inch QHD 165Hz",
    brand: "LG",
    categorySlug: "monitor",
    model: "27GP850-B",
    description: "27-inch flat Nano IPS QHD monitor with 165Hz (OC 180Hz) refresh and 1ms GtG response.",
    specifications: { "Screen Size": "27-inch", Resolution: "2560x1440", "Refresh Rate": "165Hz (OC 180Hz)", "Panel Type": "Nano IPS", "Response Time": "1ms" },
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
    basePrice: 34500,
    retailers: MOST_RETAILERS,
  },

  // ── Keyboards / Mice / Headphones / Networking ───────────────────
  {
    slug: "keychron-k8-pro",
    name: "Keychron K8 Pro Mechanical Keyboard",
    brand: "Keychron",
    categorySlug: "keyboard",
    model: "K8 Pro",
    description: "Hot-swappable wireless mechanical keyboard with QMK/VIA support, tenkeyless layout.",
    specifications: { Layout: "TKL (87-key)", Connectivity: "Bluetooth 5.1 / USB-C", "Switch Type": "Hot-swappable Gateron", Backlight: "RGB" },
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    basePrice: 12500,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "redragon-kumara-k552",
    name: "Redragon Kumara K552 Mechanical Keyboard",
    brand: "Redragon",
    categorySlug: "keyboard",
    model: "K552",
    description: "Budget-friendly compact mechanical keyboard with outemu blue switches and RGB backlight.",
    specifications: { Layout: "TKL (87-key)", Connectivity: "Wired USB", "Switch Type": "Outemu Blue", Backlight: "RGB" },
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    basePrice: 3200,
    retailers: MOST_RETAILERS,
  },
  {
    slug: "logitech-g-pro-x-superlight-2",
    name: "Logitech G Pro X Superlight 2",
    brand: "Logitech",
    categorySlug: "mouse",
    model: "910-006632",
    description: "Ultra-lightweight wireless gaming mouse (60g) with HERO 2 sensor, used widely by esports pros.",
    specifications: { Weight: "60g", Sensor: "HERO 2", DPI: "up to 32000", Connectivity: "Lightspeed Wireless" },
    imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600",
    basePrice: 16500,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "razer-deathadder-v3",
    name: "Razer DeathAdder V3",
    brand: "Razer",
    categorySlug: "mouse",
    model: "RZ01-04640100-R3U1",
    description: "Ergonomic wired gaming mouse with Focus Pro 30K sensor and an ultra-light 59g shell.",
    specifications: { Weight: "59g", Sensor: "Focus Pro 30K", DPI: "up to 30000", Connectivity: "Wired" },
    imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600",
    basePrice: 7200,
    retailers: MOST_RETAILERS,
  },
  {
    slug: "hyperx-cloud-ii",
    name: "HyperX Cloud II Gaming Headset",
    brand: "HyperX",
    categorySlug: "headphone",
    model: "KHX-HSCP-RD",
    description: "Wired gaming headset with virtual 7.1 surround sound and a detachable noise-cancelling mic.",
    specifications: { "Driver Size": "53mm", Connectivity: "USB / 3.5mm", Surround: "Virtual 7.1", Microphone: "Detachable" },
    imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600",
    basePrice: 8500,
    retailers: ALL_RETAILERS,
  },
  {
    slug: "tp-link-archer-ax55",
    name: "TP-Link Archer AX55 AX3000 WiFi 6 Router",
    brand: "TP-Link",
    categorySlug: "router",
    model: "Archer AX55",
    description: "Dual-band WiFi 6 router with OFDMA and MU-MIMO for improved multi-device performance.",
    specifications: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX3000", Bands: "Dual-band", Ports: "4x Gigabit LAN" },
    imageUrl: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=600",
    basePrice: 6500,
    retailers: MOST_RETAILERS,
  },
];
