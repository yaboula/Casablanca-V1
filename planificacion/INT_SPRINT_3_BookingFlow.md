# INT-SPRINT 3 — Flujo de Reserva (Booking Flow)
> **Objetivo**: Reemplazar el pago simulado (`setTimeout + ID fake`) de `BookFlowClient.tsx` por el flujo real: crear reserva en backend → Stripe Payment Intent → Stripe Elements en el frontend.

---

## Contexto actual (estado mock)

```typescript
// src/components/vehicles/BookFlowClient.tsx — líneas ~93-98
const handleSubmit = useCallback(async () => {
  setProcessing(true);
  await new Promise((r) => setTimeout(r, 2200)); // ← FAKE
  const id = "CMN-" + Date.now().toString(36).toUpperCase(); // ← FAKE ID
  setReservationId(id);
  router.push(`/booking/confirmed?id=${id}`);
}, [router, setReservationId]);
```

Problemas:
1. Ninguna reserva se guarda en base de datos
2. El precio total **lo calcula el frontend** (violación del principio Zero Trust)
3. No hay pago real — se puede saltear completamente
4. El ID generado es ficticio y no vincula a ningún registro

### Endpoint de backend disponible

```
POST /api/v1/reservations
  Headers: Authorization: Bearer <JWT>
  Body: {
    vehicleId: UUID,
    pickupDate: ISO8601,
    returnDate: ISO8601,
    pickupLocation: "CMN_T1" | "CMN_T2",
    customerName: string,
    customerPhone: string,
  }
  Response 201: {
    id: UUID,
    status: "PENDING_DEPOSIT",
    totalPriceEurCents: number,
    depositAmountEurCents: 1000,   // 10€ fijo
    stripeClientSecret: string,    // para Stripe Elements
  }
```

---

## Arquitectura del flujo real

```
Step 1 (Resumen)     → El usuario revisa vehículo, fechas y precio (calculado por Store)
Step 2 (Contacto)    → El usuario escribe nombre y teléfono
Step 3 (Pago)        →
  [Frontend]
    1. Llama POST /api/v1/reservations con JWT + datos de Step 2
       → Recibe: { id, stripeClientSecret, totalPriceEurCents }
    2. Inicializa Stripe Elements con stripeClientSecret
    3. Muestra CardElement de Stripe (no inputs de tarjeta custom)
    4. Usuario hace clic en "Pagar 10€"
    5. stripe.confirmCardPayment(clientSecret) → Stripe procesa
    6. Si success → router.push('/booking/confirmed?id=<UUID>')

  [Backend — async via Webhook]
    Stripe → POST /api/v1/webhooks/stripe
    → payment_intent.succeeded → reserva pasa a CONFIRMED
```

---

## Tareas

### T3-1 — Instalar Stripe.js en el frontend

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

Añadir a `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXX
```

### T3-2 — Crear `StripeProvider` wrapper

Inicializar Stripe una sola vez a nivel de layout o de página de booking:

```typescript
// src/components/shared/StripeProvider.tsx (nuevo archivo)
'use client';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeProvider({ children, clientSecret }: {
  children: React.ReactNode;
  clientSecret: string;
}) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      {children}
    </Elements>
  );
}
```

### T3-3 — Adaptar `BookFlowClient.tsx` — Step 3

**Cambios en el componente:**

1. **Añadir estado** para el `clientSecret` y el `reservationId` real:
   ```typescript
   const [clientSecret, setClientSecret] = useState<string | null>(null);
   const [serverReservationId, setServerReservationId] = useState<string | null>(null);
   ```

2. **Al avanzar de Step 2 a Step 3** (botón "Continuar al pago"), hacer la llamada al backend:
   ```typescript
   async function handleContactNext() {
     if (!contactValid) return;
     setProcessing(true);
     try {
       const res = await apiFetch<{
         id: string;
         stripeClientSecret: string;
         totalPriceEurCents: number;
       }>('/reservations', {
         method: 'POST',
         auth: true,  // adjunta JWT
         body: JSON.stringify({
           vehicleId: vehicle.id,
           pickupDate: new Date(pickupDate!).toISOString(),
           returnDate: new Date(returnDate!).toISOString(),
           pickupLocation,
           customerName: name,
           customerPhone: phone,
         }),
       });
       setClientSecret(res.stripeClientSecret);
       setServerReservationId(res.id);
       goNext();
     } catch (err) {
       toast.error('No se pudo iniciar la reserva. Inténtalo de nuevo.');
     } finally {
       setProcessing(false);
     }
   }
   ```

3. **Step 3 renderiza `<StripeProvider>` + `<PaymentStep>`** en lugar de los inputs de tarjeta custom.

### T3-4 — Crear `PaymentStep` con Stripe Elements

```typescript
// src/components/vehicles/PaymentStep.tsx (nuevo archivo)
'use client';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { toast } from 'sonner';
import { DEPOSIT_AMOUNT_EUR } from '@/lib/constants';

interface Props {
  reservationId: string;
  onSuccess: () => void;
}

export default function PaymentStep({ reservationId, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error } = await stripe.confirmCardPayment(undefined, {
      payment_method: { card: elements.getElement(CardElement)! },
    });
    if (error) {
      toast.error(error.message ?? 'Error al procesar el pago.');
    } else {
      onSuccess();
    }
    setProcessing(false);
  }

  return (
    <div className="space-y-4">
      <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      <button onClick={handlePay} disabled={processing}>
        {processing ? 'Procesando...' : `Pagar ${DEPOSIT_AMOUNT_EUR}€`}
      </button>
    </div>
  );
}
```

### T3-5 — Flujo post-pago

Tras `stripe.confirmCardPayment` exitoso:
```typescript
function handlePaymentSuccess() {
  setReservationId(serverReservationId!); // en useBookingStore
  router.push(`/booking/confirmed?id=${serverReservationId}`);
}
```

> **Nota crítica**: el `payment_intent.succeeded` llega al webhook del backend de forma async. El frontend NO debe esperar al webhook. Lo que hace es mostrar la pantalla de confirmación inmediatamente — el backend actualizará el estado cuando reciba el webhook.

### T3-6 — Página `/booking/confirmed` — limpiar mock

`src/app/booking/confirmed/page.tsx` actualmente usa:
```typescript
const vehicle = MOCK_VEHICLES.find((v) => v.id === selectedVehicleId);
```

Cambiar por un fetch real del vehículo (ya disponible tras INT-SPRINT 2):
```typescript
// Server Component o Client Component con SWR
const reservation = await apiFetch<Reservation>(`/reservations/${id}`, { auth: true });
```

O bien, pasar los datos necesarios desde el store (ya tiene `selectedVehicleId`, fechas, precio) y mostrar confirmación sin fetch adicional — suficiente para el MVP.

### T3-7 — Manejo de error: usuario no autenticado

Si el usuario llega a `/book/:id` sin JWT:
- El middleware `proxy.ts` ya lo redirige a `/login?redirect=/book/:id`
- Tras login, vuelve al booking con las fechas del store preservadas (Zustand las persiste en localStorage)

### T3-8 — Prevenir double-submit

Deshabilitar el botón "Continuar al pago" tras el primer click hasta recibir respuesta del backend, para evitar crear reservas duplicadas. El backend tiene protección por ACID + lock pesimista, pero también el frontend debe prevenir.

---

## Criterios de aceptación

- [ ] El flujo de 3 pasos termina con reserva real en PostgreSQL
- [ ] El precio total es calculado y validado por el servidor (el frontend solo muestra lo que devuelve el server)
- [ ] Los inputs de tarjeta son Stripe CardElement (no inputs custom con estado local)
- [ ] `stripe.confirmCardPayment` se llama con el `clientSecret` real del PaymentIntent
- [ ] La pantalla de confirmación muestra el ID real de reserva (UUID)
- [ ] Mock `setTimeout + ID fake` eliminado completamente
- [ ] Double-submit prevenido en UI

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `src/components/vehicles/BookFlowClient.tsx` | Reescribir Step 2→3 y `handleSubmit` |
| `src/app/book/[vehicleId]/page.tsx` | Wrappear con auth (redirige a login si no hay JWT) |
| `src/app/booking/confirmed/page.tsx` | Usar UUID real del server, eliminar mock |

| Archivo | Crear |
|---|---|
| `src/components/shared/StripeProvider.tsx` | Wrapper de Stripe Elements |
| `src/components/vehicles/PaymentStep.tsx` | Componente de pago con CardElement |

---

## Dependencias
- **Requiere**: INT-SPRINT 1 (JWT para llamar `/api/v1/reservations`)
- **Requiere**: INT-SPRINT 2 (vehículo resuelto por UUID real)
- **Requiere**: Backend corriendo con `STRIPE_SECRET_KEY` configurado
- **Requiere en .env.local**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
