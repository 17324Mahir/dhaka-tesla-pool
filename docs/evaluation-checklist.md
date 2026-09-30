# Evaluation checklist

This checklist maps the supplied upgrade roadmap to repository evidence.

| Area | Status | Evidence |
| --- | --- | --- |
| Prisma data model | Complete | Users, Teslas, rides, pools, memberships, integer-paisa fares, and ride status history in `backend/src/prisma/schema.prisma` |
| Authentication | Complete | Register/login, bcrypt, JWT, auth middleware, and passenger/driver roles |
| Passenger flow | Complete | Request, private pool summary, own fare/status, cancellation, and history with driver name |
| Driver flow | Complete | Tesla/capacity dashboard, online/offline control, pool acceptance, arrival/start/complete/cancel controls |
| Matching | Complete | Same pickup, destination within 5 km, online Tesla, remaining capacity, serializable transaction, and conflict retries |
| Validation/security | Complete | Strict Zod bodies/UUIDs, role guards, ownership checks, and private passenger projections |
| Automated tests | Complete | 21 passing tests covering fares, capacity, validation, lifecycle, privacy, destination matching, ownership, and retry behavior |
| Seed story | Complete | Nusrat, Rafiq, Shirin, Jashim, Bullet, and an idempotent two-passenger pool |
| Frontend routes | Complete | Login, register, passenger dashboard/request/history, and driver dashboard/rides/trip |
| Reusable UI | Complete | Navbar, RideCard, StatusBadge, FareCard, TeslaCard, and PoolCard |
| Docker | Configured | Frontend, backend, and PostgreSQL services with health checks, migrations, and optional seed |
| Documentation | Complete | README, architecture, ERD, API reference, deployment guide, and this checklist |
| Git workflow | Complete | `master`, `pre-release`, `release/v1.0.0`, and feature branches with conventional commits |
| Deployment | Complete | Updated master commit verified live on Render and Vercel; pooled app URL plus direct migration URL configured |
| Presentation assets | Complete | Four live-deployment screenshots and a passenger/driver walkthrough video under `docs/` |

## Submission status

The evaluator-facing source code, deployment, screenshots, and walkthrough
video are complete. The project owner only needs to submit the repository and
live links through the required course or assessment portal.
