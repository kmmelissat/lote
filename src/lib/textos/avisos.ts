// Cuerpos de las plantillas de WhatsApp. Son exactamente el texto que se manda a aprobar a Meta:
// {{1}}, {{2}}… son los datos que se rellenan. Si cambiás uno, hay que volver a pedir su aprobación.
export const avisos = {
  apartado_nuevo:
    "Tenés un nuevo apartado en tu vitrina de Lote. {{1}} apartó {{2}} y tiene {{3}} para pagarlo. Revisalo en la sección de pedidos para confirmar el pago o liberar el producto.",
  apartado_por_vencer:
    "Aviso de Lote: el apartado de {{1}} ({{2}}) vence en {{3}}. Escribile para recordarle que tiene que pagar, o liberá el producto desde la sección de pedidos si ya no lo quiere.",
  apartado_vencido:
    "Aviso de Lote: el apartado de {{1}} ({{2}}) venció porque no se recibió el pago a tiempo. El producto ya volvió a estar disponible en tu vitrina para que otra persona lo aparte.",
  resumen_semanal:
    "Este es el resumen de tu semana en Lote: vendiste {{1}} y te quedaron {{2}} de ganancia después de gastos. El producto que más te dejó fue {{3}}. Entrá a la sección de ganancia para ver el detalle completo.",
  pedido_enviado:
    "Hola {{1}}! Te escribimos de parte de {{2}}: tu pedido ya salió y va en camino. Tu número de guía para darle seguimiento es {{3}}. Si tenés cualquier duda, escribile directamente al negocio.",
  recordatorio_abono:
    "Hola {{1}}! Te recordamos que todavía tenés un saldo pendiente de {{2}} en tu pedido con {{3}}. Podés completar el pago con los datos que ya te enviaron cuando hiciste tu abono, y así asegurar tu producto.",
} as const;
