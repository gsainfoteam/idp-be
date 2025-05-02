import { FastifyRequest } from 'fastify';
import { ExtractJwt } from 'passport-jwt';

const cookieExtractor = (req: FastifyRequest) => {
  if (req && req.cookies && req.cookies['accessToken']) {
    return req.cookies['accessToken'];
  }
  return null;
};

export const accessTokenExtractor = (req: FastifyRequest) => {
  const tokenFromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (tokenFromHeader) {
    return tokenFromHeader;
  }
  return cookieExtractor(req);
};
