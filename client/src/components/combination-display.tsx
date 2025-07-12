import { cn } from "@/lib/utils";

interface CombinationDisplayProps {
  mainNumbers: number[];
  luckyStars: number[];
  variant?: 'default' | 'compact' | 'prediction' | 'alternative';
}

export function CombinationDisplay({ mainNumbers, luckyStars, variant = 'default' }: CombinationDisplayProps) {
  const getMainNumberSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-6 h-6 text-xs';
      case 'prediction':
        return 'w-10 h-10 text-lg';
      case 'alternative':
        return 'w-8 h-8 text-sm';
      default:
        return 'w-8 h-8 text-sm';
    }
  };

  const getLuckyStarSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-5 h-5 text-xs';
      case 'prediction':
        return 'w-8 h-8 text-sm';
      case 'alternative':
        return 'w-6 h-6 text-xs';
      default:
        return 'w-6 h-6 text-xs';
    }
  };

  const getMainNumberStyle = () => {
    switch (variant) {
      case 'prediction':
        return 'bg-white bg-opacity-20 text-white border-white border-opacity-30';
      case 'alternative':
        return 'bg-white border-2 border-gray-300 text-gray-800';
      default:
        return 'bg-primary text-white';
    }
  };

  const getLuckyStarStyle = () => {
    switch (variant) {
      case 'prediction':
        return 'bg-yellow-400 bg-opacity-90 text-gray-800';
      case 'alternative':
        return 'bg-yellow-300 border border-gray-300 text-gray-800';
      default:
        return 'bg-secondary text-white';
    }
  };

  const getSpacing = () => {
    switch (variant) {
      case 'compact':
        return 'space-x-1';
      case 'prediction':
        return 'space-x-3';
      default:
        return 'space-x-2';
    }
  };

  return (
    <div className={cn("flex items-center justify-center", getSpacing())}>
      <div className={cn("flex", getSpacing())}>
        {mainNumbers.map((number, index) => (
          <span
            key={index}
            className={cn(
              "rounded-full flex items-center justify-center font-bold font-roboto-mono",
              getMainNumberSize(),
              getMainNumberStyle()
            )}
          >
            {number.toString().padStart(2, '0')}
          </span>
        ))}
      </div>
      
      {variant !== 'compact' && (
        <div className="w-px h-8 bg-gray-300 mx-2"></div>
      )}
      
      <div className={cn("flex", getSpacing())}>
        {luckyStars.map((star, index) => (
          <span
            key={index}
            className={cn(
              "rounded-full flex items-center justify-center font-bold font-roboto-mono",
              getLuckyStarSize(),
              getLuckyStarStyle()
            )}
          >
            {star.toString().padStart(2, '0')}
          </span>
        ))}
      </div>
    </div>
  );
}
