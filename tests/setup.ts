// Mock react-native
import { mock } from "bun:test";

// Global mocks
global.__DEV__ = true;

mock.module("react-native", () => ({
  View: () => null,
  Text: () => null,
  Image: () => null,
  StyleSheet: {
    create: (obj) => obj,
    absoluteFillObject: {},
  },
  Platform: {
    OS: "ios",
    select: (obj) => obj.ios,
  },
  TouchableOpacity: () => null,
  KeyboardAvoidingView: () => null,
  ScrollView: () => null,
  TextInput: () => null,
  ActivityIndicator: () => null,
  Alert: {
    alert: mock(),
  },
  Modal: () => null,
  AppState: {
    addEventListener: mock(() => ({ remove: mock() })),
  },
}));

mock.module("expo-router", () => ({
  useRouter: () => ({
    push: mock(),
    back: mock(),
  }),
  Stack: {
    Screen: () => null,
  },
}));

mock.module("expo-blur", () => ({
  BlurView: () => null,
}));

mock.module("@/config/firebase", () => ({
    db: {},
}));

mock.module("firebase/firestore", () => ({
    collection: mock(() => ({})),
    doc: mock(() => ({})),
    setDoc: mock(() => Promise.resolve()),
    getDoc: mock(() => Promise.resolve({ exists: () => false })),
    updateDoc: mock(() => Promise.resolve()),
    query: mock(() => ({})),
    where: mock(() => ({})),
    getDocs: mock(() => Promise.resolve({ docs: [], empty: true })),
    addDoc: mock(() => Promise.resolve({ id: 'new-id' })),
    orderBy: mock(() => ({})),
    limit: mock(() => ({})),
    arrayUnion: mock(() => ({})),
}));

mock.module("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: mock(() => Promise.resolve(null)),
    setItem: mock(() => Promise.resolve()),
    removeItem: mock(() => Promise.resolve()),
  },
}));

// Mock react-native-safe-area-context
mock.module("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }) => children,
}));

// Mock lucide-react-native
mock.module("lucide-react-native", () => ({
  ChevronLeft: () => null,
  Plus: () => null,
  Trash2: () => null,
  CheckCircle: () => null,
  Circle: () => null,
  Archive: () => null,
  Brain: () => null,
  Calendar: () => null,
  ArrowUpRight: () => null,
  Target: () => null,
  ChevronRight: () => null,
  Sparkles: () => null,
  Send: () => null,
  X: () => null,
  Check: () => null,
  Star: () => null,
  TrendingUp: () => null,
  Zap: () => null,
}));

mock.module("expo-linear-gradient", () => ({
  LinearGradient: () => null,
}));

mock.module("expo-haptics", () => ({
  selectionAsync: mock(),
  notificationAsync: mock(),
  impactAsync: mock(),
  NotificationFeedbackType: { Success: 'success' },
}));
