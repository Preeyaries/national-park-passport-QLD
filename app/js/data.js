// Park, region and secret stamp data. Edit this file to add parks or events.
const REGIONS = [
  {id:'seq', name:'South East Queensland', ink:1, events:[['Sat mornings','Ranger-guided rainforest walk'],['School holidays','Junior ranger activity day']]},
  {id:'sqc', name:'Southern Queensland Country', ink:2, events:[['Spring','Wildflower walk with a local guide'],['Winter','Night sky talk at the campground']]},
  {id:'fcb', name:'Fraser Coast and Bundaberg', ink:3, events:[['Jul to Oct','Whale watching cruise from the marina'],['Nov to Mar','Evening turtle talk']]},
  {id:'cq',  name:'Central Queensland', ink:4, events:[['Dry season','Guided rock art walk'],['Monthly','Volunteer track care day']]},
  {id:'mw',  name:'Mackay and Whitsundays', ink:5, events:[['Daily at dawn','Wallaby viewing with a ranger'],['Weekends','Guided snorkel trip']]},
  {id:'tsv', name:'Townsville and North', ink:6, events:[['Sundays','Community bird count'],['Dry season','Guided island walk']]},
  {id:'tnq', name:'Tropical North and Cape York', ink:7, events:[['Daily','Cultural walk with a Traditional Owner guide'],['Evenings','Night spotlighting tour']]},
  {id:'out', name:'Outback Queensland', ink:8, events:[['Dry season','Campfire talk with a ranger'],['New moon','Stargazing night']]}
];

// [region, id, name, stamp label, nearest town, activities, secret]
const RAW = [
 ['seq','lamington','Lamington','LAMINGTON','Canungra',['Walk the Tree Top Walk at Green Mountains','Hike part of the Border Track','Look for Antarctic beech trees']],
 ['seq','springbrook','Springbrook','SPRINGBROOK','Mudgeeraba',['Stand at Best of All Lookout','Walk the Twin Falls circuit','See glow-worms at Natural Bridge after dark'],{n:'Glow-worm Night',h:'Something here only shines after dark.',a:2}],
 ['seq','tamborine','Tamborine','TAMBORINE','Tamborine Mountain',['Walk to Curtis Falls','Walk the Witches Falls circuit']],
 ['seq','burleigh','Burleigh Head','BURLEIGH HEAD','Burleigh Heads',['Walk the Oceanview track','Watch the surf from Tumgun Lookout']],
 ['seq','mainrange','Main Range','MAIN RANGE','Boonah',['Walk to Queen Mary Falls','Stop at Cunninghams Gap']],
 ['seq','barney','Mount Barney','MOUNT BARNEY','Rathdowney',['Walk to Lower Portals','Climb toward the summit with an experienced group']],
 ['seq','daguilar',"D'Aguilar","D'AGUILAR",'The Gap, Brisbane',['Visit Walkabout Creek Discovery Centre','Take in the view at Jollys Lookout']],
 ['seq','glasshouse','Glass House Mountains','GLASS HOUSE MTNS','Glass House Mountains',['Climb Mount Ngungun','Photograph the peaks from the lookout']],
 ['seq','noosa','Noosa','NOOSA','Noosa Heads',["Walk the Coastal Walk to Hell's Gates",'Look for koalas near Tea Tree Bay']],
 ['seq','kondalilla','Kondalilla','KONDALILLA','Montville',['Walk the Kondalilla Falls circuit','Swim in the rock pool above the falls']],
 ['seq','moreton','Gheebulum Kunungai (Moreton Island)','MORETON ISLAND','Ferry from Brisbane',['Sandboard at The Desert','Walk to Cape Moreton lighthouse']],
 ['seq','naree','Naree Budjong Djara','NAREE BUDJONG DJARA','Dunwich, North Stradbroke Island',['Walk to Kaboora (Blue Lake)']],

 ['sqc','girraween','Girraween','GIRRAWEEN','Stanthorpe',['Climb The Pyramid','See the Granite Arch'],{n:'Wildflower Season',h:'Girraween means place of flowers. Come when they bloom.',m:[8,9,10]}],
 ['sqc','bunya','Bunya Mountains','BUNYA MOUNTAINS','Kingaroy',['Walk the Scenic Circuit among bunya pines','Watch wallabies at Dandabah'],{n:'Bunya Nut Season',h:'Visit when the giant cones fall.',m:[1,2,3]}],
 ['sqc','sundown','Sundown','SUNDOWN','Stanthorpe',['Camp by the Severn River','Walk to the Permanent Waterhole']],
 ['sqc','crowsnest','Crows Nest','CROWS NEST','Crows Nest',['Walk to Crows Nest Falls lookout','Look into the Valley of Diamonds']],

 ['fcb','kgari',"Great Sandy (K'gari)","K'GARI",'Hervey Bay',['Swim at Boorangoora (Lake McKenzie)','Drive 75 Mile Beach','See the Maheno shipwreck'],{n:'Whale Season',h:'Humpbacks rest in these waters for part of the year.',m:[7,8,9,10]}],
 ['fcb','cooloola','Great Sandy (Cooloola)','COOLOOLA','Rainbow Beach',['Walk to the Carlo Sandblow','Paddle the upper Noosa River']],
 ['fcb','burrum','Burrum Coast','BURRUM COAST','Woodgate',['Camp at Burrum Point','Walk the Banksia track']],
 ['fcb','deepwater','Deepwater','DEEPWATER','Agnes Water',['Walk the beach at Wreck Rock'],{n:'Turtle Season',h:'Visit in the months when turtles nest and hatch.',m:[11,12,1,2,3]}],
 ['fcb','eurimbula','Eurimbula','EURIMBULA','Seventeen Seventy',['Climb to Ganoonga Noonga lookout','Camp at Bustard Beach']],

 ['cq','carnarvon','Carnarvon','CARNARVON','Rolleston',['Walk to the Art Gallery rock art site','Cool off in the Moss Garden','Enter the Amphitheatre']],
 ['cq','blackdown','Blackdown Tableland','BLACKDOWN TABLELAND','Dingo',['Walk to Gudda Gumoo (Rainbow Waters)','Stop at Yaddamen Dhina lookout']],
 ['cq','byfield','Byfield','BYFIELD','Yeppoon',['Drive the sand track to Five Rocks','Walk to Stockyard Point lookout']],
 ['cq','capcays','Capricornia Cays','CAPRICORNIA CAYS','Gladstone',['Snorkel the reef at Lady Musgrave Island','Camp overnight on a coral cay'],{n:'Coral Cay Camper',h:'Stay after the day boats leave.',a:1}],
 ['cq','cania','Cania Gorge','CANIA GORGE','Monto',['Walk to Dripping Rock and The Overhang','Climb to Giants Chair lookout']],
 ['cq','expedition','Expedition','EXPEDITION','Taroom',['Look into Robinson Gorge']],

 ['mw','eungella','Eungella','EUNGELLA','Mackay',['Spot a platypus at Broken River','Walk the Sky Window circuit'],{n:'Platypus Spotter',h:'Be patient by the river at dawn or dusk.',a:0}],
 ['mw','whitsunday','Whitsunday Islands','WHITSUNDAY ISLANDS','Airlie Beach',['Walk to Hill Inlet lookout','Stand on Whitehaven Beach']],
 ['mw','hillsborough','Cape Hillsborough','CAPE HILLSBOROUGH','Mackay',['Watch wallabies on the beach at sunrise','Walk the Andrews Point track'],{n:'Dawn Wallabies',h:'The beach has visitors before breakfast.',a:0}],
 ['mw','conway','Conway','CONWAY','Airlie Beach',['Climb to Mount Rooper lookout','Walk to Coral Beach']],

 ['tsv','magnetic','Magnetic Island','MAGNETIC ISLAND','Townsville',['Do the Forts Walk and look for koalas','Snorkel at Arthur Bay']],
 ['tsv','paluma','Paluma Range','PALUMA RANGE','Paluma',['Swim at Little Crystal Creek','Visit Jourama Falls']],
 ['tsv','bowling','Bowling Green Bay','BOWLING GREEN BAY','Townsville',['Swim at Alligator Creek']],
 ['tsv','girringun','Girringun','GIRRINGUN','Ingham',['Stand at the Wallaman Falls lookout','Walk down to the base of the falls'],{n:'Wet Season Thunder',h:'The tallest single-drop waterfall in Australia is loudest after rain.',m:[1,2,3,4]}],
 ['tsv','hinchinbrook','Hinchinbrook Island','HINCHINBROOK ISLAND','Cardwell',['Hike a section of the Thorsborne Trail','Swim at Zoe Falls']],

 ['tnq','daintree','Daintree','DAINTREE','Mossman',['Walk Mossman Gorge','Reach the beach at Cape Tribulation','Walk the Dubuji boardwalk']],
 ['tnq','wooroonooran','Wooroonooran','WOOROONOORAN','Innisfail',['Swim at Josephine Falls','Walk the Mamu Tropical Skywalk']],
 ['tnq','barron','Barron Gorge','BARRON GORGE','Kuranda',['View Barron Falls from Din Din lookout'],{n:'Falls in Flood',h:'Come when the wet season fills the gorge.',m:[1,2,3]}],
 ['tnq','chillagoe','Chillagoe-Mungana Caves','CHILLAGOE CAVES','Chillagoe',['Take a ranger-guided cave tour','See Balancing Rock']],
 ['tnq','undara','Undara Volcanic','UNDARA VOLCANIC','Mount Surprise',['Walk through a lava tube on a guided tour','Walk the Kalkani Crater rim']],
 ['tnq','rinyirru','Rinyirru (Lakefield)','RINYIRRU','Laura',['Camp beside a lagoon','Birdwatch at Red Lily Lagoon']],
 ['tnq','kutini','Kutini-Payamu (Iron Range)','KUTINI-PAYAMU','Lockhart River',['Look for eclectus parrots in the rainforest','Camp at Chilli Beach']],

 ['out','boodjamulla','Boodjamulla (Lawn Hill)','BOODJAMULLA','Gregory',['Canoe Lawn Hill Gorge','Walk to Indarri Falls']],
 ['out','porcupine','Porcupine Gorge','PORCUPINE GORGE','Hughenden',['Walk down to The Pyramid']],
 ['out','bladensburg','Bladensburg','BLADENSBURG','Winton',['Drive the Route of the River Gums','Stop at Scrammy Gorge lookout']],
 ['out','diamantina','Diamantina','DIAMANTINA','Boulia',['Drive the Warracoota circuit','Watch sunset from Janets Leap']],
 ['out','munga','Munga-Thirri','MUNGA-THIRRI','Birdsville',['Cross the dunes on the QAA Line (park closes over summer)']],
 ['out','currawinya','Currawinya','CURRAWINYA','Hungerford',['Visit Lake Wyara and Lake Numalla','See The Granites']],
 ['out','welford','Welford','WELFORD','Jundah',['Drive the Desert Drive to the red dunes']]
];
const PARKS = RAW.map(r => ({region:r[0], id:r[1], name:r[2], label:r[3], town:r[4], acts:r[5], secret:r[6]||null}));
const parkById = Object.fromEntries(PARKS.map(p => [p.id, p]));
const regionById = Object.fromEntries(REGIONS.map(r => [r.id, r]));

const GLOBAL_SECRETS = [
  {id:'g-first', n:'First Ink', h:'Collect your first stamp.', test:v => v.length >= 1},
  {id:'g-five', n:'Five Parks', h:'Collect five park stamps.', test:v => v.length >= 5},
  {id:'g-ten', n:'Explorer', h:'Stamp 10 parks.', test:v => v.length >= 10},
  {id:'g-25', n:'Trailblazer', h:'Stamp 25 parks.', test:v => v.length >= 25},
  {id:'g-all', n:'Grand Traveller', h:'Stamp every park in the passport.', test:v => v.length >= PARKS.length},
  {id:'g-three', n:'Three Regions', h:'Collect stamps in three different regions.', test:v => new Set(v.map(p => p.region)).size >= 3},
  {id:'g-page', n:'Full Page', h:'Stamp every park on one region page.', test:v => REGIONS.some(r => PARKS.filter(p => p.region === r.id).every(p => v.includes(p)))},
  {id:'g-reef', n:'Reef to Red Dirt', h:'Stamp one park in the Whitsundays and one in the Outback.', test:v => v.some(p => p.region === 'mw') && v.some(p => p.region === 'out')}
];

// Real park photos for the left page. Map a park id to an image path, for example { lamington: 'images/lamington.jpg' }.
// Parks without an entry show a drawn placeholder.
const PHOTOS = {};

// When true, parks without an entry in PHOTOS load their lead photo from the English Wikipedia article at run time.
// Needs an internet connection. Photo credits and licences are shown under each picture.
const USE_WIKIPEDIA_PHOTOS = true;
// Wikipedia article titles that differ from "<park name> National Park".
const WIKI = {
  moreton:'Moreton Island National Park', naree:'Naree Budjong Djara National Park',
  kgari:'Great Sandy National Park', cooloola:'Cooloola Recreation Area'
};
