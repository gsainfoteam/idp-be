# User Module

user의 생성과 삭제를 담당하는 module입니다.  
이 module은 오직 user만 관여되어 있으며, client의 개입은 전혀 없습니다.

## Flow

user를 삭제하는 api를 제외한 다른 api들은 user의 email이 gist의 메일이 맞는지, 또한 user가 해당 메일의 주인이 맞는지 확인하는 과정을 거치므로 여러 단계를 거치게 됩니다.

```mermaid
sequenceDiagram
participant IdP FE (User)
participant IdP

IdP FE (User) ->>+ IdP: POST /cert/code
note right of IdP: send certification code to gist email and store it in redis
IdP ->>- IdP FE (User): void

IdP FE (User) ->>+ IdP: POST /cert/validate
note right of IdP: validate email certification code through redis
IdP ->>- IdP FE (User): certification Jwt

alt register user
  IdP FE (User) ->>+ IdP: POST /register
  note right of IdP: validate Jwt and register the user
else change password
  IdP FE (User) ->>+ IdP: PATCH /password
  note right of IdP: validate Jwt and change the user's password
end
```

## Environment

해당 module에서 필요한 환경변수는 아래와 같습니다.

``` environment
CERTIFICATION_JWT_SECRET=example-secret
CERTIFICATION_JWT_EXPIRE=3600
```
