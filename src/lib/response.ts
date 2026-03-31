export const responseMsg = (message: string, data?: any) => {
  if (data) {
    return {
      message,
      ...data,
    };
  }
  return { message };
};
