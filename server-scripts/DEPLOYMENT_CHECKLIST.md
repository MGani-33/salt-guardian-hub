# Salt Stack Deployment Checklist

Use this checklist to deploy the system monitoring solution across your infrastructure.

## Pre-Deployment

### 1. Generate API Key
```bash
# Generate a secure API key
openssl rand -hex 32

# Example output: 5f4dcc3b5aa765d61d8327deb882cf99d34e8f8e8a2e1c8a9b0c7d6e5f4a3b2c
```

### 2. Add API Key to Lovable Cloud
- [ ] Open Lovable Cloud → Settings → Secrets
- [ ] Add new secret: `SALT_API_KEY`
- [ ] Paste the generated key from step 1
- [ ] Save

### 3. Test API Endpoint
```bash
# Test that the endpoint is accessible
curl -X POST https://rqnqmvyfgjmnhniupqnr.supabase.co/functions/v1/system-data-receiver \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"hostname":"test","ip_address":"127.0.0.1","os_type":"Linux","os_version":"Ubuntu 22.04","status":"online"}'
```

## Salt Master Setup

### 4. Install Salt Master
```bash
# On your central server
curl -fsSL https://packages.broadcom.com/artifactory/api/security/keypair/SaltProjectKey/public | sudo tee /etc/apt/keyrings/salt-archive-keyring.pgp
curl -fsSL https://github.com/saltstack/salt-install-guide/releases/latest/download/salt.sources | sudo tee /etc/apt/sources.list.d/salt.sources
sudo apt update
sudo apt install -y salt-master
```

### 5. Configure Salt Master
- [ ] Edit `/etc/salt/master` (see SALT_IMPLEMENTATION_GUIDE.md)
- [ ] Configure firewall ports (4505, 4506)
- [ ] Restart Salt Master: `sudo systemctl restart salt-master`
- [ ] Verify: `sudo systemctl status salt-master`

### 6. Set Up Salt File Server
```bash
# Create directory structure
sudo mkdir -p /srv/salt/system_reporter
sudo mkdir -p /srv/pillar

# Copy files
sudo cp server-scripts/salt_system_reporter.py /srv/salt/system_reporter/
sudo cp server-scripts/salt-states/system_reporter/init.sls /srv/salt/system_reporter/
sudo cp server-scripts/salt-states/system_reporter_pillar.sls /srv/pillar/system_reporter.sls
sudo cp server-scripts/salt-states/top.sls /srv/salt/
sudo cp server-scripts/salt-states/pillar_top.sls /srv/pillar/top.sls
```

### 7. Configure Pillar Data
```bash
# Edit pillar file with your API key
sudo nano /srv/pillar/system_reporter.sls

# Replace YOUR_GENERATED_API_KEY_HERE with your actual key
# Save and exit
```

## Pilot Deployment (Test Systems)

### 8. Install Salt Minion on Test Systems (5-10 systems)
```bash
# On each test system
curl -fsSL https://packages.broadcom.com/artifactory/api/security/keypair/SaltProjectKey/public | sudo tee /etc/apt/keyrings/salt-archive-keyring.pgp
curl -fsSL https://github.com/saltstack/salt-install-guide/releases/latest/download/salt.sources | sudo tee /etc/apt/sources.list.d/salt.sources
sudo apt update
sudo apt install -y salt-minion
```

### 9. Configure Test Minions
```bash
# On each test system, edit /etc/salt/minion
sudo nano /etc/salt/minion

# Add:
# master: YOUR_SALT_MASTER_IP_OR_HOSTNAME

# Restart minion
sudo systemctl restart salt-minion
```

### 10. Accept Minion Keys
```bash
# On Salt Master
# List pending keys
sudo salt-key -L

# Accept all test minions
sudo salt-key -a 'test-system-*'
# or accept individually
sudo salt-key -a test-system-01
```

### 11. Test Connectivity
```bash
# On Salt Master
sudo salt 'test-system-*' test.ping

# Expected output:
# test-system-01:
#     True
# test-system-02:
#     True
```

### 12. Deploy to Test Systems
```bash
# Test mode first (doesn't make changes)
sudo salt 'test-system-*' state.apply system_reporter test=True

# If test looks good, apply for real
sudo salt 'test-system-*' state.apply system_reporter
```

### 13. Verify Test Deployment
```bash
# Check if script is installed
sudo salt 'test-system-*' cmd.run 'ls -l /usr/local/bin/salt_system_reporter.py'

# Check if config exists
sudo salt 'test-system-*' cmd.run 'cat /etc/system_reporter.conf'

# Check if cron job exists
sudo salt 'test-system-*' cmd.run 'crontab -l | grep system_reporter'

# Run reporter manually
sudo salt 'test-system-*' cmd.run '/usr/local/bin/salt_system_reporter.py'
```

### 14. Verify Data in Dashboard
- [ ] Log into your dashboard at https://8b88da21-cd7f-4d49-ab33-36e4b9083943.lovableproject.com
- [ ] Check if test systems appear in the systems list
- [ ] Verify system details are populated
- [ ] Check timestamps are recent (within last 5 minutes)

### 15. Monitor Test Systems
```bash
# Watch logs on test systems
sudo salt 'test-system-*' cmd.run 'tail -20 /var/log/system-reporter/cron.log'

# Check Salt Master logs
sudo tail -f /var/log/salt/master
```

## Full Deployment

### 16. Install Minions on Remaining Systems
- [ ] Use automated deployment tools (Ansible, Terraform, etc.)
- [ ] Or install manually on each system
- [ ] Configure minion with master IP
- [ ] Start minion service

### 17. Accept All Minion Keys
```bash
# List all pending keys
sudo salt-key -L

# Accept all (if you trust all pending keys)
sudo salt-key -A

# Or use auto-accept (configured in master config)
```

### 18. Deploy in Batches
```bash
# Deploy to 10% of systems at a time
# Calculate batch size
TOTAL=1000
BATCH_SIZE=$((TOTAL / 10))

# Deploy batch 1
sudo salt -N batch1 state.apply system_reporter

# Wait 10 minutes and verify
# Then continue with next batch
sudo salt -N batch2 state.apply system_reporter

# Or use Salt's batch mode
sudo salt -b 10% '*' state.apply system_reporter
```

### 19. Monitor Full Deployment
```bash
# Check how many systems are reporting
sudo salt '*' test.ping | grep True | wc -l

# Check for failures
sudo salt '*' state.apply system_reporter --out=json | jq '.[] | select(.result == false)'

# View summary
sudo salt '*' state.apply system_reporter --out=highstate
```

### 20. Verify Dashboard
- [ ] All 1000 systems visible
- [ ] All systems showing recent data
- [ ] Stats cards showing correct counts
- [ ] No errors in browser console

## Post-Deployment

### 21. Set Up Monitoring
```bash
# Create Salt reactor for failed minions
sudo nano /srv/reactor/minion_failed.sls

# Configure alert email
# See SALT_IMPLEMENTATION_GUIDE.md
```

### 22. Schedule Regular Maintenance
- [ ] Weekly: Review Salt Master logs
- [ ] Weekly: Check for failed minions
- [ ] Monthly: Update Salt packages
- [ ] Quarterly: Review and optimize states

### 23. Documentation
- [ ] Document your specific deployment
- [ ] Note any customizations made
- [ ] Create runbook for common issues
- [ ] Train team on Salt basics

### 24. Security Hardening
- [ ] Rotate API keys quarterly
- [ ] Enable SSL for Salt Master
- [ ] Configure firewall rules
- [ ] Implement GPG encryption for pillar
- [ ] Review and audit access logs

## Troubleshooting Commands

```bash
# Minion not connecting
sudo salt-key -d minion-name
# On minion: sudo rm /etc/salt/pki/minion/minion.p*
# On minion: sudo systemctl restart salt-minion

# State fails
sudo salt 'minion-name' state.apply system_reporter -l debug

# Check state syntax
sudo salt 'minion-name' state.show_sls system_reporter

# Refresh pillar data
sudo salt '*' saltutil.refresh_pillar

# Clear cache
sudo salt '*' saltutil.clear_cache

# Sync all
sudo salt '*' saltutil.sync_all

# View grains
sudo salt '*' grains.items

# View pillar
sudo salt '*' pillar.items
```

## Success Criteria

- [ ] Salt Master is running and accessible
- [ ] All 1000 minions are connected and responding
- [ ] System reporter deployed to all minions
- [ ] Cron jobs running every 5 minutes
- [ ] Data appearing in dashboard within 5 minutes
- [ ] No authentication errors
- [ ] System stats showing accurate counts
- [ ] All hardware, network, and service data populated

## Rollback Plan

If issues occur:

1. **Stop cron jobs on all minions:**
   ```bash
   sudo salt '*' cron.absent system_reporter
   ```

2. **Remove state:**
   ```bash
   sudo salt '*' cmd.run 'rm /usr/local/bin/salt_system_reporter.py'
   sudo salt '*' cmd.run 'rm /etc/system_reporter.conf'
   ```

3. **Investigate and fix issues**

4. **Re-deploy when ready**

## Support

- Salt Documentation: https://docs.saltproject.io/
- Salt Community: https://saltproject.io/community/
- Your team's internal documentation
