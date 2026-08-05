This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Probar las inscripciones de la carrera en local

`/run/inscripcion` muestra "la venta aún no abre" cuando no encuentra base
de datos o cuando el evento sigue en `borrador` — que es como queda sembrado
a propósito, para que nadie compre con precio y cupo inventados.

Para verlo funcionando no hace falta Docker ni instalar Postgres:

```bash
cp .env.example .env.local     # y ajusta lo que marca abajo
npm run db:local               # Postgres en memoria (PGlite), migra y abre la venta
npm run dev                    # en otra terminal
```

En `.env.local` basta con esto para que la página cargue:

```
DATABASE_URL=postgres://postgres@127.0.0.1:5433/postgres
RUN_DB_MAX_CONEXIONES=1
RUN_TOKEN_SECRET=<32 caracteres o más>
CRON_SECRET=<lo que sea>
```

Para llegar hasta el pago hacen falta además tus llaves de prueba de Stripe
(`STRIPE_SECRET_KEY_TEST`) y reenviar los eventos:

```bash
stripe listen --forward-to localhost:3000/api/run/webhook
# copia el whsec_… que imprime a STRIPE_RUN_WEBHOOK_SECRET_TEST
```

Y para verificar el cobro completo sin tocar Stripe:

```bash
npm run test:fase1
```

Dispara el mismo webhook tres veces y comprueba que la orden queda pagada una
sola vez, que el cupo baja exactamente en uno y que el cron expira las
reservas vencidas.

**Límites de `db:local`:** los datos viven en memoria y se pierden al cerrar,
y el puente de PGlite atiende **un solo cliente a la vez** — por eso
`RUN_DB_MAX_CONEXIONES=1`. Si corres `npm run build` o `npm run test:fase1`
mientras está arriba, se pelean por la conexión: reinícialo. Para trabajo
serio, apunta `DATABASE_URL` a Supabase y aplica `supabase/migrations/` en
orden.

## Getting Started

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
