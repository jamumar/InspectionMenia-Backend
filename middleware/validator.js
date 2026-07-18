// Request Input Validator Middleware

export const validateReport = (req, res, next) => {
  const { name, address } = req.body;
  if (!name || name.trim() === '') {
    res.status(400);
    throw new Error('Report name is required');
  }
  if (!address || address.trim() === '') {
    res.status(400);
    throw new Error('Report address is required');
  }
  next();
};

export const validateChatMessage = (req, res, next) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    res.status(400);
    throw new Error('Message content is required');
  }
  next();
};
