import { useState } from 'react';
import { PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = "", 
  fallbackClassName = "w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center",
  onClick 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (imageError) {
    return (
      <div className={fallbackClassName}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
          <span className="text-xs text-gray-500">Failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={fallbackClassName}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto mb-1"></div>
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageLoading ? 'hidden' : 'block'}`}
        onError={(e) => {
          console.error('Image failed to load:', src);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', src);
          setImageLoading(false);
        }}
        onClick={onClick}
      />
    </div>
  );
};

export default ImageWithFallback;
