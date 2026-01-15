// Mock react-native
import { mock } from "bun:test";

mock.module("react-native", () => ({
  View: () => null,
  Text: () => null,
  StyleSheet: {
    create: (obj) => obj,
  },
  Platform: {
    OS: "ios",
    select: (obj) => obj.ios,
  },
  TouchableOpacity: () => null,
}));

mock.module("expo-router", () => ({
  useRouter: () => ({
    push: mock(),
    back: mock(),
  }),
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
    getDocs: mock(() => Promise.resolve({ docs: [] })),
    addDoc: mock(() => Promise.resolve({ id: 'new-id' })),
    orderBy: mock(() => ({})),
    limit: mock(() => ({})),
    arrayUnion: mock(() => ({})),
}));
