# Agnes AI Action - Guide d'Installation

Ce workflow utilise l'API **Agnes AI** (Sapiens AI) pour automatiser les reviews de code.

## Pourquoi Agnes AI ?

- ✅ **100% Gratuit** - Pas de carte bancaire requise
- ✅ **Compatible OpenAI** - Même interface, migration facile
- ✅ **Modèles puissants** - agnes-2.0-flash, agnes-2.5-flash, etc.
- ✅ **Multimodal** - Texte, image, vidéo
- ✅ **Contexte 512K** - Très long contexte pour les gros PRs

## Configuration requise

### 1. Créer un compte Agnes AI

1. Va sur https://platform.agnes-ai.com/
2. Inscris-toi avec ton email ou GitHub/Google
3. Va dans **Settings → API Keys**
4. Crée une nouvelle clé API (format: `sk-xxxxxxxx`)

### 2. Ajouter le secret GitHub

1. Va dans ton repository → **Settings → Secrets and variables → Actions**
2. Clique sur **New repository secret**
3. Nom: `AGNES_API_KEY`
4. Valeur: Ta clé Agnes AI (ex: `sk-abc123...`)
5. Clique sur **Add secret**

## Utilisation

### Review automatique de PR

Le workflow se déclenche automatiquement à chaque nouvelle PR ou mise à jour.

### Commenter sur une issue

Réponds à un commentaire d'issue avec une instruction, par exemple :
```
@github-actions Please review this issue with Agnes AI
```

### Déclenchement manuel

Depuis l'onglet Actions de ton repository :
1. Clique sur "Agnes AI Code Review"
2. Clique sur "Run workflow"
3. Remplis les paramètres si nécessaire
4. Clique sur "Run workflow"

## Modèles disponibles

| Modèle | Usage | Contexte |
|--------|-------|----------|
| `agnes-2.0-flash` | Code review, chat, agent | 512K |
| `agnes-2.5-flash` | Plus rapide | 512K |
| `agnes-2.5-pro` | Plus puissant | 512K |
| `agnes-image-2.1-flash` | Génération d'images | - |
| `agnes-video-v2.0` | Génération de vidéo | - |

## Intégration avec ton projet

Le workflow utilise le SDK OpenAI compatible avec Agnes AI :

```javascript
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.AGNES_API_KEY,
  baseURL: 'https://apihub.agnes-ai.com/v1'
});

const response = await client.chat.completions.create({
  model: 'agnes-2.0-flash',
  messages: [{ role: 'user', content: 'Your prompt' }]
});
```

## Limites gratuites

- RPM (Requests Per Minute) limité pour les comptes gratuits
- Pas de limite de tokens sur les modèles gratuits
- Pas de carte bancaire requise

## Dépannage

### Erreur: AGNES_API_KEY non défini
- Vérifie que le secret `AGNES_API_KEY` est bien configuré dans ton repository GitHub.

### Erreur 429 (Rate limit)
- Le compte gratuit a des limites RPM. Attends quelques secondes et réessaie.

### Le workflow ne se déclenche pas
- Vérifie que le workflow est activé dans l'onglet Actions.
- Assure-toi que les triggers sont correctement configurés.

## Liens utiles

- [Documentation Agnes AI](https://agnes-ai.com/doc/overview)
- [Quickstart](https://agnes-ai.com/en/docs/quickstart)
- [API Platform](https://platform.agnes-ai.com/)
- [Modèles disponibles](https://agnes-ai.com/doc/agnes-20-flash)
