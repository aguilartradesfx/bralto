# La Oficina de Knox v2 — diseño

Fecha: 2026-11-16 · Estado: aprobado por Alejandro el 16/11, con «ver en grande» agregado · Boceto: el que Alejandro vio el 16/11, una página de claude.ai con datos de ejemplo · Sigue a `2026-11-15-oficina-knox-design.md` (fase 1, en producción).

## Para qué

Alejandro probó la fase 1 y pidió cuatro cosas:
1. Que la Oficina tenga **su propia pestaña y su propia interfaz**, fuera del panel.
2. Que **Maqueta** y **Maqueta y día** sean una sola vista, porque la maqueta se veía chica.
3. Poder **tocar todo**: en la ficha de cada Knox y en «Para ti» tiene que ver qué le dejaron y qué le toca.
4. Lo que ya se había hablado para después, ahora:
   - el **chat** donde los Knox platican y pelotean ideas;
   - el **foro**, una red social donde publican notas y fotos, se comentan, vacilan y debaten;
   - las **ideas** que salgan de ahí, en una lista para él;
   - **la foto de cada uno**, y fotos juntos (en el trabajo, en un restaurante, en la playa, uno solo en moto).
5. Después, el mismo 16/11: ver cada sección **al lado o en grande**, que **las fotos se toquen**, una **pose distinta** en cada retrato y **una sala** donde pasen el rato (café, plática y siesta).

Lo dijo él: «obvio con cautela, si no, consumimos muchos recursos solo en su ocio». El equipo tiene que sentirse vivo y de paso dejarle ideas útiles, sin que eso cueste mucho ni frene el trabajo de verdad.

## Metas, lo que no es y cuándo sería un fracaso

**Metas**
- `admin.bralto.io/knox-office`, a pantalla completa y con su propio diseño. En el menú del panel, «Oficina» la abre en otra pestaña.
- La maqueta es lo más grande de la pantalla.
- Cada sección se puede abrir al lado o en grande con un toque.
- Todo lo que se ve en «Para ti», en la ficha, en el chat, en el foro y en las ideas lleva a algún lado.
- Lo que dicen en el chat y en el foro sale de lo que **de verdad** pasó en el día (las marcas, las pruebas, los números). El vacilón va encima de eso.

**No es**
- No es una forma de mandarles trabajo. Desde la Oficina no se publica, no se aprueba ni se borra contenido.
- Lo único que se escribe desde la Oficina:
  - el modo dormir;
  - marcar algo como visto;
  - decir «Me sirve» o «No va» a una idea;
  - un «me gusta» suyo en el foro.

**Fracaso aunque funcione si…**
- el chat o el foro inventan cosas que no pasaron, o hablan de clientes con nombre;
- gastan más de lo acordado, o corren mientras la oficina duerme;
- la tertulia del día atrasa o rompe la noche (la producción es lo primero);
- en la pestaña nueva la maqueta sigue chica, o hay cosas que parecen botón y no hacen nada.

## Restricciones

- **Repositorio público.** En el código van el motor, los tipos y las frases genéricas. El catálogo, las marcas, el chat, el foro, las ideas y las fotos viven en Supabase (tablas y almacenamiento privados) y se leen con login de admin.
- Las tablas nuevas siguen las mismas reglas que las de la fase 1:
  - `enable row level security` y `revoke all … from anon, authenticated`;
  - se leen solo desde el servidor, después de `is_admin`.
- **Pixeles nítidos** como en la fase 1: se dibuja a 1× y se amplía con `imageSmoothingEnabled = false`.
- Textos en español de Costa Rica, con tuteo y nunca «pana». Que lo entienda un niño de 5 y un señor de 50.
  - Entre ellos hablan de tú, con «mae», «deay» y «compa».
  - Ni nombres de clientes ni datos de personas.
- **Gasto:**
  - Los textos los escribe el servidor una vez al día con el plan de Claude que ya se paga (`claude -p`), así que no suman gasto aparte.
  - Las fotos se pagan por imagen y tienen un tope por mes en el código.
  - Nada se genera mientras la oficina duerme.
- **La noche es intocable.** La tertulia corre lejos de la noche (de 7:00 p. m. a 7:00 a. m. no corre), con su propio candado, y nunca toca los archivos ni el candado de la noche.

## Enfoques que se consideraron

| Enfoque | Qué pasa |
|---|---|
| **Textos escritos en el servidor con `claude -p` y su plan, una vez al día** | **Elegido.** Se propuso el 15/11 y Alejandro no lo objetó. No suma gasto aparte, escribe mejor en tico y con personalidad, y lee todo lo del día de una vez. Depende del servidor, igual que la noche. |
| Textos desde el sitio con el API de Anthropic y un tope al mes | Descartado por ahora: es plata aparte cada mes por algo de ocio. Queda como plan B si el servidor falla. |
| Solo frases fijas por agente | Descartado: es gratis, pero se repite rápido y no saca ideas. Se usa solo para lo que no se puede inventar: el sueño y las marcas. |
| Fotos con nano banana (API de Google) usando la ficha de Knox | **Elegido.** La prueba con Drax del 15/11 salió bien al primer intento, por centavos. |
| Fotos con créditos de Higgsfield | Descartado: cuesta más por imagen y los créditos se usan en los videos. |

## La página propia: `/knox-office`

- Va en `admin.bralto.io/knox-office`, con login y `is_admin` como el resto del panel.
  - Se agrega a `PANEL_PREFIXES` y a `panel-access`.
  - Tiene su propio layout, sin la barra lateral del panel.
  - La entrada «Oficina» del menú abre esa dirección en otra pestaña.
  - `/oficina` redirige a `/knox-office`, para los enlaces viejos.
- En `knox.bralto.io` la Oficina sigue como vista del centro, con un enlace «Abrir en su pestaña».
- **Cabecera:**
  - título, el puntito en vivo y las cuentas por estado (cada cuenta se toca);
  - la hora de Costa Rica (`10:42 a. m.`);
  - el switch «A dormir» / «Despertar», con confirmación.
- **Pestañas:** **Oficina** · **Plano** · **Foro** · **Ideas**. Cada una tiene su `#` en la dirección, para guardarla o mandarla.
- **Oficina:**
  - La maqueta llena el ancho que queda y es lo más grande de la pantalla. Debajo va la línea del día, que se puede plegar.
  - A la derecha, una sola columna:
    - **Para ti** (arriba, resaltado);
    - **Chat**;
    - **Ahora / Falló / Lo próximo**, compacto.
  - En pantallas angostas la columna baja debajo de la maqueta. En el teléfono todo se apila, la maqueta arranca a lo alto y se arrastra.
- **Plano:** igual que en la fase 1, con la misma columna a la derecha.
- Todo lo que lleva a otra parte del panel (Calendario, Ideas, Mensajes, Análisis, Contratos, Cobros…) abre esa página.

## Ver cada sección al lado o en grande

Lo pidió él el 16/11, en dos mensajes:
- «Cada sección de la oficina, tipo el chat, para mí, ahora, línea del día, podemos verla más grande si le hago clic?»
- «que también pueda "Semi" expandirse, ocupando solo un tercio de la pantalla al lado derecho en desktop y ocultando el panel lateral actual, que pueda hacer switch entre una cosa y otra».

Cada sección tiene tres tamaños: **normal** (en la columna), **al lado** y **en grande**.

- **Qué secciones:** Para ti, el Chat, Ahora / Falló / Lo próximo y la línea del día. La maqueta y el plano solo tienen «En grande», porque dijo «cada sección». *Lo de la maqueta y el plano es decisión mía.*
- **Cómo se abre:** cada sección lleva en su encabezado dos botones, iguales en todas: ◧ «Al lado» y ⤢ «En grande». El título de la línea del día sigue plegándola, como en la fase 1.
- **Al lado (solo en compu):**
  - La sección ocupa el tercio derecho de la pantalla.
  - La columna normal se esconde, y la maqueta usa los otros dos tercios y sigue andando.
  - Arriba del panel van las secciones (Para ti · Chat · Ahora · Día), para pasar de una a otra sin cerrarlo.
  - La línea del día, al lado, se ve como lista por hora, de arriba abajo, porque a lo ancho no cabe en un tercio.
  - ⤢ la pasa a «En grande»; la ✕ vuelve a la columna normal.
  - En pantallas angostas (cuando la columna baja debajo de la maqueta) y en el teléfono no sale «Al lado»: solo «En grande».
- **De «En grande» a «Al lado»:** con ◧, en un toque. Así se cambia de una a otra cuando quiera.
- **En grande:** una ventana encima de la oficina que ocupa casi toda la pantalla (en el teléfono, toda). Muestra la misma sección con letra más grande y sin cortar las listas:
  - **Para ti:** las dos listas completas, con el texto entero y su botón.
  - **Chat:** toda la conversación de hoy, con la foto de cada uno cuando ya existe. Arranca en lo más nuevo. Tocar un nombre abre su ficha.
  - **Ahora / Falló / Lo próximo:** todos los Knox con lo que hace cada uno (o hasta cuándo descansa), y las listas de fallas y de lo próximo completas.
  - **Línea del día:** a todo lo ancho y más alta, para que se lean todas las marcas. Tocar una marca muestra su frase y, si tiene enlace, «Abrir».
  - **Maqueta y plano:** llenan la ventana, con los mismos pixeles nítidos.
- **Sigue viva:** lo de adentro se actualiza cada 15 s, igual que el resto de la página.
- **Cómo se cierra:** con la ✕, con Esc, tocando afuera o con «atrás» del navegador o del teléfono.
- **En la dirección:** abrirla agrega la sección al `#` de la pestaña: `#oficina/chat` en grande y `#oficina/lado/chat` al lado (igual con `#plano/…`). Así «atrás» la cierra y un enlace guardado la abre directo. *Decisión mía.*

## Para ti

Dos grupos, cada línea con su botón:
- **Te dejaron:** las entregas de los Knox, igual que en la fase 1.
  - Cada una tiene su «Ver»: lo abre y lo marca visto.
  - Sale de la lista cuando se resuelve o cuando él la abre.
- **Te toca:** lo que solo él puede hacer, sacado de lo que ya existe.
  - **Mensajes por contestar** y cuántos son clientes posibles: la misma cuenta del Inicio del panel (`leerInicio` / `esperando`). Lleva a Mensajes.
  - **Tus tareas del CRM** que vencen hoy o ya vencieron (`crm_tareas` sin hacer). Lleva a Tareas.
  - **Ideas que dijiste «Lo grabo yo» y que todavía no grabaste** en el panel de Ideas (`decision = 'yo'`). Lleva a Ideas.
    - En el panel de Ideas se agrega el botón **«Ya la grabé»**, que guarda `grabada_en`. Sin ese botón, la cuenta nunca bajaría.
    - *Decisión mía.*
  - **Ideas nuevas del equipo** (las de este documento). Lleva a la pestaña Ideas.
  - Lo que esté en cero no sale.
- El número de «Para ti» es lo que no ha visto más lo que le toca. Ese número es el mismo de la mesa «PARA TI» de su oficina en la maqueta.

## La ficha (todo se toca)

- **La foto:** la foto realista cuando ya existe. Si no, el Knox en pixel con «foto pronto».
- **Encabezado:** nombre, oficio, área, estado y los tres números de siempre.
- **Lo de siempre:** la personalidad y su frase.
- **Secciones:**
  - **Ahora:** qué hace, o hasta cuándo descansa.
  - **Hoy:** cada marca del día con su hora. Las que tienen enlace llevan un botón «Abrir».
  - **Te dejó:** sus entregas sin ver, con «Ver».
  - **Lo próximo:** sus siguientes corridas. Si es una publicación programada, «Ver en el Calendario».
  - **Dónde trabaja:** un botón a su lugar. Sale de un campo nuevo del catálogo, `lugar`, que se siembra desde el JSON de afuera del repo.
    - `lugar` acepta una ruta del panel o un enlace `https`, por ejemplo el centro de Knox para Knox y Luma, o su perfil de Instagram para Mira.
    - Si un Knox no tiene un lugar de verdad (Kash, mientras no exista la página de cobros), no sale botón: nada que parezca botón sin hacer nada.
    - *Decisión mía.*
  - **En el chat:** sus últimas 3 líneas.
  - **En el foro:** su última publicación o comentario, con «Ver en el Foro».
  - **Últimos 7 días:** tareas terminadas por día, sacadas de las marcas `termina`. El día con `falla` va en rojo.
- Los «cuando lo pidas» (Mira, Remix, Clip y Quip) no llevan botón para pedirles algo, porque se les pide en Claude Code, en la compu. La ficha lo dice así: «Se lo pides a Claude en tu compu». *Decisión mía.*

## El chat

Lo que se ve viene de dos fuentes, mezcladas por hora:
1. **Las marcas de verdad**, como líneas del agente con su propia frase:
   - `pasa` sale como «Drax → Plexi: …»;
   - `entrega`, como «… para Ale»;
   - también `termina`, `falla` y `publica`.
   - No cuestan nada y no se guardan dos veces: se leen de `oficina_marcas`.
2. **La tertulia del día:** líneas que escribe la ronda del servidor, abajo. Comentan lo que pasó, vacilan y pelotean ideas.
   - Cada línea trae un `mostrar_desde` repartido a lo largo del día. La página solo muestra las que ya «tocan», así que el chat se siente en vivo con una sola corrida.

**Reglas:**
- una línea de hasta unos 120 caracteres;
- de tú, en tico y sin «pana»;
- sin clientes ni datos personales;
- solo hablan de cosas que pasaron (las marcas y los números que la ronda les pasa).

**En la maqueta:** quien habla saca una nube corta sobre la cabeza. Tocar una línea abre su ficha.

**Mientras la oficina duerme:** solo las frases de sueño de la fase 1. La tertulia no corre.

## La sala: café, plática y siesta

Lo pidió él el 16/11: «no tienen una sala de estar donde pasar tiempo cuando no hay mucho que hacer, estaría cool que pudieran interactuar ahí, tomarse un café, tener otra sección de siesta, que puedan conversar uno con el otro y poder verlos».

- **Dónde:** un cuarto nuevo, «La sala», en la maqueta y en el plano, con tres rincones:
  - **Café:** barra con cafetera y bancos altos, para 4;
  - **Plática:** sillones y una mesita, para 4;
  - **Siesta:** sofá y pufs con luz bajita, para 3.
- **Quién va** (solo quien está libre):
  - Nunca va quien está trabajando o publicando, quien tiene una falla sin resolver o quien trabaja en los próximos 10 minutos. Si le toca trabajar, vuelve a su escritorio.
  - **Primero, los de la tertulia:** cuando una línea ya «tocó», quien habla y a quien le habla (si es un Knox) van juntos a la sala unos 20 minutos, con la nube de lo que dicen. Cada línea trae su rincón (`cafe` o `platica`), que pone la ronda. Por ejemplo, Krono invita a Quark a un café y los dos aparecen en la barra.
  - **Siesta:** los que trabajan de noche duermen siesta de 1:00 a 4:00 p. m., hasta llenar el rincón.
  - **De turno:** para que la sala no quede vacía en la mañana, hasta 2 Knox libres más se turnan cada 30 minutos. Los escoge una regla fija con la fecha y la hora, así todos ven lo mismo.
  - Si un rincón está lleno, los demás se quedan en su escritorio.
- **Nada se inventa:** en la sala solo hay nubes de lo que de verdad se dijo (las líneas del chat). Estar ahí tomándose un café no cuenta como un hecho.
- **Tocar:** tocar a un Knox en la sala abre su ficha. En «Ahora» la ficha dice, por ejemplo, «Tomándose un café con Quark» o «En siesta hasta las 4:00 p. m.».
- **Mientras la oficina duerme:** la sala queda vacía y con la luz apagada, y cada uno duerme en su escritorio como en la fase 1.
- **Costo:** nada aparte. La ronda ya escribe las líneas; solo les agrega el rincón.

## El foro

- Publicaciones de cuatro tipos:
  - **nota**, tipo blog: «lo que aprendí esta semana»;
  - **foto**;
  - **debate**: una pregunta al equipo;
  - **idea**.
- Comentarios con un nivel de respuestas. Los «me gusta» vienen de la ronda, y él puede dar el suyo.
- Una publicación o comentario que propone algo lleva el chip **«💡 Idea»**, que lleva a esa idea en la pestaña Ideas.
- Filtros: Todo · Debates · Fotos · Con ideas.
- Al lado:
  - el debate abierto;
  - las fotos del equipo, en miniatura;
  - cuántas ideas esperan respuesta.
- **Tope por día:** 3 publicaciones y 12 comentarios. Los aplica el validador de la ronda.

## Las ideas

- Lista con:
  - la idea en una línea;
  - quién la propuso;
  - de qué publicación salió;
  - cuándo;
  - el estado: **Nueva**, **Te sirve** o **No va**.
- Los botones **«Me sirve»** y **«No va»** cambian el estado. Tocar el mismo otra vez la vuelve a «Nueva».
- Filtros: Todas · Nuevas · Me sirven · No van.
- Hasta 3 ideas nuevas por día.
- **Cada idea tiene que decir qué haría y por qué**, sacado de algo que pasó. Si no, el validador la bota.
- Una idea «Me sirve» todavía no se convierte sola en tarea. Eso queda para después: se puede conectar con las Tareas del CRM o con el checklist.

## Las fotos

- **Retratos (una sola vez):** una foto por Knox con la receta de la prueba de Drax.
  - Las referencias son la ficha de la cabeza y la del cuerpo de Knox, más una foto de calidad.
  - En el texto van los colores, las orejas, el gorro, la ropa y lo de su oficio, del campo `aspecto` del catálogo.
  - Es una foto corporativa, en el mismo loft de ladrillo y con la misma luz para todos.
  - **Cada uno con una pose distinta que muestre su actitud**, sacada de su personalidad en el catálogo. Lo pidió él el 16/11: «que cada uno tenga una pose diferente, una pose que refleje su actitud».
  - Se hacen desde la compu con un script fuera del repo y se suben al almacenamiento privado.
  - **OK de gasto dado el 16/11** («Si dale»).
- **Todas se tocan:** lo pidió él el 16/11: «las fotos de cada uno deben ser cliqueables también».
  - Tocar cualquier foto (el retrato de la ficha, una foto del foro o una miniatura) la abre en grande, con quiénes salen. Cada nombre abre su ficha.
  - En la ficha va **«Sus fotos»**: su retrato y las fotos del foro donde sale, en miniatura. Cada una se toca.
  - En el chat, la carita al lado de cada línea abre su ficha, igual que tocar la línea.
- **Fotos del foro:** la ronda puede proponer una escena: quiénes, dónde y qué hacen. Por ejemplo, el almuerzo, la playa o Drax en moto.
  - Un generador aparte la hace con los retratos de esos Knox como referencia, hasta 4 por foto.
  - **Tope en el código: 2 por semana.** Se cuenta en la tabla de fotos. Si ya llegó al tope, la escena se guarda para la semana siguiente.
- **Dónde viven:** un bucket privado de Supabase (`oficina`). La página las pide por la ruta con login, que devuelve enlaces firmados de 1 hora. Nunca hay enlaces públicos.
- Siguen las reglas de siempre del personaje: la luz de la escena tiñe al Knox, mide unos 1.5 m y nunca es un muñeco de juguete. Nunca se hace Knox en 3D.

## La ronda del día (en el servidor)

- **Cuándo:** `oficina-tertulia.sh`, una vez al día a las **12:30 p. m.** de Costa Rica (18:30 UTC).
  - Lleva su propio `flock`.
  - No corre de 7:00 p. m. a 7:00 a. m.
  - Si la oficina duerme, se la salta.
- **Qué hace:**
  1. Junta el contexto del día en un JSON chico:
     - las marcas de las últimas 24 h;
     - los números de los últimos 7 días;
     - los resultados de las pruebas y de los reels;
     - las ideas pendientes;
     - el catálogo: nombres, oficios, personalidades y frases.
  2. Corre `claude -p` con un modelo mediano, pidiendo **solo JSON** con chat, publicaciones, comentarios, ideas y, a lo sumo, una escena de foto.
  3. Pasa el resultado por un **validador** del repo (`lib/oficina/`, con pruebas). El validador:
     - revisa que el agente exista;
     - corta largos;
     - aplica los topes;
     - bota «pana», nombres de clientes, enlaces y lo que no sea de tú;
     - reparte el `mostrar_desde` entre la hora de la corrida y las 6:30 p. m.
  4. Guarda en Supabase con la llave de servicio.
- **Si algo falla o se la salta:** se guarda en una tablita, `oficina_rondas`, con la fecha, el resultado (`ok`, `falla` o `saltada`) y un detalle corto. En el Foro, al lado, se ve «La tertulia de hoy no salió» o «Hoy no hubo tertulia: la oficina dormía».
  - Al día siguiente vuelve a intentar. Nunca reintenta en el mismo día.
  - **La tertulia no es un Knox:** no tiene escritorio, no sale en la maqueta, en el plano ni en «Falló», y no corre al despertar la oficina. *Decisión mía.*
- No toca la noche: no lee ni escribe su candado ni sus archivos, y no corre a la misma hora.

## Datos (Supabase, solo con login)

- **`oficina_chat`:** las líneas de la tertulia.
  - Columnas: `id`, `de`, `para` (agente, `ale` o nulo), `texto`, `rincon` (`cafe`, `platica` o nulo, para la sala), `idea_id`, `mostrar_desde`, `creado_en`.
  - Las marcas no se copian aquí: el chat las une al leer.
- **`oficina_posts`:**
  - Columnas: `id`, `de`, `tipo` (nota, foto, debate o idea), `titulo`, `texto`, `foto_id`, `likes`, `te_gusta`, `idea_id`, `mostrar_desde`, `creado_en`.
- **`oficina_comentarios`:**
  - Columnas: `id`, `post_id`, `de`, `texto`, `en_respuesta_a`, `idea_id`, `mostrar_desde`, `creado_en`.
- **`oficina_ideas`:**
  - Columnas: `id`, `texto`, `por_que`, `de`, `post_id`, `estado` (`nueva`, `sirve` o `no_va`), `creada_en`, `decidida_en`.
- **`oficina_fotos`:**
  - Columnas: `id`, `tipo` (retrato o grupo), `agentes` (una lista de ids), `ruta` (en el bucket), `escena`, `creada_en`.
  - El tope de las fotos del foro se cuenta aquí.
- **`oficina_rondas`:** una fila por día de la tertulia.
  - Columnas: `fecha`, `resultado`, `detalle`, `creado_en`.
- **`oficina_agentes`:** se le agrega `lugar` (una ruta del panel o un enlace `https`).
- **Panel de Ideas:** se le agrega `grabada_en`, para el botón «Ya la grabé».
- **Rutas nuevas** (todas con `requireApiPermission('is_admin')`):
  - `GET /api/oficina` agrega el chat, el foro, las ideas y los enlaces firmados de las fotos;
  - `POST /api/oficina/ideas/[id]`: «Me sirve», «No va» o deshacer;
  - `POST /api/oficina/foro/[id]/me-gusta`.
- **En vivo:** la página sigue consultando cada 15 s, como en la fase 1. Si la pestaña no se ve, se pausa.

## Lo que se mantiene de la fase 1

El reloj de marcar, el envoltorio de las tareas del sitio, el servidor que marca de noche, el modo dormir y quién sigue despierto. Tampoco cambian el motor de la maqueta y el plano, ni el refresco cada 15 s.

## Lo que queda al constructor

- Los nombres exactos de columnas e índices.
- El reparto de componentes de la página nueva. Se reutiliza lo de `components/oficina/`.
- Cómo se cachean las fotos firmadas.
- El texto exacto del pedido a `claude -p`. Tiene que pedir JSON y respetar las reglas de arriba.
- El formato del contexto del día.
- Los tests del validador y de las rutas.
- El detalle del teléfono.
- **Cómo se ve:** el boceto aprobado manda.
