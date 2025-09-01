import { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  DocumentTextIcon,
  TagIcon,
  PhotoIcon,
  CheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { DocumentTextIcon as DocumentTextSolidIcon } from '@heroicons/react/24/solid';

const NoteEditor = ({ note, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
  });
  
  // Separate state for existing images (URLs) and new files
  const [existingImages, setExistingImages] = useState([]);
  const [newScreenshots, setNewScreenshots] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { value: 'General', label: 'General', icon: '📁', color: 'bg-blue-50 border-blue-200' },
    { value: 'Work', label: 'Work', icon: '💼', color: 'bg-purple-50 border-purple-200' },
    { value: 'Personal', label: 'Personal', icon: '👤', color: 'bg-green-50 border-green-200' },
    { value: 'Ideas', label: 'Ideas', icon: '💡', color: 'bg-yellow-50 border-yellow-200' },
    { value: 'Important', label: 'Important', icon: '⭐', color: 'bg-red-50 border-red-200' },
  ];

  // ✅ Image compression utility
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxWidth) {
          const ratio = Math.min(maxWidth / width, maxWidth / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // ✅ File validation
  const validateFiles = (files) => {
    const maxSize = 5 * 1024 * 1024; // 5MB limit after compression
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    const validFiles = [];
    const errors = [];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} has invalid format. Allowed: JPEG, PNG, WebP, GIF`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (errors.length > 0) {
      alert('Upload errors:\n' + errors.join('\n'));
    }
    
    return validFiles;
  };

  // Proper initialization that preserves existing images
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        category: note.category || 'General',
        tags: note.tags ? note.tags.join(', ') : '',
      });
      
      setExistingImages(note.screenshots || []);
      setNewScreenshots([]);
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'General',
        tags: '',
      });
      setExistingImages([]);
      setNewScreenshots([]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [note]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);
    
    // Progress updates
    if (newScreenshots.length > 0) {
      setUploadProgress(`Preparing ${newScreenshots.length} images for upload...`);
    }
    
    const noteData = new FormData();
    noteData.append('title', formData.title);
    noteData.append('content', formData.content);
    noteData.append('category', formData.category);
    noteData.append('tags', formData.tags);
    noteData.append('keepExistingImages', JSON.stringify(existingImages));
    
    newScreenshots.forEach((file, index) => {
      setUploadProgress(`Adding image ${index + 1}/${newScreenshots.length} to upload...`);
      noteData.append('screenshots', file);
    });

    try {
      if (newScreenshots.length > 0) {
        setUploadProgress('Uploading images to cloud storage...');
      }
      
      await onSave(noteData);
      setUploadProgress('');
    } catch (error) {
      console.error('Error saving note:', error);
      setUploadProgress('Upload failed');
      alert('Failed to save note. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  // ✅ Enhanced file handling with compression
  const handleFileChange = async (files) => {
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    setCompressing(true);
    const compressedFiles = [];
    
    console.log('🔄 Starting image compression...');
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      console.log(`📸 Processing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      if (file.size > 1024 * 1024) { // If larger than 1MB, compress
        try {
          const compressed = await compressImage(file);
          const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
          
          console.log(`✅ Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          compressedFiles.push(compressedFile);
        } catch (error) {
          console.error('Compression failed for', file.name);
          compressedFiles.push(file); // Use original if compression fails
        }
      } else {
        compressedFiles.push(file);
      }
    }

    setNewScreenshots(prev => [...prev, ...compressedFiles]);
    setCompressing(false);
    console.log('✅ Image compression completed');
  };

  const handleInputFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files);
    }
  };

  // Remove existing image
  const removeExistingImage = (index) => {
    console.log(`🗑️ Removing existing image at index ${index}`);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove new file
  const removeNewFile = (index) => {
    console.log(`🗑️ Removing new file at index ${index}`);
    setNewScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <DocumentTextSolidIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-white">
                          {note ? 'Edit Note' : 'Create New Note'}
                        </Dialog.Title>
                        <p className="text-blue-100 text-sm">
                          {note ? 'Update your note' : 'Capture your thoughts'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                      disabled={loading}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter a descriptive title..."
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Category and Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {categories.map((category) => (
                          <label
                            key={category.value}
                            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              formData.category === category.value
                                ? `${category.color} border-current`
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="radio"
                              name="category"
                              value={category.value}
                              checked={formData.category === category.value}
                              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                              className="sr-only"
                              disabled={loading}
                            />
                            <span className="text-lg mr-3">{category.icon}</span>
                            <span className="font-medium">{category.label}</span>
                            {formData.category === category.value && (
                              <CheckIcon className="h-5 w-5 ml-auto text-current" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="relative">
                        <TagIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Add tags (comma-separated)"
                          value={formData.tags}
                          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          disabled={loading}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Separate tags with commas (e.g., work, important, meeting)
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      placeholder="Start writing your note..."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Enhanced Images Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Screenshots & Images
                    </label>

                    {/* Existing Images Section */}
                    {existingImages.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Current Images ({existingImages.length}):
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {existingImages.map((url, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <img
                                src={url}
                                alt={`Existing image ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                disabled={loading}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                Current
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Images Upload Section */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                        dragActive 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (!loading) setDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {compressing ? 'Compressing images...' : 'Drag and drop new images here, or '}
                        {!compressing && (
                          <label className="text-primary-600 cursor-pointer hover:text-primary-700">
                            browse
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleInputFileChange}
                              className="sr-only"
                              disabled={loading}
                            />
                          </label>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WebP, GIF • Auto-compressed for faster upload
                      </p>
                      {compressing && (
                        <div className="mt-3 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span className="ml-2 text-sm text-primary-600">Optimizing images...</span>
                        </div>
                      )}
                    </div>

                    {/* New Selected Files */}
                    {newScreenshots.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          New Images to Upload ({newScreenshots.length}):
                        </h4>
                        <div className="space-y-2">
                          {newScreenshots.map((file, index) => (
                            <div key={`new-${index}-${file.name}`} className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <PhotoIcon className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  {file.size < 1024 * 1024 ? 'Optimized' : 'New'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNewFile(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                                disabled={loading}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Total Images:</strong> {existingImages.length} existing + {newScreenshots.length} new = {existingImages.length + newScreenshots.length} total
                      </p>
                      {uploadProgress && (
                        <p className="text-sm text-blue-600 mt-1">
                          <strong>Status:</strong> {uploadProgress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || compressing}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>{uploadProgress || 'Saving...'}</span>
                        </>
                      ) : compressing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing Images...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5" />
                          <span>Save Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default NoteEditor;
