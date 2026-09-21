import {
  Laptop,
  Monitor,
  Cpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  Plug,
  Box,
  Fan,
  Keyboard,
  Mouse,
  Headphones,
  Camera,
  Mic,
  Speaker,
  Router,
  Wifi,
  Gamepad2,
  Package,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Laptop,
  Monitor,
  Cpu,
  Gpu: Cpu, // lucide has no dedicated GPU glyph; Cpu reads clearly for graphics cards too
  CircuitBoard,
  MemoryStick,
  HardDrive,
  Plug,
  Box,
  Fan,
  Keyboard,
  Mouse,
  Headphones,
  Camera,
  Mic,
  Speaker,
  Router,
  Wifi,
  Gamepad2,
  Package,
};

export function CategoryIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && ICONS[name]) || Package;
  return <Icon className={className} />;
}
