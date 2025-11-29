# Dashboard Integration Guide

## Overview

This document describes the integration of the DemoDashboard UI components into the LYNQ application. The integration provides a modern, modular dashboard layout system for both admin and user roles.

## Architecture

### Core Components

#### 1. Layout Components (`src/components/layouts/`)

- **DashboardLayout.tsx**: Main layout wrapper that provides sidebar and navbar
- **DashboardSidebar.tsx**: Role-based sidebar navigation with collapsible support
- **DashboardNavbar.tsx**: Top navigation bar with theme toggle and logout

#### 2. Dashboard Components (`src/components/dashboard/`)

- **StatCard.tsx**: Display statistics with optional trends and progress bars
- **DashboardChart.tsx**: Recharts-based area/bar charts for data visualization  
- **ModuleTable.tsx**: Data table for module management
- **UserCard.tsx**: User profile cards with role badges
- **UploadHistoryCard.tsx**: Recent uploads list

### Pages

#### New Dashboard Pages

- **AdminDashboardNew.tsx**: Admin overview with stats, charts, and upload history
- **UserDashboardNew.tsx**: User dashboard with performance metrics and AI insights
- **ViewModulesNew.tsx**: Module management with search and filters
- **ViewUsersNew.tsx**: User management with grid layout

#### Route Changes

All dashboard routes now use the new UI:
- `/admin-dashboard` → AdminDashboardNew (old version at `/admin-dashboard-old`)
- `/user-dashboard` → UserDashboardNew (old version at `/user-dashboard-old`)
- `/view-modules` → ViewModulesNew (old version at `/view-modules-old`)
- `/view-users` → ViewUsersNew (old version at `/view-users-old`)

## Design System

### Color Tokens

All colors use HSL values from the design system defined in `src/index.css`:

```css
--background: 222 47% 10%;
--foreground: 210 40% 98%;
--primary: 222 73% 44%;
--card: 222 47% 12%;
--border: 220 30% 24%;
--sidebar-background: 222 45% 12%;
```

### Theme Support

- Dark mode by default
- Light mode toggle in navbar
- Theme persistence via localStorage

## Data Integration

### Real API Calls

All components fetch real data from Supabase:

```typescript
// Example: Fetching modules
const { data } = await supabase
  .from('modules')
  .select('*')
  .order('created_at', { ascending: false });
```

### Replace Mock Data

When extending the dashboard, replace mock data with API calls:

```typescript
// Before (mock)
const chartData = [
  { name: 'Mon', value: 12 },
  // ...
];

// After (real data)
const { data } = await supabase
  .from('analytics')
  .select('*')
  .gte('created_at', startDate);
  
const chartData = data?.map(d => ({
  name: formatDate(d.created_at),
  value: d.count
}));
```

## Role-Based Access Control

### Navigation Configuration

Sidebar menu items are role-specific:

```typescript
// User navigation
const userNavItems = [
  { title: 'Dashboard', url: '/user-dashboard', icon: LayoutDashboard },
  { title: 'My Modules', url: '/lynq-library', icon: BookOpen },
];

// Admin navigation  
const adminNavItems = [
  { title: 'Overview', url: '/admin-dashboard', icon: LayoutDashboard },
  { title: 'Module Manager', url: '/view-modules', icon: Layers },
  { title: 'Users', url: '/view-users', icon: Users },
];
```

### Adding New Pages

1. **Create the page component:**

```typescript
// src/pages/NewFeature.tsx
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const NewFeature = () => {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Your content */}
      </div>
    </DashboardLayout>
  );
};

export default NewFeature;
```

2. **Add route in App.tsx:**

```typescript
<Route 
  path="/new-feature" 
  element={<RouteGuard requireAdmin><NewFeature /></RouteGuard>} 
/>
```

3. **Add to sidebar navigation:**

```typescript
// In DashboardSidebar.tsx
const adminNavItems = [
  // existing items...
  { title: 'New Feature', url: '/new-feature', icon: SomeIcon },
];
```

## Component Usage Examples

### StatCard

```typescript
<StatCard
  title="Total Modules"
  value={12}
  icon={Layers}
  trend={{ value: 5, positive: true }}
  progress={60}
/>
```

### DashboardChart

```typescript
<DashboardChart
  title="Performance"
  data={chartData}
  type="area"
  dataKeys={['value1', 'value2']}
  colors={['hsl(var(--primary))', 'hsl(var(--destructive))']}
  height={300}
/>
```

### ModuleTable

```typescript
<ModuleTable
  modules={modules}
  onView={(id) => navigate(`/module/${id}`)}
  onEdit={(id) => navigate(`/edit-module/${id}`)}
/>
```

## Styling Guidelines

### Use Semantic Tokens

Always use design system tokens:

```typescript
// ✅ Good
className="bg-card border-border text-foreground"

// ❌ Bad  
className="bg-gray-900 border-gray-800 text-white"
```

### Responsive Design

Use Tailwind responsive prefixes:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Animations

Leverage existing animations from tailwind.config.ts:

```typescript
className="animate-fade-in"
```

## Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Sidebar navigation works for both roles
- [ ] Theme toggle persists across page reloads
- [ ] All API calls fetch real data
- [ ] Charts render correctly
- [ ] Tables handle empty states
- [ ] Mobile responsive layout works
- [ ] Logout functionality works
- [ ] Role-based routes are protected

## Migration from Old Dashboard

### Step 1: Update imports

```typescript
// Before
import AdminDashboard from './pages/AdminDashboard';

// After
import AdminDashboardNew from './pages/AdminDashboardNew';
```

### Step 2: Test thoroughly

Use old routes (`-old` suffix) to compare behavior

### Step 3: Remove old components

After verification, delete old dashboard files

## Future Enhancements

### Suggested Features

1. **Lazy Loading**: Code-split heavy chart components
2. **Component Library**: Extract reusable components to shared library
3. **Advanced Theming**: Support multiple color schemes
4. **Real-time Updates**: Add Supabase realtime subscriptions
5. **Export Functionality**: Add CSV/PDF export for tables and charts

### Adding New Chart Types

Extend DashboardChart component:

```typescript
// Add pie chart support
import { PieChart, Pie, Cell } from 'recharts';

// In DashboardChart.tsx
{type === 'pie' && (
  <PieChart>
    <Pie data={data} dataKey={dataKeys[0]} />
  </PieChart>
)}
```

## Troubleshooting

### Sidebar not showing

- Check if `SidebarProvider` wraps the app
- Verify collapsible prop is set to "icon"

### Charts not rendering

- Ensure Recharts is installed: `npm i recharts`
- Verify data format matches expected structure

### Theme not persisting

- Check localStorage permissions
- Verify theme toggle saves to localStorage

## Support

For issues or questions:
1. Check existing components for examples
2. Review Supabase docs for API queries
3. Refer to Tailwind CSS docs for styling
4. Check shadcn/ui docs for component APIs
