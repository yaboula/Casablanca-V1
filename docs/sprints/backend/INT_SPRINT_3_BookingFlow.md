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

### T3-0 — Guardia defensiva: Zustand vacío en enlace compartido

**El problema**: El `useBookingStore` persiste en `localStorage` del dispositivo. Si un usuario copia la URL `/book/abc-123` y la comparte, el destinatario abrirá esa ruta con `pickupDate = null` y `returnDate = null`. El `new Date(pickupDate!)` lanzará un error en runtime, y el backend recibirá fechas inválidas.

**Solución requerida en `src/app/book/[vehicleId]/page.tsx`** (Server Component que renderiza `BookFlowClient`):

```typescript
// src/app/book/[vehicleId]/page.tsx
import { redirect } from 'next/navigation';

// Esta comprobación ocurre en BookFlowClient.tsx (Client Component), no en el Server Component,
// porque el store es cliente. Usar un useEffect de guardia al montar:
```

```typescript
// src/components/vehicles/BookFlowClient.tsx — añadir al inicio del componente
useEffect(() => {
  const { pickupDate, returnDate } = useBookingStore.getState();
  const isValidDate = (d: unknown) =>
    typeof d === 'string' && !isNaN(Date.parse(d as string));

  if (!isValidDate(pickupDate) || !isValidDate(returnDate)) {
    // El store está vacío (enlace compartido, sesión expirada o recarga)
    router.replace('/catalog?error=select-dates');
  }
}, [router]);
```

En `src/app/catalog/page.tsx`, leer el param `error=select-dates` y mostrar un toast: _"Por favor, selecciona tus fechas primero."_

> **Nota**: El `useCallback` de `handleContactNext` ya usa `pickupDate!` — si la guardia no se ejecuta antes, Next.js puede renderizar el componente sin fechas. La guardia en `useEffect` previene esto limpiamente.

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

> **Timing importante**: `stripe.confirmCardPayment()` confirma el pago en Stripe, pero la actualización del estado en el backend ocurre vía Webhook, que es **asíncrono** (puede tardar 200ms–2s). La página `/booking/confirmed` NO puede asumir que la reserva está en `CONFIRMED` al hacer fetch inmediatamente.

### T3-6 — Página `/booking/confirmed` con polling anti-race

**El problema de concurrencia**:
```
t=0ms    stripe.confirmCardPayment() → éxito en browser
t=50ms   Frontend redirige → /booking/confirmed, hace fetch de la reserva
t=50ms   Backend: reserva todavía en PENDING_DEPOSIT  ← el fetch llega aquí
t=800ms  Webhook de Stripe llega al backend → reserva pasa a CONFIRMED
```
Sin manejo correcto, el usuario ve `PENDING_DEPOSIT` tras haber pagado — experiencia catástrofica.

**Solución: polling con estados transicionales**

```typescript
// src/app/booking/confirmed/page.tsx — lógica de polling
'use client';

type ConfirmationStatus = 'polling' | 'confirmed' | 'timeout' | 'error';

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2000;

export default function ConfirmedPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [status, setStatus] = useState<ConfirmationStatus>('polling');
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!id) { setStatus('error'); return; }
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await apiFetch<Reservation>(`/reservations/${id}`, { auth: true });
        if (res.status === 'CONFIRMED' || res.status === 'IN_PROGRESS') {
          setReservation(res);
          setStatus('confirmed');
        } else if (res.status === 'CANCELLED') {
          setStatus('error'); // pago fallido post-confirmación
        } else {
          // PENDING_DEPOSIT — el webhook aún no llegó
          attempt++;
          if (attempt >= MAX_ATTEMPTS) {
            setStatus('timeout'); // 20s sin confirmación → mostrar mensaje de espera
          } else {
            timer = setTimeout(poll, POLL_INTERVAL_MS);
          }
        }
      } catch {
        setStatus('error');
      }
    }

    poll();
    return () => clearTimeout(timer);
  }, [id]);

  if (status === 'polling') return <PollingScreen />; // spinner + "Confirmando con el banco..."
  if (status === 'timeout') return <TimeoutScreen id={id} />; // "Tu pago está siendo procesado. Recibirás un email."
  if (status === 'error') return <ErrorScreen id={id} />; // "Algo fue mal. Contacta soporte."
  return <SuccessScreen reservation={reservation!} />; // pantalla actual de éxito
}
```

**Estados de UI requeridos**:
- `polling` → spinner animado + `"Confirmando tu pago con el banco..."` (no mostrar error)
- `confirmed` → pantalla de éxito actual con QR y resumen
- `timeout` → `"Tu pago está siendo procesado. Te enviaremos confirmación por email en los próximos minutos."` + botón "Ver mis reservas"
- `error` → `"Algo fue mal. Referencia: {id}. Contacta soporte."` + WhatsApp FAB

**El mock a eliminar**:
```typescript
// Eliminar:
const vehicle = MOCK_VEHICLES.find((v) => v.id === selectedVehicleId);
```
El vehículo se obtiene de `reservation.vehicle` (populado en INT-4 T4-3) o del store.

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
- [ ] Si `pickupDate`/`returnDate` son nulos al montar → `router.replace('/catalog?error=select-dates')` (nunca `pickupDate!` sin validar)
- [ ] `/booking/confirmed` muestra spinner mientras la reserva está en `PENDING_DEPOSIT`
- [ ] Polling máx 10 intentos × 2s = 20s antes de mostrar estado `timeout`
- [ ] Estado `timeout` no muestra error — muestra mensaje de "confirmación en proceso"
- [ ] Estado `error` muestra referencia del ID y enlace a soporte

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
