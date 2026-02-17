import requests
import sys
from datetime import datetime
import json

class InventoryAPITester:
    def __init__(self, base_url="https://inventory-qr-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_serials = []  # Track created items for cleanup

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def test_get_stats_empty(self):
        """Test stats endpoint when empty"""
        success, response = self.run_test(
            "Get Stats (Empty)",
            "GET",
            "stats",
            200
        )
        if success:
            expected_keys = ['total_items', 'serviceable', 'pending_repair', 'beyond_repair']
            if all(key in response for key in expected_keys):
                print("   ✓ All expected stat keys present")
                return True
            else:
                print(f"   ❌ Missing expected keys. Got: {list(response.keys())}")
        return success

    def test_create_item(self, serial_suffix=""):
        """Create a test item"""
        test_serial = f"TEST-{datetime.now().strftime('%H%M%S')}{serial_suffix}"
        item_data = {
            "serial_number": test_serial,
            "issuer_name": "Test Issuer",
            "issued_to_name": "Test Recipient", 
            "item_type": "Test Equipment",
            "location": "Test Location",
            "status": "Serviceable"
        }
        
        success, response = self.run_test(
            f"Create Item ({test_serial})",
            "POST",
            "items",
            200,
            data=item_data
        )
        
        if success:
            self.created_serials.append(test_serial)
            # Validate response structure
            required_fields = ['id', 'serial_number', 'issuer_name', 'issued_to_name', 'item_type', 'location', 'status', 'created_at', 'updated_at']
            if all(field in response for field in required_fields):
                print("   ✓ All required fields present in response")
                return test_serial, response
            else:
                missing = [f for f in required_fields if f not in response]
                print(f"   ❌ Missing fields: {missing}")
        
        return test_serial if success else None, response

    def test_create_duplicate_item(self):
        """Test creating duplicate serial number"""
        if not self.created_serials:
            return False
            
        duplicate_data = {
            "serial_number": self.created_serials[0],
            "issuer_name": "Duplicate Test",
            "issued_to_name": "Duplicate Recipient", 
            "item_type": "Duplicate Equipment",
            "location": "Duplicate Location",
            "status": "Serviceable"
        }
        
        success, _ = self.run_test(
            "Create Duplicate Item (Should Fail)",
            "POST",
            "items",
            400,
            data=duplicate_data
        )
        return success

    def test_get_all_items(self):
        """Test getting all items"""
        success, response = self.run_test(
            "Get All Items",
            "GET",
            "items",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} items")
            return True, response
        
        return success, []

    def test_get_item_by_serial(self, serial_number):
        """Test getting single item by serial"""
        success, response = self.run_test(
            f"Get Item by Serial ({serial_number})",
            "GET",
            f"items/{serial_number}",
            200
        )
        
        if success:
            if response.get('serial_number') == serial_number:
                print(f"   ✓ Correct item retrieved")
                return True, response
            else:
                print(f"   ❌ Wrong item retrieved. Expected {serial_number}, got {response.get('serial_number')}")
        
        return success, response

    def test_get_nonexistent_item(self):
        """Test getting non-existent item"""
        success, _ = self.run_test(
            "Get Non-existent Item (Should Fail)",
            "GET",
            "items/NONEXISTENT-123",
            404
        )
        return success

    def test_update_item(self, serial_number):
        """Test updating an item"""
        update_data = {
            "status": "Pending Repair",
            "location": "Updated Location"
        }
        
        success, response = self.run_test(
            f"Update Item ({serial_number})",
            "PUT",
            f"items/{serial_number}",
            200,
            data=update_data
        )
        
        if success:
            if (response.get('status') == 'Pending Repair' and 
                response.get('location') == 'Updated Location'):
                print("   ✓ Item updated correctly")
                return True, response
            else:
                print("   ❌ Item not updated correctly")
        
        return success, response

    def test_update_nonexistent_item(self):
        """Test updating non-existent item"""
        update_data = {
            "status": "Serviceable"
        }
        
        success, _ = self.run_test(
            "Update Non-existent Item (Should Fail)",
            "PUT",
            "items/NONEXISTENT-123",
            404,
            data=update_data
        )
        return success

    def test_filter_items(self):
        """Test filtering items by status"""
        success, response = self.run_test(
            "Filter Items by Status",
            "GET",
            "items",
            200,
            params={'status': 'Serviceable'}
        )
        
        if success and isinstance(response, list):
            serviceable_count = len([item for item in response if item.get('status') == 'Serviceable'])
            print(f"   ✓ Retrieved {serviceable_count} serviceable items")
        
        return success

    def test_search_items(self):
        """Test searching items"""
        if not self.created_serials:
            return False
            
        search_term = "Test"
        success, response = self.run_test(
            "Search Items",
            "GET",
            "items",
            200,
            params={'search': search_term}
        )
        
        if success and isinstance(response, list):
            print(f"   ✓ Search returned {len(response)} items")
        
        return success

    def test_delete_item(self, serial_number):
        """Test deleting an item"""
        success, response = self.run_test(
            f"Delete Item ({serial_number})",
            "DELETE",
            f"items/{serial_number}",
            200
        )
        
        if success:
            if serial_number in self.created_serials:
                self.created_serials.remove(serial_number)
            print("   ✓ Item deleted successfully")
        
        return success

    def test_delete_nonexistent_item(self):
        """Test deleting non-existent item"""
        success, _ = self.run_test(
            "Delete Non-existent Item (Should Fail)",
            "DELETE",
            "items/NONEXISTENT-123",
            404
        )
        return success

    def test_get_stats_with_data(self):
        """Test stats endpoint with data"""
        success, response = self.run_test(
            "Get Stats (With Data)",
            "GET",
            "stats",
            200
        )
        
        if success:
            print(f"   Stats: {response}")
        
        return success

    def cleanup(self):
        """Clean up created test items"""
        print(f"\n🧹 Cleaning up {len(self.created_serials)} test items...")
        for serial in self.created_serials.copy():
            self.test_delete_item(serial)

def main():
    tester = InventoryAPITester()
    
    print("🚀 Starting Kalichindi QR Inventory API Tests")
    print(f"   Backend URL: {tester.base_url}")
    
    # Test sequence
    try:
        # Basic connectivity
        tester.test_api_root()
        tester.test_get_stats_empty()
        
        # CRUD operations
        serial1, item1 = tester.test_create_item("-1")
        serial2, item2 = tester.test_create_item("-2") 
        
        if serial1:
            tester.test_get_item_by_serial(serial1)
            tester.test_update_item(serial1)
            
        # Error cases
        tester.test_create_duplicate_item()
        tester.test_get_nonexistent_item()
        tester.test_update_nonexistent_item()
        tester.test_delete_nonexistent_item()
        
        # List and search operations  
        tester.test_get_all_items()
        tester.test_filter_items()
        tester.test_search_items()
        tester.test_get_stats_with_data()
        
        # Cleanup - delete one item to test delete functionality
        if serial2:
            tester.test_delete_item(serial2)
            
    finally:
        # Final cleanup
        tester.cleanup()
    
    # Results
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n📊 Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate > 80 else 1

if __name__ == "__main__":
    sys.exit(main())