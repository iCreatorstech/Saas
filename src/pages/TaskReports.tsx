import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Colors
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Clock, CheckCircle, AlertTriangle, BarChart2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dueDate?: string;
  statusHistory?: {
    status: 'todo' | 'in-progress' | 'completed';
    timestamp: string;
  }[];
}

const TaskReports = () => {
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

  const getTaskStatusData = () => {
    const statusCounts = {
      todo: tasks.filter(task => task.status === 'todo').length,
      'in-progress': tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
    };

    return {
      labels: ['To Do', 'In Progress', 'Completed'],
      datasets: [
        {
          data: [statusCounts.todo, statusCounts['in-progress'], statusCounts.completed],
          backgroundColor: ['#f97316', '#3b82f6', '#22c55e'],
        },
      ],
    };
  };

  const getTaskPriorityData = () => {
    const priorityCounts = {
      high: tasks.filter(task => task.priority === 'high').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      low: tasks.filter(task => task.priority === 'low').length,
    };

    return {
      labels: ['High', 'Medium', 'Low'],
      datasets: [
        {
          data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        },
      ],
    };
  };

  const getTaskCompletionTrend = () => {
    // Get dates for last 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); // Count forward from 7 days ago
      return d;
    });

    // Format dates for labels
    const labels = dates.map(date => format(date, 'MMM dd'));

    // Count completed tasks for each day
    const completedByDay = dates.map(date => {
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      return tasks.filter(task => {
        const completionEntry = task.statusHistory?.find(h => h.status === 'completed');
        if (!completionEntry) return false;

        const completionDate = parseISO(completionEntry.timestamp);
        return completionDate >= dayStart && completionDate <= dayEnd;
      }).length;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Tasks Completed',
          data: completedByDay,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const getAverageCompletionTime = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed' && task.statusHistory);
    if (completedTasks.length === 0) return 0;

    const totalDays = completedTasks.reduce((acc, task) => {
      const startDate = parseISO(task.createdAt);
      const completedDate = parseISO(
        task.statusHistory?.find(h => h.status === 'completed')?.timestamp || task.createdAt
      );
      return acc + differenceInDays(completedDate, startDate);
    }, 0);

    return Math.round(totalDays / completedTasks.length);
  };

  const getTaskStateChanges = () => {
    const totalChanges = tasks.reduce((acc, task) => {
      // Count transitions between different states
      const transitions = task.statusHistory?.reduce((changes, current, index, array) => {
        if (index === 0) return 0; // Skip first entry as it's the initial state
        // Count as change if current status is different from previous
        return changes + (current.status !== array[index - 1].status ? 1 : 0);
      }, 0) || 0;
      return acc + transitions;
    }, 0);

    return totalChanges;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Task Reports</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart2 className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Tasks</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{tasks.length}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Completed</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Avg. Time</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {getAverageCompletionTime()} days
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">State Changes</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{getTaskStateChanges()}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Task Status Distribution</h3>
              <div className="h-[300px] flex items-center justify-center">
                <Pie
                  data={getTaskStatusData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Task Priority Distribution</h3>
              <div className="h-[300px] flex items-center justify-center">
                <Pie
                  data={getTaskPriorityData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Task Completion Trend</h3>
              <div className="h-[300px]">
                <Line
                  data={getTaskCompletionTrend()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        min: 0,
                        ticks: {
                          stepSize: 1,
                          precision: 0,
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
                        },
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
                        },
                      },
                      x: {
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
                        },
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: true,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
                        },
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                          title: (context) => `Tasks completed on ${context[0].label}`,
                          label: (context) => `${context.parsed.y} tasks`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskReports;