import AsyncStorage from "@react-native-async-storage/async-storage";

export class StorageError extends Error {
  public readonly key: string;
  public readonly cause?: unknown;

  constructor(key: string, message: string, cause?: unknown) {
    super(message);
    this.name = "StorageError";
    this.key = key;
    this.cause = cause;
  }
}

type Serialize<T> = (value: T) => string;
type Deserialize<T> = (value: string) => T;

const defaultSerialize = <T,>(value: T): string => JSON.stringify(value);
const defaultDeserialize = <T,>(value: string): T => JSON.parse(value) as T;

export async function loadFromStorage<T>(
  key: string,
  fallback: T,
  deserialize: Deserialize<T> = defaultDeserialize,
): Promise<T> {
  try {
    const storedValue = await AsyncStorage.getItem(key);

    if (storedValue === null) {
      return fallback;
    }

    return deserialize(storedValue);
  } catch (error) {
    throw new StorageError(
      key,
      `Failed to load persisted data for key \"${key}\"`,
      error,
    );
  }
}

export async function saveToStorage<T>(
  key: string,
  value: T,
  serialize: Serialize<T> = defaultSerialize,
): Promise<void> {
  try {
    const serialized = serialize(value);
    await AsyncStorage.setItem(key, serialized);
  } catch (error) {
    throw new StorageError(
      key,
      `Failed to persist data for key \"${key}\"`,
      error,
    );
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    throw new StorageError(
      key,
      `Failed to remove persisted data for key \"${key}\"`,
      error,
    );
  }
}
