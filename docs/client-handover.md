# Client Handover Checklist

This checklist is for the Dr. Mjoli app in this repository.

The handover is complete only when the client owns:

- the code repository
- the Firebase project and billing
- the Firestore data
- the Firebase Storage files
- the deployment and environment configuration

## App inventory

This app currently depends on:

- Firestore collections and documents:
  - `development_state/latest_extracted_patient`
  - `development_state/live_template_draft`
  - `patient_sticker_drafts/{draftId}`
  - `patients/{patientId}`
  - `patient_records/{recordId}`
- Firebase Storage path:
  - `patients/{patientId}/...`
- Firebase rules files:
  - `firestore.rules`
  - `storage.rules`
- Runtime Firebase config:
  - `src/lib/firebase.ts`
  - `.env` values based on `.env.example`

Important repo behavior:

- The app stores attachment download URLs in Firestore and renders them directly in the UI.
- On `localhost`, some uploads can be saved only in browser-local storage instead of Firebase.
- The app keeps browser-side sync queues for pending writes.

## Before handover

- [ ] Confirm which Firebase project is the real live project.
- [ ] Back up Firestore data.
- [ ] Back up Firebase Storage files.
- [ ] Export or record the current Firebase config values used by production.
- [ ] Confirm whether any test data exists only in your browser on your machine.
- [ ] Confirm the client has their own Google account, Firebase access, billing account, and code hosting access.

## Code handover

- [ ] Move the repository to a client-owned GitHub repo, or give the client the full repo with history.
- [ ] Give the client the build instructions, environment variable list, and deployment steps.
- [ ] Confirm the client can install dependencies and run `npm run dev`.

## Firebase handover options

Choose one option.

### Option A: Transfer the existing Firebase project

This is the safer option for this app.

- [ ] Add the client as an Owner in Firebase / Google Cloud IAM.
- [ ] Move billing to the client billing account.
- [ ] Add the client to notification and security contacts.
- [ ] Confirm the client can open Firestore, Storage, and project settings.
- [ ] Confirm the client can deploy rules from this repo.
- [ ] Remove your own Owner access only after verification.

### Option B: Migrate to a brand new client Firebase project

Use this only if the client must have a completely separate Firebase project.

- [ ] Create the new client-owned Firebase project.
- [ ] Create Firestore and the default Storage bucket in the client project.
- [ ] Deploy `firestore.rules` and `storage.rules` to the client project.
- [ ] Import Firestore data into the client project.
- [ ] Copy Storage objects under `patients/{patientId}/...` to the client bucket.
- [ ] Rewrite stored attachment URLs if the bucket hostname changes.
- [ ] Set the client Firebase env values in the client environment.
- [ ] Test reads, writes, uploads, deletes, and draft syncing before cutover.
- [ ] Freeze writes during final cutover so stale browser queues do not write into the wrong project.

## Required environment values

The client must provide these values in their own `.env` file or hosting environment:

```sh
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
PATIENT_STICKER_WEBHOOK_PROXY_TARGET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_CHAT_IDS=
TELEGRAM_BOT_POLL_TIMEOUT_SECONDS=45
PLAYWRIGHT_TELEGRAM_CONFIG_PATH=
```

## Verification checklist

- [ ] Patient list loads from Firestore.
- [ ] Patient records can be created and updated.
- [ ] Patient records can be deleted.
- [ ] Attachments upload to Firebase Storage.
- [ ] Attachments open correctly in the UI.
- [ ] Attachments can be deleted.
- [ ] `latest_extracted_patient` draft sync works.
- [ ] `live_template_draft` sync works.
- [ ] Firestore rules deploy succeeds.
- [ ] Storage rules deploy succeeds.

## Local-only data risk

Before final handover, inspect whether any important test or live data exists only on your development machine:

- browser localStorage
- browser IndexedDB
- local-only attachments saved with `local://patients/...`
- pending sync queues for patient records or live template drafts

If that data matters, move it into Firebase before ending the project.

## Hosting note

If the client later hosts the frontend on their own server, they can still keep Firebase as the backend.

If the client later wants both the app and the database off Firebase and fully on their own servers, that is a separate backend migration project, not just a handover.
