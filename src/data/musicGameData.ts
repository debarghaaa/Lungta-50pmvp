import { MusicTune, SoundImageQuestion } from '../types';

export interface TuneRecognitionQuestion {
  id: string;
  level: 1 | 2 | 3;
  levelTitle: string;
  targetTune: MusicTune;
  choices: MusicTune[];
}

// -------------------------------------------------------------
// MODE 1: TUNE RECOGNITION DATA (Levels 1, 2, 3)
// -------------------------------------------------------------
export const TUNE_RECOGNITION_QUESTIONS: TuneRecognitionQuestion[] = [
  // LEVEL 1: Distinct traditional timbres
  {
    id: 'tr-lvl1-q1',
    level: 1,
    levelTitle: 'Gentle • Distinct Mountain Instruments',
    targetTune: {
      id: 'tune-flute-dawn',
      title: 'Bansuri Dawn Over Khangchendzonga',
      region: 'Sikkim Alpine Valleys',
      instrumentName: 'Bamboo Bansuri Flute',
      instrumentEmoji: '🎋',
      tuneType: 'flute_dawn',
      description: 'Soaring morning bamboo flute melody carrying fresh mountain air.',
      audioDurationSec: 6,
    },
    choices: [
      {
        id: 'tune-flute-dawn',
        title: 'Bansuri Dawn Over Khangchendzonga',
        region: 'Sikkim Alpine Valleys',
        instrumentName: 'Bamboo Bansuri Flute',
        instrumentEmoji: '🎋',
        tuneType: 'flute_dawn',
        description: 'Morning bamboo flute melody over snowy ridgelines.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-bell-monastery',
        title: 'Rumtek Monastery Bronze Bell',
        region: 'Rumtek Sanctuary',
        instrumentName: 'Bronze Temple Bell & Drone',
        instrumentEmoji: '🔔',
        tuneType: 'bell_drone',
        description: 'Deep resonant bronze bell with sustained meditative chant overtones.',
        audioDurationSec: 7,
      },
      {
        id: 'tune-harp-murchunga',
        title: 'Lepcha Bamboo Mouth Harp',
        region: 'Dzongu Forest Foothills',
        instrumentName: 'Bamboo Mouth Harp (Murchunga)',
        instrumentEmoji: '🪵',
        tuneType: 'mouth_harp',
        description: 'Rhythmic, bouncing acoustic twangs vibrating against the mouth.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-strings-mist',
        title: 'Darjeeling Pine Mist Acoustic Pluck',
        region: 'Tea Ridge Foothills',
        instrumentName: 'Mountain Sarangi Strings',
        instrumentEmoji: '🪕',
        tuneType: 'strings_sarangi',
        description: 'Acoustic plucked strings echoing gently across green hills.',
        audioDurationSec: 6,
      },
    ],
  },
  {
    id: 'tr-lvl1-q2',
    level: 1,
    levelTitle: 'Gentle • Distinct Mountain Instruments',
    targetTune: {
      id: 'tune-bell-monastery',
      title: 'Rumtek Monastery Bronze Bell',
      region: 'Rumtek Sanctuary',
      instrumentName: 'Bronze Temple Bell & Drone',
      instrumentEmoji: '🔔',
      tuneType: 'bell_drone',
      description: 'Deep resonant bronze bell with sustained meditative chant overtones.',
      audioDurationSec: 7,
    },
    choices: [
      {
        id: 'tune-harp-murchunga',
        title: 'Lepcha Bamboo Mouth Harp',
        region: 'Dzongu Forest Foothills',
        instrumentName: 'Bamboo Mouth Harp (Murchunga)',
        instrumentEmoji: '🪵',
        tuneType: 'mouth_harp',
        description: 'Rhythmic acoustic twangs.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-bell-monastery',
        title: 'Rumtek Monastery Bronze Bell',
        region: 'Rumtek Sanctuary',
        instrumentName: 'Bronze Temple Bell & Drone',
        instrumentEmoji: '🔔',
        tuneType: 'bell_drone',
        description: 'Deep resonant bronze bell and drone.',
        audioDurationSec: 7,
      },
      {
        id: 'tune-flute-dawn',
        title: 'Bansuri Dawn Over Khangchendzonga',
        region: 'Sikkim Alpine Valleys',
        instrumentName: 'Bamboo Bansuri Flute',
        instrumentEmoji: '🎋',
        tuneType: 'flute_dawn',
        description: 'Morning bamboo flute melody.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-strings-mist',
        title: 'Darjeeling Pine Mist Acoustic Pluck',
        region: 'Tea Ridge Foothills',
        instrumentName: 'Mountain Sarangi Strings',
        instrumentEmoji: '🪕',
        tuneType: 'strings_sarangi',
        description: 'Acoustic plucked strings.',
        audioDurationSec: 6,
      },
    ],
  },

  // LEVEL 2: Moderate • Similar Wind & Bamboo Flute Melodies
  {
    id: 'tr-lvl2-q1',
    level: 2,
    levelTitle: 'Moderate • Comparing Wind & Bamboo Flutes',
    targetTune: {
      id: 'tune-flute-evening',
      title: 'Deep Valley Evening Bansuri',
      region: 'Teesta River Basin',
      instrumentName: 'Low Pitch Bass Bansuri',
      instrumentEmoji: '🎋',
      tuneType: 'flute_evening',
      description: 'Deep, warm, low-register flute notes capturing the quiet twilight.',
      audioDurationSec: 6,
    },
    choices: [
      {
        id: 'tune-flute-dawn',
        title: 'High Dawn Soaring Bansuri',
        region: 'Snow Peak Pass',
        instrumentName: 'High Bamboo Flute',
        instrumentEmoji: '🎋',
        tuneType: 'flute_dawn',
        description: 'Bright, soaring high-register rising dawn notes.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-flute-evening',
        title: 'Deep Valley Evening Bansuri',
        region: 'Teesta River Basin',
        instrumentName: 'Low Pitch Bass Bansuri',
        instrumentEmoji: '🎋',
        tuneType: 'flute_evening',
        description: 'Deep, warm, low-register flute notes capturing the quiet twilight.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-flute-breeze',
        title: 'Alpine Breeze Flutter Bansuri',
        region: 'Nathula Wind Ridge',
        instrumentName: 'Flutter-Tongue Bamboo Flute',
        instrumentEmoji: '🌬️',
        tuneType: 'flute_breeze',
        description: 'Rapid, playful staccato trills mimicking pine breeze.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-flute-prayer',
        title: 'Forest Hermitage Prayer Flute',
        region: 'Tashiding Forest',
        instrumentName: 'Meditative Breath Flute',
        instrumentEmoji: '🧘',
        tuneType: 'flute_prayer',
        description: 'Slow, peaceful long breath tones echoing through prayer flags.',
        audioDurationSec: 6,
      },
    ],
  },

  // LEVEL 3: Refined • Similar Plucked Acoustic Mountain Strings
  {
    id: 'tr-lvl3-q1',
    level: 3,
    levelTitle: 'Mindful • Subtle Folk String Melodies',
    targetTune: {
      id: 'tune-strings-waltz',
      title: 'Hill Station 3/4 Sarangi Lilt',
      region: 'Kalimpong Hill Slopes',
      instrumentName: 'Plucked Sarangi Waltz',
      instrumentEmoji: '🎻',
      tuneType: 'strings_waltz',
      description: 'Rhythmic, gentle 3/4 lilt played on warm acoustic strings.',
      audioDurationSec: 6,
    },
    choices: [
      {
        id: 'tune-strings-sarangi',
        title: 'Morning Arpeggio Sarangi',
        region: 'Tea Ridge',
        instrumentName: 'Ascending Sarangi Plucks',
        instrumentEmoji: '🪕',
        tuneType: 'strings_sarangi',
        description: 'Bright ascending morning arpeggios.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-strings-waltz',
        title: 'Hill Station 3/4 Sarangi Lilt',
        region: 'Kalimpong Hill Slopes',
        instrumentName: 'Plucked Sarangi Waltz',
        instrumentEmoji: '🎻',
        tuneType: 'strings_waltz',
        description: 'Rhythmic, gentle 3/4 lilt played on warm acoustic strings.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-strings-dramyin',
        title: 'Himalayan Dramyin Lute Strum',
        region: 'Tibetan Border Plateau',
        instrumentName: 'Six-String Dramyin Lute',
        instrumentEmoji: '🎸',
        tuneType: 'strings_dramyin',
        description: 'Rhythmic double-strums on traditional carved wooden lute.',
        audioDurationSec: 6,
      },
      {
        id: 'tune-strings-lullaby',
        title: 'Pine Forest Descending Lullaby',
        region: 'Lachen Conifer Woods',
        instrumentName: 'Acoustic Mountain Pluck',
        instrumentEmoji: '🌲',
        tuneType: 'strings_lullaby',
        description: 'Soft, slow descending acoustic notes soothing the mind.',
        audioDurationSec: 6,
      },
    ],
  },
];

// -------------------------------------------------------------
// MODE 2: SOUND → IMAGE DATA (Levels 1, 2, 3)
// -------------------------------------------------------------
export const SOUND_IMAGE_QUESTIONS: SoundImageQuestion[] = [
  // LEVEL 1: Everyday & Nature Sounds (Distinct visual & sound types)
  {
    id: 'si-lvl1-water-balloon',
    level: 1,
    spokenWord: 'Water Balloon',
    soundType: 'water_balloon',
    soundLabel: 'Playful water balloon pop & splash',
    difficulty: 1,
    targetChoiceId: 'choice-water-balloon',
    culturalHint: 'Listen for the joyful rubber pop followed by a quick splashing burst of water.',
    choices: [
      {
        id: 'choice-water-balloon',
        label: 'Water Balloon',
        sublabel: 'Playful splash of cool water',
        emoji: '🎈',
        imageUrl:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-temple-bell',
        label: 'Temple Bell',
        sublabel: 'Monastery bronze chime',
        emoji: '🔔',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-singing-bird',
        label: 'Mountain Songbird',
        sublabel: 'Chirping alpine lark',
        emoji: '🐦',
        imageUrl:
          'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-rain-leaves',
        label: 'Rain on Leaves',
        sublabel: 'Gentle droplets falling',
        emoji: '🌧️',
        imageUrl:
          'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'si-lvl1-temple-bell',
    level: 1,
    spokenWord: 'Temple Bell',
    soundType: 'temple_bell',
    soundLabel: 'Deep resonant monastery bell ring',
    difficulty: 1,
    targetChoiceId: 'choice-temple-bell',
    culturalHint: 'Listen for the sacred bronze gong strike echoing with rich harmonics.',
    choices: [
      {
        id: 'choice-singing-bird',
        label: 'Mountain Songbird',
        sublabel: 'Chirping alpine lark',
        emoji: '🐦',
        imageUrl:
          'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-temple-bell',
        label: 'Temple Bell',
        sublabel: 'Monastery bronze chime',
        emoji: '🔔',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-water-balloon',
        label: 'Water Balloon',
        sublabel: 'Playful splash of cool water',
        emoji: '🎈',
        imageUrl:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-mountain-river',
        label: 'Mountain River',
        sublabel: 'Clear rushing glacial stream',
        emoji: '🌊',
        imageUrl:
          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'si-lvl1-singing-bird',
    level: 1,
    spokenWord: 'Singing Bird',
    soundType: 'singing_bird',
    soundLabel: 'Cheerful mountain lark chirping',
    difficulty: 1,
    targetChoiceId: 'choice-singing-bird',
    culturalHint: 'Listen for the sweet, melodic chirps of birds welcoming the morning sun.',
    choices: [
      {
        id: 'choice-water-balloon',
        label: 'Water Balloon',
        sublabel: 'Playful splash of water',
        emoji: '🎈',
        imageUrl:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-rain-leaves',
        label: 'Gentle Rain',
        sublabel: 'Droplets on pine leaves',
        emoji: '🌧️',
        imageUrl:
          'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-singing-bird',
        label: 'Singing Bird',
        sublabel: 'Colorful Himalayan songbird',
        emoji: '🐦',
        imageUrl:
          'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-temple-bell',
        label: 'Temple Bell',
        sublabel: 'Bronze monastery chime',
        emoji: '🔔',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // LEVEL 2: Moderate • Flowing Nature & Chimes (More similar sound textures)
  {
    id: 'si-lvl2-mountain-stream',
    level: 2,
    spokenWord: 'Mountain Stream',
    soundType: 'mountain_stream',
    soundLabel: 'Gurgling, babbling alpine meltwater stream',
    difficulty: 2,
    targetChoiceId: 'choice-mountain-stream',
    culturalHint: 'Notice the continuous, bubbling flow of pristine alpine river stones.',
    choices: [
      {
        id: 'choice-mountain-stream',
        label: 'Mountain River',
        sublabel: 'Gurgling clear alpine stream',
        emoji: '🌊',
        imageUrl:
          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-rain-leaves',
        label: 'Rain on Leaves',
        sublabel: 'Soft pitter-patter drops',
        emoji: '🌧️',
        imageUrl:
          'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-water-balloon',
        label: 'Water Balloon',
        sublabel: 'Sudden splash bursting',
        emoji: '🎈',
        imageUrl:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-butter-tea',
        label: 'Butter Tea Pot',
        sublabel: 'Warm churned tea bowl',
        emoji: '☕',
        imageUrl:
          'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'si-lvl2-wind-chimes',
    level: 2,
    spokenWord: 'Wind Chimes',
    soundType: 'wind_chimes',
    soundLabel: 'Tinkling bamboo and brass breeze chimes',
    difficulty: 2,
    targetChoiceId: 'choice-wind-chimes',
    culturalHint: 'Listen for gentle, high-pitched harmonic bells swaying in the valley wind.',
    choices: [
      {
        id: 'choice-singing-bird',
        label: 'Singing Bird',
        sublabel: 'Melodic mountain chirps',
        emoji: '🐦',
        imageUrl:
          'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-wind-chimes',
        label: 'Wind Chimes',
        sublabel: 'Brass bells swaying softly',
        emoji: '🎐',
        imageUrl:
          'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-yak-bell',
        label: 'Yak Collar Bell',
        sublabel: 'Heavy brass mountain bell',
        emoji: '🐂',
        imageUrl:
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-temple-bell',
        label: 'Temple Bell',
        sublabel: 'Large bronze sanctuary gong',
        emoji: '🔔',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // LEVEL 3: Mindful • Highly Nuanced Himalayan Heritage (Metals & Traditional Tools)
  {
    id: 'si-lvl3-yak-bell',
    level: 3,
    spokenWord: 'Yak Bell',
    soundType: 'yak_bell',
    soundLabel: 'Rustic dual clanking of brass mountain yak bell',
    difficulty: 3,
    targetChoiceId: 'choice-yak-bell',
    culturalHint: 'Listen for the hollow, rhythmic brass clank worn by gentle yaks on mountain trails.',
    choices: [
      {
        id: 'choice-yak-bell',
        label: 'Yak with Brass Bell',
        sublabel: 'High mountain grazers',
        emoji: '🐂',
        imageUrl:
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-temple-bell',
        label: 'Monastery Gong Bell',
        sublabel: 'Resonant bronze sanctuary bell',
        emoji: '🔔',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-singing-bowl',
        label: 'Tibetan Singing Bowl',
        sublabel: 'Pure 432Hz meditative hum',
        emoji: '🥣',
        imageUrl:
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-wind-chimes',
        label: 'Swaying Wind Chimes',
        sublabel: 'Tinkling breeze bells',
        emoji: '🎐',
        imageUrl:
          'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'si-lvl3-butter-tea',
    level: 3,
    spokenWord: 'Butter Tea Churn',
    soundType: 'butter_tea',
    soundLabel: 'Rhythmic wooden plunger thud & churning tea slosh',
    difficulty: 3,
    targetChoiceId: 'choice-butter-tea',
    culturalHint: 'Listen for the steady wooden thud and rich slosh of freshly churned Himalayan Po Cha.',
    choices: [
      {
        id: 'choice-mountain-stream',
        label: 'Mountain Stream',
        sublabel: 'Cascading alpine water',
        emoji: '🌊',
        imageUrl:
          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-butter-tea',
        label: 'Butter Tea Churn',
        sublabel: 'Wooden churn and warm tea',
        emoji: '☕',
        imageUrl:
          'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-water-balloon',
        label: 'Water Splash',
        sublabel: 'Playful bursting water',
        emoji: '🎈',
        imageUrl:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'choice-rain-leaves',
        label: 'Rain on Tin Roof',
        sublabel: 'Gentle rhythmic drops',
        emoji: '🌧️',
        imageUrl:
          'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];
