# Salt Stack System Reporter

This script collects system information and sends it to your dashboard.

## Setup on Ubuntu Systems

### 1. Install Required Dependencies

```bash
sudo apt update
sudo apt install -y python3 python3-pip dmidecode

# Install Python packages
pip3 install psutil requests
```

### 2. Configure the Script

1. Edit `salt_system_reporter.py`
2. Update `API_KEY` with your secure key (generate one with: `openssl rand -hex 32`)
3. The API endpoint is already configured

### 3. Set Up the API Key Secret

In Lovable, add a secret:
- Name: `SALT_API_KEY`
- Value: (the same key you put in the Python script)

### 4. Deploy Methods

#### Option A: Cron Job (Recommended)
Run every 5 minutes:

```bash
# Copy script to /usr/local/bin
sudo cp salt_system_reporter.py /usr/local/bin/
sudo chmod +x /usr/local/bin/salt_system_reporter.py

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/salt_system_reporter.py >> /var/log/system-reporter.log 2>&1") | crontab -
```

#### Option B: Salt State
Create `/srv/salt/system_reporter.sls`:

```yaml
system_reporter_dependencies:
  pkg.installed:
    - pkgs:
      - python3
      - python3-pip
      - dmidecode

system_reporter_python_deps:
  pip.installed:
    - names:
      - psutil
      - requests
    - bin_env: /usr/bin/pip3

system_reporter_script:
  file.managed:
    - name: /usr/local/bin/salt_system_reporter.py
    - source: salt://files/salt_system_reporter.py
    - mode: 755

system_reporter_cron:
  cron.present:
    - name: /usr/local/bin/salt_system_reporter.py
    - user: root
    - minute: '*/5'
```

Apply to all minions:
```bash
salt '*' state.apply system_reporter
```

#### Option C: Salt Scheduler
In your Salt master config (`/etc/salt/master.d/scheduler.conf`):

```yaml
schedule:
  system_reporter:
    function: cmd.run
    seconds: 300
    args:
      - /usr/local/bin/salt_system_reporter.py
```

### 5. Test the Script

```bash
sudo python3 salt_system_reporter.py
```

You should see: `✓ Data sent successfully for [hostname]`

## Monitored Information

- **System**: Hostname, IP, OS version, status
- **Hardware**: CPU, memory, GPU specs
- **Storage**: All mounted drives and usage
- **Network**: All interfaces with IPs and status
- **Services**: Wazuh, ClamAV, Inotify, USB Guard
- **Applications**: Chrome, VS Code, Firefox, Docker, Node.js, Python

## Troubleshooting

### Script fails with "Unauthorized"
- Check that `SALT_API_KEY` secret is set in Lovable
- Verify the API key in the script matches

### Missing data
- Ensure script runs with `sudo` (needed for dmidecode and some system info)
- Check `/var/log/system-reporter.log` for errors

### Service status shows "unknown"
- Verify service names match your system
- Add your specific services to the `services_to_check` list

## Security Notes

- Keep your API key secure
- Only run this script on trusted systems
- The API validates the key before accepting data
- Data is sent over HTTPS
