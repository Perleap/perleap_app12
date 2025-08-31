import { useState, useEffect } from "react";
import { TeacherLayout } from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'class' | 'meeting' | 'assessment' | 'deadline';
  participants?: number;
  location?: string;
}

const placeholderEvents: Event[] = [
  {
    id: '1',
    title: 'Calendar Integration Coming Soon',
    date: new Date(),
    time: 'All Day',
    type: 'class',
    participants: 0,
    location: 'System Update'
  }
];

export const TeacherCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        // Future: Integrate with real calendar data from courses and activities
        // For now, show placeholder message
        setEvents(placeholderEvents);
      } catch (error) {
        console.error('Error initializing calendar:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCalendar();
  }, []);

  const selectedDateEvents = events.filter(
    event => event.date.toDateString() === selectedDate.toDateString()
  );

  const getEventColor = (type: Event['type']) => {
    switch (type) {
      case 'class': return 'bg-blue-500';
      case 'meeting': return 'bg-green-500';
      case 'assessment': return 'bg-orange-500';
      case 'deadline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'class': return Users;
      case 'meeting': return CalendarDays;
      case 'assessment': return Clock;
      case 'deadline': return Clock;
      default: return CalendarDays;
    }
  };

  return (
    <TeacherLayout title="Calendar">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary">Calendar</h2>
        <p className="text-muted-foreground">Manage your schedule and upcoming events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1 bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <Button size="sm" className="w-full bg-gradient-hero shadow-glow">
                Add New Event
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="lg:col-span-2 bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Events for {selectedDate.toDateString()}
              <Badge variant="secondary">{selectedDateEvents.length} events</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => {
                  const IconComponent = getEventIcon(event.type);
                  return (
                    <div
                      key={event.id}
                      className="flex items-start space-x-4 p-4 bg-background/50 rounded-lg border border-border/50"
                    >
                      <div className={`w-10 h-10 ${getEventColor(event.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-primary">{event.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.time}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.participants && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{event.participants} participants</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="mt-2 capitalize">
                          {event.type}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Overview */}
      <Card className="mt-6 bg-gradient-card shadow-medium">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {events.filter(e => e.type === 'class').length}
              </div>
              <div className="text-sm text-muted-foreground">Classes This Week</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {events.filter(e => e.type === 'meeting').length}
              </div>
              <div className="text-sm text-muted-foreground">Meetings</div>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {events.filter(e => e.type === 'assessment').length}
              </div>
              <div className="text-sm text-muted-foreground">Assessments</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {events.filter(e => e.type === 'deadline').length}
              </div>
              <div className="text-sm text-muted-foreground">Deadlines</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TeacherLayout>
  );
};