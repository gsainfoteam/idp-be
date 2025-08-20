<p align="center">
  <a href="https://introduce.gistory.me/" target="blank"><img src="assets/Infoteam.png" alt="Infoteam Logo" /></a>
</p>

# Infoteam IdP

## Purpose

GIST 학생들의 계정을 한 곳에서 관리하여 GIST구성원들이 사용할 수 있는 여러 서비스에 쉽게 로그인을 할 수 있도록 하는 Id Provider Server를 만드는 것이 InfoTeam IdP의 목적입니다.

## Caution

본 서비스는 [GIST](https://www.gist.ac.kr/kr/main.html)구성원을 대상으로 하는 서비스이므로, gist구성원에게 기본적으로 지급되는 @gist.ac.kr 혹은 @gm.gist.ac.kr이메일이 필수적으로 있어야지 로그인이 가능합니다.

## Explanation

### Oauth2.1

본 서비스는 Oauth2.1 프로토콜을 이용해서 구현을 하였습니다. 따라서 본 서비스 로직의 더 자세한 정보를 알고 싶다면, 아래 문서를 참고하시기 바랍니다.  
[Oauth2.1](https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-12.html)  
[Open id connect](https://openid.net/specs/openid-connect-core-1_0.html)

### 명칭 정리

본 서비스를 사용하는 주체는 크게 두 가지가 있습니다. 하나는 user, 다른 하나는 client입니다.  
  
user는 infoteam-idp에서 gist mail을 인증하고, 관련된 정보를 제공하여 infoteam-idp를 사용하는 다른 서비스를 사용하려는 사람입니다.  
  
client는 infoteam-idp를 사용하여, user의 정보를 받고, 그에 맞추어서 서비스를 제공하는 어플리케이션입니다.

### 로그인 과정

- Authorization Code Flow

```mermaid
sequenceDiagram
participant IdPFe as IdP FrontEnd
participant ClientFe as Client Frontend
participant Client
participant IdP

critical Requesting Login
  ClientFe ->> Client: Request IdP Login
  Client ->> ClientFe: REDIRECT idp.gistory.me/authorize
  ClientFe ->> IdPFe: 
end

IdPFe ->> IdPFe: login or sign up

IdPFe ->>+ IdP: client_id, code_challenge, code_challenge_method, redirect_uri, scope, "IdP jwt user token"
note right of IdP: GET /oauth/authorize
IdP ->>- ClientFe: REDIRECT <client url>?code=code

ClientFe ->> IdP: client_id, code, code_verifier
note right of IdP: POST /oauth/token

alt client doesn't use id token
  IdP ->> ClientFe: access token, refresh token, id token
  ClientFe ->>+ Client: access token, refresh token, id token
  Client ->> Client: service logic with id token
  Client ->>- ClientFe: 
else  
  IdP ->> ClientFe: access token, refresh token
  ClientFe ->>+ Client: access token, refresh token
  Client ->>+ IdP: access token
  note right of IdP: POST /oauth/userinfo
  IdP ->>- Client: user's information
  Client ->> ClientFe: 
end

```

- Refresh Token Grant

```mermaid
sequenceDiagram
participant ClientFe as Client Frontend
participant IdP

ClientFe ->>+ IdP: client_id, refresh_token
note right of IdP: POST /oauth/token

IdP ->>- ClientFe: access token, refresh token, (id token)
```

- Client Credential flow

Client를 만들면, 같이 나오는 client의 id와 secret을 이용해서, client가 user의 정보를 가져올 수 있도록 합니다.

```mermaid
sequenceDiagram
participant Client
participant IdP

Client ->>+ IdP: client_id, client_secret, scope
note right of IdP: POST /oauth/token

IdP ->>- Client: access token, refresh token

opt if client want to get userinfo
  Client ->>+ IdP: access token, user id
  note right of IdP: POST /oauth/userinfo
  IdP ->>- Client: userinfo
end
```

## API DOCS

API DOCS는 swagger로 구현되어있으며, 각 문서는 아래의 페이지에서 확인할 수 있습니다.

Production: <https://api.idp.gistory.me/api>  
Staging: <https://api.stg.idp.gistory.me/api>

## Database Structure

Database structure는 [mermaid](https://mermaid.js.org/)로 구현되었으며, 문서는 아래의 링크에서 확인할 수 있습니다.

[ERD 링크](./docs/erd.md)