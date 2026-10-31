// Todo el texto de la web. Sinopsis = contraportadas; citas y canciones verificadas contra los manuscritos.
// En el navegador viene de index.html; al prerenderizar, el script la deja en globalThis.__SITE_CONFIG__.
const cfg = (typeof window !== 'undefined' && window.SITE_CONFIG) || globalThis.__SITE_CONFIG__ || {};
const links = cfg.amazon || {};

const search = q => `https://www.amazon.es/s?k=${encodeURIComponent(q + ' Juanmi Díez')}`;
export const amazon = key =>
  links[key] && links[key].trim() ? links[key].trim() : search({ mgt: 'me gustas tú', ldr: 'los días raros', rey: 'rey' }[key]);
// v13: «trilogia» es el recopilatorio «me gustas tú. La trilogía» (un solo libro con los tres).
// Mientras esté vacío, la web lo anuncia como «Muy pronto en Amazon» y los botones llevan a su bloque.
export const OMNI_ANCHOR = '#trilogia-completa';
export const trilogyUrl = () => (links.trilogia && links.trilogia.trim()) || OMNI_ANCHOR;
export const instagram = 'https://www.instagram.com/juanmidiez/';
// ¿Tiene ya ficha propia en Amazon? (si no, la web lo anuncia como «Próximamente»)
export const onSale = key => !!(links[key] && links[key].trim());
// Datos de Amazon.es comprobados el 26 oct 2026 (revisar de vez en cuando).
// El recopilatorio: los tres libros en un volumen (KDP, oct 2026).
export const OMNI = {
  key: 'trilogia',
  omni: true,
  k3d: 'omni',
  n: 4,
  title: 'me gustas tú',
  sub: 'La trilogía',
  cover: 'a/cover_omni.webp',
  ink: '#3A3026',
  inkText: '#3A3026',
  fill: '#3A3026',
  dot: '#3A3026',
  stage: 'rgba(251, 179, 72, 0.16)',
  tagline: 'La historia completa, en un solo libro.',
  // v13.4: sinopsis nueva de la cubierta (30 oct 2026)
  lead: 'Mi nombre es Álvaro y el 25 de mayo de 2019 puse mi mundo patas arriba: borracho como las ratas, me lié con mi amigo Leo estando prometido con Mario.',
  quote: 'Lo que vino después no cupo en un libro. Ni en dos.',
  back: [
    'Mi nombre es Álvaro y el 25 de mayo de 2019 puse mi mundo patas arriba: borracho como las ratas, me lié con mi amigo Leo estando prometido con Mario. Lo que vino después no cupo en un libro. Ni en dos.',
    'Me gustas tú. La trilogía reúne Me gustas tú, Los días raros y Rey de principio a fin: una atropellada historia de (mucho) amor, superación y puro existencialismo.'
  ],
  formats: ['Tapa blanda', 'Tapa dura', 'Kindle'],
  isbn: { blanda: '979-8165531200', dura: '979-8165523748' }
};
export const STORE = {
  mgt: { rating: '4,2', count: 26, formats: 'Tapa blanda · Tapa dura · Kindle' },
  ldr: { rating: '5,0', count: 4, formats: 'Tapa blanda · Tapa dura · Kindle' }
};

export const BOOKS = [
  {
    key: 'mgt',
    n: 1,
    title: 'me gustas tú',
    cover: 'a/cover_mgt.webp',
    ink: '#1C78A8',
    inkText: '#057293',
    fill: '#057CA1',
    dot: '#399AC9',
    stage: 'rgba(28, 120, 168, 0.11)',
    tagline: 'El verano que lo cambió todo.',
    when: 'Madrid, Valencia e Italia · 2019',
    lead:
      'Mi nombre es Álvaro y el 25 de mayo de 2019 puse mi mundo patas arriba. Ese día, borracho como las ratas, acabé liándome con mi amigo Leo, traicionando así a mi prometido, Mario.',
    back: [
      'Mi nombre es Álvaro y el 25 de mayo de 2019 puse mi mundo patas arriba. Ese día, borracho como las ratas, acabé liándome con mi amigo Leo, traicionando así a mi prometido, Mario, y situándome en la casilla de salida de los meses más locos de toda mi vida. El verano que lo cambió todo nos dejó en la cuerda floja y nosotros pusimos todos los ingredientes necesarios para que aquella bomba de relojería explotase.',
      'Me Gustas Tú es una atropellada historia de (mucho) amor, superación y de puro existencialismo. Cuando Álvaro le es infiel a Mario, su pareja, se enfrenta a una nueva realidad: por qué después de 7 años de feliz relación, un pequeño desliz con su amigo Leo le hace replantearse si lo que tenía hasta la fecha con su pareja es lo que realmente quiere en su vida.'
    ],
    quote: 'Me dormí con el teléfono en la mano esperando un auxilio que no llegaría.',
    song: { name: 'Me Gustas Tú', artist: 'La Sonrisa de Julia', ch: 'Capítulo 11 de me gustas tú.' },
    playlist: { url: 'https://open.spotify.com/playlist/31hdiP9nihDOo05cFoZGDt', count: 32 },
    songs: [
      'Experience · Ludovico Einaudi',
      'A New Error · Moderat',
      'Los Días Raros · Vetusta Morla',
      'All Night · Beyoncé',
      'Rey · Alba Messa',
      'Me Gustas Tú · La Sonrisa de Julia',
      'Indian Summer · Jai Wolf',
      'Sweet Disposition · The Temper Trap',
      'Podría Ser Peor · La Casa Azul',
      'Despedida · Izal'
    ]
  },
  {
    key: 'ldr',
    n: 2,
    title: 'los días raros',
    cover: 'a/cover_ldr.webp',
    ink: '#D43B33',
    inkText: '#C01617',
    fill: '#E62526',
    dot: '#E62526',
    stage: 'rgba(229, 93, 42, 0.13)',
    tagline: 'Un invierno extraño.',
    when: 'Madrid y Valencia · 2020',
    lead:
      'Mientras el país entero se confinaba por la pandemia, yo lo hacía junto a Mario, en la casa que había sido nuestro hogar y también el escenario de nuestra ruptura.',
    back: [
      'El verano que lo cambió todo precedió a un invierno extraño. Mientras el país entero se confinaba por la pandemia, yo lo hacía junto a Mario, en la casa que había sido nuestro hogar y también el escenario de nuestra ruptura. Salvación o tortura, la crisis sanitaria de 2020 no solo me encerró entre cuatro paredes, también me obligó a detenerme y enfrentar todo lo que intenté dejar atrás con Leo. O eso creía.',
      'Los Días Raros es la secuela de Me Gustas Tú. En plena incertidumbre, Álvaro intentará volver a montar las piezas del puzzle que había desordenado Leo y reencontrarse a sí mismo, apoyado por Sabela y sus amigos de Valencia. Pero entre recuerdos y viejas costumbres, descubrirá que algunos amores no desaparecen tan fácilmente… aunque creamos haberles dicho adiós.'
    ],
    quote: 'Alejarme de ti va a ser la única solución que encuentro para aprender a quererte.',
    song: { name: 'Los Días Raros', artist: 'Vetusta Morla', ch: 'Capítulo 7 de me gustas tú. y epílogo de los días raros.' },
    playlist: { url: 'https://open.spotify.com/playlist/6cJ1KBulBvxEmOeQoBRHt1', count: 16 },
    songs: [
      'TVA First View · Natalie Holt',
      'You Don’t Even Know Me · Faouzia',
      'Qué Se Siente Al Ser Tan Joven · La Casa Azul',
      'Good Thing · Zedd y Kehlani',
      'Always Been You · Shawn Mendes',
      'Boys · Charli XCX',
      'Ego Talking · Fletcher',
      'Los Días Raros · Vetusta Morla'
    ]
  },
  {
    key: 'rey',
    n: 3,
    title: 'rey',
    cover: 'a/cover_rey.webp',
    ink: '#2D4897',
    inkText: '#945F00',
    fill: '#A36900',
    dot: '#FBB348',
    stage: 'rgba(255, 204, 0, 0.2)',
    tagline: 'Lo que pasa cuando por fin lo consigues.',
    when: 'Madrid y Málaga · 2020–2022',
    lead:
      'Una noche de febrero de 2022, con su primera novela recién publicada, Álvaro recibe un mensaje desconocido y se da cuenta de una realidad: cuando tu propia historia, deja de ser solo tuya.',
    back: [
      'Un nuevo Madrid frente a mis ojos: Leo y yo por fin juntos, la pospandemia devolviéndonos las calles y la vida retomando lo que dejamos a medias en el verano que lo cambió todo. Después de sobrevivir a la ruptura con Mario, a un confinamiento y a demasiadas versiones de nosotros mismos, solo me quedaba una asignatura pendiente: escribir todo aquello.',
      'Rey es el cierre de la trilogía iniciada con Me Gustas Tú y continuada en Los Días Raros; la historia de lo que pasa cuando por fin consigues lo que tanto perseguiste. Una noche de febrero de 2022, con su primera novela recién publicada, Álvaro recibe un mensaje desconocido y se da cuenta de una realidad: cuando tu propia historia, deja de ser solo tuya.'
    ],
    quote: 'Por primera vez, no sentí que la historia me perseguía. Por primera vez, era mía. Era el rey.',
    song: { name: 'Rey', artist: 'Alba Messa', ch: 'Capítulo 10 de me gustas tú.' },
    playlist: { url: 'https://open.spotify.com/playlist/15mdj0RhMrHDgtcoiIsCPG', count: 16 },
    songs: [
      'In Fantasia · Kishi Bashi',
      'We Cut The Night · AaRON',
      'Everything Goes My Way · Metronomy',
      'Jaque Al Rey · Belén Aguilera y Edurne',
      'Runaway · The Blaze',
      'C’est Toi · Satine',
      'Says · Nils Frahm',
      'Wonderland · Raül Refree',
      'Vampire · Olivia Rodrigo',
      'Roi · Videoclub'
    ]
  }
];

export const BIO = [
  'Juanmi Díez nació en Castellón de la Plana en 1989. Escritor, creativo y narrador audiovisual, se licenció en Comunicación Audiovisual y ha desarrollado su carrera profesional en el ámbito de la creatividad y la comunicación, trabajando en proyectos de estrategia, storytelling y producción de contenidos.',
  'En paralelo a su trayectoria profesional, ha desarrollado su faceta literaria con la trilogía formada por Me gustas tú, Los días raros y Rey. También ha dirigido cortometrajes de ficción como Treinta y Los suicidas, y la obra de teatro Sin vacaciones. Su trabajo se mueve entre la literatura autobiográfica, la narrativa audiovisual y la exploración de historias nacidas de experiencias reales.'
];
