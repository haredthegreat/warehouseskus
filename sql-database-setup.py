import sqlite3
import json
import argparse
import os

def create_database(db_path="warehouse.db"):
    """Create SQLite database with a table for SKUs and locations"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sku_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT NOT NULL UNIQUE,
        location TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create index for faster lookups
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sku ON sku_locations(sku)')
    
    conn.commit()
    conn.close()
    
    print(f"Database created at {db_path}")

def import_from_json(json_path, db_path="warehouse.db"):
    """Import data from JSON file into SQLite database"""
    if not os.path.exists(json_path):
        print(f"Error: JSON file {json_path} not found")
        return
        
    # Open and read the JSON file
    with open(json_path, 'r', encoding='utf-8') as f:
        sku_locations = json.load(f)
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Insert data
    for sku, location in sku_locations.items():
        try:
            cursor.execute(
                "INSERT OR REPLACE INTO sku_locations (sku, location, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                (sku, location)
            )
        except sqlite3.Error as e:
            print(f"Error inserting {sku}: {e}")
    
    # Commit and close
    conn.commit()
    count = cursor.rowcount if cursor.rowcount >= 0 else "Unknown"
    print(f"Imported {count} SKU-location pairs into database")
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM sku_locations")
    total = cursor.fetchone()[0]
    print(f"Total records in database: {total}")
    
    conn.close()

def import_from_csv(csv_path, db_path="warehouse.db"):
    """Import data from CSV file into SQLite database"""
    if not os.path.exists(csv_path):
        print(f"Error: CSV file {csv_path} not found")
        return
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Read CSV and insert data
    import csv
    with open(csv_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.reader(f)
        # Skip header row
        next(reader, None)
        
        count = 0
        for row in reader:
            if len(row) >= 2:
                sku, location = row[0], row[1]
                try:
                    cursor.execute(
                        "INSERT OR REPLACE INTO sku_locations (sku, location, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                        (sku, location)
                    )
                    count += 1
                except sqlite3.Error as e:
                    print(f"Error inserting {sku}: {e}")
    
    # Commit and close
    conn.commit()
    print(f"Imported {count} SKU-location pairs into database")
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM sku_locations")
    total = cursor.fetchone()[0]
    print(f"Total records in database: {total}")
    
    conn.close()

def export_to_json(db_path="warehouse.db", json_path="warehouse_export.json"):
    """Export data from SQLite database to JSON file"""
    # Connect to database
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    cursor = conn.cursor()
    
    # Get all records
    cursor.execute("SELECT sku, location FROM sku_locations")
    rows = cursor.fetchall()
    
    # Create dictionary
    sku_locations = {row['sku']: row['location'] for row in rows}
    
    # Write to JSON file
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(sku_locations, f, indent=2)
    
    print(f"Exported {len(sku_locations)} SKU-location pairs to {json_path}")
    
    conn.close()

def main():
    parser = argparse.ArgumentParser(description='SQLite Database Manager for Warehouse SKUs')
    parser.add_argument('--db', help='Path to SQLite database file', default='warehouse.db')
    parser.add_argument('--create', action='store_true', help='Create new database')
    parser.add_argument('--import-json', help='Import from JSON file')
    parser.add_argument('--import-csv', help='Import from CSV file')
    parser.add_argument('--export-json', help='Export to JSON file')
    
    args = parser.parse_args()
    
    if args.create:
        create_database(args.db)
    
    if args.import_json:
        import_from_json(args.import_json, args.db)
    
    if args.import_csv:
        import_from_csv(args.import_csv, args.db)
    
    if args.export_json:
        export_to_json(args.db, args.export_json)
    
    if not (args.create or args.import_json or args.import_csv or args.export_json):
        parser.print_help()

if __name__ == "__main__":
    main()
