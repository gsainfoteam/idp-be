# Redis Module

redis를 조작하기 위해서 만들어진 module입니다.

## Environment

사용되는 package들은 다음과 같습니다.

- @nestjs/common
- @nestjs/config
- @nestjs/terminus
- ioredis

이용하기 위해서 필요한 설정 변수는 다음과 같습니다.

``` env
  REDIS_URL=redis://localhost:6379
```

## Function

기능은 다음과 같습니다.

- key-value를 redis에 등록합니다.
- key를 이용해서 value를 redis에서 가져옵니다.
- key에 해당하는 value를 삭제합니다.
- module이 끝날 때, redis와의 연결을 끊습니다.
