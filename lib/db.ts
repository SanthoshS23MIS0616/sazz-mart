import { MongoClient, ObjectId } from "mongodb";
import type { CartItem, Order, OrderStatus, Product, User } from "@/types/commerce";
import { demoProducts, demoUsers } from "./seed";

type Collections = {
  users: User[];
  products: Product[];
  orders: Order[];
};

const memory: Collections = {
  users: [],
  products: [],
  orders: []
};

let seeded = false;
let clientPromise: Promise<MongoClient> | null = null;

function id() {
  return new ObjectId().toString();
}

async function ensureMemorySeeded() {
  if (seeded) return;
  memory.products = demoProducts.map((product) => ({ ...product }));
  memory.users = await demoUsers();
  seeded = true;
}

async function client() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

async function collections() {
  const connectedClient = await client();
  if (!connectedClient) return null;
  const database = connectedClient.db(process.env.MONGODB_DB || "luna_mart");
  return {
    users: database.collection<User>("users"),
    products: database.collection<Product>("products"),
    orders: database.collection<Order>("orders")
  };
}

export async function seedDatabase() {
  await ensureMemorySeeded();
  const db = await collections();
  if (!db) {
    return { mode: "demo-memory", products: memory.products.length, users: memory.users.length };
  }

  if ((await db.products.countDocuments()) === 0) {
    await db.products.insertMany(demoProducts);
  }
  if ((await db.users.countDocuments()) === 0) {
    await db.users.insertMany(await demoUsers());
  }
  return { mode: "mongodb", products: await db.products.countDocuments(), users: await db.users.countDocuments() };
}

export async function listProducts(query?: string, category?: string) {
  await seedDatabase();
  const db = await collections();
  const matcher = (product: Product) => {
    const text = `${product.name} ${product.description} ${product.category} ${product.tags.join(" ")}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (!category || category === "All" || product.category === category);
  };
  if (!db) return memory.products.filter(matcher);

  const filter: Record<string, unknown> = {};
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } }
    ];
  }
  if (category && category !== "All") filter.category = category;
  return db.products.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function findProduct(productId: string) {
  await seedDatabase();
  const db = await collections();
  if (!db) return memory.products.find((product) => product.id === productId) || null;
  return db.products.findOne({ id: productId });
}

export async function createProduct(input: Omit<Product, "id" | "createdAt">) {
  await seedDatabase();
  const product: Product = { ...input, id: id(), createdAt: new Date().toISOString() };
  const db = await collections();
  if (!db) {
    memory.products.unshift(product);
    return product;
  }
  await db.products.insertOne(product);
  return product;
}

export async function updateProduct(productId: string, input: Partial<Omit<Product, "id" | "createdAt">>) {
  await seedDatabase();
  const updates = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<Omit<Product, "id" | "createdAt">>;
  const db = await collections();
  if (!db) {
    const index = memory.products.findIndex((product) => product.id === productId);
    if (index === -1) return null;
    memory.products[index] = { ...memory.products[index], ...updates };
    return memory.products[index];
  }
  await db.products.updateOne({ id: productId }, { $set: updates });
  return db.products.findOne({ id: productId });
}

export async function deleteProduct(productId: string) {
  await seedDatabase();
  const db = await collections();
  if (!db) {
    const before = memory.products.length;
    memory.products = memory.products.filter((product) => product.id !== productId);
    return before !== memory.products.length;
  }
  const result = await db.products.deleteOne({ id: productId });
  return result.deletedCount > 0;
}

export async function findUserByEmail(email: string) {
  await seedDatabase();
  const db = await collections();
  if (!db) return memory.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
  return db.users.findOne({ email: email.toLowerCase() });
}

export async function createUser(input: Pick<User, "name" | "email" | "passwordHash"> & { role?: "user" | "admin" }) {
  await seedDatabase();
  const user: User = {
    id: id(),
    name: input.name,
    email: input.email.toLowerCase(),
    role: input.role || "user",
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString()
  };
  const db = await collections();
  if (!db) {
    memory.users.push(user);
    return user;
  }
  await db.users.insertOne(user);
  return user;
}

export async function createOrder(input: {
  userId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  address: string;
  paymentMethod: string;
}) {
  await seedDatabase();
  const products = await listProducts();
  const orderItems = input.items
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return null;
      const quantity = Math.max(1, Math.min(item.quantity, product.stock));
      return { product, quantity };
    })
    .filter(Boolean) as Array<{ product: Product; quantity: number }>;

  if (orderItems.length === 0) throw new Error("Cart is empty");
  const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal > 3999 ? 0 : 149;
  const now = new Date().toISOString();
  const order: Order = {
    id: id(),
    userId: input.userId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    items: orderItems.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image
    })),
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: "placed",
    address: input.address,
    paymentMethod: input.paymentMethod,
    createdAt: now,
    updatedAt: now
  };

  const db = await collections();
  if (!db) {
    memory.orders.unshift(order);
    orderItems.forEach(({ product, quantity }) => {
      const target = memory.products.find((candidate) => candidate.id === product.id);
      if (target) target.stock = Math.max(0, target.stock - quantity);
    });
    return order;
  }

  await db.orders.insertOne(order);
  await Promise.all(orderItems.map(({ product, quantity }) => db.products.updateOne({ id: product.id }, { $inc: { stock: -quantity } })));
  return order;
}

export async function listOrders(userId?: string) {
  await seedDatabase();
  const db = await collections();
  const withLiveStatus = (order: Order) => ({ ...order, status: liveStatus(order) });
  if (!db) return memory.orders.filter((order) => !userId || order.userId === userId).map(withLiveStatus);
  const filter = userId ? { userId } : {};
  const orders = await db.orders.find(filter).sort({ createdAt: -1 }).toArray();
  return orders.map(withLiveStatus);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await seedDatabase();
  const db = await collections();
  const updatedAt = new Date().toISOString();
  if (!db) {
    const order = memory.orders.find((candidate) => candidate.id === orderId);
    if (!order) return null;
    order.status = status;
    order.updatedAt = updatedAt;
    return order;
  }
  await db.orders.updateOne({ id: orderId }, { $set: { status, updatedAt } });
  return db.orders.findOne({ id: orderId });
}

function liveStatus(order: Order): OrderStatus {
  if (order.status === "cancelled" || order.status === "delivered") return order.status;
  const ageMinutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  if (ageMinutes > 15) return "delivered";
  if (ageMinutes > 9) return "shipped";
  if (ageMinutes > 4) return "packed";
  return order.status;
}
