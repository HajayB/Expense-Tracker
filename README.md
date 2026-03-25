                                                Expense Tracker API & Web App
A full-stack expense tracking application built with Node.js, Express, MongoDB, and Vanilla JavaScript, 
featuring authentication, transaction management, and data visualization.

                                                Overview

This project is a complete expense management system that allows users to:

Create an account and securely authenticate
Add, view, and manage financial transactions
Visualize spending patterns using charts

It combines a RESTful backend API with a lightweight frontend interface, focusing on clean architecture and real-world backend practices.

                                                Features
    Authentication & Security
User registration and login
Password hashing using bcrypt
Secure authentication using JWT (JSON Web Tokens)
Protected routes with middleware
    Expense Management
Add new transactions
View all transactions
Delete transactions
User-specific data handling
    Data Visualization
Expense insights using Chart.js
Visual representation of spending patterns
    Full-Stack Integration
Backend API built with Express
Frontend served using static files
Seamless interaction between client and server

                                                Tech Stack
      Backend
Node.js
Express.js
MongoDB (Mongoose)
JWT Authentication
bcrypt
      Frontend
HTML
CSS
Vanilla JavaScript
Chart.js

                                              Project Structure
Expense-Tracker/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # Authentication middleware
├── routes/
│   ├── userRoutes.js
│   └── transactionRoutes.js
├── public/                # Frontend (HTML, CSS, JS)
├── app.js                 # Main server entry point
├── trans.js               # Transaction logic/helpers
├── .env                   # Environment variables
└── package.json

                                              Getting Started
Prerequisites
Node.js installed
MongoDB running locally or via cloud (e.g., Atlas)

Installation
git clone https://github.com/HajayB/Expense-Tracker.git
cd Expense-Tracker
npm install

Environment Variables
Create a .env file in the root directory and add:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

    Run the App
npm start
Then open:
http://localhost:5000


    API Endpoints
Auth Routes
Method	        Endpoint	                Description
POST	          /api/users/signup	        Register user
POST	          /api/users/login	         Login user

Transactions
Method	            Endpoint	                Description
GET	                /api/transactions	        Get user transactions
GET                 /api/transactions/:id     Get single transaction
POST	              /api/transactions	        Add transaction
PUT                 /api/transactions/:id     Edit transaction
DELETE	            /api/transactions/:id	    Delete transaction

    Key Highlights
Clean separation of concerns (routes, middleware, config)
Real-world authentication flow (JWT + protected routes)
Integration of backend + frontend without frameworks
Data visualization using Chart.js
MongoDB-based persistent storage


    Future Improvements
Expense categories (e.g., food, transport, bills)
Budget limits & alerts
Pagination for large datasets


      Author
Basit Adeola Ajayi
GitHub: https://github.com/HajayB
