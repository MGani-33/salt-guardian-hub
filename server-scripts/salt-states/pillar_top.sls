# Pillar Top File  
# Place this in /srv/pillar/top.sls on your Salt Master
# This file determines which pillar data is available to which minions

base:
  # Make system_reporter pillar available to all minions
  '*':
    - system_reporter

  # Environment-specific configurations
  'G@environment:production':
    - system_reporter

  'G@environment:staging':
    - system_reporter
