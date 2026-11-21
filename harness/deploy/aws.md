# AWS (CDK)

## Fits / Constraints

- Fits: teams already on AWS. The harness uses the AWS CDK, with one of three shapes chosen in plan:
  **static** (S3 + CloudFront), **serverless** (Lambda + API Gateway/Function URLs), **container**
  (ECS Fargate behind an Application Load Balancer).
- Constraints: more moving parts and cost traps (NAT gateways, idle load balancers). Every stack
  creation goes through `spend`.
- Environments: one stack per environment (`<App>-staging`, `<App>-production`), ideally in separate
  accounts.

## Options

`deploy.options`: `profile` (AWS CLI profile), `account`, `region`, `shape` (`static`,
`serverless`, `container`), `stackStaging`, `stackProduction`.

## Setup

```bash
brew install awscli                 # AWS CLI v2
aws configure sso --profile <profile>   # human, browser (or access keys for a dedicated deploy user)
aws sso login --profile <profile>
aws sts get-caller-identity --profile <profile>
npx aws-cdk@latest bootstrap aws://<account>/<region> --profile <profile>
```

SSO sessions expire: for long unattended runs, use a dedicated IAM role/user with least privilege for
deploys, or make sure the session lasts the whole run. CI: GitHub OIDC role (`aws-actions/configure-aws-credentials`)
instead of long-lived keys.

Secrets: AWS Secrets Manager or SSM Parameter Store, referenced by the stack:

```bash
aws secretsmanager create-secret --name <app>/<env>/<NAME> --secret-string file:///dev/stdin --profile <profile>
```

## Bootstrap

A CDK app in `infra/` (TypeScript recommended), parameterised by environment. Container shape: avoid
NAT gateways for small apps (public subnets with assigned public IPs), set a health check on `/health`.

## Deploy staging

```bash
npx cdk diff <stackStaging> --profile <profile>
npx cdk deploy <stackStaging> --require-approval never --profile <profile> --outputs-file .harness/state/cdk-staging.json
```

BASE_URL: from the stack outputs.

## Deploy production

Same commit (and, for containers, the same image tag/digest passed as a context value or parameter):
`npx cdk deploy <stackProduction> --require-approval never --profile <profile>`.

## Migrations

A one-off ECS task or Lambda invoked from the release step, or a CDK custom resource; run before
shifting traffic.

## Logs

`aws logs tail <log-group> --since 10m --profile <profile>`

## Rollback

CloudFormation rolls back failed deployments automatically. For a deployment that succeeded but is
broken, redeploy the previous release tag (`git worktree add ../rollback v<previous>` and `cdk deploy`
from there), or, for containers, redeploy with the previous image tag.

## Cost

Static and serverless shapes can stay near zero at low traffic; ALB, Fargate tasks, NAT gateways and
RDS have fixed monthly costs. Use AWS Budgets alerts matching `limits.monthlyBudgetUsd`.
