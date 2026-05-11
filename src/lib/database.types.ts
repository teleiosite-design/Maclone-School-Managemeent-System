export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'teacher' | 'student' | 'parent'
          full_name: string
          email: string
          photo_url: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'teacher' | 'student' | 'parent'
          full_name: string
          email: string
          photo_url?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'teacher' | 'student' | 'parent'
          full_name?: string
          email?: string
          photo_url?: string | null
          phone?: string | null
        }
      }
      students: {
        Row: {
          id: string
          profile_id: string
          class: string
          admission_no: string
          guardian_id: string | null
          status: 'active' | 'inactive' | 'graduated'
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          class: string
          admission_no: string
          guardian_id?: string | null
          status?: 'active' | 'inactive' | 'graduated'
          created_at?: string
        }
        Update: {
          profile_id?: string
          class?: string
          admission_no?: string
          guardian_id?: string | null
          status?: 'active' | 'inactive' | 'graduated'
        }
      }
      teachers: {
        Row: {
          id: string
          profile_id: string
          employee_id: string
          department: string | null
          subjects: string[]
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          employee_id: string
          department?: string | null
          subjects?: string[]
          created_at?: string
        }
        Update: {
          profile_id?: string
          employee_id?: string
          department?: string | null
          subjects?: string[]
        }
      }
      parents: {
        Row: {
          id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          created_at?: string
        }
        Update: {
          profile_id?: string
        }
      }
      children: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
      }
      attendance_logs: {
        Row: {
          id: string
          teacher_id: string
          check_in: string
          check_out: string | null
          date: string
          status: 'present' | 'late' | 'absent'
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          check_in: string
          check_out?: string | null
          date: string
          status?: 'present' | 'late' | 'absent'
          created_at?: string
        }
        Update: {
          check_out?: string | null
          status?: 'present' | 'late' | 'absent'
        }
      }
      student_attendance: {
        Row: {
          id: string
          student_id: string
          class: string
          date: string
          present: boolean
          marked_by: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          class: string
          date: string
          present: boolean
          marked_by: string
          created_at?: string
        }
        Update: {
          present?: boolean
          marked_by?: string
        }
      }
      timetable_slots: {
        Row: {
          id: string
          day: string
          time_slot: string
          class: string
          subject: string
          teacher_id: string | null
          room: string | null
          created_at: string
        }
        Insert: {
          id?: string
          day: string
          time_slot: string
          class: string
          subject: string
          teacher_id?: string | null
          room?: string | null
          created_at?: string
        }
        Update: {
          day?: string
          time_slot?: string
          class?: string
          subject?: string
          teacher_id?: string | null
          room?: string | null
        }
      }
      fee_records: {
        Row: {
          id: string
          student_id: string
          amount: number
          term: string
          session: string
          type: string
          status: 'paid' | 'pending' | 'overdue'
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          amount: number
          term: string
          session: string
          type: string
          status?: 'paid' | 'pending' | 'overdue'
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'paid' | 'pending' | 'overdue'
          paid_at?: string | null
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          audience: ('admin' | 'teacher' | 'student' | 'parent')[]
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          audience: ('admin' | 'teacher' | 'student' | 'parent')[]
          created_by: string
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
          audience?: ('admin' | 'teacher' | 'student' | 'parent')[]
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          class: string
          subject: string
          due_date: string
          teacher_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          class: string
          subject: string
          due_date: string
          teacher_id: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          class?: string
          subject?: string
          due_date?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Teacher = Database['public']['Tables']['teachers']['Row']
export type Parent = Database['public']['Tables']['parents']['Row']
export type AttendanceLog = Database['public']['Tables']['attendance_logs']['Row']
export type StudentAttendance = Database['public']['Tables']['student_attendance']['Row']
export type TimetableSlot = Database['public']['Tables']['timetable_slots']['Row']
export type FeeRecord = Database['public']['Tables']['fee_records']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
