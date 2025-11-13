#!/bin/bash
# Salt Minion Installation Script
# Run this on each system you want to monitor

set -e

echo "=== Salt Minion Installation Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

# Get configuration
read -p "Enter Salt Master IP address or hostname: " MASTER_IP
read -p "Enter a unique ID for this minion (e.g., web-server-01): " MINION_ID

if [ -z "$MASTER_IP" ] || [ -z "$MINION_ID" ]; then
    echo -e "${RED}Master IP and Minion ID are required!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Step 1: Adding Salt repository...${NC}"
curl -fsSL https://packages.broadcom.com/artifactory/api/security/keypair/SaltProjectKey/public | tee /etc/apt/keyrings/salt-archive-keyring.pgp > /dev/null
curl -fsSL https://github.com/saltstack/salt-install-guide/releases/latest/download/salt.sources | tee /etc/apt/sources.list.d/salt.sources > /dev/null

echo -e "${GREEN}Step 2: Installing Salt Minion...${NC}"
apt update
apt install -y salt-minion

echo -e "${GREEN}Step 3: Configuring Salt Minion...${NC}"
cat > /etc/salt/minion << EOF
# Salt Minion Configuration
master: ${MASTER_IP}
id: ${MINION_ID}

# Retry settings
master_alive_interval: 30
master_tries: 3

# Logging
log_level: warning
log_file: /var/log/salt/minion
EOF

echo -e "${GREEN}Step 4: Starting Salt Minion...${NC}"
systemctl enable salt-minion
systemctl restart salt-minion

echo ""
echo -e "${GREEN}Step 5: Verifying installation...${NC}"
sleep 3
systemctl status salt-minion --no-pager

echo ""
echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo ""
echo "Minion ID: ${MINION_ID}"
echo "Master IP: ${MASTER_IP}"
echo ""
echo "Next steps on the Salt Master:"
echo "1. List pending keys: sudo salt-key -L"
echo "2. Accept this minion: sudo salt-key -a ${MINION_ID}"
echo "3. Test connection: sudo salt '${MINION_ID}' test.ping"
echo "4. Deploy monitoring: sudo salt '${MINION_ID}' state.apply system_reporter"
echo ""
