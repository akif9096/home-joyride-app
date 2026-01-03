import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorker } from "@/context/WorkerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Check } from "lucide-react";
import WorkerNav from "@/components/worker/WorkerNav";
import { getDayName, Availability } from "@/data/workerData";
import { useToast } from "@/hooks/use-toast";

const WorkerAvailability = () => {
  const navigate = useNavigate();
  const { isLoggedIn, availability, updateAvailability } = useWorker();
  const { toast } = useToast();
  const [localAvailability, setLocalAvailability] = useState<Availability[]>(availability);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/worker/login");
    }
  }, [isLoggedIn, navigate]);

  const handleToggleDay = (dayOfWeek: number) => {
    setLocalAvailability((prev) =>
      prev.map((a) =>
        a.dayOfWeek === dayOfWeek ? { ...a, isAvailable: !a.isAvailable } : a
      )
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: "startTime" | "endTime", value: string) => {
    setLocalAvailability((prev) =>
      prev.map((a) =>
        a.dayOfWeek === dayOfWeek ? { ...a, [field]: value } : a
      )
    );
  };

  const handleSave = () => {
    updateAvailability(localAvailability);
    toast({
      title: "Availability Updated",
      description: "Your schedule has been saved successfully.",
    });
  };

  const timeOptions = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
  ];

  const formatTime = (time: string) => {
    const [hours] = time.split(":");
    const hour = parseInt(hours);
    if (hour === 0) return "12:00 AM";
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return "12:00 PM";
    return `${hour - 12}:00 PM`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/worker")}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold">Availability</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Set your working hours
            </p>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="px-6 py-6 space-y-4">
        {localAvailability.map((day) => (
          <Card key={day.dayOfWeek} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={day.isAvailable}
                    onCheckedChange={() => handleToggleDay(day.dayOfWeek)}
                  />
                  <Label className="font-bold text-base">
                    {getDayName(day.dayOfWeek)}
                  </Label>
                </div>
                {day.isAvailable && (
                  <span className="text-sm text-success font-semibold">Available</span>
                )}
              </div>

              {day.isAvailable && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground font-medium mb-1 block">
                      Start
                    </Label>
                    <select
                      value={day.startTime}
                      onChange={(e) => handleTimeChange(day.dayOfWeek, "startTime", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background font-semibold text-sm"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Clock className="w-4 h-4 text-muted-foreground mt-5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground font-medium mb-1 block">
                      End
                    </Label>
                    <select
                      value={day.endTime}
                      onChange={(e) => handleTimeChange(day.dayOfWeek, "endTime", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background font-semibold text-sm"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Button */}
      <div className="px-6 pb-6">
        <Button onClick={handleSave} className="w-full h-12 font-bold">
          <Check className="w-5 h-5 mr-2" />
          Save Schedule
        </Button>
      </div>

      <WorkerNav />
    </div>
  );
};

export default WorkerAvailability;
