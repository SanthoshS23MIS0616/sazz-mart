import type { Product, User } from "@/types/commerce";
import { hashPassword } from "./security";

export const demoProducts: Product[] = [
  {
    id: "p-velvet-headphones",
    name: "Aura Velvet Headphones",
    category: "Audio",
    description: "Noise-softening wireless headphones tuned for study, work, and evening playlists.",
    price: 3499,
    stock: 18,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    tags: ["wireless", "comfort", "bestseller"],
    createdAt: new Date().toISOString()
  },
  {
    id: "p-blush-keyboard",
    name: "Blush Flow Keyboard",
    category: "Workspace",
    description: "A compact mechanical keyboard with quiet tactile switches and soft backlighting.",
    price: 4299,
    stock: 12,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
    tags: ["productivity", "desk", "new"],
    createdAt: new Date().toISOString()
  },
  {
    id: "p-lilac-bag",
    name: "Lilac Daily Carry",
    category: "Lifestyle",
    description: "Water-resistant laptop tote with smart pockets for travel, college, and office days.",
    price: 2499,
    stock: 24,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    tags: ["travel", "college", "eco"],
    createdAt: new Date().toISOString()
  },
  {
    id: "p-glow-lamp",
    name: "Moon Glow Desk Lamp",
    category: "Home",
    description: "Dimmable desk lamp with eye-care modes and a sunrise focus timer.",
    price: 1899,
    stock: 30,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    tags: ["focus", "home", "energy-saving"],
    createdAt: new Date().toISOString()
  },
  {
    id: "p-smart-bottle",
    name: "Hydra Smart Bottle",
    category: "Wellness",
    description: "Tracks hydration reminders and keeps drinks cool through long campus or work days.",
    price: 1599,
    stock: 20,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
    tags: ["health", "smart", "daily"],
    createdAt: new Date().toISOString()
  },
  {
    id: "p-violet-watch",
    name: "Violet Pulse Watch",
    category: "Wearables",
    description: "Minimal fitness watch with sleep insights, gentle alarms, and long battery life.",
    price: 5999,
    stock: 9,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    tags: ["fitness", "premium", "tracking"],
    createdAt: new Date().toISOString()
  }
];

export async function demoUsers(): Promise<User[]> {
  return [
    {
      id: "u-admin",
      name: "Admin Manager",
      email: "admin@lunamart.com",
      role: "admin",
      passwordHash: await hashPassword("Admin@123"),
      createdAt: new Date().toISOString()
    },
    {
      id: "u-user",
      name: "Demo Customer",
      email: "user@lunamart.com",
      role: "user",
      passwordHash: await hashPassword("User@123"),
      createdAt: new Date().toISOString()
    }
  ];
}
