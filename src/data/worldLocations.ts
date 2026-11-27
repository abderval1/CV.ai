export interface WorldCountryEntry {
  code: string;
  namePt: string;
  nameEn: string;
  region: 'Global' | 'Africa' | 'Europe' | 'Americas' | 'Asia' | 'Oceania' | 'Middle East';
  indeedBaseUrl?: string;
  provinces: string[];
  hints?: string[];
}

export const WORLD_COUNTRIES: WorldCountryEntry[] = [
  {
    code: 'remoto_global',
    namePt: 'Remoto Global (Todo o Mundo)',
    nameEn: 'Remote Global (Worldwide)',
    region: 'Global',
    indeedBaseUrl: 'https://www.indeed.com/jobs',
    provinces: ['Worldwide', 'Remote EMEA', 'Remote Americas', 'Remote APAC', 'Anywhere'],
    hints: ['worldwide', 'anywhere', 'global', 'remote']
  },
  {
    code: 'europa',
    namePt: 'União Europeia (Toda Europa)',
    nameEn: 'European Union (Europe)',
    region: 'Europe',
    indeedBaseUrl: 'https://pt.indeed.com/jobs',
    provinces: ['Lisbon', 'Madrid', 'Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Brussels', 'Milan', 'Vienna', 'Stockholm', 'Warsaw', 'Zurich'],
    hints: ['eu', 'europe', 'europa', 'emea']
  },
  {
    code: 'af',
    namePt: 'Afeganistão',
    nameEn: 'Afghanistan',
    region: 'Asia',
    provinces: ['Kabul', 'Herat', 'Kandahar', 'Balkh (Mazar-i-Sharif)', 'Nangarhar (Jalalabad)', 'Bamyan']
  },
  {
    code: 'za',
    namePt: 'África do Sul',
    nameEn: 'South Africa',
    region: 'Africa',
    indeedBaseUrl: 'https://za.indeed.com/jobs',
    provinces: ['Gauteng (Johannesburg / Pretoria)', 'Western Cape (Cape Town)', 'KwaZulu-Natal (Durban)', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'],
    hints: ['south africa', 'africa do sul', 'johannesburg', 'cape town', 'pretoria', 'durban']
  },
  {
    code: 'al',
    namePt: 'Albânia',
    nameEn: 'Albania',
    region: 'Europe',
    provinces: ['Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë']
  },
  {
    code: 'de',
    namePt: 'Alemanha',
    nameEn: 'Germany',
    region: 'Europe',
    indeedBaseUrl: 'https://de.indeed.com/jobs',
    provinces: ['Berlin', 'Bavaria (Munich)', 'Hesse (Frankfurt)', 'Hamburg', 'North Rhine-Westphalia (Cologne / Düsseldorf)', 'Baden-Württemberg (Stuttgart)', 'Lower Saxony (Hanover)', 'Saxony (Dresden / Leipzig)', 'Bremen', 'Rhineland-Palatinate', 'Schleswig-Holstein', 'Brandenburg', 'Saxony-Anhalt', 'Thuringia', 'Saarland', 'Mecklenburg-Vorpommern'],
    hints: ['germany', 'alemanha', 'berlin', 'munich', 'frankfurt', 'hamburg', 'stuttgart', 'cologne']
  },
  {
    code: 'ad',
    namePt: 'Andorra',
    nameEn: 'Andorra',
    region: 'Europe',
    provinces: ['Andorra la Vella', 'Escaldes-Engordany', 'Encamp', 'La Massana', 'Sant Julià de Lòria', 'Ordino', 'Canillo']
  },
  {
    code: 'ao',
    namePt: 'Angola',
    nameEn: 'Angola',
    region: 'Africa',
    provinces: ['Luanda', 'Benguela', 'Huambo', 'Huíla (Lubango)', 'Cabinda', 'Zaire (Soyo)', 'Namibe (Moçâmedes)', 'Malanje', 'Lunda Sul (Saurimo)', 'Lunda Norte (Dundo)', 'Cuanza Sul (Sumbe)', 'Cuanza Norte (Ndalatando)', 'Uíge', 'Bengo (Caxito)', 'Bié (Kuito)', 'Moxico (Luena)', 'Cunene (Ondjiva)', 'Cuando Cubango (Menongue)'],
    hints: ['angola', 'luanda', 'benguela', 'lubango', 'huambo', 'cabinda', 'soyo']
  },
  {
    code: 'ag',
    namePt: 'Antígua e Barbuda',
    nameEn: 'Antigua and Barbuda',
    region: 'Americas',
    provinces: ['Saint John', 'Saint George', 'Saint Mary', 'Saint Paul', 'Saint Peter', 'Saint Philip', 'Barbuda']
  },
  {
    code: 'sa',
    namePt: 'Arábia Saudita',
    nameEn: 'Saudi Arabia',
    region: 'Middle East',
    indeedBaseUrl: 'https://sa.indeed.com/jobs',
    provinces: ['Riyadh', 'Makkah (Jeddah)', 'Eastern Province (Dammam / Khobar)', 'Madinah', 'Asir (Abha)', 'Tabuk', 'Qassim', 'Jazan']
  },
  {
    code: 'dz',
    namePt: 'Argélia',
    nameEn: 'Algeria',
    region: 'Africa',
    provinces: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Setif', 'Tlemcen', 'Ouargla']
  },
  {
    code: 'ar',
    namePt: 'Argentina',
    nameEn: 'Argentina',
    region: 'Americas',
    indeedBaseUrl: 'https://ar.indeed.com/jobs',
    provinces: ['Buenos Aires (CABA)', 'Provincia de Buenos Aires', 'Córdoba', 'Santa Fe (Rosario)', 'Mendoza', 'Tucumán', 'Salta', 'Neuquén', 'Misiones', 'Río Negro']
  },
  {
    code: 'am',
    namePt: 'Arménia',
    nameEn: 'Armenia',
    region: 'Asia',
    provinces: ['Yerevan', 'Kotayk', 'Ararat', 'Armavir', 'Lori', 'Shirak (Gyumri)', 'Syunik']
  },
  {
    code: 'au',
    namePt: 'Austrália',
    nameEn: 'Australia',
    region: 'Oceania',
    indeedBaseUrl: 'https://au.indeed.com/jobs',
    provinces: ['New South Wales (Sydney)', 'Victoria (Melbourne)', 'Queensland (Brisbane)', 'Western Australia (Perth)', 'South Australia (Adelaide)', 'Australian Capital Territory (Canberra)', 'Tasmania (Hobart)', 'Northern Territory (Darwin)'],
    hints: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra']
  },
  {
    code: 'at',
    namePt: 'Áustria',
    nameEn: 'Austria',
    region: 'Europe',
    indeedBaseUrl: 'https://at.indeed.com/jobs',
    provinces: ['Vienna (Wien)', 'Lower Austria', 'Upper Austria (Linz)', 'Styria (Graz)', 'Tyrol (Innsbruck)', 'Salzburg', 'Carinthia', 'Vorarlberg', 'Burgenland']
  },
  {
    code: 'az',
    namePt: 'Azerbaijão',
    nameEn: 'Azerbaijan',
    region: 'Asia',
    provinces: ['Baku', 'Ganja', 'Sumgait', 'Mingachevir', 'Shirvan', 'Nakhchivan']
  },
  {
    code: 'bs',
    namePt: 'Bahamas',
    nameEn: 'Bahamas',
    region: 'Americas',
    provinces: ['New Providence (Nassau)', 'Grand Bahama (Freeport)', 'Abaco', 'Eleuthera', 'Exuma']
  },
  {
    code: 'bh',
    namePt: 'Bahrein',
    nameEn: 'Bahrain',
    region: 'Middle East',
    indeedBaseUrl: 'https://bh.indeed.com/jobs',
    provinces: ['Capital Governorate (Manama)', 'Muharraq', 'Northern Governorate', 'Southern Governorate']
  },
  {
    code: 'bd',
    namePt: 'Bangladesh',
    nameEn: 'Bangladesh',
    region: 'Asia',
    provinces: ['Dhaka', 'Chattogram (Chittagong)', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh']
  },
  {
    code: 'bb',
    namePt: 'Barbados',
    nameEn: 'Barbados',
    region: 'Americas',
    provinces: ['Saint Michael (Bridgetown)', 'Christ Church', 'Saint James', 'Saint George', 'Saint Philip']
  },
  {
    code: 'be',
    namePt: 'Bélgica',
    nameEn: 'Belgium',
    region: 'Europe',
    indeedBaseUrl: 'https://be.indeed.com/jobs',
    provinces: ['Brussels-Capital Region', 'Flanders (Antwerp / Ghent)', 'Wallonia (Liège / Charleroi / Namur)', 'Flemish Brabant (Leuven)', 'Walloon Brabant']
  },
  {
    code: 'bz',
    namePt: 'Belize',
    nameEn: 'Belize',
    region: 'Americas',
    provinces: ['Belize District (Belize City)', 'Cayo (Belmopan)', 'Corozal', 'Orange Walk', 'Stann Creek', 'Toledo']
  },
  {
    code: 'bj',
    namePt: 'Benim',
    nameEn: 'Benin',
    region: 'Africa',
    provinces: ['Littoral (Cotonou)', 'Atlantique', 'Ouémé (Porto-Novo)', 'Borgou (Parakou)', 'Zou']
  },
  {
    code: 'by',
    namePt: 'Bielorrússia',
    nameEn: 'Belarus',
    region: 'Europe',
    provinces: ['Minsk', 'Brest', 'Gomel', 'Grodno', 'Mogilev', 'Vitebsk']
  },
  {
    code: 'bo',
    namePt: 'Bolívia',
    nameEn: 'Bolivia',
    region: 'Americas',
    provinces: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Chuquisaca (Sucre)', 'Tarija', 'Oruro', 'Potosí']
  },
  {
    code: 'ba',
    namePt: 'Bósnia e Herzegovina',
    nameEn: 'Bosnia and Herzegovina',
    region: 'Europe',
    provinces: ['Sarajevo', 'Republika Srpska (Banja Luka)', 'Herzegovina-Neretva (Mostar)', 'Tuzla', 'Zenica-Doboj']
  },
  {
    code: 'bw',
    namePt: 'Botswana',
    nameEn: 'Botswana',
    region: 'Africa',
    provinces: ['South-East (Gaborone)', 'Central', 'North-East (Francistown)', 'North-West (Maun)', 'Kweneng', 'Southern']
  },
  {
    code: 'br',
    namePt: 'Brasil',
    nameEn: 'Brazil',
    region: 'Americas',
    indeedBaseUrl: 'https://br.indeed.com/jobs',
    provinces: [
      'São Paulo', 'Rio de Janeiro', 'Minas Gerais (Belo Horizonte)', 'Paraná (Curitiba)', 'Rio Grande do Sul (Porto Alegre)',
      'Santa Catarina (Florianópolis)', 'Distrito Federal (Brasília)', 'Bahia (Salvador)', 'Pernambuco (Recife)', 'Ceará (Fortaleza)',
      'Goiás (Goiânia)', 'Espírito Santo (Vitória)', 'Amazonas (Manaus)', 'Pará (Belém)', 'Maranhão (São Luís)',
      'Rio Grande do Norte (Natal)', 'Paraíba (João Pessoa)', 'Alagoas (Maceió)', 'Mato Grosso (Cuiabá)', 'Mato Grosso do Sul (Campo Grande)',
      'Piauí (Teresina)', 'Sergipe (Aracaju)', 'Rondônia (Porto Velho)', 'Tocantins (Palmas)', 'Acre (Rio Branco)', 'Amapá (Macapá)', 'Roraima (Boa Vista)'
    ],
    hints: ['brasil', 'brazil', 'sao paulo', 'rio de janeiro', 'belo horizonte', 'curitiba', 'porto alegre', 'brasilia', 'salvador', 'recife', 'florianopolis', 'latam']
  },
  {
    code: 'bn',
    namePt: 'Brunei',
    nameEn: 'Brunei',
    region: 'Asia',
    provinces: ['Brunei-Muara (Bandar Seri Begawan)', 'Belait', 'Tutong', 'Temburong']
  },
  {
    code: 'bg',
    namePt: 'Bulgária',
    nameEn: 'Bulgaria',
    region: 'Europe',
    provinces: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora']
  },
  {
    code: 'bf',
    namePt: 'Burkina Faso',
    nameEn: 'Burkina Faso',
    region: 'Africa',
    provinces: ['Centre (Ouagadougou)', 'Hauts-Bassins (Bobo-Dioulasso)', 'Centre-Nord', 'Nord', 'Est']
  },
  {
    code: 'bi',
    namePt: 'Burundi',
    nameEn: 'Burundi',
    region: 'Africa',
    provinces: ['Bujumbura Mairie', 'Gitega', 'Ngozi', 'Muyinga', 'Makamba']
  },
  {
    code: 'bt',
    namePt: 'Butão',
    nameEn: 'Bhutan',
    region: 'Asia',
    provinces: ['Thimphu', 'Paro', 'Punakha', 'Chhukha (Phuntsholing)', 'Bumthang']
  },
  {
    code: 'cv',
    namePt: 'Cabo Verde',
    nameEn: 'Cape Verde',
    region: 'Africa',
    provinces: ['Santiago (Praia)', 'São Vicente (Mindelo)', 'Sal', 'Boa Vista', 'Santo Antão', 'Fogo', 'São Nicolau', 'Maio', 'Brava'],
    hints: ['cabo verde', 'cape verde', 'praia', 'mindelo']
  },
  {
    code: 'cm',
    namePt: 'Camarões',
    nameEn: 'Cameroon',
    region: 'Africa',
    provinces: ['Centre (Yaoundé)', 'Littoral (Douala)', 'West (Bafoussam)', 'North-West (Bamenda)', 'South-West (Buea)', 'North (Garoua)']
  },
  {
    code: 'kh',
    namePt: 'Camboja',
    nameEn: 'Cambodia',
    region: 'Asia',
    provinces: ['Phnom Penh', 'Siem Reap', 'Preah Sihanouk', 'Battambang', 'Kandal']
  },
  {
    code: 'ca',
    namePt: 'Canadá',
    nameEn: 'Canada',
    region: 'Americas',
    indeedBaseUrl: 'https://ca.indeed.com/jobs',
    provinces: ['Ontario (Toronto / Ottawa)', 'Quebec (Montreal / Quebec City)', 'British Columbia (Vancouver / Victoria)', 'Alberta (Calgary / Edmonton)', 'Manitoba (Winnipeg)', 'Saskatchewan (Saskatoon / Regina)', 'Nova Scotia (Halifax)', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island', 'Yukon', 'Northwest Territories', 'Nunavut'],
    hints: ['canada', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa', 'ontario', 'quebec']
  },
  {
    code: 'qa',
    namePt: 'Catar',
    nameEn: 'Qatar',
    region: 'Middle East',
    indeedBaseUrl: 'https://qa.indeed.com/jobs',
    provinces: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal']
  },
  {
    code: 'kz',
    namePt: 'Cazaquistão',
    nameEn: 'Kazakhstan',
    region: 'Asia',
    provinces: ['Almaty', 'Astana', 'Shymkent', 'Atyrau', 'Karaganda', 'Aktobe']
  },
  {
    code: 'td',
    namePt: 'Chade',
    nameEn: 'Chad',
    region: 'Africa',
    provinces: ['N\'Djamena', 'Logone Occidental (Moundou)', 'Ouaddaï (Abéché)', 'Moyen-Chari (Sarh)']
  },
  {
    code: 'cl',
    namePt: 'Chile',
    nameEn: 'Chile',
    region: 'Americas',
    indeedBaseUrl: 'https://cl.indeed.com/jobs',
    provinces: ['Región Metropolitana (Santiago)', 'Valparaíso', 'Biobío (Concepción)', 'Antofagasta', 'Los Lagos (Puerto Montt)', 'Coquimbo', 'Araucanía']
  },
  {
    code: 'cn',
    namePt: 'China',
    nameEn: 'China',
    region: 'Asia',
    indeedBaseUrl: 'https://cn.indeed.com/jobs',
    provinces: ['Beijing', 'Shanghai', 'Guangdong (Shenzhen / Guangzhou)', 'Zhejiang (Hangzhou)', 'Jiangsu (Suzhou / Nanjing)', 'Sichuan (Chengdu)', 'Hubei (Wuhan)', 'Fujian (Xiamen)']
  },
  {
    code: 'cy',
    namePt: 'Chipre',
    nameEn: 'Cyprus',
    region: 'Europe',
    provinces: ['Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta']
  },
  {
    code: 'co',
    namePt: 'Colômbia',
    nameEn: 'Colombia',
    region: 'Americas',
    indeedBaseUrl: 'https://co.indeed.com/jobs',
    provinces: ['Bogotá D.C.', 'Antioquia (Medellín)', 'Valle del Cauca (Cali)', 'Atlántico (Barranquilla)', 'Santander (Bucaramanga)', 'Bolívar (Cartagena)', 'Cundinamarca']
  },
  {
    code: 'km',
    namePt: 'Comores',
    nameEn: 'Comoros',
    region: 'Africa',
    provinces: ['Grande Comore (Moroni)', 'Anjouan', 'Mohéli']
  },
  {
    code: 'cg',
    namePt: 'Congo (Brazzaville)',
    nameEn: 'Republic of the Congo',
    region: 'Africa',
    provinces: ['Brazzaville', 'Pointe-Noire', 'Niari', 'Pool', 'Bouenza']
  },
  {
    code: 'cd',
    namePt: 'Congo (RD Congo)',
    nameEn: 'Democratic Republic of the Congo',
    region: 'Africa',
    provinces: ['Kinshasa', 'Haut-Katanga (Lubumbashi)', 'Nord-Kivu (Goma)', 'Sud-Kivu (Bukavu)', 'Kongo Central (Matadi)', 'Ituri', 'Tshopo (Kisangani)']
  },
  {
    code: 'kr',
    namePt: 'Coreia do Sul',
    nameEn: 'South Korea',
    region: 'Asia',
    indeedBaseUrl: 'https://kr.indeed.com/jobs',
    provinces: ['Seoul', 'Gyeonggi (Suwon / Pangyo)', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Jeju']
  },
  {
    code: 'kp',
    namePt: 'Coreia do Norte',
    nameEn: 'North Korea',
    region: 'Asia',
    provinces: ['Pyongyang', 'Hamhung', 'Chongjin', 'Nampo']
  },
  {
    code: 'ci',
    namePt: 'Costa do Marfim',
    nameEn: 'Ivory Coast',
    region: 'Africa',
    provinces: ['Abidjan', 'Yamoussoukro', 'Vallée du Bandama (Bouaké)', 'Bas-Sassandra (San-Pédro)', 'Savanes (Korhogo)']
  },
  {
    code: 'cr',
    namePt: 'Costa Rica',
    nameEn: 'Costa Rica',
    region: 'Americas',
    indeedBaseUrl: 'https://cr.indeed.com/jobs',
    provinces: ['San José', 'Alajuela', 'Heredia', 'Cartago', 'Guanacaste', 'Puntarenas', 'Limón']
  },
  {
    code: 'hr',
    namePt: 'Croácia',
    nameEn: 'Croatia',
    region: 'Europe',
    provinces: ['Zagreb', 'Split-Dalmatia (Split)', 'Primorje-Gorski Kotar (Rijeka)', 'Osijek-Baranja', 'Istria (Pula)']
  },
  {
    code: 'cu',
    namePt: 'Cuba',
    nameEn: 'Cuba',
    region: 'Americas',
    provinces: ['La Habana', 'Santiago de Cuba', 'Matanzas', 'Villa Clara', 'Camagüey', 'Holguín']
  },
  {
    code: 'dk',
    namePt: 'Dinamarca',
    nameEn: 'Denmark',
    region: 'Europe',
    indeedBaseUrl: 'https://dk.indeed.com/jobs',
    provinces: ['Capital Region (Copenhagen)', 'Central Denmark (Aarhus)', 'Southern Denmark (Odense)', 'North Denmark (Aalborg)', 'Zealand']
  },
  {
    code: 'dj',
    namePt: 'Djibuti',
    nameEn: 'Djibouti',
    region: 'Africa',
    provinces: ['Djibouti City', 'Ali Sabieh', 'Tadjourah', 'Dikhil', 'Obock']
  },
  {
    code: 'dm',
    namePt: 'Dominica',
    nameEn: 'Dominica',
    region: 'Americas',
    provinces: ['Saint George (Roseau)', 'Saint John', 'Saint Andrew', 'Saint Patrick']
  },
  {
    code: 'eg',
    namePt: 'Egito',
    nameEn: 'Egypt',
    region: 'Africa',
    indeedBaseUrl: 'https://eg.indeed.com/jobs',
    provinces: ['Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'South Sinai', 'Sharqia']
  },
  {
    code: 'sv',
    namePt: 'El Salvador',
    nameEn: 'El Salvador',
    region: 'Americas',
    provinces: ['San Salvador', 'La Libertad', 'Santa Ana', 'San Miguel', 'Sonsonate']
  },
  {
    code: 'ae',
    namePt: 'Emirados Árabes Unidos',
    nameEn: 'United Arab Emirates',
    region: 'Middle East',
    indeedBaseUrl: 'https://ae.indeed.com/jobs',
    provinces: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    hints: ['uae', 'dubai', 'abu dhabi', 'sharjah', 'emirates', 'emirados']
  },
  {
    code: 'ec',
    namePt: 'Equador',
    nameEn: 'Ecuador',
    region: 'Americas',
    indeedBaseUrl: 'https://ec.indeed.com/jobs',
    provinces: ['Pichincha (Quito)', 'Guayas (Guayaquil)', 'Azuay (Cuenca)', 'Manabí', 'Tungurahua']
  },
  {
    code: 'er',
    namePt: 'Eritreia',
    nameEn: 'Eritrea',
    region: 'Africa',
    provinces: ['Maekel (Asmara)', 'Northern Red Sea (Massawa)', 'Anseba', 'Gash-Barka']
  },
  {
    code: 'sk',
    namePt: 'Eslováquia',
    nameEn: 'Slovakia',
    region: 'Europe',
    provinces: ['Bratislava', 'Košice', 'Žilina', 'Trnava', 'Nitra', 'Prešov', 'Banská Bystrica']
  },
  {
    code: 'si',
    namePt: 'Eslovénia',
    nameEn: 'Slovenia',
    region: 'Europe',
    provinces: ['Central Slovenia (Ljubljana)', 'Drava (Maribor)', 'Coastal-Karst (Koper)', 'Savinja (Celje)']
  },
  {
    code: 'es',
    namePt: 'Espanha',
    nameEn: 'Spain',
    region: 'Europe',
    indeedBaseUrl: 'https://es.indeed.com/jobs',
    provinces: ['Madrid', 'Cataluña (Barcelona)', 'Andalucía (Sevilla / Málaga)', 'Comunidad Valenciana (Valencia / Alicante)', 'País Vasco (Bilbao / San Sebastián)', 'Galicia (Vigo / A Coruña)', 'Castilla y León', 'Aragón (Zaragoza)', 'Canarias', 'Islas Baleares', 'Murcia', 'Asturias'],
    hints: ['spain', 'espanha', 'madrid', 'barcelona', 'valencia', 'seville', 'bilbao']
  },
  {
    code: 'us',
    namePt: 'Estados Unidos',
    nameEn: 'United States',
    region: 'Americas',
    indeedBaseUrl: 'https://www.indeed.com/jobs',
    provinces: [
      'California (San Francisco / Los Angeles)', 'New York', 'Texas (Austin / Dallas / Houston)', 'Florida (Miami / Orlando)',
      'Washington (Seattle)', 'Massachusetts (Boston)', 'Illinois (Chicago)', 'Georgia (Atlanta)', 'Virginia', 'North Carolina (Charlotte / Raleigh)',
      'Colorado (Denver)', 'Pennsylvania (Philadelphia)', 'New Jersey', 'Arizona (Phoenix)', 'District of Columbia (Washington D.C.)',
      'Ohio', 'Michigan', 'Minnesota', 'Maryland', 'Tennessee (Nashville)', 'Utah', 'Oregon', 'Indiana', 'Missouri', 'Wisconsin', 'Nevada', 'Connecticut'
    ],
    hints: ['usa', 'us', 'united states', 'estados unidos', 'new york', 'california', 'texas', 'florida', 'seattle', 'boston', 'chicago', 'san francisco']
  },
  {
    code: 'ee',
    namePt: 'Estónia',
    nameEn: 'Estonia',
    region: 'Europe',
    provinces: ['Harju (Tallinn)', 'Tartu', 'Ida-Viru', 'Pärnu']
  },
  {
    code: 'sz',
    namePt: 'Essuatíni',
    nameEn: 'Eswatini',
    region: 'Africa',
    provinces: ['Hhohho (Mbabane)', 'Manzini', 'Lubombo', 'Shiselweni']
  },
  {
    code: 'et',
    namePt: 'Etiópia',
    nameEn: 'Ethiopia',
    region: 'Africa',
    provinces: ['Addis Ababa', 'Oromia', 'Amhara (Bahir Dar)', 'Tigray (Mekelle)', 'Sidama (Hawassa)', 'Somali']
  },
  {
    code: 'fj',
    namePt: 'Fiji',
    nameEn: 'Fiji',
    region: 'Oceania',
    provinces: ['Central (Suva)', 'Western (Nadi / Lautoka)', 'Northern (Labasa)', 'Eastern']
  },
  {
    code: 'ph',
    namePt: 'Filipinas',
    nameEn: 'Philippines',
    region: 'Asia',
    indeedBaseUrl: 'https://ph.indeed.com/jobs',
    provinces: ['Metro Manila (NCR)', 'Calabarzon', 'Central Visayas (Cebu)', 'Davao Region', 'Central Luzon', 'Western Visayas (Iloilo)']
  },
  {
    code: 'fi',
    namePt: 'Finlândia',
    nameEn: 'Finland',
    region: 'Europe',
    indeedBaseUrl: 'https://fi.indeed.com/jobs',
    provinces: ['Uusimaa (Helsinki / Espoo)', 'Pirkanmaa (Tampere)', 'Southwest Finland (Turku)', 'North Ostrobothnia (Oulu)']
  },
  {
    code: 'fr',
    namePt: 'França',
    nameEn: 'France',
    region: 'Europe',
    indeedBaseUrl: 'https://fr.indeed.com/jobs',
    provinces: ['Île-de-France (Paris)', 'Auvergne-Rhône-Alpes (Lyon / Grenoble)', 'Provence-Alpes-Côte d\'Azur (Marseille / Nice)', 'Occitanie (Toulouse / Montpellier)', 'Nouvelle-Aquitaine (Bordeaux)', 'Hauts-de-France (Lille)', 'Grand Est (Strasbourg)', 'Pays de la Loire (Nantes)', 'Bretagne (Rennes)', 'Normandie', 'Bourgogne-Franche-Comté', 'Centre-Val de Loire', 'Corse'],
    hints: ['france', 'franca', 'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'nice', 'lille']
  },
  {
    code: 'ga',
    namePt: 'Gabão',
    nameEn: 'Gabon',
    region: 'Africa',
    provinces: ['Estuaire (Libreville)', 'Ogooué-Maritime (Port-Gentil)', 'Haut-Ogooué (Franceville)', 'Woleu-Ntem']
  },
  {
    code: 'gm',
    namePt: 'Gâmbia',
    nameEn: 'Gambia',
    region: 'Africa',
    provinces: ['Banjul', 'Kanifing', 'West Coast (Brikama)', 'North Bank', 'Upper River']
  },
  {
    code: 'gh',
    namePt: 'Gana',
    nameEn: 'Ghana',
    region: 'Africa',
    provinces: ['Greater Accra (Accra)', 'Ashanti (Kumasi)', 'Western (Takoradi)', 'Northern (Tamale)', 'Eastern', 'Central']
  },
  {
    code: 'ge',
    namePt: 'Geórgia',
    nameEn: 'Georgia',
    region: 'Asia',
    provinces: ['Tbilisi', 'Adjara (Batumi)', 'Imereti (Kutaisi)', 'Kvemo Kartli', 'Kakheti']
  },
  {
    code: 'gd',
    namePt: 'Granada',
    nameEn: 'Grenada',
    region: 'Americas',
    provinces: ['Saint George', 'Saint Andrew', 'Saint David', 'Saint Patrick']
  },
  {
    code: 'gr',
    namePt: 'Grécia',
    nameEn: 'Greece',
    region: 'Europe',
    indeedBaseUrl: 'https://gr.indeed.com/jobs',
    provinces: ['Attica (Athens)', 'Central Macedonia (Thessaloniki)', 'Crete (Heraklion)', 'Western Greece (Patras)', 'Thessaly']
  },
  {
    code: 'gt',
    namePt: 'Guatemala',
    nameEn: 'Guatemala',
    region: 'Americas',
    provinces: ['Guatemala City', 'Quetzaltenango', 'Escuintla', 'Sacatepéquez (Antigua)', 'Alta Verapaz']
  },
  {
    code: 'gy',
    namePt: 'Guiana',
    nameEn: 'Guyana',
    region: 'Americas',
    provinces: ['Demerara-Mahaica (Georgetown)', 'East Berbice-Corentyne', 'Essequibo Islands-West Demerara']
  },
  {
    code: 'gn',
    namePt: 'Guiné',
    nameEn: 'Guinea',
    region: 'Africa',
    provinces: ['Conakry', 'Kindia', 'Kankan', 'Nzérékoré', 'Labé', 'Boké']
  },
  {
    code: 'gw',
    namePt: 'Guiné-Bissau',
    nameEn: 'Guinea-Bissau',
    region: 'Africa',
    provinces: ['Bissau', 'Bafatá', 'Gabú', 'Cacheu', 'Biombo', 'Oio', 'Quinara', 'Tombali', 'Bolama']
  },
  {
    code: 'gq',
    namePt: 'Guiné Equatorial',
    nameEn: 'Equatorial Guinea',
    region: 'Africa',
    provinces: ['Bioko Norte (Malabo)', 'Litoral (Bata)', 'Wele-Nzas', 'Centro Sur']
  },
  {
    code: 'ht',
    namePt: 'Haiti',
    nameEn: 'Haiti',
    region: 'Americas',
    provinces: ['Ouest (Port-au-Prince)', 'Nord (Cap-Haïtien)', 'Artibonite', 'Sud']
  },
  {
    code: 'hn',
    namePt: 'Honduras',
    nameEn: 'Honduras',
    region: 'Americas',
    provinces: ['Francisco Morazán (Tegucigalpa)', 'Cortés (San Pedro Sula)', 'Atlántida (La Ceiba)', 'Comayagua']
  },
  {
    code: 'hu',
    namePt: 'Hungria',
    nameEn: 'Hungary',
    region: 'Europe',
    indeedBaseUrl: 'https://hu.indeed.com/jobs',
    provinces: ['Budapest', 'Pest', 'Hajdú-Bihar (Debrecen)', 'Csongrád-Csanád (Szeged)', 'Győr-Moson-Sopron', 'Baranya (Pécs)']
  },
  {
    code: 'ye',
    namePt: 'Iémen',
    nameEn: 'Yemen',
    region: 'Middle East',
    provinces: ['Sana\'a', 'Aden', 'Taiz', 'Al Hudaydah', 'Hadhramaut']
  },
  {
    code: 'mh',
    namePt: 'Ilhas Marshall',
    nameEn: 'Marshall Islands',
    region: 'Oceania',
    provinces: ['Majuro', 'Kwajalein', 'Arno']
  },
  {
    code: 'sb',
    namePt: 'Ilhas Salomão',
    nameEn: 'Solomon Islands',
    region: 'Oceania',
    provinces: ['Honiara', 'Guadalcanal', 'Malaita', 'Western Province']
  },
  {
    code: 'in',
    namePt: 'Índia',
    nameEn: 'India',
    region: 'Asia',
    indeedBaseUrl: 'https://in.indeed.com/jobs',
    provinces: ['Karnataka (Bengaluru)', 'Maharashtra (Mumbai / Pune)', 'Delhi NCR (New Delhi / Gurgaon / Noida)', 'Telangana (Hyderabad)', 'Tamil Nadu (Chennai)', 'Gujarat (Ahmedabad)', 'West Bengal (Kolkata)', 'Kerala (Kochi)', 'Rajasthan (Jaipur)', 'Uttar Pradesh'],
    hints: ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai']
  },
  {
    code: 'id',
    namePt: 'Indonésia',
    nameEn: 'Indonesia',
    region: 'Asia',
    indeedBaseUrl: 'https://id.indeed.com/jobs',
    provinces: ['Jakarta', 'West Java (Bandung)', 'East Java (Surabaya)', 'Bali (Denpasar)', 'Central Java (Semarang)', 'North Sumatra (Medan)']
  },
  {
    code: 'ir',
    namePt: 'Irão',
    nameEn: 'Iran',
    region: 'Middle East',
    provinces: ['Tehran', 'Isfahan', 'Fars (Shiraz)', 'Razavi Khorasan (Mashhad)', 'East Azerbaijan (Tabriz)']
  },
  {
    code: 'iq',
    namePt: 'Iraque',
    nameEn: 'Iraq',
    region: 'Middle East',
    provinces: ['Baghdad', 'Erbil (Kurdistan)', 'Basra', 'Nineveh (Mosul)', 'Sulaymaniyah', 'Najaf']
  },
  {
    code: 'ie',
    namePt: 'Irlanda',
    nameEn: 'Ireland',
    region: 'Europe',
    indeedBaseUrl: 'https://ie.indeed.com/jobs',
    provinces: ['Leinster (Dublin)', 'Munster (Cork / Limerick)', 'Connacht (Galway)', 'Ulster (Donegal)'],
    hints: ['ireland', 'irlanda', 'dublin', 'cork', 'galway']
  },
  {
    code: 'is',
    namePt: 'Islândia',
    nameEn: 'Iceland',
    region: 'Europe',
    provinces: ['Capital Region (Reykjavík)', 'Northeastern Region (Akureyri)', 'Southern Peninsula', 'Western Region']
  },
  {
    code: 'il',
    namePt: 'Israel',
    nameEn: 'Israel',
    region: 'Middle East',
    indeedBaseUrl: 'https://il.indeed.com/jobs',
    provinces: ['Tel Aviv District', 'Central District (Herzliya / Petah Tikva)', 'Jerusalem', 'Haifa', 'Southern District (Beersheba)']
  },
  {
    code: 'it',
    namePt: 'Itália',
    nameEn: 'Italy',
    region: 'Europe',
    indeedBaseUrl: 'https://it.indeed.com/jobs',
    provinces: ['Lombardy (Milan)', 'Lazio (Rome)', 'Piedmont (Turin)', 'Emilia-Romagna (Bologna)', 'Veneto (Venice / Verona)', 'Tuscany (Florence)', 'Campania (Naples)', 'Sicily', 'Puglia', 'Liguria (Genoa)'],
    hints: ['italy', 'italia', 'milan', 'rome', 'roma', 'milano', 'turin', 'bologna', 'florence']
  },
  {
    code: 'jm',
    namePt: 'Jamaica',
    nameEn: 'Jamaica',
    region: 'Americas',
    provinces: ['Kingston', 'St. Andrew', 'St. James (Montego Bay)', 'St. Catherine', 'Manchester']
  },
  {
    code: 'jp',
    namePt: 'Japão',
    nameEn: 'Japan',
    region: 'Asia',
    indeedBaseUrl: 'https://jp.indeed.com/jobs',
    provinces: ['Tokyo', 'Osaka', 'Kanagawa (Yokohama)', 'Aichi (Nagoya)', 'Fukuoka', 'Hokkaido (Sapporo)', 'Kyoto', 'Hyogo (Kobe)'],
    hints: ['japan', 'japao', 'tokyo', 'osaka', 'kyoto', 'yokohama']
  },
  {
    code: 'jo',
    namePt: 'Jordânia',
    nameEn: 'Jordan',
    region: 'Middle East',
    provinces: ['Amman', 'Irbid', 'Zarqa', 'Aqaba', 'Balqa']
  },
  {
    code: 'ki',
    namePt: 'Kiribati',
    nameEn: 'Kiribati',
    region: 'Oceania',
    provinces: ['Gilbert Islands (South Tarawa)', 'Line Islands', 'Phoenix Islands']
  },
  {
    code: 'kw',
    namePt: 'Kuwait',
    nameEn: 'Kuwait',
    region: 'Middle East',
    indeedBaseUrl: 'https://kw.indeed.com/jobs',
    provinces: ['Al Asimah (Kuwait City)', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra']
  },
  {
    code: 'la',
    namePt: 'Laos',
    nameEn: 'Laos',
    region: 'Asia',
    provinces: ['Vientiane', 'Luang Prabang', 'Savannakhet', 'Champasak']
  },
  {
    code: 'ls',
    namePt: 'Lesoto',
    nameEn: 'Lesotho',
    region: 'Africa',
    provinces: ['Maseru', 'Leribe', 'Berea', 'Mafeteng', 'Mohale\'s Hoek']
  },
  {
    code: 'lv',
    namePt: 'Letónia',
    nameEn: 'Latvia',
    region: 'Europe',
    provinces: ['Riga', 'Kurzeme (Liepāja)', 'Latgale (Daugavpils)', 'Vidzeme', 'Zemgale']
  },
  {
    code: 'lb',
    namePt: 'Líbano',
    nameEn: 'Lebanon',
    region: 'Middle East',
    provinces: ['Beirut', 'Mount Lebanon', 'North (Tripoli)', 'South (Sidon)', 'Beqaa']
  },
  {
    code: 'lr',
    namePt: 'Libéria',
    nameEn: 'Liberia',
    region: 'Africa',
    provinces: ['Montserrado (Monrovia)', 'Nimba', 'Bong', 'Grand Bassa', 'Margibi']
  },
  {
    code: 'ly',
    namePt: 'Líbia',
    nameEn: 'Libya',
    region: 'Africa',
    provinces: ['Tripoli', 'Benghazi', 'Misrata', 'Sabha']
  },
  {
    code: 'li',
    namePt: 'Liechtenstein',
    nameEn: 'Liechtenstein',
    region: 'Europe',
    provinces: ['Vaduz', 'Schaan', 'Triesen', 'Balzers']
  },
  {
    code: 'lt',
    namePt: 'Lituânia',
    nameEn: 'Lithuania',
    region: 'Europe',
    provinces: ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys']
  },
  {
    code: 'lu',
    namePt: 'Luxemburgo',
    nameEn: 'Luxembourg',
    region: 'Europe',
    indeedBaseUrl: 'https://lu.indeed.com/jobs',
    provinces: ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch']
  },
  {
    code: 'mk',
    namePt: 'Macedónia do Norte',
    nameEn: 'North Macedonia',
    region: 'Europe',
    provinces: ['Skopje', 'Bitola', 'Kumanovo', 'Tetovo', 'Ohrid']
  },
  {
    code: 'mg',
    namePt: 'Madagáscar',
    nameEn: 'Madagascar',
    region: 'Africa',
    provinces: ['Analamanga (Antananarivo)', 'Atsinanana (Toamasina)', 'Boeny (Mahajanga)', 'Diana (Antsiranana)']
  },
  {
    code: 'my',
    namePt: 'Malásia',
    nameEn: 'Malaysia',
    region: 'Asia',
    indeedBaseUrl: 'https://malaysia.indeed.com/jobs',
    provinces: ['Kuala Lumpur', 'Selangor (Petaling Jaya / Cyberjaya)', 'Penang', 'Johor (Johor Bahru)', 'Sarawak', 'Sabah']
  },
  {
    code: 'mw',
    namePt: 'Malawi',
    nameEn: 'Malawi',
    region: 'Africa',
    provinces: ['Central Region (Lilongwe)', 'Southern Region (Blantyre)', 'Northern Region (Mzuzu)']
  },
  {
    code: 'mv',
    namePt: 'Maldivas',
    nameEn: 'Maldives',
    region: 'Asia',
    provinces: ['Malé', 'Addu City', 'Fuvahmulah', 'Kulhudhuffushi']
  },
  {
    code: 'ml',
    namePt: 'Mali',
    nameEn: 'Mali',
    region: 'Africa',
    provinces: ['Bamako', 'Sikasso', 'Ségou', 'Mopti', 'Kayes']
  },
  {
    code: 'mt',
    namePt: 'Malta',
    nameEn: 'Malta',
    region: 'Europe',
    provinces: ['Valletta', 'Sliema / St. Julian\'s', 'Birkirkara', 'Mosta', 'Gozo']
  },
  {
    code: 'ma',
    namePt: 'Marrocos',
    nameEn: 'Morocco',
    region: 'Africa',
    indeedBaseUrl: 'https://ma.indeed.com/jobs',
    provinces: ['Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Marrakech-Safi', 'Tanger-Tétouan-Al Hoceïma', 'Fès-Meknès', 'Souss-Massa (Agadir)']
  },
  {
    code: 'mu',
    namePt: 'Maurícia',
    nameEn: 'Mauritius',
    region: 'Africa',
    provinces: ['Port Louis', 'Plaines Wilhems (Ebene / Curepipe)', 'Moka', 'Rivière du Rempart']
  },
  {
    code: 'mr',
    namePt: 'Mauritânia',
    nameEn: 'Mauritania',
    region: 'Africa',
    provinces: ['Nouakchott', 'Dakhlet Nouadhibou', 'Trarza', 'Assaba']
  },
  {
    code: 'mx',
    namePt: 'México',
    nameEn: 'Mexico',
    region: 'Americas',
    indeedBaseUrl: 'https://mx.indeed.com/jobs',
    provinces: ['Ciudad de México (CDMX)', 'Jalisco (Guadalajara)', 'Nuevo León (Monterrey)', 'Estado de México', 'Puebla', 'Querétaro', 'Guanajuato', 'Baja California (Tijuana)', 'Quintana Roo (Cancún)', 'Yucatán (Mérida)']
  },
  {
    code: 'mm',
    namePt: 'Mianmar',
    nameEn: 'Myanmar',
    region: 'Asia',
    provinces: ['Yangon', 'Mandalay', 'Naypyidaw', 'Shan State']
  },
  {
    code: 'fm',
    namePt: 'Micronésia',
    nameEn: 'Micronesia',
    region: 'Oceania',
    provinces: ['Pohnpei', 'Chuuk', 'Yap', 'Kosrae']
  },
  {
    code: 'mz',
    namePt: 'Moçambique',
    nameEn: 'Mozambique',
    region: 'Africa',
    provinces: ['Maputo Cidade', 'Maputo Província (Matola)', 'Sofala (Beira)', 'Nampula', 'Tete', 'Zambézia (Quelimane)', 'Cabo Delgado (Pemba)', 'Inhambane', 'Gaza (Xai-Xai)', 'Manica (Chimoio)', 'Niassa (Lichinga)'],
    hints: ['mocambique', 'mozambique', 'maputo', 'beira', 'nampula', 'tete', 'pemba']
  },
  {
    code: 'md',
    namePt: 'Moldávia',
    nameEn: 'Moldova',
    region: 'Europe',
    provinces: ['Chișinău', 'Bălți', 'Cahul', 'Gagauzia']
  },
  {
    code: 'mc',
    namePt: 'Mónaco',
    nameEn: 'Monaco',
    region: 'Europe',
    provinces: ['Monte Carlo', 'La Condamine', 'Fontvieille', 'Monaco-Ville']
  },
  {
    code: 'mn',
    namePt: 'Mongólia',
    nameEn: 'Mongolia',
    region: 'Asia',
    provinces: ['Ulaanbaatar', 'Darkhan-Uul', 'Orkhon (Erdenet)']
  },
  {
    code: 'me',
    namePt: 'Montenegro',
    nameEn: 'Montenegro',
    region: 'Europe',
    provinces: ['Podgorica', 'Budva', 'Nikšić', 'Bar', 'Kotor']
  },
  {
    code: 'na',
    namePt: 'Namíbia',
    nameEn: 'Namibia',
    region: 'Africa',
    provinces: ['Khomas (Windhoek)', 'Erongo (Walvis Bay / Swakopmund)', 'Oshana', 'Kavango East', 'Otjozondjupa']
  },
  {
    code: 'nr',
    namePt: 'Nauru',
    nameEn: 'Nauru',
    region: 'Oceania',
    provinces: ['Yaren', 'Aiwo', 'Anabar']
  },
  {
    code: 'np',
    namePt: 'Nepal',
    nameEn: 'Nepal',
    region: 'Asia',
    provinces: ['Bagmati (Kathmandu)', 'Gandaki (Pokhara)', 'Koshi (Biratnagar)', 'Lumbini']
  },
  {
    code: 'ni',
    namePt: 'Nicarágua',
    nameEn: 'Nicaragua',
    region: 'Americas',
    provinces: ['Managua', 'León', 'Granada', 'Masaya', 'Matagalpa']
  },
  {
    code: 'ne',
    namePt: 'Níger',
    nameEn: 'Niger',
    region: 'Africa',
    provinces: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua']
  },
  {
    code: 'ng',
    namePt: 'Nigéria',
    nameEn: 'Nigeria',
    region: 'Africa',
    indeedBaseUrl: 'https://ng.indeed.com/jobs',
    provinces: ['Lagos', 'Federal Capital Territory (Abuja)', 'Rivers (Port Harcourt)', 'Oyo (Ibadan)', 'Kano', 'Ogun', 'Enugu', 'Kaduna', 'Delta', 'Anambra'],
    hints: ['nigeria', 'lagos', 'abuja', 'port harcourt', 'ibadan']
  },
  {
    code: 'no',
    namePt: 'Noruega',
    nameEn: 'Norway',
    region: 'Europe',
    indeedBaseUrl: 'https://no.indeed.com/jobs',
    provinces: ['Oslo', 'Vestland (Bergen)', 'Trøndelag (Trondheim)', 'Rogaland (Stavanger)', 'Akershus', 'Troms (Tromsø)']
  },
  {
    code: 'nz',
    namePt: 'Nova Zelândia',
    nameEn: 'New Zealand',
    region: 'Oceania',
    indeedBaseUrl: 'https://nz.indeed.com/jobs',
    provinces: ['Auckland', 'Wellington', 'Canterbury (Christchurch)', 'Waikato (Hamilton)', 'Bay of Plenty (Tauranga)', 'Otago (Dunedin)']
  },
  {
    code: 'om',
    namePt: 'Omã',
    nameEn: 'Oman',
    region: 'Middle East',
    indeedBaseUrl: 'https://om.indeed.com/jobs',
    provinces: ['Muscat', 'Dhofar (Salalah)', 'Al Batinah North (Sohar)', 'Ad Dakhiliyah']
  },
  {
    code: 'nl',
    namePt: 'Países Baixos (Holanda)',
    nameEn: 'Netherlands',
    region: 'Europe',
    indeedBaseUrl: 'https://nl.indeed.com/jobs',
    provinces: ['North Holland (Amsterdam)', 'South Holland (Rotterdam / The Hague)', 'Utrecht', 'North Brabant (Eindhoven)', 'Gelderland', 'Overijssel', 'Groningen', 'Limburg'],
    hints: ['netherlands', 'holland', 'holanda', 'amsterdam', 'rotterdam', 'eindhoven', 'utrecht', 'hague']
  },
  {
    code: 'pw',
    namePt: 'Palau',
    nameEn: 'Palau',
    region: 'Oceania',
    provinces: ['Koror', 'Melekeok', 'Airai']
  },
  {
    code: 'pa',
    namePt: 'Panamá',
    nameEn: 'Panama',
    region: 'Americas',
    indeedBaseUrl: 'https://pa.indeed.com/jobs',
    provinces: ['Panamá (Panama City)', 'Colón', 'Chiriquí (David)', 'Panamá Oeste']
  },
  {
    code: 'pg',
    namePt: 'Papua-Nova Guiné',
    nameEn: 'Papua New Guinea',
    region: 'Oceania',
    provinces: ['National Capital District (Port Moresby)', 'Morobe (Lae)', 'Western Highlands']
  },
  {
    code: 'pk',
    namePt: 'Paquistão',
    nameEn: 'Pakistan',
    region: 'Asia',
    indeedBaseUrl: 'https://pk.indeed.com/jobs',
    provinces: ['Punjab (Lahore)', 'Sindh (Karachi)', 'Islamabad Capital Territory', 'Khyber Pakhtunkhwa (Peshawar)', 'Balochistan']
  },
  {
    code: 'py',
    namePt: 'Paraguai',
    nameEn: 'Paraguay',
    region: 'Americas',
    provinces: ['Asunción', 'Central', 'Alto Paraná (Ciudad del Este)', 'Itapúa (Encarnación)']
  },
  {
    code: 'pe',
    namePt: 'Peru',
    nameEn: 'Peru',
    region: 'Americas',
    indeedBaseUrl: 'https://pe.indeed.com/jobs',
    provinces: ['Lima', 'Arequipa', 'La Libertad (Trujillo)', 'Cusco', 'Piura', 'Lambayeque']
  },
  {
    code: 'pl',
    namePt: 'Polónia',
    nameEn: 'Poland',
    region: 'Europe',
    indeedBaseUrl: 'https://pl.indeed.com/jobs',
    provinces: ['Masovian (Warsaw)', 'Lesser Poland (Kraków)', 'Lower Silesian (Wrocław)', 'Pomeranian (Gdańsk)', 'Greater Poland (Poznań)', 'Silesian (Katowice)', 'Łódź'],
    hints: ['poland', 'polonia', 'warsaw', 'krakow', 'wroclaw', 'gdansk']
  },
  {
    code: 'pt',
    namePt: 'Portugal',
    nameEn: 'Portugal',
    region: 'Europe',
    indeedBaseUrl: 'https://pt.indeed.com/jobs',
    provinces: ['Lisboa', 'Porto', 'Braga', 'Aveiro', 'Coimbra', 'Setúbal', 'Faro (Algarve)', 'Leiria', 'Santarém', 'Viseu', 'Madeira (Funchal)', 'Açores (Ponta Delgada)', 'Évora', 'Viana do Castelo', 'Vila Real', 'Castelo Branco', 'Guarda', 'Beja', 'Bragança', 'Portalegre'],
    hints: ['portugal', 'lisboa', 'lisbon', 'porto', 'braga', 'coimbra', 'aveiro', 'faro', 'algarve', 'setubal', 'madeira']
  },
  {
    code: 'ke',
    namePt: 'Quénia',
    nameEn: 'Kenya',
    region: 'Africa',
    provinces: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Uasin Gishu (Eldoret)'],
    hints: ['kenya', 'quenia', 'nairobi', 'mombasa']
  },
  {
    code: 'kg',
    namePt: 'Quirguistão',
    nameEn: 'Kyrgyzstan',
    region: 'Asia',
    provinces: ['Bishkek', 'Osh', 'Chüy', 'Issyk-Kul']
  },
  {
    code: 'gb',
    namePt: 'Reino Unido',
    nameEn: 'United Kingdom',
    region: 'Europe',
    indeedBaseUrl: 'https://uk.indeed.com/jobs',
    provinces: ['London (Greater London)', 'England (Manchester / Birmingham / Leeds / Bristol)', 'Scotland (Edinburgh / Glasgow)', 'Wales (Cardiff)', 'Northern Ireland (Belfast)', 'Cambridgeshire (Cambridge)', 'Oxfordshire (Oxford)'],
    hints: ['uk', 'gb', 'united kingdom', 'reino unido', 'london', 'manchester', 'birmingham', 'edinburgh', 'england', 'scotland']
  },
  {
    code: 'cf',
    namePt: 'República Centro-Africana',
    nameEn: 'Central African Republic',
    region: 'Africa',
    provinces: ['Bangui', 'Ombella-M\'Poko', 'Ouham', 'Haute-Kotto']
  },
  {
    code: 'cz',
    namePt: 'República Checa',
    nameEn: 'Czech Republic',
    region: 'Europe',
    indeedBaseUrl: 'https://cz.indeed.com/jobs',
    provinces: ['Prague (Praha)', 'South Moravian (Brno)', 'Moravian-Silesian (Ostrava)', 'Plzeň', 'Central Bohemia']
  },
  {
    code: 'do',
    namePt: 'República Dominicana',
    nameEn: 'Dominican Republic',
    region: 'Americas',
    provinces: ['Distrito Nacional (Santo Domingo)', 'Santiago', 'La Altagracia (Punta Cana)', 'Puerto Plata']
  },
  {
    code: 'ro',
    namePt: 'Roménia',
    nameEn: 'Romania',
    region: 'Europe',
    indeedBaseUrl: 'https://ro.indeed.com/jobs',
    provinces: ['Bucharest (București)', 'Cluj (Cluj-Napoca)', 'Timiș (Timișoara)', 'Iași', 'Brașov', 'Constanța']
  },
  {
    code: 'rw',
    namePt: 'Ruanda',
    nameEn: 'Rwanda',
    region: 'Africa',
    provinces: ['Kigali', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province']
  },
  {
    code: 'ru',
    namePt: 'Rússia',
    nameEn: 'Russia',
    region: 'Europe',
    provinces: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Sverdlovsk (Yekaterinburg)', 'Tatarstan (Kazan)']
  },
  {
    code: 'ws',
    namePt: 'Samoa',
    nameEn: 'Samoa',
    region: 'Oceania',
    provinces: ['Tuamasaga (Apia)', 'Atua', 'A\'ana']
  },
  {
    code: 'sm',
    namePt: 'San Marino',
    nameEn: 'San Marino',
    region: 'Europe',
    provinces: ['City of San Marino', 'Serravalle', 'Borgo Maggiore']
  },
  {
    code: 'lc',
    namePt: 'Santa Lúcia',
    nameEn: 'Saint Lucia',
    region: 'Americas',
    provinces: ['Castries', 'Gros Islet', 'Vieux Fort', 'Soufrière']
  },
  {
    code: 'kn',
    namePt: 'São Cristóvão e Neves',
    nameEn: 'Saint Kitts and Nevis',
    region: 'Americas',
    provinces: ['Saint George Basseterre', 'Saint Paul Charlestown']
  },
  {
    code: 'st',
    namePt: 'São Tomé e Príncipe',
    nameEn: 'Sao Tome and Principe',
    region: 'Africa',
    provinces: ['Água Grande (São Tomé)', 'Mé-Zóchi', 'Cantagalo', 'Caué', 'Lembá', 'Lobata', 'Região Autónoma do Príncipe']
  },
  {
    code: 'vc',
    namePt: 'São Vicente e Granadinas',
    nameEn: 'Saint Vincent and the Grenadines',
    region: 'Americas',
    provinces: ['Saint George (Kingstown)', 'Charlotte', 'Grenadines']
  },
  {
    code: 'sc',
    namePt: 'Seicheles',
    nameEn: 'Seychelles',
    region: 'Africa',
    provinces: ['Mahé (Victoria)', 'Praslin', 'La Digue']
  },
  {
    code: 'sn',
    namePt: 'Senegal',
    nameEn: 'Senegal',
    region: 'Africa',
    provinces: ['Dakar', 'Thiès', 'Saint-Louis', 'Diourbel', 'Ziguinchor', 'Kaolack']
  },
  {
    code: 'sl',
    namePt: 'Serra Leoa',
    nameEn: 'Sierra Leone',
    region: 'Africa',
    provinces: ['Western Area (Freetown)', 'Northern Province', 'Southern Province (Bo)', 'Eastern Province (Kenema)']
  },
  {
    code: 'rs',
    namePt: 'Sérvia',
    nameEn: 'Serbia',
    region: 'Europe',
    provinces: ['Belgrade', 'Vojvodina (Novi Sad)', 'Šumadija and Western Serbia', 'Southern and Eastern Serbia (Niš)']
  },
  {
    code: 'sg',
    namePt: 'Singapura',
    nameEn: 'Singapore',
    region: 'Asia',
    indeedBaseUrl: 'https://sg.indeed.com/jobs',
    provinces: ['Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region'],
    hints: ['singapore', 'singapura']
  },
  {
    code: 'sy',
    namePt: 'Síria',
    nameEn: 'Syria',
    region: 'Middle East',
    provinces: ['Damascus', 'Aleppo', 'Homs', 'Latakia']
  },
  {
    code: 'so',
    namePt: 'Somália',
    nameEn: 'Somalia',
    region: 'Africa',
    provinces: ['Banaadir (Mogadishu)', 'Woqooyi Galbeed (Hargeisa)', 'Bari', 'Lower Juba']
  },
  {
    code: 'lk',
    namePt: 'Sri Lanka',
    nameEn: 'Sri Lanka',
    region: 'Asia',
    provinces: ['Western (Colombo)', 'Central (Kandy)', 'Southern (Galle)']
  },
  {
    code: 'sd',
    namePt: 'Sudão',
    nameEn: 'Sudan',
    region: 'Africa',
    provinces: ['Khartoum', 'Red Sea (Port Sudan)', 'Gezira', 'Kassala']
  },
  {
    code: 'ss',
    namePt: 'Sudão do Sul',
    nameEn: 'South Sudan',
    region: 'Africa',
    provinces: ['Central Equatoria (Juba)', 'Upper Nile (Malakal)', 'Unity', 'Western Bahr el Ghazal']
  },
  {
    code: 'se',
    namePt: 'Suécia',
    nameEn: 'Sweden',
    region: 'Europe',
    indeedBaseUrl: 'https://se.indeed.com/jobs',
    provinces: ['Stockholm', 'Västra Götaland (Gothenburg)', 'Skåne (Malmö)', 'Uppsala', 'Östergötland (Linköping)']
  },
  {
    code: 'ch',
    namePt: 'Suíça',
    nameEn: 'Switzerland',
    region: 'Europe',
    indeedBaseUrl: 'https://ch.indeed.com/jobs',
    provinces: ['Zurich', 'Geneva', 'Basel-Stadt', 'Vaud (Lausanne)', 'Bern', 'Zug', 'Ticino (Lugano)', 'Lucerne', 'Aargau', 'St. Gallen'],
    hints: ['switzerland', 'suica', 'zurich', 'geneva', 'lausanne', 'basel', 'bern', 'zug']
  },
  {
    code: 'sr',
    namePt: 'Suriname',
    nameEn: 'Suriname',
    region: 'Americas',
    provinces: ['Paramaribo', 'Wanica', 'Nickerie']
  },
  {
    code: 'th',
    namePt: 'Tailândia',
    nameEn: 'Thailand',
    region: 'Asia',
    indeedBaseUrl: 'https://th.indeed.com/jobs',
    provinces: ['Bangkok', 'Chiang Mai', 'Phuket', 'Chonburi (Pattaya)', 'Nonthaburi']
  },
  {
    code: 'tw',
    namePt: 'Taiwan',
    nameEn: 'Taiwan',
    region: 'Asia',
    indeedBaseUrl: 'https://tw.indeed.com/jobs',
    provinces: ['Taipei', 'New Taipei', 'Taichung', 'Kaohsiung', 'Hsinchu', 'Tainan']
  },
  {
    code: 'tj',
    namePt: 'Tajiquistão',
    nameEn: 'Tajikistan',
    region: 'Asia',
    provinces: ['Dushanbe', 'Sughd (Khujand)', 'Khatlon']
  },
  {
    code: 'tz',
    namePt: 'Tanzânia',
    nameEn: 'Tanzania',
    region: 'Africa',
    provinces: ['Dar es Salaam', 'Arusha', 'Dodoma', 'Mwanza', 'Zanzibar']
  },
  {
    code: 'tl',
    namePt: 'Timor-Leste',
    nameEn: 'Timor-Leste',
    region: 'Asia',
    provinces: ['Díli', 'Baucau', 'Bobonaro', 'Ermera', 'Oecusse']
  },
  {
    code: 'tg',
    namePt: 'Togo',
    nameEn: 'Togo',
    region: 'Africa',
    provinces: ['Maritime (Lomé)', 'Plateaux', 'Centrale', 'Kara']
  },
  {
    code: 'to',
    namePt: 'Tonga',
    nameEn: 'Tonga',
    region: 'Oceania',
    provinces: ['Tongatapu (Nukuʻalofa)', 'Vavaʻu', 'Haʻapai']
  },
  {
    code: 'tt',
    namePt: 'Trindade e Tobago',
    nameEn: 'Trinidad and Tobago',
    region: 'Americas',
    provinces: ['Port of Spain', 'San Fernando', 'Chaguanas', 'Tobago']
  },
  {
    code: 'tn',
    namePt: 'Tunísia',
    nameEn: 'Tunisia',
    region: 'Africa',
    provinces: ['Tunis', 'Sfax', 'Sousse', 'Ariana', 'Nabeul']
  },
  {
    code: 'tm',
    namePt: 'Turquemenistão',
    nameEn: 'Turkmenistan',
    region: 'Asia',
    provinces: ['Ashgabat', 'Mary', 'Lebap', 'Balkan']
  },
  {
    code: 'tr',
    namePt: 'Turquia',
    nameEn: 'Turkey',
    region: 'Middle East',
    indeedBaseUrl: 'https://tr.indeed.com/jobs',
    provinces: ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Kocaeli']
  },
  {
    code: 'tv',
    namePt: 'Tuvalu',
    nameEn: 'Tuvalu',
    region: 'Oceania',
    provinces: ['Funafuti', 'Vaitupu']
  },
  {
    code: 'ua',
    namePt: 'Ucrânia',
    nameEn: 'Ukraine',
    region: 'Europe',
    provinces: ['Kyiv', 'Lviv', 'Odesa', 'Dnipro', 'Kharkiv']
  },
  {
    code: 'ug',
    namePt: 'Uganda',
    nameEn: 'Uganda',
    region: 'Africa',
    provinces: ['Central (Kampala)', 'Western (Mbarara)', 'Eastern (Jinja)', 'Northern (Gulu)']
  },
  {
    code: 'uy',
    namePt: 'Uruguai',
    nameEn: 'Uruguay',
    region: 'Americas',
    indeedBaseUrl: 'https://uy.indeed.com/jobs',
    provinces: ['Montevideo', 'Canelones', 'Maldonado (Punta del Este)', 'Colonia', 'Salto']
  },
  {
    code: 'uz',
    namePt: 'Uzbequistão',
    nameEn: 'Uzbekistan',
    region: 'Asia',
    provinces: ['Tashkent', 'Samarkand', 'Bukhara', 'Fergana']
  },
  {
    code: 'vu',
    namePt: 'Vanuatu',
    nameEn: 'Vanuatu',
    region: 'Oceania',
    provinces: ['Shefa (Port Vila)', 'Sanma (Luganville)']
  },
  {
    code: 'va',
    namePt: 'Vaticano',
    nameEn: 'Vatican City',
    region: 'Europe',
    provinces: ['Vatican City']
  },
  {
    code: 've',
    namePt: 'Venezuela',
    nameEn: 'Venezuela',
    region: 'Americas',
    indeedBaseUrl: 'https://ve.indeed.com/jobs',
    provinces: ['Distrito Capital (Caracas)', 'Miranda', 'Zulia (Maracaibo)', 'Carabobo (Valencia)', 'Lara']
  },
  {
    code: 'vn',
    namePt: 'Vietname',
    nameEn: 'Vietnam',
    region: 'Asia',
    indeedBaseUrl: 'https://vn.indeed.com/jobs',
    provinces: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Binh Duong', 'Hai Phong']
  },
  {
    code: 'zm',
    namePt: 'Zâmbia',
    nameEn: 'Zambia',
    region: 'Africa',
    provinces: ['Lusaka', 'Copperbelt (Ndola / Kitwe)', 'Southern (Livingstone)', 'Central']
  },
  {
    code: 'zw',
    namePt: 'Zimbábue',
    nameEn: 'Zimbabwe',
    region: 'Africa',
    provinces: ['Harare', 'Bulawayo', 'Manicaland (Mutare)', 'Mashonaland']
  }
];

export const LEGACY_COUNTRY_ALIAS_MAP: Record<string, string> = {
  remoto_global: 'remoto_global',
  brasil: 'br',
  portugal: 'pt',
  angola: 'ao',
  espanha: 'es',
  reino_unido: 'gb',
  alemanha: 'de',
  franca: 'fr',
  estados_unidos: 'us',
  canada: 'ca',
  europa: 'europa'
};

export function normalizeLocationToken(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveCountryEntry(rawCodeOrName: string): WorldCountryEntry | null {
  const clean = (rawCodeOrName || '').trim();
  if (!clean) return null;
  const lower = clean.toLowerCase();
  const aliasCode = LEGACY_COUNTRY_ALIAS_MAP[lower] || lower;
  const byCode = WORLD_COUNTRIES.find((c) => c.code.toLowerCase() === aliasCode);
  if (byCode) return byCode;

  const norm = normalizeLocationToken(clean);
  return (
    WORLD_COUNTRIES.find(
      (c) =>
        normalizeLocationToken(c.namePt) === norm ||
        normalizeLocationToken(c.nameEn) === norm ||
        (c.hints || []).some((h) => normalizeLocationToken(h) === norm)
    ) || null
  );
}

export function getCountryDisplayName(codeOrAlias: string, lang: string): string {
  const entry = resolveCountryEntry(codeOrAlias);
  if (!entry) return codeOrAlias;
  const isPt = lang === 'pt';
  return isPt ? entry.namePt : entry.nameEn;
}

export function extractProvinceSearchTerm(provinceLabel: string): string {
  // Strip parenthetical city hints if user picks e.g. "Bavaria (Munich)" -> search clean term "Munich" or "Bavaria"
  const clean = (provinceLabel || '').trim();
  if (!clean) return '';
  const paren = clean.match(/^([^()]+)\(([^()]+)\)/);
  if (paren) {
    // Use main province name first unless it's generic like "England (...)"
    const mainPart = paren[1].trim();
    const innerPart = paren[2].split('/')[0].trim();
    if (/^(england|scotland|wales|northern ireland|central|western|eastern|northern|southern|capital)/i.test(mainPart)) {
      return innerPart;
    }
    return mainPart;
  }
  return clean;
}

export function buildCountryMatchHints(entry: WorldCountryEntry): string[] {
  const set = new Set<string>();
  const add = (val: string) => {
    const n = normalizeLocationToken(val);
    if (n.length >= 2) set.add(n);
  };
  add(entry.code);
  add(entry.nameEn);
  add(entry.namePt);
  (entry.hints || []).forEach(add);
  entry.provinces.forEach((p) => {
    const cleanMain = p.replace(/\([^)]*\)/g, '').trim();
    if (cleanMain.length >= 3) add(cleanMain);
    const inParen = p.match(/\(([^)]+)\)/);
    if (inParen?.[1]) {
      inParen[1].split('/').forEach((city) => add(city.trim()));
    }
  });
  return Array.from(set);
}

export interface CountryExternalPortal {
  id: string;
  name: string;
  url: string;
  liveCount?: number | null;
}

export function getCountrySpecificPortals(params: {
  countryCode?: string;
  province?: string;
  roleQuery: string;
  radarBaseUrl: string;
  sourceCounts: Record<string, number>;
}): CountryExternalPortal[] {
  const { countryCode, province, roleQuery, radarBaseUrl, sourceCounts } = params;
  const entry = countryCode ? resolveCountryEntry(countryCode) : null;
  const cleanProv = province ? extractProvinceSearchTerm(province) : '';
  const countryLabelEn = entry && entry.code !== 'remoto_global' ? entry.nameEn : '';
  const fullLoc = [cleanProv, countryLabelEn].filter(Boolean).join(', ') || 'Remote';
  const encRole = encodeURIComponent(roleQuery || 'Software');
  const encLoc = encodeURIComponent(fullLoc);
  const indeedBase = entry?.indeedBaseUrl || 'https://www.indeed.com/jobs';

  const portals: CountryExternalPortal[] = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      url: `https://www.linkedin.com/jobs/search/?keywords=${encRole}&location=${encLoc}`,
      liveCount: sourceCounts.linkedin ?? null
    },
    {
      id: 'indeed',
      name: entry && entry.indeedBaseUrl ? `Indeed (${entry.code.toUpperCase()})` : 'Indeed',
      url: `${indeedBase}?q=${encRole}&l=${encLoc}`,
      liveCount: null
    },
    {
      id: 'google_jobs',
      name: 'Google Jobs',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${roleQuery || ''} jobs in ${fullLoc}`.trim())}&ibp=htl;jobs`,
      liveCount: null
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encRole}`,
      liveCount: null
    }
  ];

  const code = entry?.code || '';

  // Country & region specific portals
  if (code === 'ao') {
    portals.push(
      { id: 'jobartis', name: 'Jobartis (Angola)', url: `https://www.jobartis.com/vagas?q=${encRole}&l=${encLoc}`, liveCount: null },
      { id: 'angoemprego', name: 'AngoEmprego', url: `https://www.angoemprego.com/?s=${encRole}`, liveCount: null }
    );
  } else if (code === 'mz') {
    portals.push(
      { id: 'emprego_mz', name: 'Emprego.co.mz', url: `https://www.emprego.co.mz/?s=${encRole}`, liveCount: null }
    );
  } else if (code === 'pt') {
    portals.push(
      { id: 'net_empregos', name: 'Net-Empregos (PT)', url: `https://www.net-empregos.com/pesquisa-empregos.asp?chaves=${encRole}`, liveCount: null },
      { id: 'sapo_emprego', name: 'SAPO Emprego', url: `https://emprego.sapo.pt/offers?search=${encRole}`, liveCount: null }
    );
  } else if (code === 'br') {
    portals.push(
      { id: 'gupy', name: 'Gupy (Brasil)', url: `https://portal.gupy.io/job-search/term=${encRole}`, liveCount: null },
      { id: 'infojobs', name: 'InfoJobs (Brasil)', url: `https://www.infojobs.com.br/empregos.aspx?palabra=${encRole}`, liveCount: null },
      { id: 'catho', name: 'Catho', url: `https://www.catho.com.br/vagas/${encodeURIComponent((roleQuery || 'vagas').toLowerCase().replace(/\s+/g, '-'))}/`, liveCount: null }
    );
  } else if (code === 'gb') {
    portals.push(
      { id: 'reed', name: 'Reed (UK)', url: `https://www.reed.co.uk/jobs/${encodeURIComponent((roleQuery || 'jobs').toLowerCase().replace(/\s+/g, '-'))}-jobs`, liveCount: null },
      { id: 'totaljobs', name: 'Totaljobs (UK)', url: `https://www.totaljobs.com/jobs/${encodeURIComponent((roleQuery || 'jobs').toLowerCase().replace(/\s+/g, '-'))}`, liveCount: null }
    );
  } else if (code === 'de' || code === 'at' || code === 'ch') {
    portals.push(
      { id: 'stepstone', name: 'StepStone', url: `https://www.stepstone.de/jobs/${encodeURIComponent((roleQuery || 'jobs').toLowerCase().replace(/\s+/g, '-'))}.html`, liveCount: null },
      { id: 'xing', name: 'XING Jobs', url: `https://www.xing.com/jobs/search?keywords=${encRole}&location=${encLoc}`, liveCount: null }
    );
  } else if (code === 'fr') {
    portals.push(
      { id: 'wttj', name: 'Welcome to the Jungle', url: `https://www.welcometothejungle.com/fr/jobs?query=${encRole}`, liveCount: null },
      { id: 'francetravail', name: 'France Travail', url: `https://candidat.francetravail.fr/offres/recherche?motsCles=${encRole}`, liveCount: null }
    );
  } else if (code === 'es') {
    portals.push(
      { id: 'infojobs_es', name: 'InfoJobs (ES)', url: `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${encRole}`, liveCount: null }
    );
  } else if (code === 'ca') {
    portals.push(
      { id: 'jobbank_ca', name: 'Job Bank Canada', url: `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${encRole}&locationstring=${encLoc}`, liveCount: null }
    );
  } else if (code === 'us') {
    portals.push(
      { id: 'ziprecruiter', name: 'ZipRecruiter', url: `https://www.ziprecruiter.com/jobs-search?search=${encRole}&location=${encLoc}`, liveCount: null },
      { id: 'usajobs', name: 'USAJOBS (Gov)', url: `https://www.usajobs.gov/Search/Results?k=${encRole}&l=${encLoc}`, liveCount: null }
    );
  } else if (code === 'au' || code === 'nz') {
    portals.push(
      { id: 'seek', name: 'SEEK', url: `https://www.seek.com.au/jobs?keywords=${encRole}&where=${encLoc}`, liveCount: null }
    );
  } else if (code === 'za') {
    portals.push(
      { id: 'careers24', name: 'Careers24 (ZA)', url: `https://www.careers24.com/jobs/kw-${encodeURIComponent((roleQuery || '').toLowerCase())}/`, liveCount: null }
    );
  } else if (code === 'ng' || code === 'gh') {
    portals.push(
      { id: 'jobberman', name: 'Jobberman', url: `https://www.jobberman.com/jobs?q=${encRole}`, liveCount: null }
    );
  } else if (code === 'ke' || code === 'ug' || code === 'tz') {
    portals.push(
      { id: 'brightermonday', name: 'BrighterMonday', url: `https://www.brightermonday.co.ke/jobs?q=${encRole}`, liveCount: null }
    );
  } else if (code === 'in') {
    portals.push(
      { id: 'naukri', name: 'Naukri (India)', url: `https://www.naukri.com/${encodeURIComponent((roleQuery || 'jobs').toLowerCase().replace(/\s+/g, '-'))}-jobs`, liveCount: null }
    );
  } else if (entry?.region === 'Middle East') {
    portals.push(
      { id: 'bayt', name: 'Bayt (MENA)', url: `https://www.bayt.com/en/international/jobs/${encodeURIComponent((roleQuery || 'jobs').toLowerCase().replace(/\s+/g, '-'))}-jobs/`, liveCount: null }
    );
  } else if (entry?.region === 'Americas' && ['mx', 'co', 'ar', 'cl', 'pe', 'ec', 've', 'uy', 'py', 'bo', 'cr', 'pa', 'do', 'gt', 'sv', 'hn', 'ni'].includes(code)) {
    portals.push(
      { id: 'computrabajo', name: 'Computrabajo', url: `https://www.computrabajo.com/trabajo-de-${encodeURIComponent((roleQuery || 'empleo').toLowerCase().replace(/\s+/g, '-'))}`, liveCount: null }
    );
  } else if (entry?.region === 'Asia' && ['sg', 'my', 'ph', 'id'].includes(code)) {
    portals.push(
      { id: 'jobstreet', name: 'JobStreet', url: `https://www.jobstreet.com/jobs?keywords=${encRole}`, liveCount: null }
    );
  }

  if (entry?.region === 'Europe' || code === 'europa') {
    portals.push({
      id: 'eures',
      name: 'EURES (EU Portal)',
      url: `https://europa.eu/eures/portal/jv-se/search?keywords=${encRole}`,
      liveCount: null
    });
  }

  portals.push(
    {
      id: 'reliefweb',
      name: 'ReliefWeb (ONU/ONG)',
      url: `https://reliefweb.int/jobs?search=${encodeURIComponent(`${roleQuery || ''} ${countryLabelEn}`.trim())}`,
      liveCount: sourceCounts.reliefweb ?? null
    },
    {
      id: 'wellfound',
      name: 'Wellfound',
      url: `https://wellfound.com/jobs?query=${encRole}`,
      liveCount: null
    },
    {
      id: 'radar',
      name: 'Radar de Vagas',
      url: `${radarBaseUrl}/?q=${encRole}`,
      liveCount: sourceCounts.radar ?? null
    }
  );

  return portals;
}
