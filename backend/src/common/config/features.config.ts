export interface FeatureConfig {
  BOOKING_CREATION: boolean;
  PAYMENT_PROCESSING: boolean;
  REVIEWS_RATINGS: boolean;
  NOTIFICATIONS: boolean;
  ANALYTICS: boolean;
}

export const getFeatureConfig = (): FeatureConfig => {
  const spiralLevel = parseInt(process.env.SPIRAL_LEVEL || '2');
  
  return {
    BOOKING_CREATION: spiralLevel >= 3,
    PAYMENT_PROCESSING: spiralLevel >= 4,
    REVIEWS_RATINGS: spiralLevel >= 5,
    NOTIFICATIONS: spiralLevel >= 5,
    ANALYTICS: spiralLevel >= 6,
  };
};

export const isFeatureEnabled = (feature: keyof FeatureConfig): boolean => {
  const config = getFeatureConfig();
  return config[feature];
};