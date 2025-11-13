# Salt Top File
# Place this in /srv/salt/top.sls on your Salt Master
# This file determines which states are applied to which minions

base:
  # Apply to all minions
  '*':
    - system_reporter

  # Apply to specific minions by hostname pattern
  'web-*':
    - system_reporter
    # Add more states here for web servers

  # Apply to minions with specific grain
  'G@roles:database':
    - system_reporter
    # Add database-specific states

  # Apply to minions in specific datacenter
  'G@datacenter:us-east':
    - system_reporter
