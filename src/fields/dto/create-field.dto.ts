export class CreateFieldDto {
  name: string
  type: string
  complexId?: string // Optional, as it may not always be associated with a complex
}
