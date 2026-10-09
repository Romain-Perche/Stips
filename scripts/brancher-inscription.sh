#!/usr/bin/env bash
#
# Branche le flux d'inscription (TODO.md, tâche 21) : Supabase Auth, Scaleway,
# Railway, Vercel. Ouvre chaque page, dit quoi cliquer, écrit backend/.env.
# Relançable : une valeur déjà écrite est proposée par défaut.
#
# Généré par le skill /wizard. Tout ce qui est au-dessus du repère « STAGES »
# est la bibliothèque du gabarit, identique dans chaque wizard : ne pas la
# modifier à la main. Les étapes sont en dessous.

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────
# Wizard library: delightful, consistent UX, identical across every wizard.
# ──────────────────────────────────────────────────────────────────────────

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
  BOLD=$(tput bold); DIM=$(tput dim); RESET=$(tput sgr0)
  BLUE=$(tput setaf 4); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3); RED=$(tput setaf 1)
else
  BOLD=""; DIM=""; RESET=""; BLUE=""; GREEN=""; YELLOW=""; RED=""
fi

# Author sets this at the top of the stages section.
TOTAL_STAGES=0

_STAGE_INDEX=0
ENV_FILE="${ENV_FILE:-.env}"
WRITTEN_ENV=()    # KEYs written to ENV_FILE this run
WRITTEN_SECRET=() # secret NAMEs set this run
SKIPPED=()        # things we couldn't do (e.g. gh missing)

# _clear wipes the terminal so only the current step is on screen. No-op when
# output isn't a terminal, so piped logs stay readable.
_clear() {
  [[ -t 1 ]] || return 0
  if command -v tput >/dev/null 2>&1; then tput clear; else printf '\033[2J\033[3J\033[H'; fi
}

# banner "Title" shows the opening frame: what this wizard does.
banner() {
  _clear
  printf '\n%s%s  %s%s\n' "$BOLD" "$BLUE" "$1" "$RESET"
  printf '%s  %s stages%s\n\n' "$DIM" "$TOTAL_STAGES" "$RESET"
  printf '%s  You drive the browser; this wizard tells you exactly what to do and\n' "$DIM"
  printf '  captures the values you copy back. Stop any time with Ctrl-C and re-run\n'
  printf '  later, since it remembers values already saved.%s\n' "$RESET"
  pause "Ready to start?"
}

# stage "Name" clears the screen, then announces a stage and shows progress.
# Clearing keeps only the current step on screen.
stage() {
  _clear
  _STAGE_INDEX=$((_STAGE_INDEX + 1))
  printf '\n%s%s▸ Stage %s/%s · %s%s\n' \
    "$BOLD" "$BLUE" "$_STAGE_INDEX" "$TOTAL_STAGES" "$1" "$RESET"
}

# say "..." prints a plain instruction line.
say()  { printf '  %s\n' "$1"; }
# step "..." is a numbered-feeling action the human takes in the browser.
step() { printf '  %s•%s %s\n' "$BLUE" "$RESET" "$1"; }
note() { printf '  %s%s%s\n' "$DIM" "$1" "$RESET"; }
warn() { printf '  %s⚠ %s%s\n' "$YELLOW" "$1" "$RESET"; }

# open_url URL opens it in the human's browser, cross-platform incl. WSL.
open_url() {
  local url="$1"
  printf '  %s↗ opening%s %s\n' "$GREEN" "$RESET" "$url"
  { if   command -v wslview     >/dev/null 2>&1; then wslview "$url"
    elif command -v explorer.exe >/dev/null 2>&1; then explorer.exe "$url"
    elif command -v xdg-open    >/dev/null 2>&1; then xdg-open "$url"
    elif command -v open        >/dev/null 2>&1; then open "$url"
    else warn "couldn't open a browser; visit it manually: $url"; fi
  } >/dev/null 2>&1 || warn "couldn't open a browser, so visit it manually: $url"
}

# pause "msg" waits for the human to confirm they've done the manual part.
pause() {
  printf '  %s%s%s ' "$DIM" "${1:-Press Enter to continue}" "$RESET"
  read -r _ || true
}

# confirm "question" is a y/N gate; returns success on yes.
confirm() {
  local reply=""
  printf '  %s? %s [y/N] ' "$YELLOW" "$1"
  read -r reply || true
  [[ "$reply" =~ ^[Yy] ]]
}

# _existing KEY: current value of KEY in ENV_FILE, if any.
_existing() {
  [[ -f "$ENV_FILE" ]] || return 1
  local line; line=$(grep -E "^${1}=" "$ENV_FILE" | tail -n1) || return 1
  printf '%s' "${line#*=}"
}

# ask KEY "Prompt" reads a value into $KEY. Offers the existing .env value as
# a default on re-runs (Enter keeps it). Visible input (non-secret).
ask() {
  local key="$1" prompt="$2" current input
  current=$(_existing "$key" || true)
  if [[ -n "$current" ]]; then
    printf '  %s%s%s %s[Enter keeps current]%s ' "$BOLD" "$prompt" "$RESET" "$DIM" "$RESET"
  else
    printf '  %s%s%s ' "$BOLD" "$prompt" "$RESET"
  fi
  read -r input || true
  [[ -z "$input" && -n "$current" ]] && input="$current"
  printf -v "$key" '%s' "$input"
}

# ask_secret KEY "Prompt" is like ask, but input is hidden.
ask_secret() {
  local key="$1" prompt="$2" current input
  current=$(_existing "$key" || true)
  if [[ -n "$current" ]]; then
    printf '  %s%s%s %s[Enter keeps current]%s ' "$BOLD" "$prompt" "$RESET" "$DIM" "$RESET"
  else
    printf '  %s%s%s ' "$BOLD" "$prompt" "$RESET"
  fi
  read -rs input || true
  printf '\n'
  [[ -z "$input" && -n "$current" ]] && input="$current"
  printf -v "$key" '%s' "$input"
}

# write_env KEY VALUE upserts KEY=VALUE into ENV_FILE (creates it; replaces
# any existing line). Idempotent.
write_env() {
  local key="$1" value="$2" tmp
  touch "$ENV_FILE"
  tmp=$(mktemp)
  grep -vE "^${key}=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  WRITTEN_ENV+=("$key")
  printf '  %s✓ wrote%s %s → %s\n' "$GREEN" "$RESET" "$key" "$ENV_FILE"
}

# set_secret NAME VALUE sets a GitHub Actions repo secret via gh. Falls back
# to a warning (and records it) if gh is unavailable or unauthenticated.
set_secret() {
  local name="$1" value="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if printf '%s' "$value" | gh secret set "$name" >/dev/null 2>&1; then
      WRITTEN_SECRET+=("$name")
      printf '  %s✓ set%s GitHub secret %s\n' "$GREEN" "$RESET" "$name"
      return
    fi
  fi
  SKIPPED+=("GitHub secret $name (set it manually: gh secret set $name)")
  warn "skipped GitHub secret $name: gh not ready; set it later"
}

# set_var NAME VALUE sets a GitHub Actions repo variable (non-secret).
set_var() {
  local name="$1" value="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if gh variable set "$name" --body "$value" >/dev/null 2>&1; then
      printf '  %s✓ set%s GitHub variable %s\n' "$GREEN" "$RESET" "$name"
      return
    fi
  fi
  SKIPPED+=("GitHub variable $name")
  warn "skipped GitHub variable $name, gh not ready; set it later"
}

# finish clears, then shows a closing summary of everything configured.
finish() {
  _clear
  printf '\n%s%s  ✓ Setup complete%s\n' "$BOLD" "$GREEN" "$RESET"
  (( ${#WRITTEN_ENV[@]} ))    && note "wrote ${#WRITTEN_ENV[@]} value(s) to $ENV_FILE: ${WRITTEN_ENV[*]}"
  (( ${#WRITTEN_SECRET[@]} )) && note "set ${#WRITTEN_SECRET[@]} GitHub secret(s): ${WRITTEN_SECRET[*]}"
  if (( ${#SKIPPED[@]} )); then
    printf '\n'; warn "still to do by hand:"
    for s in "${SKIPPED[@]}"; do note "  - $s"; done
  fi
  printf '\n'
}

# ──────────────────────────────────────────────────────────────────────────
# STAGES : une étape par geste que seul un humain peut faire.
# ──────────────────────────────────────────────────────────────────────────

TOTAL_STAGES=10

# Le script se lance depuis n'importe où ; tout est relatif à la racine du repo.
cd "$(dirname "$0")/.."
ENV_FILE="backend/.env"
[[ -f "$ENV_FILE" ]] || cp backend/.env.example "$ENV_FILE"

# L'identifiant du projet Supabase, pour ouvrir directement les bonnes pages.
REF=$(_existing SUPABASE_URL | sed -E 's#https://([a-z0-9]+)\.supabase\.co.*#\1#' || true)
[[ "$REF" == *"["* || -z "$REF" ]] && REF="_"
DASH="https://supabase.com/dashboard/project/$REF"

banner "Brancher le flux d'inscription (TODO.md, tâche 21)"

# ── 1 ──────────────────────────────────────────────────────────────────────
stage "Le serveur local : backend/.env"
say "Trois valeurs que personne d'autre ne fournit."
if [[ -z "$(_existing SECRET || true)" ]]; then
  write_env SECRET "$(openssl rand -base64 32 | tr -d '\n')"
  note "SECRET généré (signe le cookie de session et les liens de validation)."
else
  note "SECRET déjà présent, conservé."
fi
ask SITE_URL "URL du site vue par le serveur local [http://localhost:5173] :"
write_env SITE_URL "${SITE_URL:-http://localhost:5173}"
ask ADMIN_EMAIL "Ton e-mail, qui recevra chaque demande à valider :"
write_env ADMIN_EMAIL "$ADMIN_EMAIL"
pause

# ── 2 ──────────────────────────────────────────────────────────────────────
stage "Supabase : clés du projet"
if [[ -n "$(_existing SUPABASE_SECRET_KEY || true)" && "$REF" != "_" ]]; then
  note "SUPABASE_URL et SUPABASE_SECRET_KEY sont déjà dans backend/.env : rien à faire."
else
  open_url "$DASH/settings/api-keys"
  step "Copie l'URL du projet (https://….supabase.co)."
  ask SUPABASE_URL "Colle SUPABASE_URL :"
  write_env SUPABASE_URL "$SUPABASE_URL"
  step "Onglet « API Keys » → Secret keys → copie la clé sb_secret_…"
  ask_secret SUPABASE_SECRET_KEY "Colle SUPABASE_SECRET_KEY (saisie masquée) :"
  write_env SUPABASE_SECRET_KEY "$SUPABASE_SECRET_KEY"
fi
pause

# ── 3 ──────────────────────────────────────────────────────────────────────
stage "Supabase : où les liens des e-mails ramènent"
open_url "$DASH/auth/url-configuration"
step "Site URL : https://stips.club"
step "Redirect URLs → Add URL, deux fois :"
say "      https://stips.club/invitation"
say "      http://localhost:5173/invitation"
note "Le backend passe SITE_URL/invitation à chaque envoi ; Supabase refuse toute URL hors de cette liste."
pause "Fait ? Entrée pour continuer"

# ── 4 ──────────────────────────────────────────────────────────────────────
stage "Supabase : les deux gabarits d'e-mail, en français"
open_url "$DASH/auth/templates"
say "Gabarit « Invite user » — Subject : Ton invitation Stips"
cat <<'GABARIT'
  ──────────────────────────────────────────────────────────────
  <p>Bonjour {{ .Data.prenom }},</p>
  {{ if .Data.parrain }}
  <p>{{ .Data.parrain }} te fait entrer dans Stips. Son mot sur toi t'attend derrière ce lien :</p>
  {{ else }}
  <p>Ton compte pro Stips est prêt. Ce lien t'y connecte :</p>
  {{ end }}
  <p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Ouvrir mon invitation</a></p>
  <p>Ce lien ne sert qu'une fois. S'il a expiré, demande un nouveau lien sur https://stips.club/connexion.</p>
  <p>L'équipe Stips</p>
  ──────────────────────────────────────────────────────────────
GABARIT
pause "Gabarit « Invite user » enregistré ? Entrée pour le second"
say "Gabarit « Magic Link » — Subject : Ton lien de connexion Stips"
cat <<'GABARIT'
  ──────────────────────────────────────────────────────────────
  <p>Bonjour,</p>
  <p>Voici ton lien de connexion à Stips, valable une heure et une seule fois :</p>
  <p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Me connecter</a></p>
  <p>Si tu n'as rien demandé, ignore cet e-mail : rien ne se passe sans ce clic.</p>
  <p>L'équipe Stips</p>
  ──────────────────────────────────────────────────────────────
GABARIT
note "Le lien pointe vers stips.club, jamais vers supabase.co : c'est ce qui évite le spam."
pause "Les deux gabarits sont enregistrés ? Entrée pour continuer"

# ── 5 ──────────────────────────────────────────────────────────────────────
stage "Supabase : durée du jeton"
open_url "$DASH/auth/providers"
step "Ouvre le fournisseur « Email »."
step "« Email OTP Expiration » : 86400 (24 h, le maximum). Enregistre."
note "L'invitation vaut 7 jours côté Stips ; passé 24 h, le stagiaire redemande un lien sur /connexion."
pause "Fait ? Entrée pour continuer"

# ── 6 ──────────────────────────────────────────────────────────────────────
stage "Scaleway : la clé du backend"
say "Une application IAM à part, pas celle de supabase-auth : une clé par usage, révocable seule."
open_url "https://console.scaleway.com/iam/applications"
step "Create application → nom « stips-backend » → Create."
step "Onglet Policies → Create policy → principal : l'application stips-backend ;"
say "      règle : projet « production », permission set « TransactionalEmailFullAccess »."
step "Onglet API keys de l'application → Generate API key → copie la Secret key (affichée une fois)."
ask_secret SCALEWAY_SECRET_KEY "Colle SCALEWAY_SECRET_KEY (saisie masquée) :"
write_env SCALEWAY_SECRET_KEY "$SCALEWAY_SECRET_KEY"
open_url "https://console.scaleway.com/project/settings"
step "Projet « production » → Project ID."
ask SCALEWAY_PROJECT_ID "Colle SCALEWAY_PROJECT_ID :"
write_env SCALEWAY_PROJECT_ID "$SCALEWAY_PROJECT_ID"
write_env EXPEDITEUR "bonjour@mail.stips.club"

# ── 7 ──────────────────────────────────────────────────────────────────────
stage "Railway : le serveur"
open_url "https://railway.com/dashboard"
step "Projet « Stips » → New → GitHub Repo → ce dépôt, branche main."
step "Settings → Region : EU West (Amsterdam). Pas de « add Postgres » : la base est chez Supabase."
step "Settings → Build : Build command « npm ci » ; Deploy : Start command « npm start -w backend »."
step "Variables → Raw editor : colle le contenu de backend/.env, puis change :"
say "      SITE_URL=https://stips.club"
say "      NODE_ENV=production"
say "      (supprime la ligne PORT : Railway l'impose)"
note "Railway lit les variables du service ; rien n'est committé."
pause "Le service est déployé et vert ? Entrée pour continuer"

# ── 8 ──────────────────────────────────────────────────────────────────────
stage "Railway : api.stips.club"
step "Service → Settings → Networking → Custom Domain : api.stips.club. Railway affiche une cible CNAME."
open_url "https://vercel.com/dashboard/domains"
step "stips.club → DNS Records → Add : type CNAME, name « api », value : la cible donnée par Railway."
note "Le site réécrit /api/* vers api.stips.club (frontend/vercel.json) : sans ce domaine, le site ne parle à rien."
pause "Railway affiche le domaine comme actif ? Entrée pour continuer"

# ── 9 ──────────────────────────────────────────────────────────────────────
stage "Vercel : la racine du projet"
open_url "https://vercel.com/dashboard"
step "Projet le-club → Settings → Build and Deployment → Root Directory."
say "  Doit valoir « frontend » : c'est là qu'est vercel.json (réécritures /api et pages)."
if confirm "Root Directory vaut bien « frontend » ?"; then
  note "Parfait."
else
  SKIPPED+=("Vercel : déplacer frontend/vercel.json à l'endroit que Vercel lit, ou régler Root Directory sur frontend")
fi

# ── 10 ─────────────────────────────────────────────────────────────────────
stage "Vérification"
say "Le serveur en ligne doit répondre à /config :"
if curl -fsS --max-time 10 https://api.stips.club/config; then
  printf '\n'; note "✓ api.stips.club répond."
else
  warn "api.stips.club ne répond pas encore (DNS en propagation ? déploiement en cours ?). Réessaie dans quelques minutes."
  SKIPPED+=("vérifier : curl https://api.stips.club/config")
fi
say ""
say "Puis un vrai tour : https://stips.club/demande avec ton propre e-mail comme stagiaire"
say "et une autre adresse à toi comme pro — tu recevras les quatre e-mails dans l'ordre."
pause

finish
