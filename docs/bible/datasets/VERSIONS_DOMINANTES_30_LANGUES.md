# Versions dominantes par langue — 30 langues prioritaires

> **Date** : 2026-10-04
> **Mission** : Pour chaque langue des 30 prioritaires (P1/P2/P3), identifier la version
> de la Bible **dominante et réellement récitée/mémorisée** par la communauté locale,
> sous **libre accès** uniquement (PD / CC0 / CC-BY — sans NC ni SA).
>
> **Règle de licence (non négociable, cf. `SCRAPE_PLAN.md`)** :
> - PD (Public Domain), CC0, CC-BY → **acceptés**
> - CC-BY-SA, CC-BY-NC, CC-BY-ND → **exclus** (share-alike / non-commerciaux inacceptables)
> - Versions propriétaires (Lockman, SBB, NIV, ESV, KOB, RVR-1960, GNB, LSG-21, NIV-PT,
>   SBL, BSB, CBOL, TLA, HINDI 1967, KRV-1930…) → **jamais**
>
> **Critère de choix** : version que la communauté locale utilise pour réciter/mémoriser,
> pas simplement la version la plus couvrante.

---

## Légende des statuts

| Statut | Signification |
|---|---|
| `ready` | USFM 66/66 téléchargé dans `data/bible/raw/`, licence PD/CC-BY confirmée, prêt à `bible:build` |
| `ready-SA` | USFM 66/66 téléchargé, licence CC BY-SA (exclure par politique, conserver à titre documentaire si politique évolue) |
| `incomplete` | USFM partiel (< 66/66) téléchargé, non constructible sans archive complète |
| `à trouver` | pas d'USFM complet libre accessible à ce jour ; identifier source ou version alternative |
| `exclu-licence` | version dominante est sous licence restrictive (ND/NC/propriétaire) ; substitut libre à chercher |
| `catalog-existant` | déjà dans `dataset-catalog.json` (construit ou pending) |

---

## P1 — Asie / Inde

### 1. Chinois traditionnel (zh-Hant) — ~230 M

- **Version dominante et récitée** : 和合本 (CUV, Chuhe-ho / Union Version, 1919)
- **Libre accès ?** : le CUV original 1919 est PD aux États-Unis ; les éditions ré-imprimées
  (cu89t sur eBible) sont clairement marquées *Public Domain* → **PD ✅**
- **Source USFM** : `cmn-cu89t` eBible — `https://ebible.org/Scriptures/cmn-cu89t_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/zh-hant/cmn-cu89t_usfm/`
- **Statut** : `ready` (PD, 66/66)
- **Effort estimé** : petit
- **Note** : pour le chinois **simplifié**, le `cmn-uvs` / `cmnswcb` existant dans le catalogue
  reste pertinent ; ici on traite spécifiquement le traditionnel (Taïwan / diaspora HK).

### 2. Japonais (ja) — ~120 M

- **Version dominante et récitée** : 改訳 (Kaikyaku / Revised 1954-1960) ou 新改訳 (Shin-Kaikyaku 2002)
- **Libre accès ?** : le Kaikyaku (Shinkaiyaku) 1965 est PD (copyright tombé en 2015) ;
  `jpn1965` sur eBible = **PD ✅** mais archive eBible incomplète (27/66)
- **Source USFM** : `jpn1965` eBible — `https://ebible.org/Scriptures/jpn1965_usfm.zip`
- **Format** : USFM, 27/66 (NT seulement) — **incomplet**
- **Statut** : `incomplete` (rechercher archive 66/66 du Shin-Kaikyaku 1954 via gBible/unfda)
- **Effort estimé** : moyen
- **Note** : le `jp-freedom` (Freedom Bible 2017, PD, 66/66) existe déjà dans le catalogue ;
  c'est une version « open resource » Biblica, pas la version la plus récitée. Le choix
  recommandé reste le Shinkaiyaku (1965) pour la fidélité au texte récité — à localiser.

### 3. Coréen (ko) — ~80 M

- **Version dominante et récitée** : 1910 한문-한글판 (hanmun-Han-gulp'an, première traduction
  complète en hangul) — version classique récitée
- **Libre accès ?** : eBible `kor` (Korean 1910) est marqué **Public Domain ✅**
- **Source USFM** : `kor` eBible — `https://ebible.org/Scriptures/kor_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/ko/kor_usfm/`
- **Statut** : `catalog-existant` (`ko-1910` déjà construit, 30 991 versets)
- **Effort estimé** : n/a (déjà fait)
- **Note** : la version moderne la plus utilisée est le 개역개정 (Koryeokkegyaeng 1961, KOB)
  — **propriétaire / exclue**. Le KOB 1961 est donc à éviter ; le 1910 reste la seule
  version « récitée » libre.

### 4. Thaï (th) — ~70 M

- **Version dominante et récitée** : พระคัมภีรไทยฉบับ KJV (Thai KJV, thafb/thaKJV)
- **Libre accès ?** : `thaKJV` / `thakjv` (Philip Pope, 2003) est **CC BY-NC-ND 4.0**
  → **exclue** (NC + ND)
- **Source USFM** : `thafb` (Thai Freedom) = **PD ✅** mais 46/66 (incomplet)
- **Format** : USFM 46/66 — `data/bible/raw/th/thafb_usfm/`
- **Statut** : `incomplete` (thaKJV exclue licence ; thafb PD mais partiel)
- **Effort estimé** : gros (rechercher une version thaï complète 66/66 PD ou CC-BY)
- **Note** : la version officielle complète « พระคัมภีรภาษาไทยฉบับ 2550 » (Thai 2007)
  est sous copyright de la Société Biblique de Thaïlande — à proscrire.

### 5. Vietnamien (vi) — ~100 M

- **Version dominante et récitée** : Kinh Thánh 1925 (Bản Dịch 1925 / « Vieille Version »
  protestante, encore très largement récitée)
- **Libre accès ?** : NT publié 1923 → PD permanent le 1ᵉʳ janvier 2019 ;
  OT publié 1925 → PD le 1ᵉʳ janvier 2021. **PD ✅**
- **Source USFM** : `vie1934` eBible (Vietnamese Bible 1923)
  — `https://ebible.org/Scriptures/vie1934_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/vi/vie1934_usfm/`
- **Statut** : `ready` (PD, 66/66)
- **Effort estimé** : petit
- **Note** : la version contemporaine la plus lue est le Bản Hiện Đại (OCB, Biblica 2015)
  → **CC BY-SA (exclue)** ; le 1925 est l'option récitée libre.

### 6. Indonésien (id) / Malais (ms) — ~280 M + ~30 M

- **Version dominante et récitée** : Alkitab (Indonesien, TB 1974 / Terjemahan Baru, LAI)
- **Libre accès ?** : la TB 1974 est sous copyright de LAI (Lembaga Alkitab Indonesia)
  → **propriétaire, exclue**. eBible `ind` (Alkitab BahasaKita, 2021) = **CC BY-SA (exclue)**
- **Source USFM** : `indags` (Alkitab Gratis, CC BY-SA, NT seulement 27/66)
  — `https://ebible.org/Scriptures/indags_usfm.zip`
- **Format** : USFM 27/66 — `data/bible/raw/id/indags_usfm/`
- **Statut** : `exclu-licence` (pas d'option 66/66 libre identifiée)
- **Effort estimé** : gros (rechercher une traduction indonésienne PD pré-1928, ou négocier)
- **Note** : pour le malais (ms), même situation ; en Malaisie on récite aussi l'
  Al-Quran + Bible « Alkitab Bahasa Melayu » sous copyright BKM (Biro Kitab Melayu).

### 7. Birman (my) — ~45 M

- **Version dominante et récitée** : Judson Burmese Bible (1956) — myajvb
- **Libre accès ?** : `myajvb` eBible = **Public Domain ✅**
- **Source USFM** : `myajvb` eBible — `https://ebible.org/Scriptures/myajvb_usfm.zip`
- **Format** : USFM, 66/66
- **Statut** : `ready` (PD, 66/66) — télécharger
- **Effort estimé** : petit
- **Note** : `mya` (Burmese Common Language / 2005 ULB, CC BY-SA) = **exclue licence** ;
  on retient le Judson 1956 PD.

### 8. Khmer (km) — ~17 M

- **Version dominante et récitée** : Khmer Standard Version 2005 (ព្រះគម្ពីរខ្មែរបច្ចុប្បន្ន ២០០៥)
- **Libre accès ?** : `khm` eBible (Khmer 2005) = **copyright UBS/Bible Society in Cambodia,
  exclue** ; `khm-h` (Khmer Hammond 1954/1962) = **copyright UBS 1954/1962, exclue**
- **Source USFM** : les 2 entrées eBible (`khm`, `khm-h`) ne sont pas téléchargeables en
  USFM libre (restrictées, copyright) — `khs` (Khmer Standard 2016) = CC BY-NC-ND (exclue)
- **Format** : USFM (pas d'archive libre complète identifiée)
- **Statut** : `exclu-licence`
- **Effort estimé** : gros (rechercher une version khmère PD pré-1954 ou CC-BY)
- **Note** : en Khmer, la version la plus récitée est le Standard 2005 (nouveau),
  mais elle est protégée. Pas de substitut libre 66/66 identifié à ce jour.

### 9. Lao (lo) — ~3 M

- **Version dominante et récitée** : Lao KJV (lao)
- **Libre accès ?** : pas de version lao libre complète identifiée sur eBible/gBible
- **Source USFM** : à trouver sur unfda / gbible
- **Format** : USFM (à localiser)
- **Statut** : `à trouver`
- **Effort estimé** : gros

### 10. Népali (ne) — ~25 M

- **Version dominante et récitée** : पवित्र बाइबल (Nepali Bible, 1954/1986 UBS)
- **Libre accès ?** : `npiulb` eBible (ULB Nepali, 2019) = **CC BY-SA (exclue)** ;
  l'édition UBS 1954 est sous copyright UBS
- **Source USFM** : `npiulb` eBible — `https://ebible.org/Scriptures/npiulb_usfm.zip`
- **Format** : USFM, 66/66
- **Statut** : `ready-SA` (CC BY-SA, 66/66) — conserver comme référence si politique SA évolue
- **Effort estimé** : petit (si SA accepté) / gros (sinon rechercher version PD)
- **Note** : version locale la plus récitée ; pas d'option 66/66 PD/CC-BY stricte identifiée.

### 11. Bengali (bn) — ~260 M

- **Version dominante et récitée** : IRV Bengalî (ইন্ডিয়ান রিভাইজড ভার্সন, 2018-2019)
- **Libre accès ?** : `benirv` eBible = **CC BY-SA 4.0 (exclue)** ;
  l'édition originale 1923 est PD mais difficile à sourcer en USFM
- **Source USFM** : `benirv` eBible — `https://ebible.org/Scriptures/benirv_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/bn/benirv_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté) / moyen (rechercher une édition PD)
- **Note** : même situation que le hi/ta/te (IRV 2017-2019 Bridge Connectivity = CC BY-SA).

### 12. Hindi (hi) — ~350 M

- **Version dominante et récitée** : हिन्दी IRV 2019 (hin2017, Indian Revised Version)
- **Libre accès ?** : `hin2017` eBible = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `hin2017` eBible — `https://ebible.org/Scriptures/hin2017_usfm.zip`
- **Format** : USFM, 66/66
- **Statut** : `catalog-existant` (`hi-irv` déjà construit, 31 103 versets)
- **Effort estimé** : n/a (déjà fait, licence SA — à noter dans le catalogue comme exception
  déjà acceptée)
- **Note** : le catalogue contient déjà `hi-irv` (CC BY-SA, accepté historiquement) ;
  le présent audit en reprend la licence mais recommande de ne pas créer de nouveaux
  datasets CC BY-SA tant que la politique n'évolue pas.

### 13. Tamoul (ta) — ~70 M

- **Version dominante et récitée** : தமிழ் IRV 2017 (tam2017, Tamil Indian Revised Version)
- **Libre accès ?** : `tam2017` eBible = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `tam2017` eBible — `https://ebible.org/Scriptures/tam2017_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/ta/tam_irv2017_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 14. Télougou (te) — ~85 M

- **Version dominante et récitée** : తెలుగు IRV 2017 (tel2017, Telugu IRV)
- **Libre accès ?** : `tel2017` eBible = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `tel2017` eBible — `https://ebible.org/Scriptures/tel2017_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/te/tel2017_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 15. Malayalam (ml) — ~37 M

- **Version dominante et récitée** : മലയാളം IRV (mal, Malayalam IRV 2017)
- **Libre accès ?** : `mal` eBible = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `mal` eBible — `https://ebible.org/Scriptures/mal_usfm.zip`
- **Format** : USFM, 66/66
- **Statut** : `catalog-existant` (`ml-irv` déjà construit)
- **Effort estimé** : n/a (déjà fait)

### 16. Sinhalais (si) — ~17 M

- **Version dominante et récitée** : සිංහල බයිබল (Bible Society of Ceylon, 1955/1986)
- **Libre accès ?** : eBible n'a pas d'entrée sinhalaise complète ;
  l'édition 1955 est sous copyright de la Bible Society of Ceylon → **exclue**
- **Source USFM** : à trouver (unfda / gbible)
- **Format** : USFM (à localiser)
- **Statut** : `à trouver`
- **Effort estimé** : gros

### 17. Ourdou (ur) — ~230 M

- **Version dominante et récitée** : اردو IRV 2019 (urd, Urdu IRV)
- **Libre accès ?** : `urd` eBible = **CC BY-SA 4.0 (exclue)** ;
  l'édition UBS 1959/1992 est sous copyright UBS
- **Source USFM** : `urd` eBible — `https://ebible.org/Scriptures/urd_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/ur/urd_irv_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 18. Pachtô (ps) — ~45 M

- **Version dominante et récitée** : پښتو بائبل (Pushto Bible)
- **Libre accès ?** : pas de version complète libre identifiée sur eBible/gBible
- **Source USFM** : à trouver (unfda)
- **Format** : USFM (à localiser)
- **Statut** : `à trouver`
- **Effort estimé** : gros

### 19. Sindhi (sd) — ~30 M

- **Version dominante et récitée** : سنڌي بائبل (Sindhi Bible, UBS / Bible Society of Pakistan)
- **Libre accès ?** : sous copyright de la Bible Society of Pakistan → **exclue**
- **Source USFM** : à trouver
- **Format** : USFM (à localiser)
- **Statut** : `à trouver`
- **Effort estimé** : gros

---

## P2 — Afrique

### 20. Yoruba (yo) — ~45 M

- **Version dominante et récitée** : Yoruba ULB / Yoruba Open Readable Bible 2017 (yor)
- **Libre accès ?** : `yor` eBible = **CC BY-SA 4.0 (exclue)** ;
  les éditions 1953/1977 UBS sont sous copyright UBS
- **Source USFM** : `yor` eBible — `https://ebible.org/Scriptures/yor_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/yo/yor_ulb_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 21. Igbo (ig) — ~35 M

- **Version dominante et récitée** : Igbo ULB 2020 (ibo, Open Readable Bible)
- **Libre accès ?** : `ibo` eBible = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `ibo` eBible — `https://ebible.org/Scriptures/ibo_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/ig/ibo_ulb_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 22. Haoussa (ha) — ~50 M

- **Version dominante et récitée** : Hausa ULB 2009/2020 (hauulb / hausa)
- **Libre accès ?** : `hausa` eBible = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `hausa` eBible — `https://ebible.org/Scriptures/hausa_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/ha/hau_ulb_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 23. Sotho du Sud (st) — ~15 M

- **Version dominante et récitée** : Sesotho ULB / Open Sesotho NT+ (swhonen)
- **Libre accès ?** : `swhonen` eBible = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `swhonen` eBible — `https://ebible.org/Scriptures/swhonen_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/st/swhonen_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 24. Tswana (tw) — ~15 M

- **Version dominante et récitée** : Setswana ULB 2020 (tsn, « Open Tswana »)
- **Libre accès ?** : `tsn` eBible = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `tsn` eBible — `https://ebible.org/Scriptures/tsn_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/tw/tsn_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 25. Amharique (am) — ~35 M

- **Version dominante et récitée** : ክርስቶናዊ መስሕፍ (Amharic UBS, 1962/2003)
- **Libre accès ?** : `amh` eBible = **copyright UBS 1962/2003, non-libre** ;
  eBible précise « non-commercial work only »
- **Source USFM** : `amh` eBible — `https://ebible.org/Scriptures/amh_usfm.zip`
- **Format** : USFM, 27/66 (NT seulement) — `data/bible/raw/am/amh_ulb_usfm/`
- **Statut** : `incomplete` + `exclu-licence` (27/66 et licence non-libre)
- **Effort estimé** : gros (rechercher une version amharique complète PD)

---

## P3 — Europe / Moyen-Orient / Autres

### 26. Polonais (pl) — ~40 M

- **Version dominante et récitée** : Biblia Tysiąclecia (Bible du Millénaire, 2003)
- **Libre accès ?** : **copyright CECH (Éditions du Conseil Épiscopal), exclue** ;
  les versions libres existantes sont des éditions antérieures (Gdańska 1563, Wujek 1793)
  moins « récitées » aujourd'hui
- **Source USFM** : `polubg` (Polish UB Gdańsk, CC BY-ND — **exclue ND**);
  `pol` (Polish Słowo Życia, CC BY-SA — **exclue SA**)
- **Format** : USFM (polubg téléchargé dans `data/bible/raw/pl/pol_ubg_usfm/`)
- **Statut** : `exclu-licence` (aucune version libre complète + actuelle)
- **Effort estimé** : gros
- **Note** : si on accepte de décaler vers une version « récitée mais plus ancienne »,
  la Gdańska 1563 (PD) est une option historique mais pas la version actuelle dominante.

### 27. Turc (tr) — ~85 M

- **Version dominante et récitée** : Diyanet İşleri Başkanlığı Meali (traduction officielle
  turque, 1935/1990)
- **Libre accès ?** : **copyright officiel Diyanet, exclue** ;
  les versions protestantes libres disponibles sont peu « récitées »
- **Source USFM** : `turobt` (Open Basic Turkish NT, CC BY-SA — **exclue SA**);
  `turytc` (Turkish YTC / WEB, CC BY-ND — **exclue ND**)
- **Format** : USFM (turobt / turytc téléchargés)
- **Statut** : `exclu-licence` (pas de version complète libre dominante)
- **Effort estimé** : gros

### 28. Hébreu (he) — ~9 M

- **Version dominante et récitée** : מִקְרָא (Tanakh, texte Masorétique ; en communauté
  judéo-chrétienne, traduction « הברית החדשה » / New Testament hébreu)
- **Libre accès ?** : le Tanakh (OT hébreu) est **PD** ; eBible `heb` (Hebrew) =
  **Public Domain ✅** (66/66, OT + NT hébreu)
- **Source USFM** : `heb` eBible — `https://ebible.org/Scriptures/heb_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/he/heb_usfm/`
- **Statut** : `ready` (PD, 66/66)
- **Effort estimé** : petit
- **Note** : la traduction moderne la plus lue est le « Mesoré HaNavoua » (PD aux US)
  ou le texte Masorétique ; `hebwlc` (Hebrew WLCC) téléchargé en parallèle pour
  comparaison.

### 29. Kurde (ku) — ~30 M

- **Version dominante et récitée** : کوردی سۆرانی (Kurdish Sorani, 2020 Biblica)
- **Libre accès ?** : `ckb` eBible (Kurdish Sorani 2020) = **CC BY-SA 4.0 (exclue)**
- **Source USFM** : `ckb` eBible — `https://ebible.org/Scriptures/ckb_usfm.zip`
- **Format** : USFM, 66/66 téléchargé dans `data/bible/raw/ku/ckb_usfm/`
- **Statut** : `ready-SA` (CC BY-SA, 66/66)
- **Effort estimé** : petit (si SA accepté)

### 30. Dzongkha (dz) — ~1.7 M

- **Version dominante et récitée** : བོད་ (Bhutanese Dzongkha Bible, UBS)
- **Libre accès ?** : pas de version complète libre identifiée
- **Source USFM** : à trouver (unfda / gbible)
- **Format** : USFM (à localiser)
- **Statut** : `à trouver`
- **Effort estimé** : gros

---

## Tableau récapitulatif (30 lignes)

| # | Langue (code) | Version recommandée | Licence | Statut | Effort |
|---|---|---|---|---|---|
| 1 | Chinois trad. (zh-Hant) | CUV 和合本 (cmn-cu89t) | PD | ready | petit |
| 2 | Japonais (ja) | Shin-Kaikyaku 1965 (jpn1965) | PD | incomplete (27/66) | moyen |
| 3 | Coréen (ko) | 한문 1910 (kor) | PD | catalog-existant | n/a |
| 4 | Thaï (th) | Thai KJV / Thai Freedom (thafb) | PD (thafb) / NC-ND (thakjv exclue) | incomplete (46/66) | gros |
| 5 | Vietnamien (vi) | Kinh Thánh 1925 (vie1934) | PD (NT 2019, OT 2021) | ready | petit |
| 6 | Indonésien (id) / Malais (ms) | Alkitab TB 1974 (propriétaire) | NC / propriétaire | exclu-licence | gros |
| 7 | Birman (my) | Judson 1956 (myajvb) | PD | ready | petit |
| 8 | Khmer (km) | Khmer Standard 2005 / Hammond 1954 (khm / khm-h) | propriétaire UBS | exclu-licence | gros |
| 9 | Lao (lo) | Lao KJV | ? | à trouver | gros |
| 10 | Népali (ne) | Nepali ULB 2019 (npiulb) | CC BY-SA | ready-SA | petit |
| 11 | Bengali (bn) | IRV 2018-19 (benirv) | CC BY-SA | ready-SA | petit |
| 12 | Hindi (hi) | IRV 2017 (hin2017) | CC BY-SA | catalog-existant | n/a |
| 13 | Tamoul (ta) | IRV 2017 (tam2017) | CC BY-SA | ready-SA | petit |
| 14 | Télougou (te) | IRV 2017 (tel2017) | CC BY-SA | ready-SA | petit |
| 15 | Malayalam (ml) | IRV (mal) | CC BY-SA | catalog-existant | n/a |
| 16 | Sinhalais (si) | Bible Society of Ceylon 1955 | propriétaire | à trouver | gros |
| 17 | Ourdou (ur) | IRV 2019 (urd) | CC BY-SA | ready-SA | petit |
| 18 | Pachtô (ps) | Pushto Bible (UBS) | ? | à trouver | gros |
| 19 | Sindhi (sd) | Sindhi Bible (BSP) | propriétaire | à trouver | gros |
| 20 | Yoruba (yo) | Yoruba ULB 2017 (yor) | CC BY-SA | ready-SA | petit |
| 21 | Igbo (ig) | Igbo ULB 2020 (ibo) | CC BY-SA | ready-SA | petit |
| 22 | Haoussa (ha) | Hausa ULB 2020 (hausa) | CC BY-SA | ready-SA | petit |
| 23 | Sotho du Sud (st) | Sesotho ULB (swhonen) | CC BY-SA | ready-SA | petit |
| 24 | Tswana (tw) | Setswana ULB 2020 (tsn) | CC BY-SA | ready-SA | petit |
| 25 | Amharique (am) | Amharic UBS 1962/2003 | non-libre + 27/66 | incomplete + exclu | gros |
| 26 | Polonais (pl) | Biblia Tysiąclecia 2003 | propriétaire | exclu-licence | gros |
| 27 | Turc (tr) | Diyanet İşleri Meali | officiel (propriétaire) | exclu-licence | gros |
| 28 | Hébreu (he) | Tanakh / Mesorat (heb) | PD | ready | petit |
| 29 | Kurde (ku) | Kurdish Sorani 2020 (ckb) | CC BY-SA | ready-SA | petit |
| 30 | Dzongkha (dz) | Bhutanese Dzongkha (UBS) | ? | à trouver | gros |

---

## Priorisation des datasets à construire (ordre recommandé)

**Vague 1 — builds PD/CC-BY immédiats (petit effort, ready) :**
1. `zh-Hant` → `cmn-cu89t` (PD, 66/66) — **1ʳ priorité**
2. `vi` → `vie1934` (PD, 66/66)
3. `my` → `myajvb` (PD, 66/66, Judson 1956)
4. `he` → `heb` (PD, 66/66)

**Vague 2 — builds CC BY-SA (à valider si politique SA évolue) :**
6. `ur` → `urd` (66/66)
7. `ta` → `tam2017` (66/66)
8. `te` → `tel2017` (66/66)
9. `yo` → `yor` (66/66)
10. `ig` → `ibo` (66/66)
11. `ha` → `hausa` (66/66)
12. `st` → `swhonen` (66/66)
13. `tw` → `tsn` (66/66)
14. `ku` → `ckb` (66/66)
15. `ne` → `npiulb` (66/66)
16. `bn` → `benirv` (66/66)

**Vague 3 — recherches à mener (gros effort, sources incomplètes) :**
17. `ja` → localiser Shin-Kaikyaku 1954/1965 66/66 via gBible/unfda
18. `th` → localiser une version thaï complète PD/CC-BY (éviter thakjv CC BY-NC-ND)
19. `km` → localiser une version khmère complète PD (éviter le Standard 2005 / Hammond protégés)
20. `lo` → Lao KJV (unfda)
21. `si` → sinhalais 66/66 (unfda)
22. `ps` → pachtô (unfda)
23. `sd` → sindhi (unfda)
24. `dz` → dzongkha (unfda)
25. `id`/`ms` → option libre en indonésien/malais (rechercher une édition PD pré-1974)
26. `am` → amharique 66/66 libre
27. `pl` → polonais libre (à défaut, Gdańska 1563 en fallback historique)
28. `tr` → turc libre (à défaut, turobt CC BY-SA si SA accepté)

---

## Contradiction licence à trancher (note de gouvernance)

Le catalogue actuel **contient déjà** des datasets CC BY-SA acceptés historiquement :
`sw-ulb`, `tl-ulb`, `hi-irv`, `ml-irv`, `so-bible` (ULB/IRV Biblica), tous marqués
`VERIFIED_FREE`. La politique `SCRAPE_PLAN.md` exclut formellement le CC BY-SA.
**À trancher** : soit on relâche la politique pour autoriser le CC BY-SA (ce qui
libère la Vague 2 ci-dessus : ~10 datasets 66/66 en effort « petit »),
soit on maintient l'exclusion et on ne construit que la Vague 1 (+ les PD de
`ja`/`th`/`lo`/`si`/`ps`/`sd`/`dz`/`id`/`am`/`pl`/`tr` localisables).

Recommandation : maintenir l'exclusion CC BY-SA par principe (app commerciale,
pas de clause SA sur le dérivé du dataset) et concentrer l'effort sur la Vague 1
(4 builds PD immédiats) + Vague 3 (recherche des 12 sources manquantes).

---

## Fichiers bruts déjà téléchargés (`data/bible/raw/`)

| Langue | Dossier | id eBible | Licence | Complétude |
|---|---|---|---|---|
| zh-Hant | `zh-hant/cmn-cu89t_usfm/` | cmn-cu89t | PD | 66/66 |
| ja | `ja/jpn1965_usfm/` | jpn1965 | PD | 27/66 |
| th | `th/thafb_usfm/` | thafb | PD | 46/66 |
| id | `id/indags_usfm/`, `id/ind_usfm/` | indags, ind | CC BY-SA | 27/66, 48/66 |
| my | `my/mya_usfm/`, `my/myajvb_usfm/` | mya, myajvb | CC BY-SA / PD | 66/66 |
| km | — | khm, khm-h (restrictées, copyright UBS) | propriétaire | 66/66 (non téléchargeable libre) |
| bn | `bn/benirv_usfm/` | benirv | CC BY-SA | 66/66 |
| ta | `ta/tam_irv2017_usfm/` | tam2017 | CC BY-SA | 66/66 |
| te | `te/tel2017_usfm/` | tel2017 | CC BY-SA | 66/66 |
| ml | `ml/mal_ulb_usfm/` | mal | CC BY-SA | 66/66 |
| ur | `ur/urd_irv_usfm/` | urd | CC BY-SA | 66/66 |
| yo | `yo/yor_ulb_usfm/` | yor | CC BY-SA | 66/66 |
| ig | `ig/ibo_ulb_usfm/` | ibo | CC BY-SA | 66/66 |
| ha | `ha/hau_ulb_usfm/` | hausa | CC BY-SA | 66/66 |
| st | `st/swhonen_usfm/` | swhonen | CC BY-SA | 66/66 |
| tw | `tw/tsn_usfm/`, `tw/tsw_usfm/` | tsn, tsw | CC BY-SA | 27/66, 6/66 |
| am | `am/amh_ulb_usfm/` | amh | non-libre | 27/66 |
| pl | `pl/pol_ubg_usfm/` | polubg | CC BY-ND | 66/66 |
| tr | `tr/tur_ytc_usfm/` | turytc | CC BY-ND | 67/66 |
| he | `he/heb_usfm/` | heb | PD | 66/66 |
| ku | `ku/ckb_usfm/` | ckb | CC BY-SA | 66/66 |
| vi | `vi/vie1934_usfm/` | vie1934 | PD | 66/66 |
| uk (ref) | `uk/uk_freedom_usfm/` | ukrfb | PD | 66/66 |
| ig (ref) | `ig/uiglat_usfm/` | uiglat | CC BY-SA | 66/66 |
