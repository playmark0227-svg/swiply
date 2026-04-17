# Firebase Integration

Warp's data layer is abstracted so you can swap localStorage for Firebase
without touching any UI code. By default, the app runs in localStorage-only
mode. Setting Firebase env vars activates Firestore + Anonymous Auth.

## Architecture

```
src/lib/
  firebase/
    client.ts          ← Firebase SDK init (env-gated)
  services/
    auth.ts            ← getCurrentUserId() — anon auth or local UUID
    jobs.ts            ← getJobsByType / getJobById / getAllJobs
    likes.ts           ← addLike / removeLike / getLikedJobIds / isLiked
    profile.ts         ← getProfile / saveProfile
```

All service functions are `async` and return Promises. Components call them
with `await` (or `useEffect` + `.then`). When Firebase is enabled, the
services hit Firestore. When it isn't, they fall back to localStorage.

## Enabling Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Add a Web App (gear icon → Project settings → Your apps → `</>`).
3. Copy the config values into `.env.local`:

   ```bash
   cp .env.local.example .env.local
   # then fill in the NEXT_PUBLIC_FIREBASE_* values
   ```

4. In the Firebase console:
   - **Authentication** → Sign-in method → enable **Anonymous**
   - **Firestore Database** → Create database (start in production mode)
   - **Storage** (optional, for profile photos) → Get started

5. Restart `npm run dev`. The app will automatically use Firebase.

## Firestore data model

```
users/{uid}                    ← UserProfile + updatedAt
users/{uid}/likes/{jobId}      ← { jobId, createdAt }
jobs/{jobId}                   ← (optional) Job documents
```

Currently jobs are static (`src/data/jobs.ts`) so the build can statically
generate `/job/[id]` paths. To move jobs to Firestore, see the commented
swap in `src/lib/services/jobs.ts`. You'll also need a build script that
pulls IDs from Firestore for `getAllJobIds()`, since static export requires
all paths at build time.

## Security rules (starter)

Paste into Firestore Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /likes/{jobId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /jobs/{jobId} {
      allow read: if true;
      allow write: if false;  // admin-only via console for now
    }
  }
}
```

## Notes

- The app uses Firebase **client SDK only** (no Admin SDK), which works
  fine with `output: "export"` static deployment to GitHub Pages.
- `getCurrentUserId()` is the single source of truth for the user id.
  Both Firebase (anon auth uid) and fallback (local UUID) flow through it.
- Profile photos are currently stored as base64 in the profile document.
  For production, switch to Firebase Storage and store the URL instead.
