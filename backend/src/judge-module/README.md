# Judge Module

Decoupled judging subsystem for the ICPC-style live coding platform.
Built around the Dependency Inversion Principle: high-level orchestration
(`JudgeService`) depends only on interfaces, never on a concrete judge
backend. Swapping vjudge for judge0 (or anything else) later means
writing one new class — nothing else in your root backend changes.

## Layout

```
src/judge/
  types.ts                          domain types (SubmissionRequest, JudgeResult, enums)
  errors.ts                         typed error hierarchy
  config.ts                         env-driven "which provider is active" config

  ports/                            <-- the DIP boundary. Code against these.
    IJudgeProvider.ts                submit() + getVerdict() contract
    IVerdictPublisher.ts             publish() contract (your pubsub/websocket layer implements this)
    IProblemMappingRepository.ts     internal problemId -> external judge's problem code
    ISubmissionQueue.ts              enqueue()/onSubmission() contract — concurrency control in front of JudgeService

  core/
    JudgeService.ts                  orchestrator: validate -> submit -> poll -> publish
    JudgeProviderFactory.ts          registry for selecting/swapping providers at runtime

  providers/                        concrete adapters — only these know about a specific judge
    vjudge/VjudgeProvider.ts          scraper stub, backed by an account pool (submit/login/parse are TODO)
    vjudge/VjudgeAccountPool.ts       manages multiple vjudge bot accounts so submissions can run concurrently
    judge0/Judge0Provider.ts          REST-based skeleton, ready for when you scale up

  queue/                            concrete queue adapters
    InMemoryConcurrencyLimitedQueue.ts  single-process, concurrency-capped FIFO queue
    BullMQSubmissionQueue.ts            Redis-backed skeleton for multi-instance scale

  adapters/                         default dev/test implementations of the non-judge ports
    ConsoleVerdictPublisher.ts        logs verdicts to console
    InMemoryProblemMappingRepository.ts in-memory problem mapping store

example/usage.ts                    composition root — the ONLY file that imports concrete classes
```

## Why it's structured this way

`JudgeService` never imports `VjudgeProvider` or `Judge0Provider`. It only
knows about `IJudgeProvider`. The concrete provider is chosen once, at
the composition root (`example/usage.ts`), and injected into
`JudgeService`'s constructor. Same story for `IVerdictPublisher` (your
pubsub/websocket code) and `IProblemMappingRepository` (your DB).

```
Root backend (routes/controllers)
        |
        v
   JudgeService  ----depends on---->  IJudgeProvider (port)
        |                                   ^
        | depends on                        |
        v                                   |
IVerdictPublisher (port)          VjudgeProvider / Judge0Provider (adapters)
        ^
        |
  your pubsub/websocket class
```

Arrows of dependency point *inward*, toward the abstractions — the
concrete, volatile stuff (a specific judge, a specific pubsub system)
depends on the stable interfaces, never the other way around.

## Adding judge0 when you scale

1. `Judge0Provider` already exists as a working skeleton implementing
   `IJudgeProvider`. Fill in real credentials/URL.
2. In your composition root: `registry.register(new Judge0Provider(...))`.
3. Set `JUDGE_PROVIDER=judge0` in your environment.
4. Done. `JudgeService`, your route handlers, your submission queue —
   none of it changes.

You could even run both simultaneously (e.g. route by problem source)
by giving `JudgeService` whichever provider the registry resolves to
per-request, instead of a single one at construction time.

## Wiring in your real pub/sub + websocket layer

Implement `IVerdictPublisher`:

```ts
class RedisPubSubVerdictPublisher implements IVerdictPublisher {
  async publish(result: JudgeResult) {
    await redis.publish(`submission:${result.submissionId}`, JSON.stringify(result));
  }
}
```

Pass an instance of it into `JudgeService` instead of
`ConsoleVerdictPublisher`. `JudgeService` calls `publish()` on
`IN_QUEUE`, every intermediate non-terminal status (e.g. `RUNNING`),
and the final terminal verdict — your publisher decides what to do
with each.

## Finishing the vjudge stub

`VjudgeProvider` has three TODOs: `ensureLoggedIn()`, `submit()`, and
`getVerdict()`. The `VjudgeHttpClient` interface is intentionally
minimal (`get`/`post`) so you can back it with raw `fetch`, `axios`,
or `puppeteer`/`playwright` for JS-rendered pages — without touching
`VjudgeProvider`'s control flow. The polling shape in `JudgeService`
already matches vjudge's actual submit-then-poll-status-page behavior,
so once the TODOs are filled in, judging should work end-to-end.

## Testing

Every port has a trivial fake already (`ConsoleVerdictPublisher`,
`InMemoryProblemMappingRepository`), and `IJudgeProvider` is easy to
fake in a test:

```ts
class FakeJudgeProvider implements IJudgeProvider {
  name = 'fake';
  supportsLanguage() { return true; }
  async submit() { return 'handle-1'; }
  async getVerdict() {
    return { submissionId: 'handle-1', verdict: VerdictStatus.ACCEPTED, judgedAt: new Date(), providerName: 'fake' };
  }
}
```

This lets you unit-test `JudgeService`'s polling/publishing logic with
zero network calls and zero dependency on vjudge being up.

## Why VjudgeProvider has an account pool

vjudge — and the origin OJ behind it (Codeforces, UVA, etc) — generally
allows one active submission per account at a time. A single vjudge
login gives you roughly "one verdict every few seconds," which falls
over the moment more than a couple contestants submit close together
in a live contest.

`VjudgeAccountPool` makes "how many submissions can be judged at once"
equal to "how many healthy, free bot accounts you've given it":

- `submit()` acquires a free account from the pool and binds it to
  the resulting `runId` in an internal map. The account stays `busy`
  for that run's *entire* lifetime, not just the submit call.
- Every subsequent `getVerdict()` poll for that `runId` reuses the
  same account's session.
- Only once a **terminal** verdict is observed does the account get
  released back to the pool — matching the real one-submission-per-
  account constraint instead of fighting it.
- An account that fails repeatedly (login failure, error response,
  suspected rate-limit) gets quarantined for a cooldown period instead
  of being hammered further — that's usually what a soft-ban looks
  like, and continuing to use a flagged account just makes it worse.

Configure it with one credential per bot account:

```ts
new VjudgeProvider(
  {
    accounts: [
      { username: 'bot1', password: '...' },
      { username: 'bot2', password: '...' },
      // one entry per bot account — this number IS your judging concurrency
    ],
    poolOptions: { maxConsecutiveFailures: 3, quarantineMs: 5 * 60 * 1000 },
    httpClient: realHttpClient,
  },
  problemMappingRepo,
);
```

Size `ISubmissionQueue`'s `concurrency` to match `accounts.length` (the
example composition root does this via `vjudgeProvider.getPoolStatus().total`)
— that keeps backlog visible in the queue instead of hidden inside
`pool.acquire()`'s internal polling loop.

`VjudgeProvider.getPoolStatus()` returns `{ total, available }` —
wire that into a `/health` or admin endpoint so you can see your real
judging capacity during a live contest, and notice quarantines before
contestants do.

Until the real scraping logic is filled in, `getVerdict()` simulates
an account resolving to `ACCEPTED` after a couple of polls (marked
"STUB SIMULATION" in the code) — this lets you exercise the full
queue → JudgeService → provider → pool wiring end-to-end, including
verifying the pool genuinely gates concurrency and releases correctly,
before any real HTTP calls exist.



vjudge is a third-party site you're scraping — submitting too many
solutions at once risks rate-limiting or an outright IP ban, and it
has nothing to do with how many submissions your contest receives at
once. `ISubmissionQueue` decouples those two concerns:

```
Route handler -> queue.enqueue(request)   [returns immediately]
                       |
                       v
              ISubmissionQueue (concurrency cap)
                       |
                       v
              JudgeService.judge(request) -> IJudgeProvider -> IVerdictPublisher
```

Your route handler never calls `JudgeService.judge()` directly — it
calls `queue.enqueue()` and returns. The queue worker calls
`judgeService.judge()` for you, at whatever concurrency you've capped
it to. The verdict (including `IN_QUEUE` the moment it's accepted)
still flows out through `IVerdictPublisher` as before — the queue is
purely about pacing requests into the judge, not about how results get
back to the client.

`InMemoryConcurrencyLimitedQueue` is enough for one backend instance.
When you need multiple instances or durability across restarts, swap
in `BullMQSubmissionQueue` (or your own Redis/SQS/whatever-backed
implementation) — same `ISubmissionQueue` port, no changes anywhere
else.
