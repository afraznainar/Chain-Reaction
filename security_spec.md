# Security Specification - Atomic Chain Reaction

## Data Invariants
- Users can only update their own profile/stats.
- Any update to wins/losses must be accompanied by an increment to totalGames. (Actually difficult to enforce strictly without Cloud Functions, but I can enforce that the UI only allows authenticated users to read and only owners to write).
- Stats cannot be negative.

## The Dirty Dozen Payloads (Sample)
1. Update another user's wins (ID Poisoning).
2. Set negative wins.
3. Update wins without being signed in.
4. Set a very large string for displayName.

## Test Runner (Simplified for rules verification)
See `firestore.rules` logic.
