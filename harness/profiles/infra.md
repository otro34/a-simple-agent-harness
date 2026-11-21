# Profile `infra`

Infrastructure as code (Terraform/OpenTofu, CDK, Pulumi, Kubernetes manifests, Docker Compose).
Each stage reads the section with its name.

## Read

- The environments and resources in `docs/architecture.md`; the state backend and how it is locked.

## Check before starting

- Which environments the change affects; whether it replaces (destroys and recreates) any resource.

## When implementing

- Every change is planned before applied (`terraform plan`, `cdk diff`, `pulumi preview`) and the plan
  output goes into the PR description (secrets redacted).
- No secrets in code or state files committed; use the platform's secret manager.
- Resources tagged with project and environment; least-privilege IAM.
- Tests: validation/lint (`tflint`, `cdk synth`, `kubeconform`), and policy checks where available.

## Review focus

- Resource replacement or deletion of stateful resources (databases, buckets) → gate `destructive`.
- Overly broad IAM, public buckets, open security groups; cost increases → gate `spend`.

## QA

- Apply to staging only; verify the resources and the application on staging.

## Release

- Apply to production only after staging, through the `production` gate, with the plan attached.

## Verify

Format check, validate, lint, policy checks, plan against staging (read-only).
