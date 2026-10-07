const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Artifact = require('./models/Artifact');
const RecoveredObject = require('./models/RecoveredObject');
const Case = require('./models/Case');
const AuditLog = require('./models/AuditLog');

const sampleArtifacts = [
  {
    artifactId: 'NXD-1001',
    name: 'Chola Nataraja Bronze Statue',
    material: 'Bronze (Panchaloka)',
    era: '10th Century CE (Chola Dynasty)',
    region: 'Thanjavur, Tamil Nadu',
    dimensions: '112 cm x 85 cm x 30 cm',
    inscriptionText: 'Dedicated to Kapaleeshwarar Temple by Queen Sembiyan Mahadevi',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Chola_bronze_Nataraja_Tamil_Nadu_11th_century.jpg/640px-Chola_bronze_Nataraja_Tamil_Nadu_11th_century.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Consecrated at Temple', date: '985 CE', location: 'Thanjavur, Tamil Nadu', note: 'Recorded in temple stone inscriptions' },
      { event: 'Logged in National Registry', date: '2021-03-15', location: 'ASI Chennai Circle', note: 'Digital 3D mesh scanning completed' }
    ],
    status: 'stolen',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1002',
    name: 'Pashupati Seal of Mohenjo-Daro',
    material: 'Steatite Stone',
    era: '2500 BCE (Harappan / Indus Valley)',
    region: 'Sindh / ASI National Museum',
    dimensions: '3.4 cm x 3.4 cm x 1.4 cm',
    inscriptionText: 'Standard Indus Script symbols (5 glyphs)',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Pashupati_seal.jpg/640px-Pashupati_seal.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Excavated', date: '1928', location: 'Mohenjo-daro site', note: 'Discovered during John Marshall expedition' }
    ],
    status: 'registered',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1003',
    name: 'Seated Buddha of Gandhara',
    material: 'Schist Stone',
    era: '2nd Century CE (Kushan Period)',
    region: 'Taxila, Gandhara Region',
    dimensions: '90 cm x 60 cm x 25 cm',
    inscriptionText: 'Kharosthi script donor inscription at pedestal base',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Seated_Buddha_from_Gandhara.jpg/640px-Seated_Buddha_from_Gandhara.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Museum Acquisition', date: '1954', location: 'New Delhi National Museum', note: 'Catalog ID NM-4872' }
    ],
    status: 'match_pending',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1004',
    name: 'Hoysala Dancing Saraswati Idol',
    material: 'Chloritic Schist (Soapstone)',
    era: '12th Century CE (Hoysala Dynasty)',
    region: 'Halebidu, Karnataka',
    dimensions: '145 cm x 70 cm x 40 cm',
    inscriptionText: 'Signed by master sculptor Dasoja of Balligavi',
    images: [
      { url: 'http://localhost:8000/api/heritage/images/01_Madanika_at_Chennakeshava_Temple.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Temple Installation', date: '1121 CE', location: 'Hoysaleswara Temple', note: 'Commissioned by King Vishnuvardhana' }
    ],
    status: 'verified',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1005',
    name: 'Gupta Gold Coin of Samudragupta',
    material: 'Gold (Dinara)',
    era: '350 CE (Gupta Empire)',
    region: 'Pataliputra, Bihar',
    dimensions: '2.1 cm diameter, 7.8 grams',
    inscriptionText: 'Sanskrit Brahmi legend: Lyrist Type (Apratirathah)',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/SamudraguptaCoinLyristType.jpg/640px-SamudraguptaCoinLyristType.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Hoard Discovery', date: '1946', location: 'Bayana, Rajasthan', note: 'Part of historic Bayana hoard discovery' }
    ],
    status: 'registered',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1006',
    name: 'Chambo Mahadeva Bronze Idol',
    material: 'Panchaloka Metal',
    era: '11th Century CE',
    region: 'Nagapattinam, Tamil Nadu',
    dimensions: '78 cm x 45 cm',
    inscriptionText: 'Tamil grantha script detailing ritual offerings',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Chola_Bronze_Shiva.jpg/640px-Chola_Bronze_Shiva.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Stolen from shrine', date: '1982', location: 'Nagapattinam', note: 'FIR registered with TN Police Idol Wing' }
    ],
    status: 'stolen',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1007',
    name: 'Sanchi Stupa Gateway Bracket (Shalabhanjika)',
    material: 'Sandstone',
    era: '1st Century BCE (Satavahana Dynasty)',
    region: 'Sanchi, Madhya Pradesh',
    dimensions: '82 cm x 38 cm',
    inscriptionText: 'Ivory carvers of Vidisha guild inscription',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Sanchi_Stupa_No.1_Torana_Yakshini_East_Gateway.jpg/640px-Sanchi_Stupa_No.1_Torana_Yakshini_East_Gateway.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'ASI Conservation', date: '1919', location: 'Sanchi Museum', note: 'Restored under Sir John Marshall' }
    ],
    status: 'registered',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1008',
    name: 'Pala Dynasty Tara Sculpture',
    material: 'Black Basalt Stone',
    era: '9th Century CE (Pala Empire)',
    region: 'Nalanda, Bihar',
    dimensions: '105 cm x 52 cm',
    inscriptionText: 'Buddhist creed formula in Siddhamatrika script',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Pala_statue_of_Tara_Nalanda.jpg/640px-Pala_statue_of_Tara_Nalanda.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Repatriated from UK', date: '2023-08-15', location: 'ASI New Delhi', note: 'Successfully recovered via INTERPOL notice' }
    ],
    status: 'repatriating',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1009',
    name: 'Vijayanagara Krishna Balalila Bronze',
    material: 'Bronze',
    era: '15th Century CE (Vijayanagara)',
    region: 'Hampi, Karnataka',
    dimensions: '42 cm x 28 cm',
    inscriptionText: 'Kannada royal stamp on base',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Krishna_as_a_Butter_Thief_Bronze.jpg/640px-Krishna_as_a_Butter_Thief_Bronze.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Returned to Temple', date: '2024-01-10', location: 'Virupaksha Temple Complex', note: 'Formally returned and re-consecrated' }
    ],
    status: 'returned',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1010',
    name: 'Mathura Standing Yaksha',
    material: 'Red Spotted Sandstone',
    era: '1st Century CE (Kushan Dynasty)',
    region: 'Mathura, Uttar Pradesh',
    dimensions: '160 cm x 55 cm',
    inscriptionText: 'Brahmi donor inscription of King Kanishka era',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Parkham_Yaksha_Mathura_Museum.jpg/640px-Parkham_Yaksha_Mathura_Museum.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Archaeological Survey', date: '1962', location: 'Mathura Government Museum', note: 'Cataloged as MM-104' }
    ],
    status: 'registered',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1011',
    name: 'Khajuraho Apsara Celestial Musician',
    material: 'Sandstone',
    era: '11th Century CE (Chandela Dynasty)',
    region: 'Khajuraho, Madhya Pradesh',
    dimensions: '95 cm x 40 cm',
    inscriptionText: 'Architectural mason mark #44',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Apsara_Khajuraho_Museum.jpg/640px-Apsara_Khajuraho_Museum.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Registered with ASI', date: '2020-05-12', location: 'ASI Bhopal Circle', note: 'High resolution photogrammetry complete' }
    ],
    status: 'registered',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1012',
    name: 'Indus Valley Terracotta Mother Goddess',
    material: 'Terracotta',
    era: '2300 BCE (Harappan)',
    region: 'Kalibangan, Rajasthan',
    dimensions: '18 cm x 7 cm',
    inscriptionText: 'Traces of red ochre pigment',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Mother_goddess_Mohenjo-daro.jpg/640px-Mother_goddess_Mohenjo-daro.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Excavation', date: '1968', location: 'ASI Excavation Site', note: 'Found in Trench B-4' }
    ],
    status: 'registered',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1013',
    name: 'Chola Sambandar Child Saint Statue',
    material: 'Bronze',
    era: '12th Century CE',
    region: 'Sirkazhi, Tamil Nadu',
    dimensions: '65 cm x 30 cm',
    inscriptionText: 'Tamil inscription mentioning Chola royal guild',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Sambandar_Chola_Bronze_Met.jpg/640px-Sambandar_Chola_Bronze_Met.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Reported Missing', date: '2018-09-04', location: 'Sirkazhi Temple', note: 'Stolen during night break-in' }
    ],
    status: 'stolen',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1014',
    name: 'Kashmir Bronze Avalokiteshvara',
    material: 'Brass alloy with Silver inlay',
    era: '8th Century CE (Karkota Dynasty)',
    region: 'Srinagar, Kashmir',
    dimensions: '38 cm x 20 cm',
    inscriptionText: 'Sharada script inscription on throne reverse',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Avalokiteshvara_Kashmir_bronze_8th_century.jpg/640px-Avalokiteshvara_Kashmir_bronze_8th_century.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Private Collection Heritage Register', date: '2019-11-20', location: 'Srinagar Museum', note: 'Verified by ASI Expert Panel' }
    ],
    status: 'registered',
    isHeritageImage: true
  },
  {
    artifactId: 'NXD-1015',
    name: 'Surya Sun God Relief Panel',
    material: 'Black Granite',
    era: '13th Century CE (Eastern Ganga Dynasty)',
    region: 'Konark, Odisha',
    dimensions: '130 cm x 80 cm',
    inscriptionText: 'Odia Brahmi label inscription',
    images: [
      { url: 'http://localhost:8000/api/heritage/images/12th-century_Surya_at_Shaivism_Hindu_temple_Hoysaleswara_arts_Halebidu_Karnataka_India.jpg', angle: 'front' }
    ],
    provenance: [
      { event: 'Preserved at Site Museum', date: '1950', location: 'Konark Archaeological Museum', note: 'Original temple niche sculpture' }
    ],
    status: 'registered',
    isHeritageImage: true
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexdata';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Artifact.deleteMany({});
    await RecoveredObject.deleteMany({});
    await Case.deleteMany({});
    await AuditLog.deleteMany({});

    const passwordHash = await bcrypt.hash('Pass@123', 10);
    const adminHash = await bcrypt.hash('Admin@123', 10);

    const admin = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'admin@nexdata.gov.in',
      passwordHash: adminHash,
      role: 'admin',
      organization: 'Archaeological Survey of India (ASI) HQ',
      status: 'approved'
    });

    const custodian = await User.create({
      name: 'Thiru R. Swaminathan',
      email: 'custodian@chola.org',
      passwordHash,
      role: 'custodian',
      organization: 'Thanjavur Temple Heritage Trust',
      status: 'approved'
    });

    const authority = await User.create({
      name: 'Inspector Vikram Rathore',
      email: 'authority@asi.gov.in',
      passwordHash,
      role: 'authority',
      organization: 'TN Police Idol Wing & ASI Special Recovery Cell',
      status: 'approved'
    });

    const expert = await User.create({
      name: 'Prof. Ananya Sen',
      email: 'expert@heritage.in',
      passwordHash,
      role: 'expert',
      organization: 'National Museum Institute of Art History',
      status: 'approved'
    });

    const pendingUser = await User.create({
      name: 'Suresh Kumar',
      email: 'pending@museum.org',
      passwordHash,
      role: 'custodian',
      organization: 'Mysore Palace Museum Trust',
      status: 'pending'
    });

    console.log('Created Seed Users:');
    console.log(' Admin: admin@nexdata.gov.in / Admin@123');
    console.log(' Custodian: custodian@chola.org / Pass@123');
    console.log(' Authority: authority@asi.gov.in / Pass@123');
    console.log(' Expert: expert@heritage.in / Pass@123');
    console.log(' Pending: pending@museum.org / Pass@123');

    // Insert artifacts assigned to custodian
    const artifactDocs = [];
    for (const item of sampleArtifacts) {
      const art = await Artifact.create({
        ...item,
        isHeritageImage: item.isHeritageImage !== undefined ? item.isHeritageImage : true,
        ownerId: custodian._id,
        history: [
          {
            status: item.status,
            changedBy: custodian._id,
            at: new Date(),
            note: `Initial seed state: ${item.status}`
          }
        ]
      });
      artifactDocs.push(art);
    }
    console.log(`Seeded ${artifactDocs.length} Indian antiquities artifacts.`);

    // Note: No fake or sample recovery cases are preloaded. Global Registry starts empty.

    // Seed initial Audit Logs
    await AuditLog.create({
      userId: admin._id,
      action: 'SYSTEM_INITIALIZATION',
      targetId: 'SYSTEM',
      at: new Date()
    });

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedDB();
