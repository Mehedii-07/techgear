# TechGear E-Commerce Platform

TechGear is a modern, enterprise-grade e-commerce web application built using **Angular** for the frontend and **FastAPI** for the backend. It offers a complete shopping experience, from browsing products and managing carts to a full-featured admin dashboard for managing users, products, and order shipments.

## 📁 Project Structure

The repository is divided into two main components: `backend` and `frontend`.

### Backend (`/backend`)
The backend is a RESTful API built with Python, FastAPI, and SQLAlchemy. It uses Alembic for database migrations and SQLite/PostgreSQL for data storage.

* `main.py`: The entry point for the FastAPI application. It defines all the API routes (endpoints) for users, products, orders, categories, and authentication.
* `models.py`: Defines the SQLAlchemy ORM database models (User, Product, Order, Address, Category, etc.). These models represent the tables in the database.
* `schemas.py`: Contains the Pydantic models used for data validation, serialization, and type checking for incoming requests and outgoing responses.
* `auth.py`: Handles JWT token generation, password hashing (bcrypt), and authentication dependencies (e.g., verifying if a user is an admin).
* `database.py`: Configures the database connection and the SQLAlchemy `SessionLocal`.
* `alembic/`: Contains the database migration scripts used to update the database schema over time.

### Frontend (`/frontend`)
The frontend is a single-page application (SPA) built with Angular and SCSS. 

* `src/app/core/`: Contains application-wide services (AuthService, CartService) and guards (AuthGuard, AdminGuard) that manage state and restrict access to certain routes.
* `src/app/shared/components/`: Reusable UI components like the `Navbar` (which handles global navigation and search) and `ProductCard`.
* `src/app/pages/`: Contains the main views of the application:
  * `catalog/`: The home page displaying all products.
  * `product-details/`: The detailed view for a single product with reviews.
  * `cart/` & `checkout/`: Handles the shopping cart and order placement workflows (including multiple shipping addresses).
  * `account/`: The user dashboard where customers can manage their profile, view past orders, track shipments, and request refunds.
  * `admin/dashboard/`: A protected area for administrators to view analytics, manage products, toggle user roles/bans, and process order shipments and refunds.
* `src/app/app.routes.ts`: Defines the application's routing logic, mapping URLs to their respective components.

## 🚀 How It Works (Overview)

1. **Authentication & Authorization**: Users can register and log in. The backend issues a JWT (JSON Web Token) which the frontend stores in `localStorage`. For every protected request (like placing an order or viewing the admin dashboard), the frontend attaches this token. The backend `auth.py` validates it and determines the user's role (`customer` or `admin`).
2. **Shopping Flow**: Visitors can browse products fetched from the backend. They can add items to their local Cart (managed by `CartService`). Upon checkout, they can select a saved address or enter a new one. The frontend sends the order payload to the `/checkout` endpoint, which validates stock, deducts inventory, and creates the order in the database.
3. **Order Management & Tracking**: 
   * **Users** can view their orders, check delivery tracking information, cancel pending orders, or request a refund for delivered items via their Account page.
   * **Admins** have access to the Dashboard where they can view overall sales metrics, add tracking numbers to orders, change order statuses (e.g., Pending -> Shipped), and process refund requests.
4. **Database & Migrations**: Any changes to the database structure (like adding a `refund_status` column) are managed by Alembic. This ensures the database schema stays in sync with the SQLAlchemy `models.py`.

## 🛠️ Running the Project Locally

### Backend
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt` (or via `uv`).
3. Run the migrations: `alembic upgrade head`.
4. Start the server: `uvicorn main:app --reload`. (Runs on port 8000).

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the Angular development server: `npm start` or `ng serve`. (Runs on port 4200).
4. Open your browser and go to `http://localhost:4200`.