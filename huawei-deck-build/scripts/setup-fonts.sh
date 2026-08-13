#!/usr/bin/env bash
# Register the bundled Noto CJK fonts in a task-local Fontconfig environment.
# Fonts are pre-extracted in <skill-dir>/assets/fonts/otf/; this script only
# builds a Fontconfig file pointing at that directory and verifies resolution.
#
# Usage:
#   bash setup-fonts.sh              # print the FONTCONFIG_FILE path
#   bash setup-fonts.sh --verify     # print resolved family|style|file lines
#   bash setup-fonts.sh -- cmd args  # run a command with FONTCONFIG_FILE set
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(CDPATH= cd -- "$script_dir/.." && pwd)"
font_dir="$skill_dir/assets/fonts/otf"
runtime_dir="${HUAWEI_DECK_FONT_RUNTIME:-/tmp/huawei-deck-fonts-$(id -u)}"
cache_dir="$runtime_dir/cache"
config_file="$runtime_dir/fonts.conf"

required_fonts=(
  "NotoSansCJKsc-Regular.otf"
  "NotoSansCJKsc-Bold.otf"
)

for font_file in "${required_fonts[@]}"; do
  if [[ ! -s "$font_dir/$font_file" ]]; then
    printf 'Missing bundled font: %s\n' "$font_dir/$font_file" >&2
    exit 1
  fi
done

mkdir -p "$cache_dir"

cat >"$config_file" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <dir>$font_dir</dir>
  <cachedir>$cache_dir</cachedir>
</fontconfig>
EOF

FONTCONFIG_AVAILABLE=true
if ! command -v fc-cache >/dev/null 2>&1 || ! command -v fc-match >/dev/null 2>&1; then
  FONTCONFIG_AVAILABLE=false
fi

if [[ "$FONTCONFIG_AVAILABLE" == true ]]; then
  FONTCONFIG_FILE="$config_file" fc-cache -f "$font_dir" >/dev/null

  match_font() {
    FONTCONFIG_FILE="$config_file" fc-match -f '%{family[0]}|%{style[0]}|%{file}\n' "$1"
  }

  sans_regular="$(match_font 'Noto Sans CJK SC:style=Regular')"
  sans_bold="$(match_font 'Noto Sans CJK SC:style=Bold')"

  check_match() {
    local actual="$1" expected="$2"
    if [[ "$actual" != "$expected" ]]; then
      printf 'Unexpected font match: %s (expected %s)\n' "$actual" "$expected" >&2
      exit 1
    fi
  }

  check_match "$sans_regular"  "Noto Sans CJK SC|Regular|$font_dir/NotoSansCJKsc-Regular.otf"
  check_match "$sans_bold"     "Noto Sans CJK SC|Bold|$font_dir/NotoSansCJKsc-Bold.otf"
else
  # fontconfig is unavailable on this host (common on macOS). Font files are
  # verified above; consumers that manage their own CJK pipeline (engine
  # renderers, OS font books) can use the OTF directory directly.
  printf 'fontconfig not found; verified bundled font files only: %s\n' "$font_dir" >&2
  sans_regular="Noto Sans CJK SC|Regular|$font_dir/NotoSansCJKsc-Regular.otf"
  sans_bold="Noto Sans CJK SC|Bold|$font_dir/NotoSansCJKsc-Bold.otf"
fi

if [[ $# -eq 0 ]]; then
  printf '%s\n' "$config_file"
  exit 0
fi

case "$1" in
  --verify)
    printf '%s\n%s\n' "$sans_regular" "$sans_bold"
    ;;
  --)
    shift
    if [[ $# -eq 0 ]]; then
      printf 'Usage: %s -- command [args...]\n' "$0" >&2
      exit 2
    fi
    exec env FONTCONFIG_FILE="$config_file" "$@"
    ;;
  *)
    printf 'Usage: %s [--verify | -- command [args...]]\n' "$0" >&2
    exit 2
    ;;
esac
