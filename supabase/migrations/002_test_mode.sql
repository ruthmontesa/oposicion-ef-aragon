-- ============================================================
-- MIGRACIÓN 002: MODO TEST
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- Ampliar el CHECK de modo para incluir 'test'
ALTER TABLE public.sesiones_estudio DROP CONSTRAINT IF EXISTS sesiones_estudio_modo_check;
ALTER TABLE public.sesiones_estudio ADD CONSTRAINT sesiones_estudio_modo_check
  CHECK (modo IN ('base', 'apuntes', 'todo', 'test'));
