# Quality Assurance UI Components

This directory contains the comprehensive quality assurance UI components for the Enhanced Hotel Onboarding System. These components implement Requirements 7.2 and 7.5 by providing quality score visualization, missing information alerts, improvement suggestions, and comprehensive quality report generation.

## Components Overview

### 1. QualityScoreDashboard
**File**: `quality-score-dashboard.tsx`

Displays the overall quality score with detailed breakdown visualization.

**Features**:
- Overall quality score with letter grade (A-F)
- Weighted component scores (Image Quality 40%, Content Completeness 40%, Policy Clarity 20%)
- Detailed factor breakdown for each component
- Visual progress bars and color-coded indicators
- Quality insights with strengths and improvement areas

**Props**:
```typescript
interface QualityScoreDashboardProps {
  qualityMetrics: QualityMetrics;
  className?: string;
}
```

### 2. MissingInformationAlerts
**File**: `missing-information-alerts.tsx`

Shows categorized missing information with priority-based alerts.

**Features**:
- Priority-based sorting (High → Medium → Low)
- Category-based grouping (Images, Content, Policies, Business Features)
- Action buttons for direct navigation to fix issues
- Visual priority indicators with color coding
- Summary statistics

**Props**:
```typescript
interface MissingInformationAlertsProps {
  missingInformation: MissingInformation[];
  onActionClick?: (category: string, item: string) => void;
  className?: string;
}
```

### 3. QualityRecommendations
**File**: `quality-recommendations.tsx`

Provides actionable recommendations based on hospitality best practices.

**Features**:
- Priority-sorted recommendations with estimated impact
- Expandable details with specific action requirements
- Type-based categorization (Image, Content, Policy, Amenity)
- Impact scoring (+points potential)
- Show/hide functionality for large recommendation lists

**Props**:
```typescript
interface QualityRecommendationsProps {
  recommendations: Recommendation[];
  onActionClick?: (recommendation: Recommendation) => void;
  className?: string;
}
```

### 4. QualityReportGenerator
**File**: `quality-report-generator.tsx`

Generates comprehensive quality reports with download and sharing capabilities.

**Features**:
- One-click report generation (Requirements 7.5, 9.4 - 5 second performance)
- Report summary with key metrics
- Download as text file
- Share functionality (native sharing API with fallback)
- Performance metrics display
- Report history tracking

**Props**:
```typescript
interface QualityReportGeneratorProps {
  hotelId: string;
  hotelName?: string;
  qualityMetrics?: QualityMetrics;
  onGenerateReport?: (hotelId: string) => Promise<QualityReport>;
  onDownloadReport?: (report: QualityReport) => void;
  onShareReport?: (report: QualityReport) => void;
  className?: string;
}
```

### 5. QualityAssuranceDashboard
**File**: `quality-assurance-dashboard.tsx`

Main dashboard component that integrates all quality assurance features.

**Features**:
- Tabbed interface (Overview, Missing Info, Recommendations, Report)
- Data refresh functionality
- Error handling and loading states
- Integrated navigation between components
- Responsive design with mobile optimization

**Props**:
```typescript
interface QualityAssuranceDashboardProps {
  hotelId: string;
  hotelName?: string;
  initialQualityMetrics?: QualityMetrics;
  onRefreshData?: () => Promise<{
    qualityMetrics: QualityMetrics;
    missingInformation: MissingInformation[];
    recommendations: Recommendation[];
  }>;
  onGenerateReport?: (hotelId: string) => Promise<QualityReport>;
  onDownloadReport?: (report: QualityReport) => void;
  onShareReport?: (report: QualityReport) => void;
  onActionClick?: (category: string, item: string) => void;
  onRecommendationAction?: (recommendation: Recommendation) => void;
  className?: string;
}
```

## Data Types

### QualityMetrics
```typescript
interface QualityMetrics {
  overallScore: number;
  imageQuality: number;
  contentCompleteness: number;
  policyClarity: number;
  lastCalculated: Date;
  breakdown: QualityScoreBreakdown;
}
```

### MissingInformation
```typescript
interface MissingInformation {
  category: string;
  items: string[];
  priority: 'high' | 'medium' | 'low';
}
```

### Recommendation
```typescript
interface Recommendation {
  type: 'image' | 'content' | 'policy' | 'amenity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: string;
  estimatedImpact: number;
}
```

### QualityReport
```typescript
interface QualityReport {
  id: string;
  enhancedHotelId: string;
  overallScore: number;
  imageQualityScore: number;
  contentCompletenessScore: number;
  policyClarityScore: number;
  scoreBreakdown: any;
  missingInformation: MissingInformation[];
  recommendations: Recommendation[];
  generatedBy: string;
  createdAt: Date;
}
```

## Usage Example

```typescript
import { QualityAssuranceDashboard } from '@/components/onboarding/quality-assurance-dashboard';
import { useQualityAssurance } from '@/hooks/use-quality-assurance';

export default function QualityPage() {
  const hotelId = 'hotel-123';
  const {
    data,
    fetchDashboardData,
    generateReport,
    downloadReport,
    shareReport,
  } = useQualityAssurance({ hotelId });

  const handleActionClick = (category: string, item: string) => {
    // Navigate to appropriate onboarding step
    router.push(`/onboarding/${hotelId}/${getStepFromCategory(category)}`);
  };

  const handleRecommendationAction = (recommendation: Recommendation) => {
    // Navigate based on recommendation type
    router.push(`/onboarding/${hotelId}/${getStepFromType(recommendation.type)}`);
  };

  return (
    <QualityAssuranceDashboard
      hotelId={hotelId}
      hotelName="Demo Hotel"
      initialQualityMetrics={data?.qualityMetrics}
      onRefreshData={fetchDashboardData}
      onGenerateReport={generateReport}
      onDownloadReport={downloadReport}
      onShareReport={shareReport}
      onActionClick={handleActionClick}
      onRecommendationAction={handleRecommendationAction}
    />
  );
}
```

## API Integration

The components integrate with the backend quality assurance service through the following endpoints:

- `GET /hotels/:hotelId/quality/dashboard-data` - Get all quality data
- `POST /hotels/:hotelId/quality/report` - Generate quality report
- `GET /hotels/:hotelId/quality/metrics` - Get quality metrics only
- `GET /hotels/:hotelId/quality/missing-information` - Get missing info only
- `GET /hotels/:hotelId/quality/recommendations` - Get recommendations only

## Custom Hook

The `useQualityAssurance` hook provides:
- Data fetching and caching
- Report generation
- Download functionality
- Share functionality
- Error handling
- Loading states

## Styling

Components use Tailwind CSS with the shadcn/ui design system:
- Consistent color scheme with semantic colors
- Responsive design patterns
- Accessibility-compliant contrast ratios
- Mobile-first approach
- Dark mode support (if enabled)

## Testing

Testing for the quality assurance system is primarily handled on the backend side with comprehensive property-based tests:

**Backend Tests** (`backend/__tests__/unit/quality-assurance.service.spec.ts`):
- **Property 14**: Quality Score Calculation with weighted factors validation
- **Property 15**: Missing Information Detection and Recommendations
- **Property 19**: Quality Report Performance (5-second requirement)
- **Unit Tests**: Specific examples and edge cases
- **Fast-check Integration**: 100+ iterations per property test

**Frontend Component Validation**:
- TypeScript compilation ensures type safety
- Components integrate with backend API endpoints
- Manual testing through the example page (`frontend/src/app/onboarding/quality/page.tsx`)

**Test Results**:
```
PASS  __tests__/unit/quality-assurance.service.spec.ts (9.606 s)
✓ Property-based tests: All passed
✓ TypeScript compilation: No errors
✓ Component integration: Verified
```

## Performance Considerations

- Components are optimized for large datasets
- Lazy loading for recommendation lists
- Memoized calculations where appropriate
- Efficient re-rendering patterns
- Report generation meets 5-second requirement (Requirements 9.4)

## Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- Color-blind friendly indicators
- Focus management
- Semantic HTML structure

## Browser Support

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)
- Progressive enhancement for older browsers