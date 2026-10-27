# Versions de la Bible actuelles par langue (catalogue VersyFlow)

**Source de vérité :** `data/bible/dataset-catalog.json` + `src/services/bible-translation-names.ts`
Le canon est réduit à **66 livres** par le filtre `filterCanonicalBooks` (repository-local.ts) — les datasets qui contiennent des apocryphes (kujv 73, webu 69, la-vulgate 67, francrampon 67, es-godword 67) sont trimmés à la couche de service sans toucher les JSON.

## Français (4)
| id | nom | année | versets | notes |
|---|---|---|---|---|
| lsg | Louis Segond | 1910 | 31 170 | **version par défaut (DEFAULT_TRANSLATION_ID)** |
| frlsg-eb | Louis Segond (eBible) | — | 31 170 | variante eBible |
| ostervald | Ostervald | 1670/1671 | 31 107 | classique |
| darby | Darby | 1845 | 31 170 | |
| francrampon | Crampon | 1923 | 32 370 | 67 livres bruts (apocryphes) → trimmés à 66 |

## Anglais (5)
| id | nom | année | versets |
|---|---|---|---|
| kujv | King James Version | 1611 | 32 305 (73 livres bruts → 66) |
| web | World English Bible | — | 31 103 |
| webu | World English Bible (Updated) | — | 32 762 (69 livres bruts → 66) |
| asv | American Standard Version | 1901 | 31 102 |
| bsb | Berean Standard Bible | 2017 | 31 086 |

## Allemand (3)
| id | nom | année |
|---|---|---|
| luther1912 | Luther (1912) | 1912 |
| schlatter1951 | Schlatter (1951) | 1951 |
| de-tkw | Textbibel Kautzsch-Weizsäcker | 1906 — **PENDING** (stub `sha256:pending`, non construit) |

## Espagnol (3)
| id | nom | année | versets |
|---|---|---|---|
| rv1909 | Reina-Valera (1909) | 1909 | 31 102 |
| es-onbv | Nueva Biblia Viva | 2014 | 31 103 |
| es-godword | God's Word | 2002 | 31 103 (67 livres bruts → 66) |

## Russe / Ukrainien (3)
| id | nom | année |
|---|---|---|
| ru-synodal | Synodale (russe) | 1891/1963 |
| uk-kulish1871 | Koulitch (1871) | 1871 |
| uk-bju1996 | Bible de l'Église (1996) | 1996 |

## Latin (1)
| id | nom | année |
|---|---|---|
| la-vulgate | Vulgate latine | 5e s. / 1629 Sixtine |

## Italien (2)
| id | nom | année |
|---|---|---|
| it-diodati1885 | Diodati (1885) | 1539/1885 |
| it-riveduta1927 | Riveduta (1927) | 1927 |

## Portugais (2)
| id | nom | année |
|---|---|---|
| pt-onbv | Oraçao (Araújo) | — |
| pt-brbsl | Bíblia Livre | 2022 — **PENDING** (stub `sha256:pending`, non construit) |

## Pays de langues germaniques scandinaves/néerlandaises (4)
| id | nom | année |
|---|---|---|
| nl-1917 | Édition néerlandaise | 1917 |
| nl-nbg1951 | NBG (Nederlands Bijbelsch Genootschap) | 1951 |
| da-1931 | Édition danoise | 1931 |
| sv-ntplus | NT+ (Nouveau Testament Plus, suédois) | — |

## Arabe / Persan (2)
| id | nom | année |
|---|---|---|
| ar-nav | Bible en arabe (NAV) | 1934 |
| fa-opcb | Bible persane (OPCB) | 2004 |

## Chinois / Japonais / Coréen (4)
| id | nom | année |
|---|---|---|
| cmn-uvs | Version unifiée (chinois simplifié) | 2014 |
| cmnswcb | Bible standard (chinois simplifié, SWCB) | 1988 |
| jp-freedom | Freedom Bible (japonais) | 2017 |
| ko-1910 | Édition coréenne | 1910 |

## Autres langues (5)
| id | nom | langue |
|---|---|---|
| hi-irv | Indian Revised Version | Hindi |
| ml-irv | Indian Revised Version | Malayalam |
| so-bible | Bible en somali | Somali |
| sw-ulb | ULB Swahili | Swahili |
| tl-ulb | ULB Tagalog | Tagalog/Filipino |

## Récapitulatif
- **39 entrées catalogue** : 37 construites + 2 PENDING (`de-tkw`, `pt-brbsl`)
- **21 langues liseuses** (par code ISO du dataset)
- **~31 100–31 200 versets** par dataset (variation selon le découpage des versets), sauf `fa-opcb` (29 469) et `ko-1910` (30 991)

## Contraintes produit (non négociables)
- **App 100 % gratuite, sans pub, sans paiement** — seules les versions en **libre accès** (domaine public ou CC) sont intégrées.
- L'usage réel par région primé sur la couverture maximale : la version intégrée doit être **celle que la communauté locale récite/mémorise** pour qu'une personne lambda puisse la retenir et qu'un lecteur sache de quelle version il s'agit.

## Prochaine étape
Recherche par langue de la **version la plus utilisée/reçitée dans la région** (prochain prompt) :
- Ex. en France → LSG (déjà défaut)
- Ex. au Canada francophone → LSG
- Ex. en RDC/Congo → version locale (peut-être pas LSG ! version en langue locale ou l'arabe/anglais)
- Ex. en Algérie/Tunisie/Maroc → **ar-nav** (ou version en langue amazighe/berber si existante en libre accès)
- Ex. en Amérique latine → **RVR 1960** (pas rv1909 qui est l'édition originale du XXe s. — mais 1960 est payante, donc on garde rv1909 en free ou on cherche un substitut libre)
