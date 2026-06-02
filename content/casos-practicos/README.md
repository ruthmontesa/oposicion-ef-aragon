# Casos Prácticos Reales

## Instrucciones

En esta carpeta documentas los casos prácticos reales encontrados.
Luego los insertas directamente en Supabase mediante el SQL Editor.

## SQL para insertar un caso práctico

```sql
INSERT INTO public.casos_practicos
  (anio, convocatoria, enunciado, criterios_correccion, respuesta_modelo, fuente)
VALUES (
  2022,
  'Oposiciones EF Aragón 2022',
  'ENUNCIADO COMPLETO DEL CASO PRÁCTICO AQUÍ...',
  'Criterios de corrección oficiales si los hay...',
  'RESPUESTA MODELO ELABORADA...',
  'BOA nº XXX de fecha DD/MM/YYYY'
);
```

## Fuentes donde buscar casos reales

1. **BOA** (Boletín Oficial de Aragón): https://boe.es/buscar/act.php
2. **Foros de opositores**:
   - prepaTicos.com
   - todosnuestrostemarios.com
3. **Grupos Telegram**: busca "Oposiciones EF Aragón"
4. **INAEM** (convocatorias anteriores)

## ⚠️ IMPORTANTE

NO inventes casos prácticos. Solo usa enunciados reales de convocatorias
pasadas. Si un caso no tiene respuesta modelo oficial, elabora una
respuesta técnica completa tú mismo.
