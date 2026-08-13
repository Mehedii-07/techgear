export interface User {
  id: number;
  email: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  image_url?: string;
  category_id?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  text?: string;
  created_at: string;
}
