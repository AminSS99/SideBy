/**
 * Item Image Component
 * Displays Pexels images for comparison items with loading states and hover effects
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Camera, ExternalLink, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { PexelsPhoto, getItemGallery, getSmartSearchQuery } from '@/services/pexelsService';

interface ItemImageProps {
  itemName: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  showAttribution?: boolean;
  className?: string;
}

// Loading skeleton
const ImageSkeleton = ({ size }: { size: string }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-full h-48',
  };

  return (
    <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white/5 rounded-xl animate-pulse flex items-center justify-center`}>
      <Camera className="w-8 h-8 text-white/20 animate-pulse" />
    </div>
  );
};

export const ItemImage: React.FC<ItemImageProps> = ({ 
  itemName, 
  category, 
  size = 'md',
  showAttribution = false,
  className = ''
}) => {
  const [photo, setPhoto] = useState<PexelsPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-full h-48',
  };

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      try {
        const query = getSmartSearchQuery(itemName, category);
        const photos = await getItemGallery(query, 1);
        if (photos.length > 0) {
          setPhoto(photos[0]);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [itemName, category]);

  if (loading) {
    return <ImageSkeleton size={size} />;
  }

  if (error || !photo) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-purple-600/20 to-emerald-600/20 rounded-xl flex items-center justify-center border border-white/10 ${className}`}>
        <div className="text-center">
          <Image className="w-8 h-8 text-white/30 mx-auto mb-1" />
          <span className="text-[8px] text-white/30 uppercase">No Image</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} rounded-xl overflow-hidden group cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      <img
        src={photo.src.medium}
        alt={photo.alt || itemName}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Hover overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center"
          >
            <ZoomIn className="w-6 h-6 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution */}
      {showAttribution && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <a 
            href={photo.photographer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] text-white/60 hover:text-white flex items-center gap-1"
          >
            📷 {photo.photographer}
            <ExternalLink className="w-2 h-2" />
          </a>
        </div>
      )}
    </motion.div>
  );
};

// ========== PHOTO GALLERY COMPONENT ==========
interface PhotoGalleryProps {
  itemA: string;
  itemB: string;
  category?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ itemA, itemB, category }) => {
  const [photosA, setPhotosA] = useState<PexelsPhoto[]>([]);
  const [photosB, setPhotosB] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      try {
        const queryA = getSmartSearchQuery(itemA, category);
        const queryB = getSmartSearchQuery(itemB, category);
        
        const [resultA, resultB] = await Promise.all([
          getItemGallery(queryA, 6),
          getItemGallery(queryB, 6),
        ]);
        
        setPhotosA(resultA);
        setPhotosB(resultB);
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [itemA, itemB, category]);

  const currentPhotos = activeTab === 'A' ? photosA : photosB;
  const currentItem = activeTab === 'A' ? itemA : itemB;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10"
    >
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Photo Gallery</h3>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Powered by Pexels</span>
        </div>
        
        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('A')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === 'A' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {itemA}
          </button>
          <button
            onClick={() => setActiveTab('B')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === 'B' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {itemB}
          </button>
        </div>
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : currentPhotos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentPhotos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.src.medium}
                alt={photo.alt || currentItem}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[10px] text-white/80 truncate">📷 {photo.photographer}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white/80" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/40">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No photos found for {currentItem}</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.src.large2x}
                alt={selectedPhoto.alt}
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-xl">
                <a 
                  href={selectedPhoto.photographer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/80 hover:text-white flex items-center gap-2"
                >
                  📷 Photo by {selectedPhoto.photographer}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ItemImage;
