// WebSocket Client Utility
type MessageHandler = (message: any) => void;

interface WebSocketHandlers {
  onMessage?: MessageHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onFriendRequest?: (data: any) => void;
  onFriendRequestAccepted?: (data: any) => void;
  onFriendAdded?: (data: any) => void;
  onNewMessage?: (data: any) => void;
  onNewNotification?: (data: any) => void;
}

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// Set up WebSocket connection with auto-reconnect
export function initializeWebSocket(userId: number, handlers: WebSocketHandlers) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("WebSocket connection established");
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    
    // Send authentication message
    socket.send(JSON.stringify({
      type: 'auth',
      payload: { userId }
    }));
    
    if (handlers.onConnect) {
      handlers.onConnect();
    }
  };
  
  socket.onclose = (event) => {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
    if (handlers.onDisconnect) {
      handlers.onDisconnect();
    }
    
    // Try to reconnect unless this was a clean close
    if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
      reconnectTimer = setTimeout(() => {
        reconnectAttempts++;
        initializeWebSocket(userId, handlers);
      }, RECONNECT_DELAY);
    }
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("WebSocket message received:", message);
      
      // Route message to the appropriate handler based on its type
      if (message.type === 'notification') {
        const notificationType = message.payload?.type;
        
        if (notificationType === 'friend_request' && handlers.onFriendRequest) {
          handlers.onFriendRequest(message.payload);
        } 
        else if (notificationType === 'friend_request_accepted' && handlers.onFriendRequestAccepted) {
          handlers.onFriendRequestAccepted(message.payload);
        } 
        else if (handlers.onNewNotification) {
          handlers.onNewNotification(message.payload);
        }
      }
      else if (message.type === 'message' && handlers.onNewMessage) {
        handlers.onNewMessage(message.payload);
      }
      else if (message.type === 'friend_added' && handlers.onFriendAdded) {
        handlers.onFriendAdded(message.payload);
      }
      
      // General message handler
      if (handlers.onMessage) {
        handlers.onMessage(message);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  // Store the socket instance on the window object so other components can access it
  (window as any).webSocket = socket;
  
  return socket;
}

// Send a message through WebSocket
export function sendWebSocketMessage(type: string, payload: any): boolean {
  const socket = (window as any).webSocket;
  if (!socket) {
    console.error("WebSocket is not initialized");
    return false;
  }
  
  if (socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket is not connected. Current state:", getWebSocketStateString(socket.readyState));
    return false;
  }
  
  socket.send(JSON.stringify({
    type,
    payload
  }));
  
  return true;
}

// Close WebSocket connection
export function closeWebSocket() {
  const socket = (window as any).webSocket;
  if (socket) {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close(1000, "Client disconnected");
    }
    (window as any).webSocket = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

// Check if WebSocket is connected
export function isWebSocketConnected(): boolean {
  const socket = (window as any).webSocket;
  return !!socket && socket.readyState === WebSocket.OPEN;
}

// Helper function to get WebSocket state as string
function getWebSocketStateString(state: number): string {
  switch (state) {
    case WebSocket.CONNECTING:
      return "CONNECTING";
    case WebSocket.OPEN:
      return "OPEN";
    case WebSocket.CLOSING:
      return "CLOSING";
    case WebSocket.CLOSED:
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
}