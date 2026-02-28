#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

die() { echo -e "${RED}error:${NC} $1" >&2; exit 1; }
info() { echo -e "${CYAN}::${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGE_JSON="$REPO_ROOT/package.json"
CARGO_TOML="$REPO_ROOT/src-tauri/Cargo.toml"

usage() {
  echo -e "${BOLD}Usage:${NC} pnpm release <patch|minor|major|x.y.z>"
  echo ""
  echo "  patch   Bump patch version  (0.4.0 → 0.4.1)"
  echo "  minor   Bump minor version  (0.4.0 → 0.5.0)"
  echo "  major   Bump major version  (0.4.0 → 1.0.0)"
  echo "  x.y.z   Set explicit version"
  exit 1
}

[[ $# -eq 1 ]] || usage

# --- Pre-flight checks ---

if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
  die "Working tree is dirty. Commit or stash changes first."
fi

BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  die "Must be on the ${BOLD}main${NC} branch (currently on ${BOLD}$BRANCH${NC})."
fi

# --- Read current version ---

CURRENT=$(node -p "require('$PACKAGE_JSON').version")
info "Current version: ${BOLD}$CURRENT${NC}"

IFS='.' read -r CUR_MAJOR CUR_MINOR CUR_PATCH <<< "$CURRENT"

# --- Calculate new version ---

ARG="$1"
case "$ARG" in
  patch) NEW_VERSION="$CUR_MAJOR.$CUR_MINOR.$((CUR_PATCH + 1))" ;;
  minor) NEW_VERSION="$CUR_MAJOR.$((CUR_MINOR + 1)).0" ;;
  major) NEW_VERSION="$((CUR_MAJOR + 1)).0.0" ;;
  *)
    if [[ ! "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
      die "Invalid version: $ARG (expected semver like 1.2.3 or 1.0.0-rc.1)"
    fi
    NEW_VERSION="$ARG"
    ;;
esac

info "New version:     ${BOLD}$NEW_VERSION${NC}"
echo ""

# --- Update files ---

node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
"
success "Updated package.json"

sed -i "0,/^version = \".*\"/s//version = \"$NEW_VERSION\"/" "$CARGO_TOML"
success "Updated src-tauri/Cargo.toml"

# --- Commit & tag ---

git -C "$REPO_ROOT" add "$PACKAGE_JSON" "$CARGO_TOML"
git -C "$REPO_ROOT" commit -m "chore: release v$NEW_VERSION"
success "Created commit"

git -C "$REPO_ROOT" tag "v$NEW_VERSION"
success "Created tag ${BOLD}v$NEW_VERSION${NC}"

echo ""

# --- Push ---

read -rp "$(echo -e "${YELLOW}Push commit and tag to origin? [y/N]${NC} ")" CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  git -C "$REPO_ROOT" push origin main
  git -C "$REPO_ROOT" push origin "v$NEW_VERSION"
  echo ""
  success "Pushed! Release workflow will start shortly."
  echo -e "  ${CYAN}→${NC} https://github.com/LeagueToolkit/ltk-manager/actions"
else
  echo ""
  warn "Skipped push. When ready, run:"
  echo "  git push origin main && git push origin v$NEW_VERSION"
fi
