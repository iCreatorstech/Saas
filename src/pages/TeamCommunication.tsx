import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: any;
}

const TeamCommunication: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to messages
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(newMessages.reverse());
      scrollToBottom();
    }, (error) => {
      console.error('Error fetching messages:', error);
      setMessagesError('You do not have permission to view messages.');
    });

    // Subscribe to team members
    const teamQuery = query(
      collection(db, 'team'),
      where('status', '!=', 'inactive')
    );

    const unsubscribeTeam = onSnapshot(teamQuery, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeamMember));
      setTeamMembers(members);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching team members:', error);
      setTeamError('You do not have permission to view team members.');
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTeam();
    };
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.email?.split('@')[0] || 'Anonymous',
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="p-4 h-[calc(100vh-4rem)] flex gap-4">
      {/* Team Members Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Team Members</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center">No team members found</p>
          ) : (
            teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="relative">
                  <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                    member.status === 'online' ? 'bg-green-500' :
                    member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                </div>
              </div>
            ))
          )}
          {teamError && <p className="text-red-500 text-center">{teamError}</p>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === currentUser?.uid
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <div className="text-xs mb-1">
                  {message.senderName}
                </div>
                <p className="break-words">{message.text}</p>
                <div className="text-xs mt-1 opacity-70">
                  {message.timestamp?.toDate().toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          {messagesError && <p className="text-red-500 text-center">{messagesError}</p>}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamCommunication;
