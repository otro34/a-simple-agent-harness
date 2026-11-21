# Profile `worker`

Background processing: queues, scheduled jobs, bots, ETL, event consumers. Each stage reads the
section with its name.

## Read

- The jobs/events the story handles, their payload schemas, schedules, and the retry and idempotency
  policy in `docs/architecture.md`.

## Check before starting

- The queue/scheduler/event source exists in every environment or is part of the story.

## When implementing

- Handlers are idempotent: processing the same message twice has the same effect as once.
- Retries with backoff and a dead-letter path; poison messages do not block the queue.
- Timeouts on every external call; structured logs with a correlation id per job.
- Graceful shutdown: in-flight work completes or is safely returned.
- Minimal skeleton: the handler registered, throwing "not implemented".

## Review focus

- Non-idempotent side effects (double charges, duplicate emails); unbounded retries.
- Missing timeouts; secrets or personal data in job payload logs.

## QA

- Run the worker locally with a local broker or scheduler; enqueue test messages, including malformed
  ones and duplicates; check effects and logs.

## Release

- Deploy workers after the producers can tolerate them (or vice versa) according to the payload change;
  smoke checks a heartbeat or processes a synthetic job.

## Verify

Format check, lint, type check, unit and integration tests, build.
