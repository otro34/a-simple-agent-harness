# Deploy targets

Each guide has the same sections, so stages can point at them by name:

| Section             | Used by                  |
| ------------------- | ------------------------ |
| Fits / Constraints  | 00 intake, 03 plan       |
| Options             | 01 setup (`deploy.options`) |
| Setup               | 01 setup                 |
| Bootstrap           | 04 bootstrap             |
| Deploy staging      | 04 bootstrap, 11 release |
| Deploy production   | 11 release               |
| Migrations          | 11 release               |
| Logs                | 11 release               |
| Rollback            | 11 release               |
| Cost                | 04 bootstrap, `spend` gate |

The checks the doctor runs for each target are in [`targets.json`](targets.json).

**CLIs change.** Each guide uses commands that were current when written. If a command fails with
"unknown command/flag", run the CLI's `--help` for the subcommand, use the current equivalent, and
record the difference in the run log (and, ideally, a PR to this harness).

| Target          | Guide                                  | Good for                                                     |
| --------------- | -------------------------------------- | ------------------------------------------------------------ |
| `vercel`        | [vercel.md](vercel.md)                 | Static sites, Next.js/SSR fronts, serverless APIs            |
| `fly`           | [fly.md](fly.md)                       | Containers, long-running servers, websockets, workers        |
| `railway`       | [railway.md](railway.md)               | Apps + managed databases with minimal configuration          |
| `render`        | [render.md](render.md)                 | Web services, workers, cron, Postgres, from a Blueprint      |
| `docker-vps`    | [docker-vps.md](docker-vps.md)         | Any container on a server you control                        |
| `aws`           | [aws.md](aws.md)                       | AWS accounts, via CDK (S3+CloudFront, Lambda, ECS Fargate)   |
| `gcp-cloud-run` | [gcp-cloud-run.md](gcp-cloud-run.md)   | Containers on Google Cloud Run                               |
| `none`          | —                                      | Libraries and CLIs (tag + release, optional package publish) |
