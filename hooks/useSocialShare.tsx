import { useRef, useCallback, useState } from 'react';
import { Share, Platform, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { selectionFeedback, successFeedback, errorFeedback } from '@/utils/haptics';

export const useSocialShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const viewRef = useRef(null);

  const shareView = useCallback(async () => {
    if (!viewRef.current) return;

    try {
      setIsSharing(true);
      selectionFeedback();

      // Capture the view
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile'
      });

      // Share
      if (Platform.OS === 'web') {
        Alert.alert('Not available', 'Sharing images is not supported on web yet.');
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your achievement',
          UTI: 'public.png'
        });
        successFeedback();
      } else {
        // Fallback to React Native Share
        await Share.share({
            url: uri,
            title: 'My Achievement'
        });
      }

    } catch (error) {
      console.error('Sharing failed:', error);
      errorFeedback();
      Alert.alert('Error', 'Failed to share image.');
    } finally {
      setIsSharing(false);
    }
  }, []);

  return {
    viewRef,
    shareView,
    isSharing
  };
};
