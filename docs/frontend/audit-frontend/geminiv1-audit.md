# **Informe de Auditoría y Análisis Arquitectónico: Casablanca-V1**

Este documento presenta una evaluación exhaustiva y profunda de las especificaciones del frontend para el proyecto **Casablanca-V1**. Se asume el contexto de una plataforma transaccional de alta gama orientada a operaciones aeroportuarias de misión crítica en tiempo real, donde la tolerancia a fallos debe ser mínima debido a las condiciones de conectividad variables de un aeropuerto internacional.

## **1\. Evaluación General y Nivel de Madurez**

* **Nivel de Competencia de la Documentación:** **Excelente (Outstanding)**.  
* **Valoración Inicial:** El documento demuestra un rigor de ingeniería de software sobresaliente. La erradicación sistemática de "mops" (mocks) en producción, la centralización del estado transaccional en el backend, la decisión de utilizar el patrón de proxies de cookies HttpOnly para la seguridad de tokens y la arquitectura desacoplada mediante adaptadores reflejan prácticas de nivel técnico senior.

### **Rúbrica de Evaluación de Arquitectura y UX**

| Criterio | Puntuación | Estado | Observación |
| :---- | :---- | :---- | :---- |
| **1\. Seguridad y Autenticación** | 10 / 10 | **Excelente** | El proxy de cookies HttpOnly mitiga ataques XSS de forma robusta. |
| **2\. Arquitectura de Estado y Datos** | 9 / 10 | **Sobresaliente** | Reglas claras de "verdad única", aunque requiere detallar la resiliencia offline. |
| **3\. UX Transaccional y de Flujos** | 10 / 10 | **Excelente** | Alineación perfecta entre las heurísticas de usabilidad y los objetivos de negocio. |
| **4\. Integración de API y Rendimiento** | 8.5 / 10 | **Fuerte** | Excelente manejo del Critical Rendering Path. Falta definir la política de reintentos asíncronos. |

## **2\. Puntos Fuertes de la Arquitectura Propuesta**

Antes de profundizar en los puntos débiles y vulnerabilidades de implementación, es crucial validar las decisiones arquitectónicas sobresalientes de esta documentación:

1. **La prohibición de guardar entidades en localStorage:** Evita condiciones de carrera críticas donde el usuario ve un estado obsoleto de su reserva (ej. CONFIRMED en local pero cancelada en backend).  
2. **El Proxy de Server-Sent Events (SSE):** Dado que EventSource no admite de manera nativa cabeceras HTTP de autorización (Bearer tokens), el proxy en Next.js (/api/sse/\*) es la solución de ingeniería correcta para interceptar la petición, leer la cookie segura HttpOnly, inyectar el token en la cabecera hacia el backend de NestJS y hacer un streaming limpio hacia el cliente.  
3. **Uso de Claves de Idempotencia (Idempotency-Key):** Indispensable para mitigar la duplicidad de reservas bajo redes inestables (como datos móviles 3G/4G dentro de la terminal del aeropuerto).

## **3\. Diagnóstico Profundo: 3 Puntos de Vulnerabilidad Técnica y UX**

A pesar del excelente nivel del documento, existen tres áreas críticas de diseño técnico que pueden fallar durante la fase de implementación si no se especifican con precisión matemática y lógica de control de flujo.

### **Área 1: Sincronización y Resiliencia en Conectividad Aeroportuaria (SSE \+ HTTP fallback)**

* **El Problema:** El usuario que acaba de aterrizar en el Aeropuerto Mohammed V suele experimentar alta latencia, conmutación constante entre redes Wi-Fi públicas saturadas y datos móviles, o pérdida de señal en la zona de aduanas. Si el estado de la verificación de sus documentos se actualiza mediante SSE (/sse/reservation/:id), un microcorte puede dejar al cliente en un limbo visual permanente en el estado de espera (/reservations/\[id\]/waiting).  
* **Consecuencia:** El usuario cree que sus documentos siguen "en revisión" cuando el operador ya los ha rechazado o aprobado, incrementando la fricción y la ansiedad en el mostrador.  
* **Acción Requerida:** Establecer un modelo matemático de reintento exponencial (Exponential Backoff con Jitter) para la reconexión de SSE en el cliente y un mecanismo automático de validación mediante sondeo pasivo (*polling*) si el canal de comunicación en tiempo real falla tras ![][image1] reintentos.

La latencia de reconexión ![][image2] debe modelarse de la siguiente forma:

### **![][image3]Área 2: Gestión y Ciclo de Vida de la Idempotency-Key**

* **El Problema:** El documento indica que se debe enviar un Idempotency-Key para crear reservas (POST /reservations), pero no define dónde nace, cómo se genera ni cuándo expira este identificador único.  
* **Consecuencia:** Si la clave de idempotencia se genera en el nivel de componente de React durante el envío del formulario, una recarga de la página (F5) por desesperación del usuario debido a la lentitud del proceso generará una clave *nueva*, rompiendo el propósito de la idempotencia y creando múltiples reservas idénticas y cargos duplicados en Stripe.  
* **Acción Requerida:** La clave de idempotencia debe estar vinculada directamente al ciclo de vida del borrador de la reserva (Booking Draft) gestionado por Zustand/SessionStorage. Debe generarse una única vez al iniciar el paso final del checkout y persistir inalterada incluso ante recargas de página, hasta que se reciba una respuesta HTTP exitosa (![][image4]) o un error de validación insalvable (![][image5]).

### **Área 3: Serialización de Modelos y el Abismo de SSR a CSR en Next.js**

* **El Problema:** Pasar "adapted view models" desde Server Components (SSR) a Client Components (CSR) en Next.js App Router es una excelente práctica para la separación de conceptos. Sin embargo, si los adaptadores de datos transforman tipos complejos de NestJS (como objetos Date nativos, BigInts o estructuras de clases con métodos propios), Next.js fallará ruidosamente al intentar serializarlos para el cliente: *"Only plain objects can be passed to Client Components from Server Components"*.  
* **Consecuencia:** Errores en tiempo de compilación o de hidratación (Hydration Mismatch) que bloquean por completo el renderizado de la UI.  
* **Acción Requerida:** Especificar que todos los adaptadores que operen en el límite de SSR/CSR deben devolver JSONs planos e inmutables. Por ejemplo, las fechas deben serializarse estrictamente a hilos ISO-8601 (string) en el adaptador antes de cruzar la frontera del servidor.

## **4\. Arquitectura Detallada de Datos y Flujo de Autenticación**

Para asegurar que tu agente de IA implemente de forma exacta el proxy de autenticación segura propuesto en el documento, se detalla a continuación el diagrama de secuencia e interacción de cookies:

  \[ Navegador / Cliente \]           \[ Next.js API Proxy \]         \[ Hardened NestJS Backend \]  
          |                                 |                                 |  
          |--- 1\. POST /login \-------------\>|                                 |  
          |    (user, pass)                 |--- 2\. POST /auth/login \--------\>|  
          |                                 |    (forwarded credentials)      |  
          |                                 |\<-- 3\. Retorna Tokens \-----------|  
          |                                 |    (Access & Refresh JWTs)      |  
          |                                 |                                 |  
          |                                 |-- \[Genera Cookies HttpOnly\]     |  
          |                                 |   \- nexus\_token (Session)       |  
          |                                 |   \- nexus\_refresh (Largo plazo) |  
          |\<-- 4\. Retorna status 200 \-------|                                 |  
          |    (Sin tokens en el body)      |                                 |  
          |                                 |                                 |  
          |--- 5\. GET /api/v1/profile \-----\>|                                 |  
          |    (Envía cookies auto)         |--- 6\. Inyecta Auth Header \-----\>|  
          |                                 |    Authorization: Bearer \<JWT\>  |  
          |                                 |\<-- 7\. Retorna Perfil (200) \-----|  
          |\<-- 8\. Retorna Datos \------------|                                 |

## **5\. Directivas de Implementación para el Agente de IA**

Cuando configures a tu Agente de Desarrollo (Cursor, Windsurf, etc.), indícale explícitamente que ejecute y respete las siguientes reglas de implementación detalladas:

### **1\. Manejo Estricto de los 5 Estados de la UI**

Para cada componente inteligente que consuma APIs asíncronas, el agente deberá implementar de forma mandatoria la interfaz de estados mediante patrones declarativos:

interface UIState\<T\> {  
  data: T | null;  
  isLoading: boolean;  
  error: Error | null;  
  isEmpty: boolean;  
}

* **Prohibido:** Mostrar contenedores vacíos o indicadores de carga indefinidos sin la silueta (*Skeleton*) estructurada que coincida pixel por pixel con el diseño final.

### **2\. Contrato de Adaptadores Obligatorio**

Cada servicio de datos debe declarar un adaptador explícito que asile la respuesta del Backend del modelo visual de la UI. Ejemplo para el catálogo de vehículos:

// types/api.ts  
export interface VehicleDTO {  
  id: string;  
  make: string;  
  model: string;  
  daily\_rate\_cents: number;  
  is\_available: boolean;  
  license\_plate?: string; // Solo para operadores/admins  
}

// types/view.ts  
export interface VehicleViewModel {  
  id: string;  
  fullName: string; // "Make Model"  
  formattedPriceEUR: string; // "120.00 €"  
  isAvailable: boolean;  
}

// adapters/vehicle.adapter.ts  
export const mapVehicleToVM \= (dto: VehicleDTO): VehicleViewModel \=\> ({  
  id: dto.id,  
  fullName: \`${dto.make} ${dto.model}\`,  
  formattedPriceEUR: \`${(dto.daily\_rate\_cents / 100).toFixed(2)} €\`,  
  isAvailable: dto.is\_available,  
});

### **3\. Mecanismo de Reintento de Token Expirado (Silent Refresh)**

El middleware o proxy de Next.js (/api/v1/\[...path\]) debe implementar un interceptor que capture respuestas con código HTTP ![][image6] (Unauthorized) provenientes del backend de NestJS.

* Al detectar un ![][image6], el proxy debe congelar la petición original, realizar de forma transparente una petición interna a /api/auth/refresh enviando la cookie segura nexus\_refresh, actualizar las cookies de sesión y reintentar la petición original con el nuevo token de acceso antes de retornar cualquier respuesta al navegador.

## **6\. Conclusión de la Auditoría**

La estrategia de migración planteada es **altamente viable y recomendada**. Pasar del modelo SPA desestructurado del actual frontend "Emergent" a un Next.js App Router sólido, conectado con el backend a nivel de red y utilizando cookies seguras para la autenticación, corregirá las principales deficiencias de seguridad y rendimiento que suelen hundir a los SaaS jóvenes.

Al ceñirte estrictamente a este plan y no permitir la inyección de lógicas simuladas (*mocks*) en las rutas de producción, asegurarás un producto final robusto, escalable y preparado para una operación real óptima en el aeropuerto de Casablanca.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAABS0lEQVR4XmNgGAUUAXl5eUcgfg3E/0FYTk5uh4yMDCdMXkVFhU9BQWEXTB6K14mLi3Mjm4MMGIEKZgHxLyD+CcSW6AqAYkFAvAbZIqwA6BpBoO0LgXQ+1OYpQGFGZDVAsSIgjkYWwwoUFRX1gQb1AxVLAvF1IH4CxIpISliA/NkgdUhi2AHIRqDL0kFsIN0AdV0OTF5KSkoE6nJBhC4cAKixD6jQGMSWlZXVAfLfA/EJJSUlfpAYUM4GyJ+MqgsLgIUXyHaoEMhLy4H4H1DcAyQAcjVJ4cWAFOAgQ0CGgQwFxR5Z4QUDIO+BvAn1rhOx4QVKX5OB4WSKLgHUHCMPiYhrQMM60eUxAJbwggOgt8TlIckEZCDh8AJ5AYjXAQ3jQpcDAWgyeQvEmuhycAB0kQtQwReorSAMykLe6OpAyQSUV4kJr1EwCoYMAABopFha15uM6gAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAaCAYAAAD/nKG4AAAD0UlEQVR4Xu2Y62uOYRzHn6chxxxn7PDce7axjBKLci42hxeksVJDiqYcM2VSpKRQTkNJarFsSCHMYWU0eUF5oRxeUNof4IV4pfD57v5dj9vtsCfxguf+1rfrur7X7zr9rt/1e+4tFosQIUKEfwye582GrxOJRGearAjPkSmI46jjhYWFF2Ch2hLRTsNPSPPNLov6LLQ3BQUFk1KjMwnJZDIHB1wsLi4e7jQiZzDaYzkmPz8/z+nZ2dn90Zry8vLynZZR0JMiYrYENRw4Hqe8g5do9nC6ObGhtLR0QMA8c4ADqouKikYHNRxSAz/TVx/UiaihaLUxe6oRYql89RHHTA/3RQjgZ/kqwg+As8px1IdwvvpfkZub25ciK6ynhZ/lq/8R5OqBnPOWAiTclw7iDGzMlHxlv/odRNewcF+36C5flZSUZPOZcRS7zdhUwWY4RX3Y96FvmZ4vPKhbs2FxfdiiNeki3C+vNkh7F/p1uFXjKZOaE30pnGYfykfcXGgL6b9IOZZyDbxJ/yqtYWvJAaXoBzQvdpVO50O6mPZheAWbasptjL1D2akz8Z1Z4GzTgsLR+0W+on85i86g/zkLzqW8zEK7dRjV4RLZoS2mviDmR+o26jtycnL6mU0dYym8GzholOzVj91G0eZ95dklMNcZOUmXh7babG/THkJ9JLyn0uapwv6q9qNvQdp7tC5zTpaTbMxqOcn200B9beqA3UE3zaAn8C38HOB7+EIOdLY6nKJEi+lrXpsqLy/vqQWxfYXtCljvWWRRTqHvqUVpXJu1CGqRnZvXxpy1+dfSbpS91rDbr9BY5kxgd40LW2TjdLkPFKUi9WfwEKyh76T2avt46MZoTjHhv6K7f/VPNzvY3qCm24f7Y6GPVbP9Jko9PxqeJ77mxB6yMee5nFmjDg4yjvZ9l1MsujrQimyuDbBBdXPcSxetDqZrva4xDmhjYPtv5at0gEN6s8A1z39iKWjDdlhnN8KeWh084XTdMrlhmg7sDsW4sXKI7O2223RA6+u6GMo59M+Ug2m3uuhQXWkBfRP1qaz7yLMnCfQPgonGh8q3QZ0xKynP6WVQrgvk2D+DpP9HdztMhnQd9Lznh389m96u52YOu2wbW6/o059MlFton0KvpWx2ST/p/zq1uo1T35rwk/JmO1QdY3erz5zVAneizYv5UbmJ+j7tAx6T0y1NHKG9I6jDSuptpk/4epo/h7gSY1g0ZCmktbmQ3pWrwrqiFA4KajF/Dn0kpmDrdT3vsrKyXqF5vrO3PBeeN5WrgprmDu8rQoQIESJkIL4AQjQYARf3W68AAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,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>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAaCAYAAADSbo4CAAACcUlEQVR4Xu2UTYhNYRjHz2lG+SpJ123u17n3XNGkWJwioWwo5SvKZgrNxgYNk5l8FVsLMglNSliQRpSmIZKFlSllYyP5aEo2FmrULHT9/s7z6nQ605Xc3fnXv/d9nud/nvd5n/d9j+flyPGXCIKgB56Bo/V6/VylUlmW1nQcjUZjDQU8rVarG5mvZj4OW3CQsJ/WdwTsfF6tVnvIov2YXfKVy+UldOUVvmliUeqTzsCO5BP8rm4k/CetK8eS+o4hiqI57P4SO3+iopwfe1iFaEzq1S1828MwXI7pF4vFBWxgS9adajabVbTbNMrWt+TcmlynHboRj8GfFLnJOZnvwncH9sGX8AoL3WU8BD8ktD7zAWJX4T5ib+F5eAt7iPEdxa9weWcFSdYinoaj6ph8JFiJfTlhq2MzcB0cgS0u+w6LbcY+7dlFJ99N7CnYG8QPof3do+WLED6Dt9V25+fDvXpVziZ+HU7iX6xjYrH9uvimPWJH5ymH5RvD7Ca2Hu1Ozx5GJrRbhNf46IJLmgUtbkXc8No8bzQh2i/qYDqWCVcE1Z7wrFq1UhcxJVXySO2FfelYGjoudDN8syEdy4KPeJAijmrunNgH8e/WXAUxvwd7zP/nnO1fdJHXsdRy9WtThUJhYRDfn49oytJKI22pVJrv1nHQDT+A+AecQvTZEfubdpI4568UtIrxQRD/e34/Q8Y9gV1O4kXm7+EbvQzG1/CFilKc+fEgq5NKZklbGdTZhkpAsWexn9fiv/ApOGHUcx5xF9v+S3olj9A+hoeZTwbx7+C+jt69vH+Frx+S7SzLTqJLR8Cic2exc+TIkeO/4xcECa0QCy7VhwAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAZCAYAAACSP2gVAAAEe0lEQVR4Xu1XW4iNURQ+JxQRuYyTmTNn/+fMRFNkdFxSeELmgeQS4VUjKaFGhjK5JBNiSmpGRE3Ny3giDxRREg+eUC65NI0onlBoGt/3/2tlz5pzkxfxf7U6Z39rrb3XXnvtfdZJJGLE+JeQTKVSYy0ZQ1BbWzvTOXcIX5NW91chl8tNyGQyF9Pp9Cyry2azM7CJdkgnZBNsxlgbctSJTTt9rE0hwHZ/EAQrLK/APA5x9dTV1U31ebNeB2yWgh7h2xAm9j2QadamEiQR5D44f8FCeV8Bbi3kCfSNVVVV4/D9MOQGE6o2/E6OOtrQlj709eeyEL8L1dXVU6yOyOfzo3hosHnjb0z8rkC3FRVYh8+DGA9ArvtxSey9SNJs2C3G90eQ75A1alMRsKEFcPrkTIJwarXgnkM2Kwf9RIwfQnZ43F5y1ClHH8hTBJdSzoKnjrXbLK+Afj3m+OFMgrg25HJ9ff14oZIuOrhBxkKC62J8VyorvL6ounpw/dwT96bzlYScRpeLSnBIgmSTtqoYTDfkNqtFE4aNXvJs+LbMA/8Zn6t83gPnYekvtAoC8wUS01VnEsS1MB6E7FZO1vsKuclHnzEzdshL75A0dvo2qW8p0GE3ZK1UgU1Qh+UICfAd+Bw+GyAfbYK8AI/6vIJBw+aifyUUvFrwOwmb+bKWTdBqjB/Df5ly3nrhwcnB93INjj3fMLngVypXFAyAgchdH5YgmaxYgkJeAyuWIMsrwG+EfrvlCRe9HawOvo3DElQILqr2Qe7H6hSZX8/Dez7eVj8EkuFOBBBwbBMkD/Jtn1OYBK1kYDYRZRI0Erqz/Im3CgQOlevSyqokQbSF3R3IM/pbvQL6DZhnALG1JORdKgaezC4YrlfCJoj3GOOb5RKEz6bfTVAmuppd0I32eblaJ8AvUK6CBCW5YehfQBqsUiGJf4r52riO1Q8BDOc4uVrK2QQRfiKUs3yxRBTjCXDNzvtlVPBBd3K1lCuXIBddx7uwC6xOIbflGmLamSjQKw0D5toG47e+YILPLrrDH7ggGzN8HtVEGH8G3VdTU5OWanhnE6EJgrT6vDR45yFZnyfAnSoQF/sWxtWPcY//t8RFybmOOSdxLM/C5sCrTE0OuA0JSTyqaQnGjWpTETIFKkhOlHeWvUQILs4FZdHR3lsVjtWOPtyc7yt8HnZnEmXeAIUcxrAKkh+YbtMYNvhz84ZgfNqZxhDjI2wLfK4s4NQK+eo7okImY4EHgdfMSbPVB26jctj0FjltrYqkixq3+/Zn3JX5a2HAedi3hNWqJBPhojfng6k2NrthWyHJacP4m7Hpg7zG99yvZUpATprXalCELfs9/e+DhM3F+BXsWiDrXNQUHvffL2kTzkF3K4h6FCbncWDKWP/vZUt01wr4bnPRhjUuVmN4xaSqlLcSvm2sVBddcaunDOn6/xgMCptazs2XaNGTSMB0JpF3vNAvBXSLENwBy8cQIEHHXJG/Fv89eK14veybFEPAhxnSbPkYAj6erkSnGyNGjP8GPwELZ6iuZxda6wAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAZCAYAAADJ9/UkAAABzElEQVR4Xu2VO0sDQRSFk0JQFEQkBsluNtkIYiEo6wOsxVICURD9AyI2WihaCWKhYGMZC7HIT7BSJCBYmM7CxkKUgGBhFe1C/C7ZgXWyCRvTWOyBw86c+zgzw2QSiYQIAWzb7k8mkxeGYYzrsXQ6PWpZ1gnMw1VyevQchVQdK7reClEK9mj8xQIcbwAtB5+IT8RisT7Gh/BaFuvJGYMb8BZWyb309mgJkmcp+tTNM5mMifYM15RGfIB5CW4qTczpkeU7B8uBzWUHFJxb9SP9ZS6mugaiaAVYlJPw6JI/DF+DmkujbZjDYFc3Yn6mawJpjv6Obnv1tsy5SDMknzqO0+Vn7po0M2/QA5u7x50nMSVz3dy9XEU/k07N5XZvUbysBN08Ho/3Mr/xM+nInIRJyz1upenmgmYmzfRA5gTXKXzzkqIKrMEPeMfPbIjvkZ+Ja15OJBKGVw9k7ge/nZumuYhWRZtXGo270a6EMla64M/mFO3DbwynlcbOBmn0AA+UxtM6IrtO+TyhyhwWmEb1eANkV1b9qGsuq/Bejl3iLGaK+Qt5O3CJcQnjY+2+SI+yW6v6VMh79PuvaAty83kTFmiWlSdXj4cIEeLf4Qfwtq7FLyNg5AAAAABJRU5ErkJggg==>