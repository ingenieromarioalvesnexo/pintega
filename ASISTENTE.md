# Asistente de catálogo

El chat usa una Pages Function en `/api/chat`, un binding Workers AI llamado `AI` y el modelo `@cf/meta/llama-3.1-8b-instruct-fp8-fast`. `wrangler.jsonc` declara el binding para el despliegue de Pages. No usa claves externas ni requiere un plan de pago.

El catálogo público se encuentra en `js/catalogue.json`: actualizarlo al añadir o modificar fichas. El servidor importa ese archivo; nunca acepta características técnicas aportadas por el navegador como fuente autorizada. Se seleccionan hasta cuatro fichas por consulta. Los enlaces de producto, PDF y correo se generan desde datos verificados, no desde la salida de la IA.

La conversación se conserva únicamente en memoria de la pestaña y se puede borrar. Se envía la pregunta y hasta dos preguntas anteriores al endpoint del mismo sitio. El modelo recibe esos textos y las fichas seleccionadas. No se guardan conversaciones en una base de datos propia ni se registran preguntas desde el código de aplicación. El proveedor puede procesar datos y metadatos conforme a su política. No introducir datos personales.

Los precios, disponibilidad, plazos y compatibilidades se derivan al correo. Las discrepancias de las fichas se incluyen en el contexto. Las respuestas de IA son orientativas y no sustituyen la confirmación comercial/técnica.

Se limitan longitud de consulta, contexto y respuesta. Hay un límite orientativo de seis solicitudes de IA por minuto e IP, en memoria de cada instancia: no es un contador distribuido. El techo global gratuito es la cuota de Workers AI de la cuenta en Workers Free. No activar Workers Paid si se necesita mantener el corte sin cargos por exceso. No se puede asegurar un número fijo de conversaciones por día.

Si no hay binding, se agota la cuota o el servicio falla, se muestran fichas exactas del catálogo y se indica que la IA no está disponible. Este modo no simula una respuesta de IA.

Comprobación: GET `/api/chat` informa de si existe el binding (no consume inferencia). Una consulta POST debe devolver `mode: "ai"` para verificar inferencia real. Si devuelve `catalogue`, revisar el binding, disponibilidad y cuota en Cloudflare.

Si Cloudflare pide activarlo manualmente: Workers & Pages → pintega → Settings → Bindings → Add → Workers AI; nombre `AI`; guardar y volver a desplegar. No publicar tokens ni pegarlos en el código.
