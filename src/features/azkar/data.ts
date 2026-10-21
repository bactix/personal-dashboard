import type { AzkarPeriod, Dhikr } from "./types";

// Static content (adhkar from Hisn al-Muslim). Entries shared by both times of day are
// defined once; morning/evening-specific wording is defined per period below.

const shared = {
  ayatAlKursi: {
    id: "ayat-al-kursi",
    arabic:
      "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    translation: "Ayat al-Kursi (Quran 2:255).",
    repeat: 1,
  },
  ikhlas: {
    id: "ikhlas",
    arabic:
      "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
    translation: "Surat al-Ikhlas.",
    repeat: 3,
  },
  falaq: {
    id: "falaq",
    arabic:
      "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    translation: "Surat al-Falaq.",
    repeat: 3,
  },
  nas: {
    id: "nas",
    arabic:
      "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
    translation: "Surat an-Nas.",
    repeat: 3,
  },
  sayyidAlIstighfar: {
    id: "sayyid-al-istighfar",
    arabic:
      "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    translation:
      "O Allah, You are my Lord, none has the right to be worshipped but You. You created me and I am Your servant, and I keep Your covenant and promise as best I can. I seek refuge in You from the evil I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins but You.",
    repeat: 1,
  },
  afini: {
    id: "afini",
    arabic:
      "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ",
    translation:
      "O Allah, grant me health in my body, my hearing and my sight. None has the right to be worshipped but You.",
    repeat: 3,
  },
  bismillah: {
    id: "bismillah",
    arabic:
      "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    translation:
      "In the name of Allah, with whose name nothing on earth or in heaven can cause harm; He is the All-Hearing, the All-Knowing.",
    repeat: 3,
  },
  radeetu: {
    id: "radeetu",
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيًّا",
    translation: "I am pleased with Allah as my Lord, Islam as my religion and Muhammad as my Prophet.",
    repeat: 3,
  },
  yaHayyu: {
    id: "ya-hayyu",
    arabic:
      "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
    translation:
      "O Ever-Living, O Sustainer, in Your mercy I seek relief. Set right all my affairs and do not leave me to myself even for the blink of an eye.",
    repeat: 1,
  },
  hasbi: {
    id: "hasbi",
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    translation:
      "Allah is sufficient for me; none has the right to be worshipped but Him. In Him I place my trust, and He is the Lord of the Mighty Throne.",
    repeat: 7,
  },
  tahlil: {
    id: "tahlil",
    arabic:
      "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    translation:
      "None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He is able to do all things.",
    repeat: 10,
  },
  tasbih: {
    id: "tasbih",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    translation: "Glory and praise be to Allah.",
    repeat: 100,
  },
  istighfar: {
    id: "istighfar",
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    translation: "I seek Allah's forgiveness and repent to Him.",
    repeat: 100,
  },
  salawat: {
    id: "salawat",
    arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
    translation: "O Allah, send prayers and peace upon our Prophet Muhammad.",
    repeat: 10,
  },
} satisfies Record<string, Dhikr>;

export const azkar: Record<AzkarPeriod, Dhikr[]> = {
  morning: [
    shared.ayatAlKursi,
    shared.ikhlas,
    shared.falaq,
    shared.nas,
    {
      id: "asbahna",
      arabic:
        "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ: فَتْحَهُ، وَنَصْرَهُ، وَنُورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ",
      translation:
        "We have reached the morning and the dominion belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this day: its victory, its light, its blessing and its guidance; and I seek refuge in You from the evil in it and the evil after it.",
      repeat: 1,
    },
    {
      id: "bika-asbahna",
      arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
      translation:
        "O Allah, by You we reach the morning and by You we reach the evening; by You we live and by You we die, and to You is the resurrection.",
      repeat: 1,
    },
    shared.sayyidAlIstighfar,
    shared.afini,
    shared.bismillah,
    shared.radeetu,
    shared.yaHayyu,
    shared.hasbi,
    {
      id: "ilm-nafi",
      arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا",
      translation:
        "O Allah, I ask You for beneficial knowledge, good provision and accepted deeds.",
      repeat: 1,
    },
    shared.tahlil,
    shared.tasbih,
    shared.istighfar,
    shared.salawat,
  ],
  // Matches the evening azkar infographic, in its order.
  evening: [
    shared.ayatAlKursi,
    {
      id: "ikhlas-muawwidhatayn",
      arabic: `${shared.ikhlas.arabic}\n${shared.falaq.arabic}\n${shared.nas.arabic}`,
      translation: "Surat al-Ikhlas, al-Falaq and an-Nas.",
      repeat: 3,
    },
    {
      id: "amsayna",
      arabic:
        "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
      translation:
        "We have reached the evening and the dominion belongs to Allah. Praise is for Allah; none has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He is able to do all things. My Lord, I ask You for the good of this night and the good after it, and I seek refuge in You from the evil of this night and the evil after it. My Lord, I seek refuge in You from laziness and the evil of old age; my Lord, I seek refuge in You from torment in the Fire and torment in the grave.",
      repeat: 1,
    },
    {
      id: "ushhiduka",
      arabic:
        "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
      translation:
        "O Allah, I have reached the evening and call You, the bearers of Your Throne, Your angels and all Your creation to witness that You are Allah, none has the right to be worshipped but You alone, with no partner, and that Muhammad is Your servant and Messenger.",
      repeat: 4,
    },
    {
      id: "bika-amsayna",
      arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
      translation:
        "O Allah, by You we reach the evening and by You we reach the morning; by You we live and by You we die, and to You is the final return.",
      repeat: 1,
    },
    {
      id: "ma-amsa-bi",
      arabic:
        "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
      translation:
        "O Allah, whatever blessing has come to me or to any of Your creation this evening is from You alone, with no partner; so for You is all praise and thanks.",
      repeat: 1,
    },
    {
      id: "fitra",
      arabic:
        "أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
      translation:
        "We have reached the evening upon the natural religion of Islam, the word of sincere devotion, the religion of our Prophet Muhammad ﷺ and the creed of our father Ibrahim, upright and Muslim, and he was not of the polytheists.",
      repeat: 1,
    },
    shared.sayyidAlIstighfar,
    {
      id: "alim-al-ghayb",
      arabic:
        "اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ",
      translation:
        "O Allah, Knower of the unseen and the seen, Originator of the heavens and the earth, Lord and Sovereign of all things: I bear witness that none has the right to be worshipped but You. I seek refuge in You from the evil of my soul, from the evil of Satan and his shirk, and from doing wrong to myself or bringing it upon another Muslim.",
      repeat: 1,
    },
    {
      id: "afw-wal-afiya",
      arabic:
        "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي",
      translation:
        "O Allah, I ask You for pardon and well-being in this world and the next; in my religion, my worldly affairs, my family and my wealth. O Allah, conceal my faults and calm my fears. O Allah, protect me from before me, behind me, my right, my left and above me, and I seek refuge in Your greatness from being swallowed up from beneath me.",
      repeat: 1,
    },
    {
      id: "kalimat-tammat",
      arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
      translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
      repeat: 3,
    },
    shared.bismillah,
    shared.radeetu,
    {
      id: "tasbih-adad",
      arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
      translation:
        "Glory and praise be to Allah, as many times as the number of His creation, as pleases Him, as heavy as His Throne and as vast as the ink of His words.",
      repeat: 3,
    },
    shared.afini,
    shared.hasbi,
    shared.tasbih,
    shared.salawat,
    { ...shared.tahlil, repeat: 100 },
  ],
};
