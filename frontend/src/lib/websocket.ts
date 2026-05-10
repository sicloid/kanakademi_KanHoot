export type WebSocketMessage = {
  type: string;
  data?: any;
};

export class WSClient {
  private socket: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('Connected to', this.url);
      this.emit('open', null);
    };

    this.socket.onmessage = (event) => {
      try {
        const msg: WebSocketMessage = JSON.parse(event.data);
        this.emit(msg.type, msg.data);
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    };

    this.socket.onclose = () => {
      console.log('Disconnected from', this.url);
      this.emit('close', null);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
      this.emit('error', error);
    };
  }

  on(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback);
  }

  off(type: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      this.listeners.set(type, callbacks.filter(cb => cb !== callback));
    }
  }

  emit(type: string, data: any) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  send(type: string, data?: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    } else {
      console.warn('Socket not open, cannot send message');
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
