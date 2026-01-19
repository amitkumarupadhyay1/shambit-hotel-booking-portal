'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  AlertTriangle, 
  Lightbulb, 
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';

import { QualityScoreDashboard, QualityMetrics } from './quality-score-dashboard';
import { MissingInformationAlerts, MissingInformation } from './missing-information-alerts';
import { QualityRecommendations, Recommendation } from './quality-recommendations';
import { QualityReportGenerator, QualityReport } from './quality-report-generator';

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

export function QualityAssuranceDashboard({
  hotelId,
  hotelName = 'Your Property',
  initialQualityMetrics,
  onRefreshData,
  onGenerateReport,
  onDownloadReport,
  onShareReport,
  onActionClick,
  onRecommendationAction,
  className = ''
}: QualityAssuranceDashboardProps) {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | undefined>(initialQualityMetrics);
  const [missingInformation, setMissingInformation] = useState<MissingInformation[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const refreshData = async () => {
    if (!onRefreshData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await onRefreshData();
      setQualityMetrics(data.qualityMetrics);
      setMissingInformation(data.missingInformation);
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh on mount if no initial data
  useEffect(() => {
    if (!initialQualityMetrics && onRefreshData) {
      refreshData();
    }
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quality Assurance</h1>
              <p className="text-sm text-gray-600">
                Monitor and improve your property profile quality
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onRefreshData && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="missing" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Missing Info</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Report</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {qualityMetrics ? (
            <QualityScoreDashboard qualityMetrics={qualityMetrics} />
          ) : (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                {isLoading ? 'Loading quality metrics...' : 'No quality data available'}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="missing" className="space-y-6">
          <MissingInformationAlerts 
            missingInformation={missingInformation}
            onActionClick={onActionClick}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <QualityRecommendations 
            recommendations={recommendations}
            onActionClick={onRecommendationAction}
          />
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <QualityReportGenerator
            hotelId={hotelId}
            hotelName={hotelName}
            qualityMetrics={qualityMetrics}
            onGenerateReport={onGenerateReport}
            onDownloadReport={onDownloadReport}
            onShareReport={onShareReport}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}