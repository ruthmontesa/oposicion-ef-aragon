// Recursos web por tema — Temario EF Maestros Primaria Aragón 2026
// Fuentes verificadas y gratuitas. 2 recursos por tema.

export type Recurso = {
  titulo: string
  url: string
  tipo: 'temario' | 'normativa' | 'practico' | 'articulo'
}

// ── URLs base verificadas ──────────────────────────────────────────────────
const PREPARADORES = 'https://www.preparadores.eu/temario-educacion-fisica-primaria/'
const DEPORTES_EF  = 'https://deportesyeducacionfisica.com/educacion-fisica-y-oposiciones/oposiciones-educacion-fisica/temario-de-educacion-fisica-para-primaria/'
const EFMAD        = 'https://efmadoposicionesprimaria.com/temario-de-las-oposiciones-de-educacion-fisica-de-primaria-en-madrid'
const EDUCA_ARAGON = 'https://educa.aragon.es/'
const BOE_1993     = 'https://www.boe.es/buscar/act.php?id=BOE-A-1993-23484'
const CURRICULO_EF = 'https://educa.aragon.es/'   // Orden ECD/1112/2022 — área EF Primaria Aragón

// ── Temas 1-10: Fundamentos científicos de la EF ──────────────────────────
export const RECURSOS_POR_TEMA: Record<number, Recurso[]> = {
  1: [
    { titulo: 'Tema 1: Concepto de EF — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario oficial EF Primaria — BOE Orden 9 sept. 1993 (los 25 temas)', url: BOE_1993, tipo: 'normativa' },
  ],
  2: [
    { titulo: 'Tema 2: EF en el Sistema Educativo — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (bloque currículo y sistema educativo)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  3: [
    { titulo: 'Tema 3: Anatomía y fisiología — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (anatomía y fisiología)', url: EFMAD, tipo: 'temario' },
  ],
  4: [
    { titulo: 'Tema 4: Desarrollo motor en Primaria — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (desarrollo y aprendizaje motor)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  5: [
    { titulo: 'Tema 5: Esquema corporal — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (esquema corporal)', url: EFMAD, tipo: 'temario' },
  ],
  6: [
    { titulo: 'Tema 6: Coordinación y equilibrio — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (coordinación y equilibrio)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  7: [
    { titulo: 'Tema 7: Capacidades físicas básicas — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (capacidades físicas)', url: EFMAD, tipo: 'temario' },
  ],
  8: [
    { titulo: 'Tema 8: Habilidades motrices básicas — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (habilidades motrices)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  9: [
    { titulo: 'Tema 9: Resistencia y flexibilidad — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (condición física y salud)', url: EFMAD, tipo: 'temario' },
  ],
  10: [
    { titulo: 'Tema 10: Fuerza y velocidad — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (fuerza y velocidad en Primaria)', url: DEPORTES_EF, tipo: 'temario' },
  ],

  // ── Temas 11-17: Contenidos y ámbitos de la EF ────────────────────────
  11: [
    { titulo: 'Tema 11: El juego — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (el juego)', url: EFMAD, tipo: 'temario' },
  ],
  12: [
    { titulo: 'Tema 12: Los deportes — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (deportes individuales y colectivos)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  13: [
    { titulo: 'Tema 13: Juegos populares y medio natural — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (juegos autóctonos y medio natural)', url: EFMAD, tipo: 'temario' },
  ],
  14: [
    { titulo: 'Tema 14: Expresión corporal, ritmo y danza — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (expresión corporal)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  15: [
    { titulo: 'Tema 15: Natación y actividades acuáticas — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (natación en Primaria)', url: EFMAD, tipo: 'temario' },
  ],
  16: [
    { titulo: 'Tema 16: Actividad física y salud — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (salud, higiene y alimentación)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  17: [
    { titulo: 'Tema 17: Primeros auxilios — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (primeros auxilios y prevención)', url: EFMAD, tipo: 'temario' },
  ],

  // ── Temas 18-25: Didáctica, metodología y legislación ─────────────────
  // Para estos temas la fuente más valiosa es Educaragón (currículo oficial aragonés
  // y criterios reales de los tribunales de Aragón)
  18: [
    { titulo: 'Tema 18: Currículo EF Primaria — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Currículo Educación Primaria Aragón — Educaragón (Orden ECD/1112/2022 + área EF)', url: CURRICULO_EF, tipo: 'normativa' },
  ],
  19: [
    { titulo: 'Tema 19: Programación y sesión de EF — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Rúbricas y criterios de programación didáctica EF — Educaragón Aragón', url: EDUCA_ARAGON, tipo: 'practico' },
  ],
  20: [
    { titulo: 'Tema 20: Evaluación en EF — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Criterios de evaluación EF Primaria Aragón — Educaragón (LOMLOE)', url: EDUCA_ARAGON, tipo: 'normativa' },
  ],
  21: [
    { titulo: 'Tema 21: Metodología y estilos de enseñanza — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (metodología y estilos de enseñanza)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  22: [
    { titulo: 'Tema 22: Recursos materiales e instalaciones — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (recursos e instalaciones)', url: EFMAD, tipo: 'temario' },
  ],
  23: [
    { titulo: 'Tema 23: Atención a la diversidad en EF — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Supuestos prácticos EF Primaria con ACNEAE — Educaragón Aragón', url: EDUCA_ARAGON, tipo: 'practico' },
  ],
  24: [
    { titulo: 'Tema 24: Extraescolares y deporte escolar — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — DeportesyEF (deporte escolar y extraescolares)', url: DEPORTES_EF, tipo: 'temario' },
  ],
  25: [
    { titulo: 'Tema 25: Coeducación e igualdad en EF — Preparadores EF Primaria', url: PREPARADORES, tipo: 'temario' },
    { titulo: 'Temario EF Primaria — EF Madrid Oposiciones (coeducación y estereotipos)', url: EFMAD, tipo: 'temario' },
  ],
}
