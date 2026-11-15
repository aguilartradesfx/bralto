# La Oficina de Knox — diseño

Fecha: 2026-11-15 · Estado: borrador para aprobar · Prototipo: `2026-11-15-oficina-prototipo/` (abrir `loft.html` con un servidor local)

## Para qué

Alejandro quiere mirar en cualquier momento cómo va el equipo de agentes de Bralto, como quien se asoma a una oficina de verdad. Cada agente es una versión de Knox, la mascota, sentado en su oficina. Con solo ver la página tiene que saber:

1. quién está trabajando y en qué;
2. si alguno le tiene algo listo (un archivo, una imagen, un borrador para su OK);
3. si alguno está publicando;
4. de los que descansan: qué hicieron hoy y a qué hora, y cuál es su próxima tarea y a qué hora más o menos.

Además los agentes tienen que **verse vivos**: caminan a la oficina del otro cuando se pasan trabajo, se hablan en un chat con su personalidad y a veces se tiran una broma.

## Metas y lo que no es

**Metas**
- Una página que se lee de un vistazo y que muestra datos **reales** (lo que cada agente anotó), no una animación decorativa.
- Que funcione en la compu y en el teléfono, con los pixeles nítidos.
- Que agregar un agente nuevo sea agregar una fila en la base, sin tocar el código.

**No es**
- No es un panel para controlar a los agentes: desde la Oficina no se publica, no se aprueba ni se borra nada. Solo se mira y se abren enlaces.
- No va en el sitio público: solo con login de admin.

**Sería un fracaso aunque funcione si…**
- los estados son inventados o se quedan viejos (un Knox «trabajando» que en realidad terminó hace horas);
- se ve borroso o los personajes no se distinguen;
- hay que hacer scroll o navegar entre pantallas para ver la oficina completa;
- los Knox atraviesan paredes y muebles, o uno se encima en otro.

## Restricciones

- **El repositorio es público.** En el código van el motor y los dibujos. El catálogo de agentes (nombres, personalidades, horarios), las marcas y el chat viven en Supabase y se leen con login. Nada de datos de clientes, precios, llaves ni direcciones de servidores en el código ni en este documento.
- Solo usuarios `is_admin`. La misma vista se monta en **knox.bralto.io** (una vista más del centro, junto a Hoy, Ventas, Redes, Agenda y Conexiones) y en **admin.bralto.io** (sección nueva del panel). Un solo componente para los dos.
- **Las salas se dibujan con código**, no con imágenes. Los Knox también son de código por ahora (ver Fase 3).
- **Pixeles nítidos:** se dibuja el arte a 1× en un canvas y se amplía con `imageSmoothingEnabled = false`. Nunca se escala con `image-rendering` de CSS: en Safari se ve borroso.
- Español de Costa Rica en todo lo que se lee: tuteo, «mae», nunca «pana». Que lo entienda un niño de 5 años y un señor de 50.

## Enfoques que se probaron

| Enfoque | Qué pasó |
|---|---|
| Knox en modelos 3D (Tripo, Meshy) | **Descartado por Alejandro.** Lo que quería en 3D era la oficina, no los personajes. Además pesa más y no se parecía a Knox. |
| Oficina isométrica en pixel art (pasillo de día y plaza con café de noche) | Útil para entender el estilo. No era «lo que vio». |
| **Loft de frente en pixel art**, como su referencia | **Elegido.** Salas con ladrillo, rótulo, pantalla de su oficio, escritorio y plantas; pasillos con sillón. |
| Una vista por ala, a pantalla completa, con pestañas | Descartado: quiere ver **todas** las oficinas en la misma pantalla, y moverse como en un mapa solo si él quiere. |
| AirChat (repositorio de terceros para que los agentes chateen) | **Descartado.** Si no se aloja propio, manda los mensajes a un servidor público de otra gente. Alojarlo es otra app entera que mantener, es muy nuevo y está hecho para agentes conectados todo el tiempo, no para tareas programadas. Se hace un chat propio (abajo). |

## Lo que ya decidió Alejandro

### La página
- Arriba: título, cuántos están trabajando y las cuentas por estado (trabajando, publicando, te tienen algo, falló, descansando).
- Tres pestañas, a lo ancho de la página y sin ocupar toda la pantalla:
  - **Maqueta:** la oficina loft completa y, a la derecha, el panel.
  - **Plano:** cada área con las caritas de sus Knox, un anillo del color de su estado, su nombre y lo que hace (o «próx. 8:00 p. m.»). A la derecha, el mismo panel.
  - **Maqueta y día:** la oficina y, abajo, la línea del día por área: rayitas para lo que ya se hizo, la línea naranja de «ahora» y punteadas para lo que sigue.
- **Panel:** Ahora (quién trabaja y en qué), Para ti (lo que le dejaron, con botón «Ver»), Falló (qué y cuándo se reintenta) y Lo próximo (las siguientes 5 tareas con hora).
- **Ficha** (al tocar una oficina, una carita o un nombre; se cierra con ×, Esc o tocando afuera): foto, nombre, oficio, estado, tareas completadas, horas trabajadas, días sin fallar, personalidad, la frase que siempre dice, área, qué hace ahora, lo último que hizo, lo próximo y lo que le tiene listo.
- Zoom: botones +/−/Ver todo, Ctrl o Cmd con la rueda, y dos dedos. La rueda sola baja la página. Ningún botón mueve la cámara por su cuenta.

### La oficina
- 24 oficinas cerradas en 4 filas de 6, dos pasillos con sillón y mesita, un pasillo a la izquierda que une los dos y **su oficina** alta a la derecha, con la mesa «Para ti».
- Cada oficina tiene **puerta de verdad** (marco y hoja abierta): las filas de arriba de cada pasillo salen por abajo a la izquierda; las de abajo entran por arriba a la izquierda, a través del muro. Nada tapa las puertas.
- Los Knox **caminan por rutas reales**: A* en una grilla de 4 px que rodea escritorios, archiveros, plantas y el sillón; el carril va por el centro del pasillo; si se topan, uno espera y le da el paso.
- **Profundidad:** muebles y Knox se dibujan ordenados por la `y` de los pies. El Knox sentado queda detrás de su escritorio, que le tapa las piernas.
- **Visitas:** cuando uno le pasa algo a otro, camina a su oficina, se para frente al escritorio, dice su frase en una nube y el otro le contesta. Si le lleva algo a Alejandro, va a su oficina, lo deja en «Para ti» y sale un aviso arriba.
- Movimiento de caricatura: rebote al respirar, tecleo cuando trabaja, «z» cuando descansa, pasos al caminar.

### Los Knox
Cada uno distinto: color de la tela (su «piel»), orejas (conejo, gato, oso o ninguna), gorro o peinado (bucket, gorra, pompón, cresta o trenzas), color de la ropa y algo de su oficio (audífonos, lentes, celular, megáfono o libreta). Nombres tipo Knox, nunca de personas:

| Área | Knox y oficio |
|---|---|
| Contenido | Drax, jefe de la noche · Plexi, guiones · Pixa, diseño · Lynx, corrector · Argo, vigilante |
| Publicación | Zap, publica · Tiko, TikTok · Vero, juez de las pruebas |
| Ideas y plan | Nova, ideas · Quark, analista · Krono, auditor del domingo · Atlas, plan de la semana |
| Conversaciones | Echo, el «Comenta» · Volt, responde comentarios · Dex, contesta los DM |
| Oficina | Knox, el reporte de la mañana · Luma, el saludo de la noche · Kash, cobros · Inko, contratos · Ping, Telegram |
| Cuando pidas | Mira, perfil · Remix, recicla videos · Clip, historias · Quip, comentarios en otras cuentas |

## Datos (Supabase, solo con login)

**`oficina_agentes`** (el catálogo): id, nombre, oficio, área, puesto (orden en la oficina), aspecto (tela, ropa, orejas, cabeza, gorro, extra, pantalla), personalidad, frase, horario (expresión cron + zona America/Costa_Rica, o «cuando pidas», o «con cada mensaje»), dónde corre (servidor, sitio, Zernio, asistente), activo.

**`oficina_marcas`** (el reloj de marcar; la fuente de verdad): id, agente, tipo (`empieza`, `termina`, `falla`, `pasa` (le pasa trabajo a otro), `entrega` (le deja algo a Alejandro), `publica`), para (agente o `ale`), texto (una frase), enlace (opcional: lo que dejó listo), creado_en.
- Estado actual = la última marca abierta (un `empieza` sin su `termina` → trabajando; `falla` → falló; `entrega` sin ver → te tiene algo; nada → descansando).
- Tareas completadas = cantidad de `termina`. Horas trabajadas = suma de cada `empieza`→`termina`. Días sin fallar = días desde el último `falla`.
- Una corrida que se murió sin marcar `termina` no puede quedar «trabajando» para siempre: si pasa del doble de lo que suele durar, se muestra como «se quedó a medias».

**`oficina_chat`**: id, de, para (agente, `ale` o todos), texto, en_respuesta_a, creado_en.

**Lo visto:** cuando Alejandro abre algo de «Para ti», se guarda la hora en que lo vio y deja de contar.

**Lo próximo:** se calcula del horario del catálogo.

## Quién anota (integración)

- **Servidor (la tarea de la noche, el vigilante y los agentes de Instagram que vengan):** un comando pequeño `marcar` que anota con la llave de servicio. La tarea de la noche marca `empieza`, `termina` o `falla`; la instrucción de la noche pide marcar `pasa` cuando reparte trabajo y `entrega` cuando deja algo para Alejandro.
- **Tareas programadas del sitio (`app/api/cron/*`):** un envoltorio que marca `empieza`, `termina` con un resumen corto del resultado, o `falla` con el error en palabras simples.
- **Zernio («Comenta» y TikTok):** marcas desde los avisos que ya llegan. Para no inundar, el «Comenta» marca un resumen por hora («le mandó la guía a 12 personas»).
- **Asistente de Telegram (otro proyecto):** una ruta protegida con token para marcar.
- **Contestador de DM:** marca por mensaje.

## El chat de la oficina

- Hablan cuando empiezan, cuando le pasan algo a otro, cuando terminan y cuando algo falla. El que recibe contesta. De vez en cuando uno le tira una broma a otro (con tope por día para no hacer ruido).
- **Cómo se escribe:** en el servidor lo escribe el mismo agente, con su personalidad del catálogo, como parte de la tarea que ya corre (casi sin costo). En el sitio se usan frases por agente con variaciones y, si hace falta variedad, un modelo pequeño con un tope de gasto mensual.
- **Reglas:** español tico, tuteo entre ellos, nunca «pana», máximo una línea (unos 120 caracteres), sin nombres de clientes ni datos personales.
- **Dónde se ve:** un panel de chat en la Maqueta y en Maqueta y día, y como nubes sobre los Knox en la escena. Al tocar un mensaje se abre la ficha de quien lo dijo.

## En vivo

- Al cargar, el servidor (con la sesión de admin) trae el catálogo, las marcas de hoy y los últimos mensajes.
- Después, la página se entera de las marcas y mensajes nuevos (Supabase Realtime o, si no, una consulta cada 15 segundos) y la escena los anima: una marca `pasa` hace caminar al agente a la oficina del otro; una `entrega`, a la oficina de Alejandro.
- Si la pestaña no se ve, la animación se pausa.

## Decisiones mías después de la revisión (para que Alejandro las revise)

**1. Los Knox que hoy no tienen nada detrás.** Se agrega el estado **`pendiente`** («todavía no empieza»): la oficina con la luz apagada y un letrero «pronto». Nunca se muestra como «descansando» a alguien que no existe. Los Knox se conectan así con lo que corre hoy:

| Knox | Lo que corre hoy | Fase 1 |
|---|---|---|
| Drax | la tarea de la noche (servidor) | sí |
| Plexi, Pixa | las piezas de la noche (reels y posts) | sí |
| Lynx | la revisión que hace la noche, pieza por pieza | sí |
| Argo | el vigilante (servidor, 7:00 y al terminar la noche) | sí |
| Zap | `cron/publicar` | sí |
| Tiko | lo que `publicar` agenda en TikTok | sí |
| Vero | `cron/pruebas` | sí |
| Krono | `cron/pruebas-resumen` (después lo reemplaza `ig-audit`) | sí |
| Nova | `cron/ideas` | sí |
| Quark | `cron/analisis` | sí |
| Knox | `cron/knox` | sí |
| Luma | `cron/knox-arranques` | sí |
| Kash | `cron/payments-reconcile` | sí |
| Inko | `cron/contract-reminders` | sí |
| Dex | las respuestas a los DM del CRM | sí |
| Echo | el «Comenta» de Zernio; hay que escuchar `comment.received` en el webhook, que hoy se ignora | sí |
| Atlas, Volt | `ig-plan` e `ig-reply`, que todavía no existen | `pendiente` |
| Ping | el asistente de Telegram (otro proyecto de Alejandro) | `pendiente` hasta conectarlo |
| Mira, Remix, Clip, Quip | skills que él corre a mano | «cuando lo pidas» |

**2. Las tareas que revisan cada pocos minutos** (`publicar`, `ideas`, `payments-reconcile` y `pruebas`):
- Solo se anota una marca cuando la corrida **hizo algo**. El envoltorio recibe de la tarea si hizo algo y un resumen corto.
- Una corrida vacía solo actualiza «última revisión» en la fila del agente. No crea filas, no lo pone en «trabajando» un segundo, no cuenta como tarea y no habla en el chat.
- **Lo próximo** muestra las tareas diarias y semanales y las publicaciones programadas, por ejemplo «Prueba v4 de “La tienda”, 8:10 p. m.», tomadas del calendario de publicaciones.
- Las que revisan cada pocos minutos no salen en «Lo próximo». Su ficha dice «revisa cada 5 min · última vez: 7:20 p. m.».

**3. Cuándo deja de contar algo de «Para ti».**
- Cada entrega guarda a qué cosa apunta, cuando la hay: la tabla y el id.
- Sale de «Para ti» cuando eso ya se resolvió en cualquier lado (lo aprobó, lo frenó, ya salió o se descartó) o cuando él lo abre.
- Si no apunta a nada, se va sola a las 24 horas.
- Las vistas previas de la noche cuentan como «Para ti» hasta que el post sale o él lo frena.

**4. La noche no se reestructura.** Se pone nombre a los pasos que ya existen, porque cambiar el flujo arriesga que no salga nada, que es lo que él más odia. Las visitas representan pasos reales:
1. Drax reparte las piezas (`pasa` a Plexi y a Pixa).
2. Cada pieza va a revisión (`pasa` a Lynx).
3. Lynx aprueba y la deja programada (`pasa` a Zap).
4. La vista previa le llega a Alejandro (`entrega`).

Cada agente de la noche marca su propio `empieza`, `termina` o `falla` con el comando `marcar`, y la instrucción de la noche se lo pide.

## Fases

1. **Reloj de marcar y la página con estados reales:** tablas, catálogo sembrado desde la base (no desde el código), envoltorio para las tareas del sitio, comando `marcar` en el servidor, y la página en los dos dominios con las tres vistas, el panel y la ficha.
2. **El chat de la oficina.**
3. **Knox con más detalle y fotos de perfil:** sprites en pixel art y una foto realista por Knox con nano banana (unos $2 por los 24). Antes, una prueba con uno. Solo con el OK de gasto de Alejandro.
4. **Los agentes de Instagram nuevos** marcan desde el primer día, a medida que se construyen.

## Lo que queda al constructor

Los nombres exactos de columnas e índices, las políticas RLS (sin acceso anónimo; escritura solo con llave de servicio o ruta con token), cómo calcular el próximo horario (librería o propio), cómo pasar el prototipo a TypeScript y componentes, cómo cachear los dibujos, los tests y el detalle de cómo se reparte la página en el teléfono.
