# Evaluation checklist

This checklist maps the supplied upgrade roadmap to repository evidence.

| Area | Status | Evidence |
| --- | --- | --- |
| Prisma data model | Complete | Users, Teslas, rides, pools, memberships, separate integer-paisa fares/tips, and ride status history in `backend/src/prisma/schema.prisma` |
| Authentication | Complete | Register/login, bcrypt, JWT expiry validation, session restoration, auth middleware, and passenger/driver roles |
| Passenger flow | Complete | Request, private pool summary, own fare/status/progress, cancellation, post-trip tipping, receipt, and history with driver name |
| Driver flow | Complete | Current-area selection, nearby request list, request/pool acceptance, arrival/start/complete/cancel controls, completed history and earnings |
| Matching | Complete | Driver-area/pickup match, destination within 5 km, remaining capacity, safe pre-departure joins, first-driver-wins serializable transaction, and conflict retries |
| Validation/security | Complete | Strict Zod bodies/UUIDs, role guards, ownership checks, and private passenger projections |
| Automated tests | Complete | 28 passing backend tests plus local API/browser acceptance checks covering fares, tips, capacity, driver location, active-pool joining, lifecycle, privacy, session navigation, ownership, and retry behavior |
| Seed story | Complete | Nusrat, Rafiq, Shirin, Jashim, Bullet, and a deterministic two-passenger pool that clears stale demo history/tips on reseed |
| Frontend routes | Complete | Login, register, passenger dashboard/request/history, and driver dashboard/rides/trip |
| Reusable UI | Complete | Navbar, RideCard, RideProgress, StatusBadge, FareCard, TeslaCard, and PoolCard |
| Docker | Configured | Frontend, backend, and PostgreSQL services with health checks, migrations, and optional seed |
| Documentation | Complete | README, architecture, ERD, API reference, deployment guide, and this checklist |
| Git workflow | Complete | `master`, `pre-release`, `release/v1.0.0`, and feature branches with conventional commits |
| Deployment | Complete | Updated master commit verified live on Render and Vercel; pooled app URL plus direct migration URL configured |
| Presentation assets | Complete | Four live-deployment screenshots and a passenger/driver walkthrough video under `docs/` |

## Submission status

The evaluator-facing source code, deployment, screenshots, and walkthrough
video are complete. The project owner only needs to submit the repository and
live links through the required course or assessment portal.
