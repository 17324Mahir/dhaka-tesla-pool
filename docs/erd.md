# Entity relationship diagram

```mermaid
erDiagram
    User ||--o{ Ride : requests
    User ||--o| Tesla : drives
    Tesla ||--o{ Pool : serves
    Pool ||--o{ PoolMember : contains
    Ride ||--o| PoolMember : joins

    User {
      string id PK
      string name
      string email UK
      string password
      Role role
      datetime createdAt
    }

    Tesla {
      string id PK
      string driverId FK
      string name
      int capacity
      boolean isOnline
    }

    Ride {
      string id PK
      string passengerId FK
      string pickup
      string destination
      int seats
      RideStatus status
      int fare
      datetime createdAt
    }

    Pool {
      string id PK
      string teslaId FK
      PoolStatus status
    }

    PoolMember {
      string id PK
      string poolId FK
      string rideId FK
      int individualFare
      int seats
    }
```

## Enums

```text
Role: PASSENGER | DRIVER

RideStatus:
REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
     └──────────────→ CANCELLED ←──────────────┘

PoolStatus: WAITING | ACTIVE | COMPLETED | CANCELLED
```

Money is stored as integer paisa. A ride can belong to at most one pool because
`PoolMember.rideId` is unique, and a driver can own at most one Tesla because
`Tesla.driverId` is unique.
