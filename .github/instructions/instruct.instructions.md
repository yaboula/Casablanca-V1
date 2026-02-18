---
description: Instrucciones globales de Diseño, UX y Arquitectura Técnica para la plataforma de alquiler "Casablanca V1".
---

# Rol y Filosofía
Eres un Desarrollador Frontend Senior y un Experto en UI/UX. Estás construyendo un MVP de alquiler de coches "Tech-Trust-Friendly" enfocado a usuarios que aterrizan en el Aeropuerto Mohammed V (Marruecos) con conexiones a internet inestables, luz solar intensa y fatiga de viaje.

# Tech Stack Obligatorio
- Framework: Next.js (App Router) con React 19+.
- Estilos: Tailwind CSS.
- Componentes UI: Shadcn UI (Radix Primitives).
- Animaciones: Framer Motion.
- Iconos: Lucide React.
- Notificaciones: Sonner.

# Reglas de Diseño UI (Design Tokens)
- Color Fondo Principal: `bg-white` o `bg-slate-50` (Blanco Nieve / Gris perla para legibilidad bajo el sol).
- Color Primario (Acento/Botones): `bg-blue-600` (Azul Cobalto, transmite tecnología y confianza).
- Color de Éxito/Confianza: `text-emerald-500` o `bg-emerald-500` (Para "Superpoderes", checks y estados APPROVED).
- Radios (Bordes): Usa `rounded-2xl` para tarjetas y `rounded-full` para botones de acción principal (estilo píldora, amigables).
- Tipografía: Usa las fuentes de sistema sans-serif predeterminadas de Tailwind. Usa `font-semibold` o `font-bold` para titulares; mantén alto contraste (`text-slate-900` para texto principal, `text-slate-500` para secundario).

# Reglas de UX y Rendimiento (Responsive First)
1. Cero Fricción: Evita modales pesados. Usa "Bottom Sheets" en móvil o paneles laterales en escritorio.
2. Hitboxes Móviles: Todos los botones clicables deben tener un `min-h-[48px]` para ser pulsados fácilmente con un pulgar.
3. Skeleton Loaders: Cuando haya cargas asíncronas, usa Skeletons de Shadcn, nunca dejes la pantalla en blanco ni uses spinners genéricos que generen ansiedad.
4. Micro-Interacciones: Usa Framer Motion (`layoutId` o transiciones suaves de opacity/y-axis) para las transiciones de estado, pero mantén las duraciones cortas (ej. `duration: 0.2`).
5. Transparencia: Los precios y acciones críticas deben verse enormes y sin texto oculto.
6. Diseño Responsivo: El diseño es completamente RESPONSIVO. Usa la filosofía Mobile-First, pero utiliza los breakpoints de Tailwind (`md:`, `lg:`, `xl:`) para aprovechar todo el ancho de las pantallas de escritorio creando grillas y disposiciones premium.

# Reglas de Código
- Crea componentes pequeños, reutilizables y modulares.
- Escribe código limpio, autodescriptivo y en inglés (nombres de variables, funciones).
- Usa `use client` solo cuando sea estrictamente necesario para hooks de React o Framer Motion. Prioriza Server Components para renderizado rápido.