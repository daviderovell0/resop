import expressJwt from 'express-jwt';

const authenticate = () =>
  expressJwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] }).unless({
    path: ['/auth/opn/login', '/'],
  });

export default { authenticate };
