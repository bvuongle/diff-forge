#!/bin/bash
rm -f /usr/bin/diff-forge
cat > /usr/bin/diff-forge << 'EOF'
#!/bin/bash
exec bash -ic '
if [ -w /dev/shm ] && [ -u /opt/diff-forge/chrome-sandbox ]; then
  exec /opt/diff-forge/diff-forge "$@"
else
  exec /opt/diff-forge/diff-forge --no-sandbox "$@"
fi
' bash "$@"
EOF
chmod +x /usr/bin/diff-forge

DESKTOP_FILE=/usr/share/applications/diff-forge.desktop
if [ -f "$DESKTOP_FILE" ]; then
  sed -i 's|^Exec=.*|Exec=/usr/bin/diff-forge %U|' "$DESKTOP_FILE"
fi
