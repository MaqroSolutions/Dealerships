#!/usr/bin/env python3
"""
Test script for Maqro Reply Timing System

This script demonstrates the reply timing functionality by simulating
different dealership settings and customer messages.
"""
import asyncio
import sys
import os
from datetime import datetime, time
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass

# Add the src directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from maqro_rag.reply_scheduler import ReplyScheduler, ReplyTimingMode


@dataclass
class TestScenario:
    """Represents a test scenario for reply timing"""
    name: str
    settings: Dict[str, Any]
    message: str
    expected: str
    current_time: datetime = None


class ReplyTimingTester:
    """Test harness for reply timing functionality"""
    
    def __init__(self):
        self.scheduler = ReplyScheduler()
        self.test_results = []
    
    def create_test_scenarios(self) -> List[TestScenario]:
        """Create test scenarios for different reply timing modes"""
        return [
            TestScenario(
                name="Instant Mode - Transactional Query",
                settings={"reply_timing_mode": ReplyTimingMode.INSTANT.value, "reply_delay_seconds": 30},
                message="What are your hours today?",
                expected="instant"
            ),
            TestScenario(
                name="Instant Mode - Rapport Building",
                settings={"reply_timing_mode": ReplyTimingMode.INSTANT.value, "reply_delay_seconds": 30},
                message="Hey, thanks for the quick response!",
                expected="instant"
            ),
            TestScenario(
                name="Custom Delay Mode - Transactional Query",
                settings={"reply_timing_mode": ReplyTimingMode.CUSTOM_DELAY.value, "reply_delay_seconds": 45},
                message="Do you have any Toyota Camrys in stock?",
                expected="instant"
            ),
            TestScenario(
                name="Custom Delay Mode - Rapport Building",
                settings={"reply_timing_mode": ReplyTimingMode.CUSTOM_DELAY.value, "reply_delay_seconds": 45},
                message="Hi there! How are you doing today?",
                expected="delayed"
            ),
            TestScenario(
                name="Business Hours Mode - During Hours",
                settings={
                    "reply_timing_mode": ReplyTimingMode.BUSINESS_HOURS.value,
                    "business_hours_start": "09:00",
                    "business_hours_end": "17:00",
                    "business_hours_delay_seconds": 60
                },
                message="Hello! What's up?",
                current_time=datetime.now().replace(hour=14, minute=30),  # 2:30 PM
                expected="delayed"
            ),
            TestScenario(
                name="Business Hours Mode - After Hours",
                settings={
                    "reply_timing_mode": ReplyTimingMode.BUSINESS_HOURS.value,
                    "business_hours_start": "09:00",
                    "business_hours_end": "17:00",
                    "business_hours_delay_seconds": 60
                },
                message="Hey, thanks for your help!",
                current_time=datetime.now().replace(hour=20, minute=30),  # 8:30 PM
                expected="instant"
            )
        ]


    async def run_test_scenario(self, scenario: TestScenario) -> Tuple[bool, str]:
        """Run a single test scenario"""
        print(f"\n🧪 Test: {scenario.name}")
        print("-" * 40)
        
        should_delay, delay_seconds, reason = await self.scheduler.should_delay_reply(
            message=scenario.message,
            dealership_settings=scenario.settings,
            current_time=scenario.current_time
        )
        
        print(f"📝 Message: \"{scenario.message}\"")
        print(f"⚙️  Settings: {scenario.settings}")
        print(f"🤔 Should delay: {should_delay}")
        print(f"⏱️  Delay seconds: {delay_seconds:.1f}")
        print(f"💭 Reason: {reason}")
        
        # Check if result matches expectation
        expected_instant = scenario.expected == "instant"
        actual_instant = not should_delay
        
        if expected_instant == actual_instant:
            print("✅ Test passed!")
            return True, "Passed"
        else:
            print(f"❌ Test failed! Expected {'instant' if expected_instant else 'delayed'}, got {'instant' if actual_instant else 'delayed'}")
            return False, f"Expected {'instant' if expected_instant else 'delayed'}, got {'instant' if actual_instant else 'delayed'}"
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all test scenarios"""
        print("🚀 Testing Maqro Reply Timing System")
        print("=" * 50)
        
        scenarios = self.create_test_scenarios()
        passed = 0
        failed = 0
        
        for i, scenario in enumerate(scenarios, 1):
            success, message = await self.run_test_scenario(scenario)
            if success:
                passed += 1
            else:
                failed += 1
                self.test_results.append({
                    "scenario": scenario.name,
                    "status": "failed",
                    "message": message
                })
        
        return {
            "total": len(scenarios),
            "passed": passed,
            "failed": failed,
            "results": self.test_results
        }


class MockMessageFlow:
    """Mock message flow for testing"""
    
    def __init__(self):
        self.sent_messages = []
        self.scheduled_messages = []
    
    async def send_message(self, phone: str, message: str, delay: float = 0):
        """Mock send message function"""
        if delay > 0:
            print(f"📅 Scheduling message to {phone} with {delay:.1f}s delay...")
            await asyncio.sleep(delay)
            print(f"📤 Sending delayed message to {phone}: {message}")
        else:
            print(f"⚡ Sending instant message to {phone}: {message}")
        
        self.sent_messages.append({
            "phone": phone,
            "message": message,
            "delay": delay,
            "timestamp": datetime.now()
        })


async def test_reply_timing():
    """Test the reply timing system with different scenarios"""
    tester = ReplyTimingTester()
    results = await tester.run_all_tests()
    
    print(f"\n📊 Test Summary:")
    print(f"Total scenarios: {results['total']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    
    if results['failed'] > 0:
        print(f"\n❌ Failed Tests:")
        for result in results['results']:
            print(f"  - {result['scenario']}: {result['message']}")
    
    return results


class JitterTester:
    """Test jitter functionality"""
    
    def __init__(self):
        self.scheduler = ReplyScheduler()
    
    async def test_jitter(self) -> Dict[str, Any]:
        """Test that jitter is working correctly"""
        print(f"\n🎲 Testing Random Jitter")
        print("-" * 30)
        
        settings = {
            "reply_timing_mode": ReplyTimingMode.CUSTOM_DELAY.value,
            "reply_delay_seconds": 30
        }
        
        delays = []
        for i in range(5):
            should_delay, delay_seconds, reason = await self.scheduler.should_delay_reply(
                message="Hey there!",
                dealership_settings=settings
            )
            delays.append(delay_seconds)
            print(f"Test {i+1}: {delay_seconds:.1f}s delay")
        
        return self._analyze_jitter(delays)
    
    def _analyze_jitter(self, delays: List[float]) -> Dict[str, Any]:
        """Analyze jitter results"""
        min_delay = min(delays)
        max_delay = max(delays)
        avg_delay = sum(delays) / len(delays)
        jitter_range = max_delay - min_delay
        
        print(f"\n📈 Jitter Analysis:")
        print(f"Min delay: {min_delay:.1f}s")
        print(f"Max delay: {max_delay:.1f}s")
        print(f"Average delay: {avg_delay:.1f}s")
        print(f"Jitter range: {jitter_range:.1f}s")
        
        is_working = jitter_range > 5  # Should have at least 5 seconds of jitter
        
        if is_working:
            print("✅ Jitter is working correctly!")
        else:
            print("⚠️  Jitter might not be working as expected")
        
        return {
            "min_delay": min_delay,
            "max_delay": max_delay,
            "avg_delay": avg_delay,
            "jitter_range": jitter_range,
            "is_working": is_working
        }


async def test_jitter():
    """Test that jitter is working correctly"""
    tester = JitterTester()
    return await tester.test_jitter()


class BusinessHoursTester:
    """Test business hours functionality"""
    
    def __init__(self):
        self.scheduler = ReplyScheduler()
    
    async def test_business_hours(self) -> Dict[str, Any]:
        """Test business hours logic"""
        print(f"\n🏢 Testing Business Hours Logic")
        print("-" * 35)
        
        settings = {
            "reply_timing_mode": ReplyTimingMode.BUSINESS_HOURS.value,
            "business_hours_start": "09:00",
            "business_hours_end": "17:00",
            "business_hours_delay_seconds": 60
        }
        
        test_times = [
            ("08:30", "Before hours"),
            ("10:30", "During hours"),
            ("15:45", "During hours"),
            ("18:30", "After hours"),
            ("22:00", "Late night")
        ]
        
        results = []
        for time_str, description in test_times:
            result = await self._test_time_period(time_str, description, settings)
            results.append(result)
            print(f"{time_str} ({description}): {'Delayed' if result['should_delay'] else 'Instant'} - {result['reason']}")
        
        return {"test_periods": results}
    
    async def _test_time_period(self, time_str: str, description: str, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Test a specific time period"""
        hour, minute = map(int, time_str.split(":"))
        test_time = datetime.now().replace(hour=hour, minute=minute)
        
        should_delay, delay_seconds, reason = await self.scheduler.should_delay_reply(
            message="Hello!",
            dealership_settings=settings,
            current_time=test_time
        )
        
        return {
            "time": time_str,
            "description": description,
            "should_delay": should_delay,
            "delay_seconds": delay_seconds,
            "reason": reason
        }


async def test_business_hours():
    """Test business hours logic"""
    tester = BusinessHoursTester()
    return await tester.test_business_hours()


class TestRunner:
    """Main test runner for all reply timing tests"""
    
    def __init__(self):
        self.results = {}
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all test suites"""
        try:
            print("🚀 Starting Maqro Reply Timing System Tests")
            print("=" * 60)
            
            # Run all test suites
            self.results["reply_timing"] = await test_reply_timing()
            self.results["jitter"] = await test_jitter()
            self.results["business_hours"] = await test_business_hours()
            
            # Print final summary
            self._print_final_summary()
            
            return self.results
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}
    
    def _print_final_summary(self):
        """Print final test summary"""
        print(f"\n🎉 All tests completed!")
        print("=" * 50)
        
        # Count total results
        total_tests = 0
        total_passed = 0
        
        if "reply_timing" in self.results:
            total_tests += self.results["reply_timing"]["total"]
            total_passed += self.results["reply_timing"]["passed"]
        
        print(f"📊 Final Summary:")
        print(f"Total tests: {total_tests}")
        print(f"Passed: {total_passed}")
        print(f"Failed: {total_tests - total_passed}")
        
        if total_passed == total_tests:
            print("🎉 All tests passed!")
        else:
            print("⚠️  Some tests failed - check output above")


async def main():
    """Run all tests"""
    runner = TestRunner()
    return await runner.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
