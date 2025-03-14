import re
import json
import csv
import argparse

def parse_whatsapp_chat(file_path):
    """
    Parse a WhatsApp chat export file to extract SKU and location information.
    
    Args:
        file_path (str): Path to the WhatsApp chat export text file
        
    Returns:
        dict: Dictionary mapping SKUs to their locations
    """
    # Dictionary to store SKU -> Location mappings
    sku_locations = {}
    
    # Regular expression to match message lines with timestamp and sender
    msg_pattern = r'\[\d+/\d+/\d+,\s\d+:\d+:\d+\s[AP]M\]\s(.+?):\s(.+)'
    
    # Regular expression to match SKU and location in various formats
    # Handles formats like:
    # - "SKU123, A01"
    # - "SKU123 A01"
    # - "SKU123, A01 & A02"
    # - "SKU123 A01 & A02"
    # - "SKU123, A01 >>> A02" (location update)
    # - "SKU123 100 A01" (products with style codes)
    sku_loc_pattern = r'([A-Z0-9]{5,10}(?:\s\d{3})?)\s*(?:,\s*|\s+)((?:[A-Z]\d{1,2}(?:\s*&\s*[A-Z]\d{1,2})?)|(?:[A-Z]\d{1,2}\s*>>>\s*[A-Z]\d{1,2}))'
    
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            # Skip deleted or edited messages, image notices, etc.
            if ('This message was deleted' in line or 
                'This message was edited' in line or 
                'image omitted' in line or 
                'Messages and calls are end-to-end encrypted' in line or
                'created group' in line or
                'added you' in line or
                'Done' in line):
                continue
                
            # Try to match the message pattern
            msg_match = re.search(msg_pattern, line)
            if not msg_match:
                continue
                
            # Extract the message content
            sender = msg_match.group(1)
            content = msg_match.group(2)
            
            # Try to match SKU and location in the message content
            sku_loc_match = re.search(sku_loc_pattern, content)
            if sku_loc_match:
                sku = sku_loc_match.group(1).strip()
                location = sku_loc_match.group(2).strip()
                
                # Handle location updates (>>>)
                if '>>>' in location:
                    # Take the latest location (after >>>)
                    location = location.split('>>>')[1].strip()
                
                # Store in our dictionary
                sku_locations[sku] = location
    
    return sku_locations

def export_to_json(sku_locations, output_file):
    """Export SKU locations to a JSON file"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sku_locations, f, indent=2)
    print(f"Exported {len(sku_locations)} SKU-location pairs to {output_file}")

def export_to_csv(sku_locations, output_file):
    """Export SKU locations to a CSV file"""
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['SKU', 'Location'])
        for sku, location in sku_locations.items():
            writer.writerow([sku, location])
    print(f"Exported {len(sku_locations)} SKU-location pairs to {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Parse WhatsApp chat to extract SKU and location data')
    parser.add_argument('input_file', help='Path to WhatsApp chat export file')
    parser.add_argument('--json', help='Path to output JSON file', default='sku_locations.json')
    parser.add_argument('--csv', help='Path to output CSV file', default='sku_locations.csv')
    
    args = parser.parse_args()
    
    # Parse the chat file
    sku_locations = parse_whatsapp_chat(args.input_file)
    
    # Print summary
    print(f"Found {len(sku_locations)} unique SKU-location pairs")
    
    # Export to files
    export_to_json(sku_locations, args.json)
    export_to_csv(sku_locations, args.csv)

if __name__ == "__main__":
    main()