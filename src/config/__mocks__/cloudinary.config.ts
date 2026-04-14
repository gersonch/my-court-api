export const cloudinary = {
  uploader: {
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/mock/image/upload/v1/test.jpg',
    }),
  },
  config: jest.fn(),
}
