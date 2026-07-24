# Long Story Short

Long Story Short LLC helps customers order a complete novel manuscript from a story idea.

## Technology

- Firebase Authentication for email/password, password reset, and Google sign-in.
- Cloud Firestore for customer profiles and novel manuscript orders.
- Square for secure payment links and payment notifications.
- n8n for post-payment manuscript workflow delivery.

## Firebase Setup

The project uses Firebase project `long-story-short-novels`.

1. Enable Email/Password and Google in Firebase Authentication.
2. Add the production website domains under Firebase Authentication authorized domains.
3. Deploy the repository's Firestore rules:

```bash
npx firebase-tools deploy --only firestore:rules --project long-story-short-novels
```

## Environment

Copy `.env.example` to `.env.local`. Keep `FIREBASE_SERVICE_ACCOUNT_JSON` server-only. It is required for protected payment, webhook, and n8n order processing.