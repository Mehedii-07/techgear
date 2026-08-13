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
