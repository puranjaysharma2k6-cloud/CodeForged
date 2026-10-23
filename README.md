# Codeforged

## Setup and Run Locally

### Prerequisites

- Node.js and npm
- Docker and Docker Compose

### 1. Clone the Repository

Clone the repository and navigate to the project directory.

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=your_database

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CALLBACK_SECRET=your_callback_secret

BACKEND_URL=http://backend:8000
```

Replace the placeholder values with your own credentials and secrets. Do not commit your `.env` file to Git.

Database and Redis URLs are configured directly in Docker Compose using the internal service names `app-db` and `app-redis`.

### 3. Start the Backend and Supporting Services

From the project root, run:

```bash
docker compose -p codeforged up -d
```

### 4. Start Judge0

Navigate to the Judge0 directory:

```bash
cd judge0
docker compose -p codeforged up -d
```

The `-p codeforged` flag gives both Compose stacks the same project name, allowing them to share the default Docker network when neither configuration overrides it.

This allows services to communicate using their service names, such as `backend` and `server`.

### 5. Start the Frontend

Navigate to the frontend directory and install its dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Configure the frontend API base URL to `http://localhost:8000`.

Your local Codeforged instance is now running, and you can start making submissions.

