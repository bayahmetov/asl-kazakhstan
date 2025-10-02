# Testing Guide for Role Management and Search Features

## 1. Admin Role Management Testing

### Prerequisites
- You need an admin account to test this feature
- Access the Admin Dashboard

### Test Steps

1. **Login as Admin**
   - Navigate to `/auth` and login with admin credentials
   - Verify you can see "Admin Dashboard" in the navigation

2. **Access User Management**
   - Click on "Admin Dashboard"
   - You should see the User Management section with user statistics

3. **Test Role Changes**
   - Click on any user in the list
   - Try changing their role using the three buttons:
     - Student → Instructor
     - Instructor → Admin
     - Admin → Student
   
4. **Verify Changes Persist**
   - After changing a role, close the dialog
   - Refresh the page
   - Open the same user again - the new role should be displayed
   - The user's badge should reflect the new role

5. **Test Role Permissions**
   - Have the user whose role was changed log in
   - Verify they have the appropriate permissions:
     - **Instructor**: Can create courses, upload lessons
     - **Admin**: Can access Admin Dashboard
     - **Student**: Can enroll in courses

### Expected Behavior
- ✅ Role changes save successfully
- ✅ Success toast notification appears
- ✅ User list refreshes automatically
- ✅ New role is immediately visible
- ✅ User gets appropriate permissions after role change

### Common Issues
- ❌ "Failed to update user role" → Check if you're logged in as admin
- ❌ Role doesn't persist → Clear browser cache and try again

---

## 2. Course Search Testing

### Test Locations
- **Global Search**: Click search icon in top navigation (any page)
- **Courses Page**: Search bar at top of courses list (`/courses`)

### Test Cases

#### A. Basic Search
1. Navigate to `/courses`
2. Type "React" in the search bar
3. Results should filter in real-time
4. Clear search with X button or by deleting text

#### B. Search by Different Fields
Test searching for:
- **Course Title**: Type part of a course name
- **Description**: Type keywords from course descriptions
- **Tags**: Type course tags (if available)
- **Instructor Name**: (Global search only) Type instructor's name

#### C. Level Filter
1. Use the "Filter by level" dropdown
2. Select "Beginner", "Intermediate", or "Advanced"
3. Only courses of that level should appear
4. Combine with search query

#### D. Empty State
1. Search for something that doesn't exist
2. Should see "No courses found" message
3. "Clear filters" button should appear
4. Clicking it should reset search and filters

#### E. Global Search Dialog
1. Click search icon in navigation
2. Dialog opens with search input
3. Type at least 2 characters
4. Results show both courses and lessons
5. Clicking a result navigates to course detail page

### Expected Results
- ✅ Search updates in real-time
- ✅ Both title and description are searchable
- ✅ Level filter works independently and combined with search
- ✅ Result count shows correctly
- ✅ Clear button resets everything
- ✅ Empty state provides helpful message

### Sample Test Data
Create test courses with these titles to verify search:
- "React Fundamentals for Beginners"
- "Advanced JavaScript Patterns"
- "Web Development Bootcamp"
- "Python Data Science Course"

Search for:
- "React" → Should find React course
- "JavaScript" → Should find JS course
- "beginner" → Should find beginner level course
- Non-existent term → Should show empty state

---

## Troubleshooting

### Role Management Not Working
1. Check browser console for errors
2. Verify you're logged in as admin
3. Check if the profiles table has RLS policies enabled
4. Try logging out and back in

### Search Not Working
1. Verify courses exist in the database
2. Check browser console for errors
3. Ensure the `search_content` database function exists
4. Try searching with different terms

### Performance Issues
- If search is slow, the database function might need optimization
- Consider adding indexes on searchable columns

---

## Success Criteria

### Role Management ✓
- [x] Admins can change any user's role
- [x] Changes persist after page refresh
- [x] Users immediately get new role permissions
- [x] Non-admins cannot change roles

### Search Functionality ✓
- [x] Search works on Courses page
- [x] Global search works from navigation
- [x] Filters by title, description, tags, instructor
- [x] Level filter works correctly
- [x] Real-time filtering as you type
- [x] Clear button works
- [x] Empty states are helpful

---

## Notes
- Both features were recently fixed with database migrations
- Role management required new RLS policies for admin access
- Search functionality uses PostgreSQL full-text search via `search_content` function
- All changes should be immediately visible without page refresh
