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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { createSession } from "@/app/dashboard/actions";

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [stationId, setStationId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Real-time validation (only after user interaction)
  const validationError = useMemo(() => {
    if (!hasUserInteracted) return null;
    
    const now = new Date();
    
    if (startDate && startDate < now) {
      return "Start date cannot be in the past";
    }
    
    if (endDate) {
      if (endDate < now) {
        return "End date cannot be in the past";
      }
      if (startDate && endDate <= startDate) {
        return "End date must be after start date";
      }
    }
    
    return null;
  }, [startDate, endDate, hasUserInteracted]);

  const error = serverError || validationError;

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setHasUserInteracted(true);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
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

    // If there's already a validation error, don't submit
    if (validationError) {
      setLoading(false);
      return;
    }

    const result = await createSession({ 
      stationId,
      startTime: startDate.toISOString(),
      endTime: endDate?.toISOString(),
    });

    if (result.error) {
      setServerError(result.error);
      setLoading(false);
    } else {
      // Success - close dialog and reset form
      setOpen(false);
      setStationId("");
      setStartDate(new Date());
      setEndDate(undefined);
      setLoading(false);
      setHasUserInteracted(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset on close
      setServerError(null);
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
            Enter the station ID to reserve a new charging session.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stationId">Station ID</Label>
            <Input
              id="stationId"
              placeholder="e.g., STATION-001"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              required
              disabled={loading}
            />
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
            <Label>End Time (optional)</Label>
            <DateTimePicker
              date={endDate}
              setDate={handleEndDateChange}
              disabled={loading}
            />
            <p className="text-xs text-zinc-500">Leave empty for active session</p>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
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
              {loading ? "Starting..." : "Start Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
