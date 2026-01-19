'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell, 
  Utensils, 
  Leaf, 
  Gamepad2, 
  Monitor,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export interface AmenityCardProps {
  id: string;
  name: string;
  description?: string;
  icon: string;
  isEcoFriendly: boolean;
  isSelected: boolean;
  isApplicable: boolean;
  hasConflict?: boolean;
  conflictMessage?: string;
  onToggle: (id: string) => void;
  className?: string;
}

// Icon mapping for amenities
const getAmenityIcon = (iconName: string, className?: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    wifi: Wifi,
    parking: Car,
    coffee: Coffee,
    gym: Dumbbell,
    restaurant: Utensils,
    eco: Leaf,
    games: Gamepad2,
    business: Monitor,
    reception: Monitor,
    ac: Monitor,
    minibar: Coffee,
    pool: Dumbbell,
    spa: Dumbbell,
    solar: Leaf,
    recycle: Leaf,
    meeting: Monitor,
  };
  
  const IconComponent = iconMap[iconName] || Monitor;
  return <IconComponent className={className || "h-5 w-5"} />;
};

export function AmenityCard({
  id,
  name,
  description,
  icon,
  isEcoFriendly,
  isSelected,
  isApplicable,
  hasConflict = false,
  conflictMessage,
  onToggle,
  className,
}: AmenityCardProps) {
  const handleClick = () => {
    if (isApplicable && !hasConflict) {
      onToggle(id);
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        !isApplicable && "opacity-50 cursor-not-allowed",
        hasConflict && "border-red-200 bg-red-50",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className={cn(
              "p-2 rounded-lg flex-shrink-0",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {getAmenityIcon(icon, "h-4 w-4")}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm leading-tight">{name}</h3>
                {isEcoFriendly && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700">
                    <Leaf className="h-3 w-3 mr-1" />
                    Eco
                  </Badge>
                )}
              </div>
              
              {description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}

              {!isApplicable && (
                <p className="text-xs text-red-500 mt-1">
                  Not applicable to this property type
                </p>
              )}

              {hasConflict && conflictMessage && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <p className="text-xs text-red-500">{conflictMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Selection indicator */}
          <div className="flex-shrink-0 ml-2">
            {isSelected && (
              <CheckCircle className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for mobile
export function CompactAmenityCard({
  id,
  name,
  icon,
  isEcoFriendly,
  isSelected,
  isApplicable,
  onToggle,
  className,
}: Omit<AmenityCardProps, 'description' | 'hasConflict' | 'conflictMessage'>) {
  const handleClick = () => {
    if (isApplicable) {
      onToggle(id);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
        isSelected && "bg-primary text-primary-foreground border-primary",
        !isSelected && "bg-background hover:bg-muted",
        !isApplicable && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
    >
      {getAmenityIcon(icon, "h-4 w-4 flex-shrink-0")}
      <span className="text-sm font-medium flex-1 truncate">{name}</span>
      {isEcoFriendly && (
        <Leaf className="h-3 w-3 text-green-600 flex-shrink-0" />
      )}
      {isSelected && (
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
      )}
    </div>
  );
}