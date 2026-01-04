import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import { useBooking } from "@/context/BookingContext";

const Addresses: React.FC = () => {
  const navigate = useNavigate();
  const { addresses, addAddress, setDefaultAddress } = useBooking();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"home" | "work" | "other">("home");
  const [addrText, setAddrText] = useState("");

  const handleAdd = () => {
    if (!label.trim() || !addrText.trim()) return;
    addAddress({ type, label: label.trim(), address: addrText.trim(), isDefault: true });
    setLabel("");
    setAddrText("");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Saved Addresses</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved addresses.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{a.label}</h4>
                      {a.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.address}</p>
                  </div>
                  {!a.isDefault && (
                    <button onClick={() => setDefaultAddress(a.id)} className="text-sm text-primary">Set default</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-medium mb-3">Add New Address</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full p-3 rounded-md border border-border" placeholder="Home, Work, etc." />
            </div>
            <div>
              <label className="block text-sm mb-1">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setType("home")} className={`px-3 py-2 rounded-md ${type === "home" ? "bg-primary/10" : "bg-background"}`}>Home</button>
                <button type="button" onClick={() => setType("work")} className={`px-3 py-2 rounded-md ${type === "work" ? "bg-primary/10" : "bg-background"}`}>Work</button>
                <button type="button" onClick={() => setType("other")} className={`px-3 py-2 rounded-md ${type === "other" ? "bg-primary/10" : "bg-background"}`}>Other</button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Address</label>
              <textarea value={addrText} onChange={(e) => setAddrText(e.target.value)} className="w-full p-3 rounded-md border border-border" rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1">Add Address & Use</Button>
              <Button variant="ghost" onClick={() => { setLabel(""); setAddrText(""); }}>Cancel</Button>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Addresses;
