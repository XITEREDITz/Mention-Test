import { create } from 'zustand';
import { initializeWebSocket, closeWebSocket } from './websocket-client';

interface WebSocketStore {
  socket: WebSocket | null;
  isConnected: boolean;
  unreadMessages: number;
  unreadNotifications: number;
  connect: (userId: number) => void;
  disconnect: () => void;
  incrementMessageCount: () => void;
  incrementNotificationCount: () => void;
  resetMessageCount: () => void;
  resetNotificationCount: () => void;
  setMessageCount: (count: number) => void;
  setNotificationCount: (count: number) => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  unreadMessages: 0,
  unreadNotifications: 0,
  
  connect: (userId: number) => {
    if (get().socket) {
      get().disconnect();
    }
    
    const socket = initializeWebSocket(userId, {
      onConnect: () => {
        set({ isConnected: true });
      },
      
      onDisconnect: () => {
        set({ isConnected: false });
      },
      
      onMessage: (message) => {
        try {
          switch (message.type) {
            case 'init':
              set({
                unreadMessages: message.payload.unreadMessages,
                unreadNotifications: message.payload.unreadNotifications
              });
              break;
              
            case 'notification':
              get().incrementNotificationCount();
              break;
              
            case 'message':
              get().incrementMessageCount();
              break;
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      }
    });
    
    set({ socket });
  },
  
  disconnect: () => {
    closeWebSocket();
    set({ socket: null, isConnected: false });
  },
  
  incrementMessageCount: () => {
    set(state => ({ unreadMessages: state.unreadMessages + 1 }));
  },
  
  incrementNotificationCount: () => {
    set(state => ({ unreadNotifications: state.unreadNotifications + 1 }));
  },
  
  resetMessageCount: () => {
    set({ unreadMessages: 0 });
  },
  
  resetNotificationCount: () => {
    set({ unreadNotifications: 0 });
  },
  
  setMessageCount: (count: number) => {
    set({ unreadMessages: count });
  },
  
  setNotificationCount: (count: number) => {
    set({ unreadNotifications: count });
  }
}));
