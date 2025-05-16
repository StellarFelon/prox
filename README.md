# ProxyShield Web Proxy

ProxyShield is a web proxy application built with Node.js, Express, TypeScript, and a React frontend. It uses SQLite as its database via Drizzle ORM and `http-proxy-middleware` to handle proxy requests.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later recommended)
- npm (comes with Node.js) or yarn

## Getting Started

1.  **Clone the repository (if applicable):**
    ```bash
    # If you have a git repository, uncomment and use:
    # git clone <your-repository-url>
    # cd <repository-name>
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of your project. Add the following environment variable:
    ```env
    SESSION_SECRET=your_very_strong_session_secret
    ```
    Replace `your_very_strong_session_secret` with a long, random, and secure string. This is used for securing user sessions.

4.  **Database Setup:**
    This project uses SQLite with Drizzle ORM. To create and apply the database schema, run:
    ```bash
    npm run db:push
    ```
    This command will look at your schema definition (likely in `shared/schema.ts` or similar) and create/update the `db/sqlite.db` file (or as configured in `drizzle.config.ts` and `server/db.ts`).

## Running the Application

### Development Mode
To run the application in development mode with live reloading:
```bash
npm run dev
```
This typically starts the server on port 5000 (or as configured). The frontend (client) and backend (server) will be served, and changes will trigger automatic rebuilds and reloads.

### Production Mode
To build the application for production and run it:
1.  Build the application:
    ```bash
    npm run build
    ```
    This command will compile the TypeScript server code, build the frontend assets, and place them in a `dist` directory.
2.  Start the production server:
    ```bash
    npm run start
    ```

## Key NPM Scripts

-   `npm run dev`: Starts the development server for both backend and frontend with hot reloading.
-   `npm run build`: Builds the frontend and compiles the backend for production.
-   `npm run start`: Starts the production server (after running `npm run build`).
-   `npm run check`: Runs the TypeScript compiler to check for type errors.
-   `npm run db:push`: Applies database migrations using Drizzle Kit to sync your schema with the SQLite database.

## Project Structure (Simplified)

-   `client/`: Contains the frontend React application code.
-   `server/`: Contains the backend Express.js application code.
    -   `index.ts`: Main entry point for the server.
    -   `db.ts`: Database connection and Drizzle ORM setup.
    -   `proxyMiddleware.ts`: Logic for handling and modifying proxy requests.
    -   `routes.ts`: API route definitions.
    -   `storage.ts`: Data access layer interacting with the database.
-   `shared/`: Code shared between the client and server (e.g., Drizzle schema definitions).
-   `db/`: Contains the SQLite database file (e.g., `sqlite.db`).
-   `drizzle.config.ts`: Configuration file for Drizzle Kit.
-   `vite.config.ts`: Configuration for Vite (frontend build tool).
-   `package.json`: Lists project dependencies and scripts.
-   `.env`: (You create this) For environment variables.

## Notes
- The default admin user credentials (if not changed) are typically `admin` / `admin123` as set up during initial database seeding (see `server/routes.ts` `setupDefaultAdmin` function). It is highly recommended to change these in a production environment. 