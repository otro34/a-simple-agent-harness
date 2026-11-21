# Risk markers

Every story in `docs/plan/stories.md` carries one marker. Plan assigns it; contrast can raise it
(never lower it without a recorded reason).

| Marker | When                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------ |
| 🔴     | Money or balances, authentication or authorization, personal or sensitive data, irreversible data changes (migrations that drop or rewrite), security boundaries, anything legal or regulatory |
| 🟠     | Public contracts (API shape, events, DB schema used by others), concurrency, external integrations, performance-sensitive paths |
| none   | Everything else                                                                                        |
| 📄     | Docs or configuration only, with no runtime effect (fast path)                                         |

## What the marker changes

| Aspect                     | 🔴                                                                 | 🟠                          | none                  | 📄                     |
| -------------------------- | ----------------------------------------------------------------- | --------------------------- | --------------------- | ---------------------- |
| Model for implement        | Strongest available (`config.models.strong`)                      | Strongest                   | Standard              | Standard               |
| `tests` gate artifact      | Test table **and** list of files to create or touch               | Test table                  | Test table            | Skipped                |
| Review                     | Two independent reviews: standard + security checklist (`08` §4)   | One review                  | One review            | One review, light      |
| QA                         | Full, including at least two error cases per criterion            | Full                        | Full                  | Skipped                |
| Story section required     | "Verify specifically": what must be proven beyond the criteria    | —                           | —                     | —                      |
| `merge` in `supervised`    | Human approval, ideally by someone other than who directed the work | Human                     | Human                 | Human                  |
| `merge` in `auto`          | Auto, only with both reviews `pass` and QA `pass`                 | Auto                        | Auto                  | Auto                   |

If the agent cannot choose a model at runtime, it records the model it used in the run log; the
report lists 🔴 stories implemented with a non-strong model.
