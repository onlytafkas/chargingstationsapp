"use client";

import { useState, useMemo } from "react";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { createSession } from "@/app/dashboard/actions";

type Station = {
  id: number;
  name: string;
  description: string | null;
};

type CreateSessionDialogProps = {
  stations: Station[];
};

export function CreateSessionDialog({ stations }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [stationId, setStationId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [duration, setDuration] = useState<string>("60"); // Default to 1 hour (in minutes)
  const [loading, setLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calculate end date based on start date and duration
  const endDate = useMemo(() => {
    if (!startDate || !duration) return undefined;
    const end = new Date(startDate.getTime());
    end.setMinutes(end.getMinutes() + parseInt(duration));
    return end;
  }, [startDate, duration]);

  // Real-time validation (only after user interaction)
  const validationError = useMemo(() => {
    if (!hasUserInteracted) return null;
    
    const now = new Date();
    
    if (startDate && startDate < now) {
      return "Start date cannot be in the past";
    }
    
    if (!endDate) {
      return "End time is required";
    }
    
    if (endDate < now) {
      return "End date cannot be in the past";
    }
    
    if (startDate && endDate <= startDate) {
      return "End date must be after start date";
    }
    
    return null;
  }, [startDate, endDate, hasUserInteracted]);

  const error = serverError || validationError;

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setHasUserInteracted(true);
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    setHasUserInteracted(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError(null);

    if (!startDate) {
      setServerError("Please select a start date and time");
      setLoading(false);
      return;
    }

    if (!endDate) {
      setServerError("Please select a duration");
      setLoading(false);
      return;
    }

    if (!stationId) {
      setServerError("Please select a station");
      setLoading(false);
      return;
    }

    // If there's already a validation error, don't submit
    if (validationError) {
      setLoading(false);
      return;
    }

    const result = await createSession({ 
      stationId,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });

    if (result.error) {
      setServerError(result.error);
      setLoading(false);
    } else {
      // Show success message if time was adjusted
      if (result.message) {
        setSuccessMessage(result.message);
        setServerError(null);
        // Keep dialog open briefly to show message, then close
        setTimeout(() => {
          setOpen(false);
          setStationId(null);
          setStartDate(new Date());
          setDuration("60");
          setLoading(false);
          setHasUserInteracted(false);
          setSuccessMessage(null);
        }, 2500);
      } else {
        // No adjustment - close immediately
        setOpen(false);
        setStationId(null);
        setStartDate(new Date());
        setDuration("60");
        setLoading(false);
        setHasUserInteracted(false);
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset on close
      setServerError(null);
      setSuccessMessage(null);
      setHasUserInteracted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500">
          <Zap className="h-4 w-4" />
          Reserve Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reserve Charging Session</DialogTitle>
          <DialogDescription>
            Select a station to reserve a new charging session.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stationId">Station</Label>
            <Select
              value={stationId?.toString() ?? ""}
              onValueChange={(value) => setStationId(Number(value))}
              disabled={loading}
            >
              <SelectTrigger id="stationId">
                <SelectValue placeholder="Select a station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id.toString()}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <DateTimePicker
              date={startDate}
              setDate={handleStartDateChange}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={duration}
              onValueChange={handleDurationChange}
              disabled={loading}
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <DateTimePicker
              date={endDate}
              setDate={() => {}} // Read-only, calculated from start date + duration
              disabled={true}
            />
            <p className="text-xs text-zinc-500">Calculated from start time + duration</p>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {successMessage && (
            <p className="text-sm text-emerald-400">{successMessage}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500"
              disabled={loading || error !== null}
            >
              {loading ? "Reserving..." : "Reserve Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
