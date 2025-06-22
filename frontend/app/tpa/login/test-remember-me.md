# Teacher Login Remember Me Functionality Test

## Overview
The "Remember Me" functionality allows teachers to stay logged in across browser sessions and automatically fills in their login credentials.

## Features Implemented

### 1. **Automatic Credential Loading**
- On page load, the system checks for saved login credentials
- If "Remember Me" was previously checked, the email/teacher number field is automatically filled
- The "Remember Me" checkbox is automatically checked if it was previously selected

### 2. **Credential Storage**
- When "Remember Me" is checked during login:
  - Login credentials are saved to localStorage
  - Authentication tokens are saved with 7-day expiration
  - User type is marked as 'teacher'
- When "Remember Me" is unchecked:
  - No credentials are saved
  - Authentication tokens are saved to sessionStorage (cleared on browser close)

### 3. **Data Persistence**
- **localStorage** (when Remember Me is checked):
  - `teacherToken` - Authentication token
  - `teacherInfo` - Teacher profile information
  - `userType` - Set to 'teacher'
  - `teacherLoginName` - Saved email/teacher number
  - `teacherRemember` - Set to 'true'

- **sessionStorage** (when Remember Me is unchecked):
  - `teacherToken` - Authentication token (cleared on browser close)
  - `teacherInfo` - Teacher profile information
  - `userType` - Set to 'teacher'

- **Cookies** (with appropriate expiration):
  - `teacherToken` - 7 days if Remember Me checked, session if not
  - `teacherInfo` - 7 days if Remember Me checked, session if not
  - `userType` - 7 days if Remember Me checked, session if not

## Test Scenarios

### Test 1: First Time Login with Remember Me
1. Navigate to `/tpa/login`
2. Enter valid teacher credentials
3. Check "Remember me" checkbox
4. Click "Login"
5. **Expected Result**: 
   - Login successful
   - Credentials saved to localStorage
   - Tokens saved with 7-day expiration

### Test 2: First Time Login without Remember Me
1. Navigate to `/tpa/login`
2. Enter valid teacher credentials
3. Leave "Remember me" unchecked
4. Click "Login"
5. **Expected Result**:
   - Login successful
   - No credentials saved
   - Tokens saved to sessionStorage

### Test 3: Returning User with Remember Me Enabled
1. Previously logged in with "Remember me" checked
2. Close browser completely
3. Reopen browser and navigate to `/tpa/login`
4. **Expected Result**:
   - Email/teacher number field is pre-filled
   - "Remember me" checkbox is checked
   - User can login with just password

### Test 4: Returning User without Remember Me
1. Previously logged in without "Remember me"
2. Close browser completely
3. Reopen browser and navigate to `/tpa/login`
4. **Expected Result**:
   - No fields are pre-filled
   - "Remember me" checkbox is unchecked

### Test 5: Switching Remember Me Preference
1. Login with "Remember me" checked
2. Logout
3. Login again without "Remember me"
4. **Expected Result**:
   - Previous saved credentials are cleared
   - New session-based tokens are created

## Security Considerations

### Data Protection
- Passwords are never stored locally (only hashed during transmission)
- Only email/teacher number is saved for convenience
- Authentication tokens have appropriate expiration times

### Privacy
- Users can clear saved data by unchecking "Remember me"
- All data is cleared on logout
- Session data is automatically cleared when browser closes

## Implementation Details

### Key Functions
- `saveTeacherLoginData()` - Handles credential and token storage
- `clearTeacherLoginData()` - Clears all stored data
- `useEffect()` - Loads saved credentials on component mount

### Storage Strategy
- **localStorage**: Persistent storage for Remember Me data
- **sessionStorage**: Temporary storage for session-only data
- **Cookies**: Cross-tab authentication with expiration

### Form Integration
- Uses React Hook Form for form management
- `setValue()` and `watch()` for dynamic field updates
- Automatic field population on component mount 