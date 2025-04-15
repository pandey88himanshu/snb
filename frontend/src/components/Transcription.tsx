import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { useRef, useState } from "react";
import { FaMicrophone } from "react-icons/fa";

const Transcription = ({ setText }: { setText: any }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const deepgramRef = useRef<any>(null);
  const keepAliveRef = useRef<any>(null);

  const deepgramClient = createClient(
    "929545c8bc91d4cc4702488e7073de6de22986e9"
  );

  const startTranscription = async () => {
    try {
      // Request audio access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Create Deepgram connection
      const deepgram = deepgramClient.listen.live({
        language: "en-IN",
        punctuate: true,
        model: "nova-2",
        endpointing: 1000,
      });
      deepgramRef.current = deepgram;

      deepgram.addListener("error", (event: any) => {
        console.log("Error in STT connection establishment!", event);
      });

      // Set up keepalive interval
      keepAliveRef.current = setInterval(() => {
        console.log("deepgram: keepalive");
        deepgram.keepAlive();
      }, 10 * 1000);

      // When connection opens, start sending audio chunks
      deepgram.addListener(LiveTranscriptionEvents.Open, () => {
        mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) {
            deepgram.send(event.data);
          }
        });
        mediaRecorder.start(250);
        console.log("deepgram: connected");
      });

      // Handle transcription events
      deepgram.addListener(LiveTranscriptionEvents.Transcript, (data: any) => {
        handleRecognizing(data);
      });

      // Optionally, you can also handle metadata
      deepgram.addListener(LiveTranscriptionEvents.Metadata, (data: any) => {
        console.log("deepgram: metadata received", data);
        // You can process metadata if needed
      });

      // Listen for connection close
      deepgram.addListener(LiveTranscriptionEvents.Close, () => {
        console.log("deepgram: disconnected");
        clearInterval(keepAliveRef.current);
        deepgram.finish();
        setIsRecording(false);
      });

      // Error and warning handlers
      deepgram.addListener(LiveTranscriptionEvents.Error, (error: any) => {
        console.error("deepgram: error received", error);
      });
      deepgram.addListener(LiveTranscriptionEvents.Warning, (warning: any) => {
        console.warn("deepgram: warning received", warning);
      });

      setIsRecording(true);
    } catch (error) {
      console.error("Error starting transcription:", error);
    }
  };

  // Stops the media recorder and the Deepgram connection
  const stopTranscription = () => {
    try {
      const mediaRecorder = mediaRecorderRef.current;
      const deepgram = deepgramRef.current;

      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        console.log("MediaRecorder stopped.");
      }

      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        console.log("KeepAlive interval cleared.");
      }

      if (deepgram) {
        deepgram.finish();
        console.log("Deepgram connection closed.");
      }

      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping transcription:", error);
    }
  };

  // Processes the incoming transcription data
  const handleRecognizing = (data: any) => {
    const text = data?.channel?.alternatives?.[0]?.transcript;
    if (data?.is_final) {
      handleRecognized(text);
      // Automatically stop the connection after a final transcript
      stopTranscription();
    } else {
      console.log("Recognizing...", text);
    }
  };

  // Update your state with the recognized text
  const handleRecognized = (text: any) => {
    console.log("Recognized...", text);
    if (text && typeof text === "string") {
      setText(text);
    }
  };

  // Toggle connection on microphone click
  const handleClick = () => {
    if (isRecording) {
      stopTranscription();
    } else {
      startTranscription();
    }
  };

  return (
    <div
      className={`${isRecording ? "text-blue-500" : "text-gray-500"} text-2xl`}>
      <FaMicrophone onClick={handleClick} />
    </div>
  );
};

export default Transcription;
