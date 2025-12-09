This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Configure environment variables

The app expects Firebase credentials to load store and product data from Firestore. Copy the example file and provide values from your Firebase project (used by `src/lib/firebaseClient.ts`).

```bash
cp .env.example .env.local
# then edit .env.local to match your Firebase project
```

At minimum, set:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

Without these values, the `/api/stores` endpoint cannot reach Firestore and store pages (e.g., `/stores/<storeId>`) will 404 because no data is returned.

### Avoid npm tarball warnings

If `npm install` shows repeated warnings like "tarball data ... seems to be corrupted" when downloading Next.js packages, you can retry with a clean cache:

```bash
npm cache clean --force
npm install
```

Or use the convenience script that also removes `node_modules` and reinstalls using the lockfile:

```bash
npm run clean-install
```

The included project `.npmrc` increases fetch retries and timeouts to reduce spurious corruption errors when reaching the npm registry.

### Run the development server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
