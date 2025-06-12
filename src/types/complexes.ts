export interface Complex extends Document {
  name: string
  description: string
  createdAt?: Date
  updatedAt?: Date
  image_url?: string[]
  city?: string
  country?: string
  address?: string
  owner: string
} // Assuming owner is a string representing the admin's ID}
