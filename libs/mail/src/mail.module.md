# Mail Module

node mailer를 사용하여 특정한 이메일 주소에 메일을 보내기 위한 module입니다.

## Environment

사용되는 package들은 다음과 같습니다.

- @nestjs/common
- @nestjs/config
- nodemailer

이용하기 위해서 필요한 설정 변수는 다음과 같습니다.

``` env
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=465
  EMAIL_USER=webmaster@gistory.me
  EMAIL_SERVICE_CLIENT=111704434411515292770
  EMAIL_PRIVATE_KEY= ****
  EMAIL_ACCESS_URL=https://oauth2.googleapis.com/token
```

## Function

기능은 다음과 같습니다.

- 특정인에게 메일을 보냅니다.
