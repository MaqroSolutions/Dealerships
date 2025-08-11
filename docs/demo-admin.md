# Dealership Admin Demo

This document describes the admin dashboard functionality implemented for the demo.

## Setup

### Environment Variables

Set the following environment variable to enable demo mode:

```bash
NEXT_PUBLIC_DEMO_MODE="true"
```

This will:
- Show mock metrics data instead of real data
- Display demo mode indicators
- Simulate invitation sending

### Running the Demo

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Set the demo mode environment variable
3. Navigate to the application

## Demo Script

### Step 1: Login and Select Role
1. Navigate to the application
2. **Option A - New User**: Click "Sign up" and create a new account
3. **Option B - Existing User**: Login with existing credentials
4. **Expected Result**: Redirected to role selection page (`/role-select`)
5. **Select "Dealership Admin"** to access the admin interface
6. **Expected Result**: Automatically redirected to `/admin` dashboard

1. **Point out the metrics cards**:
   - Inventory count: 47 vehicles
   - Leads today: 24 leads
   - Average response time: 2.4 hours
   - Follow-ups due: 12 items
2. **Highlight the demo mode indicator** at the bottom
3. **Explain**: "These metrics are live in production, but mocked for the demo"

### Step 3: Upload Inventory
1. Click the **"Upload Inventory"** card
2. **Expected Result**: Navigate to existing inventory upload flow
3. **Explain**: "This reuses our existing inventory management system"

### Step 4: Invite Salespeople
1. Click the **"Invite Salespeople"** card
2. Fill out the invite form with a test email
3. Click **"Send Invitation"**
4. **Expected Result**: Success message, email appears in "Recent Invitations"
5. **Explain**: "In production, this sends actual emails with signup links"

### Step 5: View Conversations
1. Click the **"View Conversations"** card
2. **Expected Result**: Navigate to existing salesperson conversation interface
3. **Explain**: "Admins can monitor all team conversations and leads"

### Step 6: Navigation
1. **Point out the sidebar**: Admin users see additional "Admin Dashboard" and "Invite Team" items
2. **Explain**: "Role-based navigation - only admins see these options"

## Demo Mode Indicators

When `NEXT_PUBLIC_DEMO_MODE="true"` is set:

1. **Admin Dashboard**: Shows a yellow "Demo Mode Active" banner
2. **Metrics**: Display mock data with realistic values
3. **Invitations**: Show "Demo Mode" notice explaining simulation
4. **API Responses**: Include `demoMode: true` flag

## Production Notes

In production, the system would:

1. **Real Metrics**: Fetch actual data from database
2. **Role-Based Access**: Check user roles for admin access
3. **Email Invitations**: Send actual emails with signup links
4. **Database Storage**: Store invitation records
5. **Audit Trail**: Track admin actions

## File Structure

```
frontend/
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard
│   │   └── invite/
│   │       └── page.tsx          # Invite salespeople
│   ├── role-select/
│   │   └── page.tsx              # Role selection page
│   └── api/
│       ├── metrics/
│       │   └── route.ts          # Metrics API
│       └── invite/
│           └── route.ts          # Invite API
├── components/
│   ├── auth/
│   │   └── auth-provider.tsx     # Updated with role redirects
│   └── app-sidebar.tsx           # Updated with admin navigation
└── docs/
    └── demo-admin.md             # This file
```

## Testing Checklist

- [ ] Admin dashboard loads with mock metrics
- [ ] Demo mode banner appears when enabled
- [ ] Inventory upload link works
- [ ] Invitation form submits successfully
- [ ] Recent invitations list updates
- [ ] Conversations link works
- [ ] Admin link appears in user menu
- [ ] Role-based access works (basic implementation)

## Manual Test Steps

1. **Role Gating**: Verify admin dashboard is accessible
2. **Inventory Link**: Test navigation to upload page
3. **Invites**: Submit invitation form and verify success
4. **Metrics Mocks**: Confirm demo data displays correctly
5. **Navigation**: Test all admin dashboard links 