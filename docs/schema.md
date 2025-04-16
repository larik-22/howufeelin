# Database Schema

## Collections

### 1. users

Core user information stored in Firestore.

- **Primary Key**: `userId`
- **Indexes**:
  - `userId` (primary)
  - `username` (unique)
  - `email` (unique)

### 2. groups

Group information and metadata.

- **Primary Key**: `groupId`
- **Indexes**:
  - `groupId` (primary)
  - `joinCode` (unique)
  - `groupName` (for search)

### 3. groupMembers

M:N relationship between users and groups.

- **Composite Key**: `${groupId}_${userId}`
- **Indexes**:
  - `groupId_userId` (composite primary)
  - `userId` (for user's groups)
  - `groupId` (for group's members)

### 4. ratings

Daily ratings from users in groups.

- **Composite Key**: `${groupId}_${userId}_${date}`
- **Indexes**:
  - `groupId_userId_date` (composite primary)
  - `userId` (for user's ratings)
  - `groupId` (for group's ratings)
  - `date` (for date-based queries)

## Access Patterns

### Common Queries

- Get user's groups: Query `groupMembers` by `userId`
- Get group members: Query `groupMembers` by `groupId`
- Get user's ratings: Query `ratings` by `userId`
- Get group ratings: Query `ratings` by `groupId`
- Check join code: Query `groups` by `joinCode`

## Role-Based Access Control

### Group Access

- Anyone can create a group (becomes ADMIN)
- Anyone can join a group with valid join code (becomes MEMBER)
- Only ADMIN can delete a group

### Member Management

- **ADMIN**:
  - Change any member's role
  - Remove any member
- **MODERATOR**:
  - Remove MEMBERs
- **MEMBER**:
  - Leave the group
  - Submit ratings

### Rating Management

- **MEMBER**:
  - Submit one rating per day
  - Edit their own ratings
- **MODERATOR**:
  - View all ratings
  - Delete any rating
- **ADMIN**:
  - View all ratings
  - Delete any rating
  - Export ratings

## Data Relationships

- User -> Groups: Many-to-Many (via groupMembers)
- User -> Ratings: One-to-Many
- Group -> Ratings: One-to-Many
- Group -> Members: One-to-Many (via groupMembers)

## Optimization Notes

- Using composite keys for efficient lookups
- Denormalized structure to minimize queries
- Indexed fields for common access patterns
- One rating per user per day enforced by composite key
