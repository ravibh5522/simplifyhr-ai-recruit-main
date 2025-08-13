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
        latencyHint: 'interactive' // Optimize for low latency
      });
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Use smaller buffer size for better real-time performance
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Create a copy to avoid issues with reused buffers
        const audioData = new Float32Array(inputData.length);
        audioData.set(inputData);
        this.onAudioData(audioData);
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

export class VideoRealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private localVideoStream: MediaStream | null = null;

  constructor(
    private onMessage: (message: any) => void,
    private onConnectionStateChange: (state: string) => void
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(ephemeralKey: string, localVideoElement?: HTMLVideoElement) {
    try {
      console.log('Initializing video realtime chat with key:', ephemeralKey?.substring(0, 10) + '...');
      this.onConnectionStateChange('connecting');

      // Get user media with audio only - this avoids video codec issues
      this.localVideoStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (localVideoElement) {
        localVideoElement.srcObject = this.localVideoStream;
      }

      // Create peer connection with minimal configuration for audio-only
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Monitor connection state
      this.pc.onconnectionstatechange = () => {
        console.log('Connection state:', this.pc?.connectionState);
        if (this.pc?.connectionState === 'connected') {
          this.onConnectionStateChange('connected');
        } else {
          this.onConnectionStateChange(this.pc?.connectionState || 'disconnected');
        }
      };

      // Set up remote audio
      this.pc.ontrack = e => {
        console.log('Received remote track:', e.track.kind);
        if (e.track.kind === 'audio') {
          this.audioEl.srcObject = e.streams[0];
        }
      };

      // Add only audio track to avoid video codec issues
      const audioTrack = this.localVideoStream.getAudioTracks()[0];
      if (audioTrack) {
        this.pc.addTrack(audioTrack, this.localVideoStream);
      }

      // Set up data channel for control messages
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event);
        this.onMessage(event);
      });

      this.dc.addEventListener("open", () => {
        console.log("Data channel opened");
        this.onConnectionStateChange('connected');
        // Send session configuration after connection
        this.sendSessionUpdate();
      });

      // Create simple audio-only offer
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API with error handling
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      console.log('Attempting to connect to OpenAI Realtime API...');
      console.log('URL:', `${baseUrl}?model=${model}`);
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          "Authorization": `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
        mode: 'cors'
      }).catch(error => {
        console.error('Fetch error details:', error);
        throw new Error(`Network connection failed: ${error.message}`);
      });

      console.log('OpenAI response status:', sdpResponse.status);

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect to OpenAI: ${await sdpResponse.text()}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established successfully");
      
      // Set connected state after successful WebRTC setup
      this.onConnectionStateChange('connected');

      // Start audio recording for voice input
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: this.encodeAudioData(audioData)
          }));
        }
      });
      await this.recorder.start();

    } catch (error) {
      console.error("Error initializing video chat:", error);
      throw error;
    }
  }

  private sendSessionUpdate() {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        temperature: 0.7,
        max_response_output_tokens: 4000
      }
    };

    console.log('Sending session update:', sessionUpdate);
    this.dc.send(JSON.stringify(sessionUpdate));
  }

  private encodeAudioData(float32Array: Float32Array): string {
    // Apply gentle normalization to prevent clipping
    const normalizedArray = new Float32Array(float32Array.length);
    let maxValue = 0;
    
    // Find the maximum value
    for (let i = 0; i < float32Array.length; i++) {
      const absValue = Math.abs(float32Array[i]);
      if (absValue > maxValue) {
        maxValue = absValue;
      }
    }
    
    // Apply normalization only if needed
    const normalizeRatio = maxValue > 0.95 ? 0.95 / maxValue : 1;
    
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const normalized = float32Array[i] * normalizeRatio;
      const clamped = Math.max(-1, Math.min(1, normalized));
      int16Array[i] = Math.round(clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF);
    }
    
    // Convert to base64 more efficiently
    const uint8Array = new Uint8Array(int16Array.buffer);
    return btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
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

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  getLocalVideoStream(): MediaStream | null {
    return this.localVideoStream;
  }

  disconnect() {
    console.log('Disconnecting video chat...');
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach(track => track.stop());
      this.localVideoStream = null;
    }
  }
}