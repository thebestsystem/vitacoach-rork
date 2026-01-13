
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Check, RotateCcw, Utensils } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useHealth } from '@/contexts/HealthContext';
import { getBaseUrl } from '@/utils/baseUrl';
import { lightImpact, successFeedback, errorFeedback } from '@/utils/haptics';

interface SnapFoodModalProps {
  visible: boolean;
  onClose: () => void;
}

interface AnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  analysis_summary: string;
}

export default function SnapFoodModal({ visible, onClose }: SnapFoodModalProps) {
  const { addMealLog, updateMetrics, healthMetrics } = useHealth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const resetState = () => {
    setImageUri(null);
    setImageBase64(null);
    setResult(null);
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      };

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
        setResult(null); // Reset previous result if any
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeImage = async () => {
    if (!imageBase64) return;

    setIsAnalyzing(true);
    lightImpact();

    try {
      const response = await fetch(`${getBaseUrl()}/api/analyze-food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setName(data.name);
      setCalories(data.calories.toString());
      setProtein(data.protein.toString());
      setCarbs(data.carbs.toString());
      setFats(data.fats.toString());
      successFeedback();
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', 'Could not analyze the food image. Please try again.');
      errorFeedback();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!name || !calories) {
      Alert.alert('Missing Info', 'Please ensure Name and Calories are filled.');
      return;
    }

    try {
      const caloriesNum = parseFloat(calories) || 0;
      const proteinNum = parseFloat(protein) || 0;
      const carbsNum = parseFloat(carbs) || 0;
      const fatsNum = parseFloat(fats) || 0;

      // 1. Add Meal Log
      await addMealLog({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mealType: 'snack', // Default, could be selectable
        name,
        calories: caloriesNum,
        protein: proteinNum,
        carbs: carbsNum,
        fats: fatsNum,
        notes: 'Logged via Snap & Log',
      });

      // 2. Update Daily Metrics (Calories)
      const currentCalories = healthMetrics?.calories || 0;
      await updateMetrics({
        ...healthMetrics!,
        calories: currentCalories + caloriesNum,
      });

      successFeedback();
      handleClose();
      Alert.alert('Meal Logged', `Added ${caloriesNum} kcal to your daily total.`);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save meal log.');
      errorFeedback();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Snap & Log</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!imageUri ? (
            <View style={styles.placeholderContainer}>
              <View style={styles.iconCircle}>
                <Utensils size={48} color={colors.primary} />
              </View>
              <Text style={styles.instructionText}>
                Take a photo of your meal to automatically estimate calories and macros using AI.
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => pickImage(true)}>
                  <Camera size={24} color="#FFF" />
                  <Text style={styles.buttonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => pickImage(false)}>
                  <Image style={{ width: 24, height: 24, tintColor: colors.primary }} source={{ uri: '' }} />
                  {/* Using Text instead of Image for simplicity if icon is missing, but lucide is better */}
                   <Text style={[styles.buttonText, styles.secondaryButtonText]}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.resultContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />

              {!result && !isAnalyzing && (
                 <View style={styles.analyzeContainer}>
                    <TouchableOpacity style={styles.retakeButton} onPress={() => setImageUri(null)}>
                        <RotateCcw size={20} color={colors.textSecondary} />
                        <Text style={styles.retakeText}>Retake</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
                        <Text style={styles.analyzeButtonText}>Analyze Meal</Text>
                    </TouchableOpacity>
                 </View>
              )}

              {isAnalyzing && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Analyzing your food...</Text>
                </View>
              )}

              {result && (
                <View style={styles.formContainer}>
                    <Text style={styles.summaryText}>{result.analysis_summary}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Meal Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Grilled Chicken Salad"
                        />
                    </View>

                    <View style={styles.macroRow}>
                         <View style={styles.macroInput}>
                            <Text style={styles.label}>Calories</Text>
                            <TextInput
                                style={styles.input}
                                value={calories}
                                onChangeText={setCalories}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                        <View style={styles.macroInput}>
                            <Text style={styles.label}>Protein (g)</Text>
                            <TextInput
                                style={styles.input}
                                value={protein}
                                onChangeText={setProtein}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    </View>

                    <View style={styles.macroRow}>
                         <View style={styles.macroInput}>
                            <Text style={styles.label}>Carbs (g)</Text>
                            <TextInput
                                style={styles.input}
                                value={carbs}
                                onChangeText={setCarbs}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                        <View style={styles.macroInput}>
                            <Text style={styles.label}>Fats (g)</Text>
                            <TextInput
                                style={styles.input}
                                value={fats}
                                onChangeText={setFats}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Check size={20} color="#FFF" />
                        <Text style={styles.saveButtonText}>Log Meal</Text>
                    </TouchableOpacity>

                     <TouchableOpacity style={styles.retakeSmallButton} onPress={resetState}>
                        <Text style={styles.retakeSmallText}>Start Over</Text>
                    </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  resultContainer: {
    width: '100%',
  },
  analyzeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 6,
  },
  retakeText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  formContainer: {
    gap: 16,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 10,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 16,
  },
  macroInput: {
    flex: 1,
    gap: 6,
  },
  saveButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  retakeSmallButton: {
      alignItems: 'center',
      padding: 12,
  },
  retakeSmallText: {
      color: colors.textSecondary,
  }
});
