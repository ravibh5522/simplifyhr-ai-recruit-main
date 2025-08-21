import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { format, addDays, isSameDay, parseISO, startOfDay, addMinutes } from 'date-fns';

interface CandidateSlot {
  end: string;
  date: string;
  start: string;
}

interface InterviewerSlot {
  id: string;
  end_time: string;
  priority: string;
  slot_type: string;
  start_time: string;
  duration_minutes: number;
  constraints: {
    can_be_split: boolean;
    min_notice_hours: number;
    requires_confirmation: boolean;
  };
  preferences: {
    buffer_after: number;
    max_duration: number;
    buffer_before: number;
    interview_types: string[];
  };
}

interface Candidate {
  id: string;
  candidates: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface Interviewer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface MergedCalendarViewProps {
  candidates: Candidate[];
  interviewers: Interviewer[];
  duration: number; // in minutes
  onSlotsSelected: (slots: any[]) => void;
}

interface MergedSlot {
  start: Date;
  end: Date;
  candidateIds: string[];
  interviewerIds: string[];
  score: number; // compatibility score
}

const MergedCalendarView: React.FC<MergedCalendarViewProps> = ({
  candidates,
  interviewers,
  duration,
  onSlotsSelected
}) => {
  const [selectedSlots, setSelectedSlots] = useState<MergedSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<MergedSlot[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    calculateMergedSlots();
  }, [candidates, interviewers, duration]);

  useEffect(() => {
    onSlotsSelected(selectedSlots);
  }, [selectedSlots, onSlotsSelected]);

  const calculateMergedSlots = () => {
    if (candidates.length === 0 || interviewers.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const merged: MergedSlot[] = [];
    const today = new Date();
    const daysToCheck = 14; // Check next 2 weeks

    for (let dayOffset = 1; dayOffset < daysToCheck; dayOffset++) { // Start from tomorrow
      const currentDate = addDays(today, dayOffset);
      
      // Skip weekends for now
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
      
      const daySlots = generateSlotsForDay(currentDate);
      merged.push(...daySlots);
    }

    // Sort by time
    merged.sort((a, b) => a.start.getTime() - b.start.getTime());

    setAvailableSlots(merged);
  };

  const generateSlotsForDay = (date: Date): MergedSlot[] => {
    const slots: MergedSlot[] = [];
    
    // Generate common business hours slots (9 AM to 6 PM)
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip lunch hour (12-1 PM)
      if (hour === 12) continue;
      
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = addMinutes(slotStart, duration);
      
      // Only add slot if it fits within working hours
      if (slotEnd.getHours() <= endHour) {
        const score = calculateTimeScore(slotStart);
        
        slots.push({
          start: slotStart,
          end: slotEnd,
          candidateIds: candidates.map(c => c.id),
          interviewerIds: interviewers.map(i => i.id),
          score
        });
      }
    }
    
    return slots;
  };

  const calculateTimeScore = (time: Date): number => {
    const hour = time.getHours();
    
    // Preferred times: 10-11 AM (score 100), 2-4 PM (score 90), others (score 70)
    if (hour >= 10 && hour < 11) return 100;
    if (hour >= 14 && hour < 16) return 90;
    if (hour >= 9 && hour < 12) return 85;
    if (hour >= 16 && hour < 18) return 75;
    
    return 70;
  };

  const handleSlotToggle = (slot: MergedSlot) => {
    setSelectedSlots(prev => {
      const existing = prev.find(s => 
        s.start.getTime() === slot.start.getTime() && 
        s.end.getTime() === slot.end.getTime()
      );
      
      if (existing) {
        return prev.filter(s => s !== existing);
      } else {
        return [...prev, slot];
      }
    });
  };

  const isSlotSelected = (slot: MergedSlot): boolean => {
    return selectedSlots.some(s => 
      s.start.getTime() === slot.start.getTime() && 
      s.end.getTime() === slot.end.getTime()
    );
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const weekStart = addDays(new Date(), currentWeek * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Available Time Slots
          </h3>
          <p className="text-sm text-muted-foreground">
            Showing common availability for {candidates.length} candidate(s) and {interviewers.length} interviewer(s)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
            disabled={currentWeek === 0}
          >
            Previous Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek + 1)}
          >
            Next Week
          </Button>
        </div>
      </div>

      {selectedSlots.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Selected Slots ({selectedSlots.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedSlots.map((slot, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>
                  {format(slot.start, 'MMM dd, yyyy')} • {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                </span>
                <Badge className={getScoreColor(slot.score)}>
                  {slot.score}% match
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const daySlots = availableSlots.filter(slot => isSameDay(slot.start, day));
          
          return (
            <Card key={day.toISOString()} className="min-h-[300px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {format(day, 'EEE, MMM dd')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {daySlots.length > 0 ? (
                  daySlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg border cursor-pointer transition-all ${
                        isSlotSelected(slot)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                      onClick={() => handleSlotToggle(slot)}
                    >
                      <div className="text-xs font-medium">
                        {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{duration}m</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" />
                        <span className="text-xs">
                          {slot.candidateIds.length}C + {slot.interviewerIds.length}I
                        </span>
                      </div>
                      <Badge 
                        className={`${getScoreColor(slot.score)} mt-1 text-xs`}
                      >
                        {slot.score}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-xs py-4">
                    No available slots
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {availableSlots.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 mx-auto text-yellow-600 mb-4" />
            <h3 className="font-semibold text-yellow-800 mb-2">No Available Slots</h3>
            <p className="text-sm text-yellow-700">
              No common availability found between selected candidates and interviewers. 
              Try selecting different participants or check their availability settings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MergedCalendarView;
