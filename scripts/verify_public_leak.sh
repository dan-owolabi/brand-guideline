#!/usr/bin/env bash
# Probe the production Supabase project as an ANONYMOUS caller and report
# whether the column-selection leak is open.
#
#   bash scripts/verify_public_leak.sh
#
# Run it BEFORE applying migrations 010/011 to see the leak, and AFTER to
# confirm it is closed. Exits non-zero while anything is still exposed.
#
# Reads credentials from vite/.env (the anon key is public by design — it
# ships in the client bundle — so this proves what any visitor can do).

set -uo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="vite/.env"
[[ -f "$ENV_FILE" ]] || { echo "missing $ENV_FILE"; exit 2; }

URL=$(grep '^VITE_SUPABASE_URL' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"'' | xargs)
KEY=$(grep '^VITE_SUPABASE_ANON_KEY' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"'' | xargs)
[[ -n "$URL" && -n "$KEY" ]] || { echo "could not read URL/key from $ENV_FILE"; exit 2; }

echo "Probing $URL as anonymous (apikey only, no Authorization header)"
echo

fail=0
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

# has_key <label> <path> <json-key>  -> leak if the key comes back populated
has_key() {
  local label="$1" path="$2" key="$3"
  printf '  %-46s' "$label"
  local code
  code=$(curl -s -o "$tmp" -w '%{http_code}' "$URL/rest/v1/$path" -H "apikey: $KEY")
  local verdict
  verdict=$(python3 - "$tmp" "$key" <<'PY'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    print("PARSE_ERR"); raise SystemExit
k = sys.argv[2]
if isinstance(d, list):
    print("EXPOSED" if d and k in d[0] else "clean")
else:
    print("denied")
PY
)
  if [[ "$verdict" == "EXPOSED" ]]; then
    echo "LEAKING (http $code)"; fail=1
  else
    echo "ok ($verdict, http $code)"
  fi
}

# must_work <label> <path> -> the public site depends on this; must return rows
must_work() {
  local label="$1" path="$2"
  printf '  %-46s' "$label"
  local code
  code=$(curl -s -o "$tmp" -w '%{http_code}' "$URL/rest/v1/$path" -H "apikey: $KEY")
  if [[ "$code" == "200" ]]; then
    echo "ok (http 200)"
  else
    echo "BROKEN (http $code)"; fail=1
  fi
}

echo "Must be CLOSED (migrations 010 + 011):"
has_key "brands.draft via ?select="            "brands?select=draft&limit=1"              draft
has_key "accounts.billing_email via ?select="  "accounts?select=billing_email&limit=1"    billing_email
has_key "accounts.plan via ?select="           "accounts?select=plan&limit=1"             plan

echo
echo "Must KEEP WORKING (public brand pages):"
must_work "public_brands view readable"        "public_brands?select=id,name,slug&limit=1"
must_work "public_accounts view readable"      "public_accounts?select=id,custom_domain&limit=1"
has_key   "public_brands must NOT expose draft" "public_brands?select=draft&limit=1"      draft

# The public /assets page reads these directly as anon. After migration 011
# they returned "401 permission denied for table brands" — the RLS policy on
# assets referenced brands in a subquery, and anon had just lost that grant.
# Migration 013 moves the policy behind SECURITY DEFINER helpers. Asserted, not
# merely reported, because a 401 here is a broken public page.
must_work "assets readable by anon (public assets page)"      "assets?select=id&limit=1"
must_work "collections readable by anon (public assets page)" "collections?select=id&limit=1"

echo
if [[ $fail -eq 0 ]]; then
  echo "PASS — no exposure detected."
else
  echo "FAIL — see LEAKING/BROKEN lines above."
fi
exit $fail
