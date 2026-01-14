# Travel Destination Web Application

## German University in Cairo (GUC)
**Faculty of Media Engineering and Technology**  
**CSEN503 – Introduction to Communication Networks**  
**Winter Term 2025**

---

## 📌 Project Overview
This project is a client/server-based web application developed as part of the CSEN503 course.  
The application represents a simple travelling website that allows users to explore destinations, create accounts, manage a personal *Want-to-Go* list, and search for destinations.

The application is hosted locally using **Node.js** and **Express**, with **MongoDB** used for data persistence.

---

## 🎯 Objectives
- Understand client/server architecture
- Develop a full-stack web application
- Handle user authentication and sessions
- Integrate a NoSQL database (MongoDB)
- Implement dynamic views using EJS

---

## 🧩 Features

### 🔐 User Authentication
- User registration with username and password
- Login validation using MongoDB
- Error handling for invalid credentials or empty fields

### 🏠 Home Page
- Displays destination categories (Beaches, Mountains, Cities, etc.)
- Navigation to category pages
- Access to the user's Want-to-Go list

### 🗂 Category Pages
- Displays all destinations under a specific category
- Each destination links to its detailed page

### 🌍 Destination Pages
- Description of the destination
- Embedded streaming video (external link)
- “Add to Want-to-Go List” functionality
- Duplicate prevention with error message

### ❤️ Want-to-Go List
- Displays destinations added by the logged-in user
- Stored and retrieved from MongoDB

### 🔎 Search Functionality
- Available on all pages except login and registration
- Searches destination names using substring matching
- Displays clickable search results
- Handles “Destination Not Found” cases

### 👥 Multiple Users & Sessions
- Session handling using `express-session`
- Prevents unauthorized page access
- Supports multiple users on different browsers

---

## 🛠 Technologies Used
- **Node.js**
- **Express.js**
- **MongoDB** (Database: `myDB`, Collection: `myCollection`)
- **Embedded JavaScript (EJS)**
- **Express-Session**
- **HTML / CSS**
- **Visual Studio Code**

> ⚠️ Note: Mongoose and React were **not used**, as per course requirements.

---

## 📁 Project Structure
