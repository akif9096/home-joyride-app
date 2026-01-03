import React from "react";
import { Check, Clock } from "lucide-react";
import { ServiceType } from "@/data/servicesData";
import { cn } from "@/lib/utils";

interface ServiceTypeSelectorProps {
  types: ServiceType[];
  selectedType: ServiceType | null;
  onSelect: (type: ServiceType) => void;
}

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  types,
  selectedType,
  onSelect,
}) => {
  return (
    <div className="space-y-3 p-5">
      {types.map((type) => {
        const isSelected = selectedType?.id === type.id;
        
        return (
          <button
            key={type.id}
            onClick={() => onSelect(type)}
            className={cn(
              "w-full flex items-start gap-4 p-4 rounded-xl text-left",
              "border transition-all duration-200",
              isSelected
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            {/* Selection indicator */}
            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                "transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium text-foreground">{type.name}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {type.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-foreground">₹{type.price}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{type.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ServiceTypeSelector;
