// src/components/interviewer/InterviewCalendar.tsx
// --- ADD THESE TWO LINES AT THE VERY TOP ---

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card, CardContent } from '@/components/ui/card';
import { EventContentArg } from '@fullcalendar/core';

// Define the shape of the interview data again for this component
interface Interview {
  id: string;
  raw_scheduled_at: string;
  job_title: string;
  candidate_name: string;
   isPast?: boolean; // This will now be present
}

interface InterviewCalendarProps {
  interviews: Interview[];
  onEventClick: (interviewId: string) => void; // Function to open the detail modal
}

export const InterviewCalendar = ({ interviews, onEventClick }: InterviewCalendarProps) => {
  // We need to transform our interview data into the format FullCalendar expects
  const calendarEvents = interviews.map(interview => ({
    id: interview.id,
    title: `${interview.job_title} - ${interview.candidate_name}`,
    start: new Date(interview.raw_scheduled_at), // FullCalendar needs real Date objects
     extendedProps: {
      isPast: interview.isPast
    },
    backgroundColor: interview.isPast ? '#6b7280' : '#2563eb', // A muted gray for past, blue for upcoming
    borderColor: interview.isPast ? '#6b7280' : '#2563eb'
  }));

  const handleEventClick = (clickInfo: any) => {
    // When a user clicks an event on the calendar, we call the parent's function
    onEventClick(clickInfo.event.id);
  };

   const renderEventContent = (eventInfo: EventContentArg) => {
        const isPast = eventInfo.event.extendedProps.isPast;
        return (
            <div className={`w-full p-1 text-xs rounded-sm ${isPast ? 'past-event' : ''}`}>
                <span className="font-semibold">{eventInfo.timeText}</span>
                <span className="ml-1 truncate">{eventInfo.event.title}</span>
            </div>
        );
    };


  return (
    <Card>
      <CardContent className="p-4">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth" // Start with a month view
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek' // Allow user to switch between month and week
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="auto" // Let the calendar's height be flexible
          // You can add more styling and options here later
          dayMaxEvents={2} // Only show 2 events per day initially
                    eventDisplay="block"
                      eventTextColor="#ffffff"
          // --- END OF NEW PROPERTIES ---
        />
      </CardContent>
    </Card>
  );
};