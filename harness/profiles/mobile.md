# Profile `mobile`

A mobile application (React Native/Expo, Flutter, native). Each stage reads the section with its name.

## Read

- The API contracts consumed; target platforms and minimum OS versions; store requirements in the spec.

## Check before starting

- Endpoints exist; required native permissions are listed in the spec.

## When implementing

- No business rules only on the device; offline and slow-network states handled.
- Permissions requested in context, with handling for denial.
- Minimal skeleton: the screen rendered with no behaviour; component tests with the platform's testing
  library.

## Review focus

- Secrets embedded in the app bundle (anything in the bundle is public).
- Unhandled permission denial, missing offline/error states, accessibility labels.

## QA

- Run on a simulator/emulator (or Expo web preview when that is what the agent can drive); walk each
  criterion; check both platforms when the story touches platform-specific code.

## Release

- Store releases need human accounts and review: `deploy.target` is usually `none` for the app
  (build artifacts attached to the GitHub release, or EAS/fastlane configured in
  `.harness/local/11-release.md`); its backend uses its own profile and target.

## Verify

Format check, lint, type check, tests, build for each platform the CI supports.
