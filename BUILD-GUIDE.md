# VersyFlow - Guide de Build Production

## ✅ Ce qui est prêt

### 1. Keystore de production généré
- **Emplacement**: `keystore/release.keystore`
- **Alias**: `versyflow-release-key`
- **Mot de passe**: `VersyFlow2024!`
- **⚠️ NE PAS PUSH Ce fichier!**

### 2. Workflow GitHub Actions configuré
- Fichier: `.github/workflows/build-apk-simple.yml`
- Build automatique sur push vers `main`
- Support debug et release

### 3. Authentification InsForge reconnectée
- SDK InsForge configuré
- Variables d'environnement prêtes

---

## 🔧 Configuration manuelle requise

### ÉTAPE 1: Installer Android SDK (sur votre machine)

#### Option A: Via Android Studio (recommandé)
1. Ouvrir Android Studio
2. SDK Manager → Installer:
   - Android SDK Build-Tools 35.0.0
   - Android SDK Platform 34
   - Android SDK Command-line Tools
3. Définir ANDROID_HOME:
   ```
   Windows: C:\Users\joyda\AppData\Local\Android\Sdk
   ```

#### Option B: Via cmdline-tools (sans Android Studio)
```bash
# Télécharger cmdline-tools
curl -L -o cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-15859902_latest.zip"

# Extraire
mkdir -p ~/Android/sdk/cmdline-tools
unzip cmdline-tools.zip -d ~/Android/sdk/cmdline-tools

# Configurer
export ANDROID_HOME=~/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH

# Installer les packages
sdkmanager --licenses
sdkmanager "build-tools;35.0.0" "platforms;android-34" "platform-tools"
```

### ÉTAPE 2: Configurer les secrets GitHub

Allez sur votre repository GitHub:
1. **Settings** → **Secrets and variables** → **Actions**
2. Ajouter ces secrets:

| Nom du secret | Valeur |
|---------------|--------|
| `KEYSTORE_PASSWORD` | `VersyFlow2024!` |
| `KEY_ALIAS` | `versyflow-release-key` |
| `KEY_PASSWORD` | `VersyFlow2024!` |
| `STORE_FILE` | `../keystore/release.keystore` |

### ÉTAPE 3: Build APK Debug (local)

```bash
# Une fois le SDK Android installé
export ANDROID_HOME=/path/to/your/android/sdk
npx expo run:android --variant debug
```

### ÉTAPE 4: Build APK Release (GitHub Actions)

1. Allez sur l'onglet **Actions** de votre repository
2. Cliquez sur **"Build APK Debug Rapid"**
3. Cliquez sur **"Run workflow"**
4. Attendez la fin du build
5. Téléchargez l'APK dans les Artifacts

---

## 📁 Structure des fichiers

```
VersyFlow/
├── keystore/
│   └── release.keystore          # ⚠️ Jamais pushé (dans .gitignore)
├── .github/
│   └── workflows/
│       └── build-apk-simple.yml  # Workflow CI/CD
├── android/
│   ├── build.gradle
│   ├── gradle.properties         # Config Gradle
│   └── app/
│       └── build.gradle          # Config app
├── src/
│   └── auth/
│       └── InsForgeAuthService.ts # Auth reconnectée
└── diagram-etat-projet.html      # Diagramme du projet
```

---

## 🔐 Variables d'environnement

Créer un fichier `.env.local` (déjà présent):
```bash
INSFORGE_URL=https://wypi8tgf.eu-central.insforge.app
INSFORGE_ANON_KEY=anon_5db10acfd8d50598afafe6d574dfd647edd9fba32514816c7f4c00346651a7c6
```

Pour le build production, ajouter dans les secrets GitHub:
```
EXPO_TOKEN=votre_expo_token  # Optionnel, pour EAS Build
```

---

## 🚀 Commandes utiles

```bash
# Lancer l'application en développement
npm start

# Build APK debug local
npm run android

# Vérifier la configuration
npx expo-doctor

# Build production via GitHub
# Voir l'onglet Actions du repository
```

---

## ⚠️ Notes importantes

1. **Le keystore est UNIQUE** - Perdez-le et vous ne pourrez plus mettre à jour votre app sur le Play Store
2. **Sauvegardez le keystore** - Stockez-le dans un endroit sûr (cloud sécurisé, gestionnaire de mots de passe)
3. **Ne jamais pusher le keystore** - Vérifiez que `.gitignore` exclut bien `keystore/`
4. **Android SDK requis** - Le build GitHub nécessite ANDROID_HOME configuré

---

## 📊 État actuel du projet

| Élément | Statut |
|---------|--------|
| Application | ✅ Fonctionnelle |
| Authentification | ✅ InsForge reconnecté |
| Build Debug | ✅ Prêt (GitHub Actions) |
| Keystore | ✅ Généré |
| SDK Android | ⚠️ À installer |
| Secrets GitHub | ⚠️ À configurer |

**Prochaine étape:** Installer le SDK Android et configurer les secrets GitHub!