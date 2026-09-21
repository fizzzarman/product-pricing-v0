export interface CategoryNode {
  name: string;
  nameBn: string;
  slug: string;
  iconName?: string;
  children?: CategoryNode[];
}

/**
 * Hierarchical category tree (spec §4, §18). Only leaf categories hold
 * products; parent categories exist for navigation/grouping.
 */
export const CATEGORY_TREE: CategoryNode[] = [
  {
    name: "Computer",
    nameBn: "কম্পিউটার",
    slug: "computer",
    children: [
      { name: "Laptop", nameBn: "ল্যাপটপ", slug: "laptop", iconName: "Laptop" },
      { name: "Desktop PC", nameBn: "ডেস্কটপ পিসি", slug: "desktop", iconName: "Monitor" },
      {
        name: "Components",
        nameBn: "কম্পোনেন্টস",
        slug: "components",
        children: [
          { name: "Processor (CPU)", nameBn: "প্রসেসর", slug: "cpu", iconName: "Cpu" },
          { name: "Graphics Card (GPU)", nameBn: "গ্রাফিক্স কার্ড", slug: "gpu", iconName: "Gpu" },
          { name: "Motherboard", nameBn: "মাদারবোর্ড", slug: "motherboard", iconName: "CircuitBoard" },
          { name: "RAM", nameBn: "র‍্যাম", slug: "ram", iconName: "MemoryStick" },
          { name: "SSD", nameBn: "এসএসডি", slug: "ssd", iconName: "HardDrive" },
          { name: "HDD", nameBn: "হার্ড ডিস্ক", slug: "hdd", iconName: "HardDrive" },
          { name: "Power Supply (PSU)", nameBn: "পাওয়ার সাপ্লাই", slug: "power-supply", iconName: "Plug" },
          { name: "PC Case", nameBn: "পিসি কেসিং", slug: "pc-case", iconName: "Box" },
          { name: "CPU Cooler", nameBn: "সিপিইউ কুলার", slug: "cpu-cooler", iconName: "Fan" },
        ],
      },
      { name: "Monitor", nameBn: "মনিটর", slug: "monitor", iconName: "Monitor" },
      {
        name: "Accessories",
        nameBn: "এক্সেসরিজ",
        slug: "accessories",
        children: [
          { name: "Keyboard", nameBn: "কীবোর্ড", slug: "keyboard", iconName: "Keyboard" },
          { name: "Mouse", nameBn: "মাউস", slug: "mouse", iconName: "Mouse" },
          { name: "Headphone", nameBn: "হেডফোন", slug: "headphone", iconName: "Headphones" },
          { name: "Webcam", nameBn: "ওয়েবক্যাম", slug: "webcam", iconName: "Camera" },
          { name: "Microphone", nameBn: "মাইক্রোফোন", slug: "microphone", iconName: "Mic" },
          { name: "Speakers", nameBn: "স্পিকার", slug: "speakers", iconName: "Speaker" },
          { name: "Router", nameBn: "রাউটার", slug: "router", iconName: "Router" },
          { name: "Wi-Fi Adapter", nameBn: "ওয়াই-ফাই অ্যাডাপ্টার", slug: "wifi-adapter", iconName: "Wifi" },
          { name: "Gaming Accessories", nameBn: "গেমিং এক্সেসরিজ", slug: "gaming-accessories", iconName: "Gamepad2" },
        ],
      },
      { name: "Other Hardware", nameBn: "অন্যান্য হার্ডওয়্যার", slug: "other-hardware", iconName: "Package" },
    ],
  },
];

export function flattenCategories(
  nodes: CategoryNode[],
  parentSlug: string | null = null
): Array<CategoryNode & { parentSlug: string | null }> {
  return nodes.flatMap((node) => [
    { ...node, parentSlug },
    ...(node.children ? flattenCategories(node.children, node.slug) : []),
  ]);
}
