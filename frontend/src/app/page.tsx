"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get the list of available video input devices (webcams) and set the default device as default
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };
    getDevices();
  }, []);

  // Capture video frame and convert to Image
  const captureFrame = async (
    videoElement: HTMLVideoElement
  ): Promise<Blob | null> => {
    try {
      if (!videoElement.videoWidth || !videoElement.videoHeight) {
        console.log("Video element not ready");
        return null;
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return null;

      context.drawImage(videoElement, 0, 0);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || null);
        }, "image/jpeg");
      });
    } catch (error) {
      console.error("Error capturing frame:", error);
      return null;
    }
  };

  // Send the captured frame to the server for processing
  const sendFrameToServer = async () => {
    try {
      if (!videoRef.current || !isStreaming) {
        console.log("Video element not ready or not streaming");
        return null;
      }

      const blob = await captureFrame(videoRef.current);
      if (!blob) {
        console.log("No frame captured");
        return null;
      }

      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");

      console.log("Sending frame to server...");

      const response = await fetch("https://localhost:8000/predict_fire", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("server response:", data);
      return data;
    } catch (error) {
      console.error("Error sending frame to server:", error);
      return null;
    }
  };

  // Poll the server for predictions at regular intervals by using Tanstack Query
  const { data: predictionData, refetch } = useQuery({
    queryKey: ["firePrediction"],
    queryFn: sendFrameToServer,
    enabled: isPolling && isStreaming, // Only poll when streaming and polling is active
    refetchInterval: 5000, // Poll every 5 seconds
    retry: false, // Disable automatic retries
  });

  // Turn on the webcam
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
