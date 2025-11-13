# Salt Stack Monitoring - Complete Installation Guide

This guide provides step-by-step instructions for deploying the system monitoring solution across your infrastructure.

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ on all systems
- Root access to all systems
- Network connectivity between master and minions (ports 4505, 4506)
- API key generated and configured in your dashboard

## Quick Start

### 1. Generate API Key

```bash
# Generate a secure API key
openssl rand -hex 32

# Add this key to your dashboard:
# Cloud -> Secrets -> Add SALT_API_KEY
```

### 2. Install Salt Master

On your designated Salt Master server:

```bash
# Download the installation scripts
cd server-scripts

# Make the script executable
chmod +x install-salt-master.sh

# Run the installation (requires sudo)
sudo ./install-salt-master.sh
```

You'll be prompted for:
- **API Endpoint**: Your dashboard URL (e.g., `https://your-project.supabase.co/functions/v1/system-data-receiver`)
- **API Key**: The key you generated in step 1

### 3. Install Salt Minions

On each system you want to monitor:

```bash
# Copy the script to the target system
scp install-salt-minion.sh user@target-system:/tmp/

# On the target system
cd /tmp
chmod +x install-salt-minion.sh
sudo ./install-salt-minion.sh
```

You'll be prompted for:
- **Master IP**: IP address or hostname of your Salt Master
- **Minion ID**: Unique identifier for this system (e.g., `web-server-01`)

### 4. Accept Minion Keys

Back on the Salt Master:

```bash
# List all pending keys
sudo salt-key -L

# Accept a specific minion
sudo salt-key -a web-server-01

# Or accept all pending keys
sudo salt-key -A
```

### 5. Deploy Monitoring

```bash
# Use the deployment script
chmod +x deploy-monitoring.sh
sudo ./deploy-monitoring.sh

# Or deploy manually to specific minions
sudo salt 'web-server-01' state.apply system_reporter

# Deploy to all minions in batches (recommended for 1000+ systems)
sudo salt -b 10% '*' state.apply system_reporter
```

### 6. Verify Installation

```bash
# Test connectivity
sudo salt '*' test.ping

# Check if script is deployed
sudo salt '*' cmd.run 'ls -l /usr/local/bin/salt_system_reporter.py'

# Verify cron job
sudo salt '*' cmd.run 'crontab -l | grep system_reporter'

# Run script manually to test
sudo salt 'web-server-01' cmd.run '/usr/local/bin/salt_system_reporter.py'

# Check logs
sudo salt 'web-server-01' cmd.run 'tail -n 50 /var/log/system-reporter/cron.log'
```

## Deployment Strategies

### Small Scale (< 50 systems)

```bash
# Deploy to all at once
sudo salt '*' state.apply system_reporter
```

### Medium Scale (50-500 systems)

```bash
# Deploy in 20% batches
sudo salt -b 20% '*' state.apply system_reporter
```

### Large Scale (1000+ systems)

```bash
# Deploy in 10% batches with monitoring
sudo salt -b 10% '*' state.apply system_reporter --verbose

# Or deploy by groups
sudo salt 'G@datacenter:us-east' state.apply system_reporter
sudo salt 'G@datacenter:eu-west' state.apply system_reporter
```

## Manual Installation (Without Scripts)

If you prefer to install manually, follow the steps in [SALT_IMPLEMENTATION_GUIDE.md](../SALT_IMPLEMENTATION_GUIDE.md).

## File Locations

### Salt Master
- Salt states: `/srv/salt/`
- Pillar data: `/srv/pillar/`
- Configuration: `/etc/salt/master`
- Logs: `/var/log/salt/master`

### Salt Minions
- Reporter script: `/usr/local/bin/salt_system_reporter.py`
- Configuration: `/etc/system_reporter.conf`
- Logs: `/var/log/system-reporter/cron.log`
- Salt minion config: `/etc/salt/minion`
- Salt minion logs: `/var/log/salt/minion`

## Troubleshooting

### Minion Not Connecting

```bash
# On minion, check if it can reach master
telnet <master-ip> 4505
telnet <master-ip> 4506

# Restart minion
sudo systemctl restart salt-minion

# Check logs
sudo tail -f /var/log/salt/minion
```

### Script Not Running

```bash
# Check if script exists and is executable
sudo salt 'minion-id' cmd.run 'ls -l /usr/local/bin/salt_system_reporter.py'

# Check configuration
sudo salt 'minion-id' cmd.run 'cat /etc/system_reporter.conf'

# Run manually to see errors
sudo salt 'minion-id' cmd.run '/usr/local/bin/salt_system_reporter.py'
```

### No Data in Dashboard

```bash
# Verify API endpoint is reachable
curl -X POST <your-api-endpoint> -H "x-api-key: <your-key>" -H "Content-Type: application/json" -d '{"test": true}'

# Check cron logs
sudo salt 'minion-id' cmd.run 'tail -n 100 /var/log/system-reporter/cron.log'

# Verify cron is running
sudo salt 'minion-id' cmd.run 'systemctl status cron'
```

### State Apply Failures

```bash
# Run in test mode
sudo salt 'minion-id' state.apply system_reporter test=True

# Check state syntax
sudo salt-call state.show_sls system_reporter

# View highstate
sudo salt 'minion-id' state.show_highstate
```

## Security Best Practices

1. **Firewall Configuration**
   - Only allow ports 4505/4506 from minion networks
   - Use VPN or private networks when possible

2. **Key Management**
   - Never accept keys automatically in production
   - Verify minion identity before accepting keys
   - Regularly audit accepted keys

3. **API Security**
   - Rotate API keys regularly
   - Use strong keys (32+ characters)
   - Monitor API access logs

4. **Pillar Data**
   - Encrypt sensitive pillar data using GPG
   - Restrict pillar access by minion

## Maintenance

### Update Reporter Script

```bash
# Copy new script to Salt Master
sudo cp salt_system_reporter.py /srv/salt/system_reporter/

# Refresh file server
sudo salt '*' saltutil.refresh_fileserver

# Sync to minions
sudo salt '*' saltutil.sync_all

# Re-apply state
sudo salt '*' state.apply system_reporter
```

### Monitor Minion Health

```bash
# Check which minions are up
sudo salt-run manage.up

# Check which minions are down
sudo salt-run manage.down

# Get minion status
sudo salt-run manage.status
```

### Logs and Cleanup

```bash
# Rotate logs on minions
sudo salt '*' cmd.run 'logrotate -f /etc/logrotate.d/system-reporter'

# Clear old logs
sudo salt '*' cmd.run 'find /var/log/system-reporter -type f -mtime +30 -delete'
```

## Next Steps

1. ✅ Install and verify on 2-3 test systems
2. ✅ Monitor dashboard for data flow
3. ✅ Deploy to pilot group (10-20 systems)
4. ✅ Wait 24 hours and verify stability
5. ✅ Deploy to full infrastructure in batches
6. ✅ Set up automated health checks
7. ✅ Document your environment-specific configurations

## Support

- Deployment issues: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Salt Stack help: See [SALT_IMPLEMENTATION_GUIDE.md](../SALT_IMPLEMENTATION_GUIDE.md)
- Dashboard issues: Check your Cloud logs
- Salt documentation: https://docs.saltproject.io/

## Scripts Reference

- `install-salt-master.sh` - Automated Salt Master installation
- `install-salt-minion.sh` - Automated Salt Minion installation
- `deploy-monitoring.sh` - Deploy monitoring to minions
- `salt_system_reporter.py` - System data collection script

---

**Note**: These scripts are designed for Ubuntu/Debian systems. For other distributions, adapt the package manager commands accordingly.
