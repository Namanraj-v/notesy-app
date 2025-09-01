import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notesAPI } from '../services/api';
import NoteEditor from '../components/Notes/NoteEditor';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowRightOnRectangleIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  DocumentTextIcon as DocumentTextSolidIcon,
  PhotoIcon,
  StarIcon
} from '@heroicons/react/24/solid';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  
  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const categories = [
    { value: 'All', label: 'All Notes', icon: '📝', color: 'bg-gray-100 text-gray-800' },
    { value: 'General', label: 'General', icon: '📁', color: 'bg-blue-100 text-blue-800' },
    { value: 'Work', label: 'Work', icon: '💼', color: 'bg-purple-100 text-purple-800' },
    { value: 'Personal', label: 'Personal', icon: '👤', color: 'bg-green-100 text-green-800' },
    { value: 'Ideas', label: 'Ideas', icon: '💡', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Important', label: 'Important', icon: '⭐', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    loadNotes();
  }, [searchTerm, selectedCategory]);

  // Debug images - temporary logging
  useEffect(() => {
    if (notes.length > 0) {
      console.log('📊 Dashboard Debug Info:');
      console.log('Total notes:', notes.length);
      
      const notesWithImages = notes.filter(note => note.screenshots?.length > 0);
      console.log('Notes with images:', notesWithImages.length);
      
      notesWithImages.forEach(note => {
        console.log(`📝 Note "${note.title}":`, {
          imageCount: note.screenshots.length,
          imageUrls: note.screenshots
        });
      });
    }
  }, [notes]);

  const loadNotes = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      
      const data = await notesAPI.getNotes(params);
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (formData) => {
    try {
      if (editingNote) {
        await notesAPI.updateNote(editingNote._id, formData);
      } else {
        await notesAPI.createNote(formData);
      }
      loadNotes();
      setShowEditor(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note. Make sure your backend server is running.');
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await notesAPI.deleteNote(id);
        loadNotes();
        // Close image viewer if current note is deleted
        if (currentNote && currentNote._id === id) {
          setImageViewerOpen(false);
          setCurrentNote(null);
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error deleting note');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  // Open image viewer
  const openImageViewer = (note, imageIndex = 0) => {
    console.log('🖼️ Opening image viewer for note:', note.title);
    setCurrentNote(note);
    setCurrentImageIndex(imageIndex);
    setImageViewerOpen(true);
  };

  // Close image viewer
  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setCurrentNote(null);
    setCurrentImageIndex(0);
  };

  // Navigate images
  const nextImage = () => {
    if (currentNote && currentImageIndex < currentNote.screenshots.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Enhanced Image Component
  const ImageWithFallback = ({ src, alt, className, onClick, index }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    if (imageError) {
      return (
        <div className={`${className} bg-gray-100 flex items-center justify-center border-2 border-gray-200`}>
          <div className="text-center p-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Failed</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative group">
        {imageLoading && (
          <div className={`${className} bg-gray-100 flex items-center justify-center border-2 border-gray-200 absolute inset-0`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600 mx-auto mb-1"></div>
              <span className="text-xs text-gray-500">Loading</span>
            </div>
          </div>
        )}
        
        <img
          src={src}
          alt={alt}
          className={`${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 cursor-pointer hover:border-primary-400`}
          onError={(e) => {
            console.error(`❌ Image ${index + 1} failed to load:`, src);
            setImageError(true);
            setImageLoading(false);
          }}
          onLoad={() => {
            console.log(`✅ Image ${index + 1} loaded successfully:`, src);
            setImageLoading(false);
          }}
          onClick={onClick}
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none">
          <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
            Click to view
          </span>
        </div>
      </div>
    );
  };

  // Split Screen Image Viewer Component
  const SplitScreenViewer = () => {
    if (!imageViewerOpen || !currentNote) return null;

    const categoryInfo = getCategoryInfo(currentNote.category);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex">
        {/* Left Half - Note Content */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentNote.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                    {categoryInfo.icon} {currentNote.category}
                  </span>
                  <span className="flex items-center space-x-1">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>{formatDate(currentNote.updatedAt)}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={closeImageViewer}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{currentNote.content}</p>
            </div>

            {/* Tags */}
            {currentNote.tags && currentNote.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {currentNote.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={() => {
                  setEditingNote(currentNote);
                  setShowEditor(true);
                  closeImageViewer();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit Note</span>
              </button>
              <button
                onClick={() => handleDeleteNote(currentNote._id)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Half - Image Viewer */}
        <div className="w-1/2 bg-gray-900 flex flex-col">
          {/* Image Navigation Header */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-lg font-medium">Images</h3>
              <p className="text-sm text-gray-400">
                {currentImageIndex + 1} of {currentNote.screenshots.length}
              </p>
            </div>
            
            {/* Navigation Buttons */}
            {currentNote.screenshots.length > 1 && (
              <div className="flex space-x-2">
                <button
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                  className="p-2 text-white bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  disabled={currentImageIndex === currentNote.screenshots.length - 1}
                  className="p-2 text-white bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Main Image Display */}
          <div className="flex-1 flex items-center justify-center p-6">
            <img
              src={currentNote.screenshots[currentImageIndex]}
              alt={`Screenshot ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                console.error('❌ Image failed to load:', currentNote.screenshots[currentImageIndex]);
              }}
            />
          </div>

          {/* Thumbnail Navigation */}
          {currentNote.screenshots.length > 1 && (
            <div className="bg-gray-800 p-4">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {currentNote.screenshots.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex 
                        ? 'border-primary-500' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const stats = {
    total: notes.length,
    categories: [...new Set(notes.map(note => note.category))].length,
    tags: [...new Set(notes.flatMap(note => note.tags || []))].length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-600">Loading your notes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <DocumentTextSolidIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Notesy
                  </h1>
                  <p className="text-sm text-gray-500">Your personal workspace</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{stats.total} notes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TagIcon className="h-4 w-4" />
                  <span>{stats.tags} tags</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Welcome back!</p>
                  <p className="text-xs text-gray-500">{user?.username}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors duration-200"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Control Bar */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>
            
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm appearance-none"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex rounded-lg border border-gray-300 bg-white shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-3 rounded-l-lg transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-3 rounded-r-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Notes Display */}
        {notes.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
          }>
            {notes.map((note) => {
              const categoryInfo = getCategoryInfo(note.category);
              
              if (viewMode === 'list') {
                return (
                  <div key={note._id} className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {note.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                            {categoryInfo.icon} {note.category}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{note.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span>{formatDate(note.updatedAt)}</span>
                          </span>
                          {note.screenshots?.length > 0 && (
                            <button
                              onClick={() => openImageViewer(note, 0)}
                              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              <PhotoIcon className="h-4 w-4" />
                              <span>{note.screenshots.length} images</span>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setShowEditor(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Grid view
              return (
                <div key={note._id} className="group">
                  <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 h-full">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1">
                        {note.title}
                      </h3>
                      <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setShowEditor(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {note.content}
                    </p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                        {categoryInfo.icon} {note.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <CalendarDaysIcon className="h-3 w-3" />
                        <span>{formatDate(note.updatedAt)}</span>
                      </span>
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {note.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{note.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Enhanced Image Display Section */}
                    {note.screenshots && note.screenshots.length > 0 && (
                      <div className="mt-3">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {note.screenshots.slice(0, 3).map((url, index) => (
                            <ImageWithFallback
                              key={index}
                              src={url}
                              alt={`Screenshot ${index + 1} for ${note.title}`}
                              className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 flex-shrink-0"
                              onClick={() => openImageViewer(note, index)}
                              index={index}
                            />
                          ))}
                          {note.screenshots.length > 3 && (
                            <button
                              onClick={() => openImageViewer(note, 3)}
                              className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0 hover:border-primary-400 transition-colors"
                            >
                              +{note.screenshots.length - 3}
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <PhotoIcon className="h-3 w-3" />
                            {note.screenshots.length} image{note.screenshots.length > 1 ? 's' : ''}
                          </p>
                          {note.screenshots.length > 0 && (
                            <button
                              onClick={() => openImageViewer(note, 0)}
                              className="text-xs text-primary-600 hover:text-primary-700 transition-colors duration-200 font-medium"
                            >
                              View images
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <DocumentTextSolidIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'All' ? 'No notes found' : 'Welcome to Notesy!'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'All' 
                ? 'Try adjusting your search or filter criteria to find your notes.'
                : 'Start capturing your thoughts, ideas, and important information. Create your first note to get started!'
              }
            </p>
            <button
              onClick={() => setShowEditor(true)}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-lg"
            >
              <PlusIcon className="h-6 w-6" />
              <span>Create Your First Note</span>
            </button>
          </div>
        )}
      </main>

      {/* Split Screen Image Viewer */}
      <SplitScreenViewer />

      {/* Note Editor Modal */}
      {showEditor && (
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onClose={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
