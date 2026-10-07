// Helper utility for mapped Indian Heritage Artifact Images & clean Fallback handling

export const HERITAGE_IMAGE_MAP = {
  'NXD-1001': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Chola_bronze_Nataraja_Tamil_Nadu_11th_century.jpg/640px-Chola_bronze_Nataraja_Tamil_Nadu_11th_century.jpg',
  'NXD-1002': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Pashupati_seal.jpg/640px-Pashupati_seal.jpg',
  'NXD-1003': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Seated_Buddha_from_Gandhara.jpg/640px-Seated_Buddha_from_Gandhara.jpg',
  'NXD-1004': 'http://localhost:8000/api/heritage/images/01_Madanika_at_Chennakeshava_Temple.jpg',
  'NXD-1005': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/SamudraguptaCoinLyristType.jpg/640px-SamudraguptaCoinLyristType.jpg',
  'NXD-1006': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Chola_Bronze_Shiva.jpg/640px-Chola_Bronze_Shiva.jpg',
  'NXD-1007': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Sanchi_Stupa_No.1_Torana_Yakshini_East_Gateway.jpg/640px-Sanchi_Stupa_No.1_Torana_Yakshini_East_Gateway.jpg',
  'NXD-1008': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Pala_statue_of_Tara_Nalanda.jpg/640px-Pala_statue_of_Tara_Nalanda.jpg',
  'NXD-1009': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Krishna_as_a_Butter_Thief_Bronze.jpg/640px-Krishna_as_a_Butter_Thief_Bronze.jpg',
  'NXD-1010': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Parkham_Yaksha_Mathura_Museum.jpg/640px-Parkham_Yaksha_Mathura_Museum.jpg',
  'NXD-1011': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Apsara_Khajuraho_Museum.jpg/640px-Apsara_Khajuraho_Museum.jpg',
  'NXD-1012': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Mother_goddess_Mohenjo-daro.jpg/640px-Mother_goddess_Mohenjo-daro.jpg',
  'NXD-1013': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Sambandar_Chola_Bronze_Met.jpg/640px-Sambandar_Chola_Bronze_Met.jpg',
  'NXD-1014': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Avalokiteshvara_Kashmir_bronze_8th_century.jpg/640px-Avalokiteshvara_Kashmir_bronze_8th_century.jpg',
  'NXD-1015': 'http://localhost:8000/api/heritage/images/12th-century_Surya_at_Shaivism_Hindu_temple_Hoysaleswara_arts_Halebidu_Karnataka_India.jpg'
};

export const getHeritageArtifactImageUrl = (artifact) => {
  if (!artifact) return null;
  
  // 1. Direct ID match in HERITAGE_IMAGE_MAP
  if (artifact.artifactId && HERITAGE_IMAGE_MAP[artifact.artifactId]) {
    return HERITAGE_IMAGE_MAP[artifact.artifactId];
  }

  // 2. Check if primary image URL exists and is not an invalid/generic image
  const primaryUrl = artifact.images && artifact.images.length > 0 ? artifact.images[0].url : null;
  if (primaryUrl && isValidHeritageUrl(primaryUrl)) {
    return primaryUrl;
  }

  // 3. Name-based matching for Indian Heritage Artifacts
  const nameLower = (artifact.name || '').toLowerCase();
  if (nameLower.includes('surya') || nameLower.includes('sun god')) {
    return HERITAGE_IMAGE_MAP['NXD-1015'];
  }
  if (nameLower.includes('nataraja') || nameLower.includes('chola bronze')) {
    return HERITAGE_IMAGE_MAP['NXD-1001'];
  }
  if (nameLower.includes('pashupati') || nameLower.includes('seal')) {
    return HERITAGE_IMAGE_MAP['NXD-1002'];
  }
  if (nameLower.includes('buddha') || nameLower.includes('gandhara')) {
    return HERITAGE_IMAGE_MAP['NXD-1003'];
  }
  if (nameLower.includes('saraswati') || nameLower.includes('hoysala')) {
    return HERITAGE_IMAGE_MAP['NXD-1004'];
  }
  if (nameLower.includes('coin') || nameLower.includes('gupta')) {
    return HERITAGE_IMAGE_MAP['NXD-1005'];
  }
  if (nameLower.includes('mahadeva') || nameLower.includes('shiva')) {
    return HERITAGE_IMAGE_MAP['NXD-1006'];
  }
  if (nameLower.includes('sanchi') || nameLower.includes('bracket') || nameLower.includes('shalabhanjika')) {
    return HERITAGE_IMAGE_MAP['NXD-1007'];
  }
  if (nameLower.includes('tara') || nameLower.includes('pala')) {
    return HERITAGE_IMAGE_MAP['NXD-1008'];
  }
  if (nameLower.includes('krishna') || nameLower.includes('balalila') || nameLower.includes('vijayanagara')) {
    return HERITAGE_IMAGE_MAP['NXD-1009'];
  }
  if (nameLower.includes('yaksha') || nameLower.includes('mathura')) {
    return HERITAGE_IMAGE_MAP['NXD-1010'];
  }
  if (nameLower.includes('apsara') || nameLower.includes('khajuraho')) {
    return HERITAGE_IMAGE_MAP['NXD-1011'];
  }
  if (nameLower.includes('mother goddess') || nameLower.includes('terracotta') || nameLower.includes('indus')) {
    return HERITAGE_IMAGE_MAP['NXD-1012'];
  }
  if (nameLower.includes('sambandar') || nameLower.includes('child saint')) {
    return HERITAGE_IMAGE_MAP['NXD-1013'];
  }
  if (nameLower.includes('avalokiteshvara') || nameLower.includes('kashmir')) {
    return HERITAGE_IMAGE_MAP['NXD-1014'];
  }

  return null;
};

// Check if a URL is a valid heritage image URL (filters out generic unsplash photos that are non-heritage)
const isValidHeritageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Exclude known non-heritage generic unsplash photo hashes that show shopping bags, cities, interior galleries
  const genericUnsplashHashes = [
    'photo-1599707367072-cd6ada2bc375',
    'photo-1607604276583-eef5d076aa5f',
    'photo-1567157577867-05ccb1388e66',
    'photo-1579783902614-a3fb3927b675',
    'photo-1618005182384-a83a8bd57fbe',
    'photo-1582555172866-f73bb12a2ab3',
    'photo-1544816155-12df9643f363'
  ];

  for (const hash of genericUnsplashHashes) {
    if (url.includes(hash)) return false;
  }

  return true;
};
