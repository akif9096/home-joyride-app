import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/layout/BottomNav";
import ServiceCard from "@/components/services/ServiceCard";
import { services } from "@/data/servicesData";
import { useAuth } from "@/context/AuthContext";

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase()) ||
      s.types.some((t) => t.name.toLowerCase().includes(query.toLowerCase()))
  );

  const handleServiceClick = (service: (typeof services)[0]) => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    // Navigate home and let the booking flow handle it there
    navigate("/", { state: { openService: service.id } });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Search Services</h1>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search plumber, electrician, painter..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No services found for "{query}"
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {query ? `${filtered.length} results` : "All Services"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onClick={() => handleServiceClick(service)}
                />
              ))}
            </div>

            {/* Show sub-services matching query */}
            {query && (
              <div className="mt-6 space-y-3">
                {services
                  .flatMap((s) =>
                    s.types
                      .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
                      .map((t) => ({ ...t, parentService: s }))
                  )
                  .map((item) => (
                    <button
                      key={`${item.parentService.id}-${item.id}`}
                      onClick={() => handleServiceClick(item.parentService)}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-muted-foreground/30 transition-all text-left"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.parentService.name} · {item.duration}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">₹{item.price}</span>
                    </button>
                  ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Search;
