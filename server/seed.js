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
      { url: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80', angle: 'front' },
      { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', angle: 'back' }
    ],
    provenance: [
      { event: 'Consecrated at Temple', date: '985 CE', location: 'Thanjavur, Tamil Nadu', note: 'Recorded in temple stone inscriptions' },
      { event: 'Logged in National Registry', date: '2021-03-15', location: 'ASI Chennai Circle', note: 'Digital 3D mesh scanning completed' }
    ],
    status: 'stolen'
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
      { url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Excavated', date: '1928', location: 'Mohenjo-daro site', note: 'Discovered during John Marshall expedition' }
    ],
    status: 'registered'
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
      { url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Museum Acquisition', date: '1954', location: 'New Delhi National Museum', note: 'Catalog ID NM-4872' }
    ],
    status: 'match_pending'
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
      { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Temple Installation', date: '1121 CE', location: 'Hoysaleswara Temple', note: 'Commissioned by King Vishnuvardhana' }
    ],
    status: 'verified'
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
      { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Hoard Discovery', date: '1946', location: 'Bayana, Rajasthan', note: 'Part of historic Bayana hoard discovery' }
    ],
    status: 'registered'
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
      { url: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Stolen from shrine', date: '1982', location: 'Nagapattinam', note: 'FIR registered with TN Police Idol Wing' }
    ],
    status: 'stolen'
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
      { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'ASI Conservation', date: '1919', location: 'Sanchi Museum', note: 'Restored under Sir John Marshall' }
    ],
    status: 'registered'
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
      { url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Repatriated from UK', date: '2023-08-15', location: 'ASI New Delhi', note: 'Successfully recovered via INTERPOL notice' }
    ],
    status: 'repatriating'
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
      { url: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Returned to Temple', date: '2024-01-10', location: 'Virupaksha Temple Complex', note: 'Formally returned and re-consecrated' }
    ],
    status: 'returned'
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
      { url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Archaeological Survey', date: '1962', location: 'Mathura Government Museum', note: 'Cataloged as MM-104' }
    ],
    status: 'registered'
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
      { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Registered with ASI', date: '2020-05-12', location: 'ASI Bhopal Circle', note: 'High resolution photogrammetry complete' }
    ],
    status: 'registered'
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
      { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', angle: 'front' }
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
      { url: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Reported Missing', date: '2018-09-04', location: 'Sirkazhi Temple', note: 'Stolen during night break-in' }
    ],
    status: 'stolen',
    isHeritageImage: false
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
      { url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Private Collection Heritage Register', date: '2019-11-20', location: 'Srinagar Museum', note: 'Verified by ASI Expert Panel' }
    ],
    status: 'registered',
    isHeritageImage: false
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
      { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', angle: 'front' }
    ],
    provenance: [
      { event: 'Preserved at Site Museum', date: '1950', location: 'Konark Archaeological Museum', note: 'Original temple niche sculpture' }
    ],
    status: 'registered',
    isHeritageImage: false
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

    // Create 1 sample Recovered Object & Case for match_pending Buddha Idol
    const pendingMatchArtifact = artifactDocs.find(a => a.artifactId === 'NXD-1003');
    if (pendingMatchArtifact) {
      const recoveredObj = await RecoveredObject.create({
        reportedBy: authority._id,
        images: ['https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80'],
        location: 'Customs Interception Warehouse, Mumbai Port',
        foundDate: new Date('2026-02-14'),
        matches: [
          { artifactId: pendingMatchArtifact._id, score: 96.8 },
          { artifactId: artifactDocs[0]._id, score: 82.4 },
          { artifactId: artifactDocs[3]._id, score: 74.1 }
        ]
      });

      await Case.create({
        caseId: 'CASE-884920',
        artifactId: pendingMatchArtifact._id,
        recoveredObjectId: recoveredObj._id,
        status: 'match_pending',
        note: 'AI system identified 96.8% visual and geometric similarity with reported Gandhara Buddha.',
        timeline: [
          {
            status: 'match_pending',
            updatedBy: authority._id,
            timestamp: new Date('2026-02-14'),
            note: 'Seized object logged during airport customs audit. AI match query initiated.'
          }
        ]
      });
    }

    // Create 1 sample Verified Case for Hoysala Idol
    const verifiedArtifact = artifactDocs.find(a => a.artifactId === 'NXD-1004');
    if (verifiedArtifact) {
      const recObjVerified = await RecoveredObject.create({
        reportedBy: authority._id,
        images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'],
        location: 'Seized Auction House, Geneva',
        foundDate: new Date('2025-11-20'),
        matches: [{ artifactId: verifiedArtifact._id, score: 98.2 }]
      });

      await Case.create({
        caseId: 'CASE-773812',
        artifactId: verifiedArtifact._id,
        recoveredObjectId: recObjVerified._id,
        status: 'verified',
        verifiedBy: expert._id,
        note: 'Micro-chisel marks and inscription match confirmed by expert panel.',
        timeline: [
          {
            status: 'match_pending',
            updatedBy: authority._id,
            timestamp: new Date('2025-11-20'),
            note: 'INTERPOL flag triggered match'
          },
          {
            status: 'verified',
            updatedBy: expert._id,
            timestamp: new Date('2025-11-25'),
            note: 'Expert Prof. Ananya Sen verified physical dimensions & sculptural style.'
          }
        ]
      });
    }

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
