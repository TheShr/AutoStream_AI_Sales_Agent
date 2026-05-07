#!/usr/bin/env python3
"""
Clean Database Script
Removes all data from the leads and tenants tables.
"""

import os
import sys
from sqlalchemy import text

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import engine, SessionLocal

def clean_database():
    """Delete all data from leads and tenants tables."""
    session = SessionLocal()
    try:
        print("Cleaning database...")
        
        # Delete all leads first (foreign key constraint)
        result = session.execute(text("DELETE FROM leads;"))
        print(f"✓ Deleted {result.rowcount} lead records")
        
        # Delete all tenants
        result = session.execute(text("DELETE FROM tenants;"))
        print(f"✓ Deleted {result.rowcount} tenant records")
        
        # Commit changes
        session.commit()
        print("\n✓ Database cleaned successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"✗ Error: {e}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    confirm = input("Are you sure you want to delete all tenants and leads? (yes/no): ").strip().lower()
    if confirm == "yes":
        clean_database()
    else:
        print("Cancelled.")
