
export interface User {
  email: string;
  name: string;
  avatar?: string;
  role: string;
  friends?: string[];
  twoFactorEnabled?: boolean;
}

export interface AgendaItem {
  id: string;
  topic: string;
  duration: string;
  completed: boolean;
}

export interface Task {
  id: string;
  description: string;
  assignee: string;
  status: 'pending' | 'done';
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  participants: string[];
  status: 'scheduled' | 'active' | 'completed';
  agenda: AgendaItem[];
  notes: string;
  tasks: Task[];
}

export interface Invitation {
  id: string;
  meetingId: string;
  meetingTitle: string;
  fromName: string;
  toEmail: string;
  timestamp: number;
}

export interface FriendRequest {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
}
