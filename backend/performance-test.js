/**
 * Performance Test Script for Search Implementation
 * Tests the optimized search functionality under load
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  concurrentUsers: 10,
  requestsPerUser: 5,
  cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
  hotelTypes: ['HOTEL', 'RESORT', 'GUESTHOUSE'],
};

// Generate test dates
function generateTestDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 1);
  
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 7) + 1);
  
  return {
    checkInDate: checkIn.toISOString().split('T')[0],
    checkOutDate: checkOut.toISOString().split('T')[0],
  };
}

// Generate search parameters
function generateSearchParams() {
  const dates = generateTestDates();
  const city = TEST_CONFIG.cities[Math.floor(Math.random() * TEST_CONFIG.cities.length)];
  const hotelType = Math.random() > 0.5 ? 
    TEST_CONFIG.hotelTypes[Math.floor(Math.random() * TEST_CONFIG.hotelTypes.length)] : 
    undefined;
  
  return {
    city,
    checkInDate: dates.checkInDate,
    checkOutDate: dates.checkOutDate,
    guests: Math.floor(Math.random() * 4) + 1,
    page: Math.floor(Math.random() * 3) + 1,
    limit: 10,
    ...(hotelType && { hotelType }),
  };
}

// Single search request
async function performSearch(params) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/hotels/search`, { params });
    const endTime = Date.now();
    
    return {
      success: true,
      responseTime: endTime - startTime,
      resultsCount: response.data.data.length,
      totalResults: response.data.pagination.total,
      statusCode: response.status,
    };
  } catch (error) {
    const endTime = Date.now();
    
    return {
      success: false,
      responseTime: endTime - startTime,
      error: error.response?.data?.message || error.message,
      statusCode: error.response?.status || 0,
    };
  }
}

// Run concurrent tests for a single user
async function runUserTests(userId) {
  console.log(`Starting tests for User ${userId}...`);
  const results = [];
  
  for (let i = 0; i < TEST_CONFIG.requestsPerUser; i++) {
    const params = generateSearchParams();
    const result = await performSearch(params);
    
    results.push({
      userId,
      requestId: i + 1,
      params,
      ...result,
    });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Main performance test
async function runPerformanceTest() {
  console.log('🚀 Starting Performance Test...');
  console.log(`Configuration: ${TEST_CONFIG.concurrentUsers} users, ${TEST_CONFIG.requestsPerUser} requests each`);
  console.log(`Target: ${BASE_URL}`);
  console.log('─'.repeat(60));
  
  const startTime = Date.now();
  
  // Create promises for all concurrent users
  const userPromises = [];
  for (let i = 1; i <= TEST_CONFIG.concurrentUsers; i++) {
    userPromises.push(runUserTests(i));
  }
  
  // Wait for all users to complete
  const allResults = await Promise.all(userPromises);
  const flatResults = allResults.flat();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Calculate statistics
  const successfulRequests = flatResults.filter(r => r.success);
  const failedRequests = flatResults.filter(r => !r.success);
  
  const responseTimes = successfulRequests.map(r => r.responseTime);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  
  // Sort for percentiles
  responseTimes.sort((a, b) => a - b);
  const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
  
  // Print results
  console.log('\n📊 Performance Test Results');
  console.log('─'.repeat(60));
  console.log(`Total Requests: ${flatResults.length}`);
  console.log(`Successful: ${successfulRequests.length} (${(successfulRequests.length / flatResults.length * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failedRequests.length} (${(failedRequests.length / flatResults.length * 100).toFixed(1)}%)`);
  console.log(`Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Requests/Second: ${(flatResults.length / (totalTime / 1000)).toFixed(2)}`);
  
  console.log('\n⏱️  Response Time Statistics (ms)');
  console.log('─'.repeat(40));
  console.log(`Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Min: ${minResponseTime}ms`);
  console.log(`Max: ${maxResponseTime}ms`);
  console.log(`95th Percentile: ${p95ResponseTime}ms`);
  console.log(`99th Percentile: ${p99ResponseTime}ms`);
  
  // Error analysis
  if (failedRequests.length > 0) {
    console.log('\n❌ Error Analysis');
    console.log('─'.repeat(30));
    const errorCounts = {};
    failedRequests.forEach(r => {
      const key = `${r.statusCode}: ${r.error}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`${count}x ${error}`);
    });
  }
  
  // Performance recommendations
  console.log('\n💡 Performance Analysis');
  console.log('─'.repeat(40));
  
  if (avgResponseTime > 1000) {
    console.log('⚠️  Average response time > 1s - Consider optimization');
  } else if (avgResponseTime > 500) {
    console.log('⚡ Average response time acceptable but could be improved');
  } else {
    console.log('✅ Good average response time');
  }
  
  if (p95ResponseTime > 2000) {
    console.log('⚠️  95th percentile > 2s - Check for performance bottlenecks');
  }
  
  if (failedRequests.length / flatResults.length > 0.05) {
    console.log('⚠️  Error rate > 5% - Check system stability');
  }
  
  const successRate = successfulRequests.length / flatResults.length;
  if (successRate >= 0.99) {
    console.log('✅ Excellent success rate');
  } else if (successRate >= 0.95) {
    console.log('✅ Good success rate');
  } else {
    console.log('❌ Poor success rate - investigate errors');
  }
}

// Run the test
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest, performSearch };