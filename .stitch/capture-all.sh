#!/usr/bin/env bash
# Batch capture all VersyFlow screens for Stitch
BASE="http://localhost:3000"
STORAGE=".stitch/storage.json"

# Screen definitions: name|route|waitSelector|needsAuth
# needsAuth=true → seed onboardingCompleted=true (bypass route guard)
SCREENS=(
  # Onboarding (public, no auth)
  "onboarding-welcome|/onboarding/welcome|ion-content|false"
  "onboarding-language|/onboarding/language-select|ion-content|false"
  "onboarding-translation|/onboarding/translation-select|ion-content|false"
  "onboarding-session-config|/onboarding/session-config|ion-content|false"
  "onboarding-reminder-config|/onboarding/reminder-config|ion-content|false"
  "onboarding-fsrs-intro|/onboarding/fsrs-introduction|ion-content|false"

  # Auth (public, no auth)
  "auth-login|/auth/login|ion-content|false"
  "auth-signup|/auth/signup|ion-content|false"
  "auth-verify|/auth/verify|ion-content|false"

  # Main tabs (onboarding guard)
  "tabs-home|/tabs/home|ion-tab-bar, main|true"
  "tabs-explore|/tabs/explore|ion-tab-bar, main|true"
  "tabs-progress|/tabs/progress|ion-tab-bar, main|true"
  "tabs-settings|/tabs/settings|ion-tab-bar, main|true"

  # Memorization (onboarding guard)
  "memorization-session|/memorization/session|ion-header, main|true"
  "memorization-flashcard|/memorization/flashcard|ion-header, main|true"
  "memorization-confirm|/memorization/confirm|ion-header, main|true"

  # Review (onboarding guard)
  "review-session|/review/session|ion-header, main|true"
  "review-summary|/review/summary|ion-header, main|true"
  "review-calendar|/review/calendar|ion-header, main|true"
  "review-history|/review/history|ion-header, main|true"
  "review-queue|/review/queue|ion-header, main|true"

  # Bible (onboarding guard)
  "bible-explorer|/bible/explorer|ion-header, main|true"
  "bible-book|/bible/book|ion-header, main|true"
  "bible-chapter|/bible/chapter|ion-header, main|true"

  # Comparison (onboarding guard)
  "comparison-translation|/comparison/translation|ion-header, main|true"
  "comparison-result|/comparison/result|ion-header, main|true"

  # Semantic (onboarding guard)
  "semantic|/semantic|ion-header, main|true"
  "semantic-concept|/semantic/concept|ion-header, main|true"
  "semantic-verse|/semantic/verse|ion-header, main|true"
  "semantic-community|/semantic/community|ion-header, main|true"

  # AI Coach (onboarding guard)
  "ai-coach|/ai-coach|ion-header, main|true"

  # Settings sub-pages (onboarding guard)
  "settings|/settings|ion-header, main|true"
  "settings-languages|/settings/languages|ion-header, main|true"
  "settings-appearance|/settings/appearance|ion-header, main|true"
  "settings-backup|/settings/backup|ion-header, main|true"
  "settings-about|/settings/about|ion-header, main|true"
  "settings-privacy|/settings/privacy|ion-header, main|true"
  "settings-reminders|/settings/reminders|ion-header, main|true"
  "settings-available-translations|/settings/available-translations|ion-header, main|true"

  # Family (onboarding guard)
  "family-home|/family/home|ion-header, main|true"
  "family-members|/family/members|ion-header, main|true"
  "family-invite|/family/invite|ion-header, main|true"

  # Mastery & Achievements (onboarding guard)
  "mastery|/mastery|ion-header, main|true"
  "achievements|/achievements|ion-header, main|true"

  # Analytics (onboarding guard)
  "analytics-dashboard|/analytics/dashboard|ion-header, main|true"

  # Profile (onboarding guard)
  "profile|/profile|ion-header, main|true"
  "profile-create|/profile/create|ion-header, main|true"
  "profile-select|/profile/select|ion-header, main|true"

  # Notifications (onboarding guard)
  "notifications|/notifications|ion-header, main|true"

  # Search (onboarding guard)
  "search|/search|ion-header, main|true"
)

mkdir -p .stitch

# Build two storage files: one with onboardingCompleted=true, one empty
cat > .stitch/storage-auth.json << 'EOF'
{
  "cookies": [],
  "origins": [
    {
      "origin": "http://localhost:3000",
      "localStorage": [
        {
          "name": "versyflow-settings-storage",
          "value": "{\"uiLanguage\":\"fr\",\"bibleTranslation\":\"lsg\",\"onboardingCompleted\":true}"
        },
        {
          "name": "versyflow:onboarding:completed",
          "value": "true"
        }
      ]
    }
  ]
}
EOF

cat > .stitch/storage-empty.json << 'EOF'
{
  "cookies": [],
  "origins": []
}
EOF

OK=0
FAILED=""

for entry in "${SCREENS[@]}"; do
  IFS='|' read -r name route wait_sel needs_auth <<< "$entry"

  if [[ "$needs_auth" == "true" ]]; then
    storage_file=".stitch/storage-auth.json"
  else
    storage_file=".stitch/storage-empty.json"
  fi

  echo -n "Capturing $name ($route) ... "

  result=$(stitch capture browser \
    --url "${BASE}${route}" \
    --storage "$storage_file" \
    --wait-for "$wait_sel" \
    -o ".stitch/${name}.html" \
    --json 2>&1)

  if echo "$result" | grep -q '"status": "saved"'; then
    OK=$((OK+1))
    echo "OK"
  else
    FAILED="${FAILED} ${name}"
    echo "FAIL"
  fi
done

echo ""
echo "=== DONE: $OK ok"
if [[ -n "$FAILED" ]]; then
  echo "FAILED:$FAILED"
fi
