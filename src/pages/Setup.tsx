import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Copy, Check, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const Setup = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  const API_ENDPOINT = "https://rqnqmvyfgjmnhniupqnr.supabase.co/functions/v1/system-data-receiver";
  const API_KEY_PLACEHOLDER = "REPLACE_WITH_YOUR_SALT_API_KEY";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const pythonScript = `#!/usr/bin/env python3
"""
Salt Stack System Reporter
Collects system information and sends it to the dashboard API
"""

import json
import subprocess
import socket
import requests
import platform
import psutil
import re
import os
import sys
from typing import Dict, List, Any

# Configuration
API_ENDPOINT = "${API_ENDPOINT}"
API_KEY = "${API_KEY_PLACEHOLDER}"

def run_command(cmd: str) -> str:
    """Execute shell command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.stdout.strip()
    except Exception as e:
        print(f"Error running command '{cmd}': {e}")
        return ""

def get_system_info() -> Dict[str, Any]:
    """Collect basic system information"""
    return {
        "hostname": socket.gethostname(),
        "ip_address": socket.gethostbyname(socket.gethostname()),
        "os_type": platform.system(),
        "os_version": platform.release(),
        "status": "online"
    }

def get_hardware_info() -> Dict[str, Any]:
    """Collect hardware information"""
    cpu_freq = psutil.cpu_freq()
    memory = psutil.virtual_memory()
    
    cpu_model = run_command("lscpu | grep 'Model name' | cut -d ':' -f 2 | xargs")
    gpu_info = run_command("lspci | grep -i 'vga\\\\|3d\\\\|2d' | head -n1")
    gpu_model = gpu_info.split(': ')[-1] if gpu_info else None
    
    return {
        "cpu_model": cpu_model or "Unknown",
        "cpu_cores": psutil.cpu_count(logical=False),
        "cpu_threads": psutil.cpu_count(logical=True),
        "cpu_frequency": f"{cpu_freq.current:.2f} MHz" if cpu_freq else None,
        "memory_total": f"{memory.total / (1024**3):.2f} GB",
        "memory_used": f"{memory.used / (1024**3):.2f} GB",
        "memory_type": run_command("dmidecode -t memory | grep 'Type:' | head -n1 | cut -d ':' -f 2 | xargs") or None,
        "gpu_model": gpu_model,
        "gpu_memory": None
    }

def get_storage_info() -> List[Dict[str, Any]]:
    """Collect storage information"""
    storage = []
    partitions = psutil.disk_partitions()
    
    for partition in partitions:
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            storage.append({
                "device": partition.device,
                "type": partition.fstype,
                "size": f"{usage.total / (1024**3):.2f} GB",
                "used": f"{usage.used / (1024**3):.2f} GB",
                "mount_point": partition.mountpoint
            })
        except:
            continue
    
    return storage

def get_network_info() -> List[Dict[str, Any]]:
    """Collect network interface information"""
    network = []
    interfaces = psutil.net_if_addrs()
    stats = psutil.net_if_stats()
    
    for iface, addrs in interfaces.items():
        if iface == 'lo':
            continue
            
        ip_addr = None
        mac_addr = None
        
        for addr in addrs:
            if addr.family == socket.AF_INET:
                ip_addr = addr.address
            elif addr.family == psutil.AF_LINK:
                mac_addr = addr.address
        
        if ip_addr:
            stat = stats.get(iface)
            network.append({
                "interface_name": iface,
                "ip_address": ip_addr,
                "mac_address": mac_addr,
                "status": "up" if stat and stat.isup else "down",
                "speed": f"{stat.speed} Mbps" if stat and stat.speed > 0 else None
            })
    
    return network

def get_services_info() -> List[Dict[str, Any]]:
    """Collect service status information"""
    services_to_check = [
        "wazuh-agent",
        "clamav-daemon",
        "inotify",
        "usbguard"
    ]
    
    services = []
    for service in services_to_check:
        status = run_command(f"systemctl is-active {service} 2>/dev/null || echo 'inactive'")
        description = run_command(f"systemctl show {service} -p Description --value 2>/dev/null")
        
        services.append({
            "service_name": service,
            "status": status if status in ["active", "inactive", "failed"] else "unknown",
            "description": description or None
        })
    
    return services

def get_applications_info() -> List[Dict[str, Any]]:
    """Collect installed applications information"""
    applications = []
    
    apps = {
        "google-chrome-stable": "Google Chrome",
        "code": "VS Code",
        "firefox": "Firefox",
        "docker": "Docker",
        "nodejs": "Node.js",
        "python3": "Python"
    }
    
    for pkg, name in apps.items():
        version = run_command(f"dpkg -l | grep {pkg} | awk '{{print $3}}' | head -n1")
        if version:
            update_check = run_command(f"apt list --upgradable 2>/dev/null | grep {pkg}")
            
            applications.append({
                "app_name": name,
                "current_version": version,
                "latest_version": None,
                "update_available": bool(update_check),
                "category": "Application",
                "size": None
            })
    
    return applications

def send_to_api(data: Dict[str, Any]) -> bool:
    """Send collected data to the API"""
    try:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        }
        
        response = requests.post(API_ENDPOINT, json=data, headers=headers, timeout=30)
        response.raise_for_status()
        
        print(f"✓ Data sent successfully for {data['hostname']}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Error sending data: {e}")
        return False

def main():
    """Main execution function"""
    if len(sys.argv) > 1 and sys.argv[1] == '--verify':
        print(f"System Reporter v1.0")
        print(f"API Endpoint: {API_ENDPOINT}")
        print(f"API Key: {'*' * (len(API_KEY) - 4) + API_KEY[-4:]}")
        return 0
    
    print("Collecting system information...")
    
    try:
        data = get_system_info()
        data["hardware"] = get_hardware_info()
        data["storage"] = get_storage_info()
        data["network"] = get_network_info()
        data["services"] = get_services_info()
        data["applications"] = get_applications_info()
        
        print(f"Collected data for {data['hostname']}")
        
        send_to_api(data)
        
    except Exception as e:
        print(f"Error collecting system data: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())`;

  const installScript = `#!/bin/bash
# Salt System Reporter Installation Script
# Generated by Salt Stack Monitor Dashboard

set -e

echo "🚀 Installing Salt System Reporter..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root"
  exit 1
fi

# Create directories
mkdir -p /var/log/system-reporter
echo "✓ Created log directory"

# Install dependencies
apt-get update
apt-get install -y python3 python3-pip dmidecode lshw
pip3 install psutil requests
echo "✓ Installed dependencies"

# Download and install the reporter script
cat > /usr/local/bin/salt_system_reporter.py << 'SCRIPT_EOF'
${pythonScript}
SCRIPT_EOF

chmod +x /usr/local/bin/salt_system_reporter.py
echo "✓ Installed reporter script"

# Set up cron job (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/salt_system_reporter.py >> /var/log/system-reporter/cron.log 2>&1") | crontab -
echo "✓ Configured cron job"

# Run initial test
echo ""
echo "🧪 Running initial test..."
/usr/local/bin/salt_system_reporter.py

echo ""
echo "✅ Installation complete!"
echo ""
echo "📊 Your system will report to the dashboard every 5 minutes"
echo "📝 Logs: /var/log/system-reporter/cron.log"
echo "🔍 Verify: /usr/local/bin/salt_system_reporter.py --verify"`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Setup & Installation</h1>
                <p className="text-sm text-muted-foreground">Configure systems to report to your dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="quick" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Install</TabsTrigger>
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
            <TabsTrigger value="salt">Salt Master</TabsTrigger>
          </TabsList>

          {/* Quick Install Tab */}
          <TabsContent value="quick" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>One-Command Installation</CardTitle>
                <CardDescription>
                  Run this single command on any Linux system to start reporting to your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Important:</strong> After downloading, replace <code className="bg-muted px-1 rounded">REPLACE_WITH_YOUR_SALT_API_KEY</code> with your actual SALT_API_KEY from Lovable Cloud secrets.
                  </AlertDescription>
                </Alert>
                
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`curl -sSL https://your-domain.com/install.sh | sudo bash`}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(installScript, "Install command")}
                  >
                    {copied === "Install command" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const blob = new Blob([installScript], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'install-system-reporter.sh';
                      a.click();
                      toast.success("Installation script downloaded");
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Install Script
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(installScript, "Installation script")}
                  >
                    {copied === "Installation script" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy Script
                  </Button>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">What this script does:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Installs Python dependencies (psutil, requests)</li>
                    <li>Deploys the system reporter script</li>
                    <li>Configures automatic reporting every 5 minutes</li>
                    <li>Runs an initial test to verify connectivity</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Setup Tab */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Installation Steps</CardTitle>
                <CardDescription>
                  Step-by-step instructions for manual setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Step 1: Install Dependencies</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`apt-get update
apt-get install -y python3 python3-pip dmidecode lshw
pip3 install psutil requests`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Step 2: Download Reporter Script</h3>
                    <div className="flex gap-2 mb-2">
                      <Button
                        onClick={() => {
                          const blob = new Blob([pythonScript], { type: 'text/x-python' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'salt_system_reporter.py';
                          a.click();
                          toast.success("Python script downloaded");
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Python Script
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(pythonScript, "Python script")}
                      >
                        {copied === "Python script" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        Copy Script
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`# Save the downloaded script to:
sudo mv salt_system_reporter.py /usr/local/bin/
sudo chmod +x /usr/local/bin/salt_system_reporter.py`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Step 3: Configure Cron Job</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/salt_system_reporter.py >> /var/log/system-reporter/cron.log 2>&1") | crontab -`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Step 4: Test Installation</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`sudo /usr/local/bin/salt_system_reporter.py
# Should output: ✓ Data sent successfully for [hostname]`}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Salt Master Tab */}
          <TabsContent value="salt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Salt Stack Integration</CardTitle>
                <CardDescription>
                  Deploy to multiple systems using Salt Master
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    If you're using Salt Stack, you can deploy the reporter to all your minions at once.
                    Follow the instructions in the server-scripts directory of this project.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Quick Salt Deployment:</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`# On your Salt Master:
sudo salt '*' state.apply system_reporter`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Your API Configuration:</h3>
                    <Alert className="mb-2">
                      <AlertDescription>
                        Replace the API key placeholder with your actual SALT_API_KEY from Lovable Cloud secrets.
                      </AlertDescription>
                    </Alert>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`API_ENDPOINT=${API_ENDPOINT}
API_KEY=${API_KEY_PLACEHOLDER}`}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => copyToClipboard(`API_ENDPOINT=${API_ENDPOINT}\nAPI_KEY=${API_KEY_PLACEHOLDER}`, "API config")}
                    >
                      {copied === "API config" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Setup;