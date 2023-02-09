#!/bin/sh

BUG_FILE="node_modules/whatsapp-web.js/src/util/Injected.js"

if ! sed -n 16p "$BUG_FILE" | grep -q '^//'; then
  sed -i '16s/^/\/\//' "$BUG_FILE"
  echo "Line 16 was updated with '//'"
else
  echo "Line 16 already starts with '//'"
fi

npm run start

