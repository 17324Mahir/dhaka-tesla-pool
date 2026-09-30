# Architecture

## Runtime topology

```mermaid
flowchart TB
    subgraph Client
      Browser[Browser]
      Next[Next.js App Router UI]
      Browser --> Next
    end

    subgraph Application
      Express[Express API]
      Auth[JWT and role middleware]
      Controllers[Controllers]
      Services[Matching, fare, capacity, state services]
      Express --> Auth --> Controllers --> Services
    end

    subgraph Data
      Prisma[Prisma Client + PostgreSQL adapter]
      Postgres[(PostgreSQL)]
      Services --> Prisma --> Postgres
    end

    Next -->|HTTP JSON + Bearer token| Express
```

## Request flow

1. The Next.js client authenticates through `POST /auth/login`.
2. The browser stores the demo JWT, validates its expiry on restoration, and
   Axios attaches it to API requests.
3. Express verifies the token and enforces passenger or driver roles.
4. Controllers validate input and delegate business rules to services.
5. Prisma executes queries through the official PostgreSQL driver adapter.
6. Pool matching uses a serializable transaction and retries serialization
   conflicts to prevent concurrent seat overbooking.
7. Matching can add a compatible passenger to an accepted pool until any ride
   starts; unmatched requests are retried when driver capacity becomes free.

## Ride request sequence

```mermaid
sequenceDiagram
    participant P as Passenger UI
    participant A as Express API
    participant M as Pool matcher
    participant DB as PostgreSQL

    P->>A: POST /rides + JWT
    A->>DB: Create REQUESTED ride (15,000 paisa)
    A->>M: Match ride
    M->>DB: Serializable pickup/destination/capacity transaction
    DB-->>M: Pool + member + MATCHED ride
    M-->>A: Matched pool
    A-->>P: Ride (13,000 paisa) + pool ID
```

## Docker startup

```mermaid
flowchart LR
    PG[PostgreSQL healthy] --> MIG[Prisma migrate deploy]
    MIG --> SEED[Optional idempotent seed]
    SEED --> API[Express healthy]
    API --> WEB[Next.js starts]
```

Compose health checks enforce this order. The browser-facing API URL is baked
into the frontend using `NEXT_PUBLIC_API_URL` during the image build.

## Authentication and authorization flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js UI
    participant API as Express API
    participant JWT as JWT middleware
    participant Role as Role middleware
    participant Handler as Protected handler

    User->>UI: Submit email and password
    UI->>API: POST /auth/login
    API-->>UI: Signed JWT + safe user profile
    UI->>JWT: API request + Bearer JWT
    JWT->>Role: Verified user ID and role
    Role->>Handler: Authorized passenger or driver
    Handler-->>UI: JSON response
```

Authentication establishes identity. Route-level role middleware then keeps
passengers out of driver endpoints and drivers out of passenger mutations.
Passenger pool projections return aggregate occupancy and the requesting
passenger's membership only; another passenger's route, fare, and status never
leave the API.

The login and registration routes redirect an already-authenticated user to
their role dashboard. Login uses history replacement, so Back/Forward and page
refresh do not present a false logged-out state. A rejected or expired JWT is
still cleared and redirected to login.

Passenger and driver dashboards poll every five seconds. Ride transitions and
tips remain authoritative in PostgreSQL; polling refreshes passenger progress,
receipts, and the driver's completed-trip earnings without sharing data between
passengers.
