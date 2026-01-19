'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QualityAssuranceDashboard } from '@/components/onboarding/quality-assurance-dashboard';
import { useQualityAssurance } from '@/hooks/use-quality-assurance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { 
  demoQualityMetrics, 
  demoMissingInformation, 
  demoRecommendations,
  mockApiCalls,
  createScenarioData 
} from '@/components/onboarding/demo-data';

export default function QualityAssurancePage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params?.hotelId as string || 'demo-hotel-id';
  
  // Use demo data for demonstration
  const [demoMode, setDemoMode] = useState(true);
  const [currentScenario, setCurrentScenario] = useState<'normal' | 'excellent' | 'needs-improvement'>('normal');
  
  const {
    data,
    isLoading,
    error,
    fetchDashboardData,
    generateReport,
    downloadReport,
    shareReport,
  } = useQualityAssurance({ hotelId });

  // Demo data based on current scenario
  const getDemoData = () => {
    switch (currentScenario) {
      case 'excellent':
        return {
          qualityMetrics: createScenarioData.excellentProperty(),
          missingInformation: [],
          recommendations: demoRecommendations.filter(r => r.priority === 'low').slice(0, 2),
        };
      case 'needs-improvement':
        return {
          qualityMetrics: createScenarioData.needsImprovementProperty(),
          missingInformation: createScenarioData.criticalMissingInfo(),
          recommendations: demoRecommendations.filter(r => r.priority === 'high'),
        };
      default:
        return {
          qualityMetrics: demoQualityMetrics,
          missingInformation: demoMissingInformation,
          recommendations: demoRecommendations,
        };
    }
  };

  const currentData = demoMode ? getDemoData() : data;

  useEffect(() => {
    // Load initial data only if not in demo mode
    if (!demoMode) {
      fetchDashboardData().catch(console.error);
    }
  }, [fetchDashboardData, demoMode]);

  const handleRefreshData = async () => {
    if (demoMode) {
      // Simulate API call with demo data
      return mockApiCalls.fetchDashboardData();
    }
    return fetchDashboardData();
  };

  const handleGenerateReport = async (reportHotelId: string) => {
    if (demoMode) {
      return mockApiCalls.generateReport(reportHotelId);
    }
    return generateReport(reportHotelId);
  };

  const handleActionClick = (category: string, item: string) => {
    console.log(`Action clicked for ${category}: ${item}`);
    // Navigate to appropriate onboarding step based on category
    switch (category.toLowerCase()) {
      case 'images':
        router.push(`/onboarding/${hotelId}/images`);
        break;
      case 'content':
        router.push(`/onboarding/${hotelId}/property-info`);
        break;
      case 'policies':
        router.push(`/onboarding/${hotelId}/policies`);
        break;
      case 'business features':
        router.push(`/onboarding/${hotelId}/business`);
        break;
      default:
        router.push(`/onboarding/${hotelId}`);
    }
  };

  const handleRecommendationAction = (recommendation: any) => {
    console.log('Recommendation action:', recommendation);
    // Navigate based on recommendation type
    switch (recommendation.type) {
      case 'image':
        router.push(`/onboarding/${hotelId}/images`);
        break;
      case 'content':
        router.push(`/onboarding/${hotelId}/property-info`);
        break;
      case 'policy':
        router.push(`/onboarding/${hotelId}/policies`);
        break;
      case 'amenity':
        router.push(`/onboarding/${hotelId}/amenities`);
        break;
      default:
        router.push(`/onboarding/${hotelId}`);
    }
  };

  if (!demoMode && error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900">Error Loading Quality Data</h1>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-2">
            <Button onClick={() => fetchDashboardData()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => setDemoMode(true)}>
              Use Demo Mode
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Onboarding
        </Button>
      </div>

      {/* Demo Controls */}
      {demoMode && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Demo Mode</h3>
              <p className="text-sm text-blue-700">
                Explore different quality scenarios with sample data
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={currentScenario}
                onChange={(e) => setCurrentScenario(e.target.value as any)}
                className="px-3 py-1 border border-blue-300 rounded-md text-sm"
              >
                <option value="normal">Normal Property (78%)</option>
                <option value="excellent">Excellent Property (92%)</option>
                <option value="needs-improvement">Needs Improvement (45%)</option>
              </select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDemoMode(false)}
              >
                Use Live Data
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quality Assurance Dashboard */}
      <QualityAssuranceDashboard
        hotelId={hotelId}
        hotelName={`Demo Hotel Property (${currentScenario})`}
        initialQualityMetrics={currentData?.qualityMetrics}
        onRefreshData={handleRefreshData}
        onGenerateReport={handleGenerateReport}
        onDownloadReport={downloadReport}
        onShareReport={shareReport}
        onActionClick={handleActionClick}
        onRecommendationAction={handleRecommendationAction}
      />
    </div>
  );
}