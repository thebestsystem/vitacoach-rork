import { useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

export interface VoiceRecorderState {
  isRecording: boolean;
  recordingUri: string | null;
  durationMillis: number;
  metering: number; // For visualization
}

export function useVoiceRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    recordingUri: null,
    durationMillis: 0,
    metering: -160,
  });
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = useCallback(async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const result = await requestPermission();
        if (!result.granted) {
            Alert.alert("Permission refusée", "L'accès au micro est nécessaire pour la dictée vocale.");
            return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true, // Useful for long thoughts
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
            setState(prev => ({
                ...prev,
                durationMillis: status.durationMillis,
                metering: status.metering || -160
            }));
        },
        100 // Update interval
      );

      setRecording(newRecording);
      setState(prev => ({ ...prev, isRecording: true, recordingUri: null, durationMillis: 0 }));
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Erreur', "Impossible de démarrer l'enregistrement.");
    }
  }, [permissionResponse, requestPermission]);

  const stopRecording = useCallback(async () => {
    if (!recording) return null;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setState(prev => ({ ...prev, isRecording: false, recordingUri: uri }));

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true, // Keep audio playback working
      });

      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
      return null;
    }
  }, [recording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    hasPermission: permissionResponse?.status === 'granted',
  };
}
