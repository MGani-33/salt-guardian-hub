# Pillar data for System Reporter
# Place this in /srv/pillar/system_reporter.sls on your Salt Master
# Then run: sudo salt '*' saltutil.refresh_pillar

system_reporter:
  api_endpoint: https://rqnqmvyfgjmnhniupqnr.supabase.co/functions/v1/system-data-receiver
  # IMPORTANT: Replace with your actual API key
  # Generate with: openssl rand -hex 32
  api_key: YOUR_GENERATED_API_KEY_HERE

# Optional: Different configurations per environment
{% if grains['environment'] == 'production' %}
system_reporter:
  api_endpoint: https://rqnqmvyfgjmnhniupqnr.supabase.co/functions/v1/system-data-receiver
  api_key: YOUR_PRODUCTION_API_KEY
{% elif grains['environment'] == 'staging' %}
system_reporter:
  api_endpoint: https://rqnqmvyfgjmnhniupqnr.supabase.co/functions/v1/system-data-receiver
  api_key: YOUR_STAGING_API_KEY
{% endif %}
