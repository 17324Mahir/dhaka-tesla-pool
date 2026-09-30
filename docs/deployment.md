# Free deployment

This project can be hosted at no cost for personal/demo use with:

- Neon for PostgreSQL.
- Render for the Express API.
- Vercel for the Next.js frontend.

The current deployment is available at:

- Frontend: <https://dhaka-tesla-pool-three.vercel.app>
- API: <https://dhaka-tesla-pool-api-mahir.onrender.com>

No secret values should be committed to Git. Add them only in the provider
dashboards.

## 1. Create the Neon database

1. Sign in at <https://console.neon.tech> with GitHub.
2. Create a project named `dhaka-tesla-pool` in a nearby region, preferably
   Singapore.
3. In **Connect**, copy both connection strings: pooled for application traffic
   and direct (hostname without `-pooler`) for migrations.
4. Keep the complete strings, including `sslmode=require`. Set the pooled value
   as Render's `DATABASE_URL` and the direct value as
   `DATABASE_URL_UNPOOLED`.

The API applies the committed Prisma migration and loads the idempotent demo
seed whenever the Render service starts.

## 2. Deploy the backend to Render

1. Open <https://dashboard.render.com/blueprints> and select **New Blueprint
   Instance**.
2. Connect the GitHub repository
   `17324Mahir/dhaka-tesla-pool` and select the `master` branch.
3. Render detects `render.yaml`. Paste the pooled Neon connection into
   `DATABASE_URL` and the direct connection into `DATABASE_URL_UNPOOLED`.
4. Create the free service and wait for its health status to become **Live**.
5. Open the generated URL. It should return:

   ```json
   {"message":"Dhaka Tesla Pool API running"}
   ```

Copy the generated API URL, which will look similar to:

```text
https://dhaka-tesla-pool-api-mahir.onrender.com
```

The free Render service sleeps after 15 minutes without traffic, so its first
request after an idle period can take about a minute.

## 3. Deploy the frontend to Vercel

1. Sign in at <https://vercel.com> with GitHub and choose **Add New > Project**.
2. Import `17324Mahir/dhaka-tesla-pool`.
3. Set **Root Directory** to `frontend`. Vercel should detect Next.js.
4. Add this environment variable for Production, Preview, and Development:

   ```text
   NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
   ```

5. Select **Deploy** and open the generated `vercel.app` URL.

Because `NEXT_PUBLIC_API_URL` is included in the browser build, redeploy the
frontend after changing it.

## 4. Verify the live application

Check the Render API URL first, then open the Vercel URL and log in with one of
the seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Driver | `jashim@test.com` | `password123` |
| Passenger | `nusrat@test.com` | `password123` |
| Passenger | `rafiq@test.com` | `password123` |

Test a passenger login, the passenger dashboard, and the driver dashboard.
Render and Vercel automatically redeploy future pushes to `master`.
