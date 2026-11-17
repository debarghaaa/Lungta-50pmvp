/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PrayerFlags } from './components/PrayerFlags';
import { MountainBackdrop } from './components/MountainBackdrop';
import { DailyRhythmHeader } from './components/DailyRhythmHeader';
import { BreathingCard } from './components/BreathingCard';
import { WalkCard } from './components/WalkCard';
import { WaterCard } from './components/WaterCard';
import { HobbiesCard } from './components/HobbiesCard';
import { ActivityCardsMotion } from './components/activity/ActivityCardsMotion';
import { MoodDiaryView } from './components/MoodDiaryView';
import { GamesView } from './components/GamesView';
import { RemindersView } from './components/RemindersView';
import { FooterBar } from './components/FooterBar';
import { HomeView } from './components/HomeView';
import { NavTab } from './types';
import { setSoundEnabled, isSoundEnabled } from './utils/sound';
import { himalayanMusic } from './utils/himalayanMusic';
import { ACTIVITY_UPDATED_EVENT, getDailyRhythmSummary } from './utils/activityStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('HOME');
  const [seniorMode, setSeniorMode] = useState<boolean>(false);
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());
  const [musicActive, setMusicActive] = useState<boolean>(() => himalayanMusic.getIsPlaying());
  const [rhythmScore, setRhythmScore] = useState<number>(() => getDailyRhythmSummary().rhythmScore);

  const handleNavigate = (tab: NavTab) => {
    if (tab === 'COMMUNITY') return; // Disabled MVP unfinished feature
    setActiveTab(tab);
  };

  // Synchronize sound state (muting sound also pauses Himalayan ambient music)
  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (!next && himalayanMusic.getIsPlaying()) {
      himalayanMusic.stop();
      setMusicActive(false);
    }
  };

  // Synchronize traditional Himalayan music
  const handleToggleMusic = () => {
    if (musicActive) {
      himalayanMusic.stop();
      setMusicActive(false);
    } else {
      if (!soundActive) {
        setSoundActive(true);
        setSoundEnabled(true);
      }
      himalayanMusic.start();
      setMusicActive(true);
    }
  };

  // Listen for global audio state & daily activity rhythm updates
  useEffect(() => {
    const onSoundChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
      if (detail && typeof detail.enabled === 'boolean') {
        setSoundActive(detail.enabled);
        if (!detail.enabled && himalayanMusic.getIsPlaying()) {
          himalayanMusic.stop();
        }
      }
    };

    const onMusicChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ playing: boolean }>).detail;
      if (detail && typeof detail.playing === 'boolean') {
        setMusicActive(detail.playing);
      } else {
        setMusicActive(himalayanMusic.getIsPlaying());
      }
    };

    const refreshRhythmScore = () => {
      setRhythmScore(getDailyRhythmSummary().rhythmScore);
    };

    window.addEventListener('lungta_sound_changed', onSoundChanged);
    window.addEventListener('lungta_himalayan_music_changed', onMusicChanged);
    window.addEventListener(ACTIVITY_UPDATED_EVENT, refreshRhythmScore);
    window.addEventListener('storage', refreshRhythmScore);

    return () => {
      window.removeEventListener('lungta_sound_changed', onSoundChanged);
      window.removeEventListener('lungta_himalayan_music_changed', onMusicChanged);
      window.removeEventListener(ACTIVITY_UPDATED_EVENT, refreshRhythmScore);
      window.removeEventListener('storage', refreshRhythmScore);
      himalayanMusic.stop();
    };
  }, []);

  return (
    <div className={`min-h-screen relative flex flex-col bg-[#FFFFFF] text-[#353535] ${seniorMode ? 'text-lg' : ''}`}>
      {/* Background Scenic Mountain & Sky */}
      <MountainBackdrop />

      {/* Navbar with brand, elderly AA toggle, sound and language */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleNavigate}
        seniorMode={seniorMode}
        onToggleSeniorMode={() => setSeniorMode(!seniorMode)}
        soundEnabled={soundActive}
        onToggleSound={handleToggleSound}
        musicPlaying={musicActive}
        onToggleMusic={handleToggleMusic}
      />

      {/* Traditional Himalayan Prayer Flags Garland */}
      <PrayerFlags />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'ACTIVITY' ? (
          <div className="space-y-8 sm:space-y-10">
            {/* Title Section */}
            <DailyRhythmHeader seniorMode={seniorMode} />

            {/* Isolated Activity Cards Motion System */}
            <ActivityCardsMotion
              primaryCard={
                <BreathingCard
                  seniorMode={seniorMode}
                  musicPlaying={musicActive}
                  onToggleMusic={handleToggleMusic}
                />
              }
              companionCards={[
                {
                  id: 'section-walk',
                  ariaLabel: "Today's Walk",
                  node: <WalkCard seniorMode={seniorMode} />,
                },
                {
                  id: 'section-water',
                  ariaLabel: 'Water Today',
                  node: <WaterCard seniorMode={seniorMode} />,
                },
                {
                  id: 'section-hobbies',
                  ariaLabel: 'My Hobbies',
                  node: <HobbiesCard seniorMode={seniorMode} />,
                },
              ]}
            />
          </div>
        ) : activeTab === 'MOOD' ? (
          <MoodDiaryView seniorMode={seniorMode} />
        ) : activeTab === 'GAMES' ? (
          <GamesView seniorMode={seniorMode} />
        ) : activeTab === 'REMINDERS' ? (
          <RemindersView seniorMode={seniorMode} />
        ) : (
          <HomeView
            seniorMode={seniorMode}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer bar with real computed rhythm score, quote & geographical motif */}
      <FooterBar rhythmScore={rhythmScore} />
    </div>
  );
}
