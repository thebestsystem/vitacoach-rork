export interface Friend {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
  acceptedAt?: string;
}

export interface CircleMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: string;
  role: 'owner' | 'member';
  stats: {
    currentStreak: number;
    totalWorkouts: number;
    totalCheckIns: number;
    weeklyGoalProgress: number;
  };
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  ownerId: string;
  members: CircleMember[];
  invitedEmails: string[];
  createdAt: string;
  updatedAt: string;
  settings: {
    isPrivate: boolean;
    allowMemberInvites: boolean;
    shareWorkouts: boolean;
    shareMeals: boolean;
    shareCheckIns: boolean;
  };
}

export interface ProgressUpdate {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  circleId: string;
  type: 'workout' | 'meal' | 'checkIn' | 'milestone' | 'reflection';
  content: string;
  data?: any;
  timestamp: string;
  reactions: {
    userId: string;
    userName: string;
    emoji: string;
  }[];
  comments: {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    timestamp: string;
  }[];
}

export interface Challenge {
  id: string;
  circleId: string;
  title: string;
  description: string;
  type: 'steps' | 'workouts' | 'checkIns' | 'custom';
  goal: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  participants: {
    userId: string;
    userName: string;
    progress: number;
    completedAt?: string;
  }[];
}

export interface Encouragement {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  type: 'cheer' | 'support' | 'advice';
  timestamp: string;
  read: boolean;
}
