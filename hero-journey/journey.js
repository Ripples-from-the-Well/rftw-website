/* Journey to Uganda: a hand-built orthographic dot globe (Canvas 2D) that starts on the visitor's nearest major city
   (worked out from the browser's time zone, no network), draws the great circle to Jinja while the globe turns with it,
   then flies down into the shaded-relief map of Uganda and opens a small "learn about Uganda" layer of real buttons.
   Override for a real IP lookup later:  window.RIPPLES_ORIGIN = {name, lon, lat}  before this script, or
   dispatchEvent(new CustomEvent('ripples:origin', {detail: {name, lon, lat}})) at any time. Testing: ?from=Europe/London */
(() => {
  const { geo, colors, theme, stage, relief, TAU, clamp, lerp, ease, FONT, fontsReady, reduced } = Kit;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const hero = document.getElementById('hero'), cv = document.getElementById('cv');
  const btn = document.getElementById('zoomBtn'), btnLabel = btn.querySelector('span');
  const replayBtn = document.getElementById('replayBtn'), bar = document.getElementById('bar');
  const fromEl = document.getElementById('from'), fromTxt = fromEl.querySelector('span');
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const wrap = d => ((d % 360) + 540) % 360 - 180;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const now = () => performance.now();

  /* ---------- time zone -> nearest major city (418 zones; z: [lon, lat], l: old alias -> zone, n: display names) ---------- */
  const TZ = {"z":{"Africa/Abidjan":[-4.03,5.32],"Africa/Accra":[-0.22,5.55],"Africa/Addis_Ababa":[38.7,9.03],"Africa/Algiers":[3.05,36.78],"Africa/Asmara":[38.88,15.33],"Africa/Bamako":[-8.0,12.65],"Africa/Bangui":[18.58,4.37],"Africa/Banjul":[-16.65,13.47],"Africa/Bissau":[-15.58,11.85],"Africa/Blantyre":[35.0,-15.78],"Africa/Brazzaville":[15.28,-4.27],"Africa/Bujumbura":[29.37,-3.38],"Africa/Cairo":[31.25,30.05],"Africa/Casablanca":[-7.58,33.65],"Africa/Ceuta":[-5.32,35.88],"Africa/Conakry":[-13.72,9.52],"Africa/Dakar":[-17.43,14.67],"Africa/Dar_es_Salaam":[39.28,-6.8],"Africa/Djibouti":[43.15,11.6],"Africa/Douala":[9.7,4.05],"Africa/El_Aaiun":[-13.2,27.15],"Africa/Freetown":[-13.25,8.5],"Africa/Gaborone":[25.92,-24.65],"Africa/Harare":[31.05,-17.83],"Africa/Johannesburg":[28.0,-26.25],"Africa/Juba":[31.62,4.85],"Africa/Kampala":[32.42,0.32],"Africa/Khartoum":[32.53,15.6],"Africa/Kigali":[30.07,-1.95],"Africa/Kinshasa":[15.3,-4.3],"Africa/Lagos":[3.4,6.45],"Africa/Libreville":[9.45,0.38],"Africa/Lome":[1.22,6.13],"Africa/Luanda":[13.23,-8.8],"Africa/Lubumbashi":[27.47,-11.67],"Africa/Lusaka":[28.28,-15.42],"Africa/Malabo":[8.78,3.75],"Africa/Maputo":[32.58,-25.97],"Africa/Maseru":[27.5,-29.47],"Africa/Mbabane":[31.1,-26.3],"Africa/Mogadishu":[45.37,2.07],"Africa/Monrovia":[-10.78,6.3],"Africa/Nairobi":[36.82,-1.28],"Africa/Ndjamena":[15.05,12.12],"Africa/Niamey":[2.12,13.52],"Africa/Nouakchott":[-15.95,18.1],"Africa/Ouagadougou":[-1.52,12.37],"Africa/Porto-Novo":[2.62,6.48],"Africa/Sao_Tome":[6.73,0.33],"Africa/Tripoli":[13.18,32.9],"Africa/Tunis":[10.18,36.8],"Africa/Windhoek":[17.1,-22.57],"America/Adak":[-176.66,51.88],"America/Anchorage":[-149.9,61.22],"America/Anguilla":[-63.07,18.2],"America/Antigua":[-61.8,17.05],"America/Araguaina":[-48.2,-7.2],"America/Argentina/Buenos_Aires":[-58.45,-34.6],"America/Argentina/Catamarca":[-65.78,-28.47],"America/Argentina/Cordoba":[-64.18,-31.4],"America/Argentina/Jujuy":[-65.3,-24.18],"America/Argentina/La_Rioja":[-66.85,-29.43],"America/Argentina/Mendoza":[-68.82,-32.88],"America/Argentina/Rio_Gallegos":[-69.22,-51.63],"America/Argentina/Salta":[-65.42,-24.78],"America/Argentina/San_Juan":[-68.52,-31.53],"America/Argentina/San_Luis":[-66.35,-33.32],"America/Argentina/Tucuman":[-65.22,-26.82],"America/Argentina/Ushuaia":[-68.3,-54.8],"America/Aruba":[-69.97,12.5],"America/Asuncion":[-57.67,-25.27],"America/Atikokan":[-91.62,48.76],"America/Bahia":[-38.52,-12.98],"America/Bahia_Banderas":[-105.25,20.8],"America/Barbados":[-59.62,13.1],"America/Belem":[-48.48,-1.45],"America/Belize":[-88.2,17.5],"America/Blanc-Sablon":[-57.12,51.42],"America/Boa_Vista":[-60.67,2.82],"America/Bogota":[-74.08,4.6],"America/Boise":[-116.2,43.61],"America/Cambridge_Bay":[-105.05,69.11],"America/Campo_Grande":[-54.62,-20.45],"America/Cancun":[-86.77,21.08],"America/Caracas":[-66.93,10.5],"America/Cayenne":[-52.33,4.93],"America/Cayman":[-81.38,19.3],"America/Chicago":[-87.65,41.85],"America/Chihuahua":[-106.08,28.63],"America/Ciudad_Juarez":[-106.48,31.73],"America/Costa_Rica":[-84.08,9.93],"America/Coyhaique":[-72.07,-45.57],"America/Creston":[-116.52,49.1],"America/Cuiaba":[-56.08,-15.58],"America/Curacao":[-69.0,12.18],"America/Danmarkshavn":[-18.67,76.77],"America/Dawson":[-139.42,64.07],"America/Dawson_Creek":[-120.23,55.77],"America/Denver":[-104.98,39.74],"America/Detroit":[-83.05,42.33],"America/Dominica":[-61.4,15.3],"America/Edmonton":[-113.47,53.55],"America/Eirunepe":[-69.87,-6.67],"America/El_Salvador":[-89.2,13.7],"America/Fort_Nelson":[-122.7,58.8],"America/Fortaleza":[-38.5,-3.72],"America/Glace_Bay":[-59.95,46.2],"America/Goose_Bay":[-60.42,53.33],"America/Grand_Turk":[-71.13,21.47],"America/Grenada":[-61.75,12.05],"America/Guadeloupe":[-61.53,16.23],"America/Guatemala":[-90.52,14.63],"America/Guayaquil":[-79.83,-2.17],"America/Guyana":[-58.17,6.8],"America/Halifax":[-63.6,44.65],"America/Havana":[-82.37,23.13],"America/Hermosillo":[-110.97,29.07],"America/Indiana/Indianapolis":[-86.16,39.77],"America/Indiana/Knox":[-86.62,41.3],"America/Indiana/Marengo":[-86.34,38.38],"America/Indiana/Petersburg":[-87.28,38.49],"America/Indiana/Tell_City":[-86.76,37.95],"America/Indiana/Vevay":[-85.07,38.75],"America/Indiana/Vincennes":[-87.53,38.68],"America/Indiana/Winamac":[-86.6,41.05],"America/Inuvik":[-133.72,68.35],"America/Iqaluit":[-68.47,63.73],"America/Jamaica":[-76.79,17.97],"America/Juneau":[-134.42,58.3],"America/Kentucky/Louisville":[-85.76,38.25],"America/Kentucky/Monticello":[-84.85,36.83],"America/Kralendijk":[-68.28,12.15],"America/La_Paz":[-68.15,-16.5],"America/Lima":[-77.05,-12.05],"America/Los_Angeles":[-118.24,34.05],"America/Lower_Princes":[-63.05,18.05],"America/Maceio":[-35.72,-9.67],"America/Managua":[-86.28,12.15],"America/Manaus":[-60.02,-3.13],"America/Marigot":[-63.08,18.07],"America/Martinique":[-61.08,14.6],"America/Matamoros":[-97.5,25.83],"America/Mazatlan":[-106.42,23.22],"America/Menominee":[-87.61,45.11],"America/Merida":[-89.62,20.97],"America/Metlakatla":[-131.58,55.13],"America/Mexico_City":[-99.15,19.4],"America/Miquelon":[-56.33,47.05],"America/Moncton":[-64.78,46.1],"America/Monterrey":[-100.32,25.67],"America/Montevideo":[-56.21,-34.91],"America/Montserrat":[-62.22,16.72],"America/Nassau":[-77.35,25.08],"America/New_York":[-74.01,40.71],"America/Nome":[-165.41,64.5],"America/Noronha":[-32.42,-3.85],"America/North_Dakota/Beulah":[-101.78,47.26],"America/North_Dakota/Center":[-101.3,47.12],"America/North_Dakota/New_Salem":[-101.41,46.84],"America/Nuuk":[-51.73,64.18],"America/Ojinaga":[-104.42,29.57],"America/Panama":[-79.53,8.97],"America/Paramaribo":[-55.17,5.83],"America/Phoenix":[-112.07,33.45],"America/Port-au-Prince":[-72.33,18.53],"America/Port_of_Spain":[-61.52,10.65],"America/Porto_Velho":[-63.9,-8.77],"America/Puerto_Rico":[-66.11,18.47],"America/Punta_Arenas":[-70.92,-53.15],"America/Rankin_Inlet":[-92.08,62.82],"America/Recife":[-34.9,-8.05],"America/Regina":[-104.65,50.4],"America/Resolute":[-94.83,74.7],"America/Rio_Branco":[-67.8,-9.97],"America/Santarem":[-54.87,-2.43],"America/Santiago":[-70.67,-33.45],"America/Santo_Domingo":[-69.9,18.47],"America/Sao_Paulo":[-46.62,-23.53],"America/Scoresbysund":[-21.97,70.48],"America/Sitka":[-135.3,57.18],"America/St_Barthelemy":[-62.85,17.88],"America/St_Johns":[-52.72,47.57],"America/St_Kitts":[-62.72,17.3],"America/St_Lucia":[-61.0,14.02],"America/St_Thomas":[-64.93,18.35],"America/St_Vincent":[-61.23,13.15],"America/Swift_Current":[-107.83,50.28],"America/Tegucigalpa":[-87.22,14.1],"America/Thule":[-68.78,76.57],"America/Tijuana":[-117.02,32.53],"America/Toronto":[-79.38,43.65],"America/Tortola":[-64.62,18.45],"America/Vancouver":[-123.12,49.27],"America/Whitehorse":[-135.05,60.72],"America/Winnipeg":[-97.15,49.88],"America/Yakutat":[-139.73,59.55],"Antarctica/Casey":[110.52,-66.28],"Antarctica/Davis":[77.97,-68.58],"Antarctica/DumontDUrville":[140.02,-66.67],"Antarctica/Macquarie":[158.95,-54.5],"Antarctica/Mawson":[62.88,-67.6],"Antarctica/McMurdo":[166.6,-77.83],"Antarctica/Palmer":[-64.1,-64.8],"Antarctica/Rothera":[-68.13,-67.57],"Antarctica/Syowa":[39.59,-69.01],"Antarctica/Troll":[2.53,-72.01],"Antarctica/Vostok":[106.9,-78.4],"Arctic/Longyearbyen":[16.0,78.0],"Asia/Aden":[45.2,12.75],"Asia/Almaty":[76.95,43.25],"Asia/Amman":[35.93,31.95],"Asia/Anadyr":[177.48,64.75],"Asia/Aqtau":[50.27,44.52],"Asia/Aqtobe":[57.17,50.28],"Asia/Ashgabat":[58.38,37.95],"Asia/Atyrau":[51.93,47.12],"Asia/Baghdad":[44.42,33.35],"Asia/Bahrain":[50.58,26.38],"Asia/Baku":[49.85,40.38],"Asia/Bangkok":[100.52,13.75],"Asia/Barnaul":[83.75,53.37],"Asia/Beirut":[35.5,33.88],"Asia/Bishkek":[74.6,42.9],"Asia/Brunei":[114.92,4.93],"Asia/Chita":[113.47,52.05],"Asia/Colombo":[79.85,6.93],"Asia/Damascus":[36.3,33.5],"Asia/Dhaka":[90.42,23.72],"Asia/Dili":[125.58,-8.55],"Asia/Dubai":[55.3,25.3],"Asia/Dushanbe":[68.8,38.58],"Asia/Famagusta":[33.95,35.12],"Asia/Gaza":[34.47,31.5],"Asia/Hebron":[35.09,31.53],"Asia/Ho_Chi_Minh":[106.67,10.75],"Asia/Hong_Kong":[114.15,22.28],"Asia/Hovd":[91.65,48.02],"Asia/Irkutsk":[104.33,52.27],"Asia/Jakarta":[106.8,-6.17],"Asia/Jayapura":[140.7,-2.53],"Asia/Jerusalem":[35.22,31.78],"Asia/Kabul":[69.2,34.52],"Asia/Kamchatka":[158.65,53.02],"Asia/Karachi":[67.05,24.87],"Asia/Kathmandu":[85.32,27.72],"Asia/Khandyga":[135.55,62.66],"Asia/Kolkata":[88.37,22.53],"Asia/Krasnoyarsk":[92.83,56.02],"Asia/Kuala_Lumpur":[101.7,3.17],"Asia/Kuching":[110.33,1.55],"Asia/Kuwait":[47.98,29.33],"Asia/Macau":[113.54,22.2],"Asia/Magadan":[150.8,59.57],"Asia/Makassar":[119.4,-5.12],"Asia/Manila":[120.97,14.59],"Asia/Muscat":[58.58,23.6],"Asia/Nicosia":[33.37,35.17],"Asia/Novokuznetsk":[87.12,53.75],"Asia/Novosibirsk":[82.92,55.03],"Asia/Omsk":[73.4,55.0],"Asia/Oral":[51.35,51.22],"Asia/Phnom_Penh":[104.92,11.55],"Asia/Pontianak":[109.33,-0.03],"Asia/Pyongyang":[125.75,39.02],"Asia/Qatar":[51.53,25.28],"Asia/Qostanay":[63.62,53.2],"Asia/Qyzylorda":[65.47,44.8],"Asia/Riyadh":[46.72,24.63],"Asia/Sakhalin":[142.7,46.97],"Asia/Samarkand":[66.8,39.67],"Asia/Seoul":[126.97,37.55],"Asia/Shanghai":[121.47,31.23],"Asia/Singapore":[103.85,1.28],"Asia/Srednekolymsk":[153.72,67.47],"Asia/Taipei":[121.5,25.05],"Asia/Tashkent":[69.3,41.33],"Asia/Tbilisi":[44.82,41.72],"Asia/Tehran":[51.43,35.67],"Asia/Thimphu":[89.65,27.47],"Asia/Tokyo":[139.74,35.65],"Asia/Tomsk":[84.97,56.5],"Asia/Ulaanbaatar":[106.88,47.92],"Asia/Urumqi":[87.58,43.8],"Asia/Ust-Nera":[143.23,64.56],"Asia/Vientiane":[102.6,17.97],"Asia/Vladivostok":[131.93,43.17],"Asia/Yakutsk":[129.67,62.0],"Asia/Yangon":[96.17,16.78],"Asia/Yekaterinburg":[60.6,56.85],"Asia/Yerevan":[44.5,40.18],"Atlantic/Azores":[-25.67,37.73],"Atlantic/Bermuda":[-64.77,32.28],"Atlantic/Canary":[-15.4,28.1],"Atlantic/Cape_Verde":[-23.52,14.92],"Atlantic/Faroe":[-6.77,62.02],"Atlantic/Madeira":[-16.9,32.63],"Atlantic/Reykjavik":[-21.85,64.15],"Atlantic/South_Georgia":[-36.53,-54.27],"Atlantic/St_Helena":[-5.7,-15.92],"Atlantic/Stanley":[-57.85,-51.7],"Australia/Adelaide":[138.58,-34.92],"Australia/Brisbane":[153.03,-27.47],"Australia/Broken_Hill":[141.45,-31.95],"Australia/Darwin":[130.83,-12.47],"Australia/Eucla":[128.87,-31.72],"Australia/Hobart":[147.32,-42.88],"Australia/Lindeman":[149.0,-20.27],"Australia/Lord_Howe":[159.08,-31.55],"Australia/Melbourne":[144.97,-37.82],"Australia/Perth":[115.85,-31.95],"Australia/Sydney":[151.22,-33.87],"Europe/Amsterdam":[4.9,52.37],"Europe/Andorra":[1.52,42.5],"Europe/Astrakhan":[48.05,46.35],"Europe/Athens":[23.72,37.97],"Europe/Belgrade":[20.5,44.83],"Europe/Berlin":[13.37,52.5],"Europe/Bratislava":[17.12,48.15],"Europe/Brussels":[4.33,50.83],"Europe/Bucharest":[26.1,44.43],"Europe/Budapest":[19.08,47.5],"Europe/Busingen":[8.68,47.7],"Europe/Chisinau":[28.83,47.0],"Europe/Copenhagen":[12.58,55.67],"Europe/Dublin":[-6.25,53.33],"Europe/Gibraltar":[-5.35,36.13],"Europe/Guernsey":[-2.54,49.45],"Europe/Helsinki":[24.97,60.17],"Europe/Isle_of_Man":[-4.47,54.15],"Europe/Istanbul":[28.97,41.02],"Europe/Jersey":[-2.11,49.18],"Europe/Kaliningrad":[20.5,54.72],"Europe/Kirov":[49.65,58.6],"Europe/Kyiv":[30.52,50.43],"Europe/Lisbon":[-9.13,38.72],"Europe/Ljubljana":[14.52,46.05],"Europe/London":[-0.13,51.51],"Europe/Luxembourg":[6.15,49.6],"Europe/Madrid":[-3.68,40.4],"Europe/Malta":[14.52,35.9],"Europe/Mariehamn":[19.95,60.1],"Europe/Minsk":[27.57,53.9],"Europe/Monaco":[7.38,43.7],"Europe/Moscow":[37.62,55.76],"Europe/Oslo":[10.75,59.92],"Europe/Paris":[2.33,48.87],"Europe/Podgorica":[19.27,42.43],"Europe/Prague":[14.43,50.08],"Europe/Riga":[24.1,56.95],"Europe/Rome":[12.48,41.9],"Europe/Samara":[50.15,53.2],"Europe/San_Marino":[12.47,43.92],"Europe/Sarajevo":[18.42,43.87],"Europe/Saratov":[46.03,51.57],"Europe/Simferopol":[34.1,44.95],"Europe/Skopje":[21.43,41.98],"Europe/Sofia":[23.32,42.68],"Europe/Stockholm":[18.05,59.33],"Europe/Tallinn":[24.75,59.42],"Europe/Tirane":[19.83,41.33],"Europe/Ulyanovsk":[48.4,54.33],"Europe/Vaduz":[9.52,47.15],"Europe/Vatican":[12.45,41.9],"Europe/Vienna":[16.33,48.22],"Europe/Vilnius":[25.32,54.68],"Europe/Volgograd":[44.42,48.73],"Europe/Warsaw":[21.0,52.25],"Europe/Zagreb":[15.97,45.8],"Europe/Zurich":[8.53,47.38],"Indian/Antananarivo":[47.52,-18.92],"Indian/Chagos":[72.42,-7.33],"Indian/Christmas":[105.72,-10.42],"Indian/Cocos":[96.92,-12.17],"Indian/Comoro":[43.27,-11.68],"Indian/Kerguelen":[70.22,-49.35],"Indian/Mahe":[55.47,-4.67],"Indian/Maldives":[73.5,4.17],"Indian/Mauritius":[57.5,-20.17],"Indian/Mayotte":[45.23,-12.78],"Indian/Reunion":[55.47,-20.87],"Pacific/Apia":[-171.73,-13.83],"Pacific/Auckland":[174.77,-36.87],"Pacific/Bougainville":[155.57,-6.22],"Pacific/Chatham":[-176.55,-43.95],"Pacific/Chuuk":[151.78,7.42],"Pacific/Easter":[-109.43,-27.15],"Pacific/Efate":[168.42,-17.67],"Pacific/Fakaofo":[-171.23,-9.37],"Pacific/Fiji":[178.42,-18.13],"Pacific/Funafuti":[179.22,-8.52],"Pacific/Galapagos":[-89.6,-0.9],"Pacific/Gambier":[-134.95,-23.13],"Pacific/Guadalcanal":[160.2,-9.53],"Pacific/Guam":[144.75,13.47],"Pacific/Honolulu":[-157.86,21.31],"Pacific/Kanton":[-171.72,-2.78],"Pacific/Kiritimati":[-157.33,1.87],"Pacific/Kosrae":[162.98,5.32],"Pacific/Kwajalein":[167.33,9.08],"Pacific/Majuro":[171.2,7.15],"Pacific/Marquesas":[-139.5,-9.0],"Pacific/Midway":[-177.37,28.22],"Pacific/Nauru":[166.92,-0.52],"Pacific/Niue":[-169.92,-19.02],"Pacific/Norfolk":[167.97,-29.05],"Pacific/Noumea":[166.45,-22.27],"Pacific/Pago_Pago":[-170.7,-14.27],"Pacific/Palau":[134.48,7.33],"Pacific/Pitcairn":[-130.08,-25.07],"Pacific/Pohnpei":[158.22,6.97],"Pacific/Port_Moresby":[147.17,-9.5],"Pacific/Rarotonga":[-159.77,-21.23],"Pacific/Saipan":[145.75,15.2],"Pacific/Tahiti":[-149.57,-17.53],"Pacific/Tarawa":[173.0,1.42],"Pacific/Tongatapu":[-175.2,-21.13],"Pacific/Wake":[166.62,19.28],"Pacific/Wallis":[-176.17,-13.3]},"l":{"Australia/ACT":"Australia/Sydney","Australia/LHI":"Australia/Lord_Howe","Australia/NSW":"Australia/Sydney","Australia/North":"Australia/Darwin","Australia/Queensland":"Australia/Brisbane","Australia/South":"Australia/Adelaide","Australia/Tasmania":"Australia/Hobart","Australia/Victoria":"Australia/Melbourne","Australia/West":"Australia/Perth","Australia/Yancowinna":"Australia/Broken_Hill","Brazil/Acre":"America/Rio_Branco","Brazil/DeNoronha":"America/Noronha","Brazil/East":"America/Sao_Paulo","Brazil/West":"America/Manaus","Canada/Atlantic":"America/Halifax","Canada/Central":"America/Winnipeg","Canada/Eastern":"America/Toronto","Canada/Mountain":"America/Edmonton","Canada/Newfoundland":"America/St_Johns","Canada/Pacific":"America/Vancouver","Canada/Saskatchewan":"America/Regina","Canada/Yukon":"America/Whitehorse","Chile/Continental":"America/Santiago","Chile/EasterIsland":"Pacific/Easter","Cuba":"America/Havana","Egypt":"Africa/Cairo","Eire":"Europe/Dublin","GB":"Europe/London","GB-Eire":"Europe/London","Hongkong":"Asia/Hong_Kong","Iran":"Asia/Tehran","Israel":"Asia/Jerusalem","Jamaica":"America/Jamaica","Japan":"Asia/Tokyo","Kwajalein":"Pacific/Kwajalein","Libya":"Africa/Tripoli","Mexico/BajaNorte":"America/Tijuana","Mexico/BajaSur":"America/Mazatlan","Mexico/General":"America/Mexico_City","NZ":"Pacific/Auckland","NZ-CHAT":"Pacific/Chatham","Navajo":"America/Denver","PRC":"Asia/Shanghai","Poland":"Europe/Warsaw","Portugal":"Europe/Lisbon","ROC":"Asia/Taipei","ROK":"Asia/Seoul","Singapore":"Asia/Singapore","Turkey":"Europe/Istanbul","US/Alaska":"America/Anchorage","US/Aleutian":"America/Adak","US/Arizona":"America/Phoenix","US/Central":"America/Chicago","US/East-Indiana":"America/Indiana/Indianapolis","US/Eastern":"America/New_York","US/Hawaii":"Pacific/Honolulu","US/Indiana-Starke":"America/Indiana/Knox","US/Michigan":"America/Detroit","US/Mountain":"America/Denver","US/Pacific":"America/Los_Angeles","US/Samoa":"Pacific/Pago_Pago","W-SU":"Europe/Moscow","America/Buenos_Aires":"America/Argentina/Buenos_Aires","America/Catamarca":"America/Argentina/Catamarca","America/Cordoba":"America/Argentina/Cordoba","America/Indianapolis":"America/Indiana/Indianapolis","America/Jujuy":"America/Argentina/Jujuy","America/Knox_IN":"America/Indiana/Knox","America/Louisville":"America/Kentucky/Louisville","America/Mendoza":"America/Argentina/Mendoza","Pacific/Samoa":"Pacific/Pago_Pago","America/Argentina/ComodRivadavia":"America/Argentina/Catamarca","America/Atka":"America/Adak","America/Ensenada":"America/Tijuana","America/Fort_Wayne":"America/Indiana/Indianapolis","America/Montreal":"America/Toronto","America/Nipigon":"America/Toronto","America/Pangnirtung":"America/Iqaluit","America/Porto_Acre":"America/Rio_Branco","America/Rainy_River":"America/Winnipeg","America/Rosario":"America/Argentina/Cordoba","America/Santa_Isabel":"America/Tijuana","America/Shiprock":"America/Denver","America/Thunder_Bay":"America/Toronto","America/Yellowknife":"America/Edmonton","Asia/Choibalsan":"Asia/Ulaanbaatar","Asia/Chongqing":"Asia/Shanghai","Asia/Harbin":"Asia/Shanghai","Asia/Kashgar":"Asia/Urumqi","Asia/Tel_Aviv":"Asia/Jerusalem","Australia/Canberra":"Australia/Sydney","Australia/Currie":"Australia/Hobart","Europe/Belfast":"Europe/London","Europe/Tiraspol":"Europe/Chisinau","Europe/Uzhgorod":"Europe/Kyiv","Europe/Zaporozhye":"Europe/Kyiv","Pacific/Enderbury":"Pacific/Kanton","Pacific/Johnston":"Pacific/Honolulu","America/Godthab":"America/Nuuk","Asia/Ashkhabad":"Asia/Ashgabat","Asia/Calcutta":"Asia/Kolkata","Asia/Chungking":"Asia/Shanghai","Asia/Dacca":"Asia/Dhaka","Asia/Istanbul":"Europe/Istanbul","Asia/Katmandu":"Asia/Kathmandu","Asia/Macao":"Asia/Macau","Asia/Rangoon":"Asia/Yangon","Asia/Saigon":"Asia/Ho_Chi_Minh","Asia/Thimbu":"Asia/Thimphu","Asia/Ujung_Pandang":"Asia/Makassar","Asia/Ulan_Bator":"Asia/Ulaanbaatar","Atlantic/Faeroe":"Atlantic/Faroe","Europe/Kiev":"Europe/Kyiv","Europe/Nicosia":"Asia/Nicosia","Africa/Asmera":"Africa/Asmara","Africa/Timbuktu":"Africa/Bamako","America/Coral_Harbour":"America/Atikokan","America/Virgin":"America/St_Thomas","Antarctica/South_Pole":"Antarctica/McMurdo","Iceland":"Atlantic/Reykjavik","Atlantic/Jan_Mayen":"Europe/Oslo","Pacific/Truk":"Pacific/Chuuk","Pacific/Yap":"Pacific/Chuuk","Pacific/Ponape":"Pacific/Pohnpei"},"n":{"America/Indiana/Indianapolis":"Indianapolis","America/Kentucky/Louisville":"Louisville","America/Argentina/Buenos_Aires":"Buenos Aires","Asia/Kolkata":"Kolkata","Asia/Ho_Chi_Minh":"Ho Chi Minh City","Europe/Kyiv":"Kyiv","Europe/Kiev":"Kyiv","America/St_Johns":"St. John’s","Pacific/Honolulu":"Honolulu","America/Port-au-Prince":"Port-au-Prince","Asia/Yangon":"Yangon","America/Detroit":"Detroit","America/Boise":"Boise","America/Anchorage":"Anchorage"}};

  const U = [32.45, 1.05];                         // aim point [lon, lat]: Uganda, nudged toward Lake Victoria
  const JINJA = [33.2, 0.44], WANY = [33.252, 0.468];
  const HUTCH = { name: 'Hutchinson, Kansas', lon: -97.93, lat: 38.06 };   // the ministry's US office: the fallback
  const KAMPALA = { name: 'Kampala', lon: 32.58, lat: 0.32 };
  const V = (lon, lat) => { const a = lon * D2R, b = lat * D2R, c = Math.cos(b); return [c * Math.cos(a), c * Math.sin(a), Math.sin(b)]; };
  const to3 = r => { const f = new Float64Array(r.length * 3); for (let i = 0; i < r.length; i++) { const v = V(r[i][0], -r[i][1]); f[i * 3] = v[0]; f[i * 3 + 1] = v[1]; f[i * 3 + 2] = v[2]; } return f; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const slerp = (A, B, w, t) => { const s = Math.sin(w) || 1e-9, a = Math.sin((1 - t) * w) / s, b = Math.sin(t * w) / s; return [a * A[0] + b * B[0], a * A[1] + b * B[1], a * A[2] + b * B[2]]; };
  const ll3 = v => [Math.atan2(v[1], v[0]) * R2D, Math.asin(clamp(v[2] / Math.hypot(v[0], v[1], v[2]), -1, 1)) * R2D];

  /* ---------- origin ---------- */
  const ACCENT = { 'America/Sao_Paulo': 'São Paulo', 'America/Bogota': 'Bogotá', 'America/Asuncion': 'Asunción', 'America/Cancun': 'Cancún', 'America/Merida': 'Mérida', 'America/Belem': 'Belém', 'America/Maceio': 'Maceió', 'America/Cuiaba': 'Cuiabá', 'America/Araguaina': 'Araguaína', 'America/Santarem': 'Santarém', 'America/Montreal': 'Montréal', 'Atlantic/Reykjavik': 'Reykjavík', 'Africa/Lome': 'Lomé', 'Europe/Zurich': 'Zürich', 'Asia/Ho_Chi_Minh': 'Ho Chi Minh City' };
  const zoneOrigin = zone => {
    if (!zone || typeof zone !== 'string') return null;
    let z = zone.trim(); if (TZ.l[z]) z = TZ.l[z];
    const c = TZ.z[z]; if (!c) return null;                       // UTC, Etc/*, unknown: no city
    return { name: TZ.n[z] || ACCENT[z] || z.split('/').pop().replace(/_/g, ' '), lon: c[0], lat: c[1], zone: z };
  };
  const urlZone = () => { const m = /[?&#]from=([^&#]+)/.exec(location.search + location.hash); if (!m) return null; try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (_) { return null; } };
  const valid = o => {
    if (!o || typeof o !== 'object') return null;
    const lon = +o.lon, lat = +o.lat;
    if (!isFinite(lon) || !isFinite(lat) || Math.abs(lat) > 90) return null;
    return { name: String(o.name == null ? '' : o.name).trim().slice(0, 48) || 'your city', lon: wrap(lon), lat };
  };
  const detectOrigin = () => {
    const g = valid(window.RIPPLES_ORIGIN); if (g) return g;
    const u = zoneOrigin(urlZone()); if (u) return u;
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { /* very old browser */ }
    return zoneOrigin(tz) || HUTCH;
  };
  // how far a point is from Uganda (0 inside), in km
  const UG_RINGS = geo.uganda;
  const ugKm = (lon, lat) => {
    let inside = false;
    for (const r of UG_RINGS) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [a, b] = r[i], [e, f] = r[j]; if ((b > -lat) !== (f > -lat) && lon < (e - a) * (-lat - b) / (f - b) + a) inside = !inside; }
    if (inside) return 0;
    let m = Infinity; for (const r of UG_RINGS) for (let i = 0; i < r.length; i += 2) m = Math.min(m, Kit.km([lon, lat], [r[i][0], -r[i][1]]));
    return m;
  };
  const LANG = (navigator.language || 'en-US');
  const MILES = /^en(-(US|GB)\b.*)?$/i.test(LANG);
  const num = n => { try { return n.toLocaleString(LANG); } catch (_) { return n.toLocaleString('en-US'); } };
  const dist = k => { const v = Math.round((MILES ? k / 1.609344 : k) / 10) * 10; return num(v) + (MILES ? ' miles' : ' km'); };

  const O = { name: '', lon: 0, lat: 0, close: false, km: 0, ang: 0, A: null, B: null, arc: [] };
  const setOrigin = o => {
    const close = ugKm(o.lon, o.lat) <= 300;
    const p = close ? KAMPALA : o;
    O.name = p.name; O.lon = p.lon; O.lat = p.lat; O.close = close;
    O.km = Kit.km([p.lon, p.lat], JINJA);
    O.A = V(p.lon, p.lat); O.B = V(...JINJA);
    O.ang = Math.acos(clamp(dot3(O.A, O.B), -1, 1));
    if (O.ang > 179.5 * D2R) { O.A = V(p.lon + .8, p.lat + .5); O.ang = Math.acos(clamp(dot3(O.A, O.B), -1, 1)); }   // antipode guard
    const N = Math.max(8, Math.round(O.ang * R2D / 0.85)), lift = Math.min(.075, O.ang * .06), arc = [];
    for (let i = 0; i <= N; i++) { const t = i / N, v = slerp(O.A, O.B, O.ang, t), h = 1 + lift * Math.sin(Math.PI * t); arc.push([v[0] * h, v[1] * h, v[2] * h]); }
    O.arc = arc;
    O.U = V(...U); O.angU = Math.acos(clamp(dot3(O.A, O.U), -1, 1));
    O.line = close ? '' : `${dist(O.km)} from ${O.name}`;
    fromTxt.textContent = O.line; fromEl.classList.toggle('off', !O.line);
    measureBar();
  };

  /* ---------- static geometry, built once ---------- */
  const STEP = 0.7;                                  // halftone pitch in degrees
  let DOTS = new Float32Array(0), ND = 0;
  const buildDots = () => {
    const W = 1440, H = 720, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.setTransform(W / 360, 0, 0, H / 180, W / 2, H / 2);
    g.fillStyle = '#fff'; g.fill(Kit.path(geo.world));
    g.globalCompositeOperation = 'destination-out'; g.fill(Kit.paths.lakes, 'evenodd');
    const d = g.getImageData(0, 0, W, H).data, out = [];
    let row = 0;
    for (let lat = -83.5; lat <= 83.5; lat += STEP, row++) {
      const n = Math.max(1, Math.round(360 * Math.cos(lat * D2R) / STEP)), dl = 360 / n, off = (row & 1) * dl / 2;
      const py = Math.min(H - 1, ((90 - lat) / 180 * H) | 0);
      for (let i = 0; i < n; i++) {
        const lon = -180 + i * dl + off, px = Math.min(W - 1, ((lon + 180) / 360 * W) | 0);
        if (d[(py * W + px) * 4 + 3] > 127) { const v = V(lon, lat); out.push(v[0], v[1], v[2]); }
      }
    }
    DOTS = new Float32Array(out); ND = out.length / 3;
  };
  buildDots();
  const SX = new Float32Array(ND), SY = new Float32Array(ND), SB = new Int8Array(ND);

  const GRAT = [];
  for (let lon = -180; lon < 180; lon += 15) { const r = []; for (let lat = -80; lat <= 80; lat += 2) r.push([lon, -lat]); GRAT.push(to3(r)); }
  for (let lat = -75; lat <= 75; lat += 15) { const r = []; for (let lon = -180; lon <= 180; lon += 2) r.push([lon, -lat]); GRAT.push(to3(r)); }
  const UG = geo.uganda.map(to3);
  const LAKES = ['Lake Victoria', 'Lake Kyoga', 'Lake Kwania', 'Lake Albert', 'Lake Edward', 'Lake Kivu', 'Lake Tanganyika', 'Lake Turkana'].flatMap(k => (geo.lakes[k] || []).map(to3));
  const NILE = to3(geo.nile);
  const RIVERS = Object.values(geo.rivers).flat().map(to3);
  const NEIGH = Object.values(geo.neighbors).flat().map(to3);
  const EQUATOR = (() => { const r = []; for (let lon = 26; lon <= 39; lon += .25) r.push([lon, 0]); return to3(r); })();
  const placeAt = n => geo.places.find(p => p.n === n);
  const TOWNS = ['Kampala', 'Entebbe', 'Gulu', 'Lira', 'Mbale', 'Arua', 'Mbarara', 'Fort Portal', 'Masaka', 'Soroti', 'Kabale', 'Hoima'].map(placeAt).filter(Boolean);
  const TOWNS_SMALL = ['Kampala', 'Entebbe', 'Masaka', 'Mbale', 'Lira'];
  const LEFT_TOWNS = ['Entebbe', 'Masaka', 'Arua', 'Fort Portal', 'Mbale'];
  const COUNTRIES = [['Kenya', 36.4, 1.9], ['Tanzania', 34.2, -3.4], ['South Sudan', 31.4, 5.15], ['DR Congo', 28.3, 1.5], ['Rwanda', 29.95, -2.05]];
  const WATER = [['Lake Victoria', 33.05, -1.3, 1], ['Lake Albert', 30.05, 1.55, 0]];
  const PEAKS = [['Mount Elgon', 34.55, 1.13, 0], ['Rwenzori Mountains', 29.93, 0.38, 0]];

  /* ---------- learn about Uganda: the stops (facts verbatim from the brief) ---------- */
  const STOPS = [
    { nm: 'Wanyange', t: 'Wanyange, Jinja', primary: 1, at: WANY, go: ['Sponsor a child', '/sponsor'],
      p: 'Where Ripples works: <b>150 children</b> and <b>70 families</b>, alongside a church plant we assisted in 2025.' },
    { nm: 'Jinja', t: 'Jinja', at: [33.19, 0.43], dw: [-30, -38], dn: [-36, -24], flipW: 1, go: ['Trips to Uganda', '/trips'],
      p: 'Where the Nile begins. The river leaves Lake Victoria here and runs north, the length of the country.' },
    { nm: 'Lake Victoria', t: 'Lake Victoria', at: [32.85, -0.68], atN: [33.05, -0.3], skipN: 1,
      p: 'Africa’s largest lake, shared with Kenya and Tanzania.' },
    { nm: 'Equator', t: 'The equator', at: [31.15, 0], atN: [33.85, 0], f: ['0°', 'latitude'], skipN: 1,
      p: 'Uganda sits on the equator in East Africa.' },
    { nm: 'Kampala', t: 'Kampala', at: [32.58, 0.32], flipW: 1, f: ['Half', 'of Ugandans are under 18.'], go: ['Our approach', '/our-approach'],
      p: 'The capital. Uganda is about the size of Kansas, with about 15 times the people: 45.9 million in the May 2024 census.' },
    { nm: 'The church', t: 'The church', at: [33.05, 2.82], atN: [32.75, 1.2], go: ['Church partnership', '/church-partnership'],
      p: 'Christianity came to Uganda in the 1870s, and Ugandans have led the church there for well over a century.' },
  ];
  // phones: four stops in story order (the country, the place, the church, the work); lake and equator stay as map labels
  const SEQ_N = ['Kampala', 'Jinja', 'The church', 'Wanyange'].map(n => STOPS.find(sp => sp.nm === n));
  const seq = () => (L.wide ? STOPS : SEQ_N);
  const stopNo = sp => seq().indexOf(sp) + 1;

  /* ---------- relief, feathered so the flat map melts into the land around it ---------- */
  const rel = {};
  const feather = src => {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'destination-in';
    const fx = g.createLinearGradient(0, 0, c.width, 0); fx.addColorStop(0, 'rgba(0,0,0,0)'); fx.addColorStop(.12, '#000'); fx.addColorStop(.88, '#000'); fx.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fx; g.fillRect(0, 0, c.width, c.height);
    const fy = g.createLinearGradient(0, 0, 0, c.height); fy.addColorStop(0, 'rgba(0,0,0,0)'); fy.addColorStop(.12, '#000'); fy.addColorStop(.88, '#000'); fy.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fy; g.fillRect(0, 0, c.width, c.height);
    return c;
  };
  const RELIEF_OPTS = { dark: { flat: [37, 45, 49], hi: [128, 150, 158], lo: [15, 17, 19] }, light: undefined };
  const loadRelief = th => relief(th, RELIEF_OPTS[th]).then(c => { if (c) rel[th] = { raw: c, soft: feather(c) }; st && st.poke(); });

  /* ---------- palette per theme ---------- */
  const PAL = {
    light: { ocean0: '#EAF1F2', ocean1: '#C9D8DC', dot: '#34403F', grat: 'rgba(49,57,60,.10)', rim: '#68A9B9', shade: 'rgba(38,52,58,', flat: '#E7E5DF', halo: '#F7F7F7', uFill: .2 },
    dark: { ocean0: '#2C373C', ocean1: '#171B1D', dot: '#D2E0E3', grat: 'rgba(210,224,227,.08)', rim: '#68A9B9', shade: 'rgba(6,8,9,', flat: '#252D31', halo: '#1D2022', uFill: .28 },
  };
  const LIGHT = (() => { const l = [-0.55, 0.5, 0.67], n = Math.hypot(...l); return l.map(x => x / n); })();

  /* ---------- layout ---------- */
  const L = { wide: true, R0: 400, cx: 0, cy: 0, homeLam: U[0], homePhi: U[1], M: [0, 0], Rf: 1000, cb: 0, copyR: 0, bar: [0, 0, 0, 0], ux: 0, uy: 0 };
  const rel2 = el => { const h = hero.getBoundingClientRect(), r = el.getBoundingClientRect(); return [r.left - h.left, r.top - h.top, r.right - h.left, r.bottom - h.top]; };
  const measureBar = () => { L.bar = rel2(bar); STOPS.forEach(s => { s.bw = s.btn ? s.btn.offsetWidth : 30; }); };
  const layout = s => {
    const w = s.w, h = s.h, wide = w > 820;
    const hr = hero.getBoundingClientRect(), cta = hero.querySelector('.hero-cta').getBoundingClientRect();
    L.cb = cta.bottom - hr.top; L.wide = wide; L.copyR = hero.querySelector('.hero-copy p').getBoundingClientRect().right - hr.left;
    if (EX) L.cb = 58;               // full screen: only the Done button sits above the map
    hero.style.setProperty('--cb', Math.round(L.cb) + 'px'); hero.style.setProperty('--cr', Math.round(L.copyR) + 'px');
    let rect;
    if (wide) {
      L.R0 = Math.min(h * .6, w * .4); L.cx = w * .71; L.cy = h * .54; L.homeLam = U[0]; L.homePhi = U[1];
      const rx = Math.max(w * .5, L.copyR + 10); rect = { x: rx, y: h * .1, w: w * .96 - rx, h: h * .8 };
      L.ux = L.cx; L.uy = L.cy;
    } else {
      // phones: the whole globe sits in the band under the copy, so the visitor's own city and the full journey are in view
      const band = h - L.cb - 66;
      L.R0 = clamp(Math.min(w * .46, (band - 36) / 2), 70, 320);
      L.cx = w * .5; L.cy = L.cb + 18 + Math.max(L.R0, (band - 36) / 2); L.homeLam = U[0]; L.homePhi = U[1];
      L.ux = L.cx; L.uy = L.cy;
      const top = EX ? L.cb : Math.max(L.cb + 4, h * .45);
      rect = { x: 0, y: top, w, h: Math.max(140, h - top - (EX ? 150 : 40)) };
    }
    // phones get a closer survey around Kampala, Jinja and the lake; desktop frames all of Uganda
    const vf = wide ? Kit.fit(geo.UG_BOX, rect) : Kit.fit([31.6, -1.9, 35.0, 2.2], rect, 'cover');
    L.M = [vf.x(U[0]), vf.y(U[1])]; L.Rf = vf.k * R2D;
    measureBar();
    pan.x = pan.tx = pan.y = pan.ty = 0;
    cardDirty = true;
    STOPS.forEach(s => { const f = L.wide ? !!s.flipW : !!s.flipN; s.flip = f; s.el && s.el.classList.toggle('flip', f); s.x = s.y = -1e4; if (s.btn) s.btn.firstChild.textContent = stopNo(s) || ''; });
    renumber();
    if (rot.mode === 'journey') { const v = journeyView(J.camK); rot.lam = v[0]; rot.phi = v[1]; }
    else if (reduced() || rot.mode === 'rest') { rot.lam = L.homeLam; rot.phi = L.homePhi; rot.vl = rot.vp = 0; }
  };

  /* ---------- projection ---------- */
  const mat = (lc, pc) => { const l = lc * D2R, p = pc * D2R, sl = Math.sin(l), cl = Math.cos(l), sp = Math.sin(p), cp = Math.cos(p); return [-sl, cl, 0, -sp * cl, -sp * sl, cp, cp * cl, cp * sl, sp]; };
  const proj3 = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];

  // Filled ring: points on the far side are pushed out to the limb, which closes small shapes cleanly along the horizon.
  const ringPath = (ctx, f, c) => {
    const m = c.m, n = f.length / 3; let vis = 0;
    for (let i = 0; i < n; i++) if (m[6] * f[i * 3] + m[7] * f[i * 3 + 1] + m[8] * f[i * 3 + 2] > 0) { vis = 1; break; }
    if (!vis) return false;
    for (let i = 0; i < n; i++) {
      const x = f[i * 3], y = f[i * 3 + 1], z = f[i * 3 + 2];
      let X = m[0] * x + m[1] * y + m[2] * z, Y = m[3] * x + m[4] * y + m[5] * z; const Z = m[6] * x + m[7] * y + m[8] * z;
      if (Z < 0) { const l = Math.hypot(X, Y) || 1; X /= l; Y /= l; }
      const sx = c.cx + c.R * X, sy = c.cy - c.R * Y;
      i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
    }
    ctx.closePath(); return true;
  };
  // Stroked line: split exactly where it crosses the horizon, so nothing streaks across the disc.
  const linePath = (ctx, f, c, closed) => {
    const m = c.m, n = f.length / 3, cnt = closed ? n + 1 : n;
    let pX = 0, pY = 0, pZ = -1, pen = false;
    for (let j = 0; j < cnt; j++) {
      const i = j % n, x = f[i * 3], y = f[i * 3 + 1], z = f[i * 3 + 2];
      const X = m[0] * x + m[1] * y + m[2] * z, Y = m[3] * x + m[4] * y + m[5] * z, Z = m[6] * x + m[7] * y + m[8] * z;
      if (Z >= 0) {
        if (!pen) {
          if (j > 0) { const t = pZ / (pZ - Z); let hx = pX + (X - pX) * t, hy = pY + (Y - pY) * t; const l = Math.hypot(hx, hy) || 1; hx /= l; hy /= l; ctx.moveTo(c.cx + c.R * hx, c.cy - c.R * hy); ctx.lineTo(c.cx + c.R * X, c.cy - c.R * Y); }
          else ctx.moveTo(c.cx + c.R * X, c.cy - c.R * Y);
          pen = true;
        } else ctx.lineTo(c.cx + c.R * X, c.cy - c.R * Y);
      } else if (pen) { const t = pZ / (pZ - Z); let hx = pX + (X - pX) * t, hy = pY + (Y - pY) * t; const l = Math.hypot(hx, hy) || 1; hx /= l; hy /= l; ctx.lineTo(c.cx + c.R * hx, c.cy - c.R * hy); pen = false; }
      pX = X; pY = Y; pZ = Z;
    }
  };
  const P = (c, lon, lat) => { const p = proj3(c.m, V(lon, lat)); return [c.cx + c.R * p[0], c.cy - c.R * p[1], p[2]]; };
  const PV = (c, v) => { const p = proj3(c.m, v); return [c.cx + c.R * p[0], c.cy - c.R * p[1], p[2], p[0] * p[0] + p[1] * p[1]]; };
  // Local affine (Jacobian at the aim point): lets the flat relief raster ride on the sphere and become the flat map at the end.
  const affine = c => {
    const e = .02, p = P(c, U[0], U[1]), a = P(c, U[0] + e, U[1]), b = P(c, U[0], U[1] + e);
    const A = (a[0] - p[0]) / e, B = (a[1] - p[1]) / e, Cc = -(b[0] - p[0]) / e, Dd = -(b[1] - p[1]) / e;
    return { a: A, b: B, c: Cc, d: Dd, e: p[0] - A * U[0] - Cc * (-U[1]), f: p[1] - B * U[0] - Dd * (-U[1]), k: Math.sqrt(Math.abs(A * Dd - B * Cc)) };
  };

  /* ---------- motion state ---------- */
  const rot = { lam: U[0], phi: U[1], vl: 0, vp: 0, mode: 'rest', relT: 0, dT: 0 };
  let started = false, zoomTo = 0, zp = 0, zAnim = { t0: 0, from: 0, dur: 1 }, drag = null, st = null, cam = null;
  const pan = { x: 0, y: 0, tx: 0, ty: 0 };
  const up = { x: 0, y: 0, k: 1 };     // the visitor's own pan and pinch on the full-screen map
  let EX = false;                      // phones: full-screen explore mode
  let cardDirty = true;

  // The journey. Times in seconds from its start (journey clock only runs while the hero is on screen).
  const J = { phase: 'pending', t: 0, T: null, headP: 0, camK: 0, ripple0: -1, calm: 9, user: false, refocus: false };
  const plan = () => {
    const arcDur = O.close ? 1.1 : 2.4 + 0.8 * clamp(O.ang * R2D / 130);
    const T = { arc0: O.close ? .7 : .8 };
    T.arc1 = T.arc0 + arcDur; T.cam0 = T.arc0 + .15; T.cam1 = T.arc1 + .15;
    T.zoom0 = T.cam1 + .65; T.zoom1 = T.zoom0 + 2.1;
    J.T = T;
  };
  // camera centre that puts point F (on the way from the origin to Uganda) where Uganda sits at rest
  const journeyView = k => {
    const F = ll3(slerp(O.A, O.U, O.angU, k));
    return [wrap(F[0] + (L.homeLam - U[0])), clamp(F[1] + (L.homePhi - U[1]), -89, 89)];
  };
  const startJourney = () => {
    plan(); J.phase = 'run'; J.t = 0; J.headP = 0; J.camK = 0; J.ripple0 = -1; J.user = false; J.calm = 0;
    zoomTo = 0; zp = 0; setZoomUI(0); setLayer(false);
    pan.x = pan.y = pan.tx = pan.ty = 0;
    rot.mode = 'journey'; rot.vl = rot.vp = 0; const v = journeyView(0); rot.lam = v[0]; rot.phi = v[1];
    hero.classList.add('jr-busy');
  };
  const endJourney = () => {
    J.phase = 'done'; J.headP = 1; J.calm = 0; hero.classList.remove('jr-busy');
    if (rot.mode === 'journey') { rot.mode = 'rest'; rot.dT = 0; rot.vl = rot.vp = 0; }
    if (J.refocus && (document.activeElement === document.body || !document.activeElement)) { J.refocus = false; try { replayBtn.focus({ preventScroll: true }); } catch (_) { replayBtn.focus(); } }
  };
  const takeOver = () => {           // a drag or tap on the globe hands control to the visitor
    if (J.phase !== 'run' || J.user) return;
    J.user = true; hero.classList.remove('jr-busy');
    if (rot.mode === 'journey') { rot.mode = 'rest'; rot.dT = 0; }
  };
  const finalState = () => {         // reduced motion: straight to the map, learn layer open
    J.phase = 'done'; J.headP = 1; J.camK = 1; J.calm = 9; J.ripple0 = -1; hero.classList.remove('jr-busy');
    zoomTo = 1; zp = 1; setZoomUI(1);
    rot.mode = 'rest'; rot.lam = L.homeLam; rot.phi = L.homePhi; rot.vl = rot.vp = 0;
  };

  const target = () => [L.homeLam + 3.2 * Math.sin(rot.dT * TAU / 42), L.homePhi + 1.1 * Math.sin(rot.dT * TAU / 57)];
  const update = (t, dt) => {
    if (J.phase === 'run') {
      J.t += dt; const T = J.T, jt = J.t;
      if (!J.user) J.headP = ease(clamp((jt - T.arc0) / (T.arc1 - T.arc0)));
      else J.headP = Math.min(1, J.headP + dt * 1.4);
      if (rot.mode === 'journey') { J.camK = ease(clamp((jt - T.cam0) / (T.cam1 - T.cam0))); const v = journeyView(J.camK); rot.lam = v[0]; rot.phi = v[1]; }
      if (jt >= T.cam1 && J.ripple0 < 0) J.ripple0 = jt;
      if (jt >= T.cam1 && rot.mode === 'journey') { rot.mode = 'rest'; rot.dT = 0; rot.vl = rot.vp = 0; }
      if (!J.user && jt >= T.zoom0 && zoomTo === 0) startZoom(1, (T.zoom1 - T.zoom0) * 1000);
      if (zoomTo === 1 && zp >= 1) endJourney();
      else if (J.user && zoomTo === 0 && J.headP >= 1) endJourney();
    } else J.calm += dt;
    if (rot.mode === 'coast') {
      rot.lam += rot.vl * dt; rot.phi = clamp(rot.phi + rot.vp * dt, -80, 80);
      const f = Math.exp(-2.4 * dt); rot.vl *= f; rot.vp *= f; rot.relT += dt;
      if (rot.relT > 1.3) { rot.mode = 'rest'; rot.dT = 0; }
    } else if (rot.mode === 'rest') {
      rot.dT += dt;
      const [tl, tp] = target(), w = 2.1;
      rot.vl += (w * w * wrap(tl - rot.lam) - 2 * w * rot.vl) * dt; rot.vp += (w * w * (tp - rot.phi) - 2 * w * rot.vp) * dt;
      rot.lam += rot.vl * dt; rot.phi += rot.vp * dt;
    }
    rot.lam = wrap(rot.lam);
    if (zoomTo !== zp) { const k = clamp((now() - zAnim.t0) / zAnim.dur); zp = lerp(zAnim.from, zoomTo, k); }
    const kp = 1 - Math.exp(-5 * dt); pan.x += (pan.tx - pan.x) * kp; pan.y += (pan.ty - pan.y) * kp;
  };

  /* ---------- camera for this frame (globe -> flat map) ---------- */
  const camera = () => {
    const ez = ease(zp), er = ease(clamp(zp * 1.45)), ep = ease(clamp(zp * 1.12));
    const R = L.R0 * Math.pow(L.Rf * up.k / L.R0, ez);
    const lc = rot.lam + wrap(U[0] - rot.lam) * er, pc = rot.phi + (U[1] - rot.phi) * er;
    const m = mat(lc, pc), u = proj3(m, V(...U)), u0 = proj3(mat(rot.lam, rot.phi), V(...U));
    const S0 = [L.cx + L.R0 * u0[0], L.cy - L.R0 * u0[1]];
    const Sx = lerp(S0[0], L.M[0] + pan.x + up.x, ep), Sy = lerp(S0[1], L.M[1] + pan.y + up.y, ep);
    return { m, R, cx: Sx - R * u[0], cy: Sy + R * u[1], zp, flat: smooth(.42, .9, zp), dotsA: 1 - smooth(.32, .78, zp) };
  };

  /* ---------- drawing ---------- */
  const drawDots = (ctx, c, P2, s, alpha) => {
    const m = c.m, R = c.R, NB = 7, rmax = R * STEP * D2R * .41, w = s.w, h = s.h;
    const [lx, ly, lz] = LIGHT;
    for (let i = 0; i < ND; i++) {
      const x = DOTS[i * 3], y = DOTS[i * 3 + 1], z = DOTS[i * 3 + 2];
      const Z = m[6] * x + m[7] * y + m[8] * z;
      if (Z <= 0.0) { SB[i] = -1; continue; }
      const X = m[0] * x + m[1] * y + m[2] * z, Y = m[3] * x + m[4] * y + m[5] * z;
      const sx = c.cx + R * X, sy = c.cy - R * Y;
      if (sx < -rmax || sx > w + rmax || sy < -rmax || sy > h + rmax) { SB[i] = -1; continue; }
      const lit = smooth(-.3, .8, X * lx + Y * ly + Z * lz), limb = smooth(0, .5, Z);
      SX[i] = sx; SY[i] = sy; SB[i] = Math.min(NB - 1, ((.12 + .88 * lit) * (.35 + .65 * limb) * NB) | 0);
    }
    ctx.fillStyle = P2.dot;
    const small = rmax * s.dpr < 1.25;
    for (let b = 0; b < NB; b++) {
      const f = (b + 1) / NB, r = rmax * (.34 + .66 * f);
      ctx.globalAlpha = alpha * (.22 + .78 * f);
      ctx.beginPath();
      for (let i = 0; i < ND; i++) if (SB[i] === b) { if (small) ctx.rect(SX[i] - r, SY[i] - r, r * 2, r * 2); else { ctx.moveTo(SX[i] + r, SY[i]); ctx.arc(SX[i], SY[i], r, 0, TAU); } }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const label = (ctx, txt, x, y, font, fill, halo, align = 'left', hw = 4) => {
    ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    if (halo) { ctx.lineJoin = 'round'; ctx.lineWidth = hw; ctx.strokeStyle = halo; ctx.strokeText(txt, x, y); }
    ctx.fillStyle = fill; ctx.fillText(txt, x, y);
  };

  // A leader line from the point to two lines of text on a soft plate. minT/minS: strings that fix the plate width (no jitter while counting).
  const callout = (ctx, s, C, P2, pin, a, title, sub, dir, minT, minS) => {
    if (a <= .01) return;
    const big = L.wide ? 1 : .88, f1 = `600 ${Math.round(16 * big)}px ${FONT.body}`, f2 = `400 ${Math.round(13.5 * big)}px ${FONT.body}`;
    ctx.font = f1; const w1 = Math.max(ctx.measureText(title).width, minT ? ctx.measureText(minT).width : 0);
    ctx.font = f2; const w2 = Math.max(ctx.measureText(sub).width, minS ? ctx.measureText(minS).width : 0); const tw = Math.max(w1, w2) + 4;
    const L1 = L.wide ? 54 : (dir[1] > 0 && zp > .5 ? 52 : 38);
    const ex = pin[0] + dir[0] * L1, ey = pin[1] + dir[1] * L1;
    const right = dir[0] > 0;
    let x0 = right ? ex : ex - tw;
    x0 = clamp(x0, 14, s.w - 14 - tw);
    ctx.globalAlpha = a;
    const top = ey - 9 - 16 * big - 8, bot = ey + 18 * big + 10, bx = x0 - 10, bw = tw + 18;
    ctx.save(); ctx.shadowColor = rgba(P2.halo, .95); ctx.shadowBlur = 22; ctx.fillStyle = rgba(P2.halo, .8);
    rr(ctx, bx, top, bw, bot - top, 8); ctx.fill(); ctx.restore();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pin[0] + dir[0] * 9, pin[1] + dir[1] * 9); ctx.lineTo(ex, ey); ctx.lineTo(right ? x0 + tw : x0, ey); ctx.stroke();
    label(ctx, title, x0 + 2, ey - 9, f1, C.ink, null);
    label(ctx, sub, x0 + 2, ey + 18 * big, f2, C.body, null);
    ctx.globalAlpha = 1;
  };
  const tri = (ctx, x, y, r) => { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .95, y + r * .6); ctx.lineTo(x - r * .95, y + r * .6); ctx.closePath(); };

  let layerA = 0;
  const draw = (s, t, still) => {
    const ctx = s.ctx, C = colors(), th = theme(), P2 = PAL[th], c = camera(); cam = c;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.clearRect(0, 0, s.w, s.h);
    const { R, cx, cy } = c, ga = c.dotsA;
    const run = J.phase === 'run', jt = J.t, T = J.T || { arc0: 0, arc1: 0, cam1: 0 };

    // atmosphere: a soft lake-coloured halo hugging the limb
    if (ga > .01) {
      const g = ctx.createRadialGradient(cx, cy, R * .96, cx, cy, R * 1.16);
      g.addColorStop(0, rgba(P2.rim, (th === 'dark' ? .3 : .34) * ga)); g.addColorStop(.35, rgba(P2.rim, (th === 'dark' ? .1 : .12) * ga)); g.addColorStop(1, rgba(P2.rim, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.16, 0, TAU); ctx.fill();
    }
    // ocean
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const og = ctx.createRadialGradient(cx - R * .38, cy - R * .36, R * .05, cx, cy, R * 1.02);
    og.addColorStop(0, P2.ocean0); og.addColorStop(1, P2.ocean1);
    ctx.fillStyle = og; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    if (ga > .01) {
      ctx.globalAlpha = ga; ctx.strokeStyle = P2.grat; ctx.lineWidth = 1; ctx.beginPath();
      for (const g of GRAT) linePath(ctx, g, c, false);
      ctx.stroke(); ctx.globalAlpha = 1;
      drawDots(ctx, c, P2, s, ga);
    }
    // flat land fades in under the relief as the camera arrives
    const af = affine(c), r = rel[th];
    if (c.flat > .005) {
      ctx.globalAlpha = c.flat; ctx.fillStyle = P2.flat; ctx.fillRect(0, 0, s.w, s.h);
      if (r) { ctx.setTransform(af.a * s.dpr, af.b * s.dpr, af.c * s.dpr, af.d * s.dpr, af.e * s.dpr, af.f * s.dpr); const b = geo.bb; ctx.drawImage(r.soft, b[0], -b[3], b[2] - b[0], b[3] - b[1]); ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); }
      ctx.globalAlpha = c.flat * .9; ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); for (const n of NEIGH) linePath(ctx, n, c, true); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Uganda: real terrain clipped to its border, a warm wash, and the Sipi outline
    ctx.restore();
    ctx.save(); ctx.beginPath(); let ugVis = false; for (const u of UG) ugVis = ringPath(ctx, u, c) || ugVis;
    if (ugVis) {
      ctx.clip();
      if (r) { ctx.setTransform(af.a * s.dpr, af.b * s.dpr, af.c * s.dpr, af.d * s.dpr, af.e * s.dpr, af.f * s.dpr); const b = geo.bb; ctx.drawImage(r.raw, b[0], -b[3], b[2] - b[0], b[3] - b[1]); ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); }
      else { ctx.fillStyle = P2.flat; ctx.fillRect(0, 0, s.w, s.h); }
      ctx.fillStyle = rgba(C.sipi, lerp(P2.uFill, .07, c.flat)); ctx.fillRect(0, 0, s.w, s.h);
    }
    ctx.restore(); ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    // water
    ctx.fillStyle = C.lake; ctx.beginPath(); for (const l of LAKES) ringPath(ctx, l, c); ctx.fill('evenodd');
    const lw = clamp(R / 600, .8, 2.4);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (c.flat > .01) { ctx.globalAlpha = c.flat; ctx.strokeStyle = C.lake; ctx.lineWidth = 1.1; ctx.beginPath(); for (const rv of RIVERS) linePath(ctx, rv, c, false); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = C.lake; ctx.lineWidth = lw * 1.1; ctx.beginPath(); linePath(ctx, NILE, c, false); ctx.stroke();
    // the equator: a fine dashed survey line on the map
    if (c.flat > .01) {
      ctx.globalAlpha = c.flat * (th === 'dark' ? .55 : .5); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
      ctx.beginPath(); linePath(ctx, EQUATOR, c, false); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    if (ugVis) { ctx.strokeStyle = C.sipi; ctx.lineWidth = lerp(1.6, 2, c.flat); ctx.beginPath(); for (const u of UG) linePath(ctx, u, c, true); ctx.stroke(); }
    // terminator + rim light (globe only)
    if (ga > .01) {
      const sx = cx + LIGHT[0] * R * .9, sy = cy - LIGHT[1] * R * .9;
      const tg = ctx.createRadialGradient(sx, sy, R * .25, sx, sy, R * 2.1);
      tg.addColorStop(0, P2.shade + '0)'); tg.addColorStop(.42, P2.shade + '0)'); tg.addColorStop(.75, P2.shade + (th === 'dark' ? .5 : .26) * ga + ')'); tg.addColorStop(1, P2.shade + (th === 'dark' ? .72 : .42) * ga + ')');
      ctx.fillStyle = tg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      const rg = ctx.createRadialGradient(cx, cy, R * .82, cx, cy, R);
      rg.addColorStop(0, rgba(P2.rim, 0)); rg.addColorStop(1, rgba(P2.rim, (th === 'dark' ? .32 : .3) * ga));
      ctx.fillStyle = rg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }
    ctx.restore();

    // the visitor's city -> Jinja: a dotted great circle that draws itself, with a bright head
    let head = null;
    if (ga > .01 && O.arc.length) {
      const m = c.m, N = O.arc.length - 1, hp = still ? 1 : J.headP, nShow = hp * N;
      const ar = clamp(R / 480, .9, 1.5), halo = P2.halo;
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? C.sipi : halo;
        for (let i = 0; i <= Math.floor(nShow); i++) {
          const v = O.arc[i], X = m[0] * v[0] + m[1] * v[1] + m[2] * v[2], Y = m[3] * v[0] + m[4] * v[1] + m[5] * v[2], Z = m[6] * v[0] + m[7] * v[1] + m[8] * v[2];
          if (Z < 0 && X * X + Y * Y < 1) continue;           // hidden behind the globe
          const fade = Z < 0 ? .35 : .35 + .55 * smooth(0, .35, Z);
          ctx.globalAlpha = ga * fade * smooth(N + 1 - 5, N + 1 - 11, i) * (pass ? .95 : .7);
          ctx.beginPath(); ctx.arc(cx + R * X, cy - R * Y, pass ? ar : ar + 1.4, 0, TAU); ctx.fill();
        }
      }
      // the head: interpolated between arc samples
      if (hp > 0 && hp < 1) {
        const i0 = Math.floor(nShow), f = nShow - i0, a0 = O.arc[i0], a1 = O.arc[Math.min(N, i0 + 1)];
        const hv = [lerp(a0[0], a1[0], f), lerp(a0[1], a1[1], f), lerp(a0[2], a1[2], f)], hpnt = PV(c, hv);
        if (hpnt[2] > 0 || hpnt[3] >= 1) {
          head = hpnt;
          ctx.globalAlpha = ga; ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(hpnt[0], hpnt[1], 5.5, 0, TAU); ctx.fill();
          ctx.fillStyle = C.sipi; ctx.beginPath(); ctx.arc(hpnt[0], hpnt[1], 3.4, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      // the origin pin and its name
      if (!O.close || run) {
        const k = PV(c, O.A);
        if (k[2] > .05) {
          const a = ga * smooth(.05, .3, k[2]) * (run && !still ? smooth(0, .35, jt) : 1), kx = k[0], ky = k[1];
          ctx.globalAlpha = a; const kf = `500 ${L.wide ? 13.5 : 12.5}px ${FONT.body}`; ctx.font = kf; const kw = ctx.measureText(O.name).width;
          const lx = clamp(kx + 12, 10, s.w - kw - 18);
          ctx.save(); ctx.shadowColor = rgba(P2.halo, .95); ctx.shadowBlur = 16; ctx.fillStyle = rgba(P2.halo, .8); rr(ctx, lx - 8, ky + 5, kw + 16, 24, 6); ctx.fill(); ctx.restore();
          ctx.fillStyle = P2.halo; ctx.beginPath(); ctx.arc(kx, ky, 5, 0, TAU); ctx.fill();
          ctx.fillStyle = C.sipi; ctx.beginPath(); ctx.arc(kx, ky, 3.3, 0, TAU); ctx.fill();
          if (run && !still) { const f = smooth(0, .9, jt); ctx.strokeStyle = C.sipi; ctx.lineWidth = 1.3; ctx.globalAlpha = a * (1 - f) * .9; ctx.beginPath(); ctx.arc(kx, ky, 5 + f * 22, 0, TAU); ctx.stroke(); ctx.globalAlpha = a; }
          label(ctx, O.name, lx, ky + 21.5, kf, C.ink, null);
          ctx.globalAlpha = 1;
        }
      }
    }

    // flat map labels
    const LA = layerA;
    if (c.flat > .02) {
      const a = smooth(.65, 1, zp); ctx.globalAlpha = a;
      const halo = rgba(P2.halo, .8);
      for (const [n, lo, la] of COUNTRIES) { const p = P(c, lo, la); if (p[2] > 0 && p[0] > (L.wide ? L.copyR + 30 : 8) && p[0] < s.w - 8) label(ctx, n, p[0], p[1], `500 ${L.wide ? 13 : 11}px ${FONT.body}`, C.small, halo, 'center', 3); }
      for (const [n, lo, la, big] of WATER) {
        if (!L.wide && !big) continue;
        const p = P(c, lo, la);
        if (big && L.wide) ctx.globalAlpha = a * (1 - LA);
        label(ctx, n, p[0], p[1], `italic 400 ${big ? (L.wide ? 18 : 13) : 12}px ${FONT.display}`, big ? (th === 'dark' ? '#16323A' : '#FFFFFF') : (th === 'dark' ? '#9CCAD5' : C.deep), big ? null : halo, 'center', 3);
        ctx.globalAlpha = a;
      }
      for (const [n, lo, la] of PEAKS) {
        const p = P(c, lo, la), f = `italic 500 ${L.wide ? 12.5 : 11.5}px ${FONT.body}`; ctx.font = f; const tw = ctx.measureText(n).width;
        if (p[0] - 6 < (L.wide ? L.copyR + 24 : 6) || p[0] + 9 + tw > s.w - 8 || p[1] < (L.wide ? 70 : L.cb + 20) || p[1] > s.h - 10) continue;
        ctx.fillStyle = th === 'dark' ? '#C9C3B6' : '#5D5A52'; tri(ctx, p[0], p[1] - 1, 4.6); ctx.fill();
        label(ctx, n, p[0] + 8, p[1] + 3.5, f, C.body, halo, 'left', 3);
      }
      for (const tw of TOWNS) {
        if (!L.wide && !TOWNS_SMALL.includes(tw.n)) continue;
        const p = P(c, tw.lon, tw.lat); if (p[2] <= 0 || (L.wide && p[0] < L.copyR + 20)) continue;
        const left = LEFT_TOWNS.includes(tw.n);
        if (L.wide && left && p[0] - 90 < L.copyR) continue;
        if (!L.wide && (p[1] < L.cb + 24 || (left ? p[0] - 70 < 4 : p[0] + 70 > s.w - 4))) continue;
        const isStop = tw.n === 'Kampala';
        ctx.globalAlpha = a * (isStop && L.wide ? 1 - LA : 1);
        ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(p[0], p[1], tw.cap ? 3.2 : 2.4, 0, TAU); ctx.fill();
        const dx = isStop && !L.wide && STOPS[4].vis ? 7 + 12 * LA : 7;
        label(ctx, tw.n, p[0] + (left ? -dx : dx), p[1] + 4, `${tw.cap ? 600 : 500} ${L.wide ? (tw.cap ? 14 : 13) : 12}px ${FONT.body}`, C.ink, halo, left ? 'right' : 'left', 3);
        ctx.globalAlpha = a;
      }
      // equator name on phones (the marker there shows only its number)
      if (!L.wide) { const p = P(c, 34.9, 0); if (p[1] > L.cb + 20 && p[1] < s.h - 70) label(ctx, 'Equator', Math.min(s.w - 10, p[0]), p[1] - 6, `italic 500 11.5px ${FONT.body}`, C.body, halo, 'right', 3); }
      const ug = L.wide ? P(c, 33.35, 3.3) : P(c, 32.2, 1.55);
      if (L.wide || ug[1] > L.cb + 40) ctx.globalAlpha = a * .9; else ctx.globalAlpha = 0;
      label(ctx, 'Uganda', ug[0], ug[1], `700 ${L.wide ? 30 : 20}px ${FONT.display}`, C.ink, halo, 'center', 4);
      ctx.globalAlpha = 1;
    }

    // the pin: Jinja on the globe, Wanyange on the map
    const pinLL = [lerp(JINJA[0], WANY[0], c.flat), lerp(JINJA[1], WANY[1], c.flat)], pin = P(c, ...pinLL);
    if (pin[2] > 0) {
      const va = smooth(0, .2, pin[2]) * (pin[0] > -10 && pin[0] < s.w + 10 && pin[1] > -10 && pin[1] < s.h + 10 ? 1 : 0);
      ctx.strokeStyle = C.sipi; ctx.lineWidth = 1.5;
      const maxR = lerp(L.wide ? 30 : 24, L.wide ? 54 : 34, c.flat);
      if (run && !still) {                     // arrival: the pin ripples once
        if (J.ripple0 >= 0) for (let i = 0; i < 2; i++) { const f = (jt - J.ripple0 - i * .32) / 1.5; if (f > 0 && f < 1) { const e = 1 - Math.pow(1 - f, 2); ctx.globalAlpha = va * (1 - f) * .95; ctx.beginPath(); ctx.arc(pin[0], pin[1], 6 + e * maxR * 1.25, 0, TAU); ctx.stroke(); } }
      } else {
        const calm = still ? 1 : smooth(0, 1.6, J.calm);
        for (let i = 0; i < 2; i++) {
          const f = still ? (i ? .62 : .3) : (t * .28 + i / 2) % 1;
          ctx.globalAlpha = va * calm * (1 - f) * (still ? .55 : .8); ctx.beginPath(); ctx.arc(pin[0], pin[1], 6 + f * maxR, 0, TAU); ctx.stroke();
        }
      }
      ctx.globalAlpha = va;
      ctx.fillStyle = P2.halo; ctx.beginPath(); ctx.arc(pin[0], pin[1], 7, 0, TAU); ctx.fill();
      ctx.fillStyle = C.sipi; ctx.beginPath(); ctx.arc(pin[0], pin[1], 5, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      const dirG = L.wide ? [.72, -.72] : [.84, -.42];
      const zf = 1 - smooth(.04, .3, zp);
      // flight -> arrival: the counter rides with the head, then settles on Jinja
      const arrived = run && !still ? smooth(T.arc1 - .05, T.arc1 + .45, jt) : 1;
      const sub = O.close ? 'Where the Nile leaves Lake Victoria' : O.line;
      callout(ctx, s, C, P2, pin, va * zf * arrived, 'Jinja, Uganda', sub, dirG);
    }
    if (run && !still && head && !O.close) {
      const arrived = smooth(T.arc1 - .05, T.arc1 + .45, jt);
      if (arrived < 1) callout(ctx, s, C, P2, [head[0], head[1]], (1 - smooth(.04, .3, zp)) * (1 - arrived) * smooth(T.arc0 + .2, T.arc0 + .65, jt), dist(O.km * J.headP), `from ${O.name}`, L.wide ? [.72, -.72] : [.84, -.42], dist(O.km) + '0');
    }

    updateLayer(c, s, ctx, C, still);
  };

  /* ---------- learn layer (DOM markers + one card) ---------- */
  const learnEl = document.getElementById('learn'), card = document.getElementById('lcard');
  const cT = card.querySelector('.lc-t'), cP = card.querySelector('.lc-p'), cF = card.querySelector('.lc-f'), cN = card.querySelector('.lc-n'), cC = card.querySelector('.lc-c'), cNum = card.querySelector('.lc-num'), cX = card.querySelector('.lc-x');
  let layerOn = false, active = null, cardOpen = false, shownAt = 0, lastAct = 0, cardH = 0;
  const cGo = document.createElement('a'); cGo.className = 'lc-go off'; card.appendChild(cGo);
  const cNav = document.createElement('div'); cNav.className = 'lc-nav';
  cNav.innerHTML = '<button type="button" class="lc-prev" aria-label="Previous place"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="lc-count" aria-hidden="true"></span><button type="button" class="lc-next" aria-label="Next place"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  card.appendChild(cNav);
  const cCount = cNav.querySelector('.lc-count');
  const step = d => { const q = seq(), i = q.indexOf(active); pause(9); openStop(q[((i < 0 ? 0 : i + d) + q.length) % q.length], 'user'); };
  cNav.querySelector('.lc-prev').addEventListener('click', () => step(-1));
  cNav.querySelector('.lc-next').addEventListener('click', () => step(1));
  let swipe = null;                                   // phones: swipe the card sideways to move between places
  card.addEventListener('pointerdown', e => { swipe = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY }; }, { passive: true });
  card.addEventListener('pointerup', e => { if (!swipe) return; const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y; swipe = null; if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1); }, { passive: true });
  card.addEventListener('pointercancel', () => { swipe = null; }, { passive: true });
  function renumber() { if (active) fillCard(active); }
  STOPS.forEach((sp, i) => {
    const w = document.createElement('div'); w.className = 'lm off' + (sp.primary ? ' primary' : '');
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'lcard');
    b.innerHTML = `<span class="n" aria-hidden="true">${i + 1}</span><span class="nm">${sp.nm}</span>`;
    w.appendChild(b); learnEl.appendChild(w);
    Object.assign(sp, { el: w, btn: b, i, vis: false, x: -1e4, y: -1e4, bw: 30, rect: [0, 0, 0, 0] });
    b.addEventListener('click', () => { pause(9); openStop(sp, 'user'); });
    b.addEventListener('focus', () => { if (L.wide || EX) { pause(9); openStop(sp, 'user'); } });
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { pause(4); openStop(sp, 'user'); } });
  });
  const pause = extra => { lastAct = now() + (extra || 0) * 1000; };
  const visStops = () => STOPS.filter(sp => sp.vis);
  const setLayer = on => {
    if (on === layerOn) return;
    layerOn = on; learnEl.classList.toggle('on', on);
    if (on) { STOPS.forEach(sp => { sp.x = sp.y = -1e4; }); openStop(seq()[0], 'default'); }
    else closeCard();
  };
  const fillCard = sp => {
    cNum.textContent = stopNo(sp) || sp.i + 1; cT.textContent = sp.t; cP.innerHTML = sp.p;
    if (sp.go) { cGo.textContent = sp.go[0]; cGo.setAttribute('href', sp.go[1]); cGo.classList.remove('off'); } else cGo.classList.add('off');
    cCount.textContent = (stopNo(sp) || 1) + ' / ' + seq().length;
    if (sp.f) { cN.textContent = sp.f[0]; cC.textContent = sp.f[1]; cF.classList.remove('off'); } else cF.classList.add('off');
    card.classList.toggle('primary', !!sp.primary);
  };
  const openStop = (sp, how) => {
    if (!layerOn || !sp) return;
    // phones: the hero stays calm. Cards live in the full-screen map, which a tap on a marker opens.
    if (!L.wide && !EX) { if (how === 'user') enterExplore(sp); return; }
    card.setAttribute('aria-live', how === 'user' ? 'polite' : 'off');
    if (active !== sp) { if (active) active.btn.setAttribute('aria-expanded', 'false'); active = sp; sp.btn.setAttribute('aria-expanded', 'true'); fillCard(sp); }
    if (!cardOpen) { cardOpen = true; card.classList.add('on'); }
    shownAt = now(); cardDirty = true; st && st.poke();
  };
  const closeCard = () => {
    if (active) active.btn.setAttribute('aria-expanded', 'false');
    cardOpen = false; card.classList.remove('on'); active = null; cardDirty = true; st && st.poke();
  };
  cX.addEventListener('click', () => { pause(9); const was = active; closeCard(); if (was && was.vis) was.btn.focus({ preventScroll: true }); });

  // phones: the card docks at the bottom of the map, so pan the map to keep its marker in view above the card
  const computePan = () => {
    if (L.wide || !active || !st) { pan.tx = 0; pan.ty = 0; return; }
    const sh = st.s.h, sw = st.s.w, top = sh - 66 - cardH;
    const ax = active.x - pan.x, ay = active.y - pan.y;            // marker position without any pan
    const lo = L.cb + 34, hi = top - 26, want = lo > hi ? Math.max(L.cb + 22, (lo + hi) / 2) : lerp(lo, hi, .45);
    pan.ty = ay > hi || ay < lo ? want - ay : 0;
    pan.tx = ax < 34 ? 34 - ax : ax > sw - 34 ? sw - 34 - ax : 0;
    if (reduced()) { pan.x = pan.tx; pan.y = pan.ty; }
  };
  const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const placeCard = s => {
    if (!active || !cardOpen) return;
    if (!L.wide) { card.style.left = ''; card.style.top = ''; return; }
    const W = card.offsetWidth, H = card.offsetHeight, r = active.rect, cy = (r[1] + r[3]) / 2;
    const yMin = 76, yMax = Math.max(yMin, L.bar[1] - 14 - H);
    const xl = Math.min(L.copyR + 16, s.w - W - 12), xr = s.w - W - 12, mx = (r[0] + r[2]) / 2;
    const xs = [r[2] + 12, r[0] - 12 - W, r[0] - 8, mx - W / 2, r[2] + 8 - W, xl, xr], ys = [cy - 30, cy - H + 30, cy - H / 2, r[3] + 12, r[1] - 12 - H, r[1] - 44 - H, r[3] + 40];
    let best = null, bs = Infinity;
    for (const x0 of xs) for (const y0 of ys) {
      const x = clamp(x0, xl, xr), y = clamp(y0, yMin, yMax), box = [x, y, x + W, y + H];
      // stay close to the marker, never cover it, avoid the other markers and the controls
      const ccx = clamp(mx, x, x + W), ccy = clamp(cy, y, y + H);
      let sc = Math.hypot(ccx - mx, ccy - cy) * 1.2;
      sc += overlap(box, [r[0] - 8, r[1] - 8, r[2] + 8, r[3] + 8]) * 60 + overlap(box, L.bar) * 20;
      for (const o of STOPS) if (o !== active && o.vis) sc += overlap(box, [o.rect[0] - 8, o.rect[1] - 8, o.rect[2] + 8, o.rect[3] + 8]) * 10;
      if (sc < bs) { bs = sc; best = [x, y]; }
    }
    card.style.left = Math.round(best[0]) + 'px'; card.style.top = Math.round(best[1]) + 'px';
  };
  const updateLayer = (c, s, ctx, C, still) => {
    const want = zoomTo === 1 && zp >= .97 && J.phase !== 'run';
    if (want !== layerOn) setLayer(want);
    layerA = still ? (layerOn ? 1 : 0) : clamp(layerA + (layerOn ? .06 : -.12), 0, 1);
    if (!layerOn) { STOPS.forEach(sp => { if (sp.vis) { sp.vis = false; sp.el.classList.add('off'); } }); return; }
    if (cardOpen && cardDirty) cardH = card.offsetHeight;
    const docked = !L.wide && cardOpen, cardTop = s.h - 66 - (docked ? cardH : 0);
    let moved = false;
    for (const sp of STOPS) {
      const ll = (!L.wide && sp.atN) || sp.at, off = (L.wide ? sp.dw : sp.dn) || [0, 0];
      const p = P(c, ll[0], ll[1]), x = p[0] + off[0], y = p[1] + off[1];
      const bw = L.wide ? sp.bw : 28, hh = L.wide ? 13 : 14;
      const left = sp.flip ? x - bw + hh : x - hh, rect = [left, y - hh, left + bw, y + hh];
      let vis = p[2] > 0;
      if (!L.wide && sp.skipN) vis = false;
      if (L.wide) { if (rect[0] < L.copyR + 18 || rect[2] > s.w - 12 || rect[1] < 74 || rect[3] > s.h - 12 || overlap(rect, [L.bar[0] - 8, L.bar[1] - 8, L.bar[2] + 8, L.bar[3] + 8]) > 0) vis = false; }
      else {
        if (rect[1] < L.cb + (sp === active ? 2 : 14) || rect[0] < 6 || rect[2] > s.w - 6 || rect[3] > L.bar[1] - 8) vis = false;
        if (docked && sp !== active && rect[3] > cardTop - 6) vis = false;
      }
      sp.rect = rect; sp.ax = p[0]; sp.ay = p[1];
      if (vis !== sp.vis) { sp.vis = vis; sp.el.classList.toggle('off', !vis); }
      if (Math.abs(x - sp.x) > .25 || Math.abs(y - sp.y) > .25) {
        sp.x = x; sp.y = y; sp.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
        if (sp === active) moved = true;
      }
      // a hairline leader from the true spot to an offset marker
      if (vis && (off[0] || off[1])) {
        ctx.globalAlpha = layerA * .85; ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
        const d = Math.hypot(off[0], off[1]), ux = off[0] / d, uy = off[1] / d;
        ctx.beginPath(); ctx.moveTo(p[0] + ux * 4, p[1] + uy * 4); ctx.lineTo(x - ux * 13, y - uy * 13); ctx.stroke();
        ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    if (active && !active.vis && !docked) closeCard();
    if (cardOpen && cardDirty) computePan();
    if (cardOpen && (cardDirty || moved)) { cardDirty = false; placeCard(s); }
  };

  // slow auto-tour for touch and passive viewers: only when idle, never in reduced motion
  const tour = () => {
    if (!layerOn || reduced() || J.phase === 'run') return;
    const n = now();
    if (n - lastAct < 4000 || n - shownAt < 5600) return;
    if (learnEl.contains(document.activeElement) || card.contains(document.activeElement)) return;
    if (!L.wide && (!EX || up.x || up.y || up.k !== 1)) return;      // phones: only tour inside explore, and never once the visitor has moved the map
    const vs = L.wide ? visStops() : seq(); if (!vs.length) return;
    const i = active ? vs.indexOf(active) : -1;
    openStop(vs[(i + 1) % vs.length], 'tour');
  };

  /* ---------- run ---------- */
  st = stage(cv, {
    resize: s => { layout(s); },
    frame: (t, dt, s) => { started = true; if (J.phase === 'pending') startJourney(); update(t, dt); draw(s, t, false); tour(); },
    still: s => { draw(s, 3, true); },
  });
  setOrigin(detectOrigin());
  plan();
  if (reduced()) finalState();
  else { const v = journeyView(0); rot.lam = v[0]; rot.phi = v[1]; rot.mode = 'journey'; hero.classList.add('jr-busy'); }
  st.poke();
  loadRelief(theme());
  Kit.onTheme(th => loadRelief(th));
  fontsReady().then(() => { layout(st.s); st.poke(); });
  Kit.onReduced(r => {
    if (r) {
      if (J.phase !== 'done') finalState();
      else { rot.mode = 'rest'; rot.lam = L.homeLam; rot.phi = L.homePhi; rot.vl = rot.vp = 0; zp = zoomTo; }
      pan.x = pan.tx; pan.y = pan.ty; cv.style.opacity = '';
      st.poke();
    }
  });

  // a live site can plug in a real lookup: re-run the journey if it is still on the globe, else just relabel
  let lastEvt = null;
  const onOrigin = e => {
    if (!e || e === lastEvt) return; lastEvt = e;
    const o = valid(e.detail); if (!o) return;
    setOrigin(o);
    if (J.phase === 'run' && !J.user && zoomTo === 0) startJourney();
    else if (J.phase === 'pending' || (J.phase === 'run' && !J.user)) plan();
    st.poke();
  };
  addEventListener('ripples:origin', onOrigin); document.addEventListener('ripples:origin', onOrigin);

  /* ---------- phones: full-screen explore mode ---------- */
  const root = document.documentElement;
  const exBtn = document.createElement('button'); exBtn.type = 'button'; exBtn.className = 'jr-btn jr-explore-btn'; exBtn.setAttribute('aria-label', 'Explore the map full screen');
  exBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M11 3h4v4M7 15H3v-4M15 3l-5 5M3 15l5-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Explore</span>';
  bar.insertBefore(exBtn, btn);
  const doneBtn = document.createElement('button'); doneBtn.type = 'button'; doneBtn.className = 'jr-btn jr-done'; doneBtn.innerHTML = '<span>Done</span>';
  hero.appendChild(doneBtn);
  let spacer = null;
  function enterExplore(sp) {
    if (EX || L.wide) return;
    EX = true; up.x = up.y = 0; up.k = 1;
    spacer = document.createElement('div'); spacer.style.height = hero.offsetHeight + 'px'; spacer.setAttribute('aria-hidden', 'true');
    hero.parentNode.insertBefore(spacer, hero);
    document.body.appendChild(hero);                    // out of the page flow, so no ancestor can clip or stack over it
    hero.classList.add('jr-explore'); root.classList.add('jr-lock');
    if (J.phase === 'run') endJourney();
    requestAnimationFrame(() => { layout(st.s); cardDirty = true; if (layerOn) openStop(sp || seq()[0], sp ? 'user' : 'default'); st.poke(); try { doneBtn.focus({ preventScroll: true }); } catch (_) { /* older Safari */ } });
  }
  function exitExplore() {
    if (!EX) return;
    EX = false; up.x = up.y = 0; up.k = 1; closeCard();
    hero.classList.remove('jr-explore'); root.classList.remove('jr-lock');
    if (spacer && spacer.parentNode) { spacer.parentNode.insertBefore(hero, spacer); spacer.remove(); } spacer = null;
    requestAnimationFrame(() => { layout(st.s); st.poke(); try { exBtn.focus({ preventScroll: true }); } catch (_) { /* older Safari */ } });
  }
  exBtn.addEventListener('click', () => enterExplore());
  doneBtn.addEventListener('click', exitExplore);
  // a plain tap on the globe or map opens explore; inside it, drag pans the map and two fingers zoom it
  const pts = new Map(); let tap = null, pinch = null;
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    tap = pts.size === 1 ? { x: e.clientX, y: e.clientY, t: now(), id: e.pointerId } : null;
    if (EX && pts.size === 2 && zp >= .97) { const a = [...pts.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1, k: up.k }; }
  });
  cv.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const was = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (!EX || zp < .97) return;
    if (pinch && pts.size === 2) { const a = [...pts.values()]; up.k = clamp(pinch.k * Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) / pinch.d, .6, 3.2); }
    else if (pts.size === 1) { const lim = Math.max(st.s.w, st.s.h) * .9 * up.k; up.x = clamp(up.x + e.clientX - was[0], -lim, lim); up.y = clamp(up.y + e.clientY - was[1], -lim, lim); }
    pause(9); cardDirty = true; st.poke();
  });
  const tapEnd = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    const tp = tap; tap = null;
    if (e.type === 'pointerup' && tp && tp.id === e.pointerId && !EX && !L.wide && J.phase === 'done' && now() - tp.t < 350 && Math.hypot(e.clientX - tp.x, e.clientY - tp.y) < 9) enterExplore();
  };
  cv.addEventListener('pointerup', tapEnd); cv.addEventListener('pointercancel', tapEnd);

  /* ---------- drag to spin ---------- */
  const local = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  const onDisc = (x, y) => cam && zp === 0 && zoomTo === 0 && Math.hypot(x - cam.cx, y - cam.cy) < cam.R * 1.03;
  cv.addEventListener('pointerdown', e => {
    const [x, y] = local(e);
    if (J.phase === 'run' && cam && Math.hypot(x - cam.cx, y - cam.cy) < cam.R * 1.03) takeOver();
    if (!onDisc(x, y)) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: now(), touch: e.pointerType !== 'mouse' && e.pointerType !== 'pen' };
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* older Safari */ }
    rot.mode = 'drag'; rot.vl = rot.vp = 0; cv.style.cursor = 'grabbing';
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) { if (e.pointerType === 'mouse') { const [x, y] = local(e); cv.style.cursor = onDisc(x, y) ? 'grab' : ''; } return; }
    if (e.pointerId !== drag.id) return;
    const n = now(), dts = Math.max(.008, (n - drag.t) / 1000);
    const R = cam ? cam.R : L.R0, dx = e.clientX - drag.x, dy = drag.touch && !EX ? 0 : e.clientY - drag.y;
    const dl = -dx / R * R2D / Math.max(.45, Math.cos(rot.phi * D2R) * .6 + .4), dp = dy / R * R2D;
    rot.lam = wrap(rot.lam + dl); rot.phi = clamp(rot.phi + dp, -80, 80);
    rot.vl = lerp(rot.vl, dl / dts, .45); rot.vp = lerp(rot.vp, dp / dts, .45);
    drag.x = e.clientX; drag.y = e.clientY; drag.t = n;
    if (reduced()) st.poke();
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const idle = now() - drag.t; drag = null; cv.style.cursor = '';
    if (idle > 90) rot.vl = rot.vp = 0;
    rot.vl = clamp(rot.vl, -260, 260); rot.vp = clamp(rot.vp, -160, 160);
    rot.mode = reduced() ? 'held' : 'coast'; rot.relT = 0;
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  /* ---------- zoom toggle + replay ---------- */
  function setZoomUI(to) { btn.setAttribute('aria-pressed', to ? 'true' : 'false'); btnLabel.textContent = to ? 'Back to the globe' : 'Zoom to Uganda'; measureBar(); cardDirty = true; }
  function startZoom(to, dur) {
    zoomTo = to; zAnim = { t0: now(), from: zp, dur: dur || 2100 * Math.max(.35, Math.abs(to - zp)) };
    setZoomUI(to);
  }
  btn.addEventListener('click', () => {
    startZoom(zoomTo ? 0 : 1);
    drag = null; pan.tx = pan.ty = 0; up.x = up.y = 0; up.k = 1;
    if (J.phase === 'run') endJourney();
    if (rot.mode === 'journey' || rot.mode === 'drag') { rot.mode = 'rest'; rot.dT = 0; rot.vl = rot.vp = 0; }
    if (reduced()) { zp = zoomTo; pan.x = pan.y = 0; if (!zoomTo) { rot.mode = 'rest'; rot.lam = L.homeLam; rot.phi = L.homePhi; } st.poke(); }
    measureBar();
  });
  let replayTimer = 0;
  replayBtn.addEventListener('click', () => {
    if (reduced()) return;
    J.refocus = true; clearTimeout(replayTimer);
    setLayer(false); hero.classList.add('jr-busy'); cv.style.opacity = '0';
    replayTimer = setTimeout(() => { J.phase = 'pending'; startJourney(); cv.style.opacity = ''; st.poke(); }, 300);
  });

  /* ---------- keyboard, tap-away, idle tracking ---------- */
  learnEl.addEventListener('keydown', e => {
    const k = e.key, vs = visStops(), i = vs.findIndex(sp => sp.btn === document.activeElement);
    if (i < 0) return;
    let j = -1;
    if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % vs.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + vs.length) % vs.length;
    else if (k === 'Home') j = 0; else if (k === 'End') j = vs.length - 1;
    if (j >= 0) { e.preventDefault(); vs[j].btn.focus({ preventScroll: true }); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && cardOpen) { closeCard(); pause(3); }
    else if (e.key === 'Escape' && EX) exitExplore();
  });
  document.addEventListener('pointerdown', e => {
    if (!cardOpen) return;
    const tg = e.target;
    if (card.contains(tg) || learnEl.contains(tg) || bar.contains(tg)) return;
    if (EX) { pause(6); return; }                       // full screen: the card stays while the map is dragged
    pause(6); closeCard();
  }, { passive: true });
  hero.addEventListener('pointermove', () => { if (now() > lastAct) lastAct = now(); }, { passive: true });
  hero.addEventListener('pointerdown', () => pause(4), { passive: true });
  hero.addEventListener('wheel', () => { if (now() > lastAct) lastAct = now(); }, { passive: true });
})();
