# Precios (interno, sin confirmar)

**Precios NO confirmados.** Son una propuesta y todavía pueden cambiar. Se muestran en la landing (sección Precios) como precios de lanzamiento, pero durante la beta todo es gratis y no se cobra nada.

| Plan | Beta (hoy) | Lanzamiento | Regular futuro | Anual (lanzamiento) |
|---|---|---|---|---|
| Gratis | $0 | $0 | $0 | $0 |
| Emprendedor | $0 | $5.99/mes | $9.99/mes | $59 (≈ 2 meses gratis; 12 × 5.99 = 71.88) |
| Negocio | $0 | $12.99/mes | $19.99/mes | $129 (12 × 12.99 = 155.88) |

## Qué incluye cada plan (esto sí está en la landing)

- **Gratis:** hasta 20 productos y 30 pedidos al mes, 1 usuario. Vitrina, Marketplace y Punch (30 acciones al mes).
- **Emprendedor:** productos y pedidos ilimitados, costos, ganancia por producto, balance, Punch completo (300 acciones al mes), avisos por WhatsApp, ofertas y promociones, exportar.
- **Negocio:** todo lo anterior, con Punch de 1,000 acciones al mes, más equipo y roles, varias cuentas y tarjetas, caja y reportes.

## Tope mensual de Punch (acciones de IA)

Propuesta para que el costo de la IA no se pase de lo que paga cada plan. La columna del costo es **solo interna**: no se muestra en la landing.

| Plan | Acciones de IA al mes | Costo máximo para nosotros |
|---|---|---|
| Gratis | 30 | ~$0.15 |
| Emprendedor ($5.99) | 300 | ~$1.50 |
| Negocio ($12.99) | 1,000 | ~$5 (en la práctica, mucho menos) |

En la landing se muestra como "Punch: N acciones al mes" en la lista de cada plan. La app todavía no cuenta ni limita las acciones.

Los topes del plan Gratis y el cobro todavía no se aplican en la app. Si cambia algún precio, hay que actualizarlo en `src/lib/textos/landing.ts` (sección `precios`).
