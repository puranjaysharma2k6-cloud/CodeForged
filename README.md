## Codeforged

# About Codeforged

Codeforged is a competitive programming platform featuring sandboxed code execution, real-time verdict updates, and a live leaderboard.

- **Real-time verdicts:** Uses WebSockets instead of polling to fetch submission verdicts from DB ( multiple queries increases API requests unnecessarry overhead), reducing repeated requests and unnecessary network traffic.
- **Sandboxed execution:** Runs untrusted submissions in isolated environments to reduce the risk of submitted code affecting the application or host system.
- **Redis-powered leaderboard:** Uses Redis, an in-memory data store, to serve frequently accessed leaderboard data with low latency, avoiding repeated expensive database queries and sorting operations.
- **Redis Streams:** Distributes verdict events across multiple server instances. Unlike Redis Pub/Sub's fire-and-forget delivery, Streams retain messages for consumers to read and process, supporting more reliable event handling.
- **Paginated leaderboard:** Uses `LIMIT` and `OFFSET` to fetch only the requested leaderboard entries instead of loading the entire dataset, reducing unnecessary data transfer and application memory usage.
- **Real-time rankings:** Reflects score changes as submissions are evaluated, keeping leaderboard rankings responsive to ongoing contest activity.
- **Database scalability:** Frequent score updates and rating recalculations can increase PostgreSQL write load through row updates, index maintenance, and transaction contention. Serving leaderboard reads from Redis reduces pressure on PostgreSQL, allowing it to focus on persistent application data and writes.

PostgreSQL remains the persistent database, while Redis handles performance-sensitive leaderboard operations and event distribution.

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

