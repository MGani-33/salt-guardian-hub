#!/bin/bash
# Salt Master Installation Script
# Run this on your Salt Master server

set -e

echo "=== Salt Master Installation Script ==="
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
read -p "Enter your dashboard API endpoint (e.g., https://your-project.supabase.co/functions/v1/system-data-receiver): " API_ENDPOINT
read -p "Enter your SALT_API_KEY (generate with: openssl rand -hex 32): " API_KEY

if [ -z "$API_ENDPOINT" ] || [ -z "$API_KEY" ]; then
    echo -e "${RED}API endpoint and API key are required!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Step 1: Adding Salt repository...${NC}"
curl -fsSL https://packages.broadcom.com/artifactory/api/security/keypair/SaltProjectKey/public | tee /etc/apt/keyrings/salt-archive-keyring.pgp > /dev/null
curl -fsSL https://github.com/saltstack/salt-install-guide/releases/latest/download/salt.sources | tee /etc/apt/sources.list.d/salt.sources > /dev/null

echo -e "${GREEN}Step 2: Installing Salt Master...${NC}"
apt update
apt install -y salt-master

echo -e "${GREEN}Step 3: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 4505/tcp
    ufw allow 4506/tcp
    echo "Firewall rules added for ports 4505 and 4506"
else
    echo -e "${YELLOW}UFW not found, skipping firewall configuration${NC}"
fi

echo -e "${GREEN}Step 4: Creating directory structure...${NC}"
mkdir -p /srv/salt/system_reporter
mkdir -p /srv/pillar
mkdir -p /var/log/system-reporter

echo -e "${GREEN}Step 5: Creating Salt State files...${NC}"

# Create init.sls
cat > /srv/salt/system_reporter/init.sls << 'EOF'
system_reporter_packages:
  pkg.installed:
    - pkgs:
      - python3
      - python3-pip
      - dmidecode
      - lsb-release
      - lshw

system_reporter_python_deps:
  pip.installed:
    - names:
      - psutil >= 5.8.0
      - requests >= 2.28.0
    - bin_env: /usr/bin/pip3

system_reporter_log_dir:
  file.directory:
    - name: /var/log/system-reporter
    - user: root
    - group: root
    - mode: 755

system_reporter_script:
  file.managed:
    - name: /usr/local/bin/salt_system_reporter.py
    - source: salt://system_reporter/salt_system_reporter.py
    - mode: 755
    - user: root
    - group: root
    - require:
      - pkg: system_reporter_packages
      - pip: system_reporter_python_deps

system_reporter_config:
  file.managed:
    - name: /etc/system_reporter.conf
    - mode: 600
    - user: root
    - group: root
    - contents: |
        API_ENDPOINT={{ pillar['system_reporter']['api_endpoint'] }}
        API_KEY={{ pillar['system_reporter']['api_key'] }}
    - require:
      - file: system_reporter_script

system_reporter_cron:
  cron.present:
    - name: /usr/local/bin/salt_system_reporter.py >> /var/log/system-reporter/cron.log 2>&1
    - user: root
    - minute: '*/5'
    - identifier: system_reporter
    - require:
      - file: system_reporter_config

system_reporter_initial_run:
  cmd.run:
    - name: /usr/local/bin/salt_system_reporter.py
    - unless: test -f /var/log/system-reporter/first-run.done
    - require:
      - file: system_reporter_config
    - onchanges:
      - file: system_reporter_script

system_reporter_first_run_marker:
  file.managed:
    - name: /var/log/system-reporter/first-run.done
    - mode: 644
    - require:
      - cmd: system_reporter_initial_run
EOF

# Create pillar data
cat > /srv/pillar/system_reporter.sls << EOF
system_reporter:
  api_endpoint: ${API_ENDPOINT}
  api_key: ${API_KEY}
EOF

# Create top.sls files
cat > /srv/salt/top.sls << 'EOF'
base:
  '*':
    - system_reporter
EOF

cat > /srv/pillar/top.sls << 'EOF'
base:
  '*':
    - system_reporter
EOF

echo -e "${GREEN}Step 6: Downloading system reporter script...${NC}"
# Check if script exists in current directory
if [ -f "./salt_system_reporter.py" ]; then
    cp ./salt_system_reporter.py /srv/salt/system_reporter/
    echo "Copied salt_system_reporter.py from current directory"
else
    echo -e "${YELLOW}Warning: salt_system_reporter.py not found in current directory${NC}"
    echo "Please manually copy salt_system_reporter.py to /srv/salt/system_reporter/"
fi

echo -e "${GREEN}Step 7: Starting Salt Master...${NC}"
systemctl enable salt-master
systemctl restart salt-master

echo ""
echo -e "${GREEN}Step 8: Verifying installation...${NC}"
sleep 3
systemctl status salt-master --no-pager

echo ""
echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo ""
echo "Salt Master is now running and configured."
echo ""
echo "Next steps:"
echo "1. Install Salt Minion on your target systems (use install-salt-minion.sh)"
echo "2. Accept minion keys: sudo salt-key -L"
echo "3. Accept a specific minion: sudo salt-key -a <minion-id>"
echo "4. Test connectivity: sudo salt '*' test.ping"
echo "5. Deploy monitoring: sudo salt '*' state.apply system_reporter"
echo ""
echo "Useful commands:"
echo "  - List all keys: sudo salt-key -L"
echo "  - Accept all keys: sudo salt-key -A"
echo "  - Test minion: sudo salt 'minion-id' test.ping"
echo "  - View minion info: sudo salt 'minion-id' grains.items"
echo ""
