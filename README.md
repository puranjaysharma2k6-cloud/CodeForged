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

## Local Setup

### Prerequisites

- Git
- Docker and Docker Compose
- Node.js and npm

### 1. Clone the repository with Judge0

Judge0 is included as a Git submodule. Clone recursively so its files are checked out too:

```bash
git clone --recurse-submodules <repository-url>
cd CodeForged
```

If you already cloned without submodules, initialize them from the project root:

```bash
git submodule update --init --recursive
```

### 2. Configure the application

Create a `.env` file in the project root and set `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CALLBACK_SECRET`, and `BACKEND_URL`.

In `judge0/judge0.conf`, set `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, and `REDIS_PASSWORD`. Keep the Judge0 database credentials the same after startup because they must match the credentials stored in its persistent database volume. Do not commit secrets.

### 3. Start the backend and Judge0

From the project root:

```bash
docker compose -p codeforged up -d --build
docker compose -p codeforged -f judge0/docker-compose.yml up -d
```

Both Compose stacks use the `codeforged` project name so the backend can reach Judge0 at `http://server:2358`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite.

On backend startup, Codeforged seeds three contests, six problems with test cases, and four demo users. All demo accounts use the password `codeforged-demo`:

- `alina_codes` (`alina@example.test`)
- `byte_ninja` (`kabir@example.test`)
- `graph_guru` (`mira@example.test`)
- `loopster` (`dev@example.test`)

