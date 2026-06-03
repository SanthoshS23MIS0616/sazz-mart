export type Role = "admin" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = Omit<User, "passwordHash">;

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  image: string;
  tags: string[];
  createdAt: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type OrderStatus = "placed" | "packed" | "shipped" | "delivered" | "cancelled";

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  address: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
};
