import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { getHeritageArtifactImageUrl } from '../utils/heritageImages';

const HeritageArtifactImage = ({
  artifact,
  className = "w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
}) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getHeritageArtifactImageUrl(artifact);

  if (hasError || !imageUrl) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-slate-100 text-slate-500 border border-slate-200 p-1 text-center shrink-0`}>
        <Shield className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
        <span className="text-[8px] font-medium leading-tight text-slate-500">Artifact Image Unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={artifact?.name || 'Heritage Artifact'}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export default HeritageArtifactImage;
