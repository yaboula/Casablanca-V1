# Casablanca V1  Plataforma de Alquiler de Coches

MVP de alquiler de coches orientado a viajeros que aterrizan en el **Aeropuerto Mohammed V (Casablanca, Marruecos)**. Diseñado para condiciones de uso exigentes: conexión inestable, luz solar intensa y usuarios con fatiga de viaje.

## Tech Stack

| Tecnología | Uso |
|-----------|------|
| **Next.js 16** (App Router) | Framework principal |
| **React 19** | UI Library |
| **TypeScript** | Tipado estático |
| **Tailwind CSS v4** | Estilos |
| **Shadcn UI** | Componentes base (Radix Primitives) |
| **Framer Motion** | Animaciones y micro-interacciones |
| **Lucide React** | Iconografía |
| **Sonner** | Notificaciones toast |

## Estructura del Proyecto

```
src/
  app/
    (customer)/         # Flujos del cliente (reserva, check-in, estado)
    (operator)/         # Flujos del operador (entregas, pagos, validaciones)
    api/                # API Routes (Next.js server)
  components/
    ui/                 # Componentes Shadcn (auto-generados)
    shared/             # Componentes reutilizables en todo el sistema
    customer/           # Componentes del flujo cliente
    operator/           # Componentes del flujo operador
  hooks/                # Custom React Hooks
  lib/                  # Utilidades y helpers
  stores/               # Estado global (Zustand)
  types/                # Definiciones TypeScript
planificacion/
  documentacion/        # PRD, RFC, User Flow y documentación del producto
```

## Primeros Pasos

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter ESLint
```

> **Filosofía:** Mobile-First · Cero Fricción · Transparencia de precios · Offline-Aware
