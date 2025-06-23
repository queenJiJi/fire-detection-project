"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useRef } from "react";

export default function Home() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Turn on the
  const startPredict = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDevice },
      });

      if (videoRef.current) {
        const videoElement = videoRef.current;
        videoElement.srcObject = stream;
        await videoElement.play();
        setIsStreaming(true);
        setIsPolling(true);
        console.log("Streaming started");
      }
    } catch (error) {
      console.error("camera access error:", error);
    }
  };

  // Turn off the webcam
  const stopPredict = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      // 비디오요소가 존재하고, 웹캠이 실행중인지
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setIsPolling(false);
      console.log("Streaming stopped");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <div className="space-y-4 w-full max-w-md">
        <motion.select
          className="w-full border border-gray-700 p-2 rounded-md shadow-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedDevice}
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
            </option>
          ))}
        </motion.select>

        {!isStreaming ? (
          <motion.button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={startPredict}
          >
            Start Stream
          </motion.button>
        ) : (
          <motion.button
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={stopPredict}
          >
            Stop Stream
          </motion.button>
        )}

        <motion.button className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          View Detection Logs
        </motion.button>
      </div>

      <motion.video className="mt-8 w-full max-w-md rounded-lg shadow-lg" />
    </div>
  );
}
