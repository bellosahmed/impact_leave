# Impact Leave - Full-Stack Leave Management System

A complete, feature-rich web application designed to streamline the process of requesting, tracking, and managing employee leave. This system is built with a modern technology stack, featuring a secure REST API backend and a responsive, interactive React frontend.

## Key Features

- **Role-Based Access Control:** Three distinct user roles with a clear hierarchy:
  - **User:** Can apply for leave, view their leave history, and cancel pending requests.
  - **Admin:** Can manage public holidays, view all leave requests, and generate reports.
  - **Super Admin:** Has all admin privileges and is the only role authorized to approve or decline leave requests, including those from other admins.
- **Leave Request Workflow:** Users can submit leave requests with specific start/end dates and a reason.
- **Approval System with Comments:** Super admins can approve or decline leave requests and provide an optional comment, which is sent to the user.
- **Public Holiday System:** Admins can add and manage public holidays. The system automatically excludes holidays and weekends when calculating the duration of a leave request.
- **Automated Email Notifications:** A robust notification system powered by SendGrid:
  - Users are notified when their leave is approved or declined.
  - Admins and Super Admins are notified when a new leave request is submitted.
- **Admin Reporting:**
  - A dashboard with key statistics (total users, pending/approved requests, etc.).
  - A detailed report of all users, their remaining leave balances, and total days taken.
  - The ability to drill down to view the complete leave history for any specific user.
- **Secure Authentication:** Full JWT-based authentication flow, including signup with OTP email verification, login, and a secure password reset process.
- **Interactive UI:** A user-friendly interface with features like a "view password" toggle and expandable text for long leave reasons.

## Tech Stack

### Backend
- **Node.js** with **Express.js** for the REST API
- **MongoDB** with **Mongoose** for the database
- **JSON Web Tokens (JWT)** for secure authentication
- **SendGrid** for transactional email delivery
- **Bcrypt.js** for password hashing
- **Jest** for unit & integration testing

### Frontend
- **React** with **Vite** for a fast development experience
- **TypeScript** for type safety
- **Tailwind CSS** for responsive, utility-first styling
- **React Router** for client-side routing
- **React Query (TanStack Query)** for efficient server state management and data fetching
- **Axios** for making API requests
- **Zod** & **React Hook Form** for robust form validation
- **Vitest** & **React Testing Library** for component testing

### End-to-End Testing
- **Playwright** for automated browser testing of full user flows.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally.
- A [SendGrid](https://sendgrid.com/) account with a generated API key and a verified sender email.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bellosahmed/impact_leave.git
    cd impact_leave
    ```

2.  **Setup the Backend:**
    ```bash
    cd backend
    npm install
    ```
    - Create a `.env` file in the `backend` directory. You can copy the example: `cp .env.example .env`
    - Fill in the required variables in your new `.env` file (`MONGO_URL`, `JWT_SECRET`, `SENDGRID_API_KEY`, `AUTH_EMAIL`).

3.  **Setup the Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```
    - The frontend is configured to proxy API requests to the backend server running on port 3000, so no `.env` file is needed for it to run locally.

### Running the Application

You will need to run two servers concurrently in two separate terminals.

1.  **Start the Backend Server:**
    ```bash
    # From the /backend directory
    npm run dev
    ```
    - The server should be running on `http://localhost:3000`.

2.  **Start the Frontend Server:**
    ```bash
    # From the /frontend directory
    npm run dev
    ```
    - The application will be available at `http://localhost:5173`.

### Creating a Super Admin

After setting up the project, you will need to create a `superadmin` user manually to access the administrative features.
1.  Sign up for a new account through the UI.
2.  Complete the OTP verification process.
3.  Connect to your MongoDB database using a tool like MongoDB Compass.
4.  In the `users` collection, find the user you just created and change their `role` field from `"user"` to `"superadmin"`.


## Environment Variables

The backend requires the following environment variables to be set in a `.env` file:

| Variable                | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `PORT`                  | The port for the backend server to run on (e.g., `3000`).    |
| `MONGO_URL`             | Your MongoDB connection string.                            |
| `JWT_SECRET`            | A long, random, secret string for signing JWTs.            |
| `JWT_EXPIRES_IN`        | The expiration time for JWTs (e.g., `90d`).                |
| `JWT_COOKIE_EXPIRES_IN` | The expiration time for cookies (e.g., `90`).              |
| `SENDGRID_API_KEY`      | Your API key from your SendGrid account.                   |
| `AUTH_EMAIL`            | The email address you have verified as a sender in SendGrid. |