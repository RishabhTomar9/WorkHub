# Worker Management System

A full-stack web application for managing workers, their attendance, and payments.

## Features

*   **Worker Management:** Add, edit, and view worker information.
*   **Attendance Tracking:** Record and monitor worker attendance.
*   **Payment Processing:** Manage and process payments for workers.
*   **Site Management:** Organize and oversee different work sites.
*   **Authentication:** Secure user authentication using Firebase.

## Technologies Used

### Frontend

*   **Framework:** React
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **Routing:** React Router
*   **API Communication:** Axios

### Backend

*   **Framework:** Express.js
*   **Database:** MongoDB (with Mongoose)
*   **Authentication:** Firebase Admin SDK
*   **API Development:** RESTful API

## Getting Started

### Prerequisites

*   Node.js and npm (or yarn) installed.
*   MongoDB instance running.
*   Firebase project set up with authentication enabled.

### Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/RishabhTomar9/WorkHub
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```
    - Create a `.env` file in the `backend` directory and add the necessary environment variables (e.g., `MONGO_URI`, `FIREBASE_CONFIG`).

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    ```
    - Create a `.env` file in the `frontend` directory and add your Firebase configuration.

### Running the Application

1.  **Start the backend server:**
    ```bash
    cd backend
    npm run dev
    ```

2.  **Start the frontend development server:**
    ```bash
    cd frontend
    npm run dev
    ```

## Folder Structure

### Backend

```
d:\Work Hub\backend
├───.env
├───.gitignore
├───package-lock.json
├───package.json
├───node_modules
└───src
    ├───index.js
    ├───config
    │   └───db.js
    ├───controllers
    │   ├───attendanceController.js
    │   ├───paymentController.js
    │   ├───siteController.js
    │   └───workerController.js
    ├───middleware
    │   ├───auth.js
    │   ├───errorHandler.js
    │   └───firebaseAuth.js
    ├───models
    │   ├───Attendance.js
    │   ├───Payment.js
    │   ├───Site.js
    │   └───Worker.js
    ├───routes
    │   ├───attendance.js
    │   ├───payments.js
    │   ├───payouts.js
    │   ├───sites.js
    │   └───workers.js
    └───utils
        ├───calculations.js
        └───csv.js
```

### Frontend

```
d:\Work Hub\frontend
├───.env
├───.gitignore
├───eslint.config.js
├───index.html
├───package-lock.json
├───package.json
├───postcss.config.mjs
├───README.md
├───vercel.json
├───vite.config.js
├───node_modules
├───public
│   ├───index.html
│   └───vite.svg
└───src
    ├───App.jsx
    ├───firebase.js
    ├───index.css
    ├───input.css
    ├───main.jsx
    ├───output.css
    ├───api
    │   ├───api.js
    │   └───attendanceService.js
    ├───components
    │   ├───AttendanceModal.jsx
    │   ├───Footer.jsx
    │   ├───NavBar.jsx
    │   ├───ShareMenu.jsx
    │   └───WorkerRow.jsx
    ├───pages
    │   ├───Attendance.jsx
    │   ├───Dashboard.jsx
    │   ├───Login.jsx
    │   ├───Payouts.jsx
    │   └───SiteView.jsx
    └───utils
        └───payout.js
```

## Project Structure Details

### Backend

*   **`src`**: This directory is the main container for all the source code of the backend application.
*   **`src/config`**: This folder holds configuration files, such as the database connection setup (`db.js`).
*   **`src/controllers`**: This directory contains the controller files that handle the business logic of the application. Each file corresponds to a specific route and manages the request-response cycle.
*   **`src/middleware`**: This folder stores middleware functions that are used to intercept and process incoming requests before they reach the controllers. This includes authentication, error handling, and logging.
*   **`src/models`**: This directory defines the Mongoose schemas and models for the MongoDB database. Each file represents a collection in the database.
*   **`src/routes`**: This folder contains the route definitions for the Express application. Each file maps a specific URL path to a controller function.
*   **`src/utils`**: This directory holds utility functions and helper modules that can be reused across the application, such as calculation and CSV generation.

### Frontend

*   **`public`**: This directory contains static assets that are publicly accessible, such as `index.html` and `vite.svg`.
*   **`src`**: This is the main directory for the frontend application's source code.
*   **`src/api`**: This folder manages all the API requests to the backend. It contains functions for making API calls using Axios.
*   **`src/components`**: This directory stores reusable React components that are used to build the user interface.
*   **`src/pages`**: This folder contains the main page components of the application, which are rendered based on the current route.
*   **`src/utils`**: This directory holds utility functions and helper modules for the frontend, such as payout calculations.