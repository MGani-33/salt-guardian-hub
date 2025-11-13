#!/bin/bash
# Deploy Monitoring to Salt Minions
# Run this on your Salt Master after minions are connected

set -e

echo "=== Deploy System Monitoring Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

# Check if salt-master is running
if ! systemctl is-active --quiet salt-master; then
    echo -e "${RED}Salt Master is not running!${NC}"
    exit 1
fi

echo -e "${BLUE}Available deployment options:${NC}"
echo "1. Deploy to a single minion"
echo "2. Deploy to multiple specific minions"
echo "3. Deploy to all minions (batch mode - recommended for 1000+ systems)"
echo "4. Deploy to minions matching a pattern"
echo "5. Test deployment (dry-run)"
echo ""

read -p "Select option (1-5): " OPTION

case $OPTION in
    1)
        read -p "Enter minion ID: " MINION_ID
        echo ""
        echo -e "${GREEN}Deploying to ${MINION_ID}...${NC}"
        salt "${MINION_ID}" state.apply system_reporter
        ;;
    2)
        read -p "Enter minion IDs (comma-separated, e.g., web-01,web-02): " MINIONS
        IFS=',' read -ra MINION_ARRAY <<< "$MINIONS"
        echo ""
        for minion in "${MINION_ARRAY[@]}"; do
            echo -e "${GREEN}Deploying to ${minion}...${NC}"
            salt "${minion// /}" state.apply system_reporter
        done
        ;;
    3)
        read -p "Enter batch percentage (e.g., 10 for 10% at a time): " BATCH
        echo ""
        echo -e "${YELLOW}This will deploy to all minions in batches of ${BATCH}%${NC}"
        read -p "Continue? (yes/no): " CONFIRM
        if [ "$CONFIRM" = "yes" ]; then
            echo -e "${GREEN}Starting batch deployment...${NC}"
            salt -b "${BATCH}%" '*' state.apply system_reporter
        else
            echo "Deployment cancelled"
        fi
        ;;
    4)
        read -p "Enter minion pattern (e.g., 'web-*' or 'G@os:Ubuntu'): " PATTERN
        echo ""
        echo -e "${GREEN}Deploying to minions matching: ${PATTERN}${NC}"
        salt "${PATTERN}" state.apply system_reporter
        ;;
    5)
        read -p "Enter minion pattern to test (or '*' for all): " PATTERN
        echo ""
        echo -e "${BLUE}Running dry-run test...${NC}"
        salt "${PATTERN}" state.apply system_reporter test=True
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""
echo "Verification steps:"
echo "1. Check minion logs: salt 'minion-id' cmd.run 'tail -n 50 /var/log/system-reporter/cron.log'"
echo "2. Verify cron job: salt 'minion-id' cmd.run 'crontab -l'"
echo "3. Check script permissions: salt 'minion-id' cmd.run 'ls -l /usr/local/bin/salt_system_reporter.py'"
echo "4. View dashboard to confirm data is flowing"
echo ""
echo "Troubleshooting:"
echo "  - View state results: salt 'minion-id' state.show_highstate"
echo "  - Test script manually: salt 'minion-id' cmd.run '/usr/local/bin/salt_system_reporter.py'"
echo "  - Check config: salt 'minion-id' cmd.run 'cat /etc/system_reporter.conf'"
echo ""
