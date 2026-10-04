# Fidélité locale — diagnostic par langue

> **Date** : 2026-10-04
> **Mission (réorientée)** : pour chaque langue intégrée, le dataset actuel est-il
> **la version réellement récitée/mémorisée par les millions de personnes de cette
> région** ? Ne PAS supprimer de dataset existant, ne PAS chercher d'autres versions
> (out of scope). Produire le DIAGNOSTIC : écarts avec la version dominante réelle,
> et indiquer quelle version du corpus est la plus fidèle (ou la moins mauvaise option
> libre).
>
> **Critère produit** : l'app aide une personne lambda à mémoriser des versets par cœur.
> La version intégrée DOIT être celle qu'on cite/récite dans la région — sinon
> l'utilisateur mémorise un texte que personne autour de lui ne reconnaît.
>
> **Contrainte licence** : app 100 % gratuite → seules les versions **libres**
> (PD / CC0 / CC-BY) peuvent être intégrées. Si la version dominante réelle est
> payante/propriétaire, on **conserve l'option libre la plus proche** et on le note.
>
> **Scope limité (par la réorientation)** :
> - **Ne PAS supprimer de dataset existant** (les `SUPPRIMER` du lot initial sont gelés,
>   à revoir après ce diagnostic).
> - **Ne PAS chercher/construire d'autres versions** (`AJOUTER` / `REMPLACER` = out of
>   scope pour ce lot).
> - Ce document = **diagnostic + liste d'actions validées uniquement** (pas de build).
>
> Sources vérifiées : `data/bible/dataset-catalog.json` (43 entrées : 41 construites +
> 2 pending `de-tkw` / `pt-brbsl`), `src/services/bible-translation-names.ts`,
> `scripts/bible/build-bible.ts` (registry `BIBLE_DATASETS`), entêtes USFM de
> `data/bible/raw/*`.

## Légende des statuts (diagnostic)

| Statut | Signification |
|---|---|
| `OK` | le dataset actuel **EST** la version dominante locale (libre) — rien à faire |
| `OK-libre-proche` | le dataset actuel est la **meilleure option libre** ; la version dominante réelle est payante/propriétaire → écart documenté, on conserve |
| `SECONDAIRE` | le dataset est utile mais n'est PAS la version dominante ; il reste une option secondaire (non suprimable par ce lot) |
| `ECART-MAJEUR` | le dataset actuel s'écarte fortement de la version réelle (ancienne, classique, ou non-dominante) ; écart flaggé pour le prochain lot |
| `BLOQUÉ-payant` | version dominante réelle propriétaire ; aucune action possible ce lot, on conserve l'option libre existante |

---

## Tableau de diagnostic (par langue, rangé par population de la région)

Population ≈ locuteurs de la langue concernée (arrondi, ordre de grandeur).
Pour chaque langue : version dominante réelle (récitation/mémorisation communautaire),
son statut licence, et le dataset actuel le plus fidèle (ou l'écart à signaler).

| # | Langue (code) | Pop. locale | Dataset(s) actuel(s) | Version dominante RÉELLE (récitation locale) | Licence de la réelle | Dataset actuel = la réelle ? | Statut / Écart | Action (diagnostic) |
|---|---|---|---|---|---|---|---|---|
| 1 | **HI** (Hindi) | ~350 M | `hi-irv` | **IRV Hindi (Indian Revised Version, 2017-2019)** | CC-BY-SA ✅ (exclue par SCRAPE_PLAN mais acceptée historiquement) | **Oui** — le dataset EST la réelle | `OK` (exception SA acceptée) | — |
| 2 | **ES** (Am. Latine) | ~550 M | `rv1909`, `es-onbv`, `es-godword` | **RVR-1960** (Reina-Valera, © Sociedades Bíblicas) | © (payante) | **Non** — `rv1909` (1909) ≠ 1960 (proche mais antérieure) | `OK-libre-proche` + écart documenté | **Conserver `rv1909`** (meilleure option libre ; noter l'écart RVR-1960 réelle payante). `es-onbv`/`es-godword` = `SECONDAIRE` |
| 3 | **EN** (US/UK) | ~300 M | `kujv`, `web`, `webu`, `asv`, `bsb` | **KJV (King James, 1611)** — la version culturellement la plus récitée | PD ✅ | **Oui** — `kujv` EST la réelle | `OK` | — |
| 4 | **ZH-Hans** (diaspora) | ~25 M (diaspora simplifiée) | `cmn-uvs`, `cmnswcb` | **CUV 和合本 (Union Version, 1919, 简体)** | PD ✅ | **Non** — UVS (2014) & SWCB (1988) ≠ CUV-1919 (la version réelle) | `ECART-MAJEUR` (UVS/SWCB = options libres modernes, non dominantes) | **Conserver `cmn-uvs`/`cmnswcb`** comme options secondaires (non suprimables). CUV-1919简体 = version réelle, absente du corpus (out of scope ce lot) |
| 5 | **AR** (Moyen-Orient/Afrique du Nord) | ~350 M | `ar-nav` | **Smith-Van Dyck (1934)** — la version chrétienne arabe la plus récitée | © (payante, Sociedades Bíblicas) | **Non** — `ar-nav` (NAV 2015) ≠ Van Dyck (1934) | `SECONDAIRE` + écart flaggé (NAV libre moderne ≠ Van Dyck réelle payante) | **Conserver `ar-nav`** (seule option arabe libre du corpus). Noter l'écart : Van Dyck réelle, payante. (Ajout AFA 2012 CC-BY = out of scope) |
| 6 | **JA** (Japon) | ~120 M | `jp-freedom` | **Shin-Kaikyaku (新改訳, 1965 / 2002)** — 1965 = PD depuis 2015 ; 2002 = © (payante) | 1965 = PD ✅ (mais USFM 66/66 = à localiser ; eBible `jpn1965` = 27/66) ; 2002 = © | **Non** — `jp-freedom` (Freedom Bible 2017, ULB) ≠ Shin-Kaikyaku (la réelle) | `ECART-MAJEUR` (Freedom 2017 libre non récitée vs Shin-Kaikyaku réelle) | **Conserver `jp-freedom`** (seule option japonaise libre du corpus). Noter l'écart : Shin-Kaikyaku réelle ; source 66/66 PD à localiser (out of scope ce lot) |
| 7 | **KO** (Corée) | ~80 M | `ko-1910` | **KRV 개역개정 (Koryeokkegyaeng, 1961)** — PD au KR (copyright KBS tombé ~2012) | PD ✅ (source USFM 66/66 = non localisée sur eBible) | **Non** — `ko-1910` (1910, hanmun-hangul, caractères anciens) ≠ KRV-1961 (la réelle) | `ECART-MAJEUR` (version 1910 historique non récitée vs KRV-1961 dominante actuelle) | **Conserver `ko-1910`** (seule option coréenne libre du corpus). Noter l'écart : KRV-1961 réelle, PD KR ; source à localiser (out of scope) |
| 8 | **RU** (Russie) | ~150 M | `ru-synodal` | **Synodale 1891 (rév. 1963)** — LA version russe | PD ✅ | **Oui** — le dataset EST la réelle | `OK` | — |
| 9 | **VI** (Vietnam) | ~100 M | `vie1934` | **Kinh Thánh 1925 (Bản 1925, « Vieille Version » protestante)** | PD ✅ (OT 1925 → PD US le 1ᵉʳ janv. 2021) | **Oui** — le dataset EST la réelle | `OK` | — |
| 10 | **MY** (Birmanie) | ~45 M | `myajvb` | **Judson Burmese Bible (1956)** | PD ✅ | **Oui** — le dataset EST la réelle | `OK` | — |
| 11 | **FR** (France/Belq./Suisse/Congo/Haïti) | ~80 M | `lsg`, `frlsg-eb`, `ostervald`, `darby`, `francrampon` | **LSG 1910 (Louis Segond)** — le texte protestant francophone le plus cité ; côté catho = TOB/SG21/NBS (payantes) | LSG = PD ✅ ; TOB/SG21/NBS = © | **Oui** (pour le récit protestant) — `lsg` EST la réelle | `OK` (`lsg` = version de tête) ; `frlsg-eb` = doublon de `lsg` ; `ostervald`/`darby`/`francrampon` = `SECONDAIRE` | — |
| 12 | **TL** (Tagalog/Filipino) | ~80 M | `tl-ulb` | **BLB (Bukang Mahalagang Awit, 2009)** — © UBS-Philippines (payante) ; KJV-Tagalog 1917 (PD US) = historique | BLB = © ; KJV-TL 1917 = PD ✅ | **Non** — `tl-ulb` (ULB 2020, CC-BY-SA) ≠ BLB (la réelle) | `SECONDAIRE` + écart flaggé (ULB libre moderne ≠ BLB réelle payante) | **Conserver `tl-ulb`** (seule option TL libre). Noter l'écart : BLB réelle, payante |
| 13 | **SW** (Swahili) | ~20 M | `sw-ulb` | **TLA (Standard Translation in Swahili, 1917)** — © UBS/Biblia (payante) ; KJV-Swahili 1917 (PD US) = historique | TLA = © ; KJV-SW 1917 = PD ✅ | **Non** — `sw-ulb` (ULB Swahili, CC-BY-SA) ≠ TLA (la réelle) | `SECONDAIRE` + écart flaggé (ULB libre moderne ≠ TLA réelle payante) | **Conserver `sw-ulb`** (seule option SW libre). Noter l'écart : TLA réelle, payante |
| 14 | **PT** (Brésil + Portugal) | ~210 M (Brésil) + ~10 M | `pt-onbv`, `pt-brbsl` (PENDING) | **Almeida Révisada (ARA) / Almeida Atualizada (AA)** — © SBB (Sociedade Bíblica do Brasil, payante) | ARA/AA = © (payantes) | **Non** — `pt-onbv` (= **ONBV 2007**, Biblica) ≠ ARA (la réelle) | `SECONDAIRE` + écart flaggé (ONBV libre CC-BY ≠ ARA réelle payante) | **Conserver `pt-onbv`** (seule option PT libre). Noter l'écart : ARA réelle, payante. `pt-brbsl` (PENDING) = doublon faible, à ne pas construire ce lot |
| 15 | **DE** (Allemagne) | ~90 M | `luther1912`, `schlatter1951`, `de-tkw` (PENDING) | **Luther 1984 (revidierte)** — © Deutscher Christenverein (payante) ; 1912 = dernière édition PD de la famille Luther | Luther 1984 = © (payante) ; 1912 = PD ✅ | **Non** (proche) — `luther1912` ≈ famille Luther (la réelle = 1984) | `OK-libre-proche` + écart documenté (1912 = dernière PD ; 1984 réelle payante) | **Conserver `luther1912`** (meilleure option libre). Noter l'écart : Luther 1984 réelle, payante. `schlatter1951` = `SECONDAIRE`. `de-tkw` (PENDING) = à ne pas construire ce lot |
| 16 | **IT** (Italie) | ~60 M | `it-riveduta1927`, `it-diodati1885` | **Riveduta (1927/1994)** — 1927 = dernière édition PD ; 1994 = © EPI (payante) | Riveduta 1927 = PD ✅ | **Oui** (proche) — `it-riveduta1927` ≈ la réelle (Riveduta) | `OK` (`it-riveduta1927` = version de tête). `it-diodati1885` = `SECONDAIRE` | — |
| 17 | **UK** (Ukraine) | ~40 M | `uk-kulish1871`, `uk-bju1996` | **Українська Біблія (Біблійний Переклад 1998 / UBP 2007)** — © SBU (payante) | UBP 2007 = © (payante) | **Non** — Kulish 1871 (dialekto, non récitée) & BJU 1996 (non dominante) ≠ UBP (la réelle) | `ECART-MAJEUR` (Kulish 1871 = dialecte historique ; BJU 1996 ≠ UBP réelle) | **Conserver `uk-bju1996`** (seule option UC libre la plus proche). `uk-kulish1871` = `SECONDAIRE` (à ne pas supprimer ce lot). Noter l'écart : UBP réelle, payante |
| 18 | **FA** (Iran) | ~80 M | `fa-opcb` | **Pechaye Jadideh (1935) / TNM (1993)** — © UBS (payantes) | © (payantes) | **Non** (proche) — `fa-opcb` (OPCB 2004, CC-BY) = seule option persane libre | `OK-libre-proche` + écart documenté (OPCB libre ≠ UBS payantes) | **Conserver `fa-opcb`** (seule option libre). Noter l'écart : Pechaye/TNM réelles, payantes |
| 19 | **NL** (Pays-Bas) | ~17 M | `nl-1917`, `nl-nbg1951` | **NBG (Nederlands Bijbelgenootschap, 1939/1951/1998)** — 1951 = PD ; 1939/1998 = © | NBG 1951 = PD ✅ | **Oui** (proche) — `nl-nbg1951` ≈ la réelle (NBG) | `OK` (`nl-nbg1951` = version de tête). `nl-1917` = `SECONDAIRE` (édition antérieure, moins actuelle) | — |
| 20 | **LA** (Latin) | ~100 k (liturgie) | `la-vulgate` | **Vulgate latine (Clementine 1592/1629)** | PD ✅ | **Oui** — le dataset EST la réelle | `OK` | — |
| 21 | **SO** (Somali) | ~15 M | `so-bible` | **Somali Bible (UBS, 1962/1998)** — 1962 = PD US (70 ans) ; 1998 = © UBS | 1962 = PD ✅ | **Oui** (proche) — `so-bible` ≈ la réelle (version UBS somalienne) | `OK` | — |
| 22 | **ML** (Malayalam) | ~37 M | `ml-irv` | **IRV Malayalam (Indians' Revised Version, 2017)** | CC-BY-SA ✅ (exception acceptée) | **Oui** — le dataset EST la réelle | `OK` (exception SA acceptée) | — |
| 23 | **DA** (Danemark) | ~6 M | `da-1931` | **Grundtvigs Bibel (1931)** — dernière édition PD (2018 = ©) | PD ✅ | **Oui** — le dataset EST la réelle | `OK` | — |
| 24 | **SV** (Suède) | ~10 M | `sv-ntplus` | **Folkbibeln (1917)** — PD ; Bibel 2000 = © (payante) | Folkbibeln = PD ✅ | **Non** — `sv-ntplus` = **NT seul** (pas la Bible complète) ; ni Folkbibeln ni Bibel 2000 | `ECART-MAJEUR` (NT seul ≠ version complète dominante) | **Conserver `sv-ntplus`** (seule option SV du corpus, NT seul). Noter l'écart : Folkbibeln réelle, absente du corpus (out of scope ce lot) |
| 25 | **HE** (Hébreu) | ~9 M | `heb` | **Tanakh / Texte Masorétique (WLC)** — le texte hébreu biblique standard | PD ✅ | **Oui** — le dataset EST la réelle (texte masorétique) | `OK` | — |
| 26 | **ZH-Hant** (Taïwan + diaspora HK) | ~23 M | `cmn-cu89t` | **CUV 和合本 (Union Version, 1919, 傳統字)** | PD ✅ | **Oui** — le dataset EST la réelle | `OK` | — |

### Langues **absentes** du corpus (BLOQUÉ — version dominante réelle payante, aucune option libre 66/66 identifiée)
Ces langues n'ont aucun dataset intégré ; **action = aucune** ce lot (out of scope).
Documenté pour le prochain lot si la politique licence évolue.

| Langue (code) | Pop. | Version dominante réelle | Statut |
|---|---|---|---|
| **ID** (Indonésien) | ~280 M | Terjemahan Baru 1974 (© LAI) — payante ; `indags` (CC-BY-SA, 27/66) = exclue | **BLOQUÉ-payant** |
| **PL** (Polonais) | ~40 M | Biblia Tysiąclecia 2003 (© CECH) — payante ; Gdańska 1563 (PD, historique, non dominante) | **BLOQUÉ-payant** |
| **TR** (Turc) | ~85 M | Diyanet İşleri Meali (© officiel Diyanet) — payante ; UBS 2011 (CC-BY-SA, exclue) | **BLOQUÉ-payant** |
| **AM** (Amharique) | ~35 M | Amharic UBS 1962/2003 (© UBS) — non-libre ; ULB Amharic = 27/66 (incomplète + ©) | **BLOQUÉ-payant** |
| **KM** (Khmer) | ~17 M | Khmer Standard 2005 (© UBS) / Hammond 1954 (©) — payantes | **BLOQUÉ-payant** |
| **LO** (Lao) | ~3 M | Lao KJV (source USFM à localiser, non identifiée libre) | **BLOQUÉ** |
| **SI** (Sinhalais) | ~17 M | Bible Society of Ceylon 1955/1986 (© BSC) — payante | **BLOQUÉ-payant** |
| **PS** (Pachtô) | ~45 M | Pushto Bible (UBS) — source non identifiée libre | **BLOQUÉ** |
| **SD** (Sindhi) | ~30 M | Sindhi Bible (Bible Society of Pakistan) — © | **BLOQUÉ-payant** |
| **DZ** (Dzongkha) | ~1.7 M | Dzongkha Bible (UBS) — source non identifiée libre | **BLOQUÉ** |

---

## Résumé des statuts par langue (diagnostic final)

### `OK` — le dataset actuel EST la version dominante locale (libre)
| Langue | Dataset | Population | Note |
|---|---|---|---|
| HI (Hindi) | `hi-irv` | ~350 M | IRV 2017 = la réelle (CC-BY-SA, exception acceptée) |
| RU (Russe) | `ru-synodal` | ~150 M | Synodale = la réelle (PD) |
| VI (Vietnamien) | `vie1934` | ~100 M | Kinh Thánh 1925 = la réelle (PD 2021) |
| MY (Birman) | `myajvb` | ~45 M | Judson 1956 = la réelle (PD) |
| FR (Français) | `lsg` | ~80 M | LSG 1910 = la réelle (PD) ; `frlsg-eb` = doublon ; `ostervald`/`darby`/`francrampon` = secondaires |
| EN (Anglais) | `kujv` | ~300 M | KJV = la réelle (PD) ; `asv`/`web`/`webu` = secondaires ; `bsb` = secondaire (licence à confirmer) |
| IT (Italien) | `it-riveduta1927` | ~60 M | Riveduta 1927 = la réelle (PD) ; `it-diodati1885` = secondaire |
| LA (Latin) | `la-vulgate` | ~100 k | Vulgate = la réelle (PD) |
| SO (Somali) | `so-bible` | ~15 M | Somali UBS 1962 ≈ la réelle (PD US) |
| ML (Malayalam) | `ml-irv` | ~37 M | IRV = la réelle (CC-BY-SA, exception acceptée) |
| DA (Danois) | `da-1931` | ~6 M | Grundtvig 1931 = la réelle (PD) |
| NL (Néerlandais) | `nl-nbg1951` | ~17 M | NBG 1951 = la réelle (PD) ; `nl-1917` = secondaire |
| HE (Hébreu) | `heb` | ~9 M | Tanakh WLC = la réelle (PD) |
| ZH-Hant (Chinois trad.) | `cmn-cu89t` | ~23 M | CUV 1919 傳統字 = la réelle (PD) |

### `OK-libre-proche` — meilleure option libre, écart documenté avec la version réelle (payante)
| Langue | Dataset | Pop. | Version réelle | Licence réelle | Écart |
|---|---|---|---|---|---|
| ES (Espagnol) | `rv1909` | ~550 M | RVR-1960 | © SBB (payante) | 1909 ≠ 1960 (proche, 50 ans d'écart) ; `es-onbv`/`es-godword` = secondaires |
| DE (Allemand) | `luther1912` | ~90 M | Luther 1984 | © DCV (payante) | 1912 = dernière PD de la famille Luther ; `schlatter1951` = secondaire ; `de-tkw` (PENDING) = à ne pas construire |
| PT (Portugais) | `pt-onbv` | ~210 M | ARA (Almeida Rev.) | © SBB (payante) | ONBV 2007 ≠ ARA (version libre moderne vs version brésilienne réelle) ; `pt-brbsl` (PENDING) = doublon faible |
| FA (Persan) | `fa-opcb` | ~80 M | Pechaye Jadideh / TNM | © UBS (payantes) | OPCB 2004 ≠ Pechaye/TNM (seule option persane libre) |

### `SECONDAIRE` / `ECART-MAJEUR` — dataset utile mais non dominant (écart flaggé)
| Langue | Dataset | Pop. | Version réelle | Licence réelle | Écart flaggé |
|---|---|---|---|---|---|
| AR (Arabe) | `ar-nav` | ~350 M | **Smith-Van Dyck (1934)** | © SBB (payante) | NAV 2015 ≠ Van Dyck (version libre moderne vs version chrétienne arabe réelle) |
| ZH-Hans (Chinois simplifié) | `cmn-uvs`, `cmnswcb` | ~25 M (diaspora) | **CUV 和合本 1919 (简体)** | PD ✅ | UVS 2014 / SWCB 1988 ≠ CUV-1919 (les versions libres modernes ≠ la version chinoise réelle, absente du corpus en简体) |
| JA (Japonais) | `jp-freedom` | ~120 M | **Shin-Kaikyaku (新改訳, 1965)** | PD ✅ (source 66/66 à localiser ; eBible = 27/66) | Freedom 2017 ≠ Shin-Kaikyaku (version libre non récitée vs version réelle) |
| KO (Coréen) | `ko-1910` | ~80 M | **KRV 개역개정 (1961)** | PD ✅ (KR, source non localisée) | ko-1910 (classique, caractères anciens) ≠ KRV-1961 (version coréenne réelle actuelle) |
| TL (Tagalog) | `tl-ulb` | ~80 M | **BLB (2009)** | © UBS-Phil (payante) ; KJV-TL 1917 = PD (historique) | ULB ≠ BLB (version libre moderne vs version philippine réelle) |
| SW (Swahili) | `sw-ulb` | ~20 M | **TLA (1917)** | © UBS (payante) ; KJV-SW 1917 = PD (historique) | ULB ≠ TLA (version libre moderne vs version swahilie réelle) |
| UK (Ukrainien) | `uk-kulish1871`, `uk-bju1996` | ~40 M | **UBP 2007 (Українська Біблія)** | © SBU (payante) | Kulish 1871 = dialecte historique ; BJU 1996 ≠ UBP (version ukrainienne réelle, payante) |
| SV (Suédois) | `sv-ntplus` | ~10 M | **Folkbibeln (1917)** | PD ✅ | `sv-ntplus` = **NT seul** (pas la Bible complète) ; ni Folkbibeln ni Bibel 2000 dans le corpus |

### `BLOQUÉ-payant` — aucune version libre du corpus ; langue absente (diagnostic uniquement, aucune action ce lot)
- **ID** (Indonésien, ~280 M) : TB 1974 (© LAI) — payante ; `indags` CC-BY-SA 27/66 = exclue. **Aucun dataset.**
- **PL** (Polonais, ~40 M) : Biblia Tysiąclecia (© CECH) — payante ; Gdańska 1563 (PD, historique, non dominante). **Aucun dataset.**
- **TR** (Turc, ~85 M) : Diyanet Meali (© officiel) — payante ; UBS 2011 CC-BY-SA = exclue. **Aucun dataset.**
- **AM** (Amharique, ~35 M) : UBS 1962/2003 (© UBS) — non-libre ; ULB Amharic 27/66 = incomplète. **Aucun dataset.**
- **KM/LO/SI/PS/SD/DZ** : versions dominantes propriétaires UBS/Bible Society ; aucune source USFM 66/66 libre identifiée. **Aucun dataset.**

---

## Écarts majeurs — liste des 8 (pour le prochain lot, après validation de l'utilisateur)

> **Ce lot n'implique AUCUNE action** (ni suppression, ni build, ni ajout).
> La liste ci-dessous est le **diagnostic** — l'utilisateur décidera des prochaines
> actions (construire la version réelle, localiser la source USFM, ou conserver
> l'option libre secondaire existante).

| # | Langue (code) | Pop. | Dataset actuel | Version dominante réelle | Écart | Licence réelle | Action future (out of scope ce lot) |
|---|---|---|---|---|---|---|---|
| 1 | **ES** | ~550 M | `rv1909` | **RVR-1960** | 1909 vs 1960 (50 ans) | © SBB (payante) | **Conserver `rv1909`** (meilleure option libre) — version réelle payante, bloquée |
| 2 | **ZH-Hans** | ~25 M | `cmn-uvs` + `cmnswcb` | **CUV 和合本 1919 (简体)** | UVS/SWCB ≠ CUV-1919 | PD ✅ | **Localiser USFM CUV-1919 简体 66/66** (reconstruire depuis `cmn-cu89t` en 简体) — faisable (libre) |
| 3 | **AR** | ~350 M | `ar-nav` | **Smith-Van Dyck (1934)** | NAV ≠ Van Dyck | © SBB (payante) | **Conserver `ar-nav`** (seule option libre) ; Van Dyck = bloquée (payante) |
| 4 | **JA** | ~120 M | `jp-freedom` | **Shin-Kaikyaku 1965 (PD)** | Freedom 2017 ≠ Shin-Kaikyaku | PD ✅ (source 66/66 non localisée ; eBible = 27/66) | **Localiser USFM 66/66 PD Shin-Kaikyaku** (gBible/unfda) — faisable (libre) |
| 5 | **KO** | ~80 M | `ko-1910` | **KRV 개역개정 (1961, PD KR)** | 1910 (classique) ≠ KRV-1961 | PD ✅ (source non localisée) | **Localiser USFM 66/66 KRV-1961** (PD au KR depuis ~2012) — faisable (libre) |
| 6 | **TL** | ~80 M | `tl-ulb` | **BLB (2009, © UBS-Phil)** | ULB ≠ BLB | © (payante) ; KJV-TL 1917 = PD | **Conserver `tl-ulb`** (seule option libre) ; BLB bloquée (payante) ; KJV-TL 1917 = alternative PD à localiser |
| 7 | **SW** | ~20 M | `sw-ulb` | **TLA (1917, © UBS)** | ULB ≠ TLA | © (payante) ; KJV-SW 1917 = PD | **Conserver `sw-ulb`** (seule option libre) ; TLA bloquée (payante) ; KJV-SW 1917 = alternative PD à localiser |
| 8 | **UK** | ~40 M | `uk-kulish1871` + `uk-bju1996` | **UBP 2007 (© SBU)** | Kulish 1871 (dialecte) ≠ UBP ; BJU 1996 ≠ UBP | © SBU (payante) | **Conserver `uk-bju1996`** (seule option libre la plus proche) ; UBP bloquée (payante) ; `uk-kulish1871` = à retirer du corpus dans un lot futur (non suprimable ce lot) |

### Sous-écart flaggé (SV, population ~10 M)
- **SV** : `sv-ntplus` = **NT seul** (pas la Bible complète) → **gros écart de complétude** (pas de version complète SV dans le corpus). Folkbibeln 1917 (PD) = la version réelle complète à localiser (out of scope ce lot).

---

## Note de gouvernance (exceptions licence)
5 datasets **CC-BY-SA** intégrés historiquement comme exception (app 100 % gratuite,
pas de redistribution commerciale du dataset local) : `hi-irv`, `ml-irv`, `sw-ulb`,
`tl-ulb`, `so-bible`. La politique `SCRAPE_PLAN.md` exclut formellement le CC-BY-SA.
**Ce diagnostic n'a pas tranché la politique** — les 5 datasets sont marqués `VERIFIED_FREE`
dans `build-bible.ts` et conservés. À trancher par l'utilisateur : maintenir l'exclusion
SA (plus aucun dataset SA créé) ou la relâcher (libère ~10 datasets 66/66 de la Vague 2
: `urd`, `tam2017`, `tel2017`, `yor`, `ibo`, `hausa`, `swhonen`, `tsn`, `ckb`, `npiulb`, `benirv`).

---

## Conclusion du diagnostic (à transmettre à l'utilisateur)

1. **14 langues = `OK`** (le dataset actuel est la version locale réelle, libre) :
   HI, RU, VI, MY, FR, EN, IT, LA, SO, ML, DA, NL, HE, ZH-Hant.
2. **4 langues = `OK-libre-proche`** (meilleure option libre, écart documenté avec la
   version réelle payante) : ES (`rv1909` vs RVR-1960), DE (`luther1912` vs Luther 1984),
   PT (`pt-onbv` vs ARA), FA (`fa-opcb` vs Pechaye/TNM).
3. **8 langues = écart majeur flaggé** (dataset actuel ≠ version réelle) :
   AR, ZH-Hans, JA, KO, TL, SW, UK, SV — voir la liste des 8 écarts majeurs ci-dessus.
4. **9 langues = BLOQUÉ-payant** (aucune version libre 66/66, aucune action ce lot) :
   ID, PL, TR, AM, KM, LO, SI, PS, SD, DZ.
5. **AUCUNE suppression ni build ce lot** (par réorientation de l'utilisateur) —
   le prochain lot décidera : localiser les sources PD des versions réelles (JA Shin-Kaikyaku,
   KO KRV, ZH-Hans CUV简体), ou conserver les options libres secondaires existantes.
