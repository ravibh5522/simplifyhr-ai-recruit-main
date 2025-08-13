export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class WebSocketRealtimeChat {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder | null = null;
  private localVideoStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;

  constructor(
    private onMessage: (message: any) => void,
    private onConnectionStateChange: (state: string) => void
  ) {}

  async init(interviewId: string, localVideoElement?: HTMLVideoElement) {
    try {
      console.log('Initializing WebSocket realtime chat...');
      this.onConnectionStateChange('connecting');

      // Initialize audio context
      this.audioContext = new AudioContext();

      // Get user media for video
      this.localVideoStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true
      });

      if (localVideoElement) {
        localVideoElement.srcObject = this.localVideoStream;
      }

      // Connect to our edge function via WebSocket  
      // Use the correct Supabase edge function WebSocket URL format
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//nwohehoountzfudzygqg.functions.supabase.co/realtime-chat?interviewId=${interviewId}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.onConnectionStateChange('connected');
        this.startAudioRecording();
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data.type);
          
          if (data.type === 'response.audio.delta') {
            // Handle audio data
            await this.playAudioDelta(data.delta);
          }
          
          this.onMessage(data);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket readyState:', this.ws?.readyState);
        this.onConnectionStateChange('disconnected');
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        this.onConnectionStateChange('disconnected');
      };

    } catch (error) {
      console.error("Error initializing WebSocket chat:", error);
      this.onConnectionStateChange('disconnected');
      throw error;
    }
  }

  private async startAudioRecording() {
    this.recorder = new AudioRecorder((audioData) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: this.encodeAudioData(audioData)
        }));
      }
    });
    
    try {
      await this.recorder.start();
      console.log('Audio recording started');
    } catch (error) {
      console.error('Failed to start audio recording:', error);
    }
  }

  private async playAudioDelta(base64Audio: string) {
    try {
      // Convert base64 to audio buffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to audio buffer
      const audioBuffer = await this.createAudioBufferFromPCM16(bytes);
      this.audioQueue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playNextAudioInQueue();
      }
    } catch (error) {
      console.error('Error playing audio delta:', error);
    }
  }

  private async createAudioBufferFromPCM16(pcmData: Uint8Array): Promise<AudioBuffer> {
    const sampleRate = 24000;
    const channelCount = 1;
    const frameCount = pcmData.length / 2; // 16-bit = 2 bytes per sample

    const audioBuffer = this.audioContext!.createBuffer(channelCount, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Convert 16-bit PCM to float32
    for (let i = 0; i < frameCount; i++) {
      const int16 = (pcmData[i * 2 + 1] << 8) | pcmData[i * 2];
      channelData[i] = int16 / (int16 < 0 ? 32768 : 32767);
    }

    return audioBuffer;
  }

  private async playNextAudioInQueue() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift()!;

    try {
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext!.destination);
      
      source.onended = () => {
        this.playNextAudioInQueue();
      };
      
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNextAudioInQueue(); // Continue with next
    }
  }

  private encodeAudioData(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  async sendMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not ready');
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(event));
    this.ws.send(JSON.stringify({type: 'response.create'}));
  }

  getLocalVideoStream(): MediaStream | null {
    return this.localVideoStream;
  }

  disconnect() {
    console.log('Disconnecting WebSocket chat...');
    this.recorder?.stop();
    this.ws?.close();
    
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach(track => track.stop());
      this.localVideoStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}