export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          discord_username: string | null
          discord_id: string | null
          avatar_url: string | null
          email: string | null
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          discord_username?: string | null
          discord_id?: string | null
          avatar_url?: string | null
          email?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discord_username?: string | null
          discord_id?: string | null
          avatar_url?: string | null
          email?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          long_description: string | null
          date: string | null
          end_date: string | null
          location: string | null
          max_attendees: number | null
          is_active: boolean
          banner_image_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          long_description?: string | null
          date?: string | null
          end_date?: string | null
          location?: string | null
          max_attendees?: number | null
          is_active?: boolean
          banner_image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          long_description?: string | null
          date?: string | null
          end_date?: string | null
          location?: string | null
          max_attendees?: number | null
          is_active?: boolean
          banner_image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          event_id: string
          question_text: string
          question_type: string
          options: any | null
          is_required: boolean
          order_index: number
          placeholder: string | null
          helper_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          question_text: string
          question_type?: string
          options?: any | null
          is_required?: boolean
          order_index: number
          placeholder?: string | null
          helper_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          question_text?: string
          question_type?: string
          options?: any | null
          is_required?: boolean
          order_index?: number
          placeholder?: string | null
          helper_text?: string | null
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          event_id: string
          status: string
          applied_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          notes: string | null
          invite_code: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          status?: string
          applied_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          notes?: string | null
          invite_code?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          status?: string
          applied_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          notes?: string | null
          invite_code?: string | null
        }
      }
      answers: {
        Row: {
          id: string
          attendance_id: string
          question_id: string
          answer_text: string
          created_at: string
        }
        Insert: {
          id?: string
          attendance_id: string
          question_id: string
          answer_text: string
          created_at?: string
        }
        Update: {
          id?: string
          attendance_id?: string
          question_id?: string
          answer_text?: string
          created_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          code: string
          name: string
          max_uses: number
          used_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          max_uses?: number
          used_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          max_uses?: number
          used_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']

export interface QuestionWithAnswer extends Question {
  answer?: string
}

export interface EventWithDetails extends Event {
  questions?: Question[]
  attendance_count?: number
  user_attendance?: Attendance | null
}

export interface AttendanceWithEvent extends Attendance {
  event?: Event
}

export interface AttendanceWithAnswers extends Attendance {
  answers?: Answer[]
  event?: Event
}

