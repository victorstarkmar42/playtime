/**
 * Continentes (contornos simplificados en longitud/latitud, dibujados a mano para niños: no son
 * mapas exactos) y sus países, en español e inglés. Los primeros países de cada lista son los más
 * conocidos: los pequeños ven sólo esos.
 */
export type Lon = number;
export type Lat = number;
export type Ring = [Lon, Lat][];

export type ContinentId = 'africa' | 'norteamerica' | 'sudamerica' | 'europa' | 'asia' | 'oceania' | 'antartida';

export interface Continent {
  id: ContinentId;
  es: string;
  en: string;
  color: string;
  /** Where the globe turns to when it is chosen. */
  center: [Lon, Lat];
  fact: { es: string; en: string };
  countries: [string, string][];
  rings: Ring[];
}

// Border shared by Europe and Asia: Black Sea → Caucasus → Caspian → Ural river → Ural mountains → Arctic.
const EURASIA_BORDER: Ring = [[38.5, 44.5], [42, 45.5], [47, 45.5], [49, 46.5], [51.5, 47], [52, 50], [59, 51], [60, 55], [60, 60], [60, 65], [60, 69]];

const antarctica: Ring = (() => {
  const r: Ring = [[-180, -90]];
  for (let lon = -180; lon <= 180; lon += 10) {
    let lat = -70 + 3 * Math.sin((lon * Math.PI) / 45) - 2 * Math.cos((lon * Math.PI) / 70);
    if (lon >= -70 && lon <= -55) lat = -64 + (lon + 62) * 0.15; // the peninsula reaching toward South America
    r.push([lon, lat]);
  }
  r.push([180, -90]);
  return r;
})();

export const CONTINENTS: Continent[] = [
  {
    id: 'norteamerica', es: 'América del Norte', en: 'North America', color: '#F2884B', center: [-100, 40],
    fact: { es: 'Aquí están México, Estados Unidos y Canadá, y también Centroamérica y el Caribe. Con América del Sur forma el continente americano.', en: 'Mexico, the United States and Canada are here, with Central America and the Caribbean.' },
    countries: [['México', 'Mexico'], ['Estados Unidos', 'United States'], ['Canadá', 'Canada'], ['Cuba', 'Cuba'], ['Guatemala', 'Guatemala'], ['Costa Rica', 'Costa Rica'], ['Panamá', 'Panama'], ['Jamaica', 'Jamaica'],
      ['Antigua y Barbuda', 'Antigua and Barbuda'], ['Bahamas', 'The Bahamas'], ['Barbados', 'Barbados'], ['Belice', 'Belize'], ['Dominica', 'Dominica'], ['El Salvador', 'El Salvador'], ['Granada', 'Grenada'], ['Haití', 'Haiti'], ['Honduras', 'Honduras'], ['Nicaragua', 'Nicaragua'], ['República Dominicana', 'Dominican Republic'], ['San Cristóbal y Nieves', 'Saint Kitts and Nevis'], ['San Vicente y las Granadinas', 'Saint Vincent and the Grenadines'], ['Santa Lucía', 'Saint Lucia'], ['Trinidad y Tobago', 'Trinidad and Tobago']],
    rings: [
      [[-168, 66], [-162, 70], [-156, 71.5], [-140, 70], [-128, 70], [-115, 68], [-95, 72], [-85, 70], [-80, 63], [-94, 59], [-90, 57], [-82, 55], [-79, 52], [-77, 60], [-70, 59], [-64, 60], [-60, 55], [-56, 52], [-60, 47], [-66, 44], [-70, 42], [-74, 40], [-76, 35], [-81, 31], [-80, 26], [-82, 25.5], [-82.5, 28], [-84, 30], [-89, 30], [-94, 29.5], [-97, 27], [-97.5, 22], [-96, 19], [-94, 18.5], [-91, 19], [-90.5, 21], [-87, 21.5], [-88, 17], [-84, 15.5], [-83.5, 11], [-81.5, 9], [-79, 9.5], [-77.5, 8], [-80, 7.3], [-82, 8.2], [-85.5, 10], [-87.5, 13], [-91, 14], [-94, 16], [-97, 15.8], [-102, 18], [-105.5, 20.5], [-105.7, 23], [-109, 25.5], [-112.5, 30], [-114.5, 31.5], [-113, 29], [-110, 23.5], [-112, 24.5], [-115, 28], [-117.2, 32.5], [-120.5, 34.5], [-124, 40], [-124.5, 48], [-127.5, 50.5], [-133, 55], [-140, 59.8], [-148, 60.5], [-152, 58], [-158, 56], [-164, 55], [-158, 58.5], [-162, 60], [-165, 62.5], [-164.5, 64.5]],
      [[-73, 78], [-60, 82], [-30, 83.5], [-20, 81], [-18, 76], [-22, 70], [-30, 68], [-40, 65], [-43, 60], [-48, 61], [-52, 65], [-54, 69], [-58, 75], [-68, 76]],
      [[-120, 74], [-100, 80], [-80, 83], [-62, 82], [-75, 74], [-90, 72], [-110, 71], [-125, 72]],
      [[-85, 22], [-80, 23.2], [-74.2, 20.2], [-77.5, 19.8], [-82, 21.5]],
      [[-74.5, 19.8], [-70, 19.7], [-68.4, 18.5], [-71.5, 17.6], [-74.4, 18.4]],
    ],
  },
  {
    id: 'sudamerica', es: 'América del Sur', en: 'South America', color: '#5DBB63', center: [-60, -18],
    fact: { es: 'Aquí está la selva del Amazonas, el bosque tropical más grande del mundo, y la cordillera de los Andes.', en: 'The Amazon rainforest and the Andes mountains are here.' },
    countries: [['Brasil', 'Brazil'], ['Argentina', 'Argentina'], ['Colombia', 'Colombia'], ['Perú', 'Peru'], ['Chile', 'Chile'], ['Venezuela', 'Venezuela'], ['Ecuador', 'Ecuador'], ['Bolivia', 'Bolivia'], ['Paraguay', 'Paraguay'], ['Uruguay', 'Uruguay'], ['Guyana', 'Guyana'], ['Surinam', 'Suriname']],
    rings: [[[-77, 8.5], [-72, 11.8], [-64, 10.7], [-61, 10.5], [-57, 6], [-52, 5], [-50, 1], [-48, -1], [-44, -2.5], [-38, -4], [-35, -5.5], [-35, -9], [-39, -13.5], [-39, -17.5], [-41, -22], [-44.5, -23.2], [-48.5, -26], [-48.8, -28.5], [-53, -33.5], [-56, -34.8], [-57.5, -36.5], [-57, -38.5], [-62, -39], [-62.5, -41], [-65, -42], [-64.5, -45], [-67.5, -46.5], [-66, -48], [-69, -51], [-68.5, -53], [-65.5, -55], [-70, -55], [-74, -52], [-75.5, -47], [-73.5, -43], [-73.5, -37], [-71.5, -32], [-71.3, -27], [-70.2, -18.5], [-76, -14], [-79, -8], [-81.2, -5], [-80, -2], [-80.5, 0.5], [-78.8, 1.8], [-77.5, 4], [-77.4, 7.2]]],
  },
  {
    id: 'europa', es: 'Europa', en: 'Europe', color: '#7B61D9', center: [15, 50],
    fact: { es: 'Tiene muchos países cerca unos de otros y castillos muy antiguos. Rusia está en Europa y en Asia.', en: 'It has many countries close together and very old castles.' },
    countries: [['España', 'Spain'], ['Francia', 'France'], ['Italia', 'Italy'], ['Alemania', 'Germany'], ['Reino Unido', 'United Kingdom'], ['Portugal', 'Portugal'], ['Grecia', 'Greece'], ['Rusia', 'Russia'],
      ['Albania', 'Albania'], ['Andorra', 'Andorra'], ['Austria', 'Austria'], ['Bélgica', 'Belgium'], ['Bielorrusia', 'Belarus'], ['Bosnia y Herzegovina', 'Bosnia and Herzegovina'], ['Bulgaria', 'Bulgaria'], ['Croacia', 'Croatia'], ['Dinamarca', 'Denmark'], ['Eslovaquia', 'Slovakia'], ['Eslovenia', 'Slovenia'], ['Estonia', 'Estonia'], ['Finlandia', 'Finland'], ['Hungría', 'Hungary'], ['Irlanda', 'Ireland'], ['Islandia', 'Iceland'], ['Letonia', 'Latvia'], ['Liechtenstein', 'Liechtenstein'], ['Lituania', 'Lithuania'], ['Luxemburgo', 'Luxembourg'], ['Macedonia del Norte', 'North Macedonia'], ['Malta', 'Malta'], ['Moldavia', 'Moldova'], ['Mónaco', 'Monaco'], ['Montenegro', 'Montenegro'], ['Noruega', 'Norway'], ['Países Bajos', 'Netherlands'], ['Polonia', 'Poland'], ['República Checa', 'Czech Republic'], ['Rumania', 'Romania'], ['San Marino', 'San Marino'], ['Serbia', 'Serbia'], ['Suecia', 'Sweden'], ['Suiza', 'Switzerland'], ['Ucrania', 'Ukraine'], ['Ciudad del Vaticano', 'Vatican City']],
    rings: [
      [[50, 68], [44, 68.5], [40, 66.5], [35, 69], [28, 71], [20, 70], [15, 68.5], [12, 65], [8, 63], [5, 61], [5.5, 58.5], [7, 58], [10.5, 59.5], [12, 56.5], [14, 55.5], [16, 57], [18.5, 60], [17.5, 62.5], [21, 64.5], [22.5, 65.8], [25, 65], [21.5, 61], [23, 60], [28, 60.5], [30, 59.9], [24, 59.4], [21.5, 57.5], [21, 56], [19.5, 54.4], [14, 54], [11, 54], [10.5, 57.5], [8.2, 56.5], [8.5, 55], [8.5, 53.5], [5, 53], [4, 51.5], [1.6, 51], [-1.5, 49.7], [-4.7, 48.5], [-2, 47], [-1.2, 44.5], [-1.8, 43.4], [-8, 43.7], [-9.3, 43], [-8.8, 41], [-9.5, 38.8], [-8.9, 37], [-6, 36.2], [-5.5, 36], [-2, 36.7], [0, 38.8], [0.8, 41], [3.2, 42], [3, 43.3], [6, 43], [8.5, 44.3], [10.5, 43], [12.5, 41.8], [15.6, 40], [15.7, 38], [16.5, 38.5], [18.5, 40.2], [17, 41], [16, 41.9], [14, 42.6], [12.5, 44.5], [13.7, 45.7], [15, 45], [17.5, 43], [19.5, 41.8], [19.5, 40], [21, 38.3], [22, 36.5], [23, 37.8], [24, 38.2], [23, 39.5], [24, 40.8], [26.2, 40.8], [26.5, 41.3], [28.5, 41.3], [28, 43], [29.5, 45], [31, 46.6], [33.5, 46], [32.5, 45.3], [33.5, 44.4], [36, 45.4], [35, 46], [38, 47], [39.5, 47.2], ...EURASIA_BORDER.slice(0, -1), [60, 69], [56, 68.5]],
      [[-5.7, 50], [1.7, 51], [1.7, 52.8], [0, 53.5], [-1.5, 55], [-2, 57], [-1.8, 57.7], [-4, 58.6], [-5, 58.6], [-6.2, 56.6], [-5, 55.6], [-4.8, 54.8], [-3.2, 54.2], [-3, 53.3], [-4.6, 53.2], [-4.2, 52.3], [-5.2, 51.7], [-3.3, 51.4]],
      [[-6, 52], [-6, 54], [-7.3, 55.3], [-8.5, 54.4], [-10, 53.4], [-9.8, 51.6]],
      [[-24, 65.5], [-22, 66.4], [-16, 66.5], [-13.5, 65], [-18, 63.4], [-22.5, 63.8]],
    ],
  },
  {
    id: 'africa', es: 'África', en: 'Africa', color: '#F2B91C', center: [20, 5],
    fact: { es: 'Aquí viven leones, jirafas y elefantes, y está el desierto del Sahara, el más grande y caliente del mundo.', en: 'Lions, giraffes and elephants live here, and the Sahara desert is here.' },
    countries: [['Egipto', 'Egypt'], ['Nigeria', 'Nigeria'], ['Sudáfrica', 'South Africa'], ['Kenia', 'Kenya'], ['Marruecos', 'Morocco'], ['Etiopía', 'Ethiopia'], ['Ghana', 'Ghana'], ['Madagascar', 'Madagascar'],
      ['Argelia', 'Algeria'], ['Angola', 'Angola'], ['Benín', 'Benin'], ['Botsuana', 'Botswana'], ['Burkina Faso', 'Burkina Faso'], ['Burundi', 'Burundi'], ['Cabo Verde', 'Cape Verde'], ['Camerún', 'Cameroon'], ['Chad', 'Chad'], ['Comoras', 'Comoros'], ['Costa de Marfil', 'Ivory Coast'], ['Yibuti', 'Djibouti'], ['Eritrea', 'Eritrea'], ['Esuatini', 'Eswatini'], ['Gabón', 'Gabon'], ['Gambia', 'The Gambia'], ['Guinea', 'Guinea'], ['Guinea-Bisáu', 'Guinea-Bissau'], ['Guinea Ecuatorial', 'Equatorial Guinea'], ['Lesoto', 'Lesotho'], ['Liberia', 'Liberia'], ['Libia', 'Libya'], ['Malaui', 'Malawi'], ['Malí', 'Mali'], ['Mauricio', 'Mauritius'], ['Mauritania', 'Mauritania'], ['Mozambique', 'Mozambique'], ['Namibia', 'Namibia'], ['Níger', 'Niger'], ['República Centroafricana', 'Central African Republic'], ['República del Congo', 'Republic of the Congo'], ['República Democrática del Congo', 'DR Congo'], ['Ruanda', 'Rwanda'], ['Santo Tomé y Príncipe', 'São Tomé and Príncipe'], ['Senegal', 'Senegal'], ['Seychelles', 'Seychelles'], ['Sierra Leona', 'Sierra Leone'], ['Somalia', 'Somalia'], ['Sudán', 'Sudan'], ['Sudán del Sur', 'South Sudan'], ['Tanzania', 'Tanzania'], ['Togo', 'Togo'], ['Túnez', 'Tunisia'], ['Uganda', 'Uganda'], ['Zambia', 'Zambia'], ['Zimbabue', 'Zimbabwe']],
    rings: [
      [[-5.9, 35.8], [-2, 35.1], [3, 36.8], [10, 37.3], [11, 35.5], [10.2, 34.2], [11.5, 33], [15.2, 32.3], [19.5, 30.3], [20, 31.8], [23, 32.6], [25, 31.6], [29, 30.9], [32.3, 31.2], [32.5, 29.9], [33.5, 27], [35.5, 23.5], [37.2, 21], [38.5, 18], [39.7, 15.3], [41.7, 13.3], [43.3, 12.5], [44.5, 10.4], [51.2, 11.8], [51, 10.4], [49.5, 6.5], [47.7, 4.2], [43, -0.5], [40, -3.5], [39.2, -6.5], [40.5, -10.5], [40.5, -15], [37, -18.5], [35.3, -22], [35.5, -24], [32.7, -25.9], [32.5, -28.7], [30.2, -31.3], [27, -33.6], [22.5, -34], [20, -34.8], [18.4, -34.2], [17.8, -31.5], [15.2, -27], [14.5, -22.5], [11.8, -17.2], [12.3, -13], [13.2, -9], [12.2, -6], [9.4, -2], [9.6, 2.5], [9.8, 3.8], [8.5, 4.5], [6, 4.3], [4.5, 6.3], [1.5, 6.1], [-2, 4.8], [-4.5, 5.2], [-7.5, 4.4], [-11.5, 6.9], [-13.3, 8.5], [-15, 11], [-16.8, 12.5], [-17.5, 14.7], [-16.5, 16.2], [-16.1, 19.6], [-17, 21], [-15, 24], [-13.2, 27.6], [-9.8, 29.8], [-9.7, 32.5], [-6.8, 34]],
      [[49.3, -12], [50.5, -15.5], [49.8, -17.2], [47.2, -24.8], [45.2, -25.5], [43.3, -22], [44.4, -16.6], [47, -15.6]],
    ],
  },
  {
    id: 'asia', es: 'Asia', en: 'Asia', color: '#E5536B', center: [90, 35],
    fact: { es: 'Es el continente más grande y donde vive más gente. Aquí está el Everest, la montaña más alta del mundo.', en: 'It is the biggest continent, where most people live. Mount Everest is here.' },
    countries: [['China', 'China'], ['India', 'India'], ['Japón', 'Japan'], ['Corea del Sur', 'South Korea'], ['Indonesia', 'Indonesia'], ['Arabia Saudita', 'Saudi Arabia'], ['Turquía', 'Turkey'], ['Tailandia', 'Thailand'],
      ['Filipinas', 'Philippines'], ['Vietnam', 'Vietnam'], ['Afganistán', 'Afghanistan'], ['Armenia', 'Armenia'], ['Azerbaiyán', 'Azerbaijan'], ['Baréin', 'Bahrain'], ['Bangladés', 'Bangladesh'], ['Bután', 'Bhutan'], ['Brunéi', 'Brunei'], ['Camboya', 'Cambodia'], ['Catar', 'Qatar'], ['Chipre', 'Cyprus'], ['Corea del Norte', 'North Korea'], ['Emiratos Árabes Unidos', 'United Arab Emirates'], ['Georgia', 'Georgia'], ['Irak', 'Iraq'], ['Irán', 'Iran'], ['Israel', 'Israel'], ['Jordania', 'Jordan'], ['Kazajistán', 'Kazakhstan'], ['Kirguistán', 'Kyrgyzstan'], ['Kuwait', 'Kuwait'], ['Laos', 'Laos'], ['Líbano', 'Lebanon'], ['Malasia', 'Malaysia'], ['Maldivas', 'Maldives'], ['Mongolia', 'Mongolia'], ['Birmania', 'Myanmar'], ['Nepal', 'Nepal'], ['Omán', 'Oman'], ['Pakistán', 'Pakistan'], ['Palestina', 'Palestine'], ['Singapur', 'Singapore'], ['Siria', 'Syria'], ['Sri Lanka', 'Sri Lanka'], ['Tayikistán', 'Tajikistan'], ['Timor Oriental', 'East Timor'], ['Turkmenistán', 'Turkmenistan'], ['Uzbekistán', 'Uzbekistan'], ['Yemen', 'Yemen']],
    rings: [
      [[60, 69], [68, 69], [73, 72], [80, 73], [88, 75.5], [100, 77], [105, 77.5], [113, 73.5], [128, 73], [140, 72.5], [150, 71.5], [160, 70], [170, 70], [180, 69], [180, 65], [178, 62.5], [170, 60], [163.5, 59], [162, 56], [158.5, 52.8], [156.5, 51], [156, 57], [152, 59], [143, 59.3], [137, 54], [141, 52.5], [140.5, 48.5], [135, 43.5], [131, 42.6], [129.5, 41], [129.5, 36], [126.5, 34.5], [126, 37.5], [124.5, 40], [121.5, 40.9], [118, 39], [119, 37], [122.5, 37], [120, 35], [121, 32], [122, 30], [119.5, 25.5], [116, 22.8], [111, 21.5], [110, 20.5], [108.5, 21.7], [106.6, 20], [105.8, 18.7], [108.8, 15.5], [109.3, 12], [107, 10.5], [105, 8.6], [104.8, 10.2], [103, 11.5], [100.5, 13.4], [99.2, 10.5], [100.5, 7], [103.4, 4], [104.3, 1.4], [103.5, 1.3], [101, 2.8], [98.3, 7.8], [98.5, 13], [97.6, 16.5], [94.5, 16.5], [94, 19.5], [92, 21.5], [91, 22.5], [88.5, 21.6], [87, 21.5], [85, 19.5], [82.3, 17], [80.3, 15.5], [80, 10], [77.5, 8], [76.5, 9.5], [74.8, 13], [73, 19], [72.6, 21.5], [70, 22.5], [68.5, 23.5], [66.5, 25.4], [61.6, 25.2], [57.3, 25.8], [56.4, 26.2], [56.5, 24], [58.6, 23.6], [59.8, 22.5], [57.8, 19], [55, 17], [52, 15.6], [48, 14], [43.5, 12.7], [42.8, 14.5], [42, 16.8], [39, 21.5], [37, 25.5], [35, 28], [34.3, 28], [32.5, 29.9], [32.3, 31.2], [34.3, 31.3], [35, 33], [35.9, 35], [36, 36.7], [34.5, 36.8], [32.5, 36.1], [30.5, 36.6], [28, 36.8], [27.2, 37.4], [26.3, 38.3], [26.7, 39.5], [26.2, 40.1], [27, 40.4], [29, 41], [31.5, 41.2], [35, 42], [38, 41], [41.5, 41.5], [41.7, 42], [40, 43.5], ...EURASIA_BORDER.slice(0, -1)],
      [[-180, 65], [-180, 69], [-175, 67.5], [-170, 66], [-172.5, 64.5], [-178, 65]],
      [[130, 31], [131.5, 31.5], [132, 33.8], [135, 33.5], [137, 34.5], [140, 35], [141, 38], [142, 40], [141.4, 41.5], [140, 40.5], [139.8, 38], [137, 37], [135.5, 35.6], [132.5, 35.5], [130.9, 34], [130, 33]],
      [[140, 41.5], [141.5, 42.5], [145.5, 43.3], [144, 44.2], [141.7, 45.4], [140.5, 43]],
      [[120, 18.5], [122.3, 18.5], [122, 16], [124, 13], [121, 13.6], [120.5, 15], [119.8, 16.5]],
      [[122, 7], [126.5, 7], [126, 9.5], [123, 8.5]],
      [[95.3, 5.6], [98, 4], [103, 0], [106, -3], [106, -5.8], [104.5, -5.9], [101, -2], [98.5, 1.5], [95.2, 4]],
      [[109, 1.8], [111, 1.4], [113, 3.2], [116, 7], [119, 5], [118, 1], [117, -1], [116, -4], [110.5, -3], [109, -0.5]],
      [[105.2, -6.8], [108, -6.3], [111, -6.5], [114.5, -7.7], [111, -8.2], [106, -7.4]],
      [[119.5, -5.5], [120.5, 0.8], [124.5, 1.4], [121.5, -1], [123, -4], [120.5, -3], [120.4, -5.5]],
      [[79.8, 6], [80, 9.8], [81.9, 7.5], [81, 6]],
    ],
  },
  {
    id: 'oceania', es: 'Oceanía', en: 'Oceania', color: '#4AA3F0', center: [140, -25],
    fact: { es: 'Tiene miles de islas en el océano Pacífico. Aquí viven los canguros y los koalas.', en: 'It has thousands of islands in the Pacific. Kangaroos and koalas live here.' },
    countries: [['Australia', 'Australia'], ['Nueva Zelanda', 'New Zealand'], ['Papúa Nueva Guinea', 'Papua New Guinea'], ['Fiyi', 'Fiji'], ['Samoa', 'Samoa'], ['Tonga', 'Tonga'], ['Islas Salomón', 'Solomon Islands'], ['Vanuatu', 'Vanuatu'], ['Islas Marshall', 'Marshall Islands'], ['Kiribati', 'Kiribati'], ['Micronesia', 'Micronesia'], ['Nauru', 'Nauru'], ['Palaos', 'Palau'], ['Tuvalu', 'Tuvalu']],
    rings: [
      [[113.4, -22], [114, -26], [115, -34], [118, -35], [123, -33.8], [126, -32.3], [131, -31.5], [135, -34.8], [137.8, -33], [138.5, -35.5], [140, -37.8], [144, -38.4], [146.4, -39.1], [150, -37.5], [151.3, -33.9], [153.6, -28.5], [153, -25], [150.8, -22.5], [146, -19], [145.4, -15], [143.5, -14], [142.5, -10.7], [141.5, -13], [141.6, -16.5], [140.6, -17.5], [136, -15.5], [136.8, -12.2], [132.5, -11.4], [129.6, -14.9], [126, -14], [122.2, -17.5], [121, -19.6], [116.7, -20.6]],
      [[144.6, -40.7], [148.3, -40.9], [148, -43.2], [146, -43.6]],
      [[172.7, -34.4], [174.5, -36.8], [178.5, -37.7], [177, -39.5], [176, -41.3], [174.8, -41.3], [175, -39.5], [173.8, -39.2], [174.5, -36.5]],
      [[172.7, -40.5], [174.3, -41.7], [173, -43.8], [171, -45], [169, -46.6], [166.5, -46], [168, -44], [171.5, -41.8]],
      [[131, -1.4], [134, -0.8], [138, -1.6], [141, -2.6], [145.5, -4.6], [147.5, -6.2], [150.5, -10.5], [147, -10.2], [144, -7.8], [141, -9.1], [138, -8.3], [137.6, -5], [133.5, -4], [132, -2.8]],
    ],
  },
  {
    id: 'antartida', es: 'Antártida', en: 'Antarctica', color: '#E8F1FA', center: [0, -80],
    fact: { es: 'Es el lugar más frío del mundo y está cubierta de hielo. No tiene países: ahí viven pingüinos, focas y científicos que la estudian.', en: 'It is the coldest place on Earth, covered in ice. It has no countries: penguins, seals and scientists live there.' },
    countries: [],
    rings: [antarctica],
  },
];

/** How many countries each age sees in the list (the most known first). */
export const COUNTRIES_SHOWN = { '3-4': 4, '5-6': 8, '7-9': Infinity } as const;
