import React from "react";
import { Home, Briefcase, MapPin, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Address } from "@/data/servicesData";
import { cn } from "@/lib/utils";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelect: (address: Address) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedAddress,
  onSelect,
}) => {
  const navigate = useNavigate();
  const getIcon = (type: Address["type"]) => {
    switch (type) {
      case "home":
        return Home;
      case "work":
        return Briefcase;
      default:
        return MapPin;
    }
  };

  return (
    <div className="p-5 space-y-3">
      {addresses.map((address) => {
        const Icon = getIcon(address.type);
        const isSelected = selectedAddress?.id === address.id;

        return (
          <button
            key={address.id}
            onClick={() => onSelect(address)}
            className={cn(
              "w-full flex items-start gap-4 p-4 rounded-xl text-left",
              "border transition-all duration-200",
              isSelected
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-primary" : "bg-secondary"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground">{address.label}</h4>
                {address.isDefault && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {address.address}
              </p>
            </div>

            {/* Selection indicator */}
            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                "transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>
          </button>
        );
      })}

      {/* Add New Address */}
      <button
        onClick={() => navigate("/addresses")}
        className={cn(
          "w-full flex items-center justify-center gap-2 p-4 rounded-xl",
          "border border-dashed border-muted-foreground/30",
          "text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
          "transition-all duration-200"
        )}
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add New Address</span>
      </button>
    </div>
  );
};

export default AddressSelector;
