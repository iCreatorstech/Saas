import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  userId: string;
}

const TaskCalendar = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser]);

  const fetchTasks = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, 'tasks'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return {
          backgroundColor: 'rgb(239 68 68 / 0.2)',
          borderColor: 'rgb(239 68 68)',
          textColor: 'rgb(185 28 28)',
        };
      case 'medium':
        return {
          backgroundColor: 'rgb(234 179 8 / 0.2)',
          borderColor: 'rgb(234 179 8)',
          textColor: 'rgb(161 98 7)',
        };
      case 'low':
        return {
          backgroundColor: 'rgb(34 197 94 / 0.2)',
          borderColor: 'rgb(34 197 94)',
          textColor: 'rgb(21 128 61)',
        };
      default:
        return {
          backgroundColor: 'rgb(99 102 241 / 0.2)',
          borderColor: 'rgb(99 102 241)',
          textColor: 'rgb(67 56 202)',
        };
    }
  };

  const events = tasks
    .filter(task => task.dueDate)
    .map(task => ({
      id: task.id, 
      title: `${task.title} ${task.status === 'completed' ? '✓' : ''}`,
      start: task.dueDate,
      end: task.dueDate,
      extendedProps: {
        description: task.description,
        priority: task.priority,
        status: task.status,
      },
      ...(task.status === 'completed' 
        ? {
            backgroundColor: 'rgb(34 197 94 / 0.2)',
            borderColor: 'rgb(34 197 94)',
            textColor: 'rgb(21 128 61)',
          }
        : getEventColor(task.priority)
      ),
    }));

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Task Calendar</h1>
      
      <div className="bg-transparent dark:bg-gray-800 rounded-lg shadow p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="task-calendar">
            <style>{`
              .task-calendar .fc {
                max-width: 100%;
                background: transparent;
              }
              .task-calendar .fc-theme-standard td,
              .task-calendar .fc-theme-standard th {
                border-color: var(--border-color);
              }
              .task-calendar .fc-theme-standard .fc-scrollgrid {
                border-color: var(--border-color);
              }
              .task-calendar .fc-day-today {
                background: rgb(99 102 241 / 0.1) !important;
              }
              .task-calendar .fc-button-primary {
                background: rgb(99 102 241) !important;
                border-color: rgb(79 82 221) !important;
              }
              .task-calendar .fc-button-primary:disabled {
                background: rgb(99 102 241 / 0.7) !important;
                border-color: rgb(79 82 221 / 0.7) !important;
              }
              .task-calendar .fc-event {
                cursor: pointer;
                padding: 2px 4px;
              }
              .task-calendar .fc-event-title {
                font-weight: 500;
              }
              .task-calendar .fc-event.completed {
                text-decoration: none;
                background: rgb(34 197 94 / 0.2) !important;
                border-color: rgb(34 197 94) !important;
                color: rgb(21 128 61) !important;
              }
              :root {
                --border-color: rgb(229 231 235);
              }
              .dark {
                --border-color: rgb(55 65 81);
              }
              .dark .task-calendar .fc-theme-standard td,
              .dark .task-calendar .fc-theme-standard th {
                border-color: var(--border-color);
              }
              .dark .task-calendar .fc-theme-standard .fc-scrollgrid {
                border-color: var(--border-color);
              }
              .dark .task-calendar .fc-day-today {
                background: rgb(99 102 241 / 0.2) !important;
              }
              .dark .task-calendar .fc-button-primary {
                background: rgb(99 102 241) !important;
                border-color: rgb(79 82 221) !important;
              }
              .dark .task-calendar .fc-button-primary:disabled {
                background: rgb(99 102 241 / 0.7) !important;
                border-color: rgb(79 82 221 / 0.7) !important;
              }
              .dark .fc-day {
                background: transparent;
              }
              .dark .fc-col-header-cell {
                background: rgb(31 41 55 / 0.5);
              }
              .dark .fc-day-today {
                background: rgb(99 102 241 / 0.2) !important;
              }
              .dark .fc {
                color: rgb(243 244 246);
              }
            `}</style>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events}
              eventContent={(eventInfo) => (
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    eventInfo.event.extendedProps.priority === 'high' ? 'bg-red-500' :
                    eventInfo.event.extendedProps.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <span>{eventInfo.event.title}</span>
                </div>
              )}
              eventClick={(info) => {
                alert(`
                  Task: ${info.event.title}
                  Status: ${info.event.extendedProps.status}
                  Priority: ${info.event.extendedProps.priority}
                  Status: ${info.event.extendedProps.status}
                  Description: ${info.event.extendedProps.description}
                `);
              }}
              height="600px"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCalendar;