import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Trash2, Calendar, MapPin, Users, FileText, Sparkles, Image as ImageIcon } from 'lucide-react';
import { CaregiverMemoryImage } from '../../types';
import { playDropSound, playChimeSound } from '../../utils/sound';

interface CaregiverImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  seniorMode: boolean;
  onImagesUpdated: (images: CaregiverMemoryImage[]) => void;
}

export const INITIAL_CAREGIVER_MEMORIES: CaregiverMemoryImage[] = [
  {
    id: 'memory-1',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    caption: 'Spring Picnic at Tsomgo Lake',
    people: 'Uncle Norbu, Cousin Maya, Little Pema',
    place: 'Tsomgo Lake, East Sikkim',
    approxDate: 'May 1982',
    keyDetails: 'Sharing steaming vegetable momos from a warm brass tin while listening to the gentle yak bells by the snowmelt water.',
    createdAt: Date.now() - 86400000 * 5,
    lastRecalledAt: Date.now() - 86400000 * 3, // 3 days ago (ready for recall)
  },
  {
    id: 'memory-2',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    caption: 'Darjeeling Veranda Morning Tea',
    people: 'Father Tenzing, Auntie Doma',
    place: 'Happy Valley Tea Estate, Darjeeling',
    approxDate: 'Autumn 1975',
    keyDetails: 'Sitting on the sunlit veranda wrapped in wool shawls, drinking sweet first-flush tea and looking out at the mountain clouds.',
    createdAt: Date.now() - 86400000 * 10,
    lastRecalledAt: Date.now() - 86400000 * 4, // 4 days ago
  },
  {
    id: 'memory-3',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    caption: 'Harvesting Golden Marigolds for Festival',
    people: 'Sister Yangchen, Mother Shanti',
    place: 'Kalimpong terrace garden',
    approxDate: 'October 1989',
    keyDetails: 'Stringing golden marigold flowers into garlands together, warm laughter and hands fragrant with fresh petals.',
    createdAt: Date.now() - 86400000 * 14,
    lastRecalledAt: Date.now() - 86400000 * 2, // 2 days ago
  },
];

const CAREGIVER_MEMORIES_KEY = 'lungta_caregiver_memories';

function sanitizeMemoryImage(raw: unknown): CaregiverMemoryImage | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.url !== 'string' || !obj.url.trim()) return null;
  if (typeof obj.caption !== 'string' || !obj.caption.trim()) return null;

  return {
    id: obj.id,
    url: obj.url,
    caption: obj.caption.trim(),
    people: typeof obj.people === 'string' ? obj.people : 'Family & dear friends',
    place: typeof obj.place === 'string' ? obj.place : 'Himalayan foothills',
    approxDate: typeof obj.approxDate === 'string' ? obj.approxDate : 'Cherished era',
    keyDetails:
      typeof obj.keyDetails === 'string'
        ? obj.keyDetails
        : 'A peaceful, joyful family recollection.',
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
    lastRecalledAt:
      typeof obj.lastRecalledAt === 'number' ? obj.lastRecalledAt : undefined,
  };
}

export function loadCaregiverMemories(): CaregiverMemoryImage[] {
  if (typeof window === 'undefined') return INITIAL_CAREGIVER_MEMORIES;
  try {
    const stored = localStorage.getItem(CAREGIVER_MEMORIES_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed
          .map(sanitizeMemoryImage)
          .filter((item): item is CaregiverMemoryImage => item !== null);
      }
    }
  } catch {
    // fallback to initial samples if malformed
  }
  return INITIAL_CAREGIVER_MEMORIES;
}

export const CaregiverImagesModal: React.FC<CaregiverImagesModalProps> = ({
  isOpen,
  onClose,
  onImagesUpdated,
}) => {
  const [images, setImages] = useState<CaregiverMemoryImage[]>(() => loadCaregiverMemories());

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newPeople, setNewPeople] = useState('');
  const [newPlace, setNewPlace] = useState('');
  const [newApproxDate, setNewApproxDate] = useState('');
  const [newKeyDetails, setNewKeyDetails] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setImages(loadCaregiverMemories());
      setUploadError('');
    }
  }, [isOpen]);

  const persistImages = (next: CaregiverMemoryImage[]): boolean => {
    try {
      localStorage.setItem(CAREGIVER_MEMORIES_KEY, JSON.stringify(next));
      setImages(next);
      onImagesUpdated(next);
      return true;
    } catch {
      setUploadError(
        'Could not save changes to browser storage (image may be too large). Please try a smaller photo.'
      );
      return false;
    }
  };

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setNewUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sample photo presets for convenience
  const samplePresets = [
    {
      label: 'Mountain Garden',
      url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Scenic Pine Valley',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Golden Sunlit Terrace',
      url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const handleSaveNewMemory = () => {
    if (!newUrl) {
      setUploadError('Please upload an image or choose a sample photo.');
      return;
    }
    if (!newCaption.trim()) {
      setUploadError('Please provide a caption/title for this memory.');
      return;
    }

    const created: CaregiverMemoryImage = {
      id: `caregiver-mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: newUrl,
      caption: newCaption.trim(),
      people: newPeople.trim() || 'Family & dear friends',
      place: newPlace.trim() || 'Himalayan foothills',
      approxDate: newApproxDate.trim() || 'Cherished era',
      keyDetails: newKeyDetails.trim() || 'A peaceful, joyful family recollection.',
      createdAt: Date.now(),
      lastRecalledAt: Date.now() - 86400000 * 3,
    };

    if (!persistImages([created, ...images])) {
      return;
    }
    playChimeSound();
    setIsAddingNew(false);
    setNewUrl('');
    setNewCaption('');
    setNewPeople('');
    setNewPlace('');
    setNewApproxDate('');
    setNewKeyDetails('');
    setUploadError('');
  };

  const handleDeleteMemory = (id: string) => {
    playDropSound();
    const next = images.filter((img) => img.id !== id);
    persistImages(next);
  };

  const handleRestoreSamplePhotos = () => {
    playChimeSound();
    persistImages(INITIAL_CAREGIVER_MEMORIES);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Caregiver Image Library"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#284B63]/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[32px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl text-[#284B63] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#D9D9D9] flex items-center justify-between bg-[#F2F4F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8EFEF] text-[#3C6E71] border border-[#D9D9D9] flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.25em] text-[#3C6E71] uppercase">
                SETTINGS • CAREGIVER ACCESS
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-[#284B63] uppercase">
                My Images Library (Memory Lane)
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              playDropSound();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-[#FFFFFF] hover:bg-[#EFEFEF] text-[#284B63] border border-[#D9D9D9] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-[#E8EFEF] border border-[#D9D9D9] text-xs sm:text-sm text-[#353535] leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#3C6E71] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#284B63]">For Caregivers & Family:</strong> Upload photos with names, places, and heartfelt stories. These photos populate the <strong className="text-[#284B63]">Memory Lane</strong> recall activity, allowing your elder to revisit loved memories gently with voice or text active recall.
            </div>
          </div>

          {/* Add New Memory Section Toggle */}
          {!isAddingNew ? (
            <button
              onClick={() => {
                playDropSound();
                setIsAddingNew(true);
              }}
              className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-[#D9D9D9] bg-[#F7F8F9] hover:bg-[#EAEFF3] text-[#284B63] font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-99"
            >
              <Plus className="w-5 h-5 stroke-[3] text-[#3C6E71]" />
              <span>+ Add New Family Photo & Memory Details</span>
            </button>
          ) : (
            <div className="rounded-2xl bg-white border-2 border-[#D9D9D9] p-5 sm:p-7 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-[#D9D9D9] pb-3">
                <h3 className="font-display font-black text-lg sm:text-xl text-[#284B63] uppercase">
                  Add Memory to Library
                </h3>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-[#353535] hover:text-[#284B63] font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Photo Upload / Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63]">
                  1. Photo (Upload or Pick Sample)
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* File Upload Button */}
                  <label className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[#D9D9D9] bg-[#F7F8F9] hover:bg-[#EFEFEF] cursor-pointer font-semibold text-sm text-[#284B63] transition-colors">
                    <Upload className="w-4 h-4 text-[#3C6E71]" />
                    <span>Upload Image from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Sample Presets */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#353535] font-medium">or sample:</span>
                    {samplePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setNewUrl(preset.url)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                          newUrl === preset.url
                            ? 'bg-[#E8EFEF] border-[#3C6E71] text-[#284B63] font-bold'
                            : 'bg-[#FFFFFF] border-[#D9D9D9] text-[#353535] hover:bg-[#EAEFF3]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {newUrl && (
                  <div className="w-full max-w-xs h-40 rounded-xl overflow-hidden border border-[#D9D9D9] shadow-inner mt-2">
                    <img
                      src={newUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Structured Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Caption / Context */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63]">
                    2. Caption / Memory Title *
                  </label>
                  <input
                    type="text"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="e.g. Afternoon tea on the garden bench"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D9D9] text-sm text-[#353535] focus:outline-none focus:ring-2 focus:ring-[#3C6E71]/35"
                  />
                </div>

                {/* People / Names */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>People in the photo</span>
                  </label>
                  <input
                    type="text"
                    value={newPeople}
                    onChange={(e) => setNewPeople(e.target.value)}
                    placeholder="e.g. Doma, Uncle Tashi, Auntie"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D9D9] text-sm text-[#353535] focus:outline-none focus:ring-2 focus:ring-[#3C6E71]/35"
                  />
                </div>

                {/* Place */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>Place / Location</span>
                  </label>
                  <input
                    type="text"
                    value={newPlace}
                    onChange={(e) => setNewPlace(e.target.value)}
                    placeholder="e.g. Kalimpong Hillside, West Bengal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D9D9] text-sm text-[#353535] focus:outline-none focus:ring-2 focus:ring-[#3C6E71]/35"
                  />
                </div>

                {/* Approximate Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>Approximate Date</span>
                  </label>
                  <input
                    type="text"
                    value={newApproxDate}
                    onChange={(e) => setNewApproxDate(e.target.value)}
                    placeholder="e.g. Summer 1985 or May 1990"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D9D9] text-sm text-[#353535] focus:outline-none focus:ring-2 focus:ring-[#3C6E71]/35"
                  />
                </div>

                {/* Key Memory Details */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>Key Memory Details & Story Elements (used for gentle recall)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newKeyDetails}
                    onChange={(e) => setNewKeyDetails(e.target.value)}
                    placeholder="e.g. Drinking fresh tea with butter cookies, listening to the small brass radio on the veranda."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D9D9] text-sm text-[#353535] focus:outline-none focus:ring-2 focus:ring-[#3C6E71]/35 resize-none"
                  />
                </div>
              </div>

              {uploadError && (
                <p className="text-xs font-semibold text-[#8C3B3B]">{uploadError}</p>
              )}

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#D9D9D9] font-semibold text-sm text-[#284B63] hover:bg-[#EFEFEF]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewMemory}
                  className="px-6 py-2.5 rounded-xl bg-[#284B63] text-[#FFFFFF] font-bold text-sm hover:bg-[#3C6E71] shadow-sm cursor-pointer"
                >
                  Save Photo & Details
                </button>
              </div>
            </div>
          )}

          {/* Existing Images Gallery */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display font-black text-lg text-[#284B63] uppercase tracking-tight">
                Stored Memory Library ({images.length})
              </h3>
              {images.length === 0 && (
                <button
                  type="button"
                  onClick={handleRestoreSamplePhotos}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EFEFEF] hover:bg-[#D9D9D9] border border-[#D9D9D9] text-xs font-bold text-[#284B63] cursor-pointer"
                >
                  Restore Sample Photos
                </button>
              )}
            </div>

            {uploadError && !isAddingNew && (
              <p className="text-xs font-semibold text-[#5C2323] bg-[#F4E6E4] border border-[#B87A74] rounded-xl px-3.5 py-2">
                {uploadError}
              </p>
            )}

            {images.length === 0 ? (
              <div className="rounded-2xl bg-[#F7F8F9] border border-[#D9D9D9] p-8 text-center space-y-3">
                <p className="text-sm font-bold text-[#284B63]">
                  No family photos stored yet.
                </p>
                <p className="text-xs text-[#353535] max-w-md mx-auto">
                  Add a personal photo above or restore the starter Himalayan family samples for Memory Lane.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white border border-[#D9D9D9] p-4 flex gap-4 shadow-sm relative group"
                  >
                    {/* Thumbnail */}
                    <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 border border-[#D9D9D9]">
                      <img
                        src={item.url}
                        alt={item.caption}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-bold text-sm text-[#284B63] truncate">{item.caption}</h4>
                        <p className="text-xs text-[#353535] mt-0.5 truncate">
                          <strong>People:</strong> {item.people}
                        </p>
                        <p className="text-xs text-[#353535] truncate">
                          <strong>Place:</strong> {item.place} ({item.approxDate})
                        </p>
                        <p className="text-[11px] text-[#3C6E71] line-clamp-2 mt-1 italic">
                          “{item.keyDetails}”
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#D9D9D9]/70 mt-2">
                        <span className="text-[10px] text-[#353535] font-medium">
                          Added {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteMemory(item.id)}
                          className="text-xs text-[#8C3B3B] hover:text-[#5C2323] font-bold flex items-center gap-1 cursor-pointer"
                          title="Remove memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#D9D9D9] bg-[#F2F4F5] flex justify-end">
          <button
            onClick={() => {
              playDropSound();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#284B63] text-[#FFFFFF] font-bold text-sm hover:bg-[#3C6E71] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
