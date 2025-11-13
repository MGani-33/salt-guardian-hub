# Salt State for System Reporter Deployment
# Place this in /srv/salt/system_reporter/init.sls on your Salt Master

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

# Create directory for logs
system_reporter_log_dir:
  file.directory:
    - name: /var/log/system-reporter
    - user: root
    - group: root
    - mode: 755

# Copy the reporter script
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

# Create config file with API credentials from pillar
system_reporter_config:
  file.managed:
    - name: /etc/system_reporter.conf
    - mode: 600
    - user: root
    - group: root
    - contents: |
        # System Reporter Configuration
        # This file is managed by Salt - do not edit manually
        API_ENDPOINT={{ pillar['system_reporter']['api_endpoint'] }}
        API_KEY={{ pillar['system_reporter']['api_key'] }}
    - require:
      - file: system_reporter_script

# Set up cron job to run every 5 minutes
system_reporter_cron:
  cron.present:
    - name: /usr/local/bin/salt_system_reporter.py >> /var/log/system-reporter/cron.log 2>&1
    - user: root
    - minute: '*/5'
    - identifier: system_reporter
    - require:
      - file: system_reporter_config

# Optional: Run immediately after installation
system_reporter_initial_run:
  cmd.run:
    - name: /usr/local/bin/salt_system_reporter.py
    - unless: test -f /var/log/system-reporter/first-run.done
    - require:
      - file: system_reporter_config
    - onchanges:
      - file: system_reporter_script

# Mark first run as complete
system_reporter_first_run_marker:
  file.managed:
    - name: /var/log/system-reporter/first-run.done
    - mode: 644
    - require:
      - cmd: system_reporter_initial_run
