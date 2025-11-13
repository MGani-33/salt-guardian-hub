#!/usr/bin/env python3
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

# Configuration - Can be overridden by config file
CONFIG_FILE = '/etc/system_reporter.conf'
DEFAULT_API_ENDPOINT = "https://rqnqmvyfgjmnhniupqnr.supabase.co/functions/v1/system-data-receiver"
DEFAULT_API_KEY = "YOUR_API_KEY_HERE"  # Generate a secure random key and add it as SALT_API_KEY secret in Lovable

def load_config():
    """Load configuration from file or use defaults"""
    config = {
        'api_endpoint': DEFAULT_API_ENDPOINT,
        'api_key': DEFAULT_API_KEY
    }
    
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line and not line.startswith('#'):
                        key, value = line.split('=', 1)
                        if key == 'API_ENDPOINT':
                            config['api_endpoint'] = value
                        elif key == 'API_KEY':
                            config['api_key'] = value
        except Exception as e:
            print(f"Warning: Could not read config file: {e}")
    
    return config

# Load configuration
CONFIG = load_config()
API_ENDPOINT = CONFIG['api_endpoint']
API_KEY = CONFIG['api_key']

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
    
    # Get CPU model
    cpu_model = run_command("lscpu | grep 'Model name' | cut -d ':' -f 2 | xargs")
    
    # Get GPU info
    gpu_info = run_command("lspci | grep -i 'vga\\|3d\\|2d' | head -n1")
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
        "gpu_memory": None  # Could parse from nvidia-smi if available
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
    
    # Common applications to track
    apps = {
        "google-chrome-stable": "Google Chrome",
        "code": "VS Code",
        "firefox": "Firefox",
        "docker": "Docker",
        "nodejs": "Node.js",
        "python3": "Python"
    }
    
    for pkg, name in apps.items():
        # Check if package is installed
        version = run_command(f"dpkg -l | grep {pkg} | awk '{{print $3}}' | head -n1")
        if version:
            # Check for updates (simplified)
            update_check = run_command(f"apt list --upgradable 2>/dev/null | grep {pkg}")
            
            applications.append({
                "app_name": name,
                "current_version": version,
                "latest_version": None,  # Would need apt-cache policy for this
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
    # Check for --verify flag
    if len(sys.argv) > 1 and sys.argv[1] == '--verify':
        print(f"System Reporter v1.0")
        print(f"API Endpoint: {API_ENDPOINT}")
        print(f"API Key: {'*' * (len(API_KEY) - 4) + API_KEY[-4:]}")
        return 0
    
    print("Collecting system information...")
    
    try:
        # Collect all system data
        data = get_system_info()
        data["hardware"] = get_hardware_info()
        data["storage"] = get_storage_info()
        data["network"] = get_network_info()
        data["services"] = get_services_info()
        data["applications"] = get_applications_info()
        
        print(f"Collected data for {data['hostname']}")
        
        # Send to API
        send_to_api(data)
        
    except Exception as e:
        print(f"Error collecting system data: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
