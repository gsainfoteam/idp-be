import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-anonymous';

@Injectable()
export class AnonymousStrategy extends PassportStrategy(Strategy, 'anonymous') {
  validate(req: any, payload: any, done: (err: any, user: any) => void) {
    done(null, true);
  }
}
