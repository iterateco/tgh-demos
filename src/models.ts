export interface EmotionalArchetype {
  name: string
  color: number
  order_index: number
}

export interface User {
  id: string
  username: string
}

export interface Post {
  id: string
  user: User
  has_response: boolean
  emotional_archetypes: EmotionalArchetype[]
  total_reactions: number
  expires_at: string
  created_at: string
}
