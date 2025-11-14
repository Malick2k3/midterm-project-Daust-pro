export const CALCULATION_METHODS = [
  { id: 0, name: 'Shia Ithna-Ansari', shortName: 'Shia' },
  { id: 1, name: 'University of Islamic Sciences, Karachi', shortName: 'Karachi' },
  { id: 2, name: 'Islamic Society of North America (ISNA)', shortName: 'ISNA' },
  { id: 3, name: 'Muslim World League (MWL)', shortName: 'MWL' },
  { id: 4, name: 'Umm al-Qura, Makkah', shortName: 'Umm al-Qura' },
  { id: 5, name: 'Egyptian General Authority of Survey', shortName: 'Egypt' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran', shortName: 'Tehran' },
  { id: 8, name: 'Gulf Region', shortName: 'Gulf' },
  { id: 9, name: 'Kuwait', shortName: 'Kuwait' },
  { id: 10, name: 'Qatar', shortName: 'Qatar' },
  { id: 11, name: 'Majlis Ugama Islam Singapura, Singapore', shortName: 'Singapore' },
  { id: 12, name: 'Union Organization islamic de France', shortName: 'France' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey', shortName: 'Turkey' },
  { id: 14, name: 'Spiritual Administration of Muslims of Russia', shortName: 'Russia' },
  { id: 15, name: 'Moonsighting Committee Worldwide (Moonsighting.com)', shortName: 'Moonsighting' },
  { id: 16, name: 'Dubai (unofficial)', shortName: 'Dubai' },
  { id: 17, name: 'Kuala Lumpur (unofficial)', shortName: 'Kuala Lumpur' },
  { id: 18, name: 'Jakarta (unofficial)', shortName: 'Jakarta' },
  { id: 19, name: 'Islamic Society of North America (ISNA)', shortName: 'ISNA 2' },
  { id: 20, name: 'Muslim World League (MWL)', shortName: 'MWL 2' },
];

export const DEFAULT_METHOD = CALCULATION_METHODS.find(method => method.id === 2); // ISNA
