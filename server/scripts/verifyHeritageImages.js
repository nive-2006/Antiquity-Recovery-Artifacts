const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Artifact = require('../models/Artifact');

const INVALID_NXD_IDS = ['NXD-1015', 'NXD-1014', 'NXD-1013'];

async function runMigration() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexdata';
    console.log(`[Heritage Image Migration] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const allArtifacts = await Artifact.find({});
    console.log(`[Heritage Image Migration] Found ${allArtifacts.length} artifacts total.`);

    let validCount = 0;
    let invalidCount = 0;
    const invalidList = [];

    for (const art of allArtifacts) {
      const isInvalid = INVALID_NXD_IDS.includes(art.artifactId) || art.isHeritageImage === false;
      
      const newStatus = !isInvalid;
      art.isHeritageImage = newStatus;
      await art.save();

      if (newStatus) {
        validCount++;
      } else {
        invalidCount++;
        invalidList.push({
          artifactId: art.artifactId,
          name: art.name,
          imageUrl: art.images && art.images[0] ? art.images[0].url : 'No image'
        });
      }
    }

    console.log('\n================ MIGRATION REPORT ================');
    console.log(`Total Artifacts Scanned: ${allArtifacts.length}`);
    console.log(`Verified Heritage Objects (isHeritageImage: true): ${validCount}`);
    console.log(`Flagged Non-Heritage Photos (isHeritageImage: false): ${invalidCount}`);
    console.log('\n--- Flagged Invalid Records Needing Photo Replacement ---');
    invalidList.forEach(item => {
      console.log(` [ID: ${item.artifactId}] Name: "${item.name}" | Current Image: ${item.imageUrl}`);
    });
    console.log('===================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]:', err);
    process.exit(1);
  }
}

runMigration();
