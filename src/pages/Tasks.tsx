import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, X, MoreVertical, Calendar } from 'lucide-react';
import { Dialog } from '../components/ui/dialog';

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

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'userId' | 'createdAt'>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: undefined,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      if (editingTask) {
        // Update existing task
        const taskRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(taskRef, {
          ...editingTask,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Add new task
        const taskData = {
          ...newTask,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
          status: 'todo' as const,
        };
        await addDoc(collection(db, 'tasks'), taskData);
      }

      setIsModalOpen(false);
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: undefined,
      });
      await fetchTasks();
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updates);
      setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, ...updates } : task));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, []);

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const TaskColumn = ({ status, title }: { status: Task['status']; title: string }) => {
    const [localStatus, setLocalStatus] = useState<Task['status']>(status);

    return (
      <div className="flex flex-col min-w-[320px] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-4">
          {tasks.filter(task => task.status === status).map(task => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
              {task.dueDate && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="mt-4 flex justify-between items-center">
                <select
                  id={`status-${task.id}`}
                  name={`status-${task.id}`}
                  value={localStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as Task['status'];
                    setLocalStatus(newStatus);
                    if (newStatus !== task.status) {
                      handleUpdateTask(task.id, { status: newStatus });
                    }
                  }}
                  className="text-sm border rounded-md px-2 py-1 bg-transparent dark:border-gray-700"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks & To-Do</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add New Task
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          <TaskColumn status="todo" title="To Do" />
          <TaskColumn status="in-progress" title="In Progress" />
          <TaskColumn status="completed" title="Completed" />
        </div>
      )}

      <Dialog open={isModalOpen || !!editingTask} onClose={() => { setIsModalOpen(false); setEditingTask(null); }}>
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md transform rounded-lg bg-white dark:bg-gray-800 p-6 text-left shadow-xl transition-all">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTask(null);
                }}
                className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="mt-4 space-y-4">
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <Input
                  id="task-title"
                  name="task-title"
                  value={editingTask ? editingTask.title : newTask.title}
                  onChange={(e) => editingTask
                    ? setEditingTask({ ...editingTask, title: e.target.value })
                    : setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="task-description"
                  name="task-description"
                  value={editingTask ? editingTask.description : newTask.description}
                  onChange={(e) => editingTask
                    ? setEditingTask({ ...editingTask, description: e.target.value })
                    : setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm 
                    dark:border-gray-700 dark:bg-gray dark:ring-offset-gray-950 dark:placeholder-gray-400"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    name="task-priority"
                    value={editingTask ? editingTask.priority : newTask.priority}
                    onChange={(e) => editingTask
                      ? setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })
                      : setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })
                    }
                    className="w-full rounded-lg border dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <Input
                    id="task-due-date"
                    name="task-due-date"
                    type="datetime-local"
                    value={editingTask ? editingTask.dueDate : newTask.dueDate}
                    onChange={(e) => editingTask
                      ? setEditingTask({ ...editingTask, dueDate: e.target.value })
                      : setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTask ? 'Save Changes' : 'Add Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Tasks;