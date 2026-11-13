/**
 * Destination Autocomplete Database & Geospatial Calculations
 * Comprehensive global catalog covering all continents + real-time OpenStreetMap geocoding integration
 */

export interface DestinationItem {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  stationOrAirport?: string;
  isPopular?: boolean;
  source?: 'Curated Hub' | 'OpenStreetMap';
}

export const POPULAR_DESTINATIONS: DestinationItem[] = [
  // --- EUROPE: Central, Western & Alpine ---
  { id: 'zermatt-ch', name: 'Zermatt', country: 'Switzerland', region: 'Valais Alps', lat: 45.9765, lng: 7.7491, stationOrAirport: 'Zermatt Railway Station', isPopular: true },
  { id: 'zurich-ch', name: 'Zurich', country: 'Switzerland', region: 'Canton of Zurich', lat: 47.3769, lng: 8.5417, stationOrAirport: 'Zürich HB (ZRH)', isPopular: true },
  { id: 'geneva-ch', name: 'Geneva', country: 'Switzerland', region: 'Romandy', lat: 46.2044, lng: 6.1432, stationOrAirport: 'Genève-Cornavin (GVA)', isPopular: true },
  { id: 'interlaken-ch', name: 'Interlaken', country: 'Switzerland', region: 'Bernese Oberland', lat: 46.6863, lng: 7.8632, stationOrAirport: 'Interlaken Ost', isPopular: true },
  { id: 'lucerne-ch', name: 'Lucerne', country: 'Switzerland', region: 'Central Switzerland', lat: 47.0502, lng: 8.3093, stationOrAirport: 'Luzern Bahnhof', isPopular: true },
  { id: 'basel-ch', name: 'Basel', country: 'Switzerland', region: 'Basel-Stadt', lat: 47.5596, lng: 7.5886, stationOrAirport: 'Basel SBB (BSL)', isPopular: false },
  { id: 'paris-fr', name: 'Paris', country: 'France', region: 'Île-de-France', lat: 48.8566, lng: 2.3522, stationOrAirport: 'Gare de Lyon / CDG', isPopular: true },
  { id: 'lyon-fr', name: 'Lyon', country: 'France', region: 'Auvergne-Rhône-Alpes', lat: 45.7640, lng: 4.8357, stationOrAirport: 'Lyon Part-Dieu (LYS)', isPopular: true },
  { id: 'nice-fr', name: 'Nice', country: 'France', region: 'French Riviera', lat: 43.7102, lng: 7.2620, stationOrAirport: 'Gare de Nice-Ville (NCE)', isPopular: true },
  { id: 'marseille-fr', name: 'Marseille', country: 'France', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.2965, lng: 5.3698, stationOrAirport: 'Marseille Saint-Charles (MRS)', isPopular: true },
  { id: 'bordeaux-fr', name: 'Bordeaux', country: 'France', region: 'Nouvelle-Aquitaine', lat: 44.8378, lng: -0.5792, stationOrAirport: 'Bordeaux Saint-Jean (BOD)', isPopular: true },
  { id: 'strasbourg-fr', name: 'Strasbourg', country: 'France', region: 'Grand Est', lat: 48.5734, lng: 7.7521, stationOrAirport: 'Gare de Strasbourg (SXB)', isPopular: false },
  { id: 'berlin-de', name: 'Berlin', country: 'Germany', region: 'Berlin', lat: 52.5200, lng: 13.4050, stationOrAirport: 'Berlin Hbf (BER)', isPopular: true },
  { id: 'munich-de', name: 'Munich', country: 'Germany', region: 'Bavaria', lat: 48.1351, lng: 11.5820, stationOrAirport: 'München Hbf (MUC)', isPopular: true },
  { id: 'frankfurt-de', name: 'Frankfurt', country: 'Germany', region: 'Hesse', lat: 50.1109, lng: 8.6821, stationOrAirport: 'Frankfurt Hbf (FRA)', isPopular: true },
  { id: 'hamburg-de', name: 'Hamburg', country: 'Germany', region: 'Hamburg', lat: 53.5511, lng: 9.9937, stationOrAirport: 'Hamburg Hbf (HAM)', isPopular: true },
  { id: 'cologne-de', name: 'Cologne', country: 'Germany', region: 'North Rhine-Westphalia', lat: 50.9375, lng: 6.9603, stationOrAirport: 'Köln Hbf (CGN)', isPopular: true },
  { id: 'vienna-at', name: 'Vienna', country: 'Austria', region: 'Vienna State', lat: 48.2082, lng: 16.3738, stationOrAirport: 'Wien Hauptbahnhof (VIE)', isPopular: true },
  { id: 'salzburg-at', name: 'Salzburg', country: 'Austria', region: 'Salzburg State', lat: 47.8095, lng: 13.0550, stationOrAirport: 'Salzburg Hbf', isPopular: true },
  { id: 'innsbruck-at', name: 'Innsbruck', country: 'Austria', region: 'Tyrol', lat: 47.2692, lng: 11.4041, stationOrAirport: 'Innsbruck Hbf', isPopular: true },
  { id: 'amsterdam-nl', name: 'Amsterdam', country: 'Netherlands', region: 'North Holland', lat: 52.3676, lng: 4.9041, stationOrAirport: 'Amsterdam Centraal (AMS)', isPopular: true },
  { id: 'rotterdam-nl', name: 'Rotterdam', country: 'Netherlands', region: 'South Holland', lat: 51.9244, lng: 4.4777, stationOrAirport: 'Rotterdam Centraal (RTM)', isPopular: false },
  { id: 'brussels-be', name: 'Brussels', country: 'Belgium', region: 'Brussels-Capital', lat: 50.8503, lng: 4.3517, stationOrAirport: 'Bruxelles-Midi (BRU)', isPopular: true },
  { id: 'bruges-be', name: 'Bruges', country: 'Belgium', region: 'Flanders', lat: 51.2093, lng: 3.2247, stationOrAirport: 'Station Brugge', isPopular: true },

  // --- EUROPE: Southern & Mediterranean ---
  { id: 'rome-it', name: 'Rome', country: 'Italy', region: 'Lazio', lat: 41.9028, lng: 12.4964, stationOrAirport: 'Roma Termini (FCO)', isPopular: true },
  { id: 'milan-it', name: 'Milan', country: 'Italy', region: 'Lombardy', lat: 45.4642, lng: 9.1900, stationOrAirport: 'Milano Centrale (MXP)', isPopular: true },
  { id: 'florence-it', name: 'Florence', country: 'Italy', region: 'Tuscany', lat: 43.7696, lng: 11.2558, stationOrAirport: 'Firenze SMN', isPopular: true },
  { id: 'venice-it', name: 'Venice', country: 'Italy', region: 'Veneto', lat: 45.4408, lng: 12.3155, stationOrAirport: 'Venezia Santa Lucia (VCE)', isPopular: true },
  { id: 'naples-it', name: 'Naples', country: 'Italy', region: 'Campania', lat: 40.8518, lng: 14.2681, stationOrAirport: 'Napoli Centrale (NAP)', isPopular: true },
  { id: 'bologna-it', name: 'Bologna', country: 'Italy', region: 'Emilia-Romagna', lat: 44.4949, lng: 11.3426, stationOrAirport: 'Bologna Centrale (BLQ)', isPopular: false },
  { id: 'barcelona-es', name: 'Barcelona', country: 'Spain', region: 'Catalonia', lat: 41.3879, lng: 2.1699, stationOrAirport: 'Barcelona Sants (BCN)', isPopular: true },
  { id: 'madrid-es', name: 'Madrid', country: 'Spain', region: 'Community of Madrid', lat: 40.4168, lng: -3.7038, stationOrAirport: 'Madrid Atocha (MAD)', isPopular: true },
  { id: 'seville-es', name: 'Seville', country: 'Spain', region: 'Andalusia', lat: 37.3891, lng: -5.9845, stationOrAirport: 'Sevilla Santa Justa (SVQ)', isPopular: true },
  { id: 'valencia-es', name: 'Valencia', country: 'Spain', region: 'Valencian Community', lat: 39.4699, lng: -0.3763, stationOrAirport: 'Valencia Joaquín Sorolla (VLC)', isPopular: true },
  { id: 'granada-es', name: 'Granada', country: 'Spain', region: 'Andalusia', lat: 37.1773, lng: -3.5986, stationOrAirport: 'Estación de Granada (GRX)', isPopular: true },
  { id: 'malaga-es', name: 'Malaga', country: 'Spain', region: 'Andalusia', lat: 36.7213, lng: -4.4214, stationOrAirport: 'Málaga María Zambrano (AGP)', isPopular: true },
  { id: 'lisbon-pt', name: 'Lisbon', country: 'Portugal', region: 'Lisbon District', lat: 38.7223, lng: -9.1393, stationOrAirport: 'Lisboa Oriente (LIS)', isPopular: true },
  { id: 'porto-pt', name: 'Porto', country: 'Portugal', region: 'Porto District', lat: 41.1579, lng: -8.6291, stationOrAirport: 'Porto Campanhã (OPO)', isPopular: true },
  { id: 'faro-pt', name: 'Faro', country: 'Portugal', region: 'Algarve', lat: 37.0194, lng: -7.9304, stationOrAirport: 'Faro Railway (FAO)', isPopular: true },
  { id: 'athens-gr', name: 'Athens', country: 'Greece', region: 'Attica', lat: 37.9838, lng: 23.7275, stationOrAirport: 'Athens Railway Station (ATH)', isPopular: true },
  { id: 'santorini-gr', name: 'Santorini', country: 'Greece', region: 'Cyclades', lat: 36.3932, lng: 25.4615, stationOrAirport: 'Thira Airport (JTR)', isPopular: true },
  { id: 'dubrovnik-hr', name: 'Dubrovnik', country: 'Croatia', region: 'Dalmatia', lat: 42.6507, lng: 18.0944, stationOrAirport: 'Dubrovnik Port (DBV)', isPopular: true },
  { id: 'split-hr', name: 'Split', country: 'Croatia', region: 'Dalmatia', lat: 43.5081, lng: 16.4402, stationOrAirport: 'Split Railway Station (SPU)', isPopular: true },

  // --- EUROPE: British Isles, Nordics & Eastern ---
  { id: 'london-uk', name: 'London', country: 'United Kingdom', region: 'Greater London', lat: 51.5074, lng: -0.1278, stationOrAirport: 'St Pancras Int / Heathrow (LHR)', isPopular: true },
  { id: 'edinburgh-uk', name: 'Edinburgh', country: 'United Kingdom', region: 'Scotland', lat: 55.9533, lng: -3.1883, stationOrAirport: 'Edinburgh Waverley (EDI)', isPopular: true },
  { id: 'manchester-uk', name: 'Manchester', country: 'United Kingdom', region: 'Greater Manchester', lat: 53.4808, lng: -2.2426, stationOrAirport: 'Manchester Piccadilly (MAN)', isPopular: false },
  { id: 'dublin-ie', name: 'Dublin', country: 'Ireland', region: 'Leinster', lat: 53.3498, lng: -6.2603, stationOrAirport: 'Dublin Connolly (DUB)', isPopular: true },
  { id: 'oslo-no', name: 'Oslo', country: 'Norway', region: 'Eastern Norway', lat: 59.9139, lng: 10.7522, stationOrAirport: 'Oslo S (OSL)', isPopular: true },
  { id: 'bergen-no', name: 'Bergen', country: 'Norway', region: 'Vestland', lat: 60.3913, lng: 5.3221, stationOrAirport: 'Bergen Railway Station (BGO)', isPopular: true },
  { id: 'tromso-no', name: 'Tromsø', country: 'Norway', region: 'Northern Norway', lat: 69.6492, lng: 18.9553, stationOrAirport: 'Tromsø Airport (TOS)', isPopular: true },
  { id: 'stockholm-se', name: 'Stockholm', country: 'Sweden', region: 'Stockholm County', lat: 59.3293, lng: 18.0686, stationOrAirport: 'Stockholm Central (ARN)', isPopular: true },
  { id: 'copenhagen-dk', name: 'Copenhagen', country: 'Denmark', region: 'Capital Region', lat: 55.6761, lng: 12.5683, stationOrAirport: 'København H (CPH)', isPopular: true },
  { id: 'helsinki-fi', name: 'Helsinki', country: 'Finland', region: 'Uusimaa', lat: 60.1699, lng: 24.9384, stationOrAirport: 'Helsinki Central (HEL)', isPopular: true },
  { id: 'reykjavik-is', name: 'Reykjavik', country: 'Iceland', region: 'Capital Region', lat: 64.1466, lng: -21.9426, stationOrAirport: 'Keflavík Int Airport (KEF)', isPopular: true },
  { id: 'prague-cz', name: 'Prague', country: 'Czech Republic', region: 'Bohemia', lat: 50.0755, lng: 14.4378, stationOrAirport: 'Praha hlavní nádraží (PRG)', isPopular: true },
  { id: 'budapest-hu', name: 'Budapest', country: 'Hungary', region: 'Central Hungary', lat: 47.4979, lng: 19.0402, stationOrAirport: 'Budapest Keleti (BUD)', isPopular: true },
  { id: 'krakow-pl', name: 'Krakow', country: 'Poland', region: 'Lesser Poland', lat: 50.0647, lng: 19.9450, stationOrAirport: 'Kraków Główny (KRK)', isPopular: true },
  { id: 'warsaw-pl', name: 'Warsaw', country: 'Poland', region: 'Masovia', lat: 52.2297, lng: 21.0122, stationOrAirport: 'Warszawa Centralna (WAW)', isPopular: true },

  // --- NORTH AMERICA ---
  { id: 'new-york-us', name: 'New York', country: 'United States', region: 'New York', lat: 40.7128, lng: -74.0060, stationOrAirport: 'Penn Station (JFK/EWR/LGA)', isPopular: true },
  { id: 'chicago-us', name: 'Chicago', country: 'United States', region: 'Illinois', lat: 41.8781, lng: -87.6298, stationOrAirport: 'Union Station (ORD/MDW)', isPopular: true },
  { id: 'san-francisco-us', name: 'San Francisco', country: 'United States', region: 'California', lat: 37.7749, lng: -122.4194, stationOrAirport: 'Salesforce Transit (SFO)', isPopular: true },
  { id: 'los-angeles-us', name: 'Los Angeles', country: 'United States', region: 'California', lat: 34.0522, lng: -118.2437, stationOrAirport: 'Union Station (LAX)', isPopular: true },
  { id: 'seattle-us', name: 'Seattle', country: 'United States', region: 'Washington', lat: 47.6062, lng: -122.3321, stationOrAirport: 'King Street Station (SEA)', isPopular: true },
  { id: 'boston-us', name: 'Boston', country: 'United States', region: 'Massachusetts', lat: 42.3601, lng: -71.0589, stationOrAirport: 'South Station (BOS)', isPopular: true },
  { id: 'washington-us', name: 'Washington D.C.', country: 'United States', region: 'District of Columbia', lat: 38.9072, lng: -77.0369, stationOrAirport: 'Union Station (DCA/IAD)', isPopular: true },
  { id: 'miami-us', name: 'Miami', country: 'United States', region: 'Florida', lat: 25.7617, lng: -80.1918, stationOrAirport: 'Miami Central (MIA)', isPopular: true },
  { id: 'denver-us', name: 'Denver', country: 'United States', region: 'Colorado', lat: 39.7392, lng: -104.9903, stationOrAirport: 'Union Station (DEN)', isPopular: true },
  { id: 'austin-us', name: 'Austin', country: 'United States', region: 'Texas', lat: 30.2672, lng: -97.7431, stationOrAirport: 'Austin-Bergstrom (AUS)', isPopular: false },
  { id: 'new-orleans-us', name: 'New Orleans', country: 'United States', region: 'Louisiana', lat: 29.9511, lng: -90.0715, stationOrAirport: 'Union Passenger Terminal (MSY)', isPopular: true },
  { id: 'san-diego-us', name: 'San Diego', country: 'United States', region: 'California', lat: 32.7157, lng: -117.1611, stationOrAirport: 'Santa Fe Depot (SAN)', isPopular: true },
  { id: 'las-vegas-us', name: 'Las Vegas', country: 'United States', region: 'Nevada', lat: 36.1699, lng: -115.1398, stationOrAirport: 'Harry Reid Int (LAS)', isPopular: true },
  { id: 'toronto-ca', name: 'Toronto', country: 'Canada', region: 'Ontario', lat: 43.6532, lng: -79.3832, stationOrAirport: 'Union Station (YYZ)', isPopular: true },
  { id: 'vancouver-ca', name: 'Vancouver', country: 'Canada', region: 'British Columbia', lat: 49.2827, lng: -123.1207, stationOrAirport: 'Pacific Central (YVR)', isPopular: true },
  { id: 'montreal-ca', name: 'Montreal', country: 'Canada', region: 'Quebec', lat: 45.5017, lng: -73.5673, stationOrAirport: 'Gare Centrale (YUL)', isPopular: true },
  { id: 'banff-ca', name: 'Banff', country: 'Canada', region: 'Alberta Rockies', lat: 51.1784, lng: -115.5708, stationOrAirport: 'Banff Station', isPopular: true },
  { id: 'mexico-city-mx', name: 'Mexico City', country: 'Mexico', region: 'CDMX', lat: 19.4326, lng: -99.1332, stationOrAirport: 'Benito Juárez (MEX)', isPopular: true },
  { id: 'cancun-mx', name: 'Cancun', country: 'Mexico', region: 'Quintana Roo', lat: 21.1619, lng: -86.8515, stationOrAirport: 'Cancún Int (CUN)', isPopular: true },
  { id: 'oaxaca-mx', name: 'Oaxaca', country: 'Mexico', region: 'Oaxaca', lat: 17.0732, lng: -96.7266, stationOrAirport: 'Xoxocotlán Int (OAX)', isPopular: true },

  // --- SOUTH AMERICA ---
  { id: 'buenos-aires-ar', name: 'Buenos Aires', country: 'Argentina', region: 'Capital Federal', lat: -34.6037, lng: -58.3816, stationOrAirport: 'Retiro Station (EZE/AEP)', isPopular: true },
  { id: 'mendoza-ar', name: 'Mendoza', country: 'Argentina', region: 'Cuyo Wine Country', lat: -32.8895, lng: -68.8458, stationOrAirport: 'El Plumerillo (MDZ)', isPopular: false },
  { id: 'bariloche-ar', name: 'Bariloche', country: 'Argentina', region: 'Patagonia', lat: -41.1335, lng: -71.3103, stationOrAirport: 'Teniente Luis Candelaria (BRC)', isPopular: true },
  { id: 'rio-de-janeiro-br', name: 'Rio de Janeiro', country: 'Brazil', region: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, stationOrAirport: 'Galeão / Santos Dumont (GIG/SDU)', isPopular: true },
  { id: 'sao-paulo-br', name: 'São Paulo', country: 'Brazil', region: 'São Paulo State', lat: -23.5505, lng: -46.6333, stationOrAirport: 'Guarulhos (GRU)', isPopular: true },
  { id: 'lima-pe', name: 'Lima', country: 'Peru', region: 'Lima Province', lat: -12.0464, lng: -77.0428, stationOrAirport: 'Jorge Chávez Int (LIM)', isPopular: true },
  { id: 'cusco-pe', name: 'Cusco', country: 'Peru', region: 'Sacred Valley', lat: -13.5319, lng: -71.9675, stationOrAirport: 'Alejandro Velasco Astete (CUZ)', isPopular: true },
  { id: 'bogota-co', name: 'Bogota', country: 'Colombia', region: 'Cundinamarca', lat: 4.7110, lng: -74.0721, stationOrAirport: 'El Dorado (BOG)', isPopular: true },
  { id: 'medellin-co', name: 'Medellin', country: 'Colombia', region: 'Antioquia', lat: 6.2442, lng: -75.5812, stationOrAirport: 'José María Córdova (MDE)', isPopular: true },
  { id: 'cartagena-co', name: 'Cartagena', country: 'Colombia', region: 'Bolívar', lat: 10.3910, lng: -75.4794, stationOrAirport: 'Rafael Núñez (CTG)', isPopular: true },
  { id: 'santiago-cl', name: 'Santiago', country: 'Chile', region: 'Santiago Metropolitan', lat: -33.4489, lng: -70.6693, stationOrAirport: 'Estación Central (SCL)', isPopular: true },
  { id: 'quito-ec', name: 'Quito', country: 'Ecuador', region: 'Pichincha', lat: -0.1807, lng: -78.4678, stationOrAirport: 'Mariscal Sucre (UIO)', isPopular: true },

  // --- ASIA & MIDDLE EAST ---
  { id: 'tokyo-jp', name: 'Tokyo', country: 'Japan', region: 'Kanto', lat: 35.6762, lng: 139.6503, stationOrAirport: 'Tokyo Station (HND/NRT)', isPopular: true },
  { id: 'kyoto-jp', name: 'Kyoto', country: 'Japan', region: 'Kansai', lat: 35.0116, lng: 135.7681, stationOrAirport: 'Kyoto Station', isPopular: true },
  { id: 'osaka-jp', name: 'Osaka', country: 'Japan', region: 'Kansai', lat: 34.6937, lng: 135.5023, stationOrAirport: 'Shin-Osaka (KIX)', isPopular: true },
  { id: 'sapporo-jp', name: 'Sapporo', country: 'Japan', region: 'Hokkaido', lat: 43.0618, lng: 141.3545, stationOrAirport: 'Sapporo Station (CTS)', isPopular: false },
  { id: 'seoul-kr', name: 'Seoul', country: 'South Korea', region: 'Seoul Capital Area', lat: 37.5665, lng: 126.9780, stationOrAirport: 'Seoul Station (ICN)', isPopular: true },
  { id: 'busan-kr', name: 'Busan', country: 'South Korea', region: 'Yeongnam', lat: 35.1796, lng: 129.0756, stationOrAirport: 'Busan Station (PUS)', isPopular: true },
  { id: 'singapore-sg', name: 'Singapore', country: 'Singapore', region: 'Southeast Asia', lat: 1.3521, lng: 103.8198, stationOrAirport: 'Singapore Changi (SIN)', isPopular: true },
  { id: 'bangkok-th', name: 'Bangkok', country: 'Thailand', region: 'Central Thailand', lat: 13.7563, lng: 100.5018, stationOrAirport: 'Krung Thep Aphiwat (BKK)', isPopular: true },
  { id: 'chiang-mai-th', name: 'Chiang Mai', country: 'Thailand', region: 'Northern Thailand', lat: 18.7883, lng: 98.9853, stationOrAirport: 'Chiang Mai Station (CNX)', isPopular: true },
  { id: 'phuket-th', name: 'Phuket', country: 'Thailand', region: 'Southern Thailand', lat: 7.8804, lng: 98.3923, stationOrAirport: 'Phuket Int (HKT)', isPopular: true },
  { id: 'hanoi-vn', name: 'Hanoi', country: 'Vietnam', region: 'Red River Delta', lat: 21.0285, lng: 105.8542, stationOrAirport: 'Ga Hà Nội (HAN)', isPopular: true },
  { id: 'ho-chi-minh-vn', name: 'Ho Chi Minh City', country: 'Vietnam', region: 'Southeastern', lat: 10.8231, lng: 106.6297, stationOrAirport: 'Ga Sài Gòn (SGN)', isPopular: true },
  { id: 'da-nang-vn', name: 'Da Nang', country: 'Vietnam', region: 'South Central Coast', lat: 16.0544, lng: 108.2022, stationOrAirport: 'Da Nang Station (DAD)', isPopular: true },
  { id: 'kuala-lumpur-my', name: 'Kuala Lumpur', country: 'Malaysia', region: 'Federal Territory', lat: 3.1390, lng: 101.6869, stationOrAirport: 'KL Sentral (KUL)', isPopular: true },
  { id: 'bali-id', name: 'Bali (Denpasar)', country: 'Indonesia', region: 'Lesser Sunda Islands', lat: -8.6705, lng: 115.2126, stationOrAirport: 'Ngurah Rai (DPS)', isPopular: true },
  { id: 'taipei-tw', name: 'Taipei', country: 'Taiwan', region: 'Northern Taiwan', lat: 25.0330, lng: 121.5654, stationOrAirport: 'Taipei Main Station (TPE)', isPopular: true },
  { id: 'hong-kong-hk', name: 'Hong Kong', country: 'Hong Kong', region: 'Kowloon / Island', lat: 22.3193, lng: 114.1694, stationOrAirport: 'Hong Kong Station (HKG)', isPopular: true },
  { id: 'dubai-ae', name: 'Dubai', country: 'United Arab Emirates', region: 'Dubai Emirate', lat: 25.2048, lng: 55.2708, stationOrAirport: 'Dubai Metro / Int (DXB)', isPopular: true },
  { id: 'doha-qa', name: 'Doha', country: 'Qatar', region: 'Ad-Dawhah', lat: 25.2854, lng: 51.5310, stationOrAirport: 'Hamad Int (DOH)', isPopular: true },
  { id: 'istanbul-tr', name: 'Istanbul', country: 'Turkey', region: 'Marmara', lat: 41.0082, lng: 28.9784, stationOrAirport: 'Sirkeci / Halkalı (IST)', isPopular: true },
  { id: 'antalya-tr', name: 'Antalya', country: 'Turkey', region: 'Mediterranean', lat: 36.8969, lng: 30.7133, stationOrAirport: 'Antalya Airport (AYT)', isPopular: false },
  { id: 'mumbai-in', name: 'Mumbai', country: 'India', region: 'Maharashtra', lat: 19.0760, lng: 72.8777, stationOrAirport: 'Chhatrapati Shivaji (BOM)', isPopular: true },
  { id: 'new-delhi-in', name: 'New Delhi', country: 'India', region: 'National Capital Territory', lat: 28.6139, lng: 77.2090, stationOrAirport: 'New Delhi Railway (DEL)', isPopular: true },
  { id: 'bengaluru-in', name: 'Bengaluru', country: 'India', region: 'Karnataka', lat: 12.9716, lng: 77.5946, stationOrAirport: 'KSR Bengaluru (BLR)', isPopular: false },
  { id: 'kathmandu-np', name: 'Kathmandu', country: 'Nepal', region: 'Bagmati', lat: 27.7172, lng: 85.3240, stationOrAirport: 'Tribhuvan Int (KTM)', isPopular: true },

  // --- AFRICA ---
  { id: 'cairo-eg', name: 'Cairo', country: 'Egypt', region: 'Nile Valley', lat: 30.0444, lng: 31.2357, stationOrAirport: 'Ramses Railway Station (CAI)', isPopular: true },
  { id: 'luxor-eg', name: 'Luxor', country: 'Egypt', region: 'Upper Egypt', lat: 25.6872, lng: 32.6396, stationOrAirport: 'Luxor Railway (LXR)', isPopular: true },
  { id: 'cape-town-za', name: 'Cape Town', country: 'South Africa', region: 'Western Cape', lat: -33.9249, lng: 18.4241, stationOrAirport: 'Cape Town Station (CPT)', isPopular: true },
  { id: 'johannesburg-za', name: 'Johannesburg', country: 'South Africa', region: 'Gauteng', lat: -26.2041, lng: 28.0473, stationOrAirport: 'Park Station (JNB)', isPopular: true },
  { id: 'nairobi-ke', name: 'Nairobi', country: 'Kenya', region: 'Nairobi County', lat: -1.2921, lng: 36.8219, stationOrAirport: 'Nairobi Terminus SGR (NBO)', isPopular: true },
  { id: 'marrakech-ma', name: 'Marrakech', country: 'Morocco', region: 'Marrakesh-Safi', lat: 31.6295, lng: -7.9811, stationOrAirport: 'Gare de Marrakech (RAK)', isPopular: true },
  { id: 'casablanca-ma', name: 'Casablanca', country: 'Morocco', region: 'Casablanca-Settat', lat: 33.5731, lng: -7.5898, stationOrAirport: 'Casa-Voyageurs (CMN)', isPopular: true },
  { id: 'zanzibar-tz', name: 'Zanzibar City', country: 'Tanzania', region: 'Zanzibar Archipelago', lat: -6.1659, lng: 39.2026, stationOrAirport: 'Abeid Amani Karume (ZNZ)', isPopular: true },
  { id: 'kigali-rw', name: 'Kigali', country: 'Rwanda', region: 'Kigali Province', lat: -1.9706, lng: 30.1044, stationOrAirport: 'Kigali Int (KGL)', isPopular: true },

  // --- OCEANIA ---
  { id: 'sydney-au', name: 'Sydney', country: 'Australia', region: 'New South Wales', lat: -33.8688, lng: 151.2093, stationOrAirport: 'Central Station (SYD)', isPopular: true },
  { id: 'melbourne-au', name: 'Melbourne', country: 'Australia', region: 'Victoria', lat: -37.8136, lng: 144.9631, stationOrAirport: 'Southern Cross (MEL)', isPopular: true },
  { id: 'brisbane-au', name: 'Brisbane', country: 'Australia', region: 'Queensland', lat: -27.4698, lng: 153.0251, stationOrAirport: 'Roma Street (BNE)', isPopular: true },
  { id: 'perth-au', name: 'Perth', country: 'Australia', region: 'Western Australia', lat: -31.9505, lng: 115.8605, stationOrAirport: 'Perth Station (PER)', isPopular: true },
  { id: 'cairns-au', name: 'Cairns', country: 'Australia', region: 'Great Barrier Reef', lat: -16.9186, lng: 145.7781, stationOrAirport: 'Cairns Central (CNS)', isPopular: true },
  { id: 'auckland-nz', name: 'Auckland', country: 'New Zealand', region: 'North Island', lat: -36.8485, lng: 174.7633, stationOrAirport: 'Britomart Transport Centre (AKL)', isPopular: true },
  { id: 'queenstown-nz', name: 'Queenstown', country: 'New Zealand', region: 'South Island Alps', lat: -45.0312, lng: 168.6626, stationOrAirport: 'Queenstown Airport (ZQN)', isPopular: true },
  { id: 'wellington-nz', name: 'Wellington', country: 'New Zealand', region: 'North Island', lat: -41.2865, lng: 174.7762, stationOrAirport: 'Wellington Railway (WLG)', isPopular: true },
  { id: 'fiji-fj', name: 'Nadi', country: 'Fiji', region: 'Viti Levu', lat: -17.8000, lng: 177.4167, stationOrAirport: 'Nadi Int (NAN)', isPopular: true }
];

/**
 * Filter built-in catalog destinations by prefix / substring query
 */
export function searchDestinations(query: string, limit: number = 7): DestinationItem[] {
  if (!query || query.trim().length === 0) {
    return POPULAR_DESTINATIONS.filter(d => d.isPopular).slice(0, limit);
  }

  const clean = query.trim().toLowerCase();
  
  const exactOrStarts: DestinationItem[] = [];
  const contains: DestinationItem[] = [];

  for (const item of POPULAR_DESTINATIONS) {
    const fullName = `${item.name}, ${item.country}`.toLowerCase();
    const station = (item.stationOrAirport || '').toLowerCase();
    const region = (item.region || '').toLowerCase();

    if (item.name.toLowerCase().startsWith(clean) || clean.startsWith(item.name.toLowerCase())) {
      exactOrStarts.push(item);
    } else if (
      fullName.includes(clean) ||
      item.country.toLowerCase().includes(clean) ||
      region.includes(clean) ||
      station.includes(clean)
    ) {
      contains.push(item);
    }
  }

  return [...exactOrStarts, ...contains].slice(0, limit);
}

/**
 * Hybrid Live Location Search:
 * Returns instant local catalog matches, and if online/available, merges
 * real global geocoding results from OpenStreetMap / Photon without requiring API keys.
 */
export async function searchGlobalDestinations(
  query: string,
  limit: number = 8,
  signal?: AbortSignal
): Promise<DestinationItem[]> {
  const localMatches = searchDestinations(query, limit);
  
  if (!query || query.trim().length < 2) {
    return localMatches;
  }

  try {
    const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query.trim())}`, {
      signal,
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      const liveItems: DestinationItem[] = Array.isArray(data.results) ? data.results : [];

      // Deduplicate live items against local items
      const combined: DestinationItem[] = [...localMatches];
      const seenKeys = new Set(
        localMatches.map(m => `${m.name.toLowerCase()}-${m.country.toLowerCase()}`)
      );

      for (const item of liveItems) {
        const key = `${item.name.toLowerCase()}-${item.country.toLowerCase()}`;
        if (!seenKeys.has(key)) {
          // Check coordinate proximity to prevent duplicates
          const isTooClose = localMatches.some(loc => {
            const latDiff = Math.abs(loc.lat - item.lat);
            const lngDiff = Math.abs(loc.lng - item.lng);
            return latDiff < 0.1 && lngDiff < 0.1;
          });

          if (!isTooClose) {
            seenKeys.add(key);
            combined.push({
              ...item,
              source: 'OpenStreetMap'
            });
          }
        }
      }

      return combined.slice(0, limit);
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('Live map search fallback to local database:', err);
    }
  }

  return localMatches;
}

const OSM_CACHE_STORAGE_KEY = 'tripcraft_osm_cache_v1';
const dynamicDestinationCache = new Map<string, DestinationItem>();

function loadCachedDestinations(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(OSM_CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && item.name && typeof item.lat === 'number' && typeof item.lng === 'number') {
          indexDestinationInCache(item);
        }
      }
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

function indexDestinationInCache(item: DestinationItem): void {
  const cleanName = item.name.trim().toLowerCase();
  const fullName = item.country ? `${item.name}, ${item.country}`.trim().toLowerCase() : cleanName;
  dynamicDestinationCache.set(fullName, item);
  if (!dynamicDestinationCache.has(cleanName)) {
    dynamicDestinationCache.set(cleanName, item);
  }
}

export function cacheDestination(item: DestinationItem | null | undefined): void {
  if (!item || !item.name || !Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;
  indexDestinationInCache(item);

  try {
    if (typeof localStorage === 'undefined') return;
    const uniqueByKey = new Map<string, DestinationItem>();
    for (const val of dynamicDestinationCache.values()) {
      const k = `${val.name.toLowerCase()}|${(val.country || '').toLowerCase()}`;
      uniqueByKey.set(k, val);
    }
    const itemsToPersist = Array.from(uniqueByKey.values()).slice(-100);
    localStorage.setItem(OSM_CACHE_STORAGE_KEY, JSON.stringify(itemsToPersist));
  } catch {
    // Ignore storage quota errors
  }
}

loadCachedDestinations();

/**
 * Finds a destination item by name or returns coordinates if recognized
 */
export function findDestination(name: string): DestinationItem | null {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  if (!clean) return null;

  // 1. Exact match in dynamic OSM cache or built-in catalog
  const cachedExact = dynamicDestinationCache.get(clean);
  if (cachedExact) return cachedExact;

  const catalogExact = POPULAR_DESTINATIONS.find(
    d => d.name.toLowerCase() === clean || `${d.name}, ${d.country}`.toLowerCase() === clean
  );
  if (catalogExact) return catalogExact;

  // 2. Prefix / comma-delimited city match across cache & catalog
  for (const d of dynamicDestinationCache.values()) {
    const city = d.name.toLowerCase();
    if (city.length >= 3 && (clean.startsWith(`${city},`) || clean.includes(city))) {
      return d;
    }
  }

  return (
    POPULAR_DESTINATIONS.find(d => {
      const city = d.name.toLowerCase();
      return city.length >= 3 && (clean.startsWith(`${city},`) || clean.includes(city));
    }) || null
  );
}

/**
 * Robust geocoder: First checks local database & cache, then hits the live OpenStreetMap geocoding endpoint
 * if not present in the catalog.
 */
export async function findDestinationOrGeocode(name: string): Promise<DestinationItem | null> {
  const local = findDestination(name);
  if (local) return local;

  const clean = name.trim();
  if (clean.length < 2) return null;

  try {
    const res = await fetch(`/api/locations/search?q=${encodeURIComponent(clean)}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        const first: DestinationItem = {
          ...data.results[0],
          source: data.results[0].source || 'OpenStreetMap'
        };
        cacheDestination(first);
        return first;
      }
    }
  } catch (err) {
    console.warn('Geocoding lookup failed:', err);
  }

  return null;
}

/**
 * Calculates Great-Circle (Haversine) distance between two coordinate points in km.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist);
}

/**
 * Estimate road/rail routing factor:
 * True ground paths are longer than straight line air distance:
 * - Train tracks: ~1.18x
 * - Roads/Cars/Buses: ~1.25x
 * - Air: ~1.05x (including departure/arrival holding loops)
 */
export function estimateTransportDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  mode: string = 'train'
): number {
  const airDist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  switch (mode) {
    case 'train':
      return Math.round(airDist * 1.18);
    case 'bus':
    case 'car':
    case 'electric_car':
      return Math.round(airDist * 1.25);
    case 'flight':
    default:
      return Math.round(airDist * 1.05);
  }
}
