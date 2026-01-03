import React from "react";
import { Star } from "lucide-react";
import { Service } from "@/data/servicesData";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  onClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  const Icon = service.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center p-6 rounded-2xl",
        "bg-card border border-border",
        "hover:border-primary/50 hover:shadow-card-hover",
        "transition-all duration-300 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        "active:scale-[0.98]"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
          "transition-transform duration-300 group-hover:scale-110",
          service.bgColor
        )}
      >
        <Icon className={cn("w-8 h-8", service.color)} />
      </div>

      {/* Name */}
      <h3 className="font-semibold text-foreground mb-1">{service.name}</h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground text-center mb-3 line-clamp-2">
        {service.description}
      </p>

      {/* Rating */}
      <div className="flex items-center gap-1.5 text-sm">
        <Star className="w-4 h-4 fill-warning text-warning" />
        <span className="font-medium">{service.rating}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">{service.totalBookings} bookings</span>
      </div>

      {/* Hover effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100",
          "transition-opacity duration-300",
          "bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"
        )}
      />
    </button>
  );
};

export default ServiceCard;
