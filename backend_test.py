import requests
import sys
import json
import time
import websocket
import threading
from datetime import datetime

class FlowForgeAPITester:
    def __init__(self, base_url="https://flowforge-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.ws_messages = []
        self.ws_connected = False

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details:
            print(f"   Details: {details}")

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_message = "FlowForge API v2.1.0 - 88 AI Agents at your service!"
                success = data.get("message") == expected_message
                details = f"Status: {response.status_code}, Message: {data.get('message', 'N/A')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("API Root Endpoint", success, details)
            return success
            
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_generate_website(self):
        """Test website generation endpoint"""
        try:
            payload = {
                "prompt": "Create a modern SaaS landing page for a project management tool",
                "business_type": "saas",
                "target_audience": "Project managers, team leads, developers",
                "include_auth": True
            }
            
            response = requests.post(
                f"{self.api_url}/generate",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.project_id = data.get("project_id")
                success = self.project_id is not None and data.get("status") == "generating"
                details = f"Status: {response.status_code}, Project ID: {self.project_id}, Status: {data.get('status')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Website Generation", success, details)
            return success
            
        except Exception as e:
            self.log_test("Website Generation", False, f"Exception: {str(e)}")
            return False

    def test_project_status(self):
        """Test project status retrieval"""
        if not self.project_id:
            self.log_test("Project Status", False, "No project ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/project/{self.project_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["project_id", "status", "progress", "current_phase", "agents"]
                missing_fields = [field for field in required_fields if field not in data]
                success = len(missing_fields) == 0
                
                if success:
                    details = f"Status: {data.get('status')}, Progress: {data.get('progress')}%, Phase: {data.get('current_phase')}, Agents: {len(data.get('agents', {}))}"
                else:
                    details = f"Missing fields: {missing_fields}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Project Status", success, details)
            return success
            
        except Exception as e:
            self.log_test("Project Status", False, f"Exception: {str(e)}")
            return False

    def test_websocket_connection(self):
        """Test WebSocket connection for real-time updates"""
        if not self.project_id:
            self.log_test("WebSocket Connection", False, "No project ID available")
            return False
            
        try:
            ws_url = f"{self.base_url}/api/ws/{self.project_id}".replace("https://", "wss://")
            
            def on_message(ws, message):
                try:
                    data = json.loads(message)
                    self.ws_messages.append(data)
                    print(f"   📡 WebSocket message: {data.get('type', 'unknown')}")
                except:
                    pass
            
            def on_open(ws):
                self.ws_connected = True
                print("   📡 WebSocket connected")
            
            def on_error(ws, error):
                print(f"   📡 WebSocket error: {error}")
            
            def on_close(ws, close_status_code, close_msg):
                print("   📡 WebSocket closed")
            
            # Create WebSocket connection
            ws = websocket.WebSocketApp(
                ws_url,
                on_open=on_open,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            
            # Run WebSocket in a separate thread
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for connection
            time.sleep(3)
            
            success = self.ws_connected
            details = f"Connected: {self.ws_connected}, Messages received: {len(self.ws_messages)}"
            
            # Close WebSocket
            ws.close()
            
            self.log_test("WebSocket Connection", success, details)
            return success
            
        except Exception as e:
            self.log_test("WebSocket Connection", False, f"Exception: {str(e)}")
            return False

    def test_invalid_project_status(self):
        """Test project status with invalid ID"""
        try:
            fake_id = "invalid-project-id-12345"
            response = requests.get(f"{self.api_url}/project/{fake_id}", timeout=10)
            success = response.status_code == 404
            
            details = f"Status: {response.status_code} (expected 404)"
            self.log_test("Invalid Project Status", success, details)
            return success
            
        except Exception as e:
            self.log_test("Invalid Project Status", False, f"Exception: {str(e)}")
            return False

    def test_download_endpoint_early(self):
        """Test download endpoint before generation is complete"""
        if not self.project_id:
            self.log_test("Download Endpoint (Early)", False, "No project ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/project/{self.project_id}/download", timeout=10)
            # Should return 404 since generation is not complete yet
            success = response.status_code == 404
            
            details = f"Status: {response.status_code} (expected 404 for incomplete project)"
            self.log_test("Download Endpoint (Early)", success, details)
            return success
            
        except Exception as e:
            self.log_test("Download Endpoint (Early)", False, f"Exception: {str(e)}")
            return False

    def test_cors_headers(self):
        """Test CORS headers"""
        try:
            response = requests.options(f"{self.api_url}/", timeout=10)
            success = response.status_code in [200, 204]
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            details = f"Status: {response.status_code}, CORS headers present: {any(cors_headers.values())}"
            self.log_test("CORS Headers", success, details)
            return success
            
        except Exception as e:
            self.log_test("CORS Headers", False, f"Exception: {str(e)}")
            return False

    def test_malformed_generate_request(self):
        """Test generation with malformed request"""
        try:
            # Missing required prompt field
            payload = {
                "business_type": "saas",
                "target_audience": "developers"
            }
            
            response = requests.post(
                f"{self.api_url}/generate",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 422 for validation error
            success = response.status_code == 422
            
            details = f"Status: {response.status_code} (expected 422 for missing prompt)"
            self.log_test("Malformed Generate Request", success, details)
            return success
            
        except Exception as e:
            self.log_test("Malformed Generate Request", False, f"Exception: {str(e)}")
            return False

    def wait_for_generation_progress(self, max_wait_time=60):
        """Wait and monitor generation progress"""
        if not self.project_id:
            return False
            
        print(f"\n🔄 Monitoring generation progress for up to {max_wait_time} seconds...")
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            try:
                response = requests.get(f"{self.api_url}/project/{self.project_id}", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    status = data.get('status', 'unknown')
                    progress = data.get('progress', 0)
                    phase = data.get('current_phase', 'unknown')
                    
                    print(f"   📊 Status: {status}, Progress: {progress}%, Phase: {phase}")
                    
                    if status in ['ready', 'deployed', 'error']:
                        return status == 'ready' or status == 'deployed'
                        
                time.sleep(5)
                
            except Exception as e:
                print(f"   ❌ Error checking progress: {e}")
                break
                
        return False

def main():
    print("🚀 Starting FlowForge API Testing Suite")
    print("=" * 60)
    
    tester = FlowForgeAPITester()
    
    # Basic API tests
    print("\n📋 Basic API Tests")
    print("-" * 30)
    tester.test_api_root()
    tester.test_cors_headers()
    tester.test_invalid_project_status()
    tester.test_malformed_generate_request()
    
    # Core functionality tests
    print("\n🔧 Core Functionality Tests")
    print("-" * 30)
    tester.test_generate_website()
    tester.test_project_status()
    tester.test_websocket_connection()
    tester.test_download_endpoint_early()
    
    # Monitor generation progress
    if tester.project_id:
        generation_completed = tester.wait_for_generation_progress(120)  # Wait up to 2 minutes
        
        if generation_completed:
            print("\n✅ Generation completed! Testing download...")
            # Test download after completion
            try:
                response = requests.get(f"{tester.api_url}/project/{tester.project_id}/download", timeout=30)
                success = response.status_code == 200 and response.headers.get('content-type') == 'application/zip'
                tester.log_test("Download Endpoint (Complete)", success, 
                               f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
            except Exception as e:
                tester.log_test("Download Endpoint (Complete)", False, f"Exception: {str(e)}")
        else:
            print("\n⏰ Generation did not complete within time limit")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"❌ {failed_tests} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())