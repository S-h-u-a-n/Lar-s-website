// Match the actual filename to the potion ID; unmatched IDs retain the SVG.
const potionImages = Object.fromEntries(Object.entries(import.meta.glob(
  '../../../Art/potion/*-potion.png', { eager: true, query: '?url', import: 'default' },
)).map(([path, src]) => [path.split('/').pop().replace('-potion.png', ''), src]))
// User-confirmed filename: clod-potion.png is the cold potion artwork.
const potionImageAliases = { cold: 'clod' }

// Small, replaceable UI placeholders. World landscapes are drawn by Canvas.
export function Bottle({ potion, pouring = false }) {
  const image = potionImages[potion.id] || potionImages[potionImageAliases[potion.id]]
  if (image) return <span className={`wp-bottle-art wp-bottle-image ${pouring ? 'is-tipped' : ''}`} aria-hidden="true">
    <img src={image} alt="" width="1000" height="1000" draggable={false} />
  </span>
  return <svg viewBox="0 0 76 108" className={`wp-bottle-art ${pouring ? 'is-tipped' : ''}`} aria-hidden="true">
    <path d="M29 15L47 14L47 36C47 43 61 46 62 63L61 87Q62 99 51 100L24 100Q13 98 14 87L15 63C15 48 29 44 29 36Z" fill="#FFFEF8" stroke="#34465A" strokeWidth="1.35" />
    <path d="M17 69Q28 64 39 68T59 68L58 87Q59 97 49 97L25 97Q17 96 17 87Z" fill={potion.color} fillOpacity=".9" />
    <path d="M21 57L20 84M34 22L34 33" stroke="#34465A" strokeWidth=".8" fill="none" opacity=".35" />
    {!pouring && <path d="M27 8L49 9L48 19L27 18Z" fill="#FFDBCA" stroke="#34465A" strokeWidth="1" />}
    <path d="M25 76L51 75L52 93L25 94Z" fill="#FDF9EE" stroke="#34465A" strokeWidth=".6" />
    {potion.mark === 'drop' && <path d="M38 79Q29 89 38 90Q47 89 38 79Z" stroke="#34465A" fill="none" />}
    {potion.mark === 'sun' && <g stroke="#34465A" fill="none"><circle cx="38" cy="85" r="3.5" /><path d="M38 77V79M38 91V93M30 85H32M44 85H46M32 79L34 81M42 89L44 91M32 91L34 89M42 81L44 79" /></g>}
    {potion.mark === 'snow' && <path d="M38 78V92M32 81L44 89M32 89L44 81M35 79L38 82L41 79" stroke="#34465A" fill="none" />}
    {potion.mark === 'wind' && <path d="M29 81H42Q48 81 45 77M29 85H46M31 89H40Q46 89 42 93" stroke="#34465A" fill="none" />}
    {potion.mark === 'cloud' && <path d="M30 89Q26 83 33 82Q36 75 42 81Q49 80 48 87Q47 91 30 89Z" stroke="#34465A" fill="none" />}
    {potion.mark === 'lava' && <path d="M29 91L35 79H41L48 91M34 85L38 88L42 84M36 76L35 72M42 76L44 72" stroke="#34465A" fill="none" />}
    {potion.mark === 'growth' && <g stroke="#34465A" fill="none"><path d="M38 93V82M38 87Q27 87 31 79Q39 79 38 87M38 84Q47 84 46 77Q38 77 38 84" /></g>}
    {potion.mark === 'sand' && <g fill="#34465A"><circle cx="33" cy="90" r="1.2" /><circle cx="38" cy="86" r="1.2" /><circle cx="43" cy="90" r="1.2" /><circle cx="38" cy="92" r="1.2" /><circle cx="38" cy="80" r="1" /></g>}
    {potion.mark === 'rainbow' && <g fill="none" strokeWidth="1"><path d="M29 89A9 9 0 0 1 47 89" stroke="#a57289" /><path d="M32 89A6 6 0 0 1 44 89" stroke="#b4a25e" /><path d="M35 89A3 3 0 0 1 41 89" stroke="#729787" /></g>}
  </svg>
}
export function WeatherOrbit() {
  return <svg viewBox="0 0 230 175" className="wp-orbit" aria-hidden="true">
    <circle cx="111" cy="86" r="59" fill="none" stroke="#A2D8DE" /><circle cx="111" cy="86" r="73" fill="none" stroke="#34465A" strokeOpacity=".25" strokeDasharray="2 8" />
    <ellipse cx="111" cy="86" rx="99" ry="23" fill="none" stroke="#92704B" strokeOpacity=".65" transform="rotate(-28 111 86)" />
    <path d="M109 58L118 80L140 87L118 94L109 116L102 94L80 87L102 80Z" fill="#F6F0A9" stroke="#92704B" strokeWidth=".8" />
    <rect x="173" y="25" width="19" height="19" rx="0" fill="#F691A6" transform="rotate(14 180 30)" /><circle cx="50" cy="131" r="9" fill="#7FB9EC" />
    <path d="M192 112L192 130M183 121H201" stroke="#34465A" strokeWidth=".8" />
  </svg>
}
export function EndingMark({ type }) {
  return <svg viewBox="0 0 100 90" aria-hidden="true" className="wp-ending-mark"><g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {type === 'ark' && <><path d="M15 51H85L73 69H29Z M28 50V30H72V50M23 30L50 15L78 30M44 33V49M55 33V49M10 78Q20 70 30 78T50 78T70 78T90 78" /></>}
    {type === 'split' && <><circle cx="50" cy="44" r="31" /><path d="M51 13L43 31L57 44L44 59L52 75M21 28L36 36L30 47M75 30L65 36L77 53" /></>}
    {type === 'snow' && <><path d="M50 10V78M20 27L80 62M20 62L80 27M40 17L50 27L60 17M40 71L50 61L60 71M25 39L37 37L34 24M65 66L64 53L77 53M25 51L37 52L34 66M65 23L64 35L77 35" /></>}
    {type === 'ruin' && <><path d="M16 36L50 16L84 36ZM22 41V67M33 41V67M47 41V67M58 41V67M73 41V67M18 68H81M14 76Q25 68 36 76T58 76T80 76" /></>}
    {type === 'dune' && <><circle cx="68" cy="23" r="11" /><path d="M10 67Q40 27 66 67M36 67Q66 36 91 67M10 75H91M42 53L48 64" /></>}
  </g></svg>
}
