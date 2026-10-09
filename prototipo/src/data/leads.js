// Lotes semanales de leads traídos de la subcuenta GHL de cada cliente (simulado, US-10).
// Solo clientes con SEM o Pauta social y onboarding terminado.
// `semana` = lunes de la semana (ISO). Hoy es 2026-10-01: el lote pendiente de casi todos
// es el de la semana 2026-09-22.
// Casos borde:
//   - gotalk y vision-clara tienen un lote viejo sin calificar (revisionLeadsAtrasadaDias).
//   - horizonte tiene GHL desconectado: su lote trae `leads: null`.
//   - sonrisa-norte y el-tornillo tienen además un lote anterior ya calificado.
// calificacion: null | 'Bueno' | 'Regular' | 'Malo'; motivo: null | string.

const lead = (id, nombre, fecha, origen, etapaGhl, primeraRespuestaMin, calificacion = null, motivo = null) => ({
  id,
  nombre,
  fecha,
  origen,
  etapaGhl,
  primeraRespuestaMin,
  calificacion,
  motivo,
});

export const etapasGhl = ['Nuevo', 'Contactado', 'Cotización enviada', 'Negociación', 'Ganado', 'Perdido'];

export const lotesLeads = [
  // ---------- Cartera de Laura Méndez ----------
  {
    id: 'lote-sonrisa-0915',
    cliente: 'sonrisa-norte',
    semana: '2026-09-15',
    estado: 'Completada',
    calificadoEl: '2026-09-23',
    leads: [
      lead('ld-sn-01', 'Paola Herrera', '2026-09-15', 'Google Ads · Ortodoncia invisible', 'Cotización enviada', 6, 'Bueno'),
      lead('ld-sn-02', 'Jorge Lozano', '2026-09-16', 'Google Ads · Implantes', 'Ganado', 4, 'Bueno'),
      lead('ld-sn-03', 'Valeria Ruiz', '2026-09-17', 'Orgánico · Blog brackets', 'Contactado', 12, 'Regular', 'Solo preguntó precios'),
      lead('ld-sn-04', 'Manuel Ortiz', '2026-09-19', 'Google Ads · Urgencias', 'Perdido', 9, 'Malo', 'Fuera de zona: vive en Soacha'),
    ],
  },
  {
    id: 'lote-sonrisa-0922',
    cliente: 'sonrisa-norte',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-sn-05', 'Camila Restrepo', '2026-09-22', 'Google Ads · Ortodoncia invisible', 'Cotización enviada', 5),
      lead('ld-sn-06', 'Andrés Salazar', '2026-09-23', 'Google Ads · Implantes', 'Contactado', 7),
      lead('ld-sn-07', 'Lucía Cárdenas', '2026-09-24', 'Email · Recordatorio limpieza', 'Ganado', 3),
      lead('ld-sn-08', 'Felipe Romero', '2026-09-25', 'Google Ads · Diseño de sonrisa', 'Nuevo', 11),
      lead('ld-sn-09', 'Daniela Pineda', '2026-09-26', 'Orgánico · Página urgencias', 'Contactado', 8),
    ],
  },
  {
    id: 'lote-tornillo-0915',
    cliente: 'el-tornillo',
    semana: '2026-09-15',
    estado: 'Completada',
    calificadoEl: '2026-09-24',
    leads: [
      lead('ld-et-01', 'Construcciones Ríos S.A.S.', '2026-09-15', 'Google Ads · Materiales para obra', 'Negociación', 22, 'Bueno'),
      lead('ld-et-02', 'Carlos Mejía', '2026-09-16', 'Meta · Descuentos de la semana', 'Perdido', 35, 'Malo', 'Buscaba una pieza suelta de $8.000'),
      lead('ld-et-03', 'Luz Marina Gil', '2026-09-17', 'Meta · Descuentos de la semana', 'Perdido', 28, 'Malo', 'B2C de bajo ticket'),
      lead('ld-et-04', 'Obras Civiles del Norte', '2026-09-18', 'Google Ads · Materiales para obra', 'Cotización enviada', 19, 'Bueno'),
      lead('ld-et-05', 'Hernán Zapata', '2026-09-19', 'Meta · Pinturas', 'Contactado', 31, 'Regular'),
    ],
  },
  {
    id: 'lote-tornillo-0922',
    cliente: 'el-tornillo',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-et-06', 'Inversiones Arango', '2026-09-22', 'Google Ads · Materiales para obra', 'Cotización enviada', 26),
      lead('ld-et-07', 'Sandra Villa', '2026-09-22', 'Meta · Descuentos de la semana', 'Contactado', 40),
      lead('ld-et-08', 'Maestro Jairo Ospina', '2026-09-23', 'Google Ads · Ferretería general', 'Ganado', 18),
      lead('ld-et-09', 'Rubén Cardona', '2026-09-24', 'Meta · Pinturas', 'Nuevo', 52),
      lead('ld-et-10', 'Remodelaciones JM', '2026-09-25', 'Google Ads · Materiales para obra', 'Negociación', 15),
      lead('ld-et-11', 'Gloria Henao', '2026-09-26', 'Meta · Descuentos de la semana', 'Perdido', 33),
    ],
  },
  {
    id: 'lote-andina-0922',
    cliente: 'seguridad-andina',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-sa-01', 'Conjunto Residencial Altamira', '2026-09-22', 'Google Ads · Vigilancia para empresas', 'Cotización enviada', 25),
      lead('ld-sa-02', 'Logística Bacatá S.A.S.', '2026-09-23', 'Google Ads · Vigilancia para empresas', 'Negociación', 30),
      lead('ld-sa-03', 'Ricardo Peña', '2026-09-24', 'Google Ads · Escoltas', 'Contactado', 18),
      lead('ld-sa-04', 'Colegio San Mateo', '2026-09-25', 'Orgánico · Página monitoreo', 'Nuevo', 41),
    ],
  },
  {
    id: 'lote-cafe-0922',
    cliente: 'cafe-tolima',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-ct-01', 'Natalia Gómez', '2026-09-22', 'Meta · Suscripción mensual', 'Ganado', 3),
      lead('ld-ct-02', 'Café Bar La Esquina', '2026-09-23', 'Meta · Café para negocios', 'Cotización enviada', 5),
      lead('ld-ct-03', 'Esteban Muñoz', '2026-09-24', 'Instagram · Orgánico', 'Contactado', 4),
      lead('ld-ct-04', 'Mariana Quintero', '2026-09-25', 'Meta · Suscripción mensual', 'Ganado', 2),
      lead('ld-ct-05', 'Tomás Arias', '2026-09-27', 'Meta · Regalos corporativos', 'Nuevo', 6),
    ],
  },
  {
    // Revisión atrasada 9 días (gotalk.revisionLeadsAtrasadaDias).
    id: 'lote-gotalk-0915',
    cliente: 'gotalk',
    semana: '2026-09-15',
    estado: 'Pendiente',
    leads: [
      lead('ld-gt-01', 'Sebastián Rojas', '2026-09-15', 'Google Ads · Inglés para adultos', 'Contactado', 9),
      lead('ld-gt-02', 'Isabella Cano', '2026-09-16', 'Meta · Clase de prueba gratis', 'Perdido', 12),
      lead('ld-gt-03', 'Empresa Textiles del Valle', '2026-09-17', 'Google Ads · Inglés corporativo', 'Cotización enviada', 8),
      lead('ld-gt-04', 'Juan David Castro', '2026-09-18', 'Meta · Clase de prueba gratis', 'Nuevo', 10),
      lead('ld-gt-05', 'Mariana López', '2026-09-19', 'Instagram · Testimonio', 'Ganado', 7),
    ],
  },
  {
    id: 'lote-gotalk-0922',
    cliente: 'gotalk',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-gt-06', 'Kevin Mosquera', '2026-09-22', 'Meta · Clase de prueba gratis', 'Contactado', 11),
      lead('ld-gt-07', 'Ana María Vélez', '2026-09-23', 'Google Ads · Inglés para adultos', 'Cotización enviada', 9),
      lead('ld-gt-08', 'Diego Benítez', '2026-09-25', 'Meta · Clase de prueba gratis', 'Nuevo', 14),
    ],
  },
  {
    // GHL desconectado: no se pueden traer leads.
    id: 'lote-horizonte-0922',
    cliente: 'horizonte',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: null,
  },

  // ---------- Cartera de Carolina Ríos ----------
  {
    id: 'lote-altos-0922',
    cliente: 'altos-del-rio',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-ar-01', 'Patricia Montoya', '2026-09-22', 'Google Ads · Proyecto Mirador', 'Cotización enviada', 35),
      lead('ld-ar-02', 'Óscar Duque', '2026-09-23', 'Google Ads · Apartamentos Medellín', 'Perdido', 48),
      lead('ld-ar-03', 'Juliana Echeverri', '2026-09-24', 'Google Ads · Proyecto Mirador', 'Negociación', 29),
      lead('ld-ar-04', 'Mauricio Trujillo', '2026-09-25', 'Orgánico · Blog cesantías', 'Contactado', 52),
      lead('ld-ar-05', 'Laura Bedoya', '2026-09-26', 'Google Ads · Apartamentos Medellín', 'Nuevo', 41),
    ],
  },
  {
    id: 'lote-biovida-0922',
    cliente: 'biovida',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-bv-01', 'Martha Lucía Rey', '2026-09-22', 'Google Ads · Perfil lipídico', 'Ganado', 6),
      lead('ld-bv-02', 'Empresa Seguridad Total', '2026-09-23', 'Google Ads · Exámenes ocupacionales', 'Cotización enviada', 8),
      lead('ld-bv-03', 'Alejandro Niño', '2026-09-24', 'Orgánico · Hemograma', 'Ganado', 5),
      lead('ld-bv-04', 'Carmen Díaz', '2026-09-25', 'Google Ads · Toma a domicilio', 'Contactado', 9),
    ],
  },
  {
    id: 'lote-powerfit-0922',
    cliente: 'powerfit',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-pf-01', 'Santiago Marín', '2026-09-22', 'Meta · Primer mes 50 %', 'Ganado', 3),
      lead('ld-pf-02', 'Valentina Ochoa', '2026-09-22', 'Meta · Primer mes 50 %', 'Contactado', 4),
      lead('ld-pf-03', 'Cristian Lasso', '2026-09-23', 'Instagram · Reel clases', 'Ganado', 2),
      lead('ld-pf-04', 'Natalia Prieto', '2026-09-24', 'Meta · Plan pareja', 'Cotización enviada', 5),
      lead('ld-pf-05', 'Mateo Ibarra', '2026-09-26', 'Meta · Primer mes 50 %', 'Nuevo', 6),
    ],
  },
  {
    id: 'lote-roble-0922',
    cliente: 'roble',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-rb-01', 'Adriana Valencia', '2026-09-22', 'Google Ads · Salas', 'Cotización enviada', 10),
      lead('ld-rb-02', 'Hotel Cafetero Plaza', '2026-09-23', 'Google Ads · Muebles para hotel', 'Negociación', 12),
      lead('ld-rb-03', 'Germán Cifuentes', '2026-09-24', 'Meta · Catálogo comedores', 'Contactado', 9),
      lead('ld-rb-04', 'Sofía Arboleda', '2026-09-26', 'Meta · Catálogo comedores', 'Nuevo', 14),
    ],
  },
  {
    id: 'lote-colonial-0922',
    cliente: 'casa-colonial',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-cc-01', 'Familia Ramírez', '2026-09-22', 'Google Ads · Reserva directa', 'Ganado', 4),
      lead('ld-cc-02', 'Michael Brown', '2026-09-23', 'Meta · Remarketing habitaciones', 'Cotización enviada', 5),
      lead('ld-cc-03', 'Boda Torres & Medina', '2026-09-24', 'Orgánico · Bodas en Cartagena', 'Negociación', 6),
      lead('ld-cc-04', 'Elena Martínez', '2026-09-25', 'Instagram · Orgánico', 'Contactado', 7),
      lead('ld-cc-05', 'Agencia Viajes Sol', '2026-09-27', 'Google Ads · Reserva directa', 'Nuevo', 3),
    ],
  },
  {
    // Revisión atrasada 8 días (vision-clara.revisionLeadsAtrasadaDias).
    id: 'lote-vision-0915',
    cliente: 'vision-clara',
    semana: '2026-09-15',
    estado: 'Pendiente',
    leads: [
      lead('ld-vc-01', 'Gustavo Ramírez', '2026-09-15', 'Google Ads · Examen visual gratis', 'Perdido', 19),
      lead('ld-vc-02', 'Claudia Osorio', '2026-09-16', 'Meta · Prospección Manizales', 'Contactado', 22),
      lead('ld-vc-03', 'Pedro Giraldo', '2026-09-17', 'Meta · Prospección Manizales', 'Nuevo', 25),
      lead('ld-vc-04', 'Beatriz Londoño', '2026-09-18', 'Google Ads · Lentes progresivos', 'Ganado', 14),
    ],
  },
  {
    id: 'lote-vision-0922',
    cliente: 'vision-clara',
    semana: '2026-09-22',
    estado: 'Pendiente',
    leads: [
      lead('ld-vc-05', 'Andrea Castaño', '2026-09-22', 'Google Ads · Examen visual gratis', 'Contactado', 20),
      lead('ld-vc-06', 'Héctor Franco', '2026-09-23', 'Meta · Prospección Manizales', 'Perdido', 24),
      lead('ld-vc-07', 'Rosa Elena Mejía', '2026-09-25', 'Google Ads · Lentes progresivos', 'Cotización enviada', 17),
    ],
  },
];

export const lotePorId = Object.fromEntries(lotesLeads.map((l) => [l.id, l]));
