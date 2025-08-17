# Impact Leave - Full-Stack Leave Management System

A complete, enterprise-ready web application designed to streamline the process of requesting, tracking, and managing employee leave with a hierarchical approval workflow.

## Key Features

- **Advanced Role-Based Access Control:** A four-tier role system with a clear chain of command:
  - **User:** The standard employee role.
  - **Supervisor:** A manager who can perform a first-level review of their assigned users' leave requests.
  - **Admin:** An HR administrator who can manage users, holidays, and give final approval on leave that has been reviewed by a supervisor.
  - **Super Admin:** The ultimate authority with all admin privileges, plus the ability to approve leave for anyone, including other admins.
- **Two-Step Leave Approval Workflow:**
  1.  A user's request is first sent to their assigned **Supervisor**.
  2.  The supervisor gives a recommendation (approve/decline) and escalates it.
  3.  An **Admin** or **Super Admin** gives the final, binding decision.
- **Comprehensive User Management:** Admins can create, edit, and delete users. New users are onboarded via a secure "welcome email" where they set their own password.
- **Public Holiday System:** Admins can add and manage public holidays. The system automatically excludes holidays and weekends when calculating leave durations.
- **Automated Email Notifications:** A robust notification system powered by SendGrid for all key events (new requests, supervisor actions, final decisions).
- **Advanced Admin Reporting & Filtering:**
  - An interactive dashboard with key statistics.
  - A dedicated user management hub with links to a user table and a leave summary report.
  - Powerful client-side filtering on all management pages by name, status, and date.
- **Secure Authentication:** Full JWT-based authentication flow, including signup with OTP verification and a secure, token-based password reset process.
- **Enhanced Security:** Hardened with security best practices, including `helmet` for secure headers, `rate-limiting` to prevent brute-force attacks, and `express-validator` for robust backend validation.

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, SendGrid, Bcrypt.js, Jest
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, React Query, Axios, Zod, `react-day-picker`
- **E2E Testing:** Playwright

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally
- A SendGrid account with an API key and a verified sender email.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bellosahmed/impact_leave.git
    cd impact_leave
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    ```
    - Fill in your credentials in the newly created `.env` file.

3.  **Setup Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

Run each server in a separate terminal.

1.  **Start Backend:** From the `/backend` directory, run `npm run dev`.
2.  **Start Frontend:** From the `/frontend` directory, run `npm run dev`.

The application will be available at `http://localhost:5173`.

### Creating a Super Admin

After signing up for a new account, manually connect to your MongoDB database and change that user's `role` field from `"user"` to `"superadmin"`.

## Environment Variables

The backend requires a `.env` file with the following variables:

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `PORT`             | Port for the backend server (e.g., `3000`).       |
| `MONGO_URL`        | Your MongoDB connection string.                   |
| `JWT_SECRET`       | A long, random, secure string for signing JWTs.   |
| `JWT_EXPIRES_IN`   | Expiration time for JWTs (e.g., `90d`).           |
| `SENDGRID_API_KEY` | Your API key from SendGrid.                       |
| `AUTH_EMAIL`       | Your verified sender email address from SendGrid. |