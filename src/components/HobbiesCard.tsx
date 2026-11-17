import React, { useState, useEffect } from 'react';
import { Sprout, Music2, BookOpen, Scissors, Check, Sparkles, Heart, Plus, Trash2, X } from 'lucide-react';
import { playDropSound, playChimeSound } from '../utils/sound';
import { ACTIVITY_UPDATED_EVENT, getDailyRhythmSummary } from '../utils/activityStorage';
import { useLanguage } from '../context/LanguageContext';
import { ListenAloudButton } from './ListenAloudButton';

interface HobbiesCardProps {
  seniorMode: boolean;
}

interface CustomHobby {
  id: string;
  title: string;
  subtitle: string;
  colorName: 'emerald' | 'amber' | 'blue' | 'rose' | 'purple';
}

const COLOR_MAP = {
  emerald: {
    accentColor: 'text-[#284B63]',
    activeBg: 'bg-[#E8EFEF] border-[#3C6E71]',
    iconBg: 'bg-[#FFFFFF]',
  },
  amber: {
    accentColor: 'text-[#3C6E71]',
    activeBg: 'bg-[#EAEFF3] border-[#284B63]',
    iconBg: 'bg-[#FFFFFF]',
  },
  blue: {
    accentColor: 'text-[#3C6E71]',
    activeBg: 'bg-[#E8EFEF] border-[#3C6E71]',
    iconBg: 'bg-[#FFFFFF]',
  },
  rose: {
    accentColor: 'text-[#353535]',
    activeBg: 'bg-[#D9D9D9]/65 border-[#353535]',
    iconBg: 'bg-[#FFFFFF]',
  },
  purple: {
    accentColor: 'text-[#284B63]',
    activeBg: 'bg-[#EAEFF3] border-[#284B63]',
    iconBg: 'bg-[#FFFFFF]',
  },
};

const STORAGE_KEY_CUSTOM = 'lungta_custom_hobbies_v2';
const STORAGE_KEY_SELECTED = 'lungta_selected_hobbies_v2';

export const HobbiesCard: React.FC<HobbiesCardProps> = ({ seniorMode }) => {
  const { language, t } = useLanguage();

  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        }
      }
    } catch {
      // fallback
    }
    return ['gardening'];
  });

  const [customHobbies, setCustomHobbies] = useState<CustomHobby[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (h): h is CustomHobby =>
              Boolean(h) &&
              typeof h === 'object' &&
              typeof h.id === 'string' &&
              typeof h.title === 'string' &&
              typeof h.subtitle === 'string'
          );
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newColor, setNewColor] = useState<'emerald' | 'amber' | 'blue' | 'rose' | 'purple'>('purple');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(selectedHobbies));
      window.dispatchEvent(new CustomEvent(ACTIVITY_UPDATED_EVENT, { detail: getDailyRhythmSummary() }));
    } catch {
      // ignore
    }
  }, [selectedHobbies]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customHobbies));
    } catch {
      // ignore
    }
  }, [customHobbies]);

  const defaultHobbies = [
    {
      id: 'gardening',
      title: t('gardening', 'Gardening'),
      subtitle: t('gardening_sub', 'Tending plants & flowers'),
      icon: Sprout,
      accentColor: 'text-[#3C6E71]',
      activeBg: 'bg-[#E8EFEF] border-[#3C6E71]',
      iconBg: 'bg-[#FFFFFF]',
    },
    {
      id: 'music',
      title: t('music_hobby', 'Music'),
      subtitle: t('music_sub', 'Singing, flute or listening'),
      icon: Music2,
      accentColor: 'text-[#284B63]',
      activeBg: 'bg-[#EAEFF3] border-[#284B63]',
      iconBg: 'bg-[#FFFFFF]',
    },
    {
      id: 'reading',
      title: t('reading', 'Reading'),
      subtitle: t('reading_sub', 'Stories, poems & books'),
      icon: BookOpen,
      accentColor: 'text-[#3C6E71]',
      activeBg: 'bg-[#E8EFEF] border-[#3C6E71]',
      iconBg: 'bg-[#FFFFFF]',
    },
    {
      id: 'handicraft',
      title: t('handicraft', 'Handicraft'),
      subtitle: t('handicraft_sub', 'Knitting, weave & crafts'),
      icon: Scissors,
      accentColor: 'text-[#353535]',
      activeBg: 'bg-[#D9D9D9]/65 border-[#353535]',
      iconBg: 'bg-[#FFFFFF]',
    },
  ];

  const handleToggleHobby = (id: string) => {
    playDropSound();
    setSelectedHobbies((prev) => {
      const isAlready = prev.includes(id);
      if (!isAlready) {
        playChimeSound();
        return [...prev, id];
      } else {
        return prev.filter((item) => item !== id);
      }
    });
  };

  const handleSaveCustomHobby = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    playChimeSound();
    const newHobby: CustomHobby = {
      id: `custom_${Date.now()}`,
      title: trimmedTitle,
      subtitle: newSubtitle.trim() || 'Personal creative pastime',
      colorName: newColor,
    };

    setCustomHobbies((prev) => [...prev, newHobby]);
    setSelectedHobbies((prev) => [...prev, newHobby.id]);
    setNewTitle('');
    setNewSubtitle('');
    setShowAddModal(false);
  };

  const handleDeleteCustomHobby = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playDropSound();
    setCustomHobbies((prev) => prev.filter((h) => h.id !== id));
    setSelectedHobbies((prev) => prev.filter((item) => item !== id));
  };

  // Text for listen aloud
  const spokenHobbiesSummary = `${t('hobbies_title', 'My Hobbies')}. ${t('hobbies_intro', 'Tap below to mark the creative pastimes that warmed your day.')} ${defaultHobbies.map((h) => h.title).join(', ')}.`;

  return (
    <div
      id="hobbies-warm-card"
      className="relative w-full h-full rounded-[32px] bg-[#EAEFF3] border-[3px] border-[#D9D9D9] shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group"
    >
      {/* Top ornamental triangle border */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#284B63]/12 border-b border-[#D9D9D9] text-[#284B63] select-none">
        <span className="text-[10px] tracking-widest font-black">▲ ▲ ▲ ▲ ▲ ▲ ▲</span>
      </div>

      {/* Card Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-[#3C6E71] text-[#3C6E71]" />
            <span>{t('daily_recreation', 'DAILY RECREATION')}</span>
          </div>

          <div className="flex items-center gap-2">
            <ListenAloudButton
              textToSpeak={spokenHobbiesSummary}
              currentLang={language}
              size="sm"
              variant="subtle"
            />
            <span className="text-xs font-bold text-[#3C6E71]">
              {selectedHobbies.length} {t('chosen_today', 'chosen today')}
            </span>
          </div>
        </div>

        {/* Title and Add Hobby Button */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3
            className={`font-display font-black text-[#284B63] uppercase tracking-tight leading-tight ${
              seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {t('hobbies_title', 'My Hobbies')}
          </h3>

          {/* + Add Hobby Button */}
          <button
            id="add-hobby-button"
            type="button"
            onClick={() => {
              playDropSound();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] text-xs sm:text-sm font-bold shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3] text-[#D9D9D9]" />
            <span>{t('add_hobby', '+ Add Hobby')}</span>
          </button>
        </div>

        {/* Subhead */}
        <p className="text-[#284B63] font-semibold text-sm sm:text-base mt-1">
          {defaultHobbies.map((h) => h.title).join(' • ')}
        </p>

        <p className="text-[#353535] text-xs sm:text-sm font-medium mt-0.5">
          {t('hobbies_intro', 'Tap below to mark the creative pastimes that warmed your day.')}
        </p>
      </div>

      {/* Hobbies Selection Grid: Large, Friendly, Tactile Cards */}
      <div className="my-5 grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
        {/* Built-in standard hobbies */}
        {defaultHobbies.map((hobby) => {
          const isSelected = selectedHobbies.includes(hobby.id);
          const IconComp = hobby.icon;

          return (
            <button
              key={hobby.id}
              id={`hobby-btn-${hobby.id}`}
              onClick={() => handleToggleHobby(hobby.id)}
              className={`relative text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-97 flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
                isSelected
                  ? `${hobby.activeBg} shadow-md`
                  : 'bg-[#FFFFFF]/90 hover:bg-white border-[#D9D9D9] hover:border-[#3C6E71]'
              }`}
              aria-pressed={isSelected}
            >
              {/* Header row inside tile */}
              <div className="flex items-start justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white' : hobby.iconBg
                  } ${hobby.accentColor}`}
                >
                  <IconComp className="w-5 h-5" />
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-[#284B63] text-[#FFFFFF] flex items-center justify-center text-xs shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#D9D9D9]" />
                )}
              </div>

              {/* Text label */}
              <div>
                <h4
                  className={`font-display font-black leading-tight text-[#284B63] uppercase ${
                    seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                  }`}
                >
                  {hobby.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#353535] font-medium line-clamp-1">
                  {hobby.subtitle}
                </p>
              </div>
            </button>
          );
        })}

        {/* User-added Custom Hobbies */}
        {customHobbies.map((hobby) => {
          const isSelected = selectedHobbies.includes(hobby.id);
          const colorStyles = COLOR_MAP[hobby.colorName] || COLOR_MAP.purple;

          return (
            <div
              key={hobby.id}
              id={`hobby-btn-${hobby.id}`}
              role="button"
              tabIndex={0}
              onClick={() => handleToggleHobby(hobby.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleHobby(hobby.id);
                }
              }}
              className={`relative text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-97 flex flex-col justify-between min-h-[96px] sm:min-h-[104px] group/item ${
                isSelected
                  ? `${colorStyles.activeBg} shadow-md`
                  : 'bg-[#FFFFFF]/90 hover:bg-white border-[#D9D9D9] hover:border-[#3C6E71]'
              }`}
              aria-pressed={isSelected}
            >
              {/* Header row inside tile */}
              <div className="flex items-start justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white' : colorStyles.iconBg
                  } ${colorStyles.accentColor}`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-1">
                  {/* Delete custom hobby button */}
                  <button
                    type="button"
                    title="Remove custom hobby"
                    aria-label={`Remove ${hobby.title}`}
                    onClick={(e) => handleDeleteCustomHobby(hobby.id, e)}
                    className="p-1 text-[#353535] hover:text-[#8C3B3B] rounded-full hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#284B63] text-[#FFFFFF] flex items-center justify-center text-xs shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#D9D9D9]" />
                  )}
                </div>
              </div>

              {/* Text label */}
              <div>
                <h4
                  className={`font-display font-black leading-tight text-[#284B63] uppercase ${
                    seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                  }`}
                >
                  {hobby.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#353535] font-medium line-clamp-1">
                  {hobby.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Dialog for Adding Custom Hobby */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#284B63]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-[#FFFFFF] border-4 border-[#D9D9D9] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => {
                playDropSound();
                setShowAddModal(false);
              }}
              className="absolute top-4 right-4 p-2 text-[#353535] hover:text-[#284B63] rounded-full hover:bg-[#D9D9D9]/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-[#3C6E71]" />
              <h3 className="font-display text-2xl font-black text-[#284B63] uppercase">
                {t('add_custom_hobby', 'Add Your Own Hobby')}
              </h3>
            </div>

            <p className="text-sm text-[#353535] mb-4">
              {t('add_custom_hobby_desc', 'Create a personalized pastime to cherish and track each day.')}
            </p>

            <form onSubmit={handleSaveCustomHobby} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63] mb-1.5">
                  {t('hobby_name', 'Hobby Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Birdwatching, Pottery, Chess, Weaving"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#D9D9D9] bg-white text-[#353535] font-bold focus:border-[#3C6E71] focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63] mb-1.5">
                  {t('hobby_note', 'Short Note / Description')}
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g., Identifying morning birds in garden"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#D9D9D9] bg-white text-[#353535] font-medium focus:border-[#3C6E71] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#284B63] mb-1.5">
                  {t('choose_color', 'Color Theme')}
                </label>
                <div className="flex items-center gap-3">
                  {(['purple', 'emerald', 'amber', 'blue', 'rose'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        playDropSound();
                        setNewColor(color);
                      }}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                        color === 'purple'
                          ? 'bg-[#284B63]'
                          : color === 'emerald'
                          ? 'bg-[#3C6E71]'
                          : color === 'amber'
                          ? 'bg-[#353535]'
                          : color === 'blue'
                          ? 'bg-[#D9D9D9]'
                          : 'bg-[#FFFFFF]'
                      } ${newColor === color ? 'ring-4 ring-[#3C6E71] scale-110' : 'opacity-80'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    playDropSound();
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#D9D9D9] text-[#353535] font-bold hover:bg-[#D9D9D9]/50"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-black shadow-md active:scale-95"
                >
                  {t('save_hobby', 'Save Hobby')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      <div className="bg-[#FFFFFF] rounded-2xl p-3 border border-[#D9D9D9] flex items-center justify-between text-xs sm:text-sm font-semibold text-[#353535]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#3C6E71]" />
          <span>
            {selectedHobbies.length > 0
              ? `${t('enjoying', 'Enjoying')} ${selectedHobbies.length} ${t('hobbies_today', 'hobbies today')}`
              : t('tap_hobby_prompt', 'Tap a hobby above to celebrate your time')}
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-[#3C6E71] font-bold">
          {t('keep_joy_alive', 'Keep Joy Alive')}
        </span>
      </div>
    </div>
  );
};

