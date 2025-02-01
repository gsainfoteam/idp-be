# Prisma Module

데이터베이스를 조작하기 위한 ORM, prisma를 nestjs의 module화 시킨 module입니다.  
  
## Environment

사용되는 package들은 다음과 같습니다.

- @nestjs/common
- @nestjs/config
- @prisma/client

dev-package들은 다음과 같습니다.

- prisma

이용하기 위해서 필요한 설정 변수는 다음과 같습니다.  

``` env
    DATABASE_URL=postgresql://janedoe:mypassword@localhost:5432/mydb
```

## Function

기능은 다음과 같습니다.

- 모듈이 켜질때, 데이터베이스에 연결함.
- 모듈이 꺼질떄, 데이터베이스에 연결을 해제함.
