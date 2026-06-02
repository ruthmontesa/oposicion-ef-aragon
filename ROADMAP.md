# 🗺️ ROADMAP — OposEF Aragón 2026

## Estado actual: FASE 1 ✅

---

## FASE 1 — Setup y estructura ✅ COMPLETADA
> Objetivo: tener el proyecto listo para programar en Claude Code

### Lo que ya está hecho
- [x] Estructura de carpetas completa
- [x] `package.json` con todas las dependencias
- [x] `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
- [x] `.env.local` con variables de entorno (rellena con tus keys)
- [x] `types/index.ts` — todos los tipos TypeScript
- [x] `supabase/migrations/001_schema.sql` — schema completo de BD
- [x] `lib/supabase.ts` — cliente Supabase
- [x] `lib/ai/gemini.ts` — integración Google Gemini
- [x] `lib/utils/similarity.ts` — algoritmo de similitud de textos
- [x] `lib/utils/pdf.ts` — extractor de PDF
- [x] `lib/utils/cn.ts` — utilidad de clases CSS
- [x] `content/temas/temario.ts` — 25 temas del temario oficial
- [x] Placeholders de todas las páginas y API routes
- [x] `.gitignore` configurado

### Lo que tienes que hacer TÚ en esta fase

#### 1. Instalar dependencias (en tu terminal de VS Code)
```bash
cd oposicion-ef-aragon
npm install
```

#### 2. Crear proyecto en Supabase
1. Ve a https://supabase.com → New Project
2. Pon nombre: `oposicion-ef-aragon`
3. Elige región: `eu-west-1` (Irlanda) o `eu-central-1`
4. Guarda la contraseña de la DB
5. Copia `Project URL` y `anon public key` → `.env.local`
6. Ve a Project Settings → API → copia también `service_role key` → `.env.local`

#### 3. Ejecutar el SQL en Supabase
1. En Supabase: menú SQL Editor → New query
2. Copia el contenido de `supabase/migrations/001_schema.sql`
3. Run → debe ejecutarse sin errores
4. Ve a Table Editor → deberías ver las 7 tablas creadas

#### 4. Crear bucket de Storage en Supabase
1. Storage → New bucket
2. Nombre: `apuntes`
3. Public: NO (privado)
4. Ya está configurado con RLS en el SQL

#### 5. Obtener API key de Google Gemini (GRATIS)
1. Ve a https://aistudio.google.com/app/apikey
2. Create API key → copia la key → `.env.local`

#### 6. Verificar que todo funciona
```bash
npm run dev
# Debe arrancar sin errores en http://localhost:3000
```

---

## FASE 2 — Autenticación ⏳ PENDIENTE
> Objetivo: login/registro funcional con Supabase Auth

### Archivos a crear con Claude Code
- `app/(auth)/login/page.tsx` — página de login
- `app/(auth)/register/page.tsx` — página de registro
- `app/layout.tsx` — layout principal con fuentes y providers
- `components/layout/Navbar.tsx` — barra de navegación
- `components/layout/Sidebar.tsx` — menú lateral (dashboard)
- `hooks/useAuth.ts` — hook de autenticación
- `middleware.ts` — protege rutas del dashboard

### Prompt sugerido para Claude Code
```
Crea el sistema de autenticación completo con Supabase Auth para Next.js 14 App Router.
Necesito:
1. Página de login en app/(auth)/login/page.tsx con email/password
2. Página de registro en app/(auth)/register/page.tsx
3. Middleware.ts que redirija a /login si no hay sesión en rutas /dashboard
4. Hook useAuth.ts en hooks/ que devuelva user, loading, signIn, signOut
5. Layout principal en app/layout.tsx con las fuentes y SupabaseProvider
Usa las credenciales de lib/supabase.ts ya existente.
Diseño: minimalista, colores verde brand definidos en tailwind.config.ts
```

---

## FASE 3 — Dashboard principal ⏳ PENDIENTE
> Objetivo: dashboard bonito con progreso de los 25 temas

### Archivos a crear con Claude Code
- `app/(dashboard)/page.tsx` — página principal del dashboard
- `components/dashboard/ProgresoTemas.tsx` — grid con 25 temas y % completado
- `components/dashboard/EstadisticasCard.tsx` — cards de resumen
- `components/shared/ProgressRing.tsx` — círculo de progreso animado

### Prompt sugerido para Claude Code
```
Crea el dashboard principal en app/(dashboard)/page.tsx.
Debe mostrar:
1. Saludo con nombre del usuario (desde profiles en Supabase)
2. Grid de 25 tarjetas (una por tema del temario de Aragón)
   - Usa el array TEMARIO_EF_ARAGON de content/temas/temario.ts
   - Cada tarjeta muestra: número tema, título, % de última puntuación
   - Color verde si >70%, amarillo si 40-70%, gris si sin empezar
3. Barra de progreso global (% de temas estudiados)
4. Links a las 4 secciones: Temas, Caso Práctico, Programación, Oral
Datos reales de Supabase: tabla progreso_usuario
Diseño coherente con la paleta brand del tailwind.config.ts
```

---

## FASE 4 — Módulo Temas ⏳ PENDIENTE
> Objetivo: el módulo más importante — preguntas con IA

### Archivos a crear con Claude Code
- `app/(dashboard)/temas/[id]/page.tsx` — vista del tema
- `app/(dashboard)/temas/[id]/estudiar/page.tsx` — modo estudio
- `app/api/preguntas/route.ts` — genera preguntas con Gemini
- `app/api/evaluar/route.ts` — evalúa respuesta del usuario
- `app/api/upload/route.ts` — sube PDF y extrae texto
- `components/temas/SubirApuntes.tsx` — dropzone para PDFs
- `components/temas/ModoSelector.tsx` — selector base/apuntes/todo
- `components/temas/TarjetaPregunta.tsx` — pregunta + textarea respuesta
- `components/temas/ResultadoEvaluacion.tsx` — % y feedback visual

### Prompt sugerido para Claude Code (API preguntas)
```
Implementa la API route app/api/preguntas/route.ts (POST).
Recibe: { tema_id, modo: 'base'|'apuntes'|'todo', num_preguntas }
Lógica:
1. Si modo='base': usa tema.contenido_base de Supabase
2. Si modo='apuntes': usa apuntes_usuario.contenido_texto del user
3. Si modo='todo': combina ambos
4. Llama a generarPreguntas() de lib/ai/gemini.ts
5. Guarda la sesión en sesiones_estudio
6. Devuelve las preguntas generadas
Usa createServerClient() de lib/supabase.ts para autenticar
```

---

## FASE 5 — Módulo Caso Práctico ⏳ PENDIENTE
> Objetivo: resolver casos reales y ver % de similitud

### Archivos a crear con Claude Code
- `app/(dashboard)/caso-practico/page.tsx` — lista de casos por año
- `app/(dashboard)/caso-practico/[id]/page.tsx` — resolver un caso
- `app/api/caso/evaluar/route.ts` — calcula similitud
- `components/caso-practico/EditorRespuesta.tsx` — textarea grande con timer
- `components/caso-practico/ResultadoSimilitud.tsx` — % y palabras clave

### Antes de esta fase: insertar casos reales en Supabase
Ver instrucciones en `content/casos-practicos/README.md`

---

## FASE 6 — Módulos PD y Oral ⏳ PENDIENTE
> Objetivo: páginas de recursos y guías

### Archivos a crear con Claude Code
- `app/(dashboard)/programacion/page.tsx` — guías PD con acordeones
- `app/(dashboard)/oral/page.tsx` — checklist y guía oral
- `components/programacion/ChecklistPD.tsx`
- `components/oral/ChecklistOral.tsx`
- `components/oral/GuiaDefensa.tsx`

---

## FASE 7 — Pulido y Deploy ⏳ PENDIENTE
> Objetivo: subir a Vercel y tener dominio

### Pasos
1. Crear cuenta en Vercel (https://vercel.com)
2. `git init && git add . && git commit -m "Initial commit"`
3. Crear repo en GitHub y push
4. Vercel → New Project → conectar repo de GitHub
5. Añadir variables de entorno en Vercel (las mismas que .env.local)
6. Deploy → URL automática: `oposicion-ef.vercel.app`
7. (Opcional) Dominio propio: ~10€/año en namecheap o dondominio.com

---

## 💡 Consejos para trabajar con Claude Code

1. **Siempre dale contexto**: "el proyecto está en `/oposicion-ef-aragon`, usa el stack Next.js 14 + Supabase + Gemini"
2. **Muéstrale los archivos relevantes** antes de pedir código nuevo
3. **Trabaja fase a fase**: no saltes a la fase 4 sin tener la 2 y 3 funcionando
4. **Prueba en localhost** antes de hacer deploy
5. **Commits frecuentes**: después de cada fase que funcione, haz `git commit`

---

## 📞 Recursos útiles
- Supabase docs: https://supabase.com/docs
- Next.js 14 App Router: https://nextjs.org/docs/app
- Gemini API: https://ai.google.dev/docs
- shadcn/ui: https://ui.shadcn.com
- BOA (temario oficial): https://www.boa.aragon.es
