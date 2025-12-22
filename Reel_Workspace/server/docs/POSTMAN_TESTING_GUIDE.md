# Postman Testing Guide

Complete guide for testing the Reel Workspace API using the provided Postman collection.

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click "Import" button
3. Select `/docs/postman/ReelWorkspace.postman_collection.json`
4. Collection will appear in your workspace

### 2. Configure Variables

The collection uses the following variables:

| Variable       | Description              | Default Value             |
| -------------- | ------------------------ | ------------------------- |
| `baseUrl`      | API base URL             | `http://localhost:5000`   |
| `authToken`    | JWT authentication token | Auto-set after login      |
| `userId`       | Current user ID          | Auto-set after register   |
| `testReelId`   | ID of test reel          | Auto-set after extraction |
| `testFolderId` | ID of test folder        | Auto-set after creation   |

**To set baseUrl:**

1. Click on collection name
2. Go to "Variables" tab
3. Update `baseUrl` current value
4. Save

### 3. Run Tests

#### Option A: Run Entire Collection

1. Click collection name → "Run"
2. Select all folders
3. Click "Run Reel Workspace API"
4. View results

#### Option B: Run Individual Folders

1. Expand collection
2. Right-click folder (e.g., "Auth")
3. Click "Run folder"
4. View results

#### Option C: Run Single Request

1. Click on request
2. Click "Send"
3. View response and test results

## Test Flow

### Recommended Testing Order

1. **Health & Info** - Verify API is running
2. **Auth** - Register and login to get token
3. **Folders** - Create test folders
4. **Reels** - Extract and manage reels
5. **Search & Filter** - Test search functionality

### Detailed Flow

```
1. Health Check
   ↓
2. Register User (saves token automatically)
   ↓
3. Login (updates token)
   ↓
4. Get Current User (verify authentication)
   ↓
5. Create Folder (saves folder ID)
   ↓
6. Extract Reel (saves reel ID)
   ↓
7. Get All Reels
   ↓
8. Update Reel
   ↓
9. Search Reels
   ↓
10. Filter Reels
```

## Test Categories

### 1. Health & Info (2 tests)

**Purpose:** Verify API is running and accessible

**Tests:**

- ✅ Health Check - API status
- ✅ API Info - Available endpoints

**Expected:** All return 200 OK

---

### 2. Authentication (8 tests)

**Purpose:** Test user registration, login, and authentication

**Happy Path:**

- ✅ Register - Success (saves token)
- ✅ Login - Success (updates token)
- ✅ Get Current User - Success

**Error Cases:**

- ✅ Register - Duplicate Email (409)
- ✅ Register - Invalid Email (400)
- ✅ Register - Weak Password (400)
- ✅ Login - Invalid Credentials (401)
- ✅ Get Current User - No Token (401)

**Key Assertions:**

- Token is returned and saved
- User data structure is correct
- Validation errors are detailed
- Status codes are appropriate

---

### 3. Folders (9 tests)

**Purpose:** Test folder CRUD operations

**Happy Path:**

- ✅ Create Folder - Success (saves folder ID)
- ✅ Get All Folders
- ✅ Get Folder By ID - Success
- ✅ Update Folder - Success
- ✅ Delete Folder - Success

**Error Cases:**

- ✅ Create Folder - Duplicate Name (409)
- ✅ Create Folder - Missing Name (400)
- ✅ Get Folder By ID - Not Found (404)
- ✅ Get Folder By ID - Invalid ID (400)

**Key Assertions:**

- Folder ID is saved for later tests
- Folder counts are accurate
- Unique name constraint works
- Deletion strategies work correctly

---

### 4. Reels (14 tests)

**Purpose:** Test reel extraction and management

**Happy Path:**

- ✅ Extract Reel - Success (saves reel ID)
- ✅ Get All Reels - Default Pagination
- ✅ Get All Reels - Custom Pagination
- ✅ Get All Reels - Filter By Folder
- ✅ Get Reel By ID - Success
- ✅ Update Reel - Title
- ✅ Update Reel - Tags
- ✅ Update Reel - Move to Folder
- ✅ Delete Reel - Success

**Error Cases:**

- ✅ Extract Reel - Duplicate URL (409)
- ✅ Extract Reel - Invalid URL (400)
- ✅ Extract Reel - Missing URL (400)
- ✅ Get Reel By ID - Not Found (404)
- ✅ Update Reel - Invalid Folder (404)
- ✅ Delete Reel - Already Deleted (404)

**Key Assertions:**

- Reel ID is saved for later tests
- AI-generated content is present
- Pagination metadata is correct
- Timings are included
- Folder moves update counts

**Note:** For actual testing, replace the example Instagram URL with a real, public reel URL.

---

### 5. Search & Filter (11 tests)

**Purpose:** Test search and filtering capabilities

**Search Tests:**

- ✅ Search Reels - Success
- ✅ Search Reels - Empty Query (400)
- ✅ Search Reels - No Results (200, empty array)
- ✅ Search Reels - Special Characters

**Filter Tests:**

- ✅ Filter Reels - By Folder
- ✅ Filter Reels - By Tags
- ✅ Filter Reels - By Date Range
- ✅ Filter Reels - Combined Filters
- ✅ Filter Reels - Invalid Date Format (400)

**Statistics:**

- ✅ Get Filter Stats

**Key Assertions:**

- Relevance scores are included
- Pagination works correctly
- Filter metadata is accurate
- Empty results are handled gracefully
- Statistics include tags, dates, folders

---

## Test Assertions

Each request includes comprehensive test assertions:

### Status Code Checks

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});
```

### Response Structure Checks

```javascript
pm.test("Response has success true", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.success).to.be.true;
});
```

### Data Validation

```javascript
pm.test("Response has user data", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.data).to.have.property("user");
  pm.expect(jsonData.data.user).to.have.property("email");
});
```

### Variable Storage

```javascript
// Save token for subsequent requests
pm.collectionVariables.set("authToken", jsonData.data.token);
```

## Troubleshooting

### Issue: "401 Unauthorized" on Protected Routes

**Cause:** Missing or invalid authentication token

**Solution:**

1. Run "Auth" → "Register - Success" or "Login - Success"
2. Verify token is saved: Check collection variables
3. Ensure Authorization header is set to inherit from collection

### Issue: "404 Not Found" on Reel/Folder Operations

**Cause:** Using invalid or non-existent IDs

**Solution:**

1. Run creation requests first (Extract Reel, Create Folder)
2. Verify IDs are saved in collection variables
3. Check that resources weren't deleted in previous tests

### Issue: "409 Conflict" on Creation

**Cause:** Duplicate data (email, folder name, reel URL)

**Solution:**

1. Use unique values (e.g., `{{$timestamp}}` in email)
2. Delete existing resources first
3. Use different test data

### Issue: Reel Extraction Takes Too Long

**Cause:** AI processing is resource-intensive

**Solution:**

1. Wait 10-20 seconds for completion
2. Check server logs for progress
3. Verify AI API keys are configured
4. Ensure FFmpeg is installed

### Issue: Tests Fail After First Run

**Cause:** Duplicate data from previous run

**Solution:**

1. Clear collection variables
2. Use dynamic data (timestamps)
3. Delete test data between runs

## Advanced Usage

### Running Tests in CI/CD

Use Newman (Postman CLI):

```bash
# Install Newman
npm install -g newman

# Run collection
newman run ReelWorkspace.postman_collection.json \
  --environment production.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### Environment-Specific Testing

Create environments for different stages:

**Development:**

```json
{
  "baseUrl": "http://localhost:5000"
}
```

**Staging:**

```json
{
  "baseUrl": "https://staging-api.example.com"
}
```

**Production:**

```json
{
  "baseUrl": "https://api.example.com"
}
```

### Load Testing with Postman Runner

1. Select collection or folder
2. Click "Run"
3. Set iterations (e.g., 10)
4. Set delay between requests (e.g., 1000ms)
5. Click "Run"
6. Analyze response times and success rate

### Monitoring Tests

Set up Postman Monitors:

1. Click collection → "..." → "Monitor Collection"
2. Set schedule (hourly, daily, etc.)
3. Configure notifications
4. View results in Postman dashboard

## Best Practices

### 1. Test Data Management

- ✅ Use `{{$timestamp}}` for unique values
- ✅ Clean up test data after runs
- ✅ Use separate test accounts
- ❌ Don't use production data in tests

### 2. Test Organization

- ✅ Group related tests in folders
- ✅ Name tests descriptively
- ✅ Order tests logically
- ❌ Don't mix happy path and error cases randomly

### 3. Assertions

- ✅ Test status codes
- ✅ Validate response structure
- ✅ Check data types
- ✅ Verify business logic
- ❌ Don't skip error case assertions

### 4. Variables

- ✅ Use collection variables for shared data
- ✅ Save IDs for dependent tests
- ✅ Clear variables between test runs
- ❌ Don't hardcode values

### 5. Documentation

- ✅ Add descriptions to requests
- ✅ Document expected behavior
- ✅ Note prerequisites
- ❌ Don't assume knowledge

## Test Coverage Summary

| Category        | Total Tests | Happy Path | Error Cases | Coverage |
| --------------- | ----------- | ---------- | ----------- | -------- |
| Health & Info   | 2           | 2          | 0           | 100%     |
| Auth            | 8           | 3          | 5           | 100%     |
| Folders         | 9           | 5          | 4           | 100%     |
| Reels           | 14          | 9          | 5           | 100%     |
| Search & Filter | 11          | 7          | 4           | 100%     |
| **Total**       | **44**      | **26**     | **18**      | **100%** |

## Expected Test Results

When all tests pass, you should see:

```
✓ Health Check - Status code is 200
✓ Health Check - Response has status ok
✓ Register - Status code is 201
✓ Register - Response has token
✓ Login - Status code is 200
✓ Get All Reels - Response has data array
✓ Search - Results have relevance score
... (44 total assertions)

All tests passed! 🎉
```

## Support

If you encounter issues:

1. Check server logs for errors
2. Verify environment variables are set
3. Ensure all dependencies are installed
4. Review API documentation at `/docs/API.md`
5. Check troubleshooting section in `/server/README.md`

---

**Happy Testing! 🚀**
