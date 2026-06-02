-- ============================================================
-- MIGRACIÓN 001: SCHEMA COMPLETO
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  nombre      TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE public.temas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          INTEGER NOT NULL UNIQUE CHECK (numero BETWEEN 1 AND 60),
  titulo          TEXT NOT NULL,
  contenido_base  TEXT,
  preguntas_base  JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.apuntes_usuario (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema_id          UUID NOT NULL REFERENCES public.temas(id) ON DELETE CASCADE,
  nombre_archivo   TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  contenido_texto  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sesiones_estudio (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema_id      UUID NOT NULL REFERENCES public.temas(id) ON DELETE CASCADE,
  modo         TEXT NOT NULL CHECK (modo IN ('base', 'apuntes', 'todo')),
  preguntas    JSONB DEFAULT '[]',
  respuestas   JSONB DEFAULT '[]',
  puntuaciones JSONB DEFAULT '[]',
  completada   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.casos_practicos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anio                  INTEGER NOT NULL,
  convocatoria          TEXT NOT NULL,
  enunciado             TEXT NOT NULL,
  criterios_correccion  TEXT,
  respuesta_modelo      TEXT NOT NULL,
  fuente                TEXT,
  activo                BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.intentos_caso (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id              UUID NOT NULL REFERENCES public.casos_practicos(id) ON DELETE CASCADE,
  respuesta_usuario    TEXT NOT NULL,
  porcentaje_similitud FLOAT CHECK (porcentaje_similitud BETWEEN 0 AND 100),
  feedback             TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.progreso_usuario (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema_id           UUID NOT NULL REFERENCES public.temas(id) ON DELETE CASCADE,
  veces_estudiado   INTEGER DEFAULT 0,
  ultima_puntuacion FLOAT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tema_id)
);

-- RLS
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apuntes_usuario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_estudio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos_practicos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentos_caso    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progreso_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "temas_select_all" ON public.temas FOR SELECT TO authenticated USING (true);
CREATE POLICY "apuntes_select_own" ON public.apuntes_usuario FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "apuntes_insert_own" ON public.apuntes_usuario FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "apuntes_delete_own" ON public.apuntes_usuario FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "sesiones_all_own" ON public.sesiones_estudio FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "casos_select_all" ON public.casos_practicos FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "intentos_all_own" ON public.intentos_caso FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "progreso_all_own" ON public.progreso_usuario FOR ALL USING (auth.uid() = user_id);
