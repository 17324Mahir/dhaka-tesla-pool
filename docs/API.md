# API reference

Base URL: `http://localhost:5000`

Requests and responses use JSON. Protected endpoints require:

```http
Authorization: Bearer YOUR_JWT
Content-Type: application/json
```

Validation errors use HTTP `400` and include field-level details:

```json
{
  "message": "Request validation failed",
  "errors": [
    { "field": "email", "message": "Enter a valid email address" }
  ]
}
```

## Authentication

### Register

`POST /auth/register` — public

```json
{
  "name": "Nusrat",
  "email": "nusrat@example.com",
  "password": "password123",
  "role": "PASSENGER"
}
```

`role` must be `PASSENGER` or `DRIVER`. Successful response (`201`):

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "Nusrat",
    "email": "nusrat@example.com",
    "role": "PASSENGER"
  }
}
```

Possible errors: `400` invalid body, `409` email already exists, `500`
registration failed.

### Login

`POST /auth/login` — public

```json
{
  "email": "nusrat@test.com",
  "password": "password123"
}
```

Successful response (`200`):

```json
{
  "message": "Login successful",
  "token": "jwt",
  "user": {
    "id": "uuid",
    "name": "Nusrat",
    "role": "PASSENGER"
  }
}
```

Possible errors: `400` invalid body, `401` invalid email or password, `500`
login failed.

## Passenger

Every passenger endpoint requires a passenger JWT. Driver tokens receive
`403`.

### Request and match a ride

`POST /rides`

```json
{
  "pickup": "Banani",
  "destination": "Mohakhali",
  "seats": 1
}
```

Supported areas are Banani, Gulshan, Gulshan 1, Mohakhali, Dhanmondi, Mirpur,
Uttara, Farmgate, and Bashundhara. Seats must be an integer from 1 to 3. Matching is
automatic and requires a same-pickup `WAITING` pool, an online Tesla, and
enough remaining capacity. The existing pool destination must also be within
5 km of the requested destination according to `src/data/zones.json`.

Matched response (`201`):

```json
{
  "message": "Ride requested and matched",
  "ride": {
    "id": "uuid",
    "pickup": "Banani",
    "destination": "Mohakhali",
    "seats": 1,
    "status": "MATCHED",
    "fare": 13000
  },
  "poolId": "uuid"
}
```

When no Tesla is available, the saved request is returned with HTTP `202`,
status `REQUESTED`, and fare `15000`. Possible errors: `400` invalid request,
`401` missing or invalid token, `403` wrong role, `500` creation failed.

### List own rides

`GET /rides/history` (preferred) or `GET /rides/my` (compatibility alias)

No request body. Successful response (`200`):

```json
[
  {
    "id": "uuid",
    "pickup": "Banani",
    "destination": "Mohakhali",
    "seats": 1,
    "status": "MATCHED",
    "fare": 13000,
    "tip": 0,
    "receipt": { "fare": 13000, "tip": 0, "total": 13000 },
    "createdAt": "2026-09-30T10:00:00.000Z",
    "statusHistory": [
      { "status": "REQUESTED", "createdAt": "2026-09-30T10:00:00.000Z" },
      { "status": "MATCHED", "createdAt": "2026-09-30T10:00:01.000Z" }
    ],
    "poolMember": {
      "pool": {
        "tesla": { "name": "Bullet", "driver": { "name": "Jashim" } }
      }
    }
  }
]
```

Possible errors: `401`, `403`, or `500` cannot fetch rides.

### Add or update a tip

`PATCH /rides/:id/tip`

The ride must belong to the authenticated passenger and be `COMPLETED`. Money
is sent as non-negative integer paisa; the tip can be updated later without
changing the fare.

```json
{ "tip": 2500 }
```

Successful response (`200`):

```json
{
  "message": "Tip updated",
  "rideId": "uuid",
  "receipt": { "fare": 13000, "tip": 2500, "total": 15500 }
}
```

Possible errors: `400` invalid ID/body, `401`, `403` not the ride owner, `404`
ride not found, `409` ride not completed, or `500` update failed.

### Cancel own ride

`PATCH /rides/:id/cancel`

No request body. The ride must belong to the passenger and be `REQUESTED` or
`MATCHED`. Successful response (`200`):

```json
{
  "message": "Ride cancelled",
  "ride": { "id": "uuid", "status": "CANCELLED" }
}
```

Possible errors: `400` invalid ID or state, `401`, `403` not the owner, `404`
ride not found, `500` cancellation failed.

### List own pools

`GET /pool/my`

No request body. The response exposes aggregate occupancy plus only the
authenticated passenger's membership. It never includes another passenger's
route, fare, status, name, or identifier:

```json
[
  {
    "id": "uuid",
    "status": "WAITING",
    "tesla": { "id": "uuid", "name": "Bullet", "capacity": 3 },
    "memberCount": 2,
    "usedSeats": 2,
    "availableSeats": 1,
    "myMembership": {
      "id": "uuid",
      "seats": 1,
      "individualFare": 13000,
      "ride": {
        "id": "uuid",
        "pickup": "Banani",
        "destination": "Mohakhali",
        "status": "MATCHED",
        "fare": 13000
      }
    }
  }
]
```

Possible errors: `401`, `403`, or `500` cannot fetch pool.

## Driver

Every driver endpoint requires a driver JWT. Passenger tokens receive `403`.
A driver can only accept or update pools assigned to their own Tesla.

### Driver and Tesla summary

`GET /driver/dashboard`

Returns the assigned Tesla's online state and capacity summary:

```json
{
  "id": "uuid",
  "name": "Bullet",
  "capacity": 3,
  "isOnline": true,
  "occupiedSeats": 2,
  "availableSeats": 1
}
```

### Go online or offline

`PATCH /driver/status`

```json
{ "isOnline": true }
```

Going offline is rejected with `409` while the Tesla has an active pool.

### List assigned rides

`GET /driver/rides`

No request body. Returns active rides assigned to the authenticated driver's
Tesla, including safe passenger details and pool state:

```json
[
  {
    "id": "uuid",
    "pickup": "Banani",
    "destination": "Mohakhali",
    "status": "MATCHED",
    "fare": 13000,
    "passenger": { "id": "uuid", "name": "Nusrat" },
    "poolMember": {
      "pool": {
        "id": "uuid",
        "status": "WAITING",
        "tesla": { "id": "uuid", "name": "Bullet" }
      }
    }
  }
]
```

Possible errors: `401`, `403`, or `500` cannot fetch driver rides.

### List completed rides and earnings

`GET /driver/history`

Returns only completed rides assigned to the authenticated driver's Tesla.
Each record includes the assigned passenger and a separated receipt:

```json
[
  {
    "id": "uuid",
    "pickup": "Banani",
    "destination": "Mohakhali",
    "status": "COMPLETED",
    "passenger": { "id": "uuid", "name": "Nusrat" },
    "receipt": { "fare": 13000, "tip": 2500, "total": 15500 }
  }
]
```

Possible errors: `401`, `403`, or `500` cannot fetch driver history.

### Accept a pool

`PATCH /driver/pool/:id/accept`

No request body. The pool must be `WAITING`, non-empty, assigned to the
driver’s online Tesla, and identified by a UUID.
The API rechecks that active member seats do not exceed Tesla capacity before
acceptance.

```json
{ "message": "Pool accepted", "poolId": "uuid" }
```

Possible errors: `400` invalid ID, `401`, `403` another driver's pool, `404`
pool not found, `409` invalid pool/Tesla state, `500` acceptance failed.

### Mark driver arrival

`PATCH /driver/ride/:id/arrival`

No request body. Requires an accepted (`ACTIVE`) pool and a `MATCHED` ride.

```json
{
  "message": "Ride status updated to DRIVER_ARRIVED",
  "ride": { "id": "uuid", "status": "DRIVER_ARRIVED" }
}
```

Possible errors: `400` invalid ID, `401`, `403` unassigned ride, `404` ride not
found, `409` invalid pool or ride state, `500` update failed.

### Start a trip

`PATCH /driver/ride/:id/start`

No request body. Requires `DRIVER_ARRIVED`. The response shape matches the
arrival response with status `STARTED`. Possible errors: `400`, `401`, `403`,
`404`, `409`, or `500`.

### Complete a trip

`PATCH /driver/ride/:id/complete`

No request body. Requires `STARTED`. The response contains status `COMPLETED`.
When every ride in the pool is completed or cancelled, the pool becomes
`COMPLETED`. Possible errors: `400`, `401`, `403`, `404`, `409`, or `500`.

### Cancel an assigned ride

`PATCH /driver/ride/:id/cancel`

The pool must be active and the ride must still be `MATCHED`. The response
shape matches the other lifecycle endpoints with status `CANCELLED`.

### Generic lifecycle endpoint

`PATCH /rides/:id/status`

This role-protected driver endpoint supports the evaluator-facing API shape:

```json
{ "status": "DRIVER_ARRIVED" }
```

Allowed requested statuses are `DRIVER_ARRIVED`, `STARTED`, `COMPLETED`, and
`CANCELLED`. The same ownership, pool acceptance, and transition rules apply.

## Utility routes

| Method | Endpoint | Result |
| --- | --- | --- |
| `GET` | `/` | API availability message |
| `GET` | `/profile` | Verifies any authenticated JWT |
| `GET` | `/driver-only` | Verifies a driver JWT |

Unknown endpoints return `404` with `{ "message": "Route not found" }`.
