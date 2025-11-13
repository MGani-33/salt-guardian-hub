# Salt Stack Implementation Guide

## What is Salt Stack?

Salt Stack is a powerful infrastructure automation, configuration management, and remote execution engine. It uses a master-minion architecture to manage thousands of systems efficiently.

## Architecture Overview

```
┌─────────────────────┐
│   Salt Master       │  ← Your central server
│   (Control Center)  │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐     ┌───▼───┐
│Minion │     │Minion │  ← Your 1000 systems
│System │     │System │
└───────┘     └───────┘
```

## Implementation Steps

### Phase 1: Salt Master Setup (Central Server)

#### 1.1 Install Salt Master on Ubuntu

```bash
# Add Salt repository
curl -fsSL https://packages.broadcom.com/artifactory/api/security/keypair/SaltProjectKey/public | sudo tee /etc/apt/keyrings/salt-archive-keyring.pgp
curl -fsSL https://github.com/saltstack/salt-install-guide/releases/latest/download/salt.sources | sudo tee /etc/apt/sources.list.d/salt.sources

# Update and install
sudo apt update
sudo apt install -y salt-master salt-api salt-ssh

# Start and enable services
sudo systemctl enable salt-master
sudo systemctl start salt-master
```

#### 1.2 Configure Salt Master

Edit `/etc/salt/master`:

```yaml
# Interface to bind to
interface: 0.0.0.0

# Port for minions to connect
publish_port: 4505
ret_port: 4506

# Worker threads (adjust based on number of minions)
worker_threads: 10

# File roots (where Salt states are stored)
file_roots:
  base:
    - /srv/salt

# Pillar roots (where configuration data is stored)
pillar_roots:
  base:
    - /srv/pillar

# Auto accept all minion keys (use with caution)
# For production, manually accept keys
auto_accept: False

# Logging
log_level: warning
log_level_logfile: debug

# Enable Salt API for REST interface
rest_cherrypy:
  port: 8000
  ssl_crt: /etc/pki/tls/certs/localhost.crt
  ssl_key: /etc/pki/tls/certs/localhost.key
```

Restart Salt Master:
```bash
sudo systemctl restart salt-master
```

#### 1.3 Configure Firewall

```bash
# Allow Salt Master ports
sudo ufw allow 4505/tcp  # Publishing port
sudo ufw allow 4506/tcp  # Return port
sudo ufw allow 8000/tcp  # API port (if using REST API)
sudo ufw enable
```

### Phase 2: Salt Minion Setup (Client Systems)

#### 2.1 Install Salt Minion on Ubuntu Systems

```bash
# On each minion system
curl -fsSL https://packages.broadcom.com/artifactory/api/security/keypair/SaltProjectKey/public | sudo tee /etc/apt/keyrings/salt-archive-keyring.pgp
curl -fsSL https://github.com/saltstack/salt-install-guide/releases/latest/download/salt.sources | sudo tee /etc/apt/sources.list.d/salt.sources

sudo apt update
sudo apt install -y salt-minion

# Start and enable
sudo systemctl enable salt-minion
sudo systemctl start salt-minion
```

#### 2.2 Configure Salt Minion

Edit `/etc/salt/minion`:

```yaml
# IP or hostname of Salt Master
master: YOUR_MASTER_IP_OR_HOSTNAME

# Unique ID for this minion (defaults to hostname)
id: system-unique-name

# Grains (static information about the minion)
grains:
  roles:
    - webserver
  environment: production
```

Restart minion:
```bash
sudo systemctl restart salt-minion
```

#### 2.3 Accept Minion Keys on Master

```bash
# On Salt Master
# List pending keys
sudo salt-key -L

# Accept all pending keys
sudo salt-key -A

# Or accept specific key
sudo salt-key -a minion-hostname
```

### Phase 3: Deploy Monitoring Integration

#### 3.1 Create Salt State for System Reporter

Create `/srv/salt/system_reporter/init.sls`:

```yaml
# Install dependencies
system_reporter_packages:
  pkg.installed:
    - pkgs:
      - python3
      - python3-pip
      - dmidecode
      - lsb-release

system_reporter_python_deps:
  pip.installed:
    - names:
      - psutil
      - requests
    - bin_env: /usr/bin/pip3

# Copy the reporter script
system_reporter_script:
  file.managed:
    - name: /usr/local/bin/salt_system_reporter.py
    - source: salt://system_reporter/salt_system_reporter.py
    - mode: 755
    - user: root
    - group: root

# Create config file with API credentials
system_reporter_config:
  file.managed:
    - name: /etc/system_reporter.conf
    - mode: 600
    - user: root
    - group: root
    - contents: |
        API_ENDPOINT=https://rqnqmvyfgjmnhniupqnr.supabase.co/functions/v1/system-data-receiver
        API_KEY={{ pillar['system_reporter']['api_key'] }}

# Set up cron job
system_reporter_cron:
  cron.present:
    - name: /usr/local/bin/salt_system_reporter.py
    - user: root
    - minute: '*/5'
    - identifier: system_reporter
```

#### 3.2 Create Pillar Data for API Key

Create `/srv/pillar/system_reporter.sls`:

```yaml
system_reporter:
  api_key: YOUR_GENERATED_API_KEY_HERE
```

Create `/srv/pillar/top.sls`:

```yaml
base:
  '*':
    - system_reporter
```

#### 3.3 Copy Python Script to Salt File Server

```bash
# Copy your script to Salt's file server
sudo cp server-scripts/salt_system_reporter.py /srv/salt/system_reporter/
```

#### 3.4 Apply State to All Minions

```bash
# Test on one minion first
sudo salt 'minion-name' state.apply system_reporter test=True

# Apply to all minions
sudo salt '*' state.apply system_reporter
```

### Phase 4: Salt Automation Patterns

#### 4.1 Remote Command Execution

```bash
# Run command on all minions
sudo salt '*' cmd.run 'uptime'

# Target specific minions
sudo salt 'web*' cmd.run 'systemctl status nginx'

# Use grains for targeting
sudo salt -G 'roles:webserver' cmd.run 'apt update'
```

#### 4.2 State Management

```bash
# Apply high state (all states)
sudo salt '*' state.highstate

# Apply specific state
sudo salt '*' state.apply system_reporter

# Check state with test mode
sudo salt '*' state.apply system_reporter test=True
```

#### 4.3 Orchestration Runner

Create `/srv/salt/orchestrate/deploy_reporter.sls`:

```yaml
# Stage 1: Install dependencies on all systems
install_dependencies:
  salt.state:
    - tgt: '*'
    - sls:
      - system_reporter

# Stage 2: Verify installation
verify_installation:
  salt.function:
    - name: cmd.run
    - tgt: '*'
    - arg:
      - '/usr/local/bin/salt_system_reporter.py --verify'
    - require:
      - salt: install_dependencies
```

Run orchestration:
```bash
sudo salt-run state.orchestrate orchestrate.deploy_reporter
```

#### 4.4 Event Reactor

Create `/srv/reactor/system_alert.sls`:

```yaml
# React to system events
alert_admin:
  local.cmd.run:
    - tgt: master
    - arg:
      - 'echo "System {{ data["id"] }} reported issue" | mail admin@example.com'
```

Configure in `/etc/salt/master`:

```yaml
reactor:
  - 'salt/minion/*/start':
    - /srv/reactor/system_alert.sls
```

### Phase 5: Monitoring and Maintenance

#### 5.1 Check Minion Status

```bash
# Test connectivity
sudo salt '*' test.ping

# Get system information
sudo salt '*' grains.items

# Check minion versions
sudo salt '*' test.version
```

#### 5.2 Schedule Automated Reports

Create `/srv/salt/schedule/system_checks.sls`:

```yaml
schedule:
  system_health_check:
    function: cmd.run
    args:
      - '/usr/local/bin/salt_system_reporter.py'
    minutes: 5
```

Apply to minions:
```bash
sudo salt '*' state.apply schedule.system_checks
```

#### 5.3 Log Management

```bash
# View Salt Master logs
sudo tail -f /var/log/salt/master

# View minion logs (on minion)
sudo tail -f /var/log/salt/minion

# Check job history
sudo salt-run jobs.list_jobs
```

### Phase 6: Security Best Practices

#### 6.1 Key Management

```bash
# Reject compromised key
sudo salt-key -d minion-name

# Rotate master key (requires minion restart)
sudo salt-key --gen-keys=master
sudo systemctl restart salt-master
```

#### 6.2 Encrypted Pillar Data

```bash
# Generate GPG key
sudo salt-run nacl.keygen

# Encrypt sensitive data
sudo salt-run nacl.enc 'api-key-value'
```

Use in pillar:
```yaml
system_reporter:
  api_key: |
    -----BEGIN PGP MESSAGE-----
    ENCRYPTED_DATA_HERE
    -----END PGP MESSAGE-----
```

#### 6.3 Network Security

- Use VPN or private network for Salt communication
- Implement firewall rules to restrict access
- Use SSL certificates for Salt API
- Enable authentication for Salt API

### Phase 7: Integration with Dashboard

#### 7.1 Salt API Setup

Configure Salt API user in `/etc/salt/master.d/auth.conf`:

```yaml
external_auth:
  pam:
    saltuser:
      - '@wheel'
      - '@runner'
      - '*':
        - '*.*'
```

Create system user:
```bash
sudo useradd -M -s /bin/false saltuser
echo "saltuser:your_secure_password" | sudo chpasswd
```

#### 7.2 Call Salt from Your Dashboard

You can create an edge function to interact with Salt API:

```typescript
// Example: Trigger system data collection via Salt API
const response = await fetch('https://your-salt-master:8000/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Auth-Token': 'your-salt-api-token'
  },
  body: JSON.stringify({
    client: 'local',
    tgt: '*',
    fun: 'cmd.run',
    arg: ['/usr/local/bin/salt_system_reporter.py']
  })
});
```

## Troubleshooting

### Common Issues

1. **Minions not connecting**
   - Check firewall rules
   - Verify master hostname in minion config
   - Check network connectivity

2. **Key acceptance fails**
   - Remove old keys: `sudo salt-key -d minion-name`
   - Regenerate on minion: `sudo rm /etc/salt/pki/minion/minion.p*`
   - Restart minion: `sudo systemctl restart salt-minion`

3. **States fail to apply**
   - Check syntax: `sudo salt '*' state.show_sls system_reporter`
   - View detailed errors: `sudo salt '*' state.apply system_reporter -l debug`

4. **API not responding**
   - Check API service: `sudo systemctl status salt-api`
   - Verify SSL certificates
   - Check authentication configuration

## Resources

- [Official Salt Documentation](https://docs.saltproject.io/)
- [Salt User Guide](https://docs.saltproject.io/salt/user-guide/en/latest/)
- [Salt Best Practices](https://docs.saltproject.io/en/latest/topics/best_practices.html)
- [Salt Community](https://saltproject.io/community/)

## Next Steps

1. Install Salt Master on your central server
2. Install Salt Minion on test systems (5-10 systems)
3. Deploy the system reporter state
4. Verify data is flowing to your dashboard
5. Gradually roll out to all 1000 systems
6. Set up monitoring and alerting
7. Create additional states for configuration management
